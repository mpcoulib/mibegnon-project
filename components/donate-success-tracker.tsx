"use client";

import { useEffect } from "react";
import { trackDonate } from "@/lib/analytics/donate";

export function DonateSuccessTracker({ sessionId }: { sessionId?: string }) {
  useEffect(() => {
    trackDonate("donate_success", { sessionId: sessionId ?? "" });
  }, [sessionId]);
  return null;
}
