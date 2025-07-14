import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Beneficiary {
  id: string;
  eventId: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'photographer' | 'organizer' | 'viewer';
  status: 'pending' | 'accepted' | 'declined';
  permissions: {
    canViewPhotos: boolean;
    canDownloadPhotos: boolean;
    canUploadPhotos: boolean;
    canManageEvent: boolean;
  };
  invitedAt: string;
  respondedAt?: string;
  invitedBy: string;
}

export interface AddBeneficiaryRequest {
  email: string;
  firstName: string;
  lastName: string;
  role: 'photographer' | 'organizer' | 'viewer';
  permissions: {
    canViewPhotos: boolean;
    canDownloadPhotos: boolean;
    canUploadPhotos: boolean;
    canManageEvent: boolean;
  };
}

export interface UpdateBeneficiaryRequest {
  firstName?: string;
  lastName?: string;
  role?: 'photographer' | 'organizer' | 'viewer';
  permissions?: {
    canViewPhotos?: boolean;
    canDownloadPhotos?: boolean;
    canUploadPhotos?: boolean;
    canManageEvent?: boolean;
  };
}

@Injectable({
  providedIn: 'root'
})
export class BeneficiariesDataService {
  private readonly baseUrl = `${environment.apiUrl}/api/events`;

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

  acceptInvitation(eventId: string, beneficiaryId: string): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/${eventId}/beneficiaries/${beneficiaryId}/accept`, {});
  }

  declineInvitation(eventId: string, beneficiaryId: string): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/${eventId}/beneficiaries/${beneficiaryId}/decline`, {});
  }
}