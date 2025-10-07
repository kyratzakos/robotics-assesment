import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'
import { createStackBodySchema } from '@/lib/validation'
import { randomUUID } from 'crypto'

export async function POST(req: NextRequest) {
  const supabase = await supabaseServer()
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
  
  if (authErr || !user) {
    console.log('Auth error:', authErr)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const url = new URL(req.url)
  const queryDeviceId = url.searchParams.get('deviceId') ?? undefined

  const body = await req.json().catch(() => ({}))
  const parsed = createStackBodySchema.safeParse({ ...body, deviceId: body.deviceId ?? queryDeviceId })
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid payload', issues: parsed.error.issues }, { status: 400 })
  }
  const { deviceId, tasks } = parsed.data
  if (!deviceId) return NextResponse.json({ error: 'deviceId required' }, { status: 400 })

  // Query device by device_id (text field) to get the internal UUID
  const { data: device, error: devErr } = await supabase
    .from('devices')
    .select('id, device_id')
    .eq('device_id', deviceId)
    .maybeSingle()

  console.log('Device query result:', { device, devErr, userId: user.id })

  if (devErr) {
    console.error('Device query error:', devErr)
    return NextResponse.json({ error: 'Database error', details: devErr.message }, { status: 500 })
  }
  
  if (!device) {
    console.log('No device found with device_id:', deviceId, '(may not exist or user does not own it)')
    return NextResponse.json({ 
      error: 'Device not found', 
      details: 'Device does not exist or you do not have permission to access it' 
    }, { status: 404 })
  }

  const stackId = `stk_${randomUUID().slice(0, 8)}`
  const { data: inserted, error: insErr } = await supabase
    .from('task_stacks')
    .insert({
      stack_id: stackId,
      device_id: device.id, // Use the UUID, not the text device_id
      status: 'pending',
      tasks,
    })
    .select('id, stack_id')
    .single()

  if (insErr) {
    console.error('Task stack insert error:', insErr)
    return NextResponse.json({ error: 'Failed to create task stack', details: insErr.message }, { status: 500 })
  }

  return NextResponse.json({ id: inserted.stack_id, uuid: inserted.id }, { status: 201 })
}
