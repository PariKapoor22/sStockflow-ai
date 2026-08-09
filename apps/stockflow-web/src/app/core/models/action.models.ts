export type ProposalType = 'TRANSFER' | 'PURCHASE';
export type ProposalStatus = 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED' | 'CANCELLED';

export interface ActionProposal {
  proposalId: string;
  tenantId: string;
  proposalType: ProposalType;
  status: ProposalStatus;
  skuId: string;
  quantity: number;
  sourceWarehouseId?: string;
  destinationWarehouseId?: string;
  supplierReference?: string;
  unitCost?: number;
  transportCost?: number;
  currency: string;
  reason: string;
  recommendationEvidence?: string;
  createdBy: string;
  submittedBy?: string;
  reviewedBy?: string;
  reviewComment?: string;
  createdAt: string;
  updatedAt: string;
  submittedAt?: string;
  reviewedAt?: string;
  version: number;
}

export interface ProposalHistory {
  historyId: string;
  proposalId: string;
  fromStatus?: ProposalStatus;
  toStatus: ProposalStatus;
  changedBy: string;
  comment?: string;
  changedAt: string;
}

export interface TransferProposalRequest {
  skuId: string;
  quantity: number;
  sourceWarehouseId: string;
  destinationWarehouseId: string;
  unitCost?: number;
  transportCost?: number;
  currency: string;
  reason: string;
  recommendationEvidence?: string;
}

export interface PurchaseProposalRequest {
  skuId: string;
  quantity: number;
  destinationWarehouseId: string;
  supplierReference?: string;
  unitCost?: number;
  currency: string;
  reason: string;
  recommendationEvidence?: string;
}
