export type Chat = {
  status: string;
  initialSource: string;
  ownerId?: string;
  ownerName?: string;
  assignedManagerId?: number;
  assignedManagerName?: string;
  lastMessageCreatedAt: string;
};
