import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { listAllServices, upsertService, deleteService } from "@/lib/appointments.functions";
import { formatCurrency } from "@/lib/appointments.utils";
import type { Service } from "@/lib/appointments.schemas";
import { toast } from "sonner";
import { Pencil, Plus, Trash2 } from "lucide-react";

const emptyForm = { name: "", description: "", duration: "60", price: "", is_active: true };

export function ServicesTab() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Service | null>(null);
  const [form, setForm] = useState(emptyForm);

  const listAllServicesFn = useServerFn(listAllServices);
  const upsertServiceFn = useServerFn(upsertService);
  const deleteServiceFn = useServerFn(deleteService);

  const { data: services = [], isLoading, error } = useQuery({
    queryKey: ["admin-services"],
    queryFn: () => listAllServicesFn(),
  });

  const save = useMutation({
    mutationFn: () =>
      upsertServiceFn({
        data: {
          ...(editing ? { id: editing.id } : {}),
          name: form.name,
          description: form.description,
          duration_minutes: parseInt(form.duration, 10),
          price: form.price ? parseFloat(form.price.replace(",", ".")) : null,
          is_active: form.is_active,
        },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-services"] });
      queryClient.invalidateQueries({ queryKey: ["services"] });
      toast.success(editing ? "Serviço atualizado" : "Serviço criado");
      setOpen(false);
      setEditing(null);
      setForm(emptyForm);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: (id: string) => deleteServiceFn({ data: { id } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-services"] });
      queryClient.invalidateQueries({ queryKey: ["services"] });
      toast.success("Serviço removido");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const openEdit = (service: Service) => {
    setEditing(service);
    setForm({
      name: service.name,
      description: service.description ?? "",
      duration: String(service.duration_minutes),
      price: service.price != null ? String(service.price) : "",
      is_active: service.is_active,
    });
    setOpen(true);
  };

  const openNew = () => {
    setEditing(null);
    setForm(emptyForm);
    setOpen(true);
  };

  if (isLoading) return <p className="text-muted-foreground">Carregando serviços...</p>;
  if (error)
    return (
      <div className="rounded-2xl border border-border bg-card p-6">
        <p className="font-medium">Não foi possível carregar os serviços.</p>
      </div>
    );

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {services.length} serviço{services.length === 1 ? "" : "s"}
        </p>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-2" onClick={openNew}>
              <Plus className="h-4 w-4" />
              Novo serviço
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editing ? "Editar serviço" : "Novo serviço"}</DialogTitle>
            </DialogHeader>
            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                save.mutate();
              }}
            >
              <div className="space-y-2">
                <Label htmlFor="service-name">Nome</Label>
                <Input
                  id="service-name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="service-description">Descrição</Label>
                <Textarea
                  id="service-description"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="service-duration">Duração (min)</Label>
                  <Input
                    id="service-duration"
                    type="number"
                    min={10}
                    step={5}
                    value={form.duration}
                    onChange={(e) => setForm({ ...form, duration: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="service-price">Preço (R$)</Label>
                  <Input
                    id="service-price"
                    inputMode="decimal"
                    placeholder="Ex.: 80"
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex items-center justify-between gap-3 rounded-lg border border-border p-3">
                <Label htmlFor="service-active" className="cursor-pointer">
                  Visível na página de agendamento
                </Label>
                <Switch
                  id="service-active"
                  checked={form.is_active}
                  onCheckedChange={(checked) => setForm({ ...form, is_active: checked })}
                />
              </div>
              <Button type="submit" className="w-full" disabled={save.isPending}>
                {save.isPending ? "Salvando..." : "Salvar"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-3">
        {services.map((service) => (
          <div
            key={service.id}
            className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="break-words font-medium">{service.name}</p>
                {!service.is_active && <Badge variant="outline">Oculto</Badge>}
              </div>
              <p className="text-sm text-muted-foreground">
                {service.duration_minutes} min
                {service.price != null ? ` — ${formatCurrency(service.price)}` : ""}
              </p>
              {service.description && (
                <p className="mt-1 break-words text-xs text-muted-foreground">
                  {service.description}
                </p>
              )}
            </div>
            <div className="flex shrink-0 gap-2">
              <Button
                variant="outline"
                size="icon"
                aria-label={`Editar ${service.name}`}
                onClick={() => openEdit(service)}
              >
                <Pencil className="h-4 w-4" />
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="icon" aria-label={`Excluir ${service.name}`}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Excluir serviço?</AlertDialogTitle>
                    <AlertDialogDescription>
                      {service.name} será removido. Se houver agendamentos com este serviço, a
                      exclusão pode falhar — nesse caso, desative-o para escondê-lo da página de
                      agendamento.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={() => remove.mutate(service.id)}>
                      Excluir
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
