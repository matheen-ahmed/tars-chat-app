"use client";

import { Check, CheckCheck, ChevronDown, Pin, Star } from "lucide-react";
import type { Id } from "../../../convex/_generated/dataModel";
import { REACTIONS, formatTimestamp } from "./utils";
import type { ConvDoc, MessageDoc, MessageUi, UserDoc } from "./types";
import { MessageMenu } from "./MessageMenu";

type MessageItemProps = {
  message: MessageUi;
  me: UserDoc;
  selectedConversation: ConvDoc;
  usersById: Map<string, UserDoc>;
  messagesById: Map<string, MessageDoc>;
  menuMsgId: Id<"messages"> | null;
  onToggleMenu: (id: Id<"messages"> | null) => void;
  selectMode: boolean;
  isSelected: boolean;
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
  onDeleteForMe: (messageId: Id<"messages">) => Promise<void>;
  onDeleteForEveryone: (messageId: Id<"messages">) => Promise<void>;
  onOpenImagePreview: (url: string, name: string) => void;
};

export function MessageItem({
  message,
  me,
  selectedConversation,
  usersById,
  messagesById,
  menuMsgId,
  onToggleMenu,
  selectMode,
  isSelected,
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
  onDeleteForMe,
  onDeleteForEveryone,
  onOpenImagePreview,
}: MessageItemProps) {
  const mine = message.senderId === me._id;
  const deleted = message.deletedForEveryone;
  const senderName = mine ? "You" : usersById.get(String(message.senderId))?.name || "Unknown";
  const otherParticipants = selectedConversation.participants.filter(
    (participant) => participant !== me._id
  );
  const seenByAllOthers =
    otherParticipants.length > 0 &&
    otherParticipants.every((participantId) => message.seenBy.includes(participantId));

  const myReaction = message.reactions?.find((reaction) => reaction.userId === me._id)?.emoji;
  const emojiSet = new Set((message.reactions || []).map((reaction) => reaction.emoji));
  const visibleReactions = REACTIONS.filter((emoji) => emojiSet.has(emoji));
  const replyMessageContent = message.replyTo
    ? messagesById.get(String(message.replyTo))?.content
    : null;

  const isPinned = (message.pinnedBy || []).includes(me._id);
  const isStarred = (message.starredBy || []).includes(me._id);

  return (
    <div
      onClick={() => onToggleSelectedMessage(message._id)}
      className={`flex ${mine ? "justify-end" : "justify-start"} ${selectMode ? "cursor-pointer" : ""}`}
    >
      <div className="relative max-w-[82%] md:max-w-[62%]">
        <div
          className={`rounded-2xl border px-3 py-2 shadow-sm ${mine ? "border-[#1f6f62] bg-[#005c4b]" : "border-[#2a3942] bg-[#202c33]"} ${isSelected ? "ring-2 ring-[#34b7f1]" : ""}`}
        >
          {!deleted && (
            <button
              onClick={(event) => {
                event.stopPropagation();
                onToggleMenu(menuMsgId === message._id ? null : message._id);
              }}
              className="absolute right-1 top-1 rounded-full border border-transparent p-1 text-gray-500 transition hover:border-gray-300 hover:bg-black/5"
            >
              <ChevronDown className="h-3.5 w-3.5" />
            </button>
          )}

          {selectedConversation.isGroup && (
            <div className="mb-2 flex items-center justify-between rounded-md bg-[#0a7c66] px-2 py-1">
              <p className="text-[11px] font-bold tracking-wide text-[#dcf8c6]">{senderName}</p>
              <ChevronDown className="h-3 w-3 text-[#dcf8c6]" />
            </div>
          )}

          {message.forwarded && <p className="mb-1 text-[11px] italic text-[#aebac1]">Forwarded</p>}

          {replyMessageContent && (
            <div className="mb-2 rounded border-l-2 border-[#00a884] bg-black/20 px-2 py-1 text-xs text-[#c7d0d6]">
              {replyMessageContent}
            </div>
          )}

          {!deleted &&
            message.attachment?.url &&
            message.attachment.mimeType.startsWith("image/") && (
              <button
                onClick={(event) => {
                  event.stopPropagation();
                  onOpenImagePreview(message.attachment?.url || "", message.attachment?.fileName || "Image");
                }}
                className="mb-2 block w-full overflow-hidden rounded-lg border border-black/10 text-left"
              >
                <img src={message.attachment.url} alt={message.attachment.fileName} className="max-h-80 w-full object-cover" />
              </button>
            )}

          {!deleted &&
            message.attachment?.url &&
            !message.attachment.mimeType.startsWith("image/") && (
              <a
                href={message.attachment.url}
                target="_blank"
                rel="noreferrer"
                className="mb-2 flex items-center gap-2 rounded-lg border border-[#385366] bg-[#1a2a34] px-3 py-2 text-xs text-[#d1d7db] transition-colors hover:bg-[#223543]"
              >
                <span className="text-base" aria-hidden>{"\u{1F4CE}"}</span>
                <span className="truncate hover:underline">{message.attachment.fileName}</span>
              </a>
            )}

          {(deleted || message.content.trim()) && (
            <p className={`break-words pr-5 text-sm text-[#e9edef] ${deleted ? "italic text-[#aebac1]" : ""}`}>
              {deleted ? "This message was deleted" : message.content}
            </p>
          )}

          <div className="mt-1 flex items-center justify-end gap-1 text-[11px] text-[#aebac1]">
            {isPinned && <Pin className="h-3.5 w-3.5" />}
            {isStarred && <Star className="h-3.5 w-3.5" />}
            <span>{formatTimestamp(message.createdAt)}</span>
            {mine &&
              (seenByAllOthers ? (
                <CheckCheck className="h-3.5 w-3.5 text-[#34b7f1]" />
              ) : (
                <Check className="h-3.5 w-3.5 text-[#aebac1]" />
              ))}
          </div>
        </div>

        {menuMsgId === message._id && !deleted && (
          <MessageMenu
            mine={mine}
            messageId={message._id}
            content={message.content}
            myReaction={myReaction}
            isPinned={isPinned}
            isStarred={isStarred}
            meId={me._id}
            pinnedBy={message.pinnedBy}
            starredBy={message.starredBy}
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
            onDeleteForMe={onDeleteForMe}
            onDeleteForEveryone={onDeleteForEveryone}
          />
        )}

        {visibleReactions.length > 0 && (
          <div className={`mt-1 flex flex-wrap gap-1 ${mine ? "justify-end" : "justify-start"}`}>
            {visibleReactions.map((emoji) => (
              <span
                key={emoji}
                className="inline-flex items-center rounded-full border border-[#2a3942] bg-[#202c33] px-2 py-0.5 text-[11px] font-medium text-[#d1d7db] shadow-sm"
              >
                {emoji}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}


