"use client";

import type { ChangeEvent, RefObject } from "react";
import type { Id } from "../../../convex/_generated/dataModel";
import type {
  ContactDrawerData,
  ConvDoc,
  MessageDoc,
  MessageUi,
  UserDoc,
} from "../lib/types";
import { ChatHeader } from "./ChatHeader";
import { MessageInput } from "./MessageInput";
import { MessageList } from "./MessageList";

type ChatMainPanelProps = {
  mobileList: boolean;
  selectedConv: ConvDoc | null;
  me: UserDoc | null | undefined;
  canManageSelectedGroup: boolean;
  usersById: Map<string, UserDoc>;
  title: (conversation: ConvDoc) => string;
  subtitle: (conversation: ConvDoc) => string;
  isGroupConversation: (conversation: ConvDoc) => boolean;
  typingText: string;
  onBack: () => void;
  onOpenContactDrawer: (payload: ContactDrawerData) => void;
  onRenameGroup: () => Promise<void>;
  onDeleteGroup: () => Promise<void>;
  listRef: RefObject<HTMLDivElement | null>;
  loadingMessages: boolean;
  messages?: MessageUi[];
  messagesById: Map<string, MessageDoc>;
  menuMsgId: Id<"messages"> | null;
  onToggleMenu: (id: Id<"messages"> | null) => void;
  selectMode: boolean;
  selectedMessageIds: Id<"messages">[];
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
  onOpenImagePreview: (url: string, name: string) => void;
  onNearBottom: () => void;
  showNew: boolean;
  onScrollToLatest: () => void;
  onCopySelectedMessages: () => Promise<void>;
  onCancelSelectMode: () => void;
  actionErr: string | null;
  sendErr: boolean;
  sendRetry: { text: string; cid: Id<"conversations"> } | null;
  onRetrySend: (retry: { text: string; cid: Id<"conversations"> }) => Promise<void>;
  onDismissSendError: () => void;
  replyMessage: MessageDoc | null;
  onClearReply: () => void;
  editingMessageId: Id<"messages"> | null;
  onCancelEdit: () => void;
  fileInputRef: RefObject<HTMLInputElement | null>;
  onPickFile: (event: ChangeEvent<HTMLInputElement>) => void;
  text: string;
  onType: (value: string) => void;
  onSend: () => Promise<void>;
  sending: boolean;
};

export function ChatMainPanel({
  mobileList,
  selectedConv,
  me,
  canManageSelectedGroup,
  usersById,
  title,
  subtitle,
  isGroupConversation,
  typingText,
  onBack,
  onOpenContactDrawer,
  onRenameGroup,
  onDeleteGroup,
  listRef,
  loadingMessages,
  messages,
  messagesById,
  menuMsgId,
  onToggleMenu,
  selectMode,
  selectedMessageIds,
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
  onOpenImagePreview,
  onNearBottom,
  showNew,
  onScrollToLatest,
  onCopySelectedMessages,
  onCancelSelectMode,
  actionErr,
  sendErr,
  sendRetry,
  onRetrySend,
  onDismissSendError,
  replyMessage,
  onClearReply,
  editingMessageId,
  onCancelEdit,
  fileInputRef,
  onPickFile,
  text,
  onType,
  onSend,
  sending,
}: ChatMainPanelProps) {
  return (
    <main
      className={`${!mobileList ? "flex" : "hidden"} h-full min-h-0 flex-col bg-[radial-gradient(120%_90%_at_50%_0%,rgba(67,94,117,0.18),rgba(7,12,18,0)_60%),linear-gradient(180deg,rgba(17,28,37,0.72)_0%,rgba(8,14,20,0.92)_100%)] px-2 pb-2 md:flex md:px-0 md:pb-0`}
    >
      {!selectedConv || !me ? (
        <div className="flex h-full items-center justify-center px-8 text-center text-[#8696a0]">
          <p>Select a conversation or user to start chatting.</p>
        </div>
      ) : (
        <>
          <ChatHeader
            selectedConversation={selectedConv}
            selectedIsGroup={isGroupConversation(selectedConv)}
            canManageGroup={canManageSelectedGroup}
            me={me}
            usersById={usersById}
            title={title}
            subtitle={subtitle}
            typingText={typingText}
            onBack={onBack}
            onOpenContactDrawer={onOpenContactDrawer}
            onRenameGroup={onRenameGroup}
            onDeleteGroup={onDeleteGroup}
          />

          <MessageList
            listRef={listRef}
            loadingMessages={loadingMessages}
            messages={messages}
            me={me}
            selectedConversation={selectedConv}
            usersById={usersById}
            messagesById={messagesById}
            menuMsgId={menuMsgId}
            onToggleMenu={onToggleMenu}
            selectMode={selectMode}
            selectedMessageIds={selectedMessageIds}
            onToggleSelectedMessage={onToggleSelectedMessage}
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
            onOpenImagePreview={onOpenImagePreview}
            onNearBottom={onNearBottom}
          />

          {showNew && (
            <button
              onClick={onScrollToLatest}
              className="mx-auto -mt-14 mb-2 rounded-full bg-[#25d366] px-4 py-2 text-sm font-medium text-white shadow-md"
            >
              ↓ New messages
            </button>
          )}

          <MessageInput
            selectMode={selectMode}
            selectedMessageIds={selectedMessageIds}
            onCopySelectedMessages={onCopySelectedMessages}
            onCancelSelectMode={onCancelSelectMode}
            actionErr={actionErr}
            sendErr={sendErr}
            sendRetry={sendRetry}
            onRetrySend={onRetrySend}
            onDismissSendError={onDismissSendError}
            replyMessage={replyMessage}
            onClearReply={onClearReply}
            editingMessageId={editingMessageId}
            onCancelEdit={onCancelEdit}
            fileInputRef={fileInputRef}
            onPickFile={onPickFile}
            text={text}
            onType={onType}
            onSend={onSend}
            sending={sending}
          />
        </>
      )}
    </main>
  );
}
