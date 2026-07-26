import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { DashboardComponent } from './features/dashboard/dashboard.component';

@Component({
  selector: 'sf-root',
  standalone: true,
  imports: [CommonModule, DashboardComponent],
  template: '<sf-dashboard></sf-dashboard>'
})
export class AppComponent {}
