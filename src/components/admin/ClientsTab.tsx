import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  listClients,
  upsertClient,
  deleteClient,
  listAllServices,
  createAppointment,
  getAvailableSlots,
} from "@/server/api";
import { toast } from "sonner";
import { Pencil, Plus, Trash2 } from "lucide-react";

type Client = {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  notes: string | null;
};

const emptyForm = { name: "", phone: "", email: "", notes: "" };

export function ClientsTab() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Client | null>(null);
  const [form, setForm] = useState(emptyForm);

  // Appointment creation fields (optional)
  const [createAppt, setCreateAppt] = useState(false);
  const [apptService, setApptService] = useState("");
  const [apptDate, setApptDate] = useState(""); // yyyy-MM-dd
  const [apptTime, setApptTime] = useState("");

  const listClientsFn = useServerFn(listClients);
  const upsertClientFn = useServerFn(upsertClient);
  const deleteClientFn = useServerFn(deleteClient);
  const listAllServicesFn = useServerFn(listAllServices);
  const createAppointmentFn = useServerFn(createAppointment);
  const getSlotsFn = useServerFn(getAvailableSlots);

  const {
    data: clients = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["clients"],
    queryFn: () => listClientsFn(),
  });

  const { data: adminServices = [] } = useQuery({
    queryKey: ["adminServices"],
    queryFn: () => listAllServicesFn(),
  });

  const { data: apptSlots = [] } = useQuery({
    queryKey: ["adminSlots", apptDate, apptService],
    queryFn: () => getSlotsFn({ data: { date: apptDate, serviceId: apptService } }),
    enabled: !!apptDate && !!apptService,
  });

  const createAppointmentMutation = useMutation({
    mutationFn: (data: Parameters<typeof createAppointmentFn>[0]) => createAppointmentFn(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      toast.success("Agendamento criado");
      setOpen(false);
      setEditing(null);
      setForm(emptyForm);
      setCreateAppt(false);
      setApptService("");
      setApptDate("");
      setApptTime("");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const save = useMutation({
    mutationFn: () =>
      upsertClientFn({
        data: {
          ...(editing ? { id: editing.id } : {}),
          name: form.name,
          phone: form.phone,
          email: form.email,
          notes: form.notes,
        },
      }),
    onSuccess: async () => {
      // If admin requested an appointment creation, call the public createAppointment RPC
      if (createAppt) {
        try {
          await createAppointmentMutation.mutateAsync({
            data: {
              client_name: form.name,
              client_phone: form.phone,
              client_email: form.email || "",
              service_id: apptService,
              appointment_date: apptDate,
              appointment_time: apptTime,
              notes: form.notes || "",
            },
          });
          // createAppointmentMutation.onSuccess will handle closing/resetting
        } catch {
          // createAppointmentMutation already shows toast on error
        }
      } else {
        queryClient.invalidateQueries({ queryKey: ["clients"] });
        toast.success(editing ? "Cliente atualizado" : "Cliente cadastrado");
        setOpen(false);
        setEditing(null);
        setForm(emptyForm);
      }
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: (id: string) => deleteClientFn({ data: { id } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      toast.success("Cliente removido");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const openEdit = (client: Client) => {
    setEditing(client);
    setForm({
      name: client.name,
      phone: client.phone,
      email: client.email ?? "",
      notes: client.notes ?? "",
    });
    // reset appointment fields when editing
    setCreateAppt(false);
    setApptService("");
    setApptDate("");
    setApptTime("");
    setOpen(true);
  };

  const openNew = () => {
    setEditing(null);
    setForm(emptyForm);
    setCreateAppt(false);
    setApptService("");
    setApptDate("");
    setApptTime("");
    setOpen(true);
  };

  if (isLoading) return <p className="text-muted-foreground">Carregando clientes...</p>;
  if (error)
    return (
      <div className="rounded-3xl border border-border/60 bg-card p-8 shadow-soft">
        <p className="font-medium">Não foi possível carregar os clientes.</p>
      </div>
    );

  return (
    <div>
      <div className="mb-6 flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {clients.length} cliente{clients.length === 1 ? "" : "s"} cadastrado
          {clients.length === 1 ? "" : "s"}
        </p>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2" onClick={openNew}>
              <Plus className="h-4 w-4" />
              Novo cliente
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editing ? "Editar cliente" : "Novo cliente"}</DialogTitle>
            </DialogHeader>
            <form
              className="space-y-5"
              onSubmit={(e) => {
                e.preventDefault();
                save.mutate();
              }}
            >
              <div className="space-y-2">
                <Label htmlFor="client-name">Nome</Label>
                <Input
                  id="client-name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="client-phone">Telefone</Label>
                <Input
                  id="client-phone"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="client-email">Email (opcional)</Label>
                <Input
                  id="client-email"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="client-notes">Observações</Label>
                <Textarea
                  id="client-notes"
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                />
              </div>

              {/* Appointment creation controls (admin-only modal) */}
              <div className="space-y-2 pt-2 border-t border-border">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={createAppt}
                    onChange={(e) => setCreateAppt(e.target.checked)}
                  />
                  <span className="text-sm">Criar agendamento agora</span>
                </label>

                {createAppt && (
                  <div className="space-y-4">
                    <div>
                      <Label>Serviço</Label>
                      <Select value={apptService} onValueChange={(v) => setApptService(v)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Escolha um serviço" />
                        </SelectTrigger>
                        <SelectContent>
                          {adminServices.map((s) => (
                            <SelectItem key={s.id} value={s.id}>
                              {s.name} — {s.duration_minutes}min
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Data</Label>
                      <Input
                        type="date"
                        value={apptDate}
                        onChange={(e) => {
                          setApptDate(e.target.value);
                          setApptTime("");
                        }}
                      />
                    </div>

                    <div>
                      <Label>Horário</Label>
                      {apptDate && apptService ? (
                        <Select value={apptTime} onValueChange={(v) => setApptTime(v)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Escolha um horário" />
                          </SelectTrigger>
                          <SelectContent>
                            {apptSlots.map((slot: string) => (
                              <SelectItem key={slot} value={slot}>
                                {slot}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          Selecione serviço e data para ver horários.
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={save.isPending || createAppointmentMutation.isPending}
              >
                {save.isPending || createAppointmentMutation.isPending ? "Salvando..." : "Salvar"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {clients.length === 0 ? (
        <div className="rounded-3xl border border-border/60 bg-card p-8 shadow-soft">
          <p className="text-muted-foreground">
            Nenhum cliente ainda. Clientes entram aqui automaticamente ao agendar pelo site.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {(clients as Client[]).map((client) => (
            <div
              key={client.id}
              className="flex flex-col gap-3 rounded-2xl border border-border/60 bg-card p-5 shadow-soft sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <p className="break-words font-serif text-lg font-semibold">{client.name}</p>
                <p className="break-words text-sm text-muted-foreground">{client.phone}</p>
                {client.email && (
                  <p className="break-words text-xs text-muted-foreground">{client.email}</p>
                )}
                {client.notes && (
                  <p className="mt-1 break-words text-xs text-muted-foreground">{client.notes}</p>
                )}
              </div>
              <div className="flex shrink-0 gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  aria-label={`Editar ${client.name}`}
                  onClick={() => openEdit(client)}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="icon" aria-label={`Excluir ${client.name}`}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Excluir cliente?</AlertDialogTitle>
                      <AlertDialogDescription>
                        {client.name} será removido da lista de clientes. Agendamentos já feitos não
                        são apagados.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={() => remove.mutate(client.id)}>
                        Excluir
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
