"use client";

import dynamic from "next/dynamic";

// Lazy-load Chao after hydration — off the critical path for first paint.
const ChaoWidget = dynamic(
  () => import("./chao-widget").then((m) => m.ChaoWidget),
  { ssr: false }
);

export default function ChaoWidgetLoader() {
  return <ChaoWidget />;
}
