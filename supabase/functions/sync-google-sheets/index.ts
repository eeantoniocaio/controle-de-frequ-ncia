import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7"

const GOOGLE_SERVICE_ACCOUNT_EMAIL = Deno.env.get('GOOGLE_SERVICE_ACCOUNT_EMAIL')
const GOOGLE_PRIVATE_KEY = Deno.env.get('GOOGLE_PRIVATE_KEY')?.replace(/\\n/g, '\n')
const SPREADSHEET_ID = Deno.env.get('GOOGLE_SHEETS_SPREADSHEET_ID')

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || ''
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

async function getAccessToken() {
  const header = { alg: 'RS256', typ: 'JWT' }
  const now = Math.floor(Date.now() / 1000)
  const claim = {
    iss: GOOGLE_SERVICE_ACCOUNT_EMAIL,
    scope: 'https://www.googleapis.com/auth/spreadsheets',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now
  }

  const encodedHeader = btoa(JSON.stringify(header))
  const encodedClaim = btoa(JSON.stringify(claim))
  const signatureInput = `${encodedHeader}.${encodedClaim}`

  const keyBuffer = Uint8Array.from(atob(GOOGLE_PRIVATE_KEY!.replace(/-----(BEGIN|END) PRIVATE KEY-----/g, '').replace(/\s/g, '')), c => c.charCodeAt(0))
  const key = await crypto.subtle.importKey(
    'pkcs8',
    keyBuffer,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign']
  )

  const signature = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, new TextEncoder().encode(signatureInput))
  const encodedSignature = btoa(String.fromCharCode(...new Uint8Array(signature))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')

  const jwt = `${signatureInput}.${encodedSignature}`
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`
  })

  const { access_token } = await response.json()
  return access_token
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const supabaseClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
    const body = await req.json()
    
    // Suporte tanto para chamada manual quanto para Webhook do Supabase
    const record = body.record || body.payload || body
    const { student_id, class_id, present, date } = record

    // 1. Buscar nomes reais no banco de dados
    const [ { data: student }, { data: cls } ] = await Promise.all([
      supabaseClient.from('students').select('name').eq('id', student_id).single(),
      supabaseClient.from('classes').select('name').eq('id', class_id).single()
    ])

    const student_name = student?.name || record.student_name || 'Desconhecido'
    const class_name = cls?.name || record.class_name || 'Desconhecida'
    const status = present === false ? 'Ausente' : 'Presente'

    // 2. Enviar para Google Sheets
    const accessToken = await getAccessToken()
    const response = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/A1:append?valueInputOption=USER_ENTERED`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          values: [[
            student_name,
            class_name,
            status,
            date || new Date().toLocaleString('pt-BR'),
            'Sincronização Automática'
          ]]
        }),
      }
    )
    
    const result = await response.json()
    return new Response(JSON.stringify({ success: true, result }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})


