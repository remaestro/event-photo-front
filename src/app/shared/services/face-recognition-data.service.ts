import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface ScanResponse {
  scanId: string;
  status: 'processing' | 'completed' | 'failed';
  estimatedTime: string;
}

export interface ScanStatus {
  scanId: string;
  status: 'processing' | 'completed' | 'failed';
  progress: number;
  results?: {
    totalMatches: number;
    highConfidence: number;
    mediumConfidence: number;
    lowConfidence: number;
  };
}

export interface ScanResults {
  scanId: string;
  eventId: string;
  eventName: string;
  results: Array<{
    photoId: string;
    confidence: number;
    boundingBox: {
      x: number;
      y: number;
      width: number;
      height: number;
    };
    photo: {
      id: string;
      thumbnail: string;
      watermarked: string;
      price: number;
      tags: string[];
      timestamp: string;
    };
  }>;
}

@Injectable({
  providedIn: 'root'
})
export class FaceRecognitionDataService {
  private readonly baseUrl = `${environment.apiUrl}/api/face-recognition`;

  constructor(private http: HttpClient) { }

  startScan(photo: File, eventCode: string): Observable<ScanResponse> {
    const formData = new FormData();
    formData.append('photo', photo);
    formData.append('eventCode', eventCode);

    return this.http.post<ScanResponse>(`${this.baseUrl}/scan`, formData);
  }

  getScanStatus(scanId: string): Observable<ScanStatus> {
    return this.http.get<ScanStatus>(`${this.baseUrl}/scan/${scanId}/status`);
  }

  getScanResults(scanId: string): Observable<ScanResults> {
    return this.http.get<ScanResults>(`${this.baseUrl}/scan/${scanId}/results`);
  }
}