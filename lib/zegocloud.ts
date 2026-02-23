import { ZegoUIKitPrebuilt } from '@zegocloud/zego-uikit-prebuilt'

const appID = Number(process.env.NEXT_PUBLIC_ZEGO_APP_ID)
const serverSecret = process.env.NEXT_PUBLIC_ZEGO_SERVER_SECRET!

/**
 * Generates a ZegoCloud Kit Token using the SDK's built-in method.
 */
export function generateKitToken(
  roomID: string,
  userID: string,
  userName: string
): string {
  return ZegoUIKitPrebuilt.generateKitTokenForTest(
    appID,
    serverSecret,
    roomID,
    userID,
    userName
  )
}

export { ZegoUIKitPrebuilt }
