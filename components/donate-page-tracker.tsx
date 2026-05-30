"use client";

import { useEffect } from "react";
import { trackDonate } from "@/lib/analytics/donate";

export function DonatePageTracker() {
  useEffect(() => {
    trackDonate("donate_view");
  }, []);
  return null;
}
