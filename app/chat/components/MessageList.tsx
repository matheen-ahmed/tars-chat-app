"use client";

import type { RefObject } from "react";
import type { Id } from "../../../convex/_generated/dataModel";
import type { ConvDoc, MessageDoc, MessageUi, UserDoc } from "../lib/types";
import { nearBottom } from "../lib/utils";
import { MessageItem } from "./MessageItem";

type MessageListProps = {
  listRef: RefObject<HTMLDivElement | null>;
  loadingMessages: boolean;
  messages?: MessageUi[];
  me: UserDoc;
  selectedConversation: ConvDoc;
  usersById: Map<string, UserDoc>;
  messagesById: Map<string, MessageDoc>;
  menuMsgId: Id<"messages"> | null;
  onToggleMenu: (id: Id<"messages"> | null) => void;
  selectMode: boolean;
  selectedMessageIds: Id<"messages">[];
  onToggleSelectedMessage: (id: Id<"messages">) => void;
  onReact: (messageId: Id<"messages">, emoji: string) => Promise<void>;
  onAddMoreReaction: (messageId: Id<"messages">) => Promise<void>;
  onOpenInfo: (messageId: Id<"messages">) => void;
  onStartReply: (messageId: Id<"messages">) => void;
  onCopyMessage: (content: string) => Promise<void>;
  onOpenForward: (messageId: Id<"messages">) => void;
  onTogglePin: (messageId: Id<"messages">) => Promise<void>;
  onToggleStar: (messageId: Id<"messages">) => Promise<void>;
  onStartEdit: (messageId: Id<"messages">, content: string) => void;
  onToggleSelectMode: (messageId: Id<"messages">) => void;
  onOpenImagePreview: (url: string, name: string) => void;
  onNearBottom: () => void;
};

export function MessageList({
  listRef,
  loadingMessages,
  messages,
  me,
  selectedConversation,
  usersById,
  messagesById,
  menuMsgId,
  onToggleMenu,
  selectMode,
  selectedMessageIds,
  onToggleSelectedMessage,
  onReact,
  onAddMoreReaction,
  onOpenInfo,
  onStartReply,
  onCopyMessage,
  onOpenForward,
  onTogglePin,
  onToggleStar,
  onStartEdit,
  onToggleSelectMode,
  onOpenImagePreview,
  onNearBottom,
}: MessageListProps) {
  return (
    <div
      ref={listRef}
      onScroll={(event) => nearBottom(event.currentTarget) && onNearBottom()}
      className="relative min-h-0 flex-1 overflow-y-auto bg-[#0b141a] bg-[radial-gradient(circle_at_1px_1px,_rgba(255,255,255,0.04)_1px,_transparent_0)] [background-size:20px_20px] px-4 py-4"
    >
      <div className="mx-auto flex max-w-3xl flex-col gap-2">
        {loadingMessages && (
          <div className="space-y-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className={`flex ${i % 2 === 0 ? "justify-start" : "justify-end"}`}>
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
          if (message.deletedFor.includes(me._id)) return null;

          return (
            <MessageItem
              key={message._id}
              message={message}
              me={me}
              selectedConversation={selectedConversation}
              usersById={usersById}
              messagesById={messagesById}
              menuMsgId={menuMsgId}
              onToggleMenu={onToggleMenu}
              selectMode={selectMode}
              isSelected={selectedMessageIds.includes(message._id)}
              onToggleSelectedMessage={onToggleSelectedMessage}
              onReact={onReact}
              onAddMoreReaction={onAddMoreReaction}
              onOpenInfo={onOpenInfo}
              onStartReply={onStartReply}
              onCopyMessage={onCopyMessage}
              onOpenForward={onOpenForward}
              onTogglePin={onTogglePin}
              onToggleStar={onToggleStar}
              onStartEdit={onStartEdit}
              onToggleSelectMode={onToggleSelectMode}
              onOpenImagePreview={onOpenImagePreview}
            />
          );
        })}
      </div>
    </div>
  );
}

