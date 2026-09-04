import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TacticalSignalsService, TacticalSignal } from '../../../core/services/tactical-signals.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'sf-tactical-alerts',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './tactical-alerts.component.html',
  styleUrl: './tactical-alerts.component.css'
})
export class TacticalAlertsComponent implements OnInit, OnDestroy {
  private tacticalSignalsService = inject(TacticalSignalsService);
  private subscription?: Subscription;

  activeAlerts: TacticalSignal[] = [];

  ngOnInit(): void {
    this.subscription = this.tacticalSignalsService.newSignal$.subscribe((signal: TacticalSignal) => {
      this.activeAlerts.push(signal);
      
      // Auto-remove after 10 seconds
      setTimeout(() => {
        this.removeAlert(signal.id);
      }, 10000);
    });
  }

  removeAlert(id: number) {
    this.activeAlerts = this.activeAlerts.filter(a => a.id !== id);
  }

  ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }
}
