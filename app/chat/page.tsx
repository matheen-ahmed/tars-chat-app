"use client";

import { ChatPanel } from "./components/ChatPanel";
import { Sidebar } from "./components/Sidebar";
import { useChatController } from "./hooks/useChatController";

export default function ChatPage() {
  const controller = useChatController();

  if (!controller.isLoaded || !controller.hasUser) {
    return (
      <div className="flex h-[100dvh] items-center justify-center bg-[#0b141a]">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#16a34a] border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex h-[100dvh] w-full flex-col overflow-hidden bg-[linear-gradient(165deg,#16222d_0%,#0f1a23_45%,#090f15_100%)] text-gray-100 md:grid md:grid-cols-[420px_1fr]">
      <Sidebar
        mobileList={controller.showMobileList}
        me={controller.me}
        syncingProfile={controller.syncingProfile}
        syncError={controller.syncError}
        currentUserMissing={controller.me === null}
        onRetrySync={controller.retrySync}
        search={controller.search}
        onSearchChange={controller.setSearch}
        loadingData={controller.isLoadingData}
        conversations={controller.conversations}
        filteredUsers={controller.filteredUsers}
        selectedConversationId={controller.selectedConversationId}
        usersById={controller.usersById}
        conversationTitle={controller.conversationTitle}
        conversationSubtitle={controller.conversationSubtitle}
        onOpenConversation={controller.openConversation}
        onOpenUserChat={controller.openUserChat}
      />

      <ChatPanel
        showMobileList={controller.showMobileList}
        selectedConversation={controller.selectedConversation}
        me={controller.me}
        otherUser={controller.otherUser}
        conversationTitle={controller.conversationTitle}
        conversationSubtitle={controller.conversationSubtitle}
        typingText={controller.typingText}
        onBack={controller.onBackToList}
        listRef={controller.listRef}
        onListScroll={controller.onListScroll}
        messages={controller.messages}
        isLoadingMessages={controller.isLoadingMessages}
        showNewMessages={controller.showNewMessages}
        onScrollToLatest={controller.scrollToLatest}
        sendError={controller.sendError}
        messageText={controller.messageText}
        onType={controller.onType}
        onInputBlur={controller.onInputBlur}
        onSend={controller.onSend}
        isSending={controller.isSending}
        conversationId={controller.selectedConversationId}
      />
    </div>
  );
}
