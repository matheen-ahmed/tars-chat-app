"use client";

import { Search } from "lucide-react";
import { SignOutButton, UserButton } from "@clerk/nextjs";
import { ConversationList } from "./ConversationList";
import type { ConvDoc, ContactDrawerData, UserDoc } from "./types";
import type { Id } from "../../../convex/_generated/dataModel";

type SidebarProps = {
  mobileList: boolean;
  me?: UserDoc | null;
  search: string;
  onSearchChange: (value: string) => void;
  onOpenGroup: () => void;
  loadingData: boolean;
  filteredConversations: ConvDoc[];
  filteredUsers: UserDoc[];
  selectedConversationId: Id<"conversations"> | null;
  usersById: Map<string, UserDoc>;
  title: (conversation: ConvDoc) => string;
  subtitle: (conversation: ConvDoc) => string;
  onOpenConversation: (id: Id<"conversations">) => void;
  onOpenUserChat: (user: UserDoc) => void;
  onOpenContactDrawer: (payload: ContactDrawerData) => void;
};

export function Sidebar({
  mobileList,
  me,
  search,
  onSearchChange,
  onOpenGroup,
  loadingData,
  filteredConversations,
  filteredUsers,
  selectedConversationId,
  usersById,
  title,
  subtitle,
  onOpenConversation,
  onOpenUserChat,
  onOpenContactDrawer,
}: SidebarProps) {
  return (
    <aside
      className={`${mobileList ? "flex" : "hidden"} min-h-0 flex-col border-r border-[#1f2c34] bg-[#111b21] md:flex`}
    >
      <div className="flex items-center justify-between bg-[#202c33] px-4 py-3 text-white">
        <div className="flex min-w-0 items-center gap-3">
          {me ? (
            <button
              onClick={() =>
                onOpenContactDrawer({
                  name: me.name,
                  image: me.image,
                  detail: me.online ? "Online" : "Offline",
                  canEdit: true,
                })
              }
              className="rounded-full"
            >
              <img
                src={me.image}
                alt={me.name}
                className="h-10 w-10 rounded-full object-cover"
              />
            </button>
          ) : (
            <div className="h-10 w-10 animate-pulse rounded-full bg-[#2a8072]" />
          )}
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{me?.name || "Loading..."}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <UserButton />
          <SignOutButton>
            <button className="rounded-md bg-[#0a7c66] px-2 py-1 text-xs font-semibold text-white hover:bg-[#0b9478]">
              Logout
            </button>
          </SignOutButton>
        </div>
      </div>

      <div className="space-y-3 border-b border-[#1f2c34] bg-[#111b21] p-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-[#8596a0]" />
          <input
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search or start a new chat"
            className="w-full rounded-full border border-[#2b3942] bg-[#202c33] px-9 py-2 text-sm text-[#d1d7db] outline-none focus:border-[#00a884]"
          />
        </div>
        <button
          onClick={onOpenGroup}
          className="w-full rounded-lg bg-[#00a884] px-3 py-2 text-sm font-semibold text-white hover:bg-[#019274]"
        >
          New Group
        </button>
      </div>

      <ConversationList
        loadingData={loadingData}
        filteredConversations={filteredConversations}
        filteredUsers={filteredUsers}
        selectedConversationId={selectedConversationId}
        currentUserId={me?._id}
        usersById={usersById}
        title={title}
        subtitle={subtitle}
        onOpenConversation={onOpenConversation}
        onOpenUserChat={onOpenUserChat}
      />
    </aside>
  );
}
