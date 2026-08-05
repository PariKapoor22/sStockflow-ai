import { CommonModule } from '@angular/common';
import { Component, Input, OnChanges, OnDestroy, SimpleChanges } from '@angular/core';
import { FormsModule } from '@angular/forms';

export type OperationView = 'transfers' | 'purchase' | 'orders' | 'returns';

interface TransferPlan {
  id: string;
  sku: string;
  product: string;
  from: string;
  to: string;
  quantity: number;
  priority: string;
  status: string;
  distanceKm: number;
  eta: string;
  reason: string;
  co2SavedKg: number;
  serviceLift: number;
}

interface PurchasePlan {
  id: string;
  sku: string;
  product: string;
  supplier: string;
  quantity: number;
  unitCost: number;
  needBy: string;
  leadTimeDays: number;
  coverDays: number;
  confidence: number;
  risk: string;
  status: string;
}

interface CustomerOrder {
  id: string;
  customer: string;
  city: string;
  channel: string;
  warehouse: string;
  itemCount: number;
  value: number;
  promisedDate: string;
  fulfillment: number;
  status: string;
}

interface ReturnCase {
  id: string;
  orderId: string;
  customer: string;
  product: string;
  quantity: number;
  reason: string;
  disposition: string;
  value: number;
  receivedDate: string;
  warehouse: string;
  status: string;
}

@Component({
  selector: 'sf-operations-workspace',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './operations-workspace.component.html',
  styleUrl: './operations-workspace.component.css'
})
export class OperationsWorkspaceComponent implements OnChanges, OnDestroy {
  @Input({ required: true }) view: OperationView = 'transfers';
  @Input() tenantLabel = 'Selected tenant';
  @Input() searchQuery = '';

  statusFilter = 'ALL';
  locationFilter = 'ALL';
  toastMessage = '';
  private toastTimer?: number;

  transfers: TransferPlan[] = [
    { id: 'TRF-2048', sku: 'SKU-PARA-650', product: 'Paracetamol 650 mg', from: 'Chennai Central', to: 'Bengaluru North', quantity: 840, priority: 'Critical', status: 'Awaiting approval', distanceKm: 347, eta: 'Today, 18:30', reason: 'Stockout projected in 2.1 days', co2SavedKg: 18.4, serviceLift: 12 },
    { id: 'TRF-2047', sku: 'SKU-AMOX-500', product: 'Amoxicillin 500 mg', from: 'Hyderabad Hub', to: 'Chennai Central', quantity: 460, priority: 'High', status: 'Approved', distanceKm: 628, eta: 'Tomorrow, 09:00', reason: 'Safety stock breach at destination', co2SavedKg: 11.2, serviceLift: 8 },
    { id: 'TRF-2046', sku: 'SKU-ORS-21', product: 'ORS Sachet 21 g', from: 'Bengaluru North', to: 'Mysuru DC', quantity: 1200, priority: 'Medium', status: 'In transit', distanceKm: 148, eta: 'Today, 15:45', reason: 'Demand surge after regional campaign', co2SavedKg: 22.8, serviceLift: 6 },
    { id: 'TRF-2045', sku: 'SKU-CET-10', product: 'Cetirizine 10 mg', from: 'Chennai Central', to: 'Coimbatore West', quantity: 320, priority: 'Medium', status: 'Delivered', distanceKm: 505, eta: 'Delivered 10:24', reason: 'Balanced excess inventory', co2SavedKg: 8.6, serviceLift: 4 }
  ];

  purchasePlans: PurchasePlan[] = [
    { id: 'PLAN-8821', sku: 'SKU-INS-GLR', product: 'Insulin Glargine', supplier: 'MedAxis Biologics', quantity: 480, unitCost: 618, needBy: '09 Aug 2026', leadTimeDays: 4, coverDays: 3.2, confidence: 92, risk: 'Critical', status: 'Ready for approval' },
    { id: 'PLAN-8820', sku: 'SKU-AMOX-500', product: 'Amoxicillin 500 mg', supplier: 'NovaCure Labs', quantity: 2400, unitCost: 7.8, needBy: '11 Aug 2026', leadTimeDays: 6, coverDays: 6.8, confidence: 88, risk: 'High', status: 'Supplier review' },
    { id: 'PLAN-8819', sku: 'SKU-PARA-650', product: 'Paracetamol 650 mg', supplier: 'Apex Remedies', quantity: 5000, unitCost: 2.45, needBy: '13 Aug 2026', leadTimeDays: 5, coverDays: 8.4, confidence: 95, risk: 'High', status: 'Draft' },
    { id: 'PLAN-8818', sku: 'SKU-ORS-21', product: 'ORS Sachet 21 g', supplier: 'WellSpring Pharma', quantity: 3200, unitCost: 5.1, needBy: '16 Aug 2026', leadTimeDays: 7, coverDays: 11.7, confidence: 84, risk: 'Medium', status: 'Approved' }
  ];

