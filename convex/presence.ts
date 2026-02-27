import { mutation, type MutationCtx } from "./_generated/server";
import { v } from "convex/values";

async function requireAuthClerkId(ctx: MutationCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new Error("Unauthorized");
  return identity.subject;
}

export const setOnlineStatus = mutation({
  args: {
    clerkId: v.string(),
    online: v.boolean(),
  },
  handler: async (ctx, args) => {
    const authClerkId = await requireAuthClerkId(ctx);
    if (args.clerkId !== authClerkId) {
      throw new Error("Forbidden");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", authClerkId))
      .unique();

    if (!user) return;

    await ctx.db.patch(user._id, {
      online: args.online,
      lastActiveAt: Date.now(),
    });
  },
});

export const heartbeat = mutation({
  args: {
    clerkId: v.string(),
  },
  handler: async (ctx, args) => {
    const authClerkId = await requireAuthClerkId(ctx);
    if (args.clerkId !== authClerkId) {
      throw new Error("Forbidden");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", authClerkId))
      .unique();

    if (!user) return;

    await ctx.db.patch(user._id, {
      online: true,
      lastActiveAt: Date.now(),
    });
  },
});

export const setTyping = mutation({
  args: {
    conversationId: v.id("conversations"),
    userId: v.id("users"),
    isTyping: v.boolean(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const me = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique();
    if (!me) throw new Error("User profile not found");

    if (args.userId !== me._id) {
      throw new Error("Forbidden");
    }

    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation) return;
    if (!conversation.participants.includes(args.userId)) return;

    await ctx.db.patch(conversation._id, {
      typing: {
        userId: args.userId,
        isTyping: args.isTyping,
        updatedAt: Date.now(),
      },
    });
  },
});
