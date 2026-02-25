"use client";

import {
  CheckSquare,
  Copy,
  Forward,
  Info,
  Pencil,
  Pin,
  Plus,
  Reply,
  Star,
  Trash2,
} from "lucide-react";
import type { Id } from "../../../convex/_generated/dataModel";
import { REACTIONS } from "../lib/utils";

type MessageMenuProps = {
  mine: boolean;
  messageId: Id<"messages">;
  content: string;
  myReaction?: string;
  isPinned: boolean;
  isStarred: boolean;
  meId: Id<"users">;
  pinnedBy?: Id<"users">[];
  starredBy?: Id<"users">[];
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
};

export function MessageMenu({
  mine,
  messageId,
  content,
  myReaction,
  isPinned,
  isStarred,
  meId,
  pinnedBy,
  starredBy,
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
}: MessageMenuProps) {
  return (
    <div
      onClick={(event) => event.stopPropagation()}
      className={`absolute z-20 mt-1 w-72 overflow-hidden rounded-2xl border border-[#2f2f2f] bg-[#181b1f] text-[#e6e6e6] shadow-2xl ${
        mine ? "right-0" : "left-0"
      }`}
    >
      <div className="flex items-center gap-1 border-b border-[#343434] px-3 py-2">
        {REACTIONS.map((emoji) => (
          <button
            key={emoji}
            onClick={() => void onReact(messageId, emoji)}
            className={`rounded-full px-2 py-1 text-lg transition ${
              myReaction === emoji ? "bg-[#23463e]" : "hover:bg-[#2b2b2b]"
            }`}
          >
            {emoji}
          </button>
        ))}
        <button
          onClick={() => void onAddMoreReaction(messageId)}
          className="ml-auto rounded-full bg-[#2e3238] p-1.5 text-gray-200 hover:bg-[#3b4048]"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>

      <div className="py-1 text-sm">
        <button
          onClick={() => onOpenInfo(messageId)}
          className="flex w-full items-center gap-3 px-3 py-2 text-left hover:bg-[#252a30]"
        >
          <Info className="h-4 w-4 text-[#a9b0b8]" />
          <span>Message info</span>
        </button>
        <button
          onClick={() => onStartReply(messageId)}
          className="flex w-full items-center gap-3 px-3 py-2 text-left hover:bg-[#252a30]"
        >
          <Reply className="h-4 w-4 text-[#a9b0b8]" />
          <span>Reply</span>
        </button>
        <button
          onClick={() => void onCopyMessage(content)}
          className="flex w-full items-center gap-3 px-3 py-2 text-left hover:bg-[#252a30]"
        >
          <Copy className="h-4 w-4 text-[#a9b0b8]" />
          <span>Copy</span>
        </button>
        <button
          onClick={() => onOpenForward(messageId)}
          className="flex w-full items-center gap-3 px-3 py-2 text-left hover:bg-[#252a30]"
        >
          <Forward className="h-4 w-4 text-[#a9b0b8]" />
          <span>Forward</span>
        </button>
        <button
          onClick={() => void onTogglePin(messageId)}
          className="flex w-full items-center gap-3 px-3 py-2 text-left hover:bg-[#252a30]"
        >
          <Pin className="h-4 w-4 text-[#a9b0b8]" />
          <span>{(pinnedBy || []).includes(meId) || isPinned ? "Unpin" : "Pin"}</span>
        </button>
        <button
          onClick={() => void onToggleStar(messageId)}
          className="flex w-full items-center gap-3 px-3 py-2 text-left hover:bg-[#252a30]"
        >
          <Star className="h-4 w-4 text-[#a9b0b8]" />
          <span>{(starredBy || []).includes(meId) || isStarred ? "Unstar" : "Star"}</span>
        </button>

        <div className="my-1 border-t border-[#2a2f36]" />

        {mine && (
          <button
            onClick={() => onStartEdit(messageId, content)}
            className="flex w-full items-center gap-3 px-3 py-2 text-left hover:bg-[#252a30]"
          >
            <Pencil className="h-4 w-4 text-[#a9b0b8]" />
            <span>Edit message</span>
          </button>
        )}
        <button
          onClick={() => onToggleSelectMode(messageId)}
          className="flex w-full items-center gap-3 px-3 py-2 text-left hover:bg-[#252a30]"
        >
          <CheckSquare className="h-4 w-4 text-[#a9b0b8]" />
          <span>Select</span>
        </button>

        <div className="my-1 border-t border-[#2a2f36]" />

        <button
          onClick={() => void onDeleteForMe(messageId)}
          className="flex w-full items-center gap-3 px-3 py-2 text-left hover:bg-[#252a30]"
        >
          <Trash2 className="h-4 w-4 text-[#a9b0b8]" />
          <span>Delete for me</span>
        </button>
        {mine && (
          <button
            onClick={() => void onDeleteForEveryone(messageId)}
            className="flex w-full items-center gap-3 border-t border-[#2a2f36] px-3 py-2 text-left text-red-300 hover:bg-[#2a2020]"
          >
            <Trash2 className="h-4 w-4" />
            <span>Delete for everyone</span>
          </button>
        )}
      </div>
    </div>
  );
}

