import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject, of } from 'rxjs';
import { tap, catchError, map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface Guest {
  id: number; // Changed from string to number to match backend
  eventId: number; // Changed from string to number
  name: string;
  email?: string;
  phone?: string;
  whatsApp?: string; // Updated to match backend property name
  status: string;
  invitationSent: boolean;
  invitationSentAt?: Date;
  invitationMethod?: string;
  hasAccessed: boolean;
  accessedAt?: Date;
  accessCount: number;
  accessToken: string;
  accessLink: string;
  addMethod: string;
  createdAt: Date;
}

export interface GuestList {
  id: number; // Changed from string to number
  eventId: number; // Changed from string to number
  eventName: string;
  totalGuests: number;
  invitationsSent: number;
  accessedCount: number;
  qrCodeUrl: string;
  selfRegisterUrl: string;
  allowSelfRegistration: boolean;
  requiresApproval: boolean;
  maxGuests?: number;
  guests: Guest[];
  createdAt: Date;
  updatedAt: Date;
}

export interface AddGuestRequest {
  eventId: number; // Changed from string to number
  name: string;
  email?: string;
  phone?: string;
  whatsApp?: string; // Updated to match backend
  addMethod?: string;
}

export interface CreateGuestListRequest {
  eventId: number;
  allowSelfRegistration: boolean;
  autoSendInvitation: boolean;
}

export interface UpdateGuestListSettingsRequest {
  allowSelfRegistration: boolean;
  requireEmailVerification: boolean;
  autoSendInvitation: boolean;
}

export interface SendBulkInvitationsRequest {
  guestIds: number[];
  method: string;
}

@Injectable({
  providedIn: 'root'
})
export class GuestListService {
  private apiUrl = `${environment.apiUrl}/api`;
  private guestListSubject = new BehaviorSubject<GuestList | null>(null);
  public guestList$ = this.guestListSubject.asObservable();

  constructor(private http: HttpClient) {}

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  /**
   * Récupérer la liste d'invités d'un événement
   */
  getGuestList(eventId: number): Observable<GuestList | null> {
    const headers = this.getAuthHeaders();
    
    return this.http.get<GuestList>(`${this.apiUrl}/events/${eventId}/guest-list`, { headers })
      .pipe(
        tap(guestList => {
          if (guestList) {
            this.guestListSubject.next(guestList);
          }
        }),
        catchError(error => {
          console.error('Error fetching guest list:', error);
          if (error.status === 404) {
            return of(null); // Guest list doesn't exist yet
          }
          throw error;
        })
      );
  }

  /**
   * Créer une nouvelle liste d'invités pour un événement
   */
  createGuestList(eventId: number, allowSelfRegistration: boolean = true, autoSendInvitation: boolean = false): Observable<GuestList> {
    const headers = this.getAuthHeaders();
    const request: CreateGuestListRequest = {
      eventId,
      allowSelfRegistration,
      autoSendInvitation
    };

    return this.http.post<GuestList>(`${this.apiUrl}/events/${eventId}/guest-list`, request, { headers })
      .pipe(
        tap(guestList => {
          this.guestListSubject.next(guestList);
        }),
        catchError(error => {
          console.error('Error creating guest list:', error);
          throw error;
        })
      );
  }

  /**
   * Mettre à jour les paramètres de la liste d'invités
   */
  updateGuestListSettings(eventId: number, settings: UpdateGuestListSettingsRequest): Observable<boolean> {
    const headers = this.getAuthHeaders();
    
    return this.http.put(`${this.apiUrl}/events/${eventId}/guest-list/settings`, settings, { headers })
      .pipe(
        map(() => true),
        tap(() => {
          // Refresh the guest list
          this.getGuestList(eventId).subscribe();
        }),
        catchError(error => {
          console.error('Error updating guest list settings:', error);
          throw error;
        })
      );
  }

  /**
   * Ajouter un invité à la liste (Ajout manuel)
   */
  addGuest(request: AddGuestRequest): Observable<Guest> {
    const headers = this.getAuthHeaders();
    
    return this.http.post<Guest>(`${this.apiUrl}/events/${request.eventId}/guest-list/guests`, request, { headers })
      .pipe(
        tap(guest => {
          // Refresh the guest list
          this.getGuestList(request.eventId).subscribe();
        }),
        catchError(error => {
          console.error('Error adding guest:', error);
          throw error;
        })
      );
  }

  /**
   * Auto-inscription via QR code
   */
  addGuestViaQrCode(request: AddGuestRequest): Observable<Guest> {
    // No auth headers needed for self-registration
    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });
    
    return this.http.post<Guest>(`${this.apiUrl}/events/${request.eventId}/guest-list/self-register`, request, { headers })
      .pipe(
        catchError(error => {
          console.error('Error self-registering guest:', error);
          throw error;
        })
      );
  }

  /**
   * Obtenir les détails d'un invité
   */
  getGuestById(eventId: number, guestId: number): Observable<Guest> {
    const headers = this.getAuthHeaders();
    
    return this.http.get<Guest>(`${this.apiUrl}/events/${eventId}/guest-list/guests/${guestId}`, { headers })
      .pipe(
        catchError(error => {
          console.error('Error fetching guest details:', error);
          throw error;
        })
      );
  }

  /**
   * Mettre à jour un invité
   */
  updateGuest(eventId: number, guestId: number, request: AddGuestRequest): Observable<boolean> {
    const headers = this.getAuthHeaders();
    
    return this.http.put(`${this.apiUrl}/events/${eventId}/guest-list/guests/${guestId}`, request, { headers })
      .pipe(
        map(() => true),
        tap(() => {
          // Refresh the guest list
          this.getGuestList(eventId).subscribe();
        }),
        catchError(error => {
          console.error('Error updating guest:', error);
          throw error;
        })
      );
  }

  /**
   * Supprimer un invité de la liste
   */
  removeGuest(eventId: number, guestId: number): Observable<boolean> {
    const headers = this.getAuthHeaders();
    
    return this.http.delete(`${this.apiUrl}/events/${eventId}/guest-list/guests/${guestId}`, { headers })
      .pipe(
        map(() => true),
        tap(() => {
          // Refresh the guest list
          this.getGuestList(eventId).subscribe();
        }),
        catchError(error => {
          console.error('Error removing guest:', error);
          throw error;
        })
      );
  }

  /**
   * Envoyer une invitation à un invité
   */
  sendInvitation(eventId: number, guestId: number, method: 'Email' | 'SMS' | 'WhatsApp' = 'Email'): Observable<boolean> {
    const headers = this.getAuthHeaders();
    
    return this.http.post(`${this.apiUrl}/events/${eventId}/guest-list/guests/${guestId}/send-invitation?method=${method}`, {}, { headers })
      .pipe(
        map(() => true),
        tap(() => {
          // Refresh the guest list
          this.getGuestList(eventId).subscribe();
        }),
        catchError(error => {
          console.error('Error sending invitation:', error);
          throw error;
        })
      );
  }

  /**
   * Envoyer des invitations en masse
   */
  sendBulkInvitations(eventId: number, guestIds: number[], method: 'Email' | 'SMS' | 'WhatsApp' = 'Email'): Observable<{ sentCount: number }> {
    const headers = this.getAuthHeaders();
    const request: SendBulkInvitationsRequest = {
      guestIds,
      method
    };
    
    return this.http.post<{ sentCount: number }>(`${this.apiUrl}/events/${eventId}/guest-list/send-bulk-invitations`, request, { headers })
      .pipe(
        tap(() => {
          // Refresh the guest list
          this.getGuestList(eventId).subscribe();
        }),
        catchError(error => {
          console.error('Error sending bulk invitations:', error);
          throw error;
        })
      );
  }

  /**
   * Vérifier l'accès d'un invité via token (public endpoint)
   */
  verifyGuestAccess(eventId: number, accessToken: string): Observable<Guest> {
    // No auth headers needed for guest access verification
    return this.http.get<Guest>(`${this.apiUrl}/events/${eventId}/guest-list/access/${accessToken}`)
      .pipe(
        catchError(error => {
          console.error('Error verifying guest access:', error);
          throw error;
        })
      );
  }

  /**
   * Exporter la liste d'invités en CSV
   */
  exportToCsv(eventId: number): Observable<Blob> {
    const headers = this.getAuthHeaders();
    
    return this.http.get(`${this.apiUrl}/events/${eventId}/guest-list/export/csv`, { 
      headers, 
      responseType: 'blob' 
    })
      .pipe(
        catchError(error => {
          console.error('Error exporting guest list:', error);
          throw error;
        })
      );
  }

  /**
   * Obtenir les statistiques de la liste d'invités
   */
  getStatistics(eventId: number): Observable<{ [key: string]: number }> {
    const headers = this.getAuthHeaders();
    
    return this.http.get<{ [key: string]: number }>(`${this.apiUrl}/events/${eventId}/guest-list/statistics`, { headers })
      .pipe(
        catchError(error => {
          console.error('Error fetching statistics:', error);
          throw error;
        })
      );
  }

  /**
   * Générer un lien d'accès unique pour un événement (utilise l'accessToken du guest)
   */
  generateAccessLink(eventId: number, accessToken: string): string {
    const baseUrl = window.location.origin;
    return `${baseUrl}/event/${eventId}/photos?token=${accessToken}`;
  }

  // ...existing code for localStorage methods removed since we're now using real API...
}
