import { CommonModule } from '@angular/common';
import { Component, Input, OnChanges, OnDestroy, SimpleChanges } from '@angular/core';
import { FormsModule } from '@angular/forms';

export type AdminView = 'users' | 'settings';

interface AdminUser {
  id: number;
  name: string;
  email: string;
  initials: string;
  role: string;
  scope: string;
  status: 'Active' | 'Pending' | 'Suspended';
  lastActive: string;
  mfa: boolean;
}

interface RoleDefinition {
  name: string;
  description: string;
  users: number;
  tone: string;
  permissions: string[];
}

@Component({
  selector: 'sf-admin-workspace',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-workspace.component.html',
  styleUrl: './admin-workspace.component.css'
})
export class AdminWorkspaceComponent implements OnChanges, OnDestroy {
  @Input({ required: true }) view: AdminView = 'users';
  @Input() tenantLabel = 'Selected tenant';
  @Input() searchQuery = '';

  roleFilter = 'ALL';
  statusFilter = 'ALL';
  toastMessage = '';
  activeSettingsSection = 'organization';
  private toastTimer?: number;

  organizationName = '';
  timezone = 'Asia/Kolkata';
  currency = 'INR';
  dateFormat = 'DD MMM YYYY';
  forecastHorizon = 30;
  safetyStockDays = 14;
  approvalThreshold = 100000;
  routeObjective = 'Balanced cost & carbon';
  co2Target = 12;
  wasteTarget = 18;
  vehicleUtilization = 85;
  riskAlerts = true;
  purchaseApprovals = true;
  transferApprovals = true;
  dailyDigest = false;
  mfaRequired = false;
  sessionTimeout = 60;
  auditRetention = 365;

  users: AdminUser[] = [
    { id: 1, name: 'Veyjval B', email: 'veyjval@stockflow.ai', initials: 'VB', role: 'Platform Admin', scope: 'All warehouses', status: 'Active', lastActive: 'Just now', mfa: true },
    { id: 2, name: 'Ananya Rao', email: 'ananya.rao@stockflow.ai', initials: 'AR', role: 'Inventory Manager', scope: 'South region', status: 'Active', lastActive: '12 min ago', mfa: true },
    { id: 3, name: 'Karthik Menon', email: 'karthik.m@stockflow.ai', initials: 'KM', role: 'Demand Planner', scope: 'Chennai, Bengaluru', status: 'Active', lastActive: '1 hr ago', mfa: false },
    { id: 4, name: 'Priya Shah', email: 'priya.shah@stockflow.ai', initials: 'PS', role: 'Warehouse Operator', scope: 'Hyderabad Hub', status: 'Active', lastActive: 'Yesterday', mfa: true },
    { id: 5, name: 'Rahul Iyer', email: 'rahul.iyer@stockflow.ai', initials: 'RI', role: 'Purchase Planner', scope: 'All warehouses', status: 'Pending', lastActive: 'Invite sent 2 days ago', mfa: false },
    { id: 6, name: 'Meera Nair', email: 'meera.nair@stockflow.ai', initials: 'MN', role: 'Viewer', scope: 'Coimbatore West', status: 'Suspended', lastActive: '18 Jul 2026', mfa: false }
  ];

  readonly roles: RoleDefinition[] = [
    { name: 'Platform Admin', description: 'Full workspace and policy control', users: 1, tone: 'violet', permissions: ['All modules', 'User administration', 'Security settings'] },
    { name: 'Inventory Manager', description: 'Network inventory and execution', users: 1, tone: 'blue', permissions: ['Inventory analytics', 'Transfers & returns', 'Data exports'] },
    { name: 'Demand Planner', description: 'Forecast and replenishment planning', users: 1, tone: 'teal', permissions: ['Demand forecast', 'Purchase planning', 'Recommendations'] },
    { name: 'Warehouse Operator', description: 'Location-scoped daily operations', users: 1, tone: 'orange', permissions: ['Orders', 'Batch inventory', 'Returns intake'] },
    { name: 'Viewer', description: 'Read-only reporting access', users: 1, tone: 'slate', permissions: ['Dashboard', 'Analytics', 'Reports'] }
  ];

  readonly settingsSections = [
    { id: 'organization', label: 'Organization', icon: 'O' },
    { id: 'planning', label: 'Planning policies', icon: 'P' },
    { id: 'sustainability', label: 'Sustainability', icon: 'S' },
    { id: 'notifications', label: 'Notifications', icon: 'N' },
    { id: 'security', label: 'Security', icon: 'L' },
    { id: 'integrations', label: 'Integrations', icon: 'I' }
  ];

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['tenantLabel'] && (!this.organizationName || changes['tenantLabel'].firstChange)) {
      this.organizationName = this.tenantLabel;
    }
    if (changes['view']) {
      this.roleFilter = 'ALL';
      this.statusFilter = 'ALL';
    }
  }

  ngOnDestroy(): void {
    if (this.toastTimer) window.clearTimeout(this.toastTimer);
  }

  get pageCopy(): { eyebrow: string; title: string; description: string; action: string } {
    return this.view === 'users'
      ? { eyebrow: 'ACCESS GOVERNANCE', title: 'Users & Roles', description: 'Control team access, warehouse scope and role permissions across your StockFlow workspace.', action: 'Invite user' }
      : { eyebrow: 'WORKSPACE CONTROL', title: 'Settings', description: 'Configure planning policies, sustainability targets, alerts and security for your organization.', action: 'Save changes' };
  }

  userRoles(): string[] {
    return [...new Set(this.users.map(user => user.role))].sort();
  }

  statuses(): string[] {
    return ['Active', 'Pending', 'Suspended'];
  }

  filteredUsers(): AdminUser[] {
    const query = this.searchQuery.trim().toLowerCase();
    return this.users.filter(user => {
      const matchesSearch = !query || [user.name, user.email, user.role, user.scope]
        .some(value => value.toLowerCase().includes(query));
      const matchesRole = this.roleFilter === 'ALL' || user.role === this.roleFilter;
      const matchesStatus = this.statusFilter === 'ALL' || user.status === this.statusFilter;
      return matchesSearch && matchesRole && matchesStatus;
    });
  }

  activeUsers(): number {
    return this.users.filter(user => user.status === 'Active').length;
  }

  mfaCoverage(): number {
    return Math.round(this.users.filter(user => user.mfa).length / Math.max(this.users.length, 1) * 100);
  }

  mfaEnabledUsers(): number {
    return this.users.filter(user => user.mfa).length;
  }

  statusClass(status: string): string {
    return status.toLowerCase();
  }

  inviteUser(): void {
    this.showToast('Invite flow opened as a UI preview. No invitation was sent.');
  }

  changeRole(user: AdminUser, role: string): void {
    user.role = role;
    this.showToast(`${user.name}'s role is staged as ${role}. Demo state only.`);
  }

  toggleUserStatus(user: AdminUser): void {
    user.status = user.status === 'Active' ? 'Suspended' : 'Active';
    this.showToast(`${user.name} is staged as ${user.status}. Demo state only.`);
  }

  saveSettings(): void {
    this.showToast('Settings saved in this UI preview. Backend persistence is not connected yet.');
  }

  selectSettingsSection(section: string): void {
    this.activeSettingsSection = section;
  }

  private showToast(message: string): void {
    this.toastMessage = message;
    if (this.toastTimer) window.clearTimeout(this.toastTimer);
    this.toastTimer = window.setTimeout(() => this.toastMessage = '', 3500);
  }
}
