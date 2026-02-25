"use client";

import { Search, UserCircle2 } from "lucide-react";
import { UserButton } from "@clerk/nextjs";
import Image from "next/image";
import { ConversationList } from "./ConversationList";
import type { ConvDoc, ContactDrawerData, UserDoc } from "../lib/types";
import type { Id } from "../../../convex/_generated/dataModel";

type SidebarProps = {
  activeTab: "chats" | "groups";
  onTabChange: (tab: "chats" | "groups") => void;
  mobileList: boolean;
  me?: UserDoc | null;
  syncingProfile: boolean;
  syncError: string | null;
  currentUserMissing: boolean;
  onRetrySync: () => void;
  search: string;
  onSearchChange: (value: string) => void;
  onOpenGroup: () => void;
  loadingData: boolean;
  chatConversations: ConvDoc[];
  groupConversations: ConvDoc[];
  filteredUsers: UserDoc[];
  allUsersCount: number;
  selectedConversationId: Id<"conversations"> | null;
  usersById: Map<string, UserDoc>;
  title: (conversation: ConvDoc) => string;
  subtitle: (conversation: ConvDoc) => string;
  isGroupConversation: (conversation: ConvDoc) => boolean;
  onOpenConversation: (id: Id<"conversations">) => void;
  onOpenUserChat: (user: UserDoc) => void;
  onOpenContactDrawer: (payload: ContactDrawerData) => void;
};

export function Sidebar({
  activeTab,
  onTabChange,
  mobileList,
  me,
  syncingProfile,
  syncError,
  currentUserMissing,
  onRetrySync,
  search,
  onSearchChange,
  onOpenGroup,
  loadingData,
  chatConversations,
  groupConversations,
  filteredUsers,
  allUsersCount,
  selectedConversationId,
  usersById,
  title,
  subtitle,
  isGroupConversation,
  onOpenConversation,
  onOpenUserChat,
  onOpenContactDrawer,
}: SidebarProps) {
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
        <div className="flex items-center gap-2">
          {me && (
            <button
              onClick={() =>
                onOpenContactDrawer({
                  name: me.name,
                  image: me.image,
                  detail: me.online ? "Online" : "Offline",
                  canEdit: true,
                })
              }
              className="inline-flex items-center gap-1 rounded-md border border-[#2b3942] px-2 py-1 text-xs font-semibold text-[#d1d7db] hover:bg-[#2a3942]"
            >
              <UserCircle2 className="h-4 w-4" />
              <span>Profile</span>
            </button>
          )}
          <UserButton afterSignOutUrl="/" />
        </div>
      </div>

      <div className="space-y-3 border-b border-white/10 bg-white/[0.03] px-4 py-4.5">
        <h2 className="text-4xl font-semibold tracking-tight text-white">
          {activeTab === "groups" ? "Groups" : "Chats"}
        </h2>
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
            placeholder="Search or start a new chat"
            className="w-full rounded-full border border-white/15 bg-black/20 px-9 py-2.5 text-sm text-[#d1d7db] outline-none transition-colors duration-200 focus:border-[#3b82f6]"
          />
        </div>
        <div className="flex items-center gap-2 pt-1">
          <button
            onClick={() => onTabChange("chats")}
            className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${
              activeTab === "chats"
                ? "bg-[#16a34a] text-white"
                : "bg-black/20 text-[#aebac1] hover:bg-white/10"
            }`}
          >
            Chats
          </button>
          <button
            onClick={() => onTabChange("groups")}
            className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${
              activeTab === "groups"
                ? "bg-[#2563eb] text-white"
                : "bg-black/20 text-[#aebac1] hover:bg-white/10"
            }`}
          >
            Groups
          </button>
          {activeTab === "groups" && (
            <button
              onClick={onOpenGroup}
              className="ml-auto rounded-full bg-[#0a7c66] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#0b9478]"
            >
              + New
            </button>
          )}
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

      <ConversationList
        activeTab={activeTab}
        loadingData={loadingData}
        chatConversations={chatConversations}
        groupConversations={groupConversations}
        filteredUsers={filteredUsers}
        search={search}
        allUsersCount={allUsersCount}
        selectedConversationId={selectedConversationId}
        currentUserId={me?._id}
        usersById={usersById}
        title={title}
        subtitle={subtitle}
        isGroupConversation={isGroupConversation}
        onOpenConversation={onOpenConversation}
        onOpenUserChat={onOpenUserChat}
      />
    </aside>
  );
}

