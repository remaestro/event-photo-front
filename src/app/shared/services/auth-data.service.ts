import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: 'organizer' | 'admin'; // Fixed to match AuthService expectations
  phoneNumber?: string;
}

export interface RegisterResponse {
  success: boolean;
  user?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    isEmailVerified: boolean;
  };
  message?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface LoginResponse {
  success: boolean;
  token?: string;
  refreshToken?: string;
  user?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    isEmailVerified: boolean;
  };
  message?: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface RefreshTokenResponse {
  success: boolean;
  token?: string;
  refreshToken?: string;
  message?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthDataService {
  private readonly baseUrl = `${environment.apiUrl}/api/auth`;

  constructor(private http: HttpClient) { }

  register(userData: RegisterRequest): Observable<RegisterResponse> {
    return this.http.post<RegisterResponse>(`${this.baseUrl}/register`, userData);
  }

  login(credentials: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.baseUrl}/login`, credentials);
  }

  logout(refreshToken: string): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/logout`, { refreshToken });
  }

  refreshToken(refreshToken: string): Observable<RefreshTokenResponse> {
    return this.http.post<RefreshTokenResponse>(`${this.baseUrl}/refresh`, { refreshToken });
  }

  forgotPassword(email: string): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/forgot-password`, { email });
  }

  resetPassword(token: string, newPassword: string): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/reset-password`, { token, newPassword });
  }

  verifyEmail(token: string): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/verify-email`, { token });
  }
}