import { Injectable, OnDestroy } from '@angular/core';
import { createClient, SupabaseClient, RealtimeChannel } from '@supabase/supabase-js';
import { Subject } from 'rxjs';

export interface TacticalSignal {
  id: number;
  type: 'sos' | 'report' | 'incident';
  message: string;
  timestamp: Date;
  photo?: string;
  description?: string;
  severity?: string;
}

@Injectable({
  providedIn: 'root'
})
export class TacticalSignalsService implements OnDestroy {
  private supabase: SupabaseClient;
  private channel: RealtimeChannel | null = null;
  
  private signalIdCounter = 0;
  
  // Persistent history of all signals received during the session
  private _history: TacticalSignal[] = [];
  
  // Deduplication cache
  private seenMessageIds = new Set<string>();
  
  // Stream of new signals for the toast popup component
  private newSignalSubject = new Subject<TacticalSignal>();
  public newSignal$ = this.newSignalSubject.asObservable();

  constructor() {
    const config = (window as any).__stockflowConfig;
    if (config?.supabaseUrl && config?.supabasePublishableKey) {
      this.supabase = createClient(config.supabaseUrl, config.supabasePublishableKey);
    } else {
      console.warn('Supabase configuration missing in window.__stockflowConfig');
      this.supabase = createClient(
        'https://wmhqqpcppsirmzstzvem.supabase.co',
        'sb_publishable_VbokG_IEVn_ydRo9Wwvx9Q_OzLKJpoi'
      );
    }
    this.loadHistory();
    this.initChannel();
  }
  
  private loadHistory() {
    const saved = localStorage.getItem('tactical_reports_history');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        this._history = parsed.map((s: any) => ({
          ...s,
          timestamp: new Date(s.timestamp)
        }));
        this.signalIdCounter = this._history.length > 0 ? Math.max(...this._history.map(s => s.id)) : 0;
      } catch (e) {
        console.error('Failed to parse tactical history', e);
      }
    }
  }
  
  private initChannel() {
    this.channel = this.supabase.channel('tactical-signals');

    this.channel
      .on('broadcast', { event: 'sos' }, (payload: any) => {
        const msgId = payload.payload.messageId || JSON.stringify(payload.payload);
        if (this.seenMessageIds.has(msgId)) return;
        this.seenMessageIds.add(msgId);
        setTimeout(() => this.seenMessageIds.delete(msgId), 5000);

        this.addSignal({
          id: ++this.signalIdCounter,
          type: 'sos',
          message: `🚨 INCOMING SOS FROM MOBILE: ${payload.payload.user} at ${payload.payload.coordinates}`,
          timestamp: new Date()
        });
      })
      .on('broadcast', { event: 'report' }, (payload: any) => {
        const msgId = payload.payload.messageId || JSON.stringify(payload.payload);
        if (this.seenMessageIds.has(msgId)) return;
        this.seenMessageIds.add(msgId);
        setTimeout(() => this.seenMessageIds.delete(msgId), 5000);

        this.addSignal({
          id: ++this.signalIdCounter,
          type: 'report',
          message: `📋 FIELD REPORT RECEIVED: ${payload.payload.message}`,
          timestamp: new Date()
        });
      })
      .on('broadcast', { event: 'incident' }, (payload: any) => {
        const msgId = payload.payload.messageId || JSON.stringify(payload.payload);
        if (this.seenMessageIds.has(msgId)) return;
        this.seenMessageIds.add(msgId);
        setTimeout(() => this.seenMessageIds.delete(msgId), 5000);

        this.addSignal({
          id: ++this.signalIdCounter,
          type: 'incident',
          message: `📸 FULL INCIDENT REPORT: ${payload.payload.title} (${payload.payload.category})`,
          timestamp: new Date(),
          photo: payload.payload.photo,
          description: payload.payload.description,
          severity: payload.payload.severity
        });
      })
      .subscribe((status: any) => {
        console.log('Tactical Signals Service Channel Status:', status);
      });
  }
  
  private addSignal(signal: TacticalSignal) {
    // Add to persistent history at the beginning of the array
    this._history.unshift(signal);
    
    // Save to local storage so it persists across refreshes
    localStorage.setItem('tactical_reports_history', JSON.stringify(this._history));
    
    // Broadcast for toast popup
    this.newSignalSubject.next(signal);
  }
  
  get history(): TacticalSignal[] {
    return this._history;
  }

  ngOnDestroy(): void {
    if (this.channel) {
      this.supabase.removeChannel(this.channel);
    }
  }
}
