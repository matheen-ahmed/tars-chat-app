import { mutation, query, type MutationCtx, type QueryCtx } from "./_generated/server";
import { v } from "convex/values";
import type { LastSeenEntry } from "./utils/conversationUtils";
import { upsertLastSeen } from "./utils/conversationUtils";

async function requireAuthUser(ctx: QueryCtx | MutationCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new Error("Unauthorized");

  const me = await ctx.db
    .query("users")
    .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
    .unique();
  if (!me) throw new Error("User profile not found");
  return me;
}

export const getMessages = query({
  args: {
    conversationId: v.id("conversations"),
  },
  handler: async (ctx, args) => {
    const me = await requireAuthUser(ctx);
    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation) return [];
    if (!conversation.participants.includes(me._id)) {
      throw new Error("Forbidden");
    }

    const messages = await ctx.db
      .query("messages")
      .withIndex("by_conversation_createdAt", (q) =>
        q.eq("conversationId", args.conversationId),
      )
      .collect();

    return messages;
  },
});

export const sendMessage = mutation({
  args: {
    conversationId: v.id("conversations"),
    senderId: v.id("users"),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const me = await requireAuthUser(ctx);
    if (args.senderId !== me._id) {
      throw new Error("Forbidden");
    }

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
    const me = await requireAuthUser(ctx);
    if (args.userId !== me._id) {
      throw new Error("Forbidden");
    }

    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation) return;
    if (!conversation.participants.includes(args.userId)) return;

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
