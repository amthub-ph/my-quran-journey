declare module "web-push" {
  const webpush: {
    sendNotification(subscription: { endpoint: string; keys: { p256dh: string; auth: string } }, payload: string, options: {
      TTL: number; urgency: "high"; timeout: number;
      vapidDetails: { subject: string; publicKey: string; privateKey: string };
    }): Promise<unknown>;
  };
  export default webpush;
}
