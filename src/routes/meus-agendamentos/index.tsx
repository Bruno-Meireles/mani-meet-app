import React, { useState, useEffect } from "react";
import { format } from "date-fns";
import { Header } from "@/components/Header";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { getAppointmentsByPhone } from "@/lib/appointments.functions";

export default function MyAppointmentsPage() {
  const [phone, setPhone] = useState("");
  const [appointments, setAppointments] = useState<any[]>([]);
  const getByPhone = useServerFn(getAppointmentsByPhone);

  const search = async () => {
    try {
      const digits = phone.replace(/\D/g, "");
      const res = await getByPhone({ phone: digits });
      setAppointments(res ?? []);
      if ((res ?? []).length === 0) toast("Nenhum agendamento encontrado para esse número");
    } catch (e: any) {
      toast.error(e?.message || "Erro ao buscar agendamentos");
    }
  };

  return (
    <div>
      <Header />
      <main className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">Meus agendamentos</h1>
        <div className="max-w-md">
          <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Digite o WhatsApp usado (ex: 11999998888)" />
          <Button className="mt-2" onClick={search}>Buscar</Button>

          <div className="mt-4">
            {appointments.map((a) => (
              <div key={a.id} className="p-3 border rounded mb-2">
                <div className="font-medium">{a.client_name} — {a.services?.name ?? ""}</div>
                <div>{format(new Date(`${a.appointment_date}T12:00:00`), "dd/MM/yyyy")} — {a.appointment_time}</div>
                {a.notes && <div className="text-sm text-muted-foreground">Observações: {a.notes}</div>}
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
