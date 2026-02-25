"use client";

import { Search } from "lucide-react";
import { UserButton } from "@clerk/nextjs";
import Image from "next/image";
import { formatTimestamp } from "../lib/utils";
import type { ConvDoc, UserDoc } from "../lib/types";
import type { Id } from "../../../convex/_generated/dataModel";

type SidebarProps = {
  mobileList: boolean;
  me: UserDoc | null;
  syncingProfile: boolean;
  syncError: string | null;
  currentUserMissing: boolean;
  onRetrySync: () => void;
  search: string;
  onSearchChange: (value: string) => void;
  loadingData: boolean;
  conversations: ConvDoc[];
  filteredUsers: UserDoc[];
  selectedConversationId: Id<"conversations"> | null;
  usersById: Map<string, UserDoc>;
  conversationTitle: (conversation: ConvDoc) => string;
  conversationSubtitle: (conversation: ConvDoc) => string;
  onOpenConversation: (id: Id<"conversations">) => void;
  onOpenUserChat: (user: UserDoc) => void;
};

export function Sidebar({
  mobileList,
  me,
  syncingProfile,
  syncError,
  currentUserMissing,
  onRetrySync,
  search,
  onSearchChange,
  loadingData,
  conversations,
  filteredUsers,
  selectedConversationId,
  usersById,
  conversationTitle,
  conversationSubtitle,
  onOpenConversation,
  onOpenUserChat,
}: SidebarProps) {
  const hasSearch = search.trim().length > 0;

  return (
    <aside
      className={`${mobileList ? "flex" : "hidden"} h-full min-h-0 flex-col border-r border-white/10 bg-[#101820]/70 backdrop-blur-xl md:flex`}
    >
      <div className="flex items-center justify-between border-b border-white/10 bg-white/5 px-4 py-3.5 text-white shadow-[0_6px_20px_rgba(0,0,0,0.2)]">
        <div className="flex min-w-0 items-center gap-2">
          <Image
            src="/quickchat-mark.svg"
            alt="QuickChat"
            width={30}
            height={30}
            className="rounded-full bg-white"
          />
          <p className="truncate text-lg font-semibold">QuickChat</p>
        </div>
        <UserButton afterSignOutUrl="/" />
      </div>

      <div className="space-y-3 border-b border-white/10 bg-white/[0.03] px-4 py-4.5">
        <h2 className="text-4xl font-semibold tracking-tight text-white">Chats</h2>
        {me && (
          <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-black/20 px-3 py-2.5">
            <div className="relative">
              <img src={me.image} alt={me.name} className="h-10 w-10 rounded-full object-cover" />
              <span
                className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-[#111b21] ${
                  me.online ? "bg-green-500" : "bg-gray-400"
                }`}
              />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-[#e9edef]">{me.name}</p>
              <p className="truncate text-xs text-[#8696a0]">{me.email}</p>
            </div>
          </div>
        )}
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-[#8596a0]" />
          <input
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search chats or users"
            className="w-full rounded-full border border-white/15 bg-black/20 px-9 py-2.5 text-sm text-[#d1d7db] outline-none transition-colors duration-200 focus:border-[#3b82f6]"
          />
        </div>
        {(syncError || currentUserMissing) && (
          <div className="rounded-lg border border-white/10 bg-black/20 p-3 shadow-sm">
            <p className="text-xs text-[#d1d7db]">
              {syncError || "Setting up your profile. If this takes long, retry."}
            </p>
            <button
              onClick={onRetrySync}
              disabled={syncingProfile}
              className="mt-2 rounded-md bg-[#00a884] px-3 py-1 text-xs font-semibold text-white disabled:bg-[#2f655d]"
            >
              {syncingProfile ? "Retrying..." : "Retry"}
            </button>
          </div>
        )}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <section className="border-b border-[#1f2c34]">
          <p className="px-4 pt-3 text-xs font-semibold uppercase tracking-wide text-[#8696a0]">
            Conversations
          </p>
          {loadingData && (
            <div className="space-y-2 p-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex animate-pulse items-center gap-3 rounded-lg bg-[#1f2c34] p-3">
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
            conversations.map((conversation) => {
              const otherUser = usersById.get(
                String(conversation.participants.find((participant) => participant !== me?._id))
              );
              return (
                <button
                  key={conversation._id}
                  onClick={() => onOpenConversation(conversation._id)}
                  className={`flex w-full items-start gap-3 px-4 py-3 text-left transition-colors duration-150 hover:bg-[#253742] ${
                    selectedConversationId === conversation._id ? "bg-[#2a3942]" : "bg-[#111b21]"
                  }`}
                >
                  <div className="relative">
                    <img
                      src={otherUser?.image || ""}
                      alt={conversationTitle(conversation)}
                      className="h-11 w-11 rounded-full object-cover"
                    />
                    <span
                      className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-[#111b21] ${
                        otherUser?.online ? "bg-green-500" : "bg-gray-400"
                      }`}
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-sm font-semibold text-[#e9edef]">
                        {conversationTitle(conversation)}
                      </p>
                      {!!conversation.lastMessageTime && (
                        <span className="shrink-0 text-xs text-[#8696a0]">
                          {formatTimestamp(conversation.lastMessageTime)}
                        </span>
                      )}
                    </div>
                    <div className="mt-1 flex items-center justify-between gap-2">
                      <p className="truncate text-xs text-[#8696a0]">
                        {conversation.lastMessage?.trim()
                          ? conversation.lastMessage
                          : "No messages yet"}
                      </p>
                      {conversation.unreadCount > 0 && (
                        <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-[#128c7e] px-2 py-0.5 text-xs font-extrabold text-[#102126]">
                          {conversation.unreadCount}
                        </span>
                      )}
                    </div>
                    <p className="truncate text-[11px] text-[#6d7d86]">
                      {conversationSubtitle(conversation)}
                    </p>
                  </div>
                </button>
              );
            })}
          {!loadingData && conversations.length === 0 && (
            <p className="px-4 py-6 text-sm text-[#8696a0]">
              {hasSearch
                ? "No conversations match your search."
                : "No conversations yet. Start by selecting a user below."}
            </p>
          )}
        </section>

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
                  <img src={user.image} alt={user.name} className="h-10 w-10 rounded-full object-cover" />
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
          {!loadingData && filteredUsers.length === 0 && (
            <p className="px-4 py-4 text-sm text-[#8696a0]">
              {hasSearch ? "No users match your search." : "No other registered users yet."}
            </p>
          )}
        </section>
      </div>
    </aside>
  );
}

