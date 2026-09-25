import { HttpStatus, Injectable, Logger } from "@nestjs/common";
import type { NexusConversation, NexusTask } from "@prisma/client";

import { PrismaService } from "../../database/prisma.service";
import { AppError } from "../../common/errors/app-error";
import { ErrorCode } from "../../common/errors/error-codes";
import { AuditService } from "../audit/audit.service";
import { AiProviderService, type ChatMessage } from "./ai-provider.service";

export interface ExtractedTask {
  title: string;
  assignee?: string;
  dueDate?: string;
  priority?: "URGENT" | "HIGH" | "MEDIUM" | "LOW";
}

@Injectable()
export class NexusService {
  private readonly logger = new Logger(NexusService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly ai: AiProviderService,
    private readonly audit: AuditService,
  ) {}

  // ---------------- Summarization ----------------

  async summarizeConversation(
    organizationId: string,
    userId: string,
    channelId: string,
    messageLimit = 50,
  ): Promise<NexusTask> {
    const messages = await this.prisma.message.findMany({
      where: { organizationId, channelId, deletedAt: null },
      orderBy: { createdAt: "desc" },
      take: Math.min(messageLimit, 200),
      include: { author: { select: { name: true } } },
    });

    if (messages.length === 0) {
      throw new AppError(ErrorCode.NOTHING_TO_SUMMARIZE, "No messages to summarize", HttpStatus.BAD_REQUEST);
    }

    const transcript = messages
      .reverse()
      .map((message) => `${message.author.name}: ${message.content}`)
      .join("\n");

    return this.runTask(
      organizationId,
      userId,
      "SUMMARIZE_CONVERSATION",
      { channelId, messageCount: messages.length },
      [
        {
          role: "system",
          content:
            "You are a concise assistant. Summarize the chat transcript into: (1) a 2-3 sentence summary, (2) key decisions, (3) action items. Be brief.",
        },
        { role: "user", content: transcript },
      ],
      "Channel",
      channelId,
    );
  }

  async summarizePage(organizationId: string, userId: string, pageId: string): Promise<NexusTask> {
    const page = await this.prisma.atlasPage.findFirst({
      where: { id: pageId, organizationId, deletedAt: null },
    });
    if (!page) {
      throw new AppError(ErrorCode.PAGE_NOT_FOUND, "Page not found", HttpStatus.NOT_FOUND);
    }
    if (!page.content.trim()) {
      throw new AppError(ErrorCode.NOTHING_TO_SUMMARIZE, "Page has no content", HttpStatus.BAD_REQUEST);
    }

    return this.runTask(
      organizationId,
      userId,
      "SUMMARIZE_PAGE",
      { pageId },
      [
        { role: "system", content: "Summarize this document into a short summary and key points." },
        { role: "user", content: `Title: ${page.title}\n\n${page.content}` },
      ],
      "AtlasPage",
      pageId,
    );
  }

  // ---------------- Task extraction ----------------

  async extractTasks(organizationId: string, userId: string, text: string): Promise<ExtractedTask[]> {
    const completion = await this.ai.chat([
      {
        role: "system",
        content:
          "Extract action items from the text. Return ONLY a JSON array of objects with keys: title (string), and optional assignee, dueDate (ISO date), priority (URGENT|HIGH|MEDIUM|LOW). No prose, no code fences.",
      },
      { role: "user", content: text },
    ]);

    const tasks = this.parseTasks(completion.content);

    await this.audit.record({
      action: "nexus.tasks.extracted",
      organizationId,
      actorUserId: userId,
      resourceType: "NexusTask",
      metadata: { count: tasks.length },
    });
    return tasks;
  }

  // ---------------- Conversational ask ----------------

