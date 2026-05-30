"use client";

import { Turnstile, type TurnstileInstance } from "@marsidev/react-turnstile";
import { useRef } from "react";

type Props = {
  onToken: (token: string) => void;
  onExpire?: () => void;
};

export function TurnstileField({ onToken, onExpire }: Props) {
  const ref = useRef<TurnstileInstance>(null);
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

  if (!siteKey) {
    if (process.env.NODE_ENV === "production") {
      return (
        <p className="text-sm text-red-600" role="alert">
          Vérification anti-spam indisponible. Réessaie plus tard.
        </p>
      );
    }
    return (
      <p className="text-xs text-slate-400">
        Turnstile non configuré (dev) — la soumission passera sans captcha.
      </p>
    );
  }

  return (
    <Turnstile
      ref={ref}
      siteKey={siteKey}
      onSuccess={onToken}
      onExpire={() => {
        ref.current?.reset();
        onExpire?.();
      }}
      onError={() => {
        ref.current?.reset();
        onExpire?.();
      }}
      options={{ theme: "light", size: "normal" }}
    />
  );
}
