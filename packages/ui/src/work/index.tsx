"use client";

import * as React from "react";
import { Avatar, Box, Card, CardContent, Chip, LinearProgress, Stack, Typography } from "@mui/material";

export type TaskStatusValue = "backlog" | "todo" | "inProgress" | "blocked" | "review" | "done";
export type TaskPriorityValue = "lowest" | "low" | "medium" | "high" | "critical";

export function TaskStatus({ status }: { status: TaskStatusValue }) {
  return <Chip size="small" label={status} color={status === "done" ? "success" : status === "blocked" ? "error" : "default"} />;
}

export function TaskPriority({ priority }: { priority: TaskPriorityValue }) {
  const color = priority === "critical" || priority === "high" ? "error" : priority === "medium" ? "warning" : "default";
  return <Chip size="small" label={priority} color={color} />;
}

export type TaskAssigneeProps = {
  name?: string;
};

export function TaskAssignee({ name }: TaskAssigneeProps) {
  return name ? <Chip size="small" avatar={<Avatar>{name[0]}</Avatar>} label={name} /> : <Chip size="small" label="Unassigned" />;
}

export type TaskCardProps = {
  title: string;
  status: TaskStatusValue;
  priority: TaskPriorityValue;
  assignee?: string;
};

export function TaskCard({ title, status, priority, assignee }: TaskCardProps) {
  return (
    <Card>
      <CardContent>
        <Stack spacing={1}>
          <Typography variant="subtitle1">{title}</Typography>
          <Stack direction="row" spacing={1}>
            <TaskStatus status={status} />
            <TaskPriority priority={priority} />
            <TaskAssignee name={assignee} />
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
}

export function ProjectCard({ name, progress }: { name: string; progress?: number }) {
  return (
    <Card>
      <CardContent>
        <Stack spacing={1.25}>
          <Typography variant="subtitle1">{name}</Typography>
          <LinearProgress variant="determinate" value={progress ?? 0} />
        </Stack>
      </CardContent>
    </Card>
  );
}

export function SprintCard({ name, velocity }: { name: string; velocity?: number }) {
  return (
    <Card>
      <CardContent>
        <Typography variant="subtitle1">{name}</Typography>
        <Typography variant="body2" color="text.secondary">Velocity: {velocity ?? 0}</Typography>
      </CardContent>
    </Card>
  );
}

export function KanbanCard({ title, meta }: { title: string; meta?: string }) {
  return (
    <Card>
      <CardContent>
        <Typography variant="body2">{title}</Typography>
        {meta ? <Typography variant="caption" color="text.secondary">{meta}</Typography> : null}
      </CardContent>
    </Card>
  );
}

export type KanbanColumnProps = {
  title: string;
  children?: React.ReactNode;
};

export function KanbanColumn({ title, children }: KanbanColumnProps) {
  return (
    <Box sx={{ minWidth: 280 }}>
      <Typography variant="subtitle2" sx={{ mb: 1 }}>{title}</Typography>
      <Stack spacing={1}>{children}</Stack>
    </Box>
  );
}

export function ActivityFeed({ items }: { items: string[] }) {
  return (
    <Stack spacing={1}>
      {items.map((item, index) => (
        <Typography key={`${item}-${index}`} variant="body2">• {item}</Typography>
      ))}
    </Stack>
  );
}
