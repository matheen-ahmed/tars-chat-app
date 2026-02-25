"use client";

import type { ChangeEvent, RefObject } from "react";
import { PlusCircle, X } from "lucide-react";
import type { Id } from "../../../convex/_generated/dataModel";
import type { MessageDoc } from "../lib/types";

type MessageInputProps = {
  selectMode: boolean;
  selectedMessageIds: Id<"messages">[];
  onCopySelectedMessages: () => Promise<void>;
  onCancelSelectMode: () => void;
  actionErr: string | null;
  sendErr: boolean;
  sendRetry: { text: string; cid: Id<"conversations"> } | null;
  onRetrySend: (retry: { text: string; cid: Id<"conversations"> }) => Promise<void>;
  onDismissSendError: () => void;
  replyMessage: MessageDoc | null;
  onClearReply: () => void;
  editingMessageId: Id<"messages"> | null;
  onCancelEdit: () => void;
  fileInputRef: RefObject<HTMLInputElement | null>;
  onPickFile: (event: ChangeEvent<HTMLInputElement>) => void;
  text: string;
  onType: (value: string) => void;
  onSend: () => Promise<void>;
  sending: boolean;
};

export function MessageInput({
  selectMode,
  selectedMessageIds,
  onCopySelectedMessages,
  onCancelSelectMode,
  actionErr,
  sendErr,
  sendRetry,
  onRetrySend,
  onDismissSendError,
  replyMessage,
  onClearReply,
  editingMessageId,
  onCancelEdit,
  fileInputRef,
  onPickFile,
  text,
  onType,
  onSend,
  sending,
}: MessageInputProps) {
  return (
    <footer className="border-t border-[#1f2c34] bg-[#202c33] p-3">
      {selectMode && (
        <div className="mb-2 flex items-center justify-between rounded-md bg-[#d8efe2] px-3 py-2 text-xs">
          <span>{selectedMessageIds.length} selected</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => void onCopySelectedMessages()}
              className="font-semibold text-[#075e54]"
            >
              Copy
            </button>
            <button
              onClick={onCancelSelectMode}
              className="font-semibold text-[#075e54]"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {actionErr && <p className="mb-2 text-center text-xs text-red-500">{actionErr}</p>}

      {sendErr && (
        <div className="mb-2 flex flex-wrap items-center justify-center gap-2 text-xs text-red-500">
          <span>Failed to send message.</span>
          {sendRetry && (
            <button
              onClick={() => void onRetrySend(sendRetry)}
              className="rounded bg-red-500 px-2 py-1 font-semibold text-white"
            >
              Retry
            </button>
          )}
          <button
            onClick={onDismissSendError}
            className="rounded border border-red-300 px-2 py-1 text-red-500"
          >
            Dismiss
          </button>
        </div>
      )}

      {replyMessage && (
        <div className="mb-2 flex items-center justify-between rounded-md border-l-2 border-[#00a884] bg-[#111b21] px-3 py-2 text-xs">
          <div className="min-w-0">
            <p className="font-semibold text-[#00a884]">Replying to message</p>
            <p className="truncate text-[#aebac1]">{replyMessage.content}</p>
          </div>
          <button onClick={onClearReply} className="ml-2 text-gray-500">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {editingMessageId && (
        <div className="mb-2 flex items-center justify-between rounded-md bg-[#d8efe2] px-3 py-2 text-xs">
          <span>Editing message</span>
          <button onClick={onCancelEdit} className="font-semibold text-[#075e54]">
            Cancel
          </button>
        </div>
      )}

      <div className="mx-auto flex w-full max-w-3xl min-w-0 items-center gap-2">
        <button
          onClick={() => fileInputRef.current?.click()}
          className="shrink-0 rounded-full bg-[#111b21] p-2 text-[#d1d7db] hover:text-white"
        >
          <PlusCircle className="h-5 w-5" />
        </button>
        <input ref={fileInputRef} type="file" onChange={onPickFile} className="hidden" />
        <input
          value={text}
          onChange={(event) => onType(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              void onSend();
            }
          }}
          placeholder="Type a message"
          className="min-w-0 flex-1 rounded-full border border-[#2b3942] bg-[#111b21] px-4 py-2 text-sm text-[#d1d7db] outline-none focus:border-[#00a884]"
        />
        <button
          onClick={() => void onSend()}
          disabled={sending || !text.trim()}
          className="shrink-0 rounded-full bg-[#128c7e] px-4 py-2 text-sm font-semibold text-white transition-transform transition-colors hover:scale-105 hover:bg-green-600 md:px-5 disabled:cursor-not-allowed disabled:bg-[#2f655d] disabled:hover:scale-100"
        >
          {sending ? "Sending..." : editingMessageId ? "Save" : "Send"}
        </button>
      </div>
    </footer>
  );
}

