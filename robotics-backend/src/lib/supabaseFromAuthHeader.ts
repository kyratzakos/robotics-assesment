import { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export function supabaseFromAuthHeader(req: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  const authHeader = req.headers.get('authorization') ?? ''

  return createClient(url, anon, {
    global: { headers: { Authorization: authHeader } },
  })
}
