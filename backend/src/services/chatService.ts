import { leagueStore } from "../lib/leagueStore";
import { LeagueRequestError } from "./leaguesService";
import type { ChatMessage } from "../types/chat";

const requireValue = (value: string | undefined, fieldName: string): string => {
  const trimmed = value?.trim();
  if (!trimmed) {
    throw new LeagueRequestError(`Query parameter ${fieldName} is required`, 400);
  }

  return trimmed;
};

export const chatService = {
  listMessages(input: { leagueId?: string; userId?: string }): ChatMessage[] {
    const leagueId = requireValue(input.leagueId, "leagueId");
    const userId = requireValue(input.userId, "userId");
    const messages = leagueStore.listChatMessagesForUser(leagueId, userId);

    if (!messages) {
      throw new LeagueRequestError("Chat messages not found", 404);
    }

    return messages;
  },

  postMessage(input: {
    leagueId?: string;
    userId?: string;
    text?: string;
  }): ChatMessage[] {
    const leagueId = requireValue(input.leagueId, "leagueId");
    const userId = requireValue(input.userId, "userId");
    const text = input.text?.trim();

    if (!text) {
      throw new LeagueRequestError("Message cannot be empty", 400);
    }

    const messages = leagueStore.postChatMessageForUser(
      leagueId,
      userId,
      text.slice(0, 1200),
    );

    if (!messages) {
      throw new LeagueRequestError("Chat messages not found", 404);
    }

    return messages;
  },
};
