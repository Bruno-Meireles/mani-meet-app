import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  addBlockedDate,
  getScheduleAdmin,
  removeBlockedDate,
  saveBusinessHours,
} from "@/actions/admin.functions";
import { WEEKDAY_LABELS, type DayHours } from "@/domain/scheduling/availability";
import { formatDateBR } from "@/shared/format";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";

const short = (t: string | null) => (t ? t.slice(0, 5) : "");

export function ScheduleTab() {
  const queryClient = useQueryClient();
  const getFn = useServerFn(getScheduleAdmin);
  const saveFn = useServerFn(saveBusinessHours);
  const addFn = useServerFn(addBlockedDate);
  const removeFn = useServerFn(removeBlockedDate);

  const { data, isLoading, error } = useQuery({
    queryKey: ["admin-schedule"],
    queryFn: () => getFn(),
  });

  const [hours, setHours] = useState<DayHours[]>([]);
  const [blockDate, setBlockDate] = useState("");
  const [blockReason, setBlockReason] = useState("");

  useEffect(() => {
    if (data) {
      setHours(
        data.hours.map((h) => ({
          ...h,
          open_time: short(h.open_time),
          close_time: short(h.close_time),
          break_start: h.break_start ? short(h.break_start) : null,
          break_end: h.break_end ? short(h.break_end) : null,
        })),
      );
    }
  }, [data]);

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["admin-schedule"] });
    queryClient.invalidateQueries({ queryKey: ["schedule"] });
    queryClient.invalidateQueries({ queryKey: ["slots"] });
  };

  const save = useMutation({
    mutationFn: () => saveFn({ data: { hours } }),
    onSuccess: () => {
      refresh();
      toast.success("Horários salvos");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const add = useMutation({
    mutationFn: () => addFn({ data: { date: blockDate, reason: blockReason } }),
    onSuccess: () => {
      refresh();
      setBlockDate("");
      setBlockReason("");
      toast.success("Folga adicionada");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: (date: string) => removeFn({ data: { date } }),
    onSuccess: () => {
      refresh();
      toast.success("Folga removida");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const update = (weekday: number, patch: Partial<DayHours>) =>
    setHours((prev) => prev.map((h) => (h.weekday === weekday ? { ...h, ...patch } : h)));

  if (isLoading) return <p className="text-sm text-muted-foreground">Carregando…</p>;
  if (error) return <p className="text-sm text-destructive">{(error as Error).message}</p>;

  return (
    <div className="space-y-12">
      <section>
        <h2 className="font-serif text-2xl font-semibold">Horário de funcionamento</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Define quando as clientes podem agendar. O intervalo (almoço) é opcional.
        </p>
        <div className="mt-6 space-y-3">
          {hours.map((h) => (
            <div
              key={h.weekday}
              className="grid items-center gap-3 rounded-2xl border border-border/60 bg-card p-4 shadow-soft md:grid-cols-[180px_auto_1fr]"
            >
              <div className="flex items-center gap-3">
                <Switch
                  id={`open-${h.weekday}`}
                  checked={h.is_open}
                  onCheckedChange={(v) => update(h.weekday, { is_open: v })}
                  aria-label={`${WEEKDAY_LABELS[h.weekday]} aberto`}
                />
                <Label htmlFor={`open-${h.weekday}`} className="font-medium">
                  {WEEKDAY_LABELS[h.weekday]}
                </Label>
              </div>
              {h.is_open ? (
                <>
                  <div className="flex items-center gap-2 text-sm">
                    <Input
                      type="time"
                      className="w-28"
                      value={h.open_time}
                      onChange={(e) => update(h.weekday, { open_time: e.target.value })}
                      aria-label="Abertura"
                    />
                    <span>às</span>
                    <Input
                      type="time"
                      className="w-28"
                      value={h.close_time}
                      onChange={(e) => update(h.weekday, { close_time: e.target.value })}
                      aria-label="Fechamento"
                    />
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>Intervalo</span>
                    <Input
                      type="time"
                      className="w-28"
                      value={h.break_start ?? ""}
                      onChange={(e) =>
                        update(h.weekday, {
                          break_start: e.target.value || null,
                          break_end: e.target.value ? (h.break_end ?? "13:00") : null,
                        })
                      }
                      aria-label="Início do intervalo"
                    />
                    <span>às</span>
                    <Input
                      type="time"
                      className="w-28"
                      value={h.break_end ?? ""}
                      onChange={(e) =>
                        update(h.weekday, {
                          break_end: e.target.value || null,
                          break_start: e.target.value ? (h.break_start ?? "12:00") : null,
                        })
                      }
                      aria-label="Fim do intervalo"
                    />
                  </div>
                </>
              ) : (
                <p className="text-sm text-muted-foreground md:col-span-2">Fechado</p>
              )}
            </div>
          ))}
        </div>
        <Button className="mt-6" onClick={() => save.mutate()} disabled={save.isPending}>
          {save.isPending ? "Salvando…" : "Salvar horários"}
        </Button>
      </section>

      <section>
        <h2 className="font-serif text-2xl font-semibold">Folgas e datas bloqueadas</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Feriados, férias ou qualquer dia em que não haverá atendimento.
        </p>
        <form
          className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-end"
          onSubmit={(e) => {
            e.preventDefault();
            if (blockDate) add.mutate();
          }}
        >
          <div className="space-y-1">
            <Label htmlFor="block-date">Data</Label>
            <Input
              id="block-date"
              type="date"
              value={blockDate}
              onChange={(e) => setBlockDate(e.target.value)}
              required
            />
          </div>
          <div className="flex-1 space-y-1">
            <Label htmlFor="block-reason">Motivo (opcional)</Label>
            <Input
              id="block-reason"
              maxLength={120}
              placeholder="Ex.: Feriado"
              value={blockReason}
              onChange={(e) => setBlockReason(e.target.value)}
            />
          </div>
          <Button type="submit" disabled={add.isPending || !blockDate}>
            Bloquear data
          </Button>
        </form>

        <ul className="mt-6 space-y-2">
          {(data?.blocked ?? []).length === 0 && (
            <li className="text-sm text-muted-foreground">Nenhuma folga futura cadastrada.</li>
          )}
          {(data?.blocked ?? []).map((b) => (
            <li
              key={b.blocked_date}
              className="flex items-center justify-between rounded-2xl border border-border/60 bg-card px-4 py-3 text-sm shadow-soft"
            >
              <span>
                <strong>{formatDateBR(b.blocked_date)}</strong>
                {b.reason ? ` — ${b.reason}` : ""}
              </span>
              <Button
                variant="ghost"
                size="icon"
                aria-label={`Remover folga de ${formatDateBR(b.blocked_date)}`}
                onClick={() => remove.mutate(b.blocked_date)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
