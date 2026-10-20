import type { ConnectMessage } from "@/types/connect.types";

type SystemMessageProps = { message: ConnectMessage };

export const SystemMessage = ({ message }: SystemMessageProps) => (
  <div className="flex items-center justify-center py-0.5">
    <span className="rounded-full bg-slate-50 px-1.5 py-1 text-xs text-slate-500">{message.content}</span>
  </div>
);
