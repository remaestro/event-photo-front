import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Beneficiary {
  id: number;              // Changé de string à number
  email: string;
  firstName: string;
  lastName: string;
  percentage: number;      // Ajouté - CRUCIAL pour les revenus
  role: 'photographer' | 'organizer' | 'viewer';
  status: 'to_be_sent' | 'pending' | 'accepted' | 'declined';
  canViewPhotos: boolean;  // Simplifié - pas d'objet permissions
  canDownloadPhotos: boolean;
  canUploadPhotos: boolean;
  canManageEvent: boolean;
  invitedAt: string;       // Format ISO string
  respondedAt?: string;    // Format ISO string
  invitedBy: string;
}

export interface AddBeneficiaryRequest {
  email: string;
  firstName: string;
  lastName: string;
  percentage: number;      // Ajouté - CRUCIAL
  role: 'photographer' | 'organizer' | 'viewer';
  canViewPhotos: boolean;  // Simplifié
  canDownloadPhotos: boolean;
  canUploadPhotos: boolean;
  canManageEvent: boolean;
}

export interface UpdateBeneficiaryRequest {
  firstName?: string;
  lastName?: string;
  percentage?: number;     // Ajouté
  role?: 'photographer' | 'organizer' | 'viewer';
  canViewPhotos?: boolean; // Simplifié
  canDownloadPhotos?: boolean;
  canUploadPhotos?: boolean;
  canManageEvent?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class BeneficiariesDataService {
  private readonly baseUrl = `${environment.apiUrl}/api/events`;
  private readonly invitationsUrl = `${environment.apiUrl}/api/invitations`;

  constructor(private http: HttpClient) { }

  getBeneficiaries(eventId: string): Observable<Beneficiary[]> {
    return this.http.get<Beneficiary[]>(`${this.baseUrl}/${eventId}/beneficiaries`);
  }

  addBeneficiary(eventId: string, beneficiary: AddBeneficiaryRequest): Observable<Beneficiary> {
    return this.http.post<Beneficiary>(`${this.baseUrl}/${eventId}/beneficiaries`, beneficiary);
  }

  updateBeneficiary(eventId: string, beneficiaryId: string, updates: UpdateBeneficiaryRequest): Observable<Beneficiary> {
    return this.http.put<Beneficiary>(`${this.baseUrl}/${eventId}/beneficiaries/${beneficiaryId}`, updates);
  }

  removeBeneficiary(eventId: string, beneficiaryId: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${eventId}/beneficiaries/${beneficiaryId}`);
  }

  // All invitation-related methods now use InvitationsController
  acceptInvitation(token: string): Observable<void> {
    return this.http.post<void>(`${this.invitationsUrl}/accept`, { token });
  }

  declineInvitation(token: string): Observable<void> {
    return this.http.post<void>(`${this.invitationsUrl}/decline`, { token });
  }

  // Updated resend invitation method to match backend requirements
  resendInvitation(eventId: string, beneficiaryId: string): Observable<any> {
    return this.http.post<any>(`${this.invitationsUrl}/resend`, { 
      eventId, 
      beneficiaryId 
    });
  }

  validateInvitationToken(token: string): Observable<{
    valid: boolean;
    eventName?: string;
    organizerName?: string;
    expiresAt?: string;
  }> {
    return this.http.get<any>(`${this.invitationsUrl}/validate/${token}`);
  }

  // New method to send invitations using InvitationsController
  sendInvitations(eventId: string, beneficiaries: AddBeneficiaryRequest[]): Observable<void> {
    return this.http.post<void>(`${this.invitationsUrl}/send`, {
      eventId,
      beneficiaries
    });
  }
}