import { createClient } from '@supabase/supabase-js';

async function main() {
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment.');
    process.exit(1);
  }

  const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    global: {
      fetch: (input, init) => {
        const headers = new Headers(init?.headers);
        // ensure apikey header
        headers.set('apikey', SUPABASE_SERVICE_ROLE_KEY);
        return fetch(input, { ...init, headers });
      },
    },
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
  });

  // pick an active service
  const { data: services, error: svcErr } = await supabaseAdmin
    .from('services')
    .select('id, name, duration_minutes')
    .eq('is_active', true)
    .order('display_order', { ascending: true })
    .limit(1);

  if (svcErr) {
    console.error('Error fetching services:', svcErr.message || svcErr);
    process.exit(1);
  }

  if (!services || services.length === 0) {
    console.error('No active services found.');
    process.exit(1);
  }

  const service = services[0];
  console.log('Using service:', service);

  // pick tomorrow's date and a fixed time
  const d = new Date();
  d.setDate(d.getDate() + 1);
  const isoDate = d.toISOString().slice(0, 10);
  const time = '10:00:00';

  console.log('Attempting two concurrent bookings for', isoDate, time);

  const callRpc = () =>
    supabaseAdmin.rpc('create_appointment_locked', {
      p_client_name: 'Concurrent Test',
      p_client_phone: '999999999',
      p_client_email: null,
      p_service_id: service.id,
      p_appointment_date: isoDate,
      p_appointment_time: time,
      p_notes: 'concurrent test',
    });

  const [r1, r2] = await Promise.allSettled([callRpc(), callRpc()]);

  function dumpResult(label, r) {
    if (r.status === 'fulfilled') {
      const { data, error } = r.value;
      if (error) {
        console.log(label, 'RPC responded with error:', error.message || error);
      } else {
        console.log(label, 'RPC success, data:', data);
      }
    } else {
      console.log(label, 'Promise rejected:', r.reason);
    }
  }

  dumpResult('Call 1', r1);
  dumpResult('Call 2', r2);

  // list appointments for that date/time/service
  const { data: appts, error: apptErr } = await supabaseAdmin
    .from('appointments')
    .select('id, client_name, appointment_time, appointment_date, service_id, status')
    .eq('appointment_date', isoDate)
    .eq('appointment_time', time);

  if (apptErr) {
    console.error('Error listing appointments:', apptErr.message || apptErr);
    process.exit(1);
  }

  console.log('Appointments at that slot:', appts);
}

main().catch((err) => {
  console.error('Unexpected error:', err);
  process.exit(1);
});
