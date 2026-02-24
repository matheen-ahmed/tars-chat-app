"use client";

import type { Id } from "../../../convex/_generated/dataModel";
import type { ConvDoc, UserDoc } from "./types";
import { formatTimestamp } from "./utils";

type ConversationListProps = {
  activeTab: "chats" | "groups";
  loadingData: boolean;
  chatConversations: ConvDoc[];
  groupConversations: ConvDoc[];
  filteredUsers: UserDoc[];
  selectedConversationId: Id<"conversations"> | null;
  currentUserId?: Id<"users">;
  usersById: Map<string, UserDoc>;
  title: (conversation: ConvDoc) => string;
  subtitle: (conversation: ConvDoc) => string;
  isGroupConversation: (conversation: ConvDoc) => boolean;
  onOpenConversation: (id: Id<"conversations">) => void;
  onOpenUserChat: (user: UserDoc) => void;
};

export function ConversationList({
  activeTab,
  loadingData,
  chatConversations,
  groupConversations,
  filteredUsers,
  selectedConversationId,
  currentUserId,
  usersById,
  title,
  subtitle,
  isGroupConversation,
  onOpenConversation,
  onOpenUserChat,
}: ConversationListProps) {
  const visibleConversations =
    activeTab === "groups" ? groupConversations : chatConversations;

  return (
    <div className="min-h-0 flex-1 overflow-y-auto">
      <section className="border-b border-[#1f2c34]">
        <p className="px-4 pt-3 text-xs font-semibold uppercase tracking-wide text-[#8696a0]">
          {activeTab === "groups" ? "Groups" : "Chats"}
        </p>
        {loadingData && (
          <div className="space-y-2 p-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="flex animate-pulse items-center gap-3 rounded-lg bg-[#1f2c34] p-3"
              >
                <div className="h-10 w-10 rounded-full bg-[#2b3942]" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-2/3 rounded bg-[#2b3942]" />
                  <div className="h-2 w-1/2 rounded bg-[#24323a]" />
                </div>
              </div>
            ))}
          </div>
        )}
        {!loadingData &&
          visibleConversations.map((conversation) => {
            const conversationTitle = title(conversation);
            const conversationSubtitle = subtitle(conversation);
            const other = usersById.get(
              String(
                conversation.participants.find((participant) => participant !== currentUserId)
              )
            );

            return (
              <button
                key={conversation._id}
                onClick={() => onOpenConversation(conversation._id)}
                className={`flex w-full items-start gap-3 px-4 py-3 text-left transition-colors duration-150 hover:bg-[#253742] ${
                  selectedConversationId === conversation._id
                    ? "bg-[#2a3942]"
                    : "bg-[#111b21]"
                }`}
              >
                {isGroupConversation(conversation) ? (
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#00a884] text-sm font-semibold text-white">
                    {conversationTitle.slice(0, 2).toUpperCase()}
                  </div>
                ) : (
                  <div className="relative">
                    <img
                      src={other?.image || ""}
                      alt={conversationTitle}
                      className="h-11 w-11 rounded-full object-cover"
                    />
                    <span
                      className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-[#111b21] ${
                        other?.online ? "bg-green-500" : "bg-gray-400"
                      }`}
                    />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-sm font-semibold text-[#e9edef]">
                      {conversationTitle}
                    </p>
                    {!!conversation.lastMessageTime && (
                      <span className="shrink-0 text-xs text-[#8696a0]">
                        {formatTimestamp(conversation.lastMessageTime)}
                      </span>
                    )}
                  </div>
                  <div className="mt-1 flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-xs text-[#8696a0]">
                        {conversation.lastMessage?.trim()
                          ? conversation.lastMessage
                          : "No messages yet"}
                      </p>
                      <p
                        className={`truncate ${
                          conversationSubtitle === "Offline"
                            ? "text-xs text-gray-400"
                            : "text-[11px] text-[#6d7d86]"
                        }`}
                      >
                        {conversationSubtitle}
                      </p>
                    </div>
                    {conversation.unreadCount > 0 && (
                      <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-[#128c7e] px-2 py-0.5 text-xs font-extrabold text-[#102126]">
                        {conversation.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        {!loadingData && visibleConversations.length === 0 && (
          <p className="px-4 py-6 text-sm text-[#8696a0]">
            {activeTab === "groups" ? "No groups found." : "No chats found."}
          </p>
        )}
      </section>

      {activeTab === "chats" && (
        <section>
          <p className="px-4 pt-3 text-xs font-semibold uppercase tracking-wide text-[#8696a0]">
            All users
          </p>
          {!loadingData &&
            filteredUsers.map((user) => (
              <button
                key={user._id}
                onClick={() => onOpenUserChat(user)}
                className="flex w-full items-center gap-3 bg-[#111b21] px-4 py-3 text-left transition-colors duration-150 hover:bg-[#253742]"
              >
                <div className="relative">
                  <img
                    src={user.image}
                    alt={user.name}
                    className="h-10 w-10 rounded-full object-cover"
                  />
                  <span
                    className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-[#111b21] ${
                      user.online ? "bg-green-500" : "bg-gray-400"
                    }`}
                  />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-[#e9edef]">{user.name}</p>
                  <p className="truncate text-xs text-gray-400">
                    {user.online ? "Online" : "Offline"}
                  </p>
                </div>
              </button>
            ))}
        </section>
      )}
    </div>
  );
}
