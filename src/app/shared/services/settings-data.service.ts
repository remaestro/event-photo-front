import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface SystemSettings {
  platform: {
    name: string;
    version: string;
    maintenanceMode: boolean;
  };
  features: {
    faceRecognition: boolean;
    emailNotifications: boolean;
    smsNotifications: boolean;
  };
  limits: {
    maxPhotosPerEvent: number;
    maxFileSize: number;
    allowedFormats: string[];
  };
  pricing: {
    defaultPhotoPrice: number;
    platformFeePercentage: number;
  };
}

export interface UpdateSystemSettingsRequest {
  platform?: {
    maintenanceMode?: boolean;
  };
  features?: {
    faceRecognition?: boolean;
    emailNotifications?: boolean;
    smsNotifications?: boolean;
  };
  limits?: {
    maxPhotosPerEvent?: number;
    maxFileSize?: number;
    allowedFormats?: string[];
  };
  pricing?: {
    defaultPhotoPrice?: number;
    platformFeePercentage?: number;
  };
}

@Injectable({
  providedIn: 'root'
})
export class SettingsDataService {
  private readonly baseUrl = `${environment.apiUrl}/api/settings`;

  constructor(private http: HttpClient) { }

  getSystemSettings(): Observable<SystemSettings> {
    return this.http.get<SystemSettings>(`${this.baseUrl}/system`);
  }

  updateSystemSettings(settings: UpdateSystemSettingsRequest): Observable<SystemSettings> {
    return this.http.put<SystemSettings>(`${this.baseUrl}/system`, settings);
  }
}