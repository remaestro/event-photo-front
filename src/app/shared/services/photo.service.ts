import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay, map, catchError } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';
import { PhotosDataService, Photo as ApiPhoto, PhotoFilters } from './photos-data.service';
import { FaceRecognitionDataService } from './face-recognition-data.service';
import { ImageUrlService } from './image-url.service';
import { environment } from '../../../environments/environment';

export interface Photo {
  id: string;
  url: string;
  thumbnail: string;
  eventId: string;
  tags: string[];
  timestamp: string;
}

export interface ScanResult {
  scanId: string;
  status: 'processing' | 'completed' | 'failed';
  progress: number;
  results?: {
    totalMatches: number;
    photos: Photo[];
  };
}

@Injectable({
  providedIn: 'root'
})
export class PhotoService {
  private readonly backendUrl = environment.apiUrl || 'http://localhost:5290';

  constructor(
    private photosDataService: PhotosDataService,
    private faceRecognitionDataService: FaceRecognitionDataService,
    private http: HttpClient,
    private imageUrlService: ImageUrlService
  ) { }

  /**
   * Generate backend photo URL for serving images
   */
  private getPhotoUrl(photoId: string, quality: 'thumbnail' | 'watermarked' | 'original' = 'watermarked'): string {
    return `${this.backendUrl}/api/photo/${photoId}/serve?quality=${quality}`;
  }

  /**
   * Obtenir les photos d'un événement - now uses backend URLs
   */
  getEventPhotos(eventId: string, filters?: PhotoFilters): Observable<Photo[]> {
    return this.photosDataService.getPhotos(eventId, filters).pipe(
      map(response => this.mapApiPhotosToLocal(response.photos)),
      catchError(() => {
        // Fallback to mock implementation
        return this.getEventPhotosMock(eventId);
      })
    );
  }

  /**
   * Obtenir les photos d'aperçu d'un événement - uses backend URLs
   */
  getEventPreviewPhotos(eventId: string): Observable<Photo[]> {
    return this.getEventPhotos(eventId, { limit: 10 });
  }

  /**
   * Démarrer un scan de reconnaissance faciale - now uses real API
   */
  startFacialRecognitionScan(photo: File, eventCode: string): Observable<ScanResult> {
    return this.faceRecognitionDataService.startScan(photo, eventCode).pipe(
      map(response => ({
        scanId: response.scanId,
        status: response.status,
        progress: 0
      })),
      catchError(() => {
        // Fallback to mock implementation
        return this.startFacialRecognitionScanMock(photo, eventCode);
      })
    );
  }

  /**
   * Obtenir le statut d'un scan - now uses real API
   */
  getScanStatus(scanId: string): Observable<ScanResult> {
    return this.faceRecognitionDataService.getScanStatus(scanId).pipe(
      map(response => ({
        scanId: response.scanId,
        status: response.status,
        progress: response.progress,
        results: response.results ? {
          totalMatches: response.results.totalMatches,
          photos: [] // Will be filled by getScanResults
        } : undefined
      })),
      catchError(() => {
        // Fallback to mock implementation
        return this.getScanStatusMock(scanId);
      })
    );
  }

  /**
   * Obtenir les résultats d'un scan - now uses real API
   */
  getScanResults(scanId: string): Observable<Photo[]> {
    return this.faceRecognitionDataService.getScanResults(scanId).pipe(
      map(response => response.results.map(result => ({
        id: result.photo.id,
        url: this.imageUrlService.getWatermarkedUrl(result.photo.id),   // Use ImageUrlService
        thumbnail: this.imageUrlService.getThumbnailUrl(result.photo.id), // Use ImageUrlService
        eventId: response.eventId,
        tags: result.photo.tags,
        timestamp: result.photo.timestamp
      }))),
      catchError(() => {
        // Fallback to mock implementation
        return this.getScanResultsMock(scanId);
      })
    );
  }

  /**
   * Uploader des photos - now uses real API
   */
  uploadPhotos(eventId: string, files: FileList, metadata?: { tags?: string[]; description?: string }): Observable<any> {
    return this.photosDataService.uploadPhotos(eventId, files, metadata).pipe(
      catchError(() => {
        // Fallback to mock implementation
        return this.uploadPhotosMock(eventId, files, metadata);
      })
    );
  }

  // Helper methods to map API data to local interfaces
  private mapApiPhotosToLocal(apiPhotos: ApiPhoto[]): Photo[] {
    return apiPhotos.map(apiPhoto => ({
      id: apiPhoto.id,
      url: this.imageUrlService.getWatermarkedUrl(apiPhoto.id),     // Use ImageUrlService
      thumbnail: this.imageUrlService.getThumbnailUrl(apiPhoto.id), // Use ImageUrlService  
      eventId: apiPhoto.eventId,
      tags: apiPhoto.tags,
      timestamp: apiPhoto.uploadDate
    }));
  }

  /**
   * Get optimized image URL for display
   */
  getImageUrl(photoId: string, quality: 'thumbnail' | 'watermarked' | 'original' = 'watermarked'): string {
    return this.imageUrlService.getPhotoUrl(photoId, quality);
  }

  /**
   * Handle image load errors
   */
  onImageError = (event: any): void => {
    this.imageUrlService.onImageError(event);
  }

