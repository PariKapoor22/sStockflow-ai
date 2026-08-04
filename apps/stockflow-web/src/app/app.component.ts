import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { AuthService } from './core/services/auth.service';
import { LoginComponent } from './features/auth/login.component';
import { DashboardComponent } from './features/dashboard/dashboard.component';

@Component({
  selector: 'sf-root',
  standalone: true,
  imports: [CommonModule, DashboardComponent, LoginComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  constructor(readonly auth: AuthService) {}
}
