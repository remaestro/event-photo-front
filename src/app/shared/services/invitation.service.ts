import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface InvitationRequest {
  eventId: string;
  beneficiaries: {
    email: string;
    name?: string;
    percentage: number;
  }[];
}

export interface InvitationResponse {
  success: boolean;
  message: string;
  invitationsSent: number;
  failedInvitations?: {
    email: string;
    error: string;
  }[];
}

@Injectable({
  providedIn: 'root'
})
export class InvitationService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  /**
   * Envoyer des invitations par email aux bénéficiaires
   */
  sendInvitations(request: InvitationRequest): Observable<InvitationResponse> {
    return this.http.post<InvitationResponse>(`${this.apiUrl}/api/invitations/send`, request);
  }

  /**
   * Renvoyer une invitation à un bénéficiaire spécifique
   */
  resendInvitation(eventId: string, beneficiaryId: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/api/invitations/resend`, {
      EventId: eventId,
      BeneficiaryId: beneficiaryId
    });
  }

  /**
   * Accepter une invitation via un token d'invitation
   */
  acceptInvitation(token: string, userId: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/api/invitations/accept`, {
      token,
      userId
    });
  }

  /**
   * Valider un token d'invitation
   */
  validateInvitationToken(token: string): Observable<{
    valid: boolean;
    eventName?: string;
    organizerName?: string;
    expiresAt?: string;
  }> {
    return this.http.get<any>(`${this.apiUrl}/api/invitations/validate/${token}`);
  }
}