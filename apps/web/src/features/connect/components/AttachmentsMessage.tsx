import React from "react";
import type { ConversationAttachment, ConnectConversationMessage } from "@/types/connect.types";

interface AttachmentsMessageProps {
  message: ConnectConversationMessage;
  openAttachmentMenu: (event: React.MouseEvent<HTMLElement>, attachment: ConversationAttachment) => void;
}

export function AttachmentsMessage({ message, openAttachmentMenu }: AttachmentsMessageProps) {
  function getFileExtension(name: string) {
    const parts = name.split(".");
    return parts.length > 1 ? parts[parts.length - 1].toUpperCase() : "";
  }
  return (
    <div className={`space-y-2 ${message.content ? "mt-1.5" : ""}`}>
      {message?.attachments?.map((attachment) => {
        const isImage = attachment.type?.startsWith("image/");
        const isVideo = attachment.type?.startsWith("video/");

        return (
          <div
            key={attachment.id}
            className="flex max-w-[380px] items-center gap-1.5 rounded border border-slate-200 bg-white p-1.5"
          >
            <div className="relative grid h-[200px] w-[300px] shrink-0 place-items-center overflow-hidden rounded border border-slate-200 bg-slate-50 text-sky-600">
              {isImage ? (
                <img
                  src={attachment.url}
                  alt={attachment.name}
                  className="h-full w-full object-cover"
                />
              ) : isVideo ? (
                <>
                  <video
                    src={attachment.url}
                    muted
                    preload="metadata"
                    className="h-full w-full object-cover"
                  />
                  <PlayIcon className="absolute h-[22px] w-[22px] text-white" />
                </>
              ) : (
                <div className="flex items-center justify-center">
                  <FileIcon className="h-[18px] w-[18px]" />
                  <span className="ml-1 text-[10px] font-semibold uppercase">
                    {getFileExtension(attachment.name)}
                  </span>
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1 text-left" />
            <button
              type="button"
              aria-label={`More options for ${attachment.name}`}
              onClick={(event) => openAttachmentMenu(event, attachment)}
              className="grid h-8 w-8 shrink-0 place-items-center rounded text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            >
              <MoreIcon className="h-[22px] w-[22px]" />
            </button>
          </div>
        );
      })}
    </div>
  );
}

function MoreIcon({ className }: { className?: string }) {
  return (
    <svg aria-hidden="true" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <circle cx="12" cy="5" r="1" fill="currentColor" />
      <circle cx="12" cy="12" r="1" fill="currentColor" />
      <circle cx="12" cy="19" r="1" fill="currentColor" />
    </svg>
  );
}

function PlayIcon({ className }: { className?: string }) {
  return (
    <svg aria-hidden="true" className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="m8 5 11 7-11 7z" />
    </svg>
  );
}

function FileIcon({ className }: { className?: string }) {
  return (
    <svg aria-hidden="true" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6" />
    </svg>
  );
}
