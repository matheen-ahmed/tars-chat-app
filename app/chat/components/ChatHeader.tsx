"use client";

import { ArrowLeft } from "lucide-react";
import type { ConvDoc, ContactDrawerData, UserDoc } from "../lib/types";

type ChatHeaderProps = {
  selectedConversation: ConvDoc;
  selectedIsGroup: boolean;
  canManageGroup: boolean;
  me: UserDoc;
  usersById: Map<string, UserDoc>;
  title: (conversation: ConvDoc) => string;
  subtitle: (conversation: ConvDoc) => string;
  typingText: string;
  onBack: () => void;
  onOpenContactDrawer: (payload: ContactDrawerData) => void;
  onRenameGroup: () => Promise<void>;
  onDeleteGroup: () => Promise<void>;
};

export function ChatHeader({
  selectedConversation,
  selectedIsGroup,
  canManageGroup,
  me,
  usersById,
  title,
  subtitle,
  typingText,
  onBack,
  onOpenContactDrawer,
  onRenameGroup,
  onDeleteGroup,
}: ChatHeaderProps) {
  const otherUser = usersById.get(
    String(selectedConversation.participants.find((participant) => participant !== me._id))
  );
  const presenceText = subtitle(selectedConversation);
  const isOnline = presenceText === "Online";
  const isTyping = !!typingText;
  const typingLabel = typingText.replace(/\.\.\.$/, "");

  return (
    <header className="flex items-center border-b border-white/10 bg-[#1a252d]/70 px-4 py-2.5 text-white backdrop-blur-xl shadow-[0_8px_24px_rgba(0,0,0,0.28)] md:px-5">
      <button
        onClick={onBack}
        aria-label="Back"
        className="mr-3 rounded-full p-2 text-[#d1d7db] transition-colors duration-200 hover:bg-white/10 hover:text-white md:hidden"
      >
        <ArrowLeft className="h-5 w-5" />
      </button>
      {selectedIsGroup ? (
        <div className="mr-3 flex h-10 w-10 items-center justify-center rounded-full bg-[#128c7e] text-sm font-semibold shadow-md">
          {(selectedConversation.groupName || "G").slice(0, 2).toUpperCase()}
        </div>
      ) : (
        <button
          onClick={() => {
            if (!otherUser) return;
            onOpenContactDrawer({
              name: otherUser.name,
              image: otherUser.image,
              detail: otherUser.online ? "Online" : "Offline",
              canEdit: false,
            });
          }}
          className="mr-3 rounded-full ring-1 ring-white/10 transition duration-200 hover:ring-white/20"
        >
          <img
            src={otherUser?.image || ""}
            alt={title(selectedConversation)}
            className="h-10 w-10 rounded-full object-cover"
          />
        </button>
      )}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          {!selectedIsGroup && (
            <span
              className={`h-2 w-2 rounded-full ${isOnline ? "bg-[#128c7e]" : "bg-gray-500"}`}
            />
          )}
          <p className="truncate text-lg font-semibold text-[#e9edef]">{title(selectedConversation)}</p>
        </div>
        {!isTyping ? (
          <p className={`truncate text-xs ${presenceText === "Offline" ? "text-gray-400" : "text-[#9bb5c3]"}`}>
            {presenceText}
          </p>
        ) : (
          <div className="flex items-center gap-2 text-xs text-[#9bb5c3]">
            <span className="truncate">{typingLabel}</span>
            <span className="flex items-end gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-gray-400 animate-bounce [animation-delay:-0.2s]" />
              <span className="h-1.5 w-1.5 rounded-full bg-gray-400 animate-bounce [animation-delay:-0.1s]" />
              <span className="h-1.5 w-1.5 rounded-full bg-gray-400 animate-bounce" />
            </span>
          </div>
        )}
      </div>
      {selectedIsGroup && canManageGroup && (
        <div className="ml-3 flex items-center gap-2">
          <button
            onClick={() => void onRenameGroup()}
            className="rounded-md border border-white/15 bg-white/5 px-2.5 py-1 text-xs text-[#d1d7db] transition-colors duration-200 hover:bg-white/10"
          >
            Rename
          </button>
          <button
            onClick={() => void onDeleteGroup()}
            className="rounded-md border border-red-700/60 bg-red-900/10 px-2.5 py-1 text-xs text-red-300 transition-colors duration-200 hover:bg-red-900/25"
          >
            Delete
          </button>
        </div>
      )}
    </header>
  );
}

