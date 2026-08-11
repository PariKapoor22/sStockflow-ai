export interface ReplenishmentPlan {
  recommendationId: string; warehouseId: string; warehouseName: string; skuId: string; skuName: string;
  supplierId?: string; supplierName: string; leadTimeDays: number; usableQuantity: number; openPurchaseQuantity: number;
  averageDailyDemand: number; demandSource: string; coverDays?: number; safetyStock: number; targetStock: number;
  reorderMultiple: number; recommendedQuantity: number; unitCost: number; plannedValue: number; needBy: string;
  confidencePercent: number; risk: string; status: string; explanation: string; asOfDate: string;
}

export interface ReplenishmentSummary {
  asOfDate?: string; targetCoverDays: number; recommendationCount: number; criticalCount: number;
  plannedSpend: number; openPurchaseQuantity: number; plans: ReplenishmentPlan[];
}
