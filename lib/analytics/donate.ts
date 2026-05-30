export type DonateAnalyticsEvent =
  | "donate_view"
  | "donate_start"
  | "donate_success"
  | "donate_cancel";

export function trackDonate(
  event: DonateAnalyticsEvent,
  props?: Record<string, string | number | boolean>
) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent("mibegnon-analytics", {
      detail: { event, ...props },
    })
  );
  if (process.env.NODE_ENV === "development") {
    console.debug("[analytics]", event, props);
  }
}
