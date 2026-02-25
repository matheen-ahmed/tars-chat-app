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
  search: string;
  onSearchChange: (value: string) => void;
  onOpenGroup: () => void;
  loadingData: boolean;
  chatConversations: ConvDoc[];
  groupConversations: ConvDoc[];
  filteredUsers: UserDoc[];
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
  search,
  onSearchChange,
  onOpenGroup,
  loadingData,
  chatConversations,
  groupConversations,
  filteredUsers,
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
      className={`${mobileList ? "flex" : "hidden"} h-full min-h-0 flex-col border-r border-[#1f2c34] bg-[#111b21] md:flex`}
    >
      <div className="flex items-center justify-between border-b border-[#2b3942] bg-[#202c33] px-4 py-3 text-white">
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

      <div className="space-y-3 border-b border-[#1f2c34] bg-[#111b21] px-4 py-4">
        <h2 className="text-4xl font-semibold tracking-tight text-white">
          {activeTab === "groups" ? "Groups" : "Chats"}
        </h2>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-[#8596a0]" />
          <input
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search or start a new chat"
            className="w-full rounded-full border border-[#2b3942] bg-[#202c33] px-9 py-2 text-sm text-[#d1d7db] outline-none focus:border-[#3b82f6]"
          />
        </div>
        <div className="flex items-center gap-2 pt-1">
          <button
            onClick={() => onTabChange("chats")}
            className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${
              activeTab === "chats"
                ? "bg-[#16a34a] text-white"
                : "bg-[#202c33] text-[#aebac1] hover:bg-[#2a3942]"
            }`}
          >
            Chats
          </button>
          <button
            onClick={() => onTabChange("groups")}
            className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${
              activeTab === "groups"
                ? "bg-[#2563eb] text-white"
                : "bg-[#202c33] text-[#aebac1] hover:bg-[#2a3942]"
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
      </div>

      <ConversationList
        activeTab={activeTab}
        loadingData={loadingData}
        chatConversations={chatConversations}
        groupConversations={groupConversations}
        filteredUsers={filteredUsers}
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

