// PROTOTYPE (throwaway): barra flutuante para alternar variações via ?variant=. Só aparece em dev.
import { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight } from "lucide-react";

type Variant = { key: "A" | "B" | "C"; name: string };

export function PrototypeSwitcher({ variants, current }: { variants: Variant[]; current: string }) {
  const navigate = useNavigate();
  const index = Math.max(
    0,
    variants.findIndex((v) => v.key === current),
  );

  const go = (delta: number) => {
    const next = variants[(index + delta + variants.length) % variants.length]!;
    void navigate({ to: "/agendar", search: { variant: next.key }, replace: true });
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;
      if (e.key === "ArrowLeft") go(-1);
      if (e.key === "ArrowRight") go(1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  if (!import.meta.env.DEV) return null;

  return (
    <div className="fixed left-1/2 top-20 z-50 flex -translate-x-1/2 items-center gap-2 rounded-full bg-neutral-900 px-3 py-1.5 text-xs text-white shadow-lg">
      <button type="button" aria-label="Variação anterior" onClick={() => go(-1)}>
        <ChevronLeft className="h-4 w-4" />
      </button>
      <span>
        {variants[index]!.key} ({variants[index]!.name})
      </span>
      <button type="button" aria-label="Próxima variação" onClick={() => go(1)}>
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}
