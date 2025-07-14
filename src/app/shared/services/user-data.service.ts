import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  role: string;
  createdAt: string;
  preferences?: {
    notifications: {
      email: boolean;
      sms: boolean;
      push: boolean;
    };
  };
}

export interface UpdateProfileRequest {
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  preferences?: {
    notifications?: {
      email?: boolean;
      sms?: boolean;
      push?: boolean;
    };
  };
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface DeleteAccountRequest {
  password: string;
  reason?: string;
}

@Injectable({
  providedIn: 'root'
})
export class UserDataService {
  private readonly baseUrl = `${environment.apiUrl}/api/users`;

  constructor(private http: HttpClient) { }

  getProfile(): Observable<UserProfile> {
    return this.http.get<UserProfile>(`${this.baseUrl}/profile`);
  }

  updateProfile(profile: UpdateProfileRequest): Observable<UserProfile> {
    return this.http.put<UserProfile>(`${this.baseUrl}/profile`, profile);
  }

  changePassword(passwordData: ChangePasswordRequest): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/profile/password`, passwordData);
  }

  deleteAccount(password: string, reason?: string): Observable<void> {
    const request: DeleteAccountRequest = { password, reason };
    return this.http.delete<void>(`${this.baseUrl}/profile`, { body: request });
  }
}