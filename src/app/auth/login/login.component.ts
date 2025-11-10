import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService, LoginRequest } from '../../shared/services/auth.service';
import { NotificationService } from '../../shared/services/notification.service';
import { PhotoPurchaseService } from '../../shared/services/photo-purchase.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent implements OnInit {
  loginForm: FormGroup;
  isLoading = false;
  errorMessage = '';
  defaultAccounts: Array<{email: string, password: string, role: string}> = [];
  returnUrl = '/';
  isPhotoAccessFlow = false;
  pendingSessionId: string | null = null;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private notificationService: NotificationService,
    private router: Router,
    private route: ActivatedRoute,
    private photoPurchaseService: PhotoPurchaseService
  ) {
    this.loginForm = this.createForm();
  }

  ngOnInit(): void {
    // Charger les comptes par défaut
    this.defaultAccounts = this.authService.getDefaultAccounts();
    
    // Vérifier si c'est un flow d'accès aux photos
    const reason = this.route.snapshot.queryParams['reason'];
    const redirectTo = this.route.snapshot.queryParams['redirectTo'];
    this.isPhotoAccessFlow = reason === 'photo-access';
    
    // Récupérer le sessionId en attente si applicable
    if (this.isPhotoAccessFlow) {
      this.pendingSessionId = this.photoPurchaseService.checkPendingAccess();
    }
    
    // Récupérer l'URL de retour depuis les query parameters
    this.returnUrl = redirectTo || this.route.snapshot.queryParams['returnUrl'] || '/';
    
    // Si l'utilisateur est déjà connecté, le rediriger
    if (this.authService.isAuthenticated()) {
      const userRole = this.authService.getUserRole();
      this.handlePostLoginRedirect(userRole!);
    }
  }

  private createForm(): FormGroup {
    return this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]],
      rememberMe: [false]
    });
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.markFormGroupTouched();
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    const formValue = this.loginForm.value;

    const loginRequest: LoginRequest = {
      email: formValue.email.trim().toLowerCase(),
      password: formValue.password,
      rememberMe: formValue.rememberMe
    };

    this.authService.login(loginRequest).subscribe({
      next: (response) => {
        this.isLoading = false;
        
        if (response.success && response.user) {
          this.notificationService.success(
            'Connexion réussie',
            `Bienvenue ${response.user.firstName} !`
          );
          
          // Gérer la redirection post-connexion (avec accès aux photos si applicable)
          this.handlePostLoginRedirect(response.user.role, response.user.email);
          
        } else {
          this.errorMessage = response.message;
        }
      },
      error: (error) => {
        this.isLoading = false;
        console.error('Login error:', error);
        this.errorMessage = 'Une erreur technique est survenue. Veuillez réessayer.';
      }
    });
  }

  /**
   * Remplir le formulaire avec les credentials du compte sélectionné
   */
  fillLoginForm(email: string, password: string): void {
    this.loginForm.patchValue({
      email: email,
      password: password,
      rememberMe: true
    });
    this.errorMessage = '';
  }

  /**
   * Connexion rapide directe avec un compte par défaut
   */
  quickLogin(email: string): void {
    this.isLoading = true;
    this.errorMessage = '';

    let loginObservable;
    
    if (email === 'admin@eventphoto.com') {
      loginObservable = this.authService.quickAdminLogin();
    } else if (email === 'organizer@eventphoto.com') {
      loginObservable = this.authService.quickOrganizerLogin();
    } else {
      this.isLoading = false;
      this.errorMessage = 'Compte non reconnu';
      return;
    }

    loginObservable.subscribe({
      next: (response) => {
        this.isLoading = false;
        
        if (response.success && response.user) {
          this.notificationService.success(
            'Connexion rapide réussie',
            `Bienvenue ${response.user.firstName} ${response.user.lastName} !`
          );
          
          // Gérer la redirection post-connexion
          this.handlePostLoginRedirect(response.user.role, response.user.email);
          
        } else {
          this.errorMessage = response.message;
        }
      },
      error: (error) => {
        this.isLoading = false;
        console.error('Quick login error:', error);
        this.errorMessage = 'Erreur lors de la connexion rapide.';
      }
    });
  }

  /**
   * Gérer la redirection après connexion avec gestion des achats de photos
   */
  private async handlePostLoginRedirect(role: 'Organizer' | 'Admin' | 'Client', userEmail?: string): Promise<void> {
    // Si c'est un flow d'accès aux photos et qu'on a un sessionId
    if (this.isPhotoAccessFlow && this.pendingSessionId && userEmail) {
      try {
        // Associer l'achat à l'utilisateur connecté
        await this.photoPurchaseService.associatePurchaseToUser(this.pendingSessionId, userEmail).toPromise();
        
        // Nettoyer l'accès en attente
        this.photoPurchaseService.clearPendingAccess();
        
        // Charger les achats de l'utilisateur
        this.photoPurchaseService.loadUserPurchases(userEmail);
        
        this.notificationService.success(
          'Photos associées !',
          'Vos photos achetées sont maintenant disponibles dans votre espace.'
        );
        
        // Rediriger vers les achats
        this.router.navigate(['/my-purchases']);
        return;
      } catch (error) {
        console.error('Error associating purchase to user:', error);
        this.notificationService.warning(
          'Association des photos',
          'Impossible d\'associer automatiquement vos photos. Contactez le support si nécessaire.'
        );
      }
    }

    // Redirection normale selon le contexte
    if (this.returnUrl && this.returnUrl !== '/') {
      this.router.navigateByUrl(this.returnUrl);
      return;
    }

    // Redirection par défaut selon le rôle
    this.redirectUserByRole(role);
  }

  /**
   * Rediriger l'utilisateur vers le bon dashboard selon son rôle
   */
  private redirectUserByRole(role: 'Organizer' | 'Admin' | 'Client'): void {
    if (role === 'Admin') {
      this.router.navigate(['/admin/dashboard']);
    } else if (role === 'Organizer') {
      this.router.navigate(['/organizer/dashboard']);
    } else if (role === 'Client') {
      // 🆕 Rediriger les clients vers leurs achats ou l'accès aux événements
      this.router.navigate(['/my-purchases']);
    } else {
      this.router.navigate(['/']);
    }
  }

  private markFormGroupTouched(): void {
    Object.keys(this.loginForm.controls).forEach(key => {
      const control = this.loginForm.get(key);
      control?.markAsTouched();
    });
  }

  // Getter pour faciliter l'accès aux contrôles du formulaire
  get f() {
    return this.loginForm.controls;
  }
}
