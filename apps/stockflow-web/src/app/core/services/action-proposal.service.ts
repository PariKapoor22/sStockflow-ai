import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../config/api.config';
import { ActionProposal, ProposalHistory, PurchaseProposalRequest, TransferProposalRequest } from '../models/action.models';

@Injectable({ providedIn: 'root' })
export class ActionProposalService {
  private readonly baseUrl = `${API_BASE_URL}/api/v1/actions`;

  constructor(private readonly http: HttpClient) {}

  list(status?: string, type?: string): Observable<ActionProposal[]> {
    let params = new HttpParams();
    if (status) params = params.set('status', status);
    if (type) params = params.set('type', type);
    return this.http.get<ActionProposal[]>(`${this.baseUrl}/proposals`, { headers: this.tenantHeaders(), params });
  }

  history(proposalId: string): Observable<ProposalHistory[]> {
    return this.http.get<ProposalHistory[]>(`${this.baseUrl}/proposals/${proposalId}/history`, { headers: this.tenantHeaders() });
  }

  createTransfer(body: TransferProposalRequest, idempotencyKey: string): Observable<ActionProposal> {
    return this.http.post<ActionProposal>(`${this.baseUrl}/transfers`, body, { headers: this.tenantHeaders().set('Idempotency-Key', idempotencyKey) });
  }

  createPurchase(body: PurchaseProposalRequest, idempotencyKey: string): Observable<ActionProposal> {
    return this.http.post<ActionProposal>(`${this.baseUrl}/purchases`, body, { headers: this.tenantHeaders().set('Idempotency-Key', idempotencyKey) });
  }

  submit(proposalId: string, comment = ''): Observable<ActionProposal> { return this.transition(proposalId, 'submit', comment); }
  approve(proposalId: string, comment = ''): Observable<ActionProposal> { return this.transition(proposalId, 'approve', comment); }
  reject(proposalId: string, comment: string): Observable<ActionProposal> { return this.transition(proposalId, 'reject', comment); }
  cancel(proposalId: string, comment = ''): Observable<ActionProposal> { return this.transition(proposalId, 'cancel', comment); }

  private transition(proposalId: string, action: string, comment: string): Observable<ActionProposal> {
    return this.http.post<ActionProposal>(`${this.baseUrl}/proposals/${proposalId}/${action}`, { comment }, { headers: this.tenantHeaders() });
  }

  private tenantHeaders(): HttpHeaders {
    return new HttpHeaders({ 'X-Tenant-ID': localStorage.getItem('stockflowTenantId') ?? 'TEN-ACME-PHARMA' });
  }
}
