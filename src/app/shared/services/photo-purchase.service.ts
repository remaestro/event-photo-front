import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface PurchasedPhoto {
  id: string;
  paymentId: string;
  sessionId: string;
  eventId: string;
  eventName: string;
  photoUrl: string;
  thumbnailUrl: string;
  originalUrl?: string;
  price: number;
  currency: string;
  purchaseDate: Date;
  downloadUrl?: string;
  downloadExpiresAt?: Date;
  status: 'active' | 'expired';
  filename?: string;
}

export interface PhotoPurchase {
  id: string;
  sessionId: string;
  paymentId: string;
  customerEmail: string;
  eventId: string;
  eventName: string;
  photos: PurchasedPhoto[];
  totalAmount: number;
  currency: string;
  status: 'pending' | 'completed' | 'expired';
  purchaseDate: Date;
  downloadExpiresAt: Date;
}

@Injectable({
  providedIn: 'root'
})
export class PhotoPurchaseService {
  private apiUrl = `${environment.apiUrl}/api`;
  private purchasesSubject = new BehaviorSubject<PhotoPurchase[]>([]);
  public purchases$ = this.purchasesSubject.asObservable();

  constructor(private http: HttpClient) {}

  // Récupérer les achats d'un utilisateur
  getUserPurchases(userEmail: string): Observable<PhotoPurchase[]> {
    return this.http.get<PhotoPurchase[]>(`${this.apiUrl}/PhotoPurchase/user/${encodeURIComponent(userEmail)}`);
  }

  // Récupérer un achat par session Wave
  getPurchaseBySession(sessionId: string): Observable<PhotoPurchase> {
    return this.http.get<PhotoPurchase>(`${this.apiUrl}/PhotoPurchase/session/${sessionId}`);
  }

  // Associer un achat à un utilisateur après connexion/inscription
  associatePurchaseToUser(sessionId: string, userEmail: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/PhotoPurchase/associate`, {
      sessionId,
      userEmail
    });
  }

  // Télécharger une photo
  downloadPhoto(purchaseId: string, photoId: string): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/PhotoPurchase/${purchaseId}/photo/${photoId}/download`, {
      responseType: 'blob'
    });
  }

  // Télécharger toutes les photos d'un achat
  downloadAllPhotos(purchaseId: string): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/PhotoPurchase/${purchaseId}/download-all`, {
      responseType: 'blob'
    });
  }

  // Vérifier l'accès en attente après connexion
  checkPendingAccess(): string | null {
    const pending = localStorage.getItem('pendingPhotoAccess');
    if (pending) {
      try {
        const data = JSON.parse(pending);
        // Vérifier que ce n'est pas trop ancien (24h max)
        if (Date.now() - data.timestamp < 24 * 60 * 60 * 1000) {
          return data.sessionId;
        } else {
          localStorage.removeItem('pendingPhotoAccess');
        }
      } catch (error) {
        localStorage.removeItem('pendingPhotoAccess');
      }
    }
    return null;
  }

  // Nettoyer l'accès en attente
  clearPendingAccess(): void {
    localStorage.removeItem('pendingPhotoAccess');
  }

  // Charger les achats localement
  loadUserPurchases(userEmail: string): void {
    this.getUserPurchases(userEmail).subscribe({
      next: (purchases) => {
        this.purchasesSubject.next(purchases);
      },
      error: (error) => {
        console.error('Error loading user purchases:', error);
        this.purchasesSubject.next([]);
      }
    });
  }

  // Mettre à jour les achats
  updatePurchases(purchases: PhotoPurchase[]): void {
    this.purchasesSubject.next(purchases);
  }
}