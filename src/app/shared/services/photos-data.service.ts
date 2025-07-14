import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Photo {
  id: string;
  eventId: string;
  filename: string;
  url: string;
  urls: {
    original: string;
    watermarked: string;
    thumbnail: string;
  };
  tags: string[];
  uploadDate: string;
  metadata: {
    width: number;
    height: number;
    size: number;
    format: string;
  };
  status: 'pending' | 'approved' | 'rejected';
  isPublic: boolean;
  downloadCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface PhotoFilters {
  page?: number;
  limit?: number;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
  sortBy?: 'date' | 'views' | 'downloads' | 'filename';
  sortOrder?: 'asc' | 'desc';
}

export interface PhotosResponse {
  photos: Photo[];
  totalCount: number;
  page: number;
  limit: number;
}

export interface PhotoMetadata {
  title?: string;
  description?: string;
  tags?: string[];
  pricing?: {
    digital?: number;
    print?: number;
  };
}

export interface UploadSessionResponse {
  sessionId: string;
  uploadUrls: Array<{
    filename: string;
    uploadUrl: string;
  }>;
  expiresAt: string;
}

export interface UploadStatus {
  sessionId: string;
  totalFiles: number;
  uploadedFiles: number;
  failedFiles: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  processedPhotos: Photo[];
  errors: Array<{
    filename: string;
    error: string;
  }>;
}

export interface UpdatePhotoRequest {
  title?: string;
  description?: string;
  tags?: string[];
  status?: 'pending' | 'approved' | 'rejected';
  pricing?: {
    digital?: number;
    print?: number;
  };
}

export interface BulkUpdateRequest {
  photoIds: string[];
  updates: {
    status?: 'pending' | 'approved' | 'rejected';
    tags?: string[];
    pricing?: {
      digital?: number;
      print?: number;
    };
  };
}

@Injectable({
  providedIn: 'root'
})
export class PhotosDataService {
  private readonly baseUrl = `${environment.apiUrl}/api/photo`;
  private readonly backendUrl = environment.apiUrl || 'http://localhost:5290';

  constructor(private http: HttpClient) { }

  /**
   * Generate backend photo URL for serving images
   */
  private getPhotoServeUrl(photoId: string, quality: 'thumbnail' | 'watermarked' | 'original' = 'watermarked'): string {
    return `${this.backendUrl}/api/photo/${photoId}/serve?quality=${quality}`;
  }

  /**
   * Get photos for an event using the new backend API
   */
  getPhotos(eventId: string, filters: PhotoFilters = {}): Observable<PhotosResponse> {
    let params = new HttpParams()
      .set('eventId', eventId.toString());
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params = params.set(key, value.toString());
      }
    });

    return this.http.get<PhotosResponse>(`${this.baseUrl}`, { params });
  }

  /**
   * Upload photos using the new backend API
   */
  uploadPhotos(eventId: string, files: FileList, metadata?: PhotoMetadata): Observable<any> {
    const formData = new FormData();
    
    for (let i = 0; i < files.length; i++) {
      formData.append('files', files[i]);
    }

    return this.http.post<any>(`${this.baseUrl}/upload/${eventId}`, formData);
  }

  /**
   * Delete a photo
   */
  deletePhoto(photoId: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${photoId}`);
  }

  /**
   * Get secure URL for a photo (if needed for download/purchase)
   */
  getSecurePhotoUrl(photoId: string, quality: 'thumbnail' | 'watermarked' | 'original' = 'watermarked'): Observable<{url: string, expiresAt: string}> {
    return this.http.get<{url: string, expiresAt: string}>(`${this.baseUrl}/${photoId}/url?quality=${quality}`);
  }

  /**
   * Get upload status
   */
  getUploadStatus(sessionId: string): Observable<UploadStatus> {
    return this.http.get<UploadStatus>(`${this.baseUrl}/upload-status/${sessionId}`);
  }

  /**
   * Update a photo
   */
  updatePhoto(eventId: string, photoId: string, updates: UpdatePhotoRequest): Observable<Photo> {
    return this.http.put<Photo>(`${this.baseUrl}/${eventId}/photos/${photoId}`, updates);
  }

  /**
   * Bulk update photos
   */
  bulkUpdatePhotos(eventId: string, updates: BulkUpdateRequest): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/${eventId}/photos/bulk-update`, updates);
  }

  /**
   * Reprocess a photo
   */
  reprocessPhoto(photoId: string): Observable<void> {
    return this.http.post<void>(`${environment.apiUrl}/api/photos/${photoId}/reprocess`, {});
  }
}