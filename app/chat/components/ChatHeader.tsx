"use client";

import type { ConvDoc, ContactDrawerData, UserDoc } from "./types";

type ChatHeaderProps = {
  selectedConversation: ConvDoc;
  selectedIsGroup: boolean;
  me: UserDoc;
  usersById: Map<string, UserDoc>;
  title: (conversation: ConvDoc) => string;
  subtitle: (conversation: ConvDoc) => string;
  typingText: string;
  onBack: () => void;
  onOpenContactDrawer: (payload: ContactDrawerData) => void;
};

export function ChatHeader({
  selectedConversation,
  selectedIsGroup,
  me,
  usersById,
  title,
  subtitle,
  typingText,
  onBack,
  onOpenContactDrawer,
}: ChatHeaderProps) {
  const otherUser = usersById.get(
    String(selectedConversation.participants.find((participant) => participant !== me._id))
  );

  return (
    <header className="flex items-center border-b border-[#1f2c34] bg-[#202c33] px-4 py-3 text-white">
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
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-[#e9edef]">
          {title(selectedConversation)}
        </p>
        <p className="truncate text-xs text-[#8696a0]">
          {typingText || subtitle(selectedConversation)}
        </p>
      </div>
    </header>
  );
}
