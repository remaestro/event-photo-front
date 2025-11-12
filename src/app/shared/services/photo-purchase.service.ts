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
  // 🆕 Informations supplémentaires pour l'affichage
  photoNumber?: string;
  photographer?: string;
  eventDate?: Date;
  location?: string;
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
  // 🆕 Informations de paiement Wave détaillées
  waveTransactionId?: string;
  wavePaymentStatus?: string;
  paymentMethod: 'wave' | 'card' | 'mobile_money';
  orderNumber?: string;
  invoiceNumber?: string;
  // 🆕 Informations d'événement
  eventDate?: Date;
  eventLocation?: string;
  organizerName?: string;
  // 🆕 Informations de facturation
  subtotal?: number;
  tax?: number;
  processingFee?: number;
  discountAmount?: number;
  discountCode?: string;
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

  // 🆕 Récupérer l'historique complet des paiements d'un utilisateur
  getPaymentHistory(userEmail: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/WavePayment/history/${encodeURIComponent(userEmail)}`);
  }

  // 🆕 Récupérer les détails d'un paiement Wave
  getWavePaymentDetails(sessionId: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/WavePayment/details/${sessionId}`);
  }

  // 🆕 Récupérer les statistiques d'achats d'un utilisateur
  getUserPurchaseStats(userEmail: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/PhotoPurchase/stats/${encodeURIComponent(userEmail)}`);
  }

  // 🆕 Générer et télécharger une facture PDF
  downloadInvoicePDF(purchaseId: string): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/PhotoPurchase/${purchaseId}/invoice`, {
      responseType: 'blob'
    });
  }

  // 🆕 Créer des données de démonstration pour le développement
  createDemoPurchases(userEmail: string): PhotoPurchase[] {
    const demoPurchases: PhotoPurchase[] = [
      {
        id: 'demo-purchase-1',
        sessionId: 'wave_session_demo_001',
        paymentId: 'wave_payment_demo_001',
        customerEmail: userEmail,
        eventId: 'event_001',
        eventName: 'Mariage Sarah & Ahmed',
        photos: [
          {
            id: 'photo_001',
            paymentId: 'wave_payment_demo_001',
            sessionId: 'wave_session_demo_001',
            eventId: 'event_001',
            eventName: 'Mariage Sarah & Ahmed',
            photoUrl: `${environment.apiUrl}/api/Photo/1/serve?quality=watermarked`,
            thumbnailUrl: `${environment.apiUrl}/api/Photo/1/serve?quality=thumbnail`,
            price: 5000,
            currency: 'XOF',
            purchaseDate: new Date('2024-12-01T14:30:00'),
            status: 'active',
            filename: 'mariage_sarah_ahmed_001.jpg',
            photoNumber: 'IMG_8167',
            photographer: 'Studio EventPhoto',
            eventDate: new Date('2024-11-30'),
            location: 'Dakar, Sénégal'
          },
          {
            id: 'photo_002',
            paymentId: 'wave_payment_demo_001',
            sessionId: 'wave_session_demo_001',
            eventId: 'event_001',
            eventName: 'Mariage Sarah & Ahmed',
            photoUrl: `${environment.apiUrl}/api/Photo/2/serve?quality=watermarked`,
            thumbnailUrl: `${environment.apiUrl}/api/Photo/2/serve?quality=thumbnail`,
            price: 5000,
            currency: 'XOF',
            purchaseDate: new Date('2024-12-01T14:30:00'),
            status: 'active',
            filename: 'mariage_sarah_ahmed_002.jpg',
            photoNumber: 'IMG_8168',
            photographer: 'Studio EventPhoto',
            eventDate: new Date('2024-11-30'),
            location: 'Dakar, Sénégal'
          },
          {
            id: 'photo_003',
            paymentId: 'wave_payment_demo_001',
            sessionId: 'wave_session_demo_001',
            eventId: 'event_001',
            eventName: 'Mariage Sarah & Ahmed',
            photoUrl: `${environment.apiUrl}/api/Photo/3/serve?quality=watermarked`,
            thumbnailUrl: `${environment.apiUrl}/api/Photo/3/serve?quality=thumbnail`,
            price: 5000,
            currency: 'XOF',
            purchaseDate: new Date('2024-12-01T14:30:00'),
            status: 'active',
            filename: 'mariage_sarah_ahmed_003.jpg',
            photoNumber: 'IMG_8169',
            photographer: 'Studio EventPhoto',
            eventDate: new Date('2024-11-30'),
            location: 'Dakar, Sénégal'
          }
        ],
        totalAmount: 15000,
        currency: 'XOF',
        status: 'completed',
        purchaseDate: new Date('2024-12-01T14:30:00'),
        downloadExpiresAt: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000), // 25 jours à partir d'aujourd'hui
        waveTransactionId: 'WAVE_TXN_20241201_001',
        wavePaymentStatus: 'SUCCESS',
        paymentMethod: 'wave',
        orderNumber: 'ORD-20241201-001',
        invoiceNumber: 'INV-20241201-001',
        eventDate: new Date('2024-11-30'),
        eventLocation: 'Palais des Congrès, Dakar',
        organizerName: 'Studio EventPhoto',
        subtotal: 15000,
        tax: 0,
        processingFee: 0,
        discountAmount: 0
      },
      {
        id: 'demo-purchase-2',
        sessionId: 'wave_session_demo_002',
        paymentId: 'wave_payment_demo_002',
        customerEmail: userEmail,
        eventId: 'event_002',
        eventName: 'Baptême Aissatou',
        photos: [
          {
            id: 'photo_004',
            paymentId: 'wave_payment_demo_002',
            sessionId: 'wave_session_demo_002',
            eventId: 'event_002',
            eventName: 'Baptême Aissatou',
            photoUrl: `${environment.apiUrl}/api/Photo/4/serve?quality=watermarked`,
            thumbnailUrl: `${environment.apiUrl}/api/Photo/4/serve?quality=thumbnail`,
            price: 3000,
            currency: 'XOF',
            purchaseDate: new Date('2024-11-15T10:15:00'),
            status: 'active',
            filename: 'bapteme_aissatou_001.jpg',
            photoNumber: 'IMG_9201',
            photographer: 'PhotoMoments Dakar',
            eventDate: new Date('2024-11-14'),
            location: 'Dakar, Sénégal'
          },
          {
            id: 'photo_005',
            paymentId: 'wave_payment_demo_002',
            sessionId: 'wave_session_demo_002',
            eventId: 'event_002',
            eventName: 'Baptême Aissatou',
            photoUrl: `${environment.apiUrl}/api/Photo/5/serve?quality=watermarked`,
            thumbnailUrl: `${environment.apiUrl}/api/Photo/5/serve?quality=thumbnail`,
            price: 3000,
            currency: 'XOF',
            purchaseDate: new Date('2024-11-15T10:15:00'),
            status: 'active',
            filename: 'bapteme_aissatou_002.jpg',
            photoNumber: 'IMG_9202',
            photographer: 'PhotoMoments Dakar',
            eventDate: new Date('2024-11-14'),
            location: 'Dakar, Sénégal'
          }
        ],
        totalAmount: 6000,
        currency: 'XOF',
        status: 'completed',
        purchaseDate: new Date('2024-11-15T10:15:00'),
        downloadExpiresAt: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // 10 jours
        waveTransactionId: 'WAVE_TXN_20241115_002',
        wavePaymentStatus: 'SUCCESS',
        paymentMethod: 'wave',
        orderNumber: 'ORD-20241115-002',
        invoiceNumber: 'INV-20241115-002',
        eventDate: new Date('2024-11-14'),
        eventLocation: 'Mosquée de Médina, Dakar',
        organizerName: 'PhotoMoments Dakar',
        subtotal: 6000,
        tax: 0,
        processingFee: 0,
        discountAmount: 0
      },
      {
        id: 'demo-purchase-3',
        sessionId: 'wave_session_demo_003',
        paymentId: 'wave_payment_demo_003',
        customerEmail: userEmail,
        eventId: 'event_003',
        eventName: 'Conférence Tech Dakar 2024',
        photos: [
          {
            id: 'photo_006',
            paymentId: 'wave_payment_demo_003',
            sessionId: 'wave_session_demo_003',
            eventId: 'event_003',
            eventName: 'Conférence Tech Dakar 2024',
            photoUrl: `${environment.apiUrl}/api/Photo/6/serve?quality=watermarked`,
            thumbnailUrl: `${environment.apiUrl}/api/Photo/6/serve?quality=thumbnail`,
            price: 2000,
            currency: 'XOF',
            purchaseDate: new Date('2024-10-20T16:45:00'),
            status: 'expired',
            filename: 'conf_tech_dakar_001.jpg',
            photoNumber: 'IMG_7845',
            photographer: 'TechEvents Photo',
            eventDate: new Date('2024-10-19'),
            location: 'Dakar, Sénégal'
          }
        ],
        totalAmount: 2000,
        currency: 'XOF',
        status: 'expired',
        purchaseDate: new Date('2024-10-20T16:45:00'),
        downloadExpiresAt: new Date('2024-11-19T16:45:00'), // Expiré
        waveTransactionId: 'WAVE_TXN_20241020_003',
        wavePaymentStatus: 'SUCCESS',
        paymentMethod: 'wave',
        orderNumber: 'ORD-20241020-003',
        invoiceNumber: 'INV-20241020-003',
        eventDate: new Date('2024-10-19'),
        eventLocation: 'King Fahd Palace Hotel, Dakar',
        organizerName: 'TechEvents Photo',
        subtotal: 2000,
        tax: 0,
        processingFee: 0,
        discountAmount: 0
      }
    ];

    return demoPurchases;
  }
}