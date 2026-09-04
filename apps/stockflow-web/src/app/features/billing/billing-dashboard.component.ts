import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

type InvoiceStatus = 'Paid' | 'Partially paid' | 'Overdue';

interface BillingInvoice {
  invoiceNumber: string;
  customer: string;
  date: string;
  taxableAmount: number;
  gst: number;
  total: number;
  paid: number;
  status: InvoiceStatus;
}

interface CashFlowPeriod {
  label: string;
  inflow: number;
  outflow: number;
}

@Component({
  selector: 'sf-billing-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './billing-dashboard.component.html',
  styleUrl: './billing-dashboard.component.css'
})
export class BillingDashboardComponent {
  @Input() tenantLabel = 'Current tenant';

  // Temporary frontend fixture. Replace with a tenant-scoped billing API when
  // invoice, payment and cash-transaction entities are available in core-api.
  readonly invoices: BillingInvoice[] = [
    { invoiceNumber: 'INV-2026-0418', customer: 'Northeast Care Supplies', date: '18 Aug 2026', taxableAmount: 184000, gst: 33120, total: 217120, paid: 217120, status: 'Paid' },
    { invoiceNumber: 'INV-2026-0419', customer: 'Shillong Health Partners', date: '21 Aug 2026', taxableAmount: 126500, gst: 22770, total: 149270, paid: 75000, status: 'Partially paid' },
    { invoiceNumber: 'INV-2026-0420', customer: 'Imphal Community Clinic', date: '25 Aug 2026', taxableAmount: 98000, gst: 17640, total: 115640, paid: 0, status: 'Overdue' },
    { invoiceNumber: 'INV-2026-0421', customer: 'Assam Essential Network', date: '29 Aug 2026', taxableAmount: 211000, gst: 37980, total: 248980, paid: 248980, status: 'Paid' }
  ];

  readonly cashFlow: CashFlowPeriod[] = [
    { label: 'May', inflow: 210000, outflow: 128000 },
    { label: 'Jun', inflow: 264000, outflow: 158000 },
    { label: 'Jul', inflow: 239000, outflow: 144000 },
    { label: 'Aug', inflow: 292000, outflow: 171000 }
  ];

  readonly gstSummary = [
    { label: 'CGST collected', amount: 42630, tone: 'cgst' },
    { label: 'SGST collected', amount: 42630, tone: 'sgst' },
    { label: 'IGST collected', amount: 26250, tone: 'igst' }
  ];

  readonly cashBalance = 638420;
  readonly gstPayable = 111510;

  get totalRevenue(): number { return this.invoices.reduce((sum, invoice) => sum + invoice.total, 0); }
  get outstanding(): number { return this.invoices.reduce((sum, invoice) => sum + invoice.total - invoice.paid, 0); }
  get maxCashFlow(): number { return Math.max(...this.cashFlow.flatMap(period => [period.inflow, period.outflow])); }
  balance(invoice: BillingInvoice): number { return invoice.total - invoice.paid; }
  barHeight(value: number): number { return Math.round((value / this.maxCashFlow) * 100); }
}
