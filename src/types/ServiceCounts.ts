export type ServiceCounts = {
  liveStream: number;
  returns: number;
  serviceRequests: number;
  /** Chats in the TikTok status (any manager); absent in snapshots taken before it was counted. */
  tiktok?: number;
};
