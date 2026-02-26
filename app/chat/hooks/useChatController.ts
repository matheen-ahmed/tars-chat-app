"use client";

import { useUser } from "@clerk/nextjs";
import { useMutation, useQuery } from "convex/react";
import {
  useCallback,
  useEffect,
  useMemo,
  type RefObject,
  useRef,
  useState,
  type UIEvent,
} from "react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import type { ConvDoc, MessageUi, UserDoc } from "../lib/types";
import {
  DESKTOP_MEDIA_QUERY,
  PRESENCE_PING_MS,
  TYPING_IDLE_MS,
} from "../lib/constants";
import {
  buildUsersById,
  filterDirectConversations,
  getConversationSubtitle,
  getConversationTitle,
} from "../lib/conversationView";
import { nearBottom } from "../lib/utils";

type Controller = {
  isLoaded: boolean;
  hasUser: boolean;
  search: string;
  setSearch: (value: string) => void;
  showMobileList: boolean;
  syncingProfile: boolean;
  syncError: string | null;
  retrySync: () => void;
  isLoadingData: boolean;
  isLoadingMessages: boolean;
  conversations: ConvDoc[];
  filteredUsers: UserDoc[];
  selectedConversationId: Id<"conversations"> | null;
  usersById: Map<string, UserDoc>;
  conversationTitle: (conversation: ConvDoc) => string;
  conversationSubtitle: (conversation: ConvDoc) => string;
  typingNow: number;
  openConversation: (id: Id<"conversations">) => void;
  openUserChat: (user: UserDoc) => void;
  selectedConversation: ConvDoc | null;
  me: UserDoc | null;
  otherUser: UserDoc | null;
  typingText: string;
  onBackToList: () => void;
  listRef: RefObject<HTMLDivElement | null>;
  onListScroll: (event: UIEvent<HTMLDivElement>) => void;
  messages: MessageUi[] | undefined;
  showNewMessages: boolean;
  scrollToLatest: () => void;
  sendError: string | null;
  messageText: string;
  onType: (value: string) => void;
  onInputBlur: () => void;
  onSend: () => void;
  isSending: boolean;
};

export function useChatController(): Controller {
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
  const prevLastMessageIdRef = useRef<Id<"messages"> | null>(null);
  const didInitConversationRef = useRef(false);

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
    return buildUsersById(users);
  }, [users]);

  const directConversations = useMemo(
    () => filterDirectConversations(conversations),
    [conversations],
  );

  const conversationTitle = useCallback(
    (conversation: ConvDoc) => getConversationTitle(conversation, me?._id, usersById),
    [me?._id, usersById],
  );

  const conversationSubtitle = useCallback(
    (conversation: ConvDoc) =>
      getConversationSubtitle(conversation, me?._id, usersById),
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
    const media = window.matchMedia(DESKTOP_MEDIA_QUERY);
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
    prevLastMessageIdRef.current = null;
    didInitConversationRef.current = false;
  }, [conversationId]);

  useEffect(() => {
    if (!listRef.current || !conversationId) return;
    if (!messages) return;
    if (messages.length === 0) {
      prevLastMessageIdRef.current = null;
      didInitConversationRef.current = true;
      setShowNewMessages(false);
      return;
    }

    const latestMessageId = messages[messages.length - 1]?._id ?? null;
    const hasNewLatestMessage = prevLastMessageIdRef.current !== latestMessageId;
    const nearBottomNow = nearBottom(listRef.current);

    if (isNearBottomState !== nearBottomNow) {
      setIsNearBottomState(nearBottomNow);
    }

    if (!didInitConversationRef.current) {
      // Keep initial position (no force-scroll) and show down-arrow
      // when the thread is not already at the bottom.
      const hasOverflow = listRef.current.scrollHeight > listRef.current.clientHeight + 8;
      setShowNewMessages(hasOverflow && !nearBottomNow);
      didInitConversationRef.current = true;
    } else if (hasNewLatestMessage) {
      if (nearBottomNow) {
        listRef.current.scrollTo({
          top: listRef.current.scrollHeight,
          behavior: "smooth",
        });
        setShowNewMessages(false);
      } else {
        setShowNewMessages(true);
      }
    }

    prevLastMessageIdRef.current = latestMessageId;
  }, [conversationId, isNearBottomState, messages]);

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
    prevLastMessageIdRef.current = null;
    didInitConversationRef.current = false;
  }, [conversationId, directConversations]);

  const openConversation = useCallback(
    (id: Id<"conversations">) => {
      setConversationId(id);
      setShowMobileList(false);
      setSendError(null);
      if (me) {
        void markAsRead({ conversationId: id, userId: me._id });
      }
    },
    [markAsRead, me],
  );

  const openUserChat = useCallback(
    async (targetUser: UserDoc) => {
      if (!me) return;
      const id = await getOrCreateConversation({
        user1: me._id,
        user2: targetUser._id,
      });
      openConversation(id);
    },
    [getOrCreateConversation, me, openConversation],
  );

  const onBackToList = useCallback(() => {
    setShowMobileList(true);
    setConversationId(null);
    setShowNewMessages(false);
    setIsNearBottomState(true);
    prevLastMessageIdRef.current = null;
    didInitConversationRef.current = false;
  }, []);

  const onListScroll = useCallback((event: UIEvent<HTMLDivElement>) => {
    const nearBottomNow = nearBottom(event.currentTarget);
    setIsNearBottomState(nearBottomNow);
    if (nearBottomNow) {
      setShowNewMessages(false);
    }
  }, []);

  const onInputBlur = useCallback(() => {
    if (!conversationId || !me) return;
    void setTyping({ conversationId, userId: me._id, isTyping: false }).catch(
      () => {},
    );
  }, [conversationId, me, setTyping]);

  const scrollToLatest = useCallback(() => {
    if (!listRef.current) return;
    listRef.current.scrollTo({
      top: listRef.current.scrollHeight,
      behavior: "smooth",
    });
    setIsNearBottomState(true);
    setShowNewMessages(false);
  }, []);

  const onType = useCallback(
    (value: string) => {
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
    },
    [conversationId, me, setTyping],
  );

  const onSend = useCallback(async () => {
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
  }, [conversationId, isSending, me, messageText, sendMessage, setTyping]);

  const isLoadingData =
    users === undefined ||
    me === undefined ||
    (!!me && conversations === undefined);
  const isLoadingMessages = !!conversationId && messages === undefined;

  return {
    isLoaded,
    hasUser: !!user,
    search,
    setSearch,
    showMobileList,
    syncingProfile: isSyncingProfile,
    syncError,
    retrySync: () => void syncCurrentUser(),
    isLoadingData,
    isLoadingMessages,
    conversations: filteredConversations,
    filteredUsers,
    selectedConversationId: conversationId,
    usersById,
    conversationTitle,
    conversationSubtitle,
    typingNow,
    openConversation,
    openUserChat: (profile) => void openUserChat(profile),
    selectedConversation,
    me: me ?? null,
    otherUser,
    typingText,
    onBackToList,
    listRef,
    onListScroll,
    messages,
    showNewMessages,
    scrollToLatest,
    sendError,
    messageText,
    onType,
    onInputBlur,
    onSend: () => void onSend(),
    isSending,
  };
}
