"use client";

import { useEffect } from "react";
import { trackDonate } from "@/lib/analytics/donate";

export function DonateCancelTracker() {
  useEffect(() => {
    trackDonate("donate_cancel");
  }, []);
  return null;
}
