"use client";

import { useEffect, useRef, useState } from "react";
import { Send } from "lucide-react";
import { GlassButton } from "@/components/ui/GlassButton";
import { GlassCard } from "@/components/ui/GlassCard";
import { GlassInput } from "@/components/ui/GlassInput";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { cn } from "@/lib/cn";

type Message = { role: "user" | "assistant"; content: string };

/**
 * Rendu minimal du seul balisage que le modèle produit systématiquement : le
 * gras. Pas de parseur markdown — ce serait une dépendance de plus pour un
 * chat qui n'affiche que du texte et des listes à puces.
 */
function renderContent(text: string) {
  return text.split(/\*\*/).map((part, index) =>
    index % 2 === 1 ? <strong key={index}>{part}</strong> : part
  );
}

const AMORCES = [
  "J'ai eu SE, quelles formations en informatique ?",
  "Je veux devenir ingénieur, quelles options ?",
  "Quelles formations à N'Zérékoré ?",
  "Je suis SS-FA, qu'est-ce qui m'est ouvert ?",
];

export function ConseillerChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  // Le fil suit le dernier message, y compris pendant l'attente. On pousse le
  // conteneur à la main plutôt que scrollIntoView : celui-ci fait aussi
  // défiler la fenêtre, et sort le chat de l'écran sur mobile.
  useEffect(() => {
    const list = listRef.current;
    if (list) list.scrollTop = list.scrollHeight;
  }, [messages, loading]);

  async function send(text: string) {
    const question = text.trim();
    if (!question || loading) return;

    const next: Message[] = [...messages, { role: "user", content: question }];
    setMessages(next);
    setDraft("");
    setLoading(true);

    try {
      const res = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next }),
      });

      // Un 500 de la plateforme ou un 504 de passerelle renvoie du HTML, pas
      // du JSON : res.json() jette alors, et sans ce filet le chat afficherait
      // « connexion impossible » pour une panne serveur.
      let data: { content?: string; error?: string } = {};
      try {
        data = await res.json();
      } catch {
        data = {};
      }

      setMessages([
        ...next,
        {
          role: "assistant",
          content:
            data.content?.trim() ||
            data.error ||
            (res.status === 429
              ? "Tu as posé beaucoup de questions d'affilée. Patiente une dizaine de minutes avant de réessayer."
              : res.ok
                ? "Je n'ai pas pu formuler de réponse. Reformule ta question."
                : `Le conseiller est indisponible pour le moment (erreur ${res.status}). Réessaie dans un instant.`),
        },
      ]);
    } catch {
      setMessages([
        ...next,
        {
          role: "assistant",
          content: "Connexion impossible. Vérifie ton réseau et réessaie.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <GlassPanel className="flex min-h-0 flex-1 flex-col">
      <div
        ref={listRef}
        className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-4 sm:p-6"
      >
        {messages.length === 0 && (
          <div className="animate-fade-in-up m-auto flex max-w-lg flex-col gap-4 text-center">
            <p className="text-muted">
              Pose ta question sur les 200 formations du catalogue ParcourSup
              Guinée 2026. Je ne réponds qu&rsquo;à partir de ce catalogue.
            </p>
            <div className="flex flex-col gap-2">
              {AMORCES.map((amorce) => (
                <button
                  key={amorce}
                  type="button"
                  onClick={() => send(amorce)}
                  className="rounded-button border border-glass-border bg-glass-1 px-4 py-2.5 text-left text-sm text-foreground transition-[border-color,background-color] duration-200 ease-out hover:border-glass-border-hover hover:bg-glass-2"
                >
                  {amorce}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((message, index) => (
          <div
            key={index}
            className={cn(
              "flex",
              message.role === "user" ? "justify-end" : "justify-start"
            )}
          >
            <GlassCard
              variant={message.role === "user" ? "3" : "1"}
              blur={false}
              className={cn(
                "max-w-[85%] whitespace-pre-wrap break-words px-4 py-3 text-sm leading-relaxed hover:translate-y-0 sm:max-w-[75%]",
                message.role === "user" ? "text-foreground" : "text-muted"
              )}
            >
              {renderContent(message.content)}
            </GlassCard>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <GlassCard
              variant="1"
              blur={false}
              className="px-4 py-3 hover:translate-y-0"
            >
              <span className="flex items-center gap-1.5" aria-label="Réponse en cours">
                {[0, 150, 300].map((delay) => (
                  <span
                    key={delay}
                    className="h-1.5 w-1.5 animate-bounce rounded-pill bg-muted"
                    style={{ animationDelay: `${delay}ms` }}
                  />
                ))}
              </span>
            </GlassCard>
          </div>
        )}
      </div>

      <form
        onSubmit={(event) => {
          event.preventDefault();
          send(draft);
        }}
        className="flex shrink-0 items-center gap-2 border-t border-glass-border p-3 sm:p-4"
      >
        {/* Entrée envoie : l'input est dans un form, submit natif. */}
        <GlassInput
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Ta question sur les formations..."
          aria-label="Ta question"
          autoComplete="off"
          disabled={loading}
        />
        <GlassButton type="submit" disabled={loading || !draft.trim()}>
          <Send className="h-4 w-4" aria-hidden />
          <span className="sr-only sm:not-sr-only">Envoyer</span>
        </GlassButton>
      </form>
    </GlassPanel>
  );
}
