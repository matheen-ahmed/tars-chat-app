const ONLINE_WINDOW_MS = 30_000;

export const isUserOnline = (
  online: boolean,
  lastActiveAt: number | undefined,
  now: number,
): boolean => online && !!lastActiveAt && now - lastActiveAt < ONLINE_WINDOW_MS;