  orders: CustomerOrder[] = [
    { id: 'SO-10842', customer: 'Lotus Care Pharmacy', city: 'Chennai', channel: 'B2B Portal', warehouse: 'Chennai Central', itemCount: 14, value: 68420, promisedDate: 'Today, 16:00', fulfillment: 100, status: 'Ready to ship' },
    { id: 'SO-10841', customer: 'GreenCross Medicals', city: 'Bengaluru', channel: 'EDI', warehouse: 'Bengaluru North', itemCount: 8, value: 42180, promisedDate: 'Today, 18:30', fulfillment: 86, status: 'Picking' },
    { id: 'SO-10840', customer: 'City Health Mart', city: 'Hyderabad', channel: 'Sales desk', warehouse: 'Hyderabad Hub', itemCount: 22, value: 116750, promisedDate: 'Tomorrow, 10:00', fulfillment: 64, status: 'Allocated' },
    { id: 'SO-10839', customer: 'MediPoint Stores', city: 'Coimbatore', channel: 'B2B Portal', warehouse: 'Coimbatore West', itemCount: 6, value: 27990, promisedDate: '08 Aug 2026', fulfillment: 100, status: 'Shipped' },
    { id: 'SO-10838', customer: 'Aarogya Distributors', city: 'Mysuru', channel: 'EDI', warehouse: 'Mysuru DC', itemCount: 11, value: 53760, promisedDate: '08 Aug 2026', fulfillment: 38, status: 'On hold' }
  ];

