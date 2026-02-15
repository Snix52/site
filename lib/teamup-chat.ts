export const TEAMUP_CHAT_CHANNEL_PREFIX = "private-teamup-post-";
export const TEAMUP_CHAT_EVENT = "new-message";
export const TEAMUP_CHAT_MAX_MESSAGE_LENGTH = 500;
export const TEAMUP_CHAT_HISTORY_LIMIT = 60;
export const TEAMUP_CHAT_RATE_LIMIT_WINDOW_MS = 60 * 1000;
export const TEAMUP_CHAT_RATE_LIMIT_MAX = 20;

export function getTeamupChatChannelName(postId: string): string {
  return `${TEAMUP_CHAT_CHANNEL_PREFIX}${postId}`;
}

export function getPostIdFromTeamupChannel(channelName: string): string | null {
  if (!channelName.startsWith(TEAMUP_CHAT_CHANNEL_PREFIX)) return null;

  const postId = channelName.slice(TEAMUP_CHAT_CHANNEL_PREFIX.length).trim();
  return postId.length > 0 ? postId : null;
}
