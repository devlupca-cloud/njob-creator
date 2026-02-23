import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createCipheriv, randomBytes } from 'crypto'

const corsHeaders = {
  'Content-Type': 'application/json',
}

/**
 * Generates a ZegoCloud Token04 using AES-128-CBC (matches official SDK).
 */
function generateToken04(
  appId: number,
  serverSecret: string,
  userId: string,
  effectiveTimeInSeconds = 7200
): string {
  const createTime = Math.floor(Date.now() / 1000)
  const expireTime = createTime + effectiveTimeInSeconds
  const nonce = randomBytes(4).readUInt32BE(0)

  const payload = JSON.stringify({
    app_id: appId,
    user_id: userId,
    nonce,
    ctime: createTime,
    expire: expireTime,
    payload: '',
  })

  const iv = randomBytes(16)

  // AES-128-CBC: use first 16 bytes of the secret (UTF-8)
  const key = Buffer.alloc(16)
  Buffer.from(serverSecret, 'utf8').copy(key, 0, 0, 16)

  const cipher = createCipheriv('aes-128-cbc', key, iv)
  const encrypted = Buffer.concat([cipher.update(payload, 'utf8'), cipher.final()])

  // Binary: expireTime(8) + ivLen(2) + iv(16) + encLen(2) + encrypted
  const buf = Buffer.alloc(8 + 2 + iv.length + 2 + encrypted.length)
  buf.writeBigInt64BE(BigInt(expireTime), 0)
  buf.writeUInt16BE(iv.length, 8)
  iv.copy(buf, 10)
  buf.writeUInt16BE(encrypted.length, 10 + iv.length)
  encrypted.copy(buf, 12 + iv.length)

  return '04' + buf.toString('base64')
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
  return Buffer.from(
    JSON.stringify({
      ver: 1,
      token: token04,
      app_id: appId,
      user_id: userID,
      user_name: userName,
      room_id: roomID,
    })
  ).toString('base64')
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

    // 4. Get ZegoCloud credentials from server env
    const appId = Number(process.env.ZEGO_APP_ID)
    const serverSecret = process.env.ZEGO_SERVER_SECRET?.trim()
    if (!appId || !serverSecret) {
      return NextResponse.json(
        { error: 'Credenciais ZegoCloud não configuradas no servidor' },
        { status: 500, headers: corsHeaders }
      )
    }

    // 5. Generate Token04 and wrap into Kit Token
    const token04 = generateToken04(appId, serverSecret, userID)
    const kitToken = buildKitToken(token04, appId, roomID, userID, userName || 'User')

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
