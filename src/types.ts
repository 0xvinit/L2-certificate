export type Program = {
  _id?: string;
  adminAddress: string; // issuer wallet address
  adminId: string; // Admin ID who created this program
  name: string;
  code: string;
  startDate?: string;
  endDate?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type Certificate = {
  _id?: string;
  adminAddress: string;
  adminId: string; // Admin ID who issued this certificate
  programId: string;
  studentName: string;
  studentId: string;
  date: string;
  hash: string;
  txHash: string;
  verifyUrl: string;
  revoked: boolean;
  createdAt: string;
};

export type Admin = {
  _id?: string;
  adminId: string; // Changed from email to adminId
  passwordHash: string;
  walletAddress?: string;
  university?: string; // University name
  isSuperAdmin: boolean;
  createdBy?: string; // super admin adminId who created this
  createdAt: string;
  updatedAt: string;
};

export type WalletConnection = {
  _id?: string;
  adminId: string; // Changed from adminEmail to adminId
  walletAddress: string;
  chainId?: number;
  walletType?: string; // e.g., "privy", "metamask"
  connectedAt: string;
  lastActiveAt: string;
};


