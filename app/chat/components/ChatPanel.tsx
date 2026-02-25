"use client";

import { ArrowLeft } from "lucide-react";
import type { RefObject, UIEvent } from "react";
import type { Id } from "../../../convex/_generated/dataModel";
import type { ConvDoc, MessageUi, UserDoc } from "../lib/types";
import { formatTimestamp } from "../lib/utils";

type ChatPanelProps = {
  showMobileList: boolean;
  selectedConversation: ConvDoc | null;
  me: UserDoc | null;
  otherUser: UserDoc | null;
  conversationTitle: (conversation: ConvDoc) => string;
  conversationSubtitle: (conversation: ConvDoc) => string;
  typingText: string;
  onBack: () => void;
  listRef: RefObject<HTMLDivElement | null>;
  onListScroll: (event: UIEvent<HTMLDivElement>) => void;
  messages: MessageUi[] | undefined;
  isLoadingMessages: boolean;
  showNewMessages: boolean;
  onScrollToLatest: () => void;
  sendError: string | null;
  messageText: string;
  onType: (value: string) => void;
  onInputBlur: () => void;
  onSend: () => void;
  isSending: boolean;
  conversationId: Id<"conversations"> | null;
};

export function ChatPanel({
  showMobileList,
  selectedConversation,
  me,
  otherUser,
  conversationTitle,
  conversationSubtitle,
  typingText,
  onBack,
  listRef,
  onListScroll,
  messages,
  isLoadingMessages,
  showNewMessages,
  onScrollToLatest,
  sendError,
  messageText,
  onType,
  onInputBlur,
  onSend,
  isSending,
  conversationId,
}: ChatPanelProps) {
  return (
    <main
      className={`${!showMobileList ? "flex" : "hidden"} h-full min-h-0 flex-col bg-[radial-gradient(120%_90%_at_50%_0%,rgba(67,94,117,0.18),rgba(7,12,18,0)_60%),linear-gradient(180deg,rgba(17,28,37,0.72)_0%,rgba(8,14,20,0.92)_100%)] md:flex`}
    >
      {!selectedConversation || !me ? (
        <div className="flex h-full items-center justify-center px-8 text-center text-[#8696a0]">
          <p>Select a conversation or user to start chatting.</p>
        </div>
      ) : (
        <>
          <header className="flex items-center border-b border-white/10 bg-[#1a252d]/70 px-4 py-2.5 text-white backdrop-blur-xl md:px-5">
            <button
              onClick={onBack}
              className="mr-3 rounded-full p-2 text-[#d1d7db] hover:bg-white/10 md:hidden"
              aria-label="Back"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>

            <img
              src={otherUser?.image || ""}
              alt={otherUser?.name || "User"}
              className="mr-3 h-10 w-10 rounded-full object-cover"
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-lg font-semibold text-[#e9edef]">
                {conversationTitle(selectedConversation)}
              </p>
              {!typingText ? (
                <p className="truncate text-xs text-[#9bb5c3]">
                  {conversationSubtitle(selectedConversation)}
                </p>
              ) : (
                <div className="flex items-center gap-2 text-xs text-[#9bb5c3]">
                  <span className="truncate">{typingText.replace(/\.\.\.$/, "")}</span>
                  <span className="flex items-end gap-1">
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-gray-400 [animation-delay:-0.2s]" />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-gray-400 [animation-delay:-0.1s]" />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-gray-400" />
                  </span>
                </div>
              )}
            </div>
          </header>

          <div
            ref={listRef}
            onScroll={onListScroll}
            className="relative min-h-0 flex-1 overflow-y-auto bg-[#0b141a] bg-[radial-gradient(circle_at_1px_1px,_rgba(255,255,255,0.04)_1px,_transparent_0)] [background-size:20px_20px] px-4 py-4"
          >
            <div className="mx-auto flex max-w-3xl flex-col gap-2">
              {isLoadingMessages && (
                <div className="space-y-2">
                  {Array.from({ length: 8 }).map((_, index) => (
                    <div
                      key={index}
                      className={`flex ${index % 2 === 0 ? "justify-start" : "justify-end"}`}
                    >
                      <div className="h-14 w-48 animate-pulse rounded-xl bg-white/70" />
                    </div>
                  ))}
                </div>
              )}

              {messages && messages.length === 0 && (
                <div className="mt-8 rounded-xl bg-white/80 px-4 py-3 text-center text-sm text-gray-600">
                  No messages yet. Say hello to start this conversation.
                </div>
              )}

              {messages?.map((message) => {
                const isMine = message.senderId === me._id;
                return (
                  <div
                    key={message._id}
                    className={`flex ${isMine ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[82%] rounded-2xl border px-3.5 py-2.5 text-sm shadow-[0_10px_28px_rgba(0,0,0,0.28)] md:max-w-[62%] ${
                        isMine
                          ? "border-[#1f6f62]/80 bg-[linear-gradient(145deg,rgba(0,112,92,0.92),rgba(0,88,75,0.94))]"
                          : "border-[#2a3942]/80 bg-[linear-gradient(145deg,rgba(34,47,57,0.9),rgba(26,37,46,0.92))]"
                      }`}
                    >
                      <p className="break-words text-[#e9edef]">{message.content}</p>
                      <p className="mt-1 text-right text-[11px] text-[#aebac1]">
                        {formatTimestamp(message.createdAt)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {showNewMessages && (
            <button
              onClick={onScrollToLatest}
              className="mx-auto -mt-14 mb-2 rounded-full bg-[#25d366] px-4 py-2 text-sm font-medium text-white shadow-md"
            >
              {"\u2193 New messages"}
            </button>
          )}

          <footer className="border-t border-[#1f2c34] bg-[#202c33] p-3">
            {sendError && <p className="mb-2 text-center text-xs text-red-400">{sendError}</p>}
            <div className="mx-auto flex w-full max-w-3xl min-w-0 items-center gap-2">
              <input
                value={messageText}
                onChange={(event) => onType(event.target.value)}
                onBlur={onInputBlur}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    onSend();
                  }
                }}
                placeholder="Type a message"
                className="min-w-0 flex-1 rounded-full border border-[#2b3942] bg-[#111b21] px-4 py-2 text-sm text-[#d1d7db] outline-none focus:border-[#00a884]"
              />
              <button
                onClick={onSend}
                disabled={!conversationId || isSending || !messageText.trim()}
                className="shrink-0 rounded-full bg-[#128c7e] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-green-600 disabled:cursor-not-allowed disabled:bg-[#2f655d]"
              >
                {isSending ? "Sending..." : "Send"}
              </button>
            </div>
          </footer>
        </>
      )}
    </main>
  );
}
