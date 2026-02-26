import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import type { LastSeenEntry } from "./utils/conversationUtils";
import { upsertLastSeen } from "./utils/conversationUtils";

export const getMessages = query({
  args: {
    conversationId: v.id("conversations"),
  },
  handler: async (ctx, args) => {
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_conversation", (q) => q.eq("conversationId", args.conversationId))
      .collect();

    return messages.sort((a, b) => a.createdAt - b.createdAt);
  },
});

export const sendMessage = mutation({
  args: {
    conversationId: v.id("conversations"),
    senderId: v.id("users"),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation) return null;
    if (!conversation.participants.includes(args.senderId)) return null;

    const trimmedContent = args.content.trim();
    if (!trimmedContent) return null;

    const now = Date.now();

    const messageId = await ctx.db.insert("messages", {
      conversationId: conversation._id,
      senderId: args.senderId,
      content: trimmedContent,
      createdAt: now,
      seenBy: [args.senderId],
    });

    await ctx.db.patch(conversation._id, {
      lastMessage: trimmedContent,
      lastMessageTime: now,
      lastSeen: upsertLastSeen(conversation.lastSeen as LastSeenEntry[] | undefined, args.senderId, now),
      typing: {
        userId: args.senderId,
        isTyping: false,
        updatedAt: now,
      },
    });

    return messageId;
  },
});

export const markAsRead = mutation({
  args: {
    conversationId: v.id("conversations"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation) return;

    const now = Math.max(Date.now(), conversation.lastMessageTime ?? 0);
    const updatedLastSeen = upsertLastSeen(
      conversation.lastSeen as LastSeenEntry[] | undefined,
      args.userId,
      now,
    );

    await ctx.db.patch(args.conversationId, {
      lastSeen: updatedLastSeen,
    });
  },
});