  /**
   * Obtenir les photos d'un événement - mock implementation
   */
  private getEventPhotosMock(eventId: string): Observable<Photo[]> {
    const photos = this.mockPhotos[eventId] || [];
    return of(photos).pipe(delay(300));
  }

  /**
   * Démarrer un scan de reconnaissance faciale - mock implementation
   */
  private startFacialRecognitionScanMock(photo: File, eventCode: string): Observable<ScanResult> {
    const scanId = 'scan_' + Date.now();
    
    return of({
      scanId: scanId,
      status: 'processing' as const,
      progress: 0
    }).pipe(delay(500));
  }

  /**
   * Obtenir le statut d'un scan - mock implementation
   */
  private getScanStatusMock(scanId: string): Observable<ScanResult> {
    // Simulate different progress states
    const progress = Math.floor(Math.random() * 100);
    const status: 'processing' | 'completed' | 'failed' = progress >= 100 ? 'completed' : 'processing';
    
    return of({
      scanId: scanId,
      status: status,
      progress: progress,
      results: status === 'completed' ? {
        totalMatches: 8,
        photos: []
      } : undefined
    }).pipe(delay(200));
  }

  /**
   * Obtenir les résultats d'un scan - mock implementation
   */
  private getScanResultsMock(scanId: string): Observable<Photo[]> {
    // Return some random photos from the mock data
    const allPhotos = Object.values(this.mockPhotos).flat();
    const randomPhotos = allPhotos
      .sort(() => 0.5 - Math.random())
      .slice(0, Math.floor(Math.random() * 5) + 3);
    
    return of(randomPhotos).pipe(delay(300));
  }

  /**
   * Uploader des photos - mock implementation
   */
  private uploadPhotosMock(eventId: string, files: FileList, metadata?: any): Observable<any> {
    // Simulate upload progress
    return of({
      uploadSession: {
        sessionId: 'upload_' + Date.now(),
        totalFiles: files.length,
        results: Array.from(files).map((file, index) => ({
          filename: file.name,
          status: 'success',
          photoId: `uploaded_${Date.now()}_${index}`
        }))
      }
    }).pipe(delay(1000));
  }

  // Mock data for development
  private mockPhotos: { [eventId: string]: Photo[] } = {
    '1': [
      {
        id: 'p1-1',
        url: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=800',
        thumbnail: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=200',
        eventId: '1',
        tags: ['ceremony', 'bride', 'groom'],
        timestamp: '2024-06-15T14:30:00Z'
      },
      {
        id: 'p1-2',
        url: 'https://images.unsplash.com/photo-1606800052052-a08af7148866?w=800',
        thumbnail: 'https://images.unsplash.com/photo-1606800052052-a08af7148866?w=200',
        eventId: '1',
        tags: ['reception', 'dance'],
        timestamp: '2024-06-15T20:15:00Z'
      },
      {
        id: 'p1-3',
        url: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=800',
        thumbnail: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=200',
        eventId: '1',
        tags: ['group', 'family'],
        timestamp: '2024-06-15T16:45:00Z'
      },
      {
        id: 'p1-4',
        url: 'https://images.unsplash.com/photo-1465495976277-4387d4b0e4a6?w=800',
        thumbnail: 'https://images.unsplash.com/photo-1465495976277-4387d4b0e4a6?w=200',
        eventId: '1',
        tags: ['flowers', 'decoration'],
        timestamp: '2024-06-15T13:00:00Z'
      },
      {
        id: 'p1-5',
        url: 'https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=800',
        thumbnail: 'https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=200',
        eventId: '1',
        tags: ['cake', 'celebration'],
        timestamp: '2024-06-15T21:30:00Z'
      }
    ],
    '2': [
      {
        id: 'p2-1',
        url: 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=800',
        thumbnail: 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=200',
        eventId: '2',
        tags: ['birthday', 'cake'],
        timestamp: '2024-05-20T19:00:00Z'
      },
      {
        id: 'p2-2',
        url: 'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=800',
        thumbnail: 'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=200',
        eventId: '2',
        tags: ['friends', 'party'],
        timestamp: '2024-05-20T20:30:00Z'
      },
      {
        id: 'p2-3',
        url: 'https://images.unsplash.com/photo-1527529482837-4698179dc6ce?w=800',
        thumbnail: 'https://images.unsplash.com/photo-1527529482837-4698179dc6ce?w=200',
        eventId: '2',
        tags: ['dinner', 'celebration'],
        timestamp: '2024-05-20T18:15:00Z'
      }
    ],
    '3': [
      {
        id: 'p3-1',
        url: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800',
        thumbnail: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=200',
        eventId: '3',
        tags: ['concert', 'stage'],
        timestamp: '2024-07-10T21:00:00Z'
      },
      {
        id: 'p3-2',
        url: 'https://images.unsplash.com/photo-1506157786151-b8491531f063?w=800',
        thumbnail: 'https://images.unsplash.com/photo-1506157786151-b8491531f063?w=200',
        eventId: '3',
        tags: ['crowd', 'audience'],
        timestamp: '2024-07-10T21:30:00Z'
      },
      {
        id: 'p3-3',
        url: 'https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=800',
        thumbnail: 'https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=200',
        eventId: '3',
        tags: ['musician', 'performance'],
        timestamp: '2024-07-10T22:15:00Z'
      }
    ]
  };
}