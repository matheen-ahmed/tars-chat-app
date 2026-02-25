"use client";

import { useUser } from "@clerk/nextjs";
import { useMutation, useQuery } from "convex/react";
import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { ChatMainPanel } from "./components/ChatMainPanel";
import { ChatOverlays } from "./components/ChatOverlays";
import { Sidebar } from "./components/Sidebar";
import type {
  ContactDrawerData,
  ConvDoc,
  MessageDoc,
  MessageUi,
  UserDoc,
} from "./lib/types";
import { REACTIONS, formatTimestamp, nearBottom } from "./lib/utils";

const PRESENCE_PING_MS = 15_000;
const TYPING_IDLE_MS = 2_000;
const isGroupConversation = (conversation: ConvDoc) =>
  !!conversation.isGroup || !!conversation.groupName || conversation.participants.length > 2;

export default function ChatPage() {
  const { user, isLoaded } = useUser();
  const [search, setSearch] = useState("");
  const [cid, setCid] = useState<Id<"conversations"> | null>(null);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [sendErr, setSendErr] = useState(false);
  const [sendRetry, setSendRetry] = useState<{
    text: string;
    cid: Id<"conversations">;
  } | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [mobileList, setMobileList] = useState(true);
  const [sidebarTab, setSidebarTab] = useState<"chats" | "groups">("chats");
  const [actionErr, setActionErr] = useState<string | null>(null);
  const [menuMsgId, setMenuMsgId] = useState<Id<"messages"> | null>(null);
  const [editingMessageId, setEditingMessageId] = useState<Id<"messages"> | null>(null);
  const [replyToId, setReplyToId] = useState<Id<"messages"> | null>(null);
  const [infoMessageId, setInfoMessageId] = useState<Id<"messages"> | null>(null);
  const [forwardMessageId, setForwardMessageId] = useState<Id<"messages"> | null>(null);
  const [forwardOpen, setForwardOpen] = useState(false);
  const [selectMode, setSelectMode] = useState(false);
  const [selectedMessageIds, setSelectedMessageIds] = useState<Id<"messages">[]>([]);
  const [groupOpen, setGroupOpen] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [groupSearch, setGroupSearch] = useState("");
  const [groupMembers, setGroupMembers] = useState<Id<"users">[]>([]);
  const [groupBusy, setGroupBusy] = useState(false);
  const [groupErr, setGroupErr] = useState<string | null>(null);
  const [renameModalOpen, setRenameModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [renameValue, setRenameValue] = useState("");
  const [groupActionBusy, setGroupActionBusy] = useState(false);
  const [contactDrawer, setContactDrawer] = useState<ContactDrawerData | null>(null);
  const [pendingProfileFile, setPendingProfileFile] = useState<File | null>(null);
  const [pendingProfilePreview, setPendingProfilePreview] = useState<string | null>(null);
  const [profileSaving, setProfileSaving] = useState(false);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [imagePreviewName, setImagePreviewName] = useState<string>("");
  const [syncingProfile, setSyncingProfile] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);

  const listRef = useRef<HTMLDivElement | null>(null);
  const typingRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const profileInputRef = useRef<HTMLInputElement | null>(null);

  const syncUser = useMutation(api.users.syncUser);
  const setOnline = useMutation(api.users.setOnlineStatus);
  const heartbeat = useMutation(api.users.heartbeat);
  const getOrCreateConversation = useMutation(api.conversations.getOrCreateConversation);
  const createGroupConversation = useMutation(api.conversations.createGroupConversation);
  const renameGroup = useMutation(api.conversations.renameGroup);
  const deleteGroup = useMutation(api.conversations.deleteGroup);
  const sendMessage = useMutation(api.conversations.sendMessage);
  const generateUploadUrl = useMutation(api.conversations.generateUploadUrl);
  const generateProfileUploadUrl = useMutation(api.users.generateProfileUploadUrl);
  const updateProfileImage = useMutation(api.users.updateProfileImage);
  const updateProfileName = useMutation(api.users.updateProfileName);
  const setTyping = useMutation(api.conversations.setTyping);
  const markAsRead = useMutation(api.conversations.markAsRead);
  const markMessagesAsSeen = useMutation(api.conversations.markMessagesAsSeen);
  const deleteForMe = useMutation(api.conversations.deleteForMe);
  const deleteForEveryone = useMutation(api.conversations.deleteForEveryone);
  const toggleReaction = useMutation(api.conversations.toggleReaction);
  const editMessage = useMutation(api.conversations.editMessage);
  const togglePin = useMutation(api.conversations.togglePin);
  const toggleStar = useMutation(api.conversations.toggleStar);

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
    cid ? { conversationId: cid } : "skip"
  ) as MessageUi[] | undefined;
  const messageCount = messages?.length ?? 0;

  const syncCurrentUser = useCallback(async () => {
    if (!user) return;
    setSyncingProfile(true);
    setSyncError(null);
    try {
      await syncUser({
        clerkId: user.id,
        name: user.fullName || "User",
        email: user.primaryEmailAddress?.emailAddress || "",
        image: user.imageUrl,
      });
    } catch {
      setSyncError("Unable to reach chat server. Check internet/Convex URL and retry.");
    } finally {
      setSyncingProfile(false);
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
    const onOffline = () => void setOnline({ clerkId: user.id, online: false });

    onOnline();
    const ping = setInterval(() => void heartbeat({ clerkId: user.id }), PRESENCE_PING_MS);
    const visibilityHandler = () =>
      document.visibilityState === "visible" ? onOnline() : onOffline();

    document.addEventListener("visibilitychange", visibilityHandler);
    window.addEventListener("pagehide", onOffline);
    window.addEventListener("beforeunload", onOffline);

    return () => {
      clearInterval(ping);
      document.removeEventListener("visibilitychange", visibilityHandler);
      window.removeEventListener("pagehide", onOffline);
      window.removeEventListener("beforeunload", onOffline);
      onOffline();
    };
  }, [heartbeat, setOnline, user]);

  useEffect(() => {
    if (!cid || !me) return;
    void markAsRead({ conversationId: cid, userId: me._id });
    void markMessagesAsSeen({ conversationId: cid, userId: me._id });
  }, [cid, me, markAsRead, markMessagesAsSeen, messageCount]);

  useEffect(() => {
    if (!listRef.current || messageCount === 0) return;
    if (nearBottom(listRef.current)) {
      listRef.current.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
      setShowNew(false);
    } else {
      setShowNew(true);
    }
  }, [messageCount]);

  useEffect(() => {
    if (!cid || !me) return;
    return () => {
      if (typingRef.current) clearTimeout(typingRef.current);
      void setTyping({ conversationId: cid, userId: me._id, isTyping: false });
    };
  }, [cid, me, setTyping]);

  useEffect(() => {
    if (!cid || !conversations) return;
    if (!conversations.some((conversation) => conversation._id === cid)) {
      setCid(null);
      setMobileList(true);
      setText("");
      setShowNew(false);
    }
  }, [cid, conversations]);

  useEffect(() => {
    if (!menuMsgId) return;
    const close = () => setMenuMsgId(null);
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, [menuMsgId]);

  useEffect(() => {
    setRenameModalOpen(false);
    setDeleteModalOpen(false);
    setRenameValue("");
    setGroupActionBusy(false);
  }, [cid]);

  useEffect(() => {
    return () => {
      if (pendingProfilePreview) URL.revokeObjectURL(pendingProfilePreview);
    };
  }, [pendingProfilePreview]);

  const usersById = useMemo(() => {
    const map = new Map<string, UserDoc>();
    (users || []).forEach((u) => map.set(String(u._id), u));
    return map;
  }, [users]);

  const selectedConv = useMemo(
    () => conversations?.find((conversation) => conversation._id === cid) ?? null,
    [cid, conversations]
  );

  const messagesById = useMemo(() => {
    const map = new Map<string, MessageDoc>();
    (messages || []).forEach((message) => map.set(String(message._id), message));
    return map;
  }, [messages]);

  const infoMessage = infoMessageId ? messagesById.get(String(infoMessageId)) || null : null;
  const replyMessage = replyToId ? messagesById.get(String(replyToId)) || null : null;
  const forwardMessage =
    forwardMessageId ? messagesById.get(String(forwardMessageId)) || null : null;
  const title = (conversation: ConvDoc) =>
    isGroupConversation(conversation)
      ? conversation.groupName || "Unnamed Group"
      : usersById.get(
          String(conversation.participants.find((participant) => participant !== me?._id))
        )?.name || "Conversation";

  const subtitle = (conversation: ConvDoc) => {
    if (isGroupConversation(conversation)) return `${conversation.participants.length} members`;
    const other = usersById.get(
      String(conversation.participants.find((participant) => participant !== me?._id))
    );
    return other?.online ? "Online" : "Offline";
  };

  const typingText = (() => {
    if (!selectedConv?.typing?.isTyping || !me || selectedConv.typing.userId === me._id) {
      return "";
    }
    if (selectedConv.isGroup) {
      return `${usersById.get(String(selectedConv.typing.userId))?.name || "Someone"} is typing...`;
    }
    return "Typing...";
  })();
  const canManageSelectedGroup =
    !!selectedConv &&
    isGroupConversation(selectedConv) &&
    !!me &&
    selectedConv.createdBy === me._id;

  const filteredUsers = useMemo(() => {
    if (!users) return [];
    const query = search.trim().toLowerCase();
    return query ? users.filter((u) => u.name.toLowerCase().includes(query)) : users;
  }, [search, users]);

  const filteredConversations = useMemo(() => {
    if (!conversations) return [];
    const query = search.trim().toLowerCase();
    if (!query) return conversations;

    return conversations.filter((conversation) => {
      const conversationTitle = conversation.isGroup
        ? conversation.groupName || "Unnamed Group"
        : usersById.get(
            String(conversation.participants.find((participant) => participant !== me?._id))
          )?.name || "Conversation";
      return conversationTitle.toLowerCase().includes(query);
    });
  }, [conversations, me?._id, search, usersById]);
  const filteredChatConversations = useMemo(
    () => filteredConversations.filter((conversation) => !isGroupConversation(conversation)),
    [filteredConversations]
  );
  const filteredGroupConversations = useMemo(
    () => filteredConversations.filter((conversation) => isGroupConversation(conversation)),
    [filteredConversations]
  );

  const filteredGroupUsers = useMemo(() => {
    if (!users) return [];
    const query = groupSearch.trim().toLowerCase();
    if (!query) return users;
    return users.filter((u) => u.name.toLowerCase().includes(query));
  }, [groupSearch, users]);

  const openConversation = (id: Id<"conversations">) => {
    const target = conversations?.find((conversation) => conversation._id === id);
    if (target) setSidebarTab(isGroupConversation(target) ? "groups" : "chats");
    setCid(id);
    setMobileList(false);
    setSendErr(false);
    setSendRetry(null);
    setActionErr(null);
    setMenuMsgId(null);
    setEditingMessageId(null);
    setReplyToId(null);
    setSelectMode(false);
    setSelectedMessageIds([]);
    if (me) void markAsRead({ conversationId: id, userId: me._id });
  };

  const openUserChat = async (targetUser: UserDoc) => {
    if (!me) return;
    setSidebarTab("chats");
    const id = await getOrCreateConversation({ user1: me._id, user2: targetUser._id });
    openConversation(id);
  };

  const onType = (value: string) => {
    setText(value);
    if (!cid || !me) return;

    void setTyping({ conversationId: cid, userId: me._id, isTyping: true });
    if (typingRef.current) clearTimeout(typingRef.current);
    typingRef.current = setTimeout(
      () => void setTyping({ conversationId: cid, userId: me._id, isTyping: false }),
      TYPING_IDLE_MS
    );
  };

  const send = async (retry?: { text: string; cid: Id<"conversations"> }) => {
    const targetCid = retry?.cid ?? cid;
    const content = retry?.text ?? text.trim();
    if (!targetCid || !me || !content || sending) return;

    setSending(true);
    setSendErr(false);

    try {
      if (editingMessageId && !retry) {
        const edited = await editMessage({
          messageId: editingMessageId,
          userId: me._id,
          content,
        });
        if (!edited) {
          setActionErr("Could not edit message.");
          return;
        }
        setEditingMessageId(null);
        setText("");
        return;
      }

      const ok = await sendMessage({
        conversationId: targetCid,
        senderId: me._id,
        content,
        replyTo: retry ? undefined : replyToId || undefined,
        forwarded: retry ? false : undefined,
      });

      if (!ok) {
        setSendErr(true);
        setSendRetry({ cid: targetCid, text: content });
        return;
      }

      await setTyping({ conversationId: targetCid, userId: me._id, isTyping: false });
      setSendRetry(null);
      if (!retry) setText("");
      if (!retry) setReplyToId(null);
      if (listRef.current) {
        listRef.current.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
      }
      setShowNew(false);
    } catch {
      setSendErr(true);
      setSendRetry({ cid: targetCid, text: content });
    } finally {
      setSending(false);
    }
  };

  const delForEveryone = async (mid: Id<"messages">) => {
    if (!me) return;
    setActionErr(null);
    try {
      await deleteForEveryone({ messageId: mid, userId: me._id });
      setMenuMsgId(null);
    } catch {
      setActionErr("Could not delete message.");
    }
  };

  const delForMe = async (mid: Id<"messages">) => {
    if (!me) return;
    setActionErr(null);
    try {
      await deleteForMe({ messageId: mid, userId: me._id });
      setMenuMsgId(null);
    } catch {
      setActionErr("Could not delete for you.");
    }
  };

  const startEdit = (mid: Id<"messages">, content: string) => {
    setEditingMessageId(mid);
    setText(content);
    setMenuMsgId(null);
  };

  const cancelEdit = () => {
    setEditingMessageId(null);
    setText("");
  };

  const react = async (mid: Id<"messages">, emoji: string) => {
    if (!me) return;
    setActionErr(null);
    try {
      await toggleReaction({ messageId: mid, userId: me._id, emoji });
      setMenuMsgId(null);
    } catch {
      setActionErr("Could not update reaction.");
    }
  };

  const sendFile = async (file: File) => {
    if (!cid || !me || sending) return;
    setSending(true);
    setSendErr(false);
    setActionErr(null);

    try {
      const uploadUrl = await generateUploadUrl({});
      const uploadRes = await fetch(uploadUrl, {
        method: "POST",
        headers: {
          "Content-Type": file.type || "application/octet-stream",
        },
        body: file,
      });
      if (!uploadRes.ok) throw new Error("Upload failed");

      const { storageId } = (await uploadRes.json()) as { storageId: Id<"_storage"> };
      const ok = await sendMessage({
        conversationId: cid,
        senderId: me._id,
        content: text.trim(),
        attachment: {
          storageId,
          fileName: file.name,
          mimeType: file.type || "application/octet-stream",
          size: file.size,
        },
      });

      if (!ok) throw new Error("Send failed");

      setText("");
      setReplyToId(null);
      if (listRef.current) {
        listRef.current.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
      }
      setShowNew(false);
    } catch {
      setSendErr(true);
      setActionErr("Could not upload file.");
    } finally {
      setSending(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const onPickFile = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    void sendFile(file);
  };

  const resetPendingProfileImage = () => {
    if (pendingProfilePreview) URL.revokeObjectURL(pendingProfilePreview);
    setPendingProfilePreview(null);
    setPendingProfileFile(null);
    if (profileInputRef.current) profileInputRef.current.value = "";
  };

  const onPickProfileImage = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;
    if (!file.type.startsWith("image/")) {
      setActionErr("Please select an image file.");
      return;
    }

    setActionErr(null);
    if (pendingProfilePreview) URL.revokeObjectURL(pendingProfilePreview);
    const localUrl = URL.createObjectURL(file);
    setPendingProfileFile(file);
    setPendingProfilePreview(localUrl);
    if (contactDrawer?.canEdit) {
      setContactDrawer((prev) => (prev ? { ...prev, image: localUrl } : prev));
    }
  };

  const onSaveProfileImage = async () => {
    if (!pendingProfileFile || !user || profileSaving) return;
    setActionErr(null);
    setProfileSaving(true);
    try {
      const uploadUrl = await generateProfileUploadUrl({});
      const uploadRes = await fetch(uploadUrl, {
        method: "POST",
        headers: {
          "Content-Type": pendingProfileFile.type || "application/octet-stream",
        },
        body: pendingProfileFile,
      });
      if (!uploadRes.ok) throw new Error("Upload failed");

      const { storageId } = (await uploadRes.json()) as { storageId: Id<"_storage"> };
      const ok = await updateProfileImage({ clerkId: user.id, storageId });
      if (!ok) throw new Error("Update failed");

      resetPendingProfileImage();
    } catch {
      setActionErr("Could not update profile photo.");
    } finally {
      setProfileSaving(false);
    }
  };

  const onCancelProfileImage = () => {
    resetPendingProfileImage();
    if (contactDrawer?.canEdit && me) {
      setContactDrawer((prev) => (prev ? { ...prev, image: me.image } : prev));
    }
  };

  const onUpdateProfileName = async (name: string) => {
    if (!user) return false;
    setActionErr(null);
    try {
      const ok = await updateProfileName({
        clerkId: user.id,
        name,
      });
      if (!ok) throw new Error("Update failed");
      if (contactDrawer?.canEdit) {
        setContactDrawer((prev) => (prev ? { ...prev, name: name.trim() } : prev));
      }
      return true;
    } catch {
      setActionErr("Could not update profile name.");
      return false;
    }
  };

  const addMoreReaction = async (mid: Id<"messages">) => {
    const value = window.prompt(`Choose reaction: ${REACTIONS.join(" ")}`);
    if (!value) return;
    if (!REACTIONS.includes(value as (typeof REACTIONS)[number])) {
      setActionErr("Use one of the allowed reactions.");
      return;
    }
    await react(mid, value);
  };

  const openInfo = (mid: Id<"messages">) => {
    setInfoMessageId(mid);
    setMenuMsgId(null);
  };

  const startReply = (mid: Id<"messages">) => {
    setReplyToId(mid);
    setMenuMsgId(null);
  };

  const openForward = (mid: Id<"messages">) => {
    setForwardMessageId(mid);
    setForwardOpen(true);
    setMenuMsgId(null);
  };

  const forwardToConversation = async (targetConversationId: Id<"conversations">) => {
    if (!forwardMessage || !me) return;
    await sendMessage({
      conversationId: targetConversationId,
      senderId: me._id,
      content: forwardMessage.content,
      forwarded: true,
    });
    setForwardOpen(false);
    setForwardMessageId(null);
  };

  const forwardToUser = async (targetUser: UserDoc) => {
    if (!me || !forwardMessage) return;
    const targetConversationId = await getOrCreateConversation({
      user1: me._id,
      user2: targetUser._id,
    });
    await forwardToConversation(targetConversationId);
  };

  const onTogglePin = async (mid: Id<"messages">) => {
    if (!me) return;
    await togglePin({ messageId: mid, userId: me._id });
    setMenuMsgId(null);
  };

  const onToggleStar = async (mid: Id<"messages">) => {
    if (!me) return;
    await toggleStar({ messageId: mid, userId: me._id });
    setMenuMsgId(null);
  };

  const toggleSelectMode = (mid: Id<"messages">) => {
    setSelectMode(true);
    setSelectedMessageIds((prev) =>
      prev.includes(mid) ? prev.filter((id) => id !== mid) : [...prev, mid]
    );
    setMenuMsgId(null);
  };

  const toggleSelectedMessage = (mid: Id<"messages">) => {
    if (!selectMode) return;
    setSelectedMessageIds((prev) =>
      prev.includes(mid) ? prev.filter((id) => id !== mid) : [...prev, mid]
    );
  };

  const cancelSelectMode = () => {
    setSelectMode(false);
    setSelectedMessageIds([]);
  };

  const deleteSelectedForMe = async () => {
    if (!me || selectedMessageIds.length === 0) return;
    for (const mid of selectedMessageIds) {
      await deleteForMe({ messageId: mid, userId: me._id });
    }
    cancelSelectMode();
  };

  const copySelectedMessages = async () => {
    if (selectedMessageIds.length === 0) return;
    const selected = (messages || [])
      .filter((message) => selectedMessageIds.includes(message._id))
      .map((message) => message.content)
      .join("\n");
    await navigator.clipboard.writeText(selected);
    cancelSelectMode();
  };

  const copyMessage = async (content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setMenuMsgId(null);
    } catch {
      setActionErr("Could not copy message.");
    }
  };

  const toggleGroupMember = (uid: Id<"users">) =>
    setGroupMembers((prev) => (prev.includes(uid) ? prev.filter((x) => x !== uid) : [...prev, uid]));

  const openContactDrawer = (payload: ContactDrawerData) => {
    resetPendingProfileImage();
    setContactDrawer(payload);
  };
  const closeContactDrawer = () => {
    resetPendingProfileImage();
    setContactDrawer(null);
  };

  const createGroup = async () => {
    if (!me) return;
    if (!groupName.trim()) {
      setGroupErr("Enter a group name.");
      return;
    }
    if (groupMembers.length < 2) {
      setGroupErr("Select at least 2 members.");
      return;
    }

    setGroupBusy(true);
    setGroupErr(null);
    try {
      const id = await createGroupConversation({
        creatorId: me._id,
        memberIds: groupMembers,
        groupName: groupName.trim(),
      });
      if (!id) {
        setGroupErr("Could not create group.");
        return;
      }
      setSidebarTab("groups");
      setGroupOpen(false);
      setGroupName("");
      setGroupSearch("");
      setGroupMembers([]);
      openConversation(id);
    } catch {
      setGroupErr("Could not create group.");
    } finally {
      setGroupBusy(false);
    }
  };

  const onRenameSelectedGroup = async () => {
    if (!selectedConv || !me || !isGroupConversation(selectedConv)) return;
    setRenameValue(selectedConv.groupName || "");
    setRenameModalOpen(true);
  };

  const confirmRenameSelectedGroup = async () => {
    if (!selectedConv || !me || !isGroupConversation(selectedConv) || groupActionBusy) return;
    setGroupActionBusy(true);
    const ok = await renameGroup({
      conversationId: selectedConv._id,
      userId: me._id,
      groupName: renameValue,
    });
    if (!ok) {
      setActionErr("Could not rename group.");
    } else {
      setRenameModalOpen(false);
    }
    setGroupActionBusy(false);
  };

  const onDeleteSelectedGroup = async () => {
    if (!selectedConv || !me || !isGroupConversation(selectedConv)) return;
    setDeleteModalOpen(true);
  };

  const confirmDeleteSelectedGroup = async () => {
    if (!selectedConv || !me || !isGroupConversation(selectedConv) || groupActionBusy) return;
    setGroupActionBusy(true);
    const ok = await deleteGroup({
      conversationId: selectedConv._id,
      userId: me._id,
    });
    if (!ok) {
      setActionErr("Could not delete group.");
      setGroupActionBusy(false);
      return;
    }

    setDeleteModalOpen(false);
    setCid(null);
    setMobileList(true);
    setText("");
    setReplyToId(null);
    setMenuMsgId(null);
    setShowNew(false);
    setGroupActionBusy(false);
  };

  if (!isLoaded || !user) {
    return (
      <div className="flex h-[100dvh] items-center justify-center bg-[#0b141a]">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#16a34a] border-t-transparent" />
      </div>
    );
  }

  const loadingData = users === undefined || me === undefined || (!!me && conversations === undefined);
  const loadingMessages = !!cid && messages === undefined;

  return (
    <div className="flex h-[100dvh] w-full flex-col overflow-hidden bg-[linear-gradient(165deg,#16222d_0%,#0f1a23_45%,#090f15_100%)] text-gray-100 md:grid md:grid-cols-[420px_1fr]">
      <Sidebar
        activeTab={sidebarTab}
        onTabChange={setSidebarTab}
        mobileList={mobileList}
        me={me}
        syncingProfile={syncingProfile}
        syncError={syncError}
        currentUserMissing={me === null}
        onRetrySync={() => void syncCurrentUser()}
        search={search}
        onSearchChange={setSearch}
        onOpenGroup={() => setGroupOpen(true)}
        loadingData={loadingData}
        chatConversations={filteredChatConversations}
        groupConversations={filteredGroupConversations}
        filteredUsers={filteredUsers}
        selectedConversationId={cid}
        usersById={usersById}
        title={title}
        subtitle={subtitle}
        isGroupConversation={isGroupConversation}
        onOpenConversation={openConversation}
        onOpenUserChat={(u) => void openUserChat(u)}
        onOpenContactDrawer={openContactDrawer}
      />

      <ChatMainPanel
        mobileList={mobileList}
        selectedConv={selectedConv}
        me={me}
        canManageSelectedGroup={canManageSelectedGroup}
        usersById={usersById}
        title={title}
        subtitle={subtitle}
        isGroupConversation={isGroupConversation}
        typingText={typingText}
        onBack={() => setMobileList(true)}
        onOpenContactDrawer={openContactDrawer}
        onRenameGroup={onRenameSelectedGroup}
        onDeleteGroup={onDeleteSelectedGroup}
        listRef={listRef}
        loadingMessages={loadingMessages}
        messages={messages}
        messagesById={messagesById}
        menuMsgId={menuMsgId}
        onToggleMenu={setMenuMsgId}
        selectMode={selectMode}
        selectedMessageIds={selectedMessageIds}
        onToggleSelectedMessage={toggleSelectedMessage}
        onReact={react}
        onAddMoreReaction={addMoreReaction}
        onOpenInfo={openInfo}
        onStartReply={startReply}
        onCopyMessage={copyMessage}
        onOpenForward={openForward}
        onTogglePin={onTogglePin}
        onToggleStar={onToggleStar}
        onStartEdit={startEdit}
        onToggleSelectMode={toggleSelectMode}
        onDeleteForMe={delForMe}
        onDeleteForEveryone={delForEveryone}
        onOpenImagePreview={(url, name) => {
          setImagePreviewUrl(url);
          setImagePreviewName(name);
        }}
        onNearBottom={() => setShowNew(false)}
        showNew={showNew}
        onScrollToLatest={() => {
          if (!listRef.current) return;
          listRef.current.scrollTo({
            top: listRef.current.scrollHeight,
            behavior: "smooth",
          });
          setShowNew(false);
        }}
        onCopySelectedMessages={copySelectedMessages}
        onDeleteSelectedForMe={deleteSelectedForMe}
        onCancelSelectMode={cancelSelectMode}
        actionErr={actionErr}
        sendErr={sendErr}
        sendRetry={sendRetry}
        onRetrySend={send}
        onDismissSendError={() => {
          setSendErr(false);
          setSendRetry(null);
        }}
        replyMessage={replyMessage}
        onClearReply={() => setReplyToId(null)}
        editingMessageId={editingMessageId}
        onCancelEdit={cancelEdit}
        fileInputRef={fileInputRef}
        onPickFile={onPickFile}
        text={text}
        onType={onType}
        onSend={() => send()}
        sending={sending}
      />

      <ChatOverlays
        infoMessage={infoMessage}
        usersById={usersById}
        formatTimestamp={formatTimestamp}
        onCloseInfo={() => setInfoMessageId(null)}
        forwardOpen={forwardOpen}
        conversations={conversations || []}
        users={users || []}
        title={title}
        onForwardToConversation={forwardToConversation}
        onForwardToUser={forwardToUser}
        onCloseForward={() => {
          setForwardOpen(false);
          setForwardMessageId(null);
        }}
        contactDrawer={contactDrawer}
        onCloseContactDrawer={closeContactDrawer}
        profileInputRef={profileInputRef}
        onPickProfileImage={onPickProfileImage}
        hasPendingProfileImage={!!pendingProfileFile}
        profileSaving={profileSaving}
        onSaveProfileImage={onSaveProfileImage}
        onCancelProfileImage={onCancelProfileImage}
        onUpdateProfileName={onUpdateProfileName}
        imagePreviewUrl={imagePreviewUrl}
        imagePreviewName={imagePreviewName}
        onCloseImagePreview={() => setImagePreviewUrl(null)}
        renameModalOpen={renameModalOpen}
        renameValue={renameValue}
        onRenameValueChange={setRenameValue}
        onCloseRenameModal={() => setRenameModalOpen(false)}
        onConfirmRenameGroup={confirmRenameSelectedGroup}
        groupActionBusy={groupActionBusy}
        deleteModalOpen={deleteModalOpen}
        onCloseDeleteModal={() => setDeleteModalOpen(false)}
        onConfirmDeleteGroup={confirmDeleteSelectedGroup}
        groupOpen={groupOpen}
        groupName={groupName}
        onGroupNameChange={setGroupName}
        groupSearch={groupSearch}
        onGroupSearchChange={setGroupSearch}
        filteredGroupUsers={filteredGroupUsers}
        groupMembers={groupMembers}
        onToggleGroupMember={toggleGroupMember}
        groupErr={groupErr}
        groupBusy={groupBusy}
        onCloseGroupModal={() => {
          setGroupOpen(false);
          setGroupErr(null);
          setGroupSearch("");
        }}
        onCreateGroup={createGroup}
      />
    </div>
  );
}

