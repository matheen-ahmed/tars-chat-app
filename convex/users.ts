import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

const ONLINE_WINDOW_MS = 30_000;

export const syncUser = mutation({
  args: {
    clerkId: v.string(),
    name: v.string(),
    email: v.string(),
    image: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
      .unique();

    if (!existing) {
      await ctx.db.insert("users", {
        clerkId: args.clerkId,
        name: args.name,
        email: args.email,
        image: args.image ?? "",
        online: true,
        lastActiveAt: Date.now(),
      });
    } else {
      await ctx.db.patch(existing._id, {
        name: args.name,
        email: args.email,
        image: args.image ?? existing.image,
        online: true,
        lastActiveAt: Date.now(),
      });
    }

    return true;
  },
});

export const getUsers = query({
  args: {
    clerkId: v.string(),
  },
  handler: async (ctx, args) => {
    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
      .unique();

    if (!currentUser) return [];

    const users = await ctx.db.query("users").collect();
    const now = Date.now();

    return users
      .filter((user) => user._id !== currentUser._id)
      .map((user) => ({
        ...user,
        online: user.online && !!user.lastActiveAt && now - user.lastActiveAt < ONLINE_WINDOW_MS,
      }));
  },
});

export const getCurrentUser = query({
  args: {
    clerkId: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
      .unique();
  },
});

export const setOnlineStatus = mutation({
  args: {
    clerkId: v.string(),
    online: v.boolean(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
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
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
      .unique();

    if (!user) return;

    await ctx.db.patch(user._id, {
      online: true,
      lastActiveAt: Date.now(),
    });
  },
});
