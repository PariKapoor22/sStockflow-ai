import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize, forkJoin } from 'rxjs';
import { DashboardOverview } from '../../core/models/dashboard.models';
import {
  DemandSku,
  DemandSummary,
  DemandTrend,
  InventoryRisk,
  InventoryRiskSummary
} from '../../core/models/intelligence.models';
import { DashboardDataService } from '../../core/services/dashboard-data.service';
import { IntelligenceDataService } from '../../core/services/intelligence-data.service';

type ViewId =
  | 'dashboard'
  | 'demand'
  | 'inventory'
  | 'risks'
  | 'recommendations'
  | 'transfers'
  | 'purchase'
  | 'orders'
  | 'returns'
  | 'warehouses'
  | 'products'
  | 'batches'
  | 'users'
  | 'settings'
  | 'integrations';

interface NavigationItem {
  label: string;
  icon: string;
  view: ViewId;
}

@Component({
  selector: 'sf-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {
  data?: DashboardOverview;
  riskSummary?: InventoryRiskSummary;
  inventoryRisks: InventoryRisk[] = [];
  demandSummary?: DemandSummary;
  demandSkus: DemandSku[] = [];
  demandTrend?: DemandTrend;

  activeView: ViewId = 'dashboard';
  loading = true;
  pageLoading = false;
  error = '';
  pageError = '';
  copilotInput = '';
  sidebarCollapsed = false;

  selectedTenant = localStorage.getItem('stockflowTenantId') ?? 'TEN-ACME-PHARMA';
  selectedWindowDays = 30;
  selectedRiskType = '';
  selectedSeverity = '';
  riskLimit = 100;

  readonly tenants = [
    { id: 'TEN-ACME-PHARMA', label: 'Acme Pharma' },
    { id: 'TEN-FRESH-MART', label: 'Fresh Mart' },
    { id: 'TEN-URBAN-TRADE', label: 'Urban Trade' }
  ];

  readonly riskTypes = [
    { value: '', label: 'All alert types' },
    { value: 'STOCKOUT_RISK', label: 'Stockout risk' },
    { value: 'SAFETY_STOCK_BREACH', label: 'Safety-stock breach' },
    { value: 'INVENTORY_DATA_GAP', label: 'Inventory data gap' },
    { value: 'NEAR_EXPIRY', label: 'Near expiry' },
    { value: 'EXPIRED_INVENTORY', label: 'Expired inventory' },
    { value: 'EXCESS_INVENTORY', label: 'Excess inventory' },
    { value: 'SLOW_MOVING', label: 'Slow moving' },
    { value: 'DEMAND_SURGE', label: 'Demand surge' }
  ];

  readonly navGroups: { title: string; items: NavigationItem[] }[] = [
    {
      title: '',
      items: [{ label: 'Dashboard', icon: '⌂', view: 'dashboard' }]
    },
    {
      title: 'INTELLIGENCE',
      items: [
        { label: 'Demand Forecast', icon: '▥', view: 'demand' },
        { label: 'Inventory Analytics', icon: '⌁', view: 'inventory' },
        { label: 'Risk & Alerts', icon: '△', view: 'risks' },
        { label: 'Recommendations', icon: '▣', view: 'recommendations' }
      ]
    },
    {
      title: 'OPERATIONS',
      items: [
        { label: 'Transfers', icon: '⇄', view: 'transfers' },
        { label: 'Purchase Planning', icon: '🛒', view: 'purchase' },
        { label: 'Orders', icon: '▤', view: 'orders' },
        { label: 'Returns', icon: '↶', view: 'returns' }
      ]
    },
    {
      title: 'INVENTORY',
      items: [
        { label: 'Warehouses', icon: '⌂', view: 'warehouses' },
        { label: 'Products', icon: '◇', view: 'products' },
        { label: 'Batches', icon: '▰', view: 'batches' }
      ]
    },
    {
      title: 'ADMIN',
      items: [
        { label: 'Users & Roles', icon: '♙', view: 'users' },
        { label: 'Settings', icon: '⚙', view: 'settings' },
        { label: 'Integrations', icon: '⚙', view: 'integrations' }
      ]
    }
  ];

  constructor(
    private readonly dashboardData: DashboardDataService,
    private readonly intelligenceData: IntelligenceDataService
  ) {}

  ngOnInit(): void {
    this.loadDashboard();
  }

  selectView(view: ViewId): void {
    this.activeView = view;
    this.pageError = '';

    if (view === 'dashboard' || view === 'recommendations') {
      if (!this.data) this.loadDashboard();
      return;
    }

    if (view === 'demand') {
      this.loadDemandWorkspace();
      return;
    }

    if (view === 'inventory') {
      this.loadInventoryWorkspace();
      return;
    }

    if (view === 'risks') {
      this.loadRiskWorkspace();
    }
  }

  onTenantChange(): void {
    localStorage.setItem('stockflowTenantId', this.selectedTenant);
    this.data = undefined;
    this.riskSummary = undefined;
    this.inventoryRisks = [];
    this.demandSummary = undefined;
    this.demandSkus = [];
    this.demandTrend = undefined;

    this.loadDashboard(() => {
      if (this.activeView !== 'dashboard' && this.activeView !== 'recommendations') {
        this.selectView(this.activeView);
      }
    });
  }

  onDemandWindowChange(): void {
    this.loadDemandWorkspace();
  }

  applyRiskFilters(): void {
    this.pageLoading = true;
    this.pageError = '';
    this.intelligenceData.risks(this.selectedRiskType, this.selectedSeverity, this.riskLimit)
      .pipe(finalize(() => this.pageLoading = false))
      .subscribe({
        next: risks => this.inventoryRisks = risks,
        error: () => this.pageError = 'Risk records could not be loaded from the API.'
      });
  }

  toggleSidebar(): void {
    this.sidebarCollapsed = !this.sidebarCollapsed;
  }

  sendCopilotMessage(): void {
    const message = this.copilotInput.trim();
    if (!message || !this.data) return;
    this.data.copilotMessages.push({ role: 'user', text: message, timestamp: 'Now' });
    this.data.copilotMessages.push({
      role: 'assistant',
      text: 'The live AI agent is planned for Phase 3. This frontend currently uses verified dashboard, demand and risk APIs.',
      timestamp: 'Now'
    });
    this.copilotInput = '';
  }

  polyline(values: number[], width = 360, height = 160, padding = 12): string {
    if (!values.length) return '';
    const min = Math.min(...values);
    const max = Math.max(...values);
    const span = Math.max(max - min, 1);
    return values.map((value, index) => {
      const x = padding + index * (width - padding * 2) / Math.max(values.length - 1, 1);
      const y = height - padding - ((value - min) / span) * (height - padding * 2);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(' ');
  }

  forecastPoints(): string {
    return this.data ? this.polyline(this.data.demandForecast.forecast) : '';
  }

  actualPoints(): string {
    return this.data ? this.polyline(this.data.demandForecast.actual) : '';
  }

  inventoryTrendPoints(): string {
    return this.data ? this.polyline(this.data.inventoryTrend.values, 260, 160) : '';
  }

  demandActualPoints(): string {
    return this.demandTrend ? this.polyline(this.demandTrend.actual, 900, 260, 20) : '';
  }

  demandForecastPoints(): string {
    return this.demandTrend ? this.polyline(this.demandTrend.forecast, 900, 260, 20) : '';
  }

  riskDonutStyle(): string {
    if (!this.data) return '#e5e7eb';
    let start = 0;
    const segments = this.data.riskBreakdown.map(item => {
      const end = start + item.percentage * 3.6;
      const value = `${item.color} ${start}deg ${end}deg`;
      start = end;
      return value;
    });
    return `conic-gradient(${segments.join(', ')})`;
  }

  riskTypeLabel(type: string): string {
    return type.replaceAll('_', ' ').toLowerCase().replace(/\b\w/g, value => value.toUpperCase());
  }

  pageTitle(): string {
    const titles: Record<ViewId, string> = {
      dashboard: 'Dashboard',
      demand: 'Demand Forecast',
      inventory: 'Inventory Analytics',
      risks: 'Risk & Alerts',
      recommendations: 'Recommendations',
      transfers: 'Transfers',
      purchase: 'Purchase Planning',
      orders: 'Orders',
      returns: 'Returns',
      warehouses: 'Warehouses',
      products: 'Products',
      batches: 'Batches',
      users: 'Users & Roles',
      settings: 'Settings',
      integrations: 'Integrations'
    };
    return titles[this.activeView];
  }

  operationalRiskCount(): number {
    if (!this.riskSummary) return 0;
    return this.riskSummary.stockoutRiskCount
      + this.riskSummary.safetyStockBreachCount
      + this.riskSummary.nearExpiryCount
      + this.riskSummary.expiredCount
      + this.riskSummary.excessInventoryCount
      + this.riskSummary.slowMovingCount
      + this.riskSummary.demandSurgeCount;
  }

  isImplementedView(): boolean {
    return ['dashboard', 'demand', 'inventory', 'risks', 'recommendations'].includes(this.activeView);
  }

  private loadDashboard(afterLoad?: () => void): void {
    this.loading = true;
    this.error = '';
    this.dashboardData.loadOverview()
      .pipe(finalize(() => this.loading = false))
      .subscribe({
        next: data => {
          this.data = data;
          afterLoad?.();
        },
        error: () => this.error = 'The dashboard data could not be loaded.'
      });
  }

  private loadDemandWorkspace(): void {
    this.pageLoading = true;
    this.pageError = '';
    forkJoin({
      summary: this.intelligenceData.demandSummary(this.selectedWindowDays),
      skus: this.intelligenceData.demandSkus(this.selectedWindowDays, 50),
      trend: this.intelligenceData.demandTrend(16)
    }).pipe(finalize(() => this.pageLoading = false))
      .subscribe({
        next: result => {
          this.demandSummary = result.summary;
          this.demandSkus = result.skus;
          this.demandTrend = result.trend;
        },
        error: () => this.pageError = 'Demand analytics could not be loaded from the API.'
      });
  }

  loadRiskWorkspace(): void {
    this.pageLoading = true;
    this.pageError = '';
    forkJoin({
      summary: this.intelligenceData.riskSummary(),
      risks: this.intelligenceData.risks(this.selectedRiskType, this.selectedSeverity, this.riskLimit)
    }).pipe(finalize(() => this.pageLoading = false))
      .subscribe({
        next: result => {
          this.riskSummary = result.summary;
          this.inventoryRisks = result.risks;
        },
        error: () => this.pageError = 'Inventory risks could not be loaded from the API.'
      });
  }

  private loadInventoryWorkspace(): void {
    this.pageLoading = true;
    this.pageError = '';
    forkJoin({
      demand: this.intelligenceData.demandSummary(30),
      skus: this.intelligenceData.demandSkus(30, 20),
      risk: this.intelligenceData.riskSummary()
    }).pipe(finalize(() => this.pageLoading = false))
      .subscribe({
        next: result => {
          this.demandSummary = result.demand;
          this.demandSkus = result.skus;
          this.riskSummary = result.risk;
        },
        error: () => this.pageError = 'Inventory analytics could not be loaded from the API.'
      });
  }
}
