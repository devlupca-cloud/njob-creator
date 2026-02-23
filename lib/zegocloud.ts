import { ZegoUIKitPrebuilt } from '@zegocloud/zego-uikit-prebuilt'

/**
 * Generates a ZegoCloud Kit Token via server-side API route.
 * The serverSecret NEVER leaves the server — only the final token is returned.
 */
export async function generateToken(
  roomID: string,
  userID: string,
  userName: string
): Promise<string> {
  const res = await fetch('/api/zego-token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ roomID, userID, userName }),
  })

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(
      `Falha ao gerar token de vídeo: ${body.error ?? res.statusText}`
    )
  }

  const data = await res.json()
  if (!data.token) {
    throw new Error('Falha ao gerar token de vídeo: resposta inválida')
  }

  return data.token
}

export { ZegoUIKitPrebuilt }
