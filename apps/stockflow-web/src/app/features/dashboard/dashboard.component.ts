import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DashboardOverview } from '../../core/models/dashboard.models';
import { DashboardDataService } from '../../core/services/dashboard-data.service';

@Component({
  selector: 'sf-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {
  data?: DashboardOverview;
  loading = true;
  error = '';
  copilotInput = '';
  sidebarCollapsed = false;

  readonly navGroups = [
    {
      title: '',
      items: [{ label: 'Dashboard', icon: '⌂', active: true }]
    },
    {
      title: 'INTELLIGENCE',
      items: [
        { label: 'Demand Forecast', icon: '▥', active: false },
        { label: 'Inventory Analytics', icon: '⌁', active: false },
        { label: 'Risk & Alerts', icon: '△', active: false },
        { label: 'Recommendations', icon: '▣', active: false }
      ]
    },
    {
      title: 'OPERATIONS',
      items: [
        { label: 'Transfers', icon: '⇄', active: false },
        { label: 'Purchase Planning', icon: '🛒', active: false },
        { label: 'Orders', icon: '▤', active: false },
        { label: 'Returns', icon: '↶', active: false }
      ]
    },
    {
      title: 'INVENTORY',
      items: [
        { label: 'Warehouses', icon: '⌂', active: false },
        { label: 'Products', icon: '◇', active: false },
        { label: 'Batches', icon: '▰', active: false }
      ]
    },
    {
      title: 'ADMIN',
      items: [
        { label: 'Users & Roles', icon: '♙', active: false },
        { label: 'Settings', icon: '⚙', active: false },
        { label: 'Integrations', icon: '⚙', active: false }
      ]
    }
  ];

  constructor(private readonly dashboardData: DashboardDataService) {}

  ngOnInit(): void {
    this.dashboardData.loadOverview().subscribe({
      next: data => {
        this.data = data;
        this.loading = false;
      },
      error: () => {
        this.error = 'The dashboard data could not be loaded.';
        this.loading = false;
      }
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
      text: 'Sprint 1 uses a scripted response. Sprint 4 will route this question through the secured StockFlow MCP host.',
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
}
