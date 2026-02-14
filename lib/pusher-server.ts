import Pusher from "pusher";

const appId = process.env.PUSHER_APP_ID;
const key = process.env.PUSHER_KEY;
const secret = process.env.PUSHER_SECRET;
const cluster = process.env.PUSHER_CLUSTER;

export const isPusherConfigured = Boolean(appId && key && secret && cluster);

let pusherServer: Pusher | null = null;

export function getPusherServer(): Pusher | null {
  if (!isPusherConfigured) return null;

  if (!pusherServer) {
    pusherServer = new Pusher({
      appId: appId!,
      key: key!,
      secret: secret!,
      cluster: cluster!,
      useTLS: true,
    });
  }

  return pusherServer;
}
