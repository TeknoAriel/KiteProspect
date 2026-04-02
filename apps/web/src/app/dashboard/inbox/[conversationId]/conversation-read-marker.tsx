"use client";

import { useEffect, useRef } from "react";
import { markConversationReadAction } from "./mark-conversation-read-action";

type Props = { conversationId: string };

export function ConversationReadMarker({ conversationId }: Props) {
  const done = useRef(false);

  useEffect(() => {
    if (done.current) return;
    done.current = true;
    void markConversationReadAction(conversationId);
  }, [conversationId]);

  return null;
}
