import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { isUserOnline } from "./utils/presenceUtils";

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
        online: isUserOnline(user.online, user.lastActiveAt, now),
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

// Backward-compatible exports; canonical module is ./presence.
export { heartbeat, setOnlineStatus } from "./presence";