  async ask(
    organizationId: string,
    userId: string,
    question: string,
    conversationId?: string,
  ): Promise<{ conversationId: string; answer: string }> {
    const conversation = conversationId
      ? await this.getOwnedConversation(organizationId, userId, conversationId)
      : await this.prisma.nexusConversation.create({
          data: {
            organizationId,
            userId,
            title: question.slice(0, 80),
          },
        });

    const history = await this.prisma.nexusMessage.findMany({
      where: { conversationId: conversation.id },
      orderBy: { createdAt: "asc" },
      take: 40,
    });

    const messages: ChatMessage[] = [
      {
        role: "system",
        content:
          "You are Nexus, the Dhriti workspace assistant. Answer concisely using only the conversation context provided. If you don't know, say so.",
      },
      ...history.map((message) => ({
        role: message.role === "assistant" ? ("assistant" as const) : ("user" as const),
        content: message.content,
      })),
      { role: "user", content: question },
    ];

    const completion = await this.ai.chat(messages);

    await this.prisma.$transaction([
      this.prisma.nexusMessage.create({
        data: { conversationId: conversation.id, role: "user", content: question },
      }),
      this.prisma.nexusMessage.create({
        data: {
          conversationId: conversation.id,
          role: "assistant",
          content: completion.content,
          tokens: completion.tokens,
        },
      }),
    ]);

    return { conversationId: conversation.id, answer: completion.content };
  }

  async listConversations(organizationId: string, userId: string): Promise<NexusConversation[]> {
    return this.prisma.nexusConversation.findMany({
      where: { organizationId, userId },
      orderBy: { updatedAt: "desc" },
      take: 50,
    });
  }

  async listTasks(organizationId: string, userId: string): Promise<NexusTask[]> {
    return this.prisma.nexusTask.findMany({
      where: { organizationId, requestedById: userId },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
  }

  // ---------------- Internals ----------------

  private async runTask(
    organizationId: string,
    userId: string,
    type: NexusTask["type"],
    input: Record<string, unknown>,
    messages: ChatMessage[],
    sourceType: string,
    sourceId: string,
  ): Promise<NexusTask> {
    const task = await this.prisma.nexusTask.create({
      data: {
        organizationId,
        requestedById: userId,
        type,
        status: "RUNNING",
        input: input as never,
        sourceType,
        sourceId,
        startedAt: new Date(),
      },
    });

    try {
      const completion = await this.ai.chat(messages);
      const updated = await this.prisma.nexusTask.update({
        where: { id: task.id },
        data: {
          status: "COMPLETED",
          result: { content: completion.content, tokens: completion.tokens } as never,
          completedAt: new Date(),
        },
      });

      await this.audit.record({
        action: `nexus.${type.toLowerCase()}`,
        organizationId,
        actorUserId: userId,
        resourceType: "NexusTask",
        resourceId: task.id,
      });
      return updated;
    } catch (error) {
      this.logger.error(`Nexus task ${task.id} failed`, error instanceof Error ? error.stack : String(error));
      return this.prisma.nexusTask.update({
        where: { id: task.id },
        data: {
          status: "FAILED",
          error: error instanceof Error ? error.message : "Unknown error",
          completedAt: new Date(),
        },
      });
    }
  }

  private async getOwnedConversation(
    organizationId: string,
    userId: string,
    conversationId: string,
  ): Promise<NexusConversation> {
    const conversation = await this.prisma.nexusConversation.findFirst({
      where: { id: conversationId, organizationId, userId },
    });
    if (!conversation) {
      throw new AppError(ErrorCode.CONVERSATION_NOT_FOUND, "Conversation not found", HttpStatus.NOT_FOUND);
    }
    return conversation;
  }

  private parseTasks(content: string): ExtractedTask[] {
    const cleaned = content.replace(/```(?:json)?/g, "").trim();
    try {
      const parsed = JSON.parse(cleaned) as unknown;
      if (!Array.isArray(parsed)) {
        return [];
      }
      return parsed
        .filter((item): item is Record<string, unknown> => typeof item === "object" && item !== null)
        .map((item) => ({
          title: String(item.title ?? "").slice(0, 250),
          ...(typeof item.assignee === "string" ? { assignee: item.assignee } : {}),
          ...(typeof item.dueDate === "string" ? { dueDate: item.dueDate } : {}),
          ...(typeof item.priority === "string"
            ? { priority: item.priority.toUpperCase() as ExtractedTask["priority"] }
            : {}),
        }))
        .filter((task) => task.title.length > 0);
    } catch {
      // Fallback: one task per non-empty line.
      return cleaned
        .split("\n")
        .map((line) => line.replace(/^[-*\d.]\s*/, "").trim())
        .filter((line) => line.length > 0)
        .map((title) => ({ title: title.slice(0, 250) }));
    }
  }
}
