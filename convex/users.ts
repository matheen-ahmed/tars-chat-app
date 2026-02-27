import { mutation, query, type MutationCtx, type QueryCtx } from "./_generated/server";
import { v } from "convex/values";
import { isUserOnline } from "./utils/presenceUtils";

async function requireAuthClerkId(ctx: QueryCtx | MutationCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new Error("Unauthorized");
  return identity.subject;
}

export const syncUser = mutation({
  args: {
    clerkId: v.string(),
    name: v.string(),
    email: v.string(),
    image: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const authClerkId = await requireAuthClerkId(ctx);
    if (args.clerkId !== authClerkId) {
      throw new Error("Forbidden");
    }

    const existing = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", authClerkId))
      .unique();

    if (!existing) {
      await ctx.db.insert("users", {
        clerkId: authClerkId,
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
    const authClerkId = await requireAuthClerkId(ctx);
    if (args.clerkId !== authClerkId) {
      throw new Error("Forbidden");
    }

    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", authClerkId))
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
    const authClerkId = await requireAuthClerkId(ctx);
    if (args.clerkId !== authClerkId) {
      throw new Error("Forbidden");
    }

    return await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", authClerkId))
      .unique();
  },
});

// Backward-compatible exports; canonical module is ./presence.
export { heartbeat, setOnlineStatus } from "./presence";
