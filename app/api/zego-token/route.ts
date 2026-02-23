import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const corsHeaders = {
  'Content-Type': 'application/json',
}

/**
 * Generates a ZegoCloud Token04 using HMAC-SHA256 (server-side only).
 */
async function generateToken04(
  appId: number,
  serverSecret: string,
  userId: string,
  effectiveTimeInSeconds = 7200
): Promise<string> {
  const createTime = Math.floor(Date.now() / 1000)
  const expireTime = createTime + effectiveTimeInSeconds
  const payloadObject = {
    app_id: appId,
    user_id: userId,
    nonce: crypto.getRandomValues(new Uint32Array(1))[0],
    create_time: createTime,
    expire_time: expireTime,
  }

  const payload = JSON.stringify(payloadObject)

  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(serverSecret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const signature = await crypto.subtle.sign(
    'HMAC',
    key,
    new TextEncoder().encode(payload)
  )
  const signatureBytes = new Uint8Array(signature)

  const tokenInfo = new Uint8Array(
    12 + 2 + signatureBytes.length + 2 + payload.length
  )
  const dv = new DataView(tokenInfo.buffer)
  dv.setBigInt64(0, BigInt(expireTime), false)
  dv.setInt16(8, signatureBytes.length, false)
  tokenInfo.set(signatureBytes, 12)
  dv.setInt16(12 + signatureBytes.length, payload.length, false)
  tokenInfo.set(
    new TextEncoder().encode(payload),
    12 + signatureBytes.length + 2
  )

  const base64Token = Buffer.from(tokenInfo).toString('base64')
  return `04${base64Token}`
}

/**
 * Wraps a Token04 into a Kit Token that ZegoUIKitPrebuilt.create() accepts.
 */
function buildKitToken(
  token04: string,
  appId: number,
  roomID: string,
  userID: string,
  userName: string
): string {
  const kitToken = {
    ver: 1,
    token: token04,
    app_id: appId,
    user_id: userID,
    user_name: userName,
    room_id: roomID,
  }
  return Buffer.from(JSON.stringify(kitToken)).toString('base64')
}

export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate the user via Supabase session
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401, headers: corsHeaders }
      )
    }

    // 2. Parse request body
    const { roomID, userID, userName } = await request.json()
    if (!roomID || !userID) {
      return NextResponse.json(
        { error: 'roomID e userID são obrigatórios' },
        { status: 400, headers: corsHeaders }
      )
    }

    // 3. Verify the authenticated user matches the requested userID
    if (user.id !== userID) {
      return NextResponse.json(
        { error: 'Não autorizado: userID não corresponde' },
        { status: 403, headers: corsHeaders }
      )
    }

    // 4. Get ZegoCloud credentials from server env (NO NEXT_PUBLIC_ prefix)
    const appId = Number(process.env.ZEGO_APP_ID)
    const serverSecret = process.env.ZEGO_SERVER_SECRET
    if (!appId || !serverSecret) {
      return NextResponse.json(
        { error: 'Credenciais ZegoCloud não configuradas no servidor' },
        { status: 500, headers: corsHeaders }
      )
    }

    // 5. Generate Token04 and wrap into Kit Token
    const token04 = await generateToken04(appId, serverSecret, userID)
    const kitToken = buildKitToken(
      token04,
      appId,
      roomID,
      userID,
      userName || 'User'
    )

    // 6. Return the Kit Token
    return NextResponse.json(
      { success: true, token: kitToken },
      { headers: corsHeaders }
    )
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500, headers: corsHeaders }
    )
  }
}
