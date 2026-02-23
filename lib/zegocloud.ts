import { ZegoUIKitPrebuilt } from '@zegocloud/zego-uikit-prebuilt'

const ZEGO_APP_ID = 441258324
const ZEGO_SERVER_SECRET = '19be871f7cb2c940c3cc65e32c825ea6'

/**
 * Generates a ZegoCloud Kit Token using the SDK's built-in method.
 * TODO: Move token generation to server-side API route for production.
 */
export async function generateToken(
  roomID: string,
  userID: string,
  userName: string
): Promise<string> {
  return ZegoUIKitPrebuilt.generateKitTokenForTest(
    ZEGO_APP_ID,
    ZEGO_SERVER_SECRET,
    roomID,
    userID,
    userName
  )
}

export { ZegoUIKitPrebuilt }
