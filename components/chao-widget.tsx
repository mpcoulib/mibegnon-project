"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { Maximize2, Minimize2, Send, X } from "lucide-react";
import { cn } from "@/lib/utils";

type Role = "user" | "assistant";

interface Message {
  role: Role;
  content: string;
}

const WELCOME: Message = {
  role: "assistant",
  content:
    "Bonjour mon petit ! Je suis Chao, ton grand-père conseiller sur Mibegnon. Tu cherches une bourse, un pays, ou tu ne sais pas par où commencer ? On est ensemble, dêh !",
};

export function ChaoWidget() {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const launcherRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [messages, setMessages] = useState<Message[]>([WELCOME]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [gated, setGated] = useState(false);
  const [remaining, setRemaining] = useState<number | null>(3);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const scrollToBottom = useCallback(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, []);

  useEffect(() => {
    if (open) scrollToBottom();
  }, [open, messages, scrollToBottom]);

  useEffect(() => {
    if (!open) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        launcherRef.current?.focus();
      }
    };

    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const panel = panelRef.current;
    if (!panel) return;

    const focusable = panel.querySelectorAll<HTMLElement>(
      'button, [href], textarea, input, select, [tabindex]:not([tabindex="-1"])'
    );
    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    const trap = (e: KeyboardEvent) => {
      if (e.key !== "Tab" || focusable.length === 0) return;
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        }
      } else if (document.activeElement === last) {
        e.preventDefault();
        first?.focus();
      }
    };

    panel.addEventListener("keydown", trap);
    inputRef.current?.focus();

    return () => panel.removeEventListener("keydown", trap);
  }, [open]);

  async function sendMessage() {
    const text = input.trim();
    if (!text || streaming || gated) return;

    setError(null);
    setInput("");
    const userMsg: Message = { role: "user", content: text };
    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setStreaming(true);

    const assistantIdx = nextMessages.length;
    setMessages([...nextMessages, { role: "assistant", content: "" }]);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: nextMessages }),
      });

      const contentType = res.headers.get("content-type") ?? "";

      if (contentType.includes("application/json")) {
        const data = await res.json();
        if (data.gated) {
          setGated(true);
          setRemaining(data.remaining ?? 0);
          // Retirer le message utilisateur en attente + la bulle assistant vide
          setMessages((prev) => prev.slice(0, -2));
          return;
        }
        if (data.error) {
          setError(data.error);
          setMessages((prev) => prev.slice(0, -2));
          return;
        }
      }

      if (!res.ok || !res.body) {
        setError("Impossible de joindre Chao. Réessaie.");
        setMessages((prev) => prev.slice(0, -2));
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const parts = buffer.split("\n\n");
        buffer = parts.pop() ?? "";

        for (const part of parts) {
          const line = part.trim();
          if (!line.startsWith("data:")) continue;
          try {
            const payload = JSON.parse(line.slice(5).trim()) as {
              type: string;
              text?: string;
              remaining?: number | null;
              isLoggedIn?: boolean;
              message?: string;
            };

            if (payload.type === "meta") {
              if (payload.remaining !== undefined && payload.remaining !== null) {
                setRemaining(payload.remaining);
              }
              if (payload.isLoggedIn) setIsLoggedIn(true);
            } else if (payload.type === "delta" && payload.text) {
              setMessages((prev) => {
                const copy = [...prev];
                const cur = copy[assistantIdx];
                if (cur?.role === "assistant") {
                  copy[assistantIdx] = {
                    role: "assistant",
                    content: cur.content + payload.text,
                  };
                }
                return copy;
              });
            } else if (payload.type === "error") {
              setError(payload.message ?? "Erreur");
            } else if (payload.type === "done") {
              setMessages((prev) => {
                const copy = [...prev];
                const cur = copy[assistantIdx];
                if (cur?.role === "assistant" && !cur.content) {
                  copy[assistantIdx] = {
                    role: "assistant",
                    content:
                      "Je n'ai pas pu finir ma réponse. Essaie encore une fois, dêh !",
                  };
                }
                return copy;
              });
            }
          } catch {
            /* ignore malformed SSE */
          }
        }
      }
    } catch {
      setError("Connexion interrompue. Vérifie ton réseau.");
      setMessages((prev) => prev.slice(0, -2));
    } finally {
      setStreaming(false);
      scrollToBottom();
    }
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    void sendMessage();
  }

  return (
    <>
      {open && (
        <div
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          className={cn(
            "fixed z-50 flex flex-col overflow-hidden bg-white shadow-2xl transition-all",
            expanded
              ? "inset-0 rounded-none"
              : "bottom-24 right-4 w-[min(100vw-2rem,380px)] rounded-2xl border border-slate-200"
          )}
        >
          <header className="flex items-center gap-3 bg-[var(--primary)] px-4 py-3 text-white">
            <Image
              src="/chao-avatar.png"
              alt=""
              width={44}
              height={44}
              unoptimized
              className="h-11 w-11 rounded-full border-2 border-white/30 object-cover"
            />
            <div className="min-w-0 flex-1">
              <h2 id={titleId} className="font-semibold leading-tight">
                Chao
              </h2>
              <p className="text-xs text-white/70 truncate">
                Ton grand-père conseiller bourses
              </p>
            </div>
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              className="rounded-lg p-1.5 hover:bg-white/10"
              aria-label={expanded ? "Réduire la discussion" : "Agrandir la discussion"}
            >
              {expanded ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
            </button>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                launcherRef.current?.focus();
              }}
              className="rounded-lg p-1.5 hover:bg-white/10"
              aria-label="Fermer la discussion"
            >
              <X size={18} />
            </button>
          </header>

          <div
            ref={listRef}
            className={cn(
              "flex flex-col gap-3 overflow-y-auto px-4 py-3 transition-all",
              expanded
                ? "min-h-0 flex-1 w-full max-w-2xl mx-auto"
                : "max-h-[min(50vh,320px)]"
            )}
            aria-live="polite"
          >
            {messages.map((m, i) => (
              <div
                key={i}
                className={cn(
                  "max-w-[90%] rounded-2xl px-3 py-2 text-sm leading-relaxed",
                  m.role === "user"
                    ? "ml-auto bg-[var(--primary)] text-white"
                    : "mr-auto bg-slate-100 text-slate-700"
                )}
              >
                {m.content ? (
                  <MessageContent text={m.content} />
                ) : streaming && i === messages.length - 1 ? (
                  <span className="inline-flex gap-1">
                    <span className="animate-pulse">●</span>
                    <span className="animate-pulse delay-75">●</span>
                    <span className="animate-pulse delay-150">●</span>
                  </span>
                ) : null}
              </div>
            ))}
          </div>

          {error && (
            <p className="px-4 text-xs text-red-600" role="alert">
              {error}
            </p>
          )}

          <footer
            className={cn(
              "border-t border-slate-100 p-3",
              expanded && "mx-auto w-full max-w-2xl"
            )}
          >
            {gated ? (
              <div className="space-y-3 text-center">
                <p className="text-sm text-slate-600">
                  Tu as utilisé tes {3} messages gratuits avec Chao. Crée un compte
                  pour continuer — c&apos;est gratuit, on est ensemble !
                </p>
                <ButtonLink href="/inscription">Créer mon compte</ButtonLink>
                <p className="text-xs text-slate-400">
                  Déjà inscrit ?{" "}
                  <Link href="/connexion" className="text-[var(--primary)] underline">
                    Se connecter
                  </Link>
                </p>
              </div>
            ) : (
              <>
                {!isLoggedIn && remaining !== null && (
                  <p className="mb-2 text-center text-xs text-slate-400">
                    {remaining > 0
                      ? `${remaining} message${remaining > 1 ? "s" : ""} gratuit${remaining > 1 ? "s" : ""} restant${remaining > 1 ? "s" : ""}`
                      : "Dernier message gratuit"}
                  </p>
                )}
                <form onSubmit={onSubmit} className="flex gap-2">
                  <textarea
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        void sendMessage();
                      }
                    }}
                    rows={1}
                    placeholder="Pose ta question à Chao…"
                    disabled={streaming}
                    className="min-h-[40px] flex-1 resize-none rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)]"
                    aria-label="Message pour Chao"
                  />
                  <button
                    type="submit"
                    disabled={streaming || !input.trim()}
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--primary)] text-white disabled:opacity-40"
                    aria-label="Envoyer"
                  >
                    <Send size={16} />
                  </button>
                </form>
              </>
            )}
          </footer>
        </div>
      )}

      <button
        ref={launcherRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "fixed bottom-4 right-4 z-50 flex h-14 w-14 items-center justify-center rounded-full shadow-lg transition-transform hover:scale-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2",
          open ? "bg-slate-700" : "bg-[var(--primary)]"
        )}
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label="Discuter avec Chao"
      >
        {open ? (
          <X size={22} className="text-white" />
        ) : (
          <Image
            src="/chao-icon.png"
            alt=""
            width={40}
            height={40}
            unoptimized
            className="h-10 w-10 rounded-full object-cover"
          />
        )}
      </button>
    </>
  );
}

// Minimal, XSS-safe markdown: **bold**, *italic*, and line breaks.
// Builds React nodes directly — no dangerouslySetInnerHTML.
function renderInline(text: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  const regex = /\*\*([^*]+)\*\*|\*([^*]+)\*/g;
  let last = 0;
  let key = 0;
  let m: RegExpExecArray | null;

  while ((m = regex.exec(text)) !== null) {
    if (m.index > last) nodes.push(text.slice(last, m.index));
    if (m[1] !== undefined) {
      nodes.push(<strong key={key++}>{m[1]}</strong>);
    } else if (m[2] !== undefined) {
      nodes.push(<em key={key++}>{m[2]}</em>);
    }
    last = regex.lastIndex;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
}

function MessageContent({ text }: { text: string }) {
  const lines = text.split("\n");
  return (
    <>
      {lines.map((line, i) => (
        <span key={i}>
          {renderInline(line)}
          {i < lines.length - 1 && <br />}
        </span>
      ))}
    </>
  );
}

function ButtonLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="inline-flex w-full items-center justify-center rounded-xl bg-[var(--primary)] px-4 py-2.5 text-sm font-medium text-white hover:bg-[var(--primary)]/90"
    >
      {children}
    </Link>
  );
}
