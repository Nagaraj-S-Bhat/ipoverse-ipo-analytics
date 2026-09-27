export interface RawLiveGmpRow {
  companyName: string;
  gmpRaw: string;
  ratingRaw: string;
  subscriptionRaw: string;
  priceRaw: string;
  issueSizeRaw: string;
  lotRaw: string;
  openDateRaw: string;
  closeDateRaw: string;
}

export interface RawIpoRow {
  companyName: string;
  issuePriceRaw: string;
  sizeRaw: string;
  issueDatesRaw: string;
}

export interface RawPerformanceRow {
  companyName: string;
  issuePriceRaw: string;
  listingPriceRaw: string;
  listingGainPercentRaw: string;
  currentPriceRaw: string;
  currentGainPercentRaw: string;
  allTimeHighRaw?: string;
  allTimeLowRaw?: string;
}

export interface RawLiveSummaryRow {
  companyName: string;
  priceLotRaw: string;
  gmpRaw: string;
  subscriptionRaw: string;
  reviewRaw: string;
  gmpTrendRaw?: string;
}

export interface SyncResult {
  sheetName: string;
  recordsRead: number;
  recordsCreated: number;
  recordsUpdated: number;
  recordsDeleted: number;
  errorMessage?: string;
  startedAt: Date;
  completedAt: Date;
  durationMs: number;
}
