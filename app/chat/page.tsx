"use client";

import { useUser } from "@clerk/nextjs";
import { useMutation, useQuery } from "convex/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { UIEvent } from "react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { ChatPanel } from "./components/ChatPanel";
import { Sidebar } from "./components/Sidebar";
import type { ConvDoc, MessageUi, UserDoc } from "./lib/types";
import { nearBottom } from "./lib/utils";

const PRESENCE_PING_MS = 15_000;
const TYPING_IDLE_MS = 2_000;

export default function ChatPage() {
  const { user, isLoaded } = useUser();

  const [search, setSearch] = useState("");
  const [conversationId, setConversationId] =
    useState<Id<"conversations"> | null>(null);
  const [showMobileList, setShowMobileList] = useState(true);
  const [messageText, setMessageText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [showNewMessages, setShowNewMessages] = useState(false);
  const [isSyncingProfile, setIsSyncingProfile] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [typingNow, setTypingNow] = useState(() => Date.now());
  const [isNearBottomState, setIsNearBottomState] = useState(true);
  const [isDesktop, setIsDesktop] = useState(false);
  const [isWindowActive, setIsWindowActive] = useState(() =>
    typeof document !== "undefined"
      ? document.visibilityState === "visible"
      : true,
  );

  const listRef = useRef<HTMLDivElement | null>(null);
  const typingTimeoutRef = useRef<number | null>(null);
  const prevMessageCountRef = useRef(0);

  const syncUser = useMutation(api.users.syncUser);
  const setOnline = useMutation(api.users.setOnlineStatus);
  const heartbeat = useMutation(api.users.heartbeat);
  const getOrCreateConversation = useMutation(
    api.conversations.getOrCreateConversation,
  );
  const sendMessage = useMutation(api.conversations.sendMessage);
  const setTyping = useMutation(api.conversations.setTyping);
  const markAsRead = useMutation(api.conversations.markAsRead);
  const backfillConversationsForUser = useMutation(
    api.conversations.backfillConversationsForUser,
  );

  const users = useQuery(
    api.users.getUsers,
    user ? { clerkId: user.id } : "skip",
  ) as UserDoc[] | undefined;
  const me = useQuery(
    api.users.getCurrentUser,
    user ? { clerkId: user.id } : "skip",
  ) as UserDoc | null | undefined;
  const conversations = useQuery(
    api.conversations.getConversations,
    me ? { userId: me._id } : "skip",
  ) as ConvDoc[] | undefined;
  const messages = useQuery(
    api.conversations.getMessages,
    conversationId ? { conversationId } : "skip",
  ) as MessageUi[] | undefined;

  const syncCurrentUser = useCallback(async () => {
    if (!user) return;

    setIsSyncingProfile(true);
    setSyncError(null);
    try {
      await syncUser({
        clerkId: user.id,
        name: user.fullName || "User",
        email: user.primaryEmailAddress?.emailAddress || "",
        image: user.imageUrl,
      });
    } catch {
      setSyncError("Unable to sync your profile right now. Please retry.");
    } finally {
      setIsSyncingProfile(false);
    }
  }, [syncUser, user]);

  useEffect(() => {
    void syncCurrentUser();
  }, [syncCurrentUser]);

  useEffect(() => {
    if (!user || me !== null || me === undefined) return;
    const timer = window.setTimeout(() => void syncCurrentUser(), 1200);
    return () => window.clearTimeout(timer);
  }, [me, syncCurrentUser, user]);

  useEffect(() => {
    if (!user) return;

    const onOnline = () => {
      void setOnline({ clerkId: user.id, online: true });
      void heartbeat({ clerkId: user.id });
    };

    const onOffline = () => {
      void setOnline({ clerkId: user.id, online: false });
    };

    onOnline();
    const ping = window.setInterval(
      () => void heartbeat({ clerkId: user.id }),
      PRESENCE_PING_MS,
    );
    const onVisibilityChange = () =>
      document.visibilityState === "visible" ? onOnline() : onOffline();

    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("pagehide", onOffline);
    window.addEventListener("beforeunload", onOffline);

    return () => {
      window.clearInterval(ping);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("pagehide", onOffline);
      window.removeEventListener("beforeunload", onOffline);
      onOffline();
    };
  }, [heartbeat, setOnline, user]);

  const usersById = useMemo(() => {
    const map = new Map<string, UserDoc>();
    (users || []).forEach((item) => map.set(String(item._id), item));
    return map;
  }, [users]);

  const directConversations = useMemo(
    () =>
      (conversations || []).filter(
        (conversation) => conversation.participants.length === 2,
      ),
    [conversations],
  );

  const conversationTitle = useCallback(
    (conversation: ConvDoc) => {
      const otherId = conversation.participants.find(
        (participant) => participant !== me?._id,
      );
      return usersById.get(String(otherId))?.name || "Conversation";
    },
    [me?._id, usersById],
  );

  const conversationSubtitle = useCallback(
    (conversation: ConvDoc) => {
      const otherId = conversation.participants.find(
        (participant) => participant !== me?._id,
      );
      const other = usersById.get(String(otherId));
      return other?.online ? "Online" : "Offline";
    },
    [me?._id, usersById],
  );

  const filteredConversations = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return directConversations;

    return directConversations.filter((conversation) =>
      conversationTitle(conversation).toLowerCase().includes(query),
    );
  }, [conversationTitle, directConversations, search]);

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!users) return [];
    if (!query) return users;
    return users.filter((profile) =>
      profile.name.toLowerCase().includes(query),
    );
  }, [search, users]);

  const selectedConversation = useMemo(
    () =>
      directConversations.find(
        (conversation) => conversation._id === conversationId,
      ) ?? null,
    [conversationId, directConversations],
  );

  const otherUser = useMemo(() => {
    if (!selectedConversation || !me) return null;
    const otherId = selectedConversation.participants.find(
      (participant) => participant !== me._id,
    );
    return usersById.get(String(otherId)) || null;
  }, [me, selectedConversation, usersById]);

  const typingText = useMemo(() => {
    if (!selectedConversation?.typing?.isTyping || !me) return "";
    if (typingNow - selectedConversation.typing.updatedAt > TYPING_IDLE_MS)
      return "";
    if (selectedConversation.typing.userId === me._id) return "";

    const typer = usersById.get(String(selectedConversation.typing.userId));
    return `${typer?.name || "Someone"} is typing...`;
  }, [me, selectedConversation, typingNow, usersById]);

  useEffect(() => {
    const timer = window.setInterval(() => setTypingNow(Date.now()), 500);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const media = window.matchMedia("(min-width: 768px)");
    const apply = () => setIsDesktop(media.matches);
    apply();
    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, []);

  useEffect(() => {
    const updateActiveState = () =>
      setIsWindowActive(
        document.visibilityState === "visible" && document.hasFocus(),
      );

    updateActiveState();
    document.addEventListener("visibilitychange", updateActiveState);
    window.addEventListener("focus", updateActiveState);
    window.addEventListener("blur", updateActiveState);

    return () => {
      document.removeEventListener("visibilitychange", updateActiveState);
      window.removeEventListener("focus", updateActiveState);
      window.removeEventListener("blur", updateActiveState);
    };
  }, []);

  const didBackfillRef = useRef(false);
  useEffect(() => {
    if (!me || didBackfillRef.current) return;
    didBackfillRef.current = true;
    void backfillConversationsForUser({ userId: me._id }).catch(() => {});
  }, [backfillConversationsForUser, me]);

  const messageCount = messages?.length ?? 0;
  const isConversationVisible =
    !!conversationId &&
    !!me &&
    (isDesktop || !showMobileList) &&
    isWindowActive;

  useEffect(() => {
    if (!conversationId || !me || !isConversationVisible) return;
    void markAsRead({ conversationId, userId: me._id });
  }, [conversationId, isConversationVisible, markAsRead, me, messageCount]);

  useEffect(() => {
    if (!listRef.current || messageCount === 0) return;
    const isInitialLoad = prevMessageCountRef.current === 0;
    const hasNewMessages = messageCount > prevMessageCountRef.current;
    prevMessageCountRef.current = messageCount;

    if (isInitialLoad || (hasNewMessages && isNearBottomState)) {
      listRef.current.scrollTo({
        top: listRef.current.scrollHeight,
        behavior: "smooth",
      });
      setShowNewMessages(false);
      return;
    }

    if (hasNewMessages && !isNearBottomState) {
      setShowNewMessages(true);
    }
  }, [isNearBottomState, messageCount]);

  useEffect(() => {
    if (!conversationId || !me) return;

    return () => {
      if (typingTimeoutRef.current) {
        window.clearTimeout(typingTimeoutRef.current);
      }
      void setTyping({ conversationId, userId: me._id, isTyping: false }).catch(
        () => {},
      );
    };
  }, [conversationId, me, setTyping]);

  useEffect(() => {
    if (!conversationId) return;
    const stillExists = directConversations.some(
      (conversation) => conversation._id === conversationId,
    );
    if (stillExists) return;

    setConversationId(null);
    setShowMobileList(true);
    setMessageText("");
    setShowNewMessages(false);
    setIsNearBottomState(true);
    prevMessageCountRef.current = 0;
  }, [conversationId, directConversations]);

  const openConversation = (id: Id<"conversations">) => {
    setConversationId(id);
    setShowMobileList(false);
    setSendError(null);
    if (me) {
      void markAsRead({ conversationId: id, userId: me._id });
    }
  };

  const openUserChat = async (targetUser: UserDoc) => {
    if (!me) return;
    const id = await getOrCreateConversation({
      user1: me._id,
      user2: targetUser._id,
    });
    openConversation(id);
  };

  const onBackToList = () => {
    setShowMobileList(true);
    setConversationId(null);
    setShowNewMessages(false);
    setIsNearBottomState(true);
    prevMessageCountRef.current = 0;
  };

  const onListScroll = (event: UIEvent<HTMLDivElement>) => {
    const nearBottomNow = nearBottom(event.currentTarget);
    setIsNearBottomState(nearBottomNow);
    if (nearBottomNow) {
      setShowNewMessages(false);
    }
  };

  const onInputBlur = () => {
    if (!conversationId || !me) return;
    void setTyping({ conversationId, userId: me._id, isTyping: false }).catch(
      () => {},
    );
  };

  const scrollToLatest = () => {
    if (!listRef.current) return;
    listRef.current.scrollTo({
      top: listRef.current.scrollHeight,
      behavior: "smooth",
    });
    setShowNewMessages(false);
  };

  const onType = (value: string) => {
    setMessageText(value);

    if (!conversationId || !me) return;

    if (!value.trim()) {
      if (typingTimeoutRef.current) {
        window.clearTimeout(typingTimeoutRef.current);
      }
      void setTyping({ conversationId, userId: me._id, isTyping: false }).catch(
        () => {},
      );
      return;
    }

    void setTyping({ conversationId, userId: me._id, isTyping: true }).catch(
      () => {},
    );
    if (typingTimeoutRef.current) {
      window.clearTimeout(typingTimeoutRef.current);
    }
    typingTimeoutRef.current = window.setTimeout(() => {
      void setTyping({ conversationId, userId: me._id, isTyping: false }).catch(
        () => {},
      );
    }, TYPING_IDLE_MS);
  };

  const onSend = async () => {
    if (!conversationId || !me || !messageText.trim() || isSending) return;

    setIsSending(true);
    setSendError(null);

    try {
      const created = await sendMessage({
        conversationId,
        senderId: me._id,
        content: messageText,
      });

      if (!created) {
        setSendError("Failed to send message. Try again.");
        return;
      }

      await setTyping({
        conversationId,
        userId: me._id,
        isTyping: false,
      }).catch(() => {});
      setMessageText("");
      if (listRef.current) {
        listRef.current.scrollTo({
          top: listRef.current.scrollHeight,
          behavior: "smooth",
        });
      }
      setShowNewMessages(false);
    } catch {
      setSendError("Failed to send message. Try again.");
    } finally {
      setIsSending(false);
    }
  };

  if (!isLoaded || !user) {
    return (
      <div className="flex h-[100dvh] items-center justify-center bg-[#0b141a]">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#16a34a] border-t-transparent" />
      </div>
    );
  }

  const isLoadingData =
    users === undefined ||
    me === undefined ||
    (!!me && conversations === undefined);
  const isLoadingMessages = !!conversationId && messages === undefined;

  return (
    <div className="flex h-[100dvh] w-full flex-col overflow-hidden bg-[linear-gradient(165deg,#16222d_0%,#0f1a23_45%,#090f15_100%)] text-gray-100 md:grid md:grid-cols-[420px_1fr]">
      <Sidebar
        mobileList={showMobileList}
        me={me ?? null}
        syncingProfile={isSyncingProfile}
        syncError={syncError}
        currentUserMissing={me === null}
        onRetrySync={() => void syncCurrentUser()}
        search={search}
        onSearchChange={setSearch}
        loadingData={isLoadingData}
        conversations={filteredConversations}
        filteredUsers={filteredUsers}
        selectedConversationId={conversationId}
        usersById={usersById}
        conversationTitle={conversationTitle}
        conversationSubtitle={conversationSubtitle}
        typingNow={typingNow}
        onOpenConversation={openConversation}
        onOpenUserChat={(profile) => void openUserChat(profile)}
      />

      <ChatPanel
        showMobileList={showMobileList}
        selectedConversation={selectedConversation}
        me={me ?? null}
        otherUser={otherUser}
        conversationTitle={conversationTitle}
        conversationSubtitle={conversationSubtitle}
        typingText={typingText}
        onBack={onBackToList}
        listRef={listRef}
        onListScroll={onListScroll}
        messages={messages}
        isLoadingMessages={isLoadingMessages}
        showNewMessages={showNewMessages}
        onScrollToLatest={scrollToLatest}
        sendError={sendError}
        messageText={messageText}
        onType={onType}
        onInputBlur={onInputBlur}
        onSend={() => void onSend()}
        isSending={isSending}
        conversationId={conversationId}
      />
    </div>
  );
}
