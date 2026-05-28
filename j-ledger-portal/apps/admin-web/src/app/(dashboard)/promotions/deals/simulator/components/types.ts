export interface SimulatorDeal {
  id: string;
  title: string;
  brandName: string;
  pointsRequired: number;
  imageUrl: string;
}

export interface PosSlip {
  code?: string;
  mode: string;
  dealTitle?: string;
  brandName?: string;
  amount?: string;
  points?: string;
  usedAt: string;
  terminalId: string;
}
