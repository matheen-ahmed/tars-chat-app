"use client";

import { useUser } from "@clerk/nextjs";
import { useMutation, useQuery } from "convex/react";
import { ArrowLeft } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { Sidebar } from "./components/Sidebar";
import type { ConvDoc, MessageUi, UserDoc } from "./lib/types";
import { formatTimestamp, nearBottom } from "./lib/utils";

const PRESENCE_PING_MS = 15_000;
const TYPING_IDLE_MS = 2_000;

export default function ChatPage() {
  const { user, isLoaded } = useUser();

  const [search, setSearch] = useState("");
  const [conversationId, setConversationId] = useState<Id<"conversations"> | null>(null);
  const [showMobileList, setShowMobileList] = useState(true);
  const [messageText, setMessageText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [showNewMessages, setShowNewMessages] = useState(false);
  const [isSyncingProfile, setIsSyncingProfile] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [typingNow, setTypingNow] = useState(() => Date.now());

  const listRef = useRef<HTMLDivElement | null>(null);
  const typingTimeoutRef = useRef<number | null>(null);

  const syncUser = useMutation(api.users.syncUser);
  const setOnline = useMutation(api.users.setOnlineStatus);
  const heartbeat = useMutation(api.users.heartbeat);
  const getOrCreateConversation = useMutation(api.conversations.getOrCreateConversation);
  const sendMessage = useMutation(api.conversations.sendMessage);
  const setTyping = useMutation(api.conversations.setTyping);
  const markAsRead = useMutation(api.conversations.markAsRead);

  const users = useQuery(api.users.getUsers, user ? { clerkId: user.id } : "skip") as
    | UserDoc[]
    | undefined;
  const me = useQuery(api.users.getCurrentUser, user ? { clerkId: user.id } : "skip") as
    | UserDoc
    | null
    | undefined;
  const conversations = useQuery(
    api.conversations.getConversations,
    me ? { userId: me._id } : "skip"
  ) as ConvDoc[] | undefined;
  const messages = useQuery(
    api.conversations.getMessages,
    conversationId ? { conversationId } : "skip"
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
    const ping = window.setInterval(() => void heartbeat({ clerkId: user.id }), PRESENCE_PING_MS);
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
        (conversation) => conversation.participants.length === 2
      ),
    [conversations]
  );

  const conversationTitle = useCallback(
    (conversation: ConvDoc) => {
      const otherId = conversation.participants.find((participant) => participant !== me?._id);
      return usersById.get(String(otherId))?.name || "Conversation";
    },
    [me?._id, usersById]
  );

  const conversationSubtitle = useCallback(
    (conversation: ConvDoc) => {
      const otherId = conversation.participants.find((participant) => participant !== me?._id);
      const other = usersById.get(String(otherId));
      return other?.online ? "Online" : "Offline";
    },
    [me?._id, usersById]
  );

  const filteredConversations = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return directConversations;

    return directConversations.filter((conversation) =>
      conversationTitle(conversation).toLowerCase().includes(query)
    );
  }, [conversationTitle, directConversations, search]);

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!users) return [];
    if (!query) return users;
    return users.filter((profile) => profile.name.toLowerCase().includes(query));
  }, [search, users]);

  const selectedConversation = useMemo(
    () => directConversations.find((conversation) => conversation._id === conversationId) ?? null,
    [conversationId, directConversations]
  );

  const otherUser = useMemo(() => {
    if (!selectedConversation || !me) return null;
    const otherId = selectedConversation.participants.find((participant) => participant !== me._id);
    return usersById.get(String(otherId)) || null;
  }, [me, selectedConversation, usersById]);

  const typingText = useMemo(() => {
    if (!selectedConversation?.typing?.isTyping || !me) return "";
    if (typingNow - selectedConversation.typing.updatedAt > TYPING_IDLE_MS) return "";
    if (selectedConversation.typing.userId === me._id) return "";

    const typer = usersById.get(String(selectedConversation.typing.userId));
    return `${typer?.name || "Someone"} is typing...`;
  }, [me, selectedConversation, typingNow, usersById]);

  useEffect(() => {
    const timer = window.setInterval(() => setTypingNow(Date.now()), 500);
    return () => window.clearInterval(timer);
  }, []);

  const messageCount = messages?.length ?? 0;

  useEffect(() => {
    if (!conversationId || !me) return;
    void markAsRead({ conversationId, userId: me._id });
  }, [conversationId, markAsRead, me, messageCount]);

  useEffect(() => {
    if (!listRef.current || messageCount === 0) return;

    if (nearBottom(listRef.current)) {
      listRef.current.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
      setShowNewMessages(false);
    } else {
      setShowNewMessages(true);
    }
  }, [messageCount]);

  useEffect(() => {
    if (!conversationId || !me) return;

    return () => {
      if (typingTimeoutRef.current) {
        window.clearTimeout(typingTimeoutRef.current);
      }
      void setTyping({ conversationId, userId: me._id, isTyping: false });
    };
  }, [conversationId, me, setTyping]);

  useEffect(() => {
    if (!conversationId) return;
    const stillExists = directConversations.some((conversation) => conversation._id === conversationId);
    if (stillExists) return;

    setConversationId(null);
    setShowMobileList(true);
    setMessageText("");
    setShowNewMessages(false);
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
    const id = await getOrCreateConversation({ user1: me._id, user2: targetUser._id });
    openConversation(id);
  };

  const onType = (value: string) => {
    setMessageText(value);

    if (!conversationId || !me) return;

    if (!value.trim()) {
      if (typingTimeoutRef.current) {
        window.clearTimeout(typingTimeoutRef.current);
      }
      void setTyping({ conversationId, userId: me._id, isTyping: false });
      return;
    }

    void setTyping({ conversationId, userId: me._id, isTyping: true });
    if (typingTimeoutRef.current) {
      window.clearTimeout(typingTimeoutRef.current);
    }
    typingTimeoutRef.current = window.setTimeout(() => {
      void setTyping({ conversationId, userId: me._id, isTyping: false });
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

      await setTyping({ conversationId, userId: me._id, isTyping: false });
      setMessageText("");
      if (listRef.current) {
        listRef.current.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
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

  const isLoadingData = users === undefined || me === undefined || (!!me && conversations === undefined);
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
        onOpenConversation={openConversation}
        onOpenUserChat={(profile) => void openUserChat(profile)}
      />

      <main
        className={`${!showMobileList ? "flex" : "hidden"} h-full min-h-0 flex-col bg-[radial-gradient(120%_90%_at_50%_0%,rgba(67,94,117,0.18),rgba(7,12,18,0)_60%),linear-gradient(180deg,rgba(17,28,37,0.72)_0%,rgba(8,14,20,0.92)_100%)] md:flex`}
      >
        {!selectedConversation || !me ? (
          <div className="flex h-full items-center justify-center px-8 text-center text-[#8696a0]">
            <p>Select a conversation or user to start chatting.</p>
          </div>
        ) : (
          <>
            <header className="flex items-center border-b border-white/10 bg-[#1a252d]/70 px-4 py-2.5 text-white backdrop-blur-xl md:px-5">
              <button
                onClick={() => setShowMobileList(true)}
                className="mr-3 rounded-full p-2 text-[#d1d7db] hover:bg-white/10 md:hidden"
                aria-label="Back"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>

              <img
                src={otherUser?.image || ""}
                alt={otherUser?.name || "User"}
                className="mr-3 h-10 w-10 rounded-full object-cover"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-lg font-semibold text-[#e9edef]">
                  {conversationTitle(selectedConversation)}
                </p>
                {!typingText ? (
                  <p className="truncate text-xs text-[#9bb5c3]">
                    {conversationSubtitle(selectedConversation)}
                  </p>
                ) : (
                  <div className="flex items-center gap-2 text-xs text-[#9bb5c3]">
                    <span className="truncate">{typingText.replace(/\.\.\.$/, "")}</span>
                    <span className="flex items-end gap-1">
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-gray-400 [animation-delay:-0.2s]" />
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-gray-400 [animation-delay:-0.1s]" />
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-gray-400" />
                    </span>
                  </div>
                )}
              </div>
            </header>

            <div
              ref={listRef}
              onScroll={(event) => {
                if (nearBottom(event.currentTarget)) {
                  setShowNewMessages(false);
                }
              }}
              className="relative min-h-0 flex-1 overflow-y-auto bg-[#0b141a] bg-[radial-gradient(circle_at_1px_1px,_rgba(255,255,255,0.04)_1px,_transparent_0)] [background-size:20px_20px] px-4 py-4"
            >
              <div className="mx-auto flex max-w-3xl flex-col gap-2">
                {isLoadingMessages && (
                  <div className="space-y-2">
                    {Array.from({ length: 8 }).map((_, index) => (
                      <div key={index} className={`flex ${index % 2 === 0 ? "justify-start" : "justify-end"}`}>
                        <div className="h-14 w-48 animate-pulse rounded-xl bg-white/70" />
                      </div>
                    ))}
                  </div>
                )}

                {messages && messages.length === 0 && (
                  <div className="mt-8 rounded-xl bg-white/80 px-4 py-3 text-center text-sm text-gray-600">
                    No messages yet. Say hello to start this conversation.
                  </div>
                )}

                {messages?.map((message) => {
                  const isMine = message.senderId === me._id;
                  return (
                    <div key={message._id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                      <div
                        className={`max-w-[82%] rounded-2xl border px-3.5 py-2.5 text-sm shadow-[0_10px_28px_rgba(0,0,0,0.28)] md:max-w-[62%] ${
                          isMine
                            ? "border-[#1f6f62]/80 bg-[linear-gradient(145deg,rgba(0,112,92,0.92),rgba(0,88,75,0.94))]"
                            : "border-[#2a3942]/80 bg-[linear-gradient(145deg,rgba(34,47,57,0.9),rgba(26,37,46,0.92))]"
                        }`}
                      >
                        <p className="break-words text-[#e9edef]">{message.content}</p>
                        <p className="mt-1 text-right text-[11px] text-[#aebac1]">
                          {formatTimestamp(message.createdAt)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {showNewMessages && (
              <button
                onClick={() => {
                  if (!listRef.current) return;
                  listRef.current.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
                  setShowNewMessages(false);
                }}
                className="mx-auto -mt-14 mb-2 rounded-full bg-[#25d366] px-4 py-2 text-sm font-medium text-white shadow-md"
              >
                ↓ New messages
              </button>
            )}

            <footer className="border-t border-[#1f2c34] bg-[#202c33] p-3">
              {sendError && <p className="mb-2 text-center text-xs text-red-400">{sendError}</p>}
              <div className="mx-auto flex w-full max-w-3xl min-w-0 items-center gap-2">
                <input
                  value={messageText}
                  onChange={(event) => onType(event.target.value)}
                  onBlur={() => {
                    if (!conversationId || !me) return;
                    void setTyping({ conversationId, userId: me._id, isTyping: false });
                  }}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && !event.shiftKey) {
                      event.preventDefault();
                      void onSend();
                    }
                  }}
                  placeholder="Type a message"
                  className="min-w-0 flex-1 rounded-full border border-[#2b3942] bg-[#111b21] px-4 py-2 text-sm text-[#d1d7db] outline-none focus:border-[#00a884]"
                />
                <button
                  onClick={() => void onSend()}
                  disabled={isSending || !messageText.trim()}
                  className="shrink-0 rounded-full bg-[#128c7e] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-green-600 disabled:cursor-not-allowed disabled:bg-[#2f655d]"
                >
                  {isSending ? "Sending..." : "Send"}
                </button>
              </div>
            </footer>
          </>
        )}
      </main>
    </div>
  );
}
