import { NextRequest, NextResponse } from 'next/server'
import { supabaseFromAuthHeader } from '@/lib/supabaseFromAuthHeader'

export async function GET(req: NextRequest) {
  const supabase = supabaseFromAuthHeader(req)
  if (!supabase) return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  
  // Check for Bearer token in Authorization header (for Postman/API testing)
  const authHeader = req.headers.get('Authorization')
  let user = null
  let authErr = null

  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1]
    const result = await supabase.auth.getUser(token)
    user = result.data.user
    authErr = result.error
  } else {
    // Fall back to cookie-based auth (for browser clients)
    const result = await supabase.auth.getUser()
    user = result.data.user
    authErr = result.error
  }
  console.log('user id:', user?.id, 'authErr:', authErr);

  if (authErr || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const q = supabase
    .from('devices')
    .select('id, device_id, name, status')
    .order('name', { ascending: true })

  
  const { data: devices, error: devErr, status, statusText } = await q;
  
  console.log('query status:', status, statusText, 'error:', devErr, 'rows:', devices?.length);

  if (devErr) {
    console.error('devices error:', devErr);
    return NextResponse.json({ error: 'Failed to fetch devices' }, { status: 500 });
  }
  
  console.log('devices length:', devices?.length);
  

  if (devErr) return NextResponse.json({ error: 'Failed to fetch devices' }, { status: 500 })
  if (!devices || devices.length === 0) return NextResponse.json([])

  const ids = devices.map(d => d.id)
  const { data: agg, error: aggErr } = await supabase
    .from('task_stacks')
    .select('device_id, status')
    .in('device_id', ids)
    .in('status', ['pending', 'in_progress'])

  if (aggErr) return NextResponse.json({ error: 'Failed to aggregate stacks' }, { status: 500 })

  const map = new Map<string, { pending: number, in_progress: number }>()
  for (const row of agg ?? []) {
    const curr = map.get(row.device_id) ?? { pending: 0, in_progress: 0 }
    if (row.status === 'pending') curr.pending++
    if (row.status === 'in_progress') curr.in_progress++
    map.set(row.device_id, curr)
  }

  const result = devices.map(d => {
    const c = map.get(d.id) ?? { pending: 0, in_progress: 0 }
    return {
      deviceId: d.device_id,
      name: d.name,
      status: d.status,
      pendingTasks: c.pending,
      activeTasks: c.in_progress,
    }
  })

  return NextResponse.json(result)
}