  returns: ReturnCase[] = [
    { id: 'RET-3621', orderId: 'SO-10791', customer: 'Lotus Care Pharmacy', product: 'Insulin Glargine', quantity: 12, reason: 'Cold-chain excursion', disposition: 'Quality inspection', value: 8856, receivedDate: 'Today, 09:42', warehouse: 'Chennai Central', status: 'Needs review' },
    { id: 'RET-3620', orderId: 'SO-10768', customer: 'MediPoint Stores', product: 'Paracetamol 650 mg', quantity: 80, reason: 'Transit damage', disposition: 'Supplier claim', value: 3120, receivedDate: 'Yesterday', warehouse: 'Coimbatore West', status: 'Approved' },
    { id: 'RET-3619', orderId: 'SO-10744', customer: 'GreenCross Medicals', product: 'Cetirizine 10 mg', quantity: 44, reason: 'Short-dated stock', disposition: 'FEFO reallocation', value: 2464, receivedDate: '04 Aug 2026', warehouse: 'Bengaluru North', status: 'Processing' },
    { id: 'RET-3618', orderId: 'SO-10712', customer: 'City Health Mart', product: 'ORS Sachet 21 g', quantity: 120, reason: 'Order entry error', disposition: 'Return to stock', value: 1044, receivedDate: '03 Aug 2026', warehouse: 'Hyderabad Hub', status: 'Closed' }
  ];

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['view']) {
      this.statusFilter = 'ALL';
      this.locationFilter = 'ALL';
    }
  }

  ngOnDestroy(): void {
    if (this.toastTimer) window.clearTimeout(this.toastTimer);
  }

  get pageCopy(): { eyebrow: string; title: string; description: string; action: string } {
    const copy: Record<OperationView, { eyebrow: string; title: string; description: string; action: string }> = {
      transfers: { eyebrow: 'NETWORK ORCHESTRATION', title: 'Smart Transfers', description: 'Rebalance inventory across warehouses with route-aware, low-carbon transfer recommendations.', action: 'Generate transfer plan' },
      purchase: { eyebrow: 'REPLENISHMENT CONTROL', title: 'Purchase Planning', description: 'Convert forecast signals into reviewable supplier plans while protecting cash and service levels.', action: 'Create purchase plan' },
      orders: { eyebrow: 'ORDER FULFILMENT', title: 'Orders', description: 'Prioritize, allocate and track customer orders across the distribution network.', action: 'Create order' },
      returns: { eyebrow: 'REVERSE LOGISTICS', title: 'Returns', description: 'Triage returns quickly, protect quality and recover value through the right disposition path.', action: 'Register return' }
    };
    return copy[this.view];
  }

  locations(): string[] {
    const values = this.view === 'transfers'
      ? this.transfers.flatMap(item => [item.from, item.to])
      : this.view === 'purchase'
        ? this.purchasePlans.map(item => item.supplier)
        : this.view === 'orders'
          ? this.orders.map(item => item.warehouse)
          : this.returns.map(item => item.warehouse);
    return [...new Set(values)].sort();
  }

  statuses(): string[] {
    const values = this.view === 'transfers'
      ? this.transfers.map(item => item.status)
      : this.view === 'purchase'
        ? this.purchasePlans.map(item => item.status)
        : this.view === 'orders'
          ? this.orders.map(item => item.status)
          : this.returns.map(item => item.status);
    return [...new Set(values)].sort();
  }

  filteredTransfers(): TransferPlan[] {
    return this.transfers.filter(item => this.matches(item.status, [item.id, item.sku, item.product, item.from, item.to, item.reason], [item.from, item.to]));
  }

  filteredPurchasePlans(): PurchasePlan[] {
    return this.purchasePlans.filter(item => this.matches(item.status, [item.id, item.sku, item.product, item.supplier, item.risk], [item.supplier]));
  }

  filteredOrders(): CustomerOrder[] {
    return this.orders.filter(item => this.matches(item.status, [item.id, item.customer, item.city, item.channel, item.warehouse], [item.warehouse]));
  }

  filteredReturns(): ReturnCase[] {
    return this.returns.filter(item => this.matches(item.status, [item.id, item.orderId, item.customer, item.product, item.reason, item.disposition], [item.warehouse]));
  }

  transferUnits(): number {
    return this.transfers.reduce((sum, item) => sum + item.quantity, 0);
  }

  transferCo2Saved(): number {
    return this.transfers.reduce((sum, item) => sum + item.co2SavedKg, 0);
  }

  purchasePlanValue(): number {
    return this.purchasePlans.reduce((sum, item) => sum + item.quantity * item.unitCost, 0);
  }

  orderValue(): number {
    return this.orders.reduce((sum, item) => sum + item.value, 0);
  }

  averageFulfillment(): number {
    return this.orders.reduce((sum, item) => sum + item.fulfillment, 0) / Math.max(this.orders.length, 1);
  }

  returnValue(): number {
    return this.returns.reduce((sum, item) => sum + item.value, 0);
  }

  transferCount(status: string): number {
    return this.transfers.filter(item => item.status === status).length;
  }

  orderCount(status: string): number {
    return this.orders.filter(item => item.status === status).length;
  }

  statusClass(value: string): string {
    return value.toLowerCase().replaceAll(' ', '-');
  }

  approveTransfer(item: TransferPlan): void {
    item.status = item.status === 'Awaiting approval' ? 'Approved' : item.status;
    this.showToast(`${item.id} is staged as approved in this UI preview.`);
  }

  approvePurchase(item: PurchasePlan): void {
    item.status = 'Approved';
    this.showToast(`${item.id} is staged as approved in this UI preview.`);
  }

  advanceOrder(item: CustomerOrder): void {
    const next: Record<string, string> = { Allocated: 'Picking', Picking: 'Ready to ship', 'Ready to ship': 'Shipped', 'On hold': 'Allocated' };
    item.status = next[item.status] ?? item.status;
    item.fulfillment = item.status === 'Shipped' || item.status === 'Ready to ship' ? 100 : Math.max(item.fulfillment, 72);
    this.showToast(`${item.id} moved to ${item.status}. Demo state only.`);
  }

  approveReturn(item: ReturnCase): void {
    item.status = item.status === 'Needs review' ? 'Approved' : 'Processing';
    this.showToast(`${item.id} moved to ${item.status}. Demo state only.`);
  }

  triggerPrimaryAction(): void {
    this.showToast(`${this.pageCopy.action} opened as a UI preview. Backend submission is not connected yet.`);
  }

  private matches(status: string, searchable: string[], locations: string[]): boolean {
    const query = this.searchQuery.trim().toLowerCase();
    const matchesSearch = !query || searchable.some(value => value.toLowerCase().includes(query));
    const matchesStatus = this.statusFilter === 'ALL' || status === this.statusFilter;
    const matchesLocation = this.locationFilter === 'ALL' || locations.includes(this.locationFilter);
    return matchesSearch && matchesStatus && matchesLocation;
  }

  private showToast(message: string): void {
    this.toastMessage = message;
    if (this.toastTimer) window.clearTimeout(this.toastTimer);
    this.toastTimer = window.setTimeout(() => this.toastMessage = '', 3200);
  }
}
