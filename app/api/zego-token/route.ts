import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const corsHeaders = {
  'Content-Type': 'application/json',
}

/**
 * Generates a ZegoCloud Token04 using AES-CBC encryption (server-side only).
 */
async function generateToken04(
  appId: number,
  serverSecret: string,
  userId: string,
  effectiveTimeInSeconds = 7200
): Promise<string> {
  const createTime = Math.floor(Date.now() / 1000)
  const expireTime = createTime + effectiveTimeInSeconds
  const nonce = crypto.getRandomValues(new Uint32Array(1))[0]

  const payloadObject = {
    app_id: appId,
    user_id: userId,
    nonce,
    create_time: createTime,
    expire_time: expireTime,
  }
  const payload = JSON.stringify(payloadObject)

  // Random 16-byte IV for AES-CBC
  const iv = crypto.getRandomValues(new Uint8Array(16))

  // ZegoCloud serverSecret is a 32-char hex string → convert to 16 bytes for AES-128
  const trimmed = serverSecret.trim()
  const keyData = Buffer.from(trimmed, 'hex')
  const key = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'AES-CBC' },
    false,
    ['encrypt']
  )

  // Encrypt payload with AES-CBC (PKCS7 padding is automatic)
  const encrypted = new Uint8Array(
    await crypto.subtle.encrypt(
      { name: 'AES-CBC', iv },
      key,
      new TextEncoder().encode(payload)
    )
  )

  // Binary format: expireTime(8) + ivLen(2) + iv + encryptedLen(2) + encrypted
  const totalLen = 8 + 2 + iv.length + 2 + encrypted.length
  const buf = new Uint8Array(totalLen)
  const dv = new DataView(buf.buffer)

  let offset = 0
  dv.setBigInt64(offset, BigInt(expireTime), false)
  offset += 8
  dv.setUint16(offset, iv.length, false)
  offset += 2
  buf.set(iv, offset)
  offset += iv.length
  dv.setUint16(offset, encrypted.length, false)
  offset += 2
  buf.set(encrypted, offset)

  return '04' + Buffer.from(buf).toString('base64')
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
