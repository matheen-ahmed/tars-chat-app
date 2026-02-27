# QuickChat (Next.js + Convex + Clerk)

QuickChat is a real-time one-to-one chat application built with Next.js App Router, Convex, and Clerk authentication. It includes presence indicators, typing status, unread tracking, and a mobile-friendly chat interface.

## What this project does

- Authenticates users with Clerk (sign up, sign in, sign out)
- Syncs authenticated users into Convex user records
- Lets users start direct conversations from the user list
- Sends and receives messages in real time
- Shows online/offline presence and last active status
- Shows typing indicators and unread message counts
- Marks messages as read when a chat is visible
- Supports responsive chat layout for desktop and mobile

## Tech stack

- Next.js 16 (App Router)
- React 19 + TypeScript
- Convex (database + realtime queries/mutations)
- Clerk (authentication)
- Tailwind CSS 4
- Framer Motion + Lucide icons

## Project structure

```text
app/
  page.tsx                 # Landing page (signed-in/signed-out states)
  layout.tsx               # Clerk + Convex providers
  chat/
    page.tsx               # Main chat screen
    hooks/useChatController.ts
    components/            # Sidebar, chat panel, avatars, presence UI
convex/
  schema.ts                # users, conversations, messages tables
  users.ts                 # user sync + online/heartbeat
  conversations.ts         # conversation + messaging logic
  presence.ts              # presence-related backend actions
proxy.ts                   # Clerk middleware route protection
```

## Environment variables

Create a `.env.local` file in the project root:

```env
# Convex
NEXT_PUBLIC_CONVEX_URL=your_convex_deployment_url

# Clerk (required by Clerk middleware/provider)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_publishable_key
CLERK_SECRET_KEY=your_secret_key

# Optional: admin behavior in convex/admin.ts
ADMIN_CLERK_ID=your_clerk_user_id
```

## Getting started

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables in `.env.local`.

3. Start the Next.js app:
```bash
npm run dev
```

4. Open:
```text
http://localhost:3000
```

## Available scripts

- `npm run dev` - Start development server (webpack mode)
- `npm run dev:turbo` - Start development server (turbopack)
- `npm run build` - Build for production
- `npm run start` - Run production server
- `npm run lint` - Run ESLint

## Notes

- If `NEXT_PUBLIC_CONVEX_URL` is missing/invalid, the app shows a configuration error screen.
- Chat functionality depends on Convex functions and schema in the `convex/` directory.
- This codebase currently focuses on direct (1:1) conversations.
