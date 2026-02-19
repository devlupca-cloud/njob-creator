/**
 * Schedule/Agenda API: get_creator_daily_slots (RPC) and save_creator_availability (RPC).
 * Mirrors Flutter: GETDisponibilidadeDeHoraiosCall, CRIARHorariosDeDisponibilidadesCall + buildAvailabilityPayload.
 */

export interface AvailabilitySlotsResponse {
  date?: string
  slots?: {
    manha?: string[]
    tarde?: string[]
    noite?: string[]
    madrugada?: string[]
  }
}

/** Periods match Flutter generateTimeSlots: Manhã 6:00–11:30, Tarde 12:00–17:30, Noite 18:00–23:30, Madrugada 0:00–5:30 (30min steps). */
export type PeriodKey = 'Manhã' | 'Tarde' | 'Noite' | 'Madrugada'

export function generateTimeSlots(period: PeriodKey): string[] {
  const slots: string[] = []
  const pad = (n: number) => String(n).padStart(2, '0')

  switch (period) {
    case 'Manhã':
      for (let h = 6; h <= 11; h++) {
        slots.push(`${pad(h)}:00`)
        if (h < 11) slots.push(`${pad(h)}:30`)
      }
      break
    case 'Tarde':
      for (let h = 12; h <= 17; h++) {
        slots.push(`${pad(h)}:00`)
        if (h < 17) slots.push(`${pad(h)}:30`)
      }
      break
    case 'Noite':
      for (let h = 18; h <= 23; h++) {
        slots.push(`${pad(h)}:00`)
        if (h < 23) slots.push(`${pad(h)}:30`)
      }
      break
    case 'Madrugada':
      for (let h = 0; h <= 5; h++) {
        slots.push(`${pad(h)}:00`)
        if (h < 5) slots.push(`${pad(h)}:30`)
      }
      break
    default:
      break
  }
  return slots
}

/** Build payload for save_creator_availability. Matches Flutter buildAvailabilityPayload. */
export function buildAvailabilityPayload(
  creatorId: string,
  date: Date,
  manha: string[],
  tarde: string[],
  noite: string[],
  madrugada: string[]
): { p_creator_id: string; p_availability_date: string; p_slots: Array<{ period: string; slot_time: string }> } {
  const p_availability_date = date.getFullYear() + '-' +
    String(date.getMonth() + 1).padStart(2, '0') + '-' +
    String(date.getDate()).padStart(2, '0')

  const p_slots: Array<{ period: string; slot_time: string }> = []

  const add = (period: string, list: string[]) => {
    list.forEach((slot_time) => p_slots.push({ period, slot_time }))
  }
  add('Manhã', manha)
  add('Tarde', tarde)
  add('Noite', noite)
  add('Madrugada', madrugada)

  return { p_creator_id: creatorId, p_availability_date, p_slots }
}

export async function getCreatorDailySlots(
  creatorId: string,
  dateStr: string,
  accessToken: string
): Promise<AvailabilitySlotsResponse> {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!base || !anon) throw new Error('Missing Supabase env')

  // Supabase RPC: POST with JSON body (Flutter used GET with params; REST RPC is POST)
  const res = await fetch(`${base}/rest/v1/rpc/get_creator_daily_slots`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: anon,
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ p_creator_id: creatorId, p_date: dateStr }),
  })
  if (!res.ok) {
    const t = await res.text()
    throw new Error(`get_creator_daily_slots failed: ${res.status} ${t}`)
  }
  const raw = await res.json()
  // RPC can return array with single row or direct object
  const data = Array.isArray(raw) ? raw[0] : raw
  return (data ?? {}) as AvailabilitySlotsResponse
}

export async function saveCreatorAvailability(
  payload: { p_creator_id: string; p_availability_date: string; p_slots: Array<{ period: string; slot_time: string }> },
  accessToken: string
): Promise<{ status?: boolean; message?: string; availability_id?: string }> {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!base || !anon) throw new Error('Missing Supabase env')

  const res = await fetch(`${base}/rest/v1/rpc/save_creator_availability`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: anon,
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(payload),
  })
  const body = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(body?.message ?? `HTTP ${res.status}`)
  return body
}
