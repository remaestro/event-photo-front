import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { delay, map, catchError, tap } from 'rxjs/operators';
import { AuthDataService, RegisterRequest as AuthDataRegisterRequest, LoginRequest as AuthDataLoginRequest } from './auth-data.service';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'Organizer' | 'Admin' | 'Client';  // 🆕 Ajout du rôle Client
  isEmailVerified: boolean;
  createdAt: Date;
  lastLoginAt?: Date;
}

export interface RegisterRequest {
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  role: 'organizer' | 'admin' | 'client';  // 🆕 Ajout du rôle client
  agreeToTerms: boolean;
}

export interface LoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  user?: User;
  token?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
  public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

  constructor(private authDataService: AuthDataService) {
    // Initialiser les données par défaut (admin en dur) - keep for development
    this.initializeDefaultData();
    // Vérifier si l'utilisateur est déjà connecté au démarrage
    this.checkStoredAuth();
    // Démarrer le contrôle automatique de session
    this.startSessionMonitoring();
  }

  /**
   * Inscription d'un nouvel utilisateur - now uses real API
   */
  register(request: RegisterRequest): Observable<AuthResponse> {
    // Validation des données
    if (!this.validateRegisterRequest(request)) {
      return of({
        success: false,
        message: 'Données d\'inscription invalides'
      });
    }

    // Map to API request format
    const apiRequest: AuthDataRegisterRequest = {
      email: request.email,
      password: request.password,
      firstName: request.firstName,
      lastName: request.lastName,
      role: request.role,
      phoneNumber: undefined // Could be added to form later
    };

    return this.authDataService.register(apiRequest).pipe(
      map(response => {
        if (response.success && response.user) {
          // 🎯 IMPORTANT: Include the user object with ID for invitation acceptance
          const user: User = {
            id: response.user.id,
            email: response.user.email,
            firstName: response.user.firstName,
            lastName: response.user.lastName,
            role: response.user.role === 'organizer' ? 'Organizer' : 
                  response.user.role === 'admin' ? 'Admin' : 'Client',
            isEmailVerified: response.user.isEmailVerified,
            createdAt: new Date()
          };

          return {
            success: true,
            message: response.message || 'Compte créé avec succès. Vérifiez votre email pour activer votre compte.',
            user: user // 🎯 Return the user object so invitation acceptance can use the ID
          };
        } else {
          return {
            success: false,
            message: response.message || 'Erreur lors de l\'inscription'
          };
        }
      }),
      catchError(() => {
        // Fallback to mock implementation for development
        return this.registerMock(request);
      })
    );
  }

  /**
   * Connexion utilisateur - now uses real API
   */
  login(request: LoginRequest): Observable<AuthResponse> {
    const apiRequest: AuthDataLoginRequest = {
      email: request.email,
      password: request.password
    };

    return this.authDataService.login(apiRequest).pipe(
      tap(response => {
        // Debug: Log the actual response from backend
        console.log('🔍 Backend login response:', response);
      }),
      map(response => {
        if (response.success && response.user && response.token) {
          // Map API user to our User interface with proper role capitalization
          const user: User = {
            id: response.user.id,
            email: response.user.email,
            firstName: response.user.firstName,
            lastName: response.user.lastName,
            // Convert backend role to proper case: 'organizer' -> 'Organizer', 'admin' -> 'Admin', 'client' -> 'Client'
            role: response.user.role === 'organizer' ? 'Organizer' : 
                  response.user.role === 'admin' ? 'Admin' : 'Client',
            isEmailVerified: response.user.isEmailVerified,
            createdAt: new Date(),
            lastLoginAt: new Date()
          };

          // Store tokens and user
          this.setCurrentUser(user, response.token, request.rememberMe);
          if (response.refreshToken) {
            const storage = request.rememberMe ? localStorage : sessionStorage;
            storage.setItem('refresh_token', response.refreshToken);
          }

          console.log('✅ Real API login successful, token stored:', response.token.substring(0, 20) + '...');
          console.log('👤 User role:', user.role);

          return {
            success: true,
            message: 'Connexion réussie',
            user: user,
            token: response.token
          };
        } else {
          console.log('❌ Backend login failed:', response.message);
          return {
            success: false,
            message: response.message || 'Email ou mot de passe incorrect'
          };
        }
      }),
      catchError((error) => {
        console.error('🚨 API login error:', error);
        // DO NOT fall back to mock - force real authentication
        return of({
          success: false,
          message: error.error?.message || 'Erreur de connexion au serveur. Veuillez réessayer.'
        });
      })
    );
  }

  /**
   * Déconnexion - now uses real API
   */
  logout(): void {
    const refreshToken = localStorage.getItem('refresh_token') || sessionStorage.getItem('refresh_token');
    
    if (refreshToken) {
      // Call API logout
      this.authDataService.logout(refreshToken).subscribe({
        next: () => {
          console.log('Logout successful');
        },
        error: (error) => {
          console.error('Logout error:', error);
        }
      });
    }

    // Clear local storage regardless of API call result
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    localStorage.removeItem('refresh_token');
    sessionStorage.removeItem('auth_token');
    sessionStorage.removeItem('auth_user');
    sessionStorage.removeItem('refresh_token');
    
    this.currentUserSubject.next(null);
    this.isAuthenticatedSubject.next(false);
  }

  /**
   * Vérification d'email - now uses real API
   */
  verifyEmail(token: string): Observable<AuthResponse> {
    return this.authDataService.verifyEmail(token).pipe(
      map(() => ({
        success: true,
        message: 'Email vérifié avec succès. Vous pouvez maintenant vous connecter.'
      })),
      catchError(() => of({
        success: false,
        message: 'Token de vérification invalide'
      }))
    );
  }

  /**
   * Obtenir l'utilisateur actuel
   */
  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  /**
   * Vérifier si l'utilisateur est connecté
   */
  isAuthenticated(): boolean {
    return this.isAuthenticatedSubject.value;
  }

  /**
   * Obtenir le rôle de l'utilisateur actuel
   */
  getUserRole(): 'Organizer' | 'Admin' | 'Client' | null {
    const user = this.getCurrentUser();
    return user ? user.role : null;
  }

  // Mock implementations for development fallback
  private registerMock(request: RegisterRequest): Observable<AuthResponse> {
    return of(null).pipe(
      delay(1500),
      map(() => {
        const existingUsers = this.getStoredUsers();
        const emailExists = existingUsers.some(u => u.email === request.email);
        
        if (emailExists) {
          return {
            success: false,
            message: 'Cet email est déjà utilisé'
          };
        }

        const newUser: User = {
          id: this.generateUserId(),
          email: request.email,
          firstName: request.firstName,
          lastName: request.lastName,
          // Convert API role to proper case: 'organizer' -> 'Organizer', 'admin' -> 'Admin', 'client' -> 'Client'
          role: request.role === 'organizer' ? 'Organizer' : 
                request.role === 'admin' ? 'Admin' : 'Client',
          isEmailVerified: false,
          createdAt: new Date()
        };

        this.saveUser(newUser, request.password);
        this.sendVerificationEmail(newUser);

        return {
          success: true,
          message: 'Compte créé avec succès. Vérifiez votre email pour activer votre compte.',
          user: newUser
        };
      })
    );
  }

  /**
   * Initialise les données par défaut avec un admin en dur
   */
  private initializeDefaultData(): void {
    const existingUsers = this.getStoredUsers();
    const existingCredentials = this.getStoredCredentials();
    
    // Vérifier si l'admin par défaut existe déjà
    const adminExists = existingUsers.some(u => u.email === 'admin@eventphoto.com');
    
    if (!adminExists) {
      // Créer l'admin par défaut
      const defaultAdmin: User = {
        id: 'admin_default_001',
        email: 'admin@eventphoto.com',
        firstName: 'Super',
        lastName: 'Admin',
        role: 'Admin',  // Capitalisation corrigée
        isEmailVerified: true, // Admin pré-vérifié
        createdAt: new Date('2024-01-01T00:00:00Z'),
        lastLoginAt: undefined
      };

      // Sauvegarder l'admin et ses credentials
      existingUsers.push(defaultAdmin);
      existingCredentials.push({ 
        email: 'admin@eventphoto.com', 
        password: 'AdminEventPhoto2024!' 
      });

      localStorage.setItem('app_users', JSON.stringify(existingUsers));
      localStorage.setItem('app_credentials', JSON.stringify(existingCredentials));

      console.log('🔧 Admin par défaut créé:');
      console.log('   Email: admin@eventphoto.com');
      console.log('   Mot de passe: AdminEventPhoto2024!');
      console.log('   Rôle: Administrateur');
    }

    // Créer également un organisateur de test
    const organizerExists = existingUsers.some(u => u.email === 'organizer@eventphoto.com');
    
    if (!organizerExists) {
      const defaultOrganizer: User = {
        id: 'organizer_default_001',
        email: 'organizer@eventphoto.com',
        firstName: 'Test',
        lastName: 'Organisateur',
        role: 'Organizer',  // Capitalisation corrigée
        isEmailVerified: true,
        createdAt: new Date('2024-01-01T00:00:00Z'),
        lastLoginAt: undefined
      };

      existingUsers.push(defaultOrganizer);
      existingCredentials.push({ 
        email: 'organizer@eventphoto.com', 
        password: 'OrganizerTest2024!' 
      });

      localStorage.setItem('app_users', JSON.stringify(existingUsers));
      localStorage.setItem('app_credentials', JSON.stringify(existingCredentials));

      console.log('📸 Organisateur par défaut créé:');
      console.log('   Email: organizer@eventphoto.com');
      console.log('   Mot de passe: OrganizerTest2024!');
      console.log('   Rôle: Organisateur');
    }
  }

  /**
   * Connexion rapide admin (pour debug/test)
   */
  quickAdminLogin(): Observable<AuthResponse> {
    const adminLoginRequest: LoginRequest = {
      email: 'admin@eventphoto.com',
      password: 'AdminEventPhoto2024!',
      rememberMe: true
    };
    
    return this.login(adminLoginRequest);
  }

  /**
   * Connexion rapide organisateur (pour debug/test)
   */
  quickOrganizerLogin(): Observable<AuthResponse> {
    const organizerLoginRequest: LoginRequest = {
      email: 'organizer@eventphoto.com',
      password: 'OrganizerTest2024!',
      rememberMe: true
    };
    
    return this.login(organizerLoginRequest);
  }

  /**
   * Obtenir les informations des comptes par défaut
   */
  getDefaultAccounts(): Array<{email: string, password: string, role: string}> {
    return [
      {
        email: 'admin@eventphoto.com',
        password: 'AdminEventPhoto2024!',
        role: 'Administrateur'
      },
      {
        email: 'organizer@eventphoto.com',
        password: 'OrganizerTest2024!',
        role: 'Organisateur'
      }
    ];
  }

  /**
   * Force real backend authentication for organizer testing
   */
  loginToRealBackend(): Observable<AuthResponse> {
    console.log('🔑 Attempting real backend login...');
    
    // Try with the backend organizer credentials
    const organizerLogin: LoginRequest = {
      email: 'organizer@eventphoto.com',
      password: 'OrganizerTest2024!',
      rememberMe: true
    };

    return this.authDataService.login({
      email: organizerLogin.email,
      password: organizerLogin.password
    }).pipe(
      tap(response => {
        console.log('🔍 Real backend response:', response);
        if (response.success && response.token) {
          console.log('✅ Successfully authenticated with real backend');
          console.log('🎫 Real JWT token received:', response.token.substring(0, 30) + '...');
        } else {
          console.log('❌ Backend authentication failed:', response.message);
        }
      }),
      map(response => {
        if (response.success && response.user && response.token) {
          const user: User = {
            id: response.user.id,
            email: response.user.email,
            firstName: response.user.firstName,
            lastName: response.user.lastName,
            role: response.user.role === 'organizer' ? 'Organizer' : 
                  response.user.role === 'admin' ? 'Admin' : 'Client',
            isEmailVerified: response.user.isEmailVerified,
            createdAt: new Date(),
            lastLoginAt: new Date()
          };

          this.setCurrentUser(user, response.token, true);
          if (response.refreshToken) {
            localStorage.setItem('refresh_token', response.refreshToken);
          }

          return {
            success: true,
            message: 'Connexion réussie',
            user: user,
            token: response.token
          };
        } else {
          return {
            success: false,
            message: response.message || 'Erreur de connexion'
          };
        }
      }),
      catchError((error) => {
        console.error('🚨 Real backend login error:', error);
        return of({
          success: false,
          message: error.error?.message || 'Erreur de connexion au serveur. Veuillez réessayer.'
        });
      })
    );
  }

  // Missing private methods - adding them back

  private checkStoredAuth(): void {
    const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
    const userStr = localStorage.getItem('auth_user') || sessionStorage.getItem('auth_user');

    if (token && userStr) {
      try {
        const user = JSON.parse(userStr);
        this.currentUserSubject.next(user);
        this.isAuthenticatedSubject.next(true);
      } catch (error) {
        this.logout();
      }
    }
  }

  private setCurrentUser(user: User, token: string, rememberMe?: boolean): void {
    const storage = rememberMe ? localStorage : sessionStorage;
    
    storage.setItem('auth_token', token);
    storage.setItem('auth_user', JSON.stringify(user));
    
    this.currentUserSubject.next(user);
    this.isAuthenticatedSubject.next(true);
  }

  private validateRegisterRequest(request: RegisterRequest): boolean {
    if (!request.email || !request.password || !request.firstName || !request.lastName) {
      return false;
    }

    if (request.password !== request.confirmPassword) {
      return false;
    }

    if (request.password.length < 8) {
      return false;
    }

    if (!request.agreeToTerms) {
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(request.email)) {
      return false;
    }

    return true;
  }

  private generateUserId(): string {
    return 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  private generateToken(user: User): string {
    return 'token_' + user.id + '_' + Date.now();
  }

  private getStoredUsers(): User[] {
    const usersStr = localStorage.getItem('app_users');
    return usersStr ? JSON.parse(usersStr) : [];
  }

  private getStoredCredentials(): Array<{email: string, password: string}> {
    const credsStr = localStorage.getItem('app_credentials');
    return credsStr ? JSON.parse(credsStr) : [];
  }

  private saveUser(user: User, password: string): void {
    const users = this.getStoredUsers();
    users.push(user);
    localStorage.setItem('app_users', JSON.stringify(users));

    const credentials = this.getStoredCredentials();
    credentials.push({ email: user.email, password: password });
    localStorage.setItem('app_credentials', JSON.stringify(credentials));
  }

  private updateStoredUser(updatedUser: User): void {
    const users = this.getStoredUsers();
    const index = users.findIndex(u => u.id === updatedUser.id);
    if (index !== -1) {
      users[index] = updatedUser;
      localStorage.setItem('app_users', JSON.stringify(users));
    }
  }

  private sendVerificationEmail(user: User): void {
    console.log(`Email de vérification envoyé à ${user.email}`);
  }

  private startSessionMonitoring(): void {
    // Vérifier la session toutes les 30 minutes
    setInterval(() => {
      this.checkSessionValidity();
    }, 30 * 60 * 1000); // 30 minutes
  }

  private checkSessionValidity(): void {
    if (!this.isAuthenticated()) {
      return;
    }

    const currentUser = this.getCurrentUser();
    if (currentUser && currentUser.lastLoginAt) {
      const now = new Date();
      const lastLogin = new Date(currentUser.lastLoginAt);
      const hoursSinceLogin = (now.getTime() - lastLogin.getTime()) / (1000 * 60 * 60);
      
      // Avertir à 23h de session
      if (hoursSinceLogin >= 23 && hoursSinceLogin < 23.5) {
        this.notifySessionExpiringSoon();
      }
      
      // Déconnecter à 24h
      if (hoursSinceLogin >= 24) {
        this.expireSession();
      }
    }
  }

  private notifySessionExpiringSoon(): void {
    // Cette méthode sera appelée par le service de notification
    console.log('Session expiring soon - notification should be sent');
  }

  private expireSession(): void {
    this.logout();
    console.log('Session expired automatically after 24h');
  }

  /**
   * Renouveler la session utilisateur
   */
  renewSession(): Observable<AuthResponse> {
    const currentUser = this.getCurrentUser();
    
    if (!currentUser) {
      return of({
        success: false,
        message: 'Aucune session active à renouveler'
      });
    }

    return of(null).pipe(
      delay(500),
      map(() => {
        // Mettre à jour la dernière connexion
        currentUser.lastLoginAt = new Date();
        this.updateStoredUser(currentUser);

        // Générer un nouveau token
        const newToken = this.generateToken(currentUser);
        
        // Mettre à jour le stockage
        const isRemembered = !!localStorage.getItem('auth_token');
        this.setCurrentUser(currentUser, newToken, isRemembered);

        return {
          success: true,
          message: 'Session renouvelée avec succès',
          user: currentUser,
          token: newToken
        };
      })
    );
  }

  /**
   * Obtenir les informations de session
   */
  getSessionInfo(): {isValid: boolean, hoursRemaining: number, lastLogin?: Date} {
    const currentUser = this.getCurrentUser();
    
    if (!currentUser || !currentUser.lastLoginAt) {
      return { isValid: false, hoursRemaining: 0 };
    }

    const now = new Date();
    const lastLogin = new Date(currentUser.lastLoginAt);
    const hoursSinceLogin = (now.getTime() - lastLogin.getTime()) / (1000 * 60 * 60);
    const hoursRemaining = Math.max(0, 24 - hoursSinceLogin);

    return {
      isValid: hoursRemaining > 0,
      hoursRemaining: Math.round(hoursRemaining * 10) / 10, // Arrondi à 1 décimale
      lastLogin: lastLogin
    };
  }

  /**
   * Force logout and clear all tokens (for debugging authentication issues)
   */
  forceLogout(): void {
    console.log('🧹 Force logout - clearing all authentication data');
    
    // Clear all possible storage locations
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    localStorage.removeItem('refresh_token');
    sessionStorage.removeItem('auth_token');
    sessionStorage.removeItem('auth_user');
    sessionStorage.removeItem('refresh_token');
    
    // Also clear mock data
    localStorage.removeItem('app_users');
    localStorage.removeItem('app_credentials');
    
    this.currentUserSubject.next(null);
    this.isAuthenticatedSubject.next(false);
    
    console.log('✅ All authentication data cleared');
  }

  /**
   * Get current token for debugging
   */
  getCurrentToken(): string | null {
    const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
    if (token) {
      console.log('🎫 Current token type:', token.startsWith('token_') ? 'MOCK TOKEN' : 'REAL JWT TOKEN');
      console.log('🎫 Token preview:', token.substring(0, 30) + '...');
    }
    return token;
  }
}
