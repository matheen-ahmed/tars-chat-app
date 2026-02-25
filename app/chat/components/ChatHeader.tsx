"use client";

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
    <header className="flex items-center border-b border-[#1f2c34] bg-[#202c33] px-4 py-2 text-white">
      <button onClick={onBack} className="mr-2 rounded-md px-2 py-1 text-sm md:hidden">
        Back
      </button>
      {selectedIsGroup ? (
        <div className="mr-3 flex h-10 w-10 items-center justify-center rounded-full bg-[#128c7e] text-sm font-semibold">
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
          className="mr-3 rounded-full"
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
            className="rounded-md border border-[#2b3942] px-2 py-1 text-xs text-[#d1d7db] hover:bg-[#2a3942]"
          >
            Rename
          </button>
          <button
            onClick={() => void onDeleteGroup()}
            className="rounded-md border border-red-700/60 px-2 py-1 text-xs text-red-300 hover:bg-red-900/20"
          >
            Delete
          </button>
        </div>
      )}
    </header>
  );
}

