import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface DownloadInfo {
  photoId: string;
  filename: string;
  downloadUrl: string;
  expiresAt: string;
  downloadCount: number;
  maxDownloads: number;
}

export interface DownloadUrl {
  downloadUrl: string;
  expiresAt: string;
  filename: string;
  fileSize: number;
}

export interface DownloadHistory {
  photoId: string;
  filename: string;
  eventName: string;
  downloadedAt: string;
  fileSize: number;
}

@Injectable({
  providedIn: 'root'
})
export class DownloadsDataService {
  private readonly baseUrl = `${environment.apiUrl}/api/downloads`;

  constructor(private http: HttpClient) { }

  getOrderDownloads(orderId: string): Observable<DownloadInfo[]> {
    return this.http.get<DownloadInfo[]>(`${this.baseUrl}/${orderId}`);
  }

  generateDownloadUrl(photoId: string, orderId: string, format: string): Observable<DownloadUrl> {
    return this.http.post<DownloadUrl>(`${this.baseUrl}/${photoId}/generate`, {
      orderId,
      format
    });
  }

  getDownloadHistory(): Observable<DownloadHistory[]> {
    return this.http.get<DownloadHistory[]>(`${this.baseUrl}/history`);
  }
}