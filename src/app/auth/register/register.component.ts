import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService, RegisterRequest } from '../../shared/services/auth.service';
import { NotificationService } from '../../shared/services/notification.service';
import { InvitationService } from '../../shared/services/invitation.service';
import { PhotoPurchaseService } from '../../shared/services/photo-purchase.service';

// Custom validator for password confirmation
function passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
  const password = control.get('password');
  const confirmPassword = control.get('confirmPassword');
  
  if (!password || !confirmPassword) {
    return null;
  }
  
  return password.value === confirmPassword.value ? null : { passwordMismatch: true };
}

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, RouterLink],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css'
})
export class RegisterComponent implements OnInit {
  registerForm: FormGroup;
  selectedRole: 'organizer' | 'admin' | null = null;
  isLoading = false;
  registrationSuccess = false;
  
  // 🎯 Propriétés pour les invitations
  invitationToken: string | null = null;
  eventId: string | null = null;
  invitationInfo: any = null;
  isInvitedUser = false;
  isValidatingInvitation = false;

  // 🆕 Propriétés pour l'accès aux photos
  isPhotoAccessFlow = false;
  pendingSessionId: string | null = null;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private notificationService: NotificationService,
    private router: Router,
    private route: ActivatedRoute,
    private invitationService: InvitationService,
    private photoPurchaseService: PhotoPurchaseService
  ) {
    this.registerForm = this.createForm();
  }

  ngOnInit(): void {
    // 🎯 Détecter les paramètres d'invitation et d'accès aux photos
    this.route.queryParams.subscribe(params => {
      // Vérifier si c'est un flow d'accès aux photos
      const reason = params['reason'];
      this.isPhotoAccessFlow = reason === 'photo-access';
      
      // Récupérer le sessionId en attente si applicable
      if (this.isPhotoAccessFlow) {
        this.pendingSessionId = this.photoPurchaseService.checkPendingAccess();
        // Pour l'accès aux photos, pas besoin de sélectionner un rôle administratif
        this.selectedRole = null;
      }

      // Vérifier s'il y a un token d'invitation
      if (params['invitation'] && params['eventId']) {
        this.invitationToken = params['invitation'];
        this.eventId = params['eventId'];
        this.isInvitedUser = true;
        this.validateInvitation();
      }
      
      // Check if role is pre-selected from query params (from role-selection page)
      if (params['role'] && (params['role'] === 'organizer' || params['role'] === 'admin')) {
        this.selectedRole = params['role'];
        this.updateFormWithRole();
      }
    });
  }

  /**
   * 🔍 Valider le token d'invitation
   */
  private validateInvitation(): void {
    if (!this.invitationToken) return;
    
    this.isValidatingInvitation = true;
    
    this.invitationService.validateInvitationToken(this.invitationToken)
      .subscribe({
        next: (response) => {
          this.isValidatingInvitation = false;
          
          if (response.valid) {
            this.invitationInfo = response;
            // Force le rôle à 'organizer' pour les bénéficiaires invités
            this.selectedRole = 'organizer';
            this.updateFormWithRole();
            
            this.notificationService.success(
              'Invitation valide',
              `Vous êtes invité(e) à rejoindre l'événement "${response.eventName}"`
            );
          } else {
            this.handleInvalidInvitation();
          }
        },
        error: (error) => {
          this.isValidatingInvitation = false;
          console.error('Erreur validation invitation:', error);
          this.handleInvalidInvitation();
        }
      });
  }

  /**
   * ❌ Gérer les invitations invalides
   */
  private handleInvalidInvitation(): void {
    this.notificationService.error(
      'Invitation invalide',
      'Ce lien d\'invitation est expiré ou invalide.'
    );
    
    // Rediriger vers la page d'inscription normale après 3 secondes
    setTimeout(() => {
      this.router.navigate(['/register']);
    }, 3000);
  }

  private createForm(): FormGroup {
    return this.fb.group({
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', [Validators.required]],
      agreeToTerms: [false, [Validators.requiredTrue]]
    }, {
      validators: passwordMatchValidator
    });
  }

  private updateFormWithRole(): void {
    if (this.selectedRole) {
      // Update form validation or add role-specific fields if needed
      this.registerForm.patchValue({
        // Could add role-specific default values here
      });
    }
  }

  selectRole(role: 'organizer' | 'admin'): void {
    this.selectedRole = role;
    this.updateFormWithRole();
  }

  changeRole(): void {
    this.selectedRole = null;
    // Clear any role-specific form values if needed
  }

  onSubmit(): void {
    // Pour l'accès aux photos, pas besoin de rôle administratif
    if (this.registerForm.invalid || (!this.selectedRole && !this.isPhotoAccessFlow)) {
      this.markFormGroupTouched();
      return;
    }

    this.isLoading = true;
    const formValue = this.registerForm.value;

    const registerRequest: RegisterRequest = {
      email: formValue.email.trim().toLowerCase(),
      password: formValue.password,
      confirmPassword: formValue.confirmPassword,
      firstName: formValue.firstName.trim(),
      lastName: formValue.lastName.trim(),
      role: this.selectedRole || 'organizer', // Rôle par défaut pour l'accès aux photos
      agreeToTerms: formValue.agreeToTerms
    };

    this.authService.register(registerRequest).subscribe({
      next: (response) => {
        if (response.success) {
          this.registrationSuccess = true;
          
          // 🎯 Si c'est un utilisateur invité, accepter automatiquement l'invitation
          if (this.isInvitedUser && this.invitationToken && response.user?.id) {
            this.acceptInvitation(response.user.id);
          } 
          // 🆕 Si c'est un flow d'accès aux photos, associer l'achat
          else if (this.isPhotoAccessFlow && this.pendingSessionId && response.user?.email) {
            this.associatePhotosPurchase(response.user.email);
          } 
          else {
            this.handleNormalRegistration();
          }
          
          // Track the registration for analytics
          this.trackRegistration(this.selectedRole || 'organizer');
          
        } else {
          this.isLoading = false;
          this.notificationService.error(
            'Erreur d\'inscription',
            response.message
          );
        }
      },
      error: (error) => {
        this.isLoading = false;
        console.error('Registration error:', error);
        this.notificationService.error(
          'Erreur technique',
          'Une erreur est survenue lors de l\'inscription. Veuillez réessayer.'
        );
      }
    });
  }

  /**
   * ✅ Accepter automatiquement l'invitation après inscription
   */
  private acceptInvitation(userId: string): void {
    if (!this.invitationToken || !userId) {
      this.handleNormalRegistration();
      return;
    }

    this.invitationService.acceptInvitation(this.invitationToken, userId)
      .subscribe({
        next: (response) => {
          this.isLoading = false;
          
          this.notificationService.success(
            'Inscription et invitation acceptées !',
            `Vous êtes maintenant bénéficiaire de l'événement "${this.invitationInfo?.eventName}"`
          );
          
          // Rediriger vers le dashboard organizer après acceptation
          setTimeout(() => {
            this.router.navigate(['/organizer/dashboard']);
          }, 2000);
        },
        error: (error) => {
          this.isLoading = false;
          console.error('Erreur acceptation invitation:', error);
          
          this.notificationService.warning(
            'Inscription réussie',
            'Votre compte a été créé mais l\'invitation n\'a pas pu être acceptée automatiquement. Contactez l\'organisateur.'
          );
          
          this.handleNormalRegistration();
        }
      });
  }

  /**
   * 🆕 Associer l'achat de photos au nouveau compte utilisateur
   */
  private async associatePhotosPurchase(userEmail: string): Promise<void> {
    if (!this.pendingSessionId) {
      this.handleNormalRegistration();
      return;
    }

    try {
      // Associer l'achat à l'utilisateur nouvellement inscrit
      await this.photoPurchaseService.associatePurchaseToUser(this.pendingSessionId, userEmail).toPromise();
      
      // Nettoyer l'accès en attente
      this.photoPurchaseService.clearPendingAccess();
      
      // Charger les achats de l'utilisateur
      this.photoPurchaseService.loadUserPurchases(userEmail);
      
      this.isLoading = false;
      
      this.notificationService.success(
        'Compte créé et photos associées !',
        'Votre compte a été créé et vos photos achetées sont maintenant disponibles.'
      );
      
      // Rediriger vers les achats après un court délai
      setTimeout(() => {
        this.router.navigate(['/my-purchases']);
      }, 2000);
      
    } catch (error) {
      console.error('Error associating purchase to new user:', error);
      
      this.isLoading = false;
      
      this.notificationService.warning(
        'Compte créé',
        'Votre compte a été créé mais l\'association avec vos photos a échoué. Contactez le support si nécessaire.'
      );
      
      // Redirection vers la connexion pour réessayer l'association
      setTimeout(() => {
        this.router.navigate(['/auth/login'], { 
          queryParams: { 
            redirectTo: 'my-purchases',
            reason: 'photo-access'
          } 
        });
      }, 2000);
    }
  }

  /**
   * 📝 Gérer l'inscription normale (sans invitation ni achat)
   */
  private handleNormalRegistration(): void {
    this.isLoading = false;
    
    this.notificationService.success(
      'Inscription réussie',
      'Votre compte a été créé. Vérifiez votre email pour l\'activer.'
    );
    
    // Redirection normale
    setTimeout(() => {
      this.goToLogin();
    }, 2000);
  }

  // Helper method to mark all form fields as touched for validation display
  private markFormGroupTouched(): void {
    Object.keys(this.registerForm.controls).forEach(key => {
      const control = this.registerForm.get(key);
      control?.markAsTouched();
    });
  }

  // Track registration for analytics (placeholder for future implementation)
  private trackRegistration(role: 'organizer' | 'admin'): void {
    // This could be connected to Google Analytics, Mixpanel, etc.
    console.log(`User registered with role: ${role}`);
  }

  // Getter for easy access to form controls in template
  get f() {
    return this.registerForm.controls;
  }

  // Helper methods for role-specific UI
  getRoleDisplayName(): string {
    return this.selectedRole === 'organizer' ? 'Organisateur' : 'Administrateur';
  }

  getRoleDescription(): string {
    return this.selectedRole === 'organizer' 
      ? 'Créateur d\'événements' 
      : 'Modérateur de plateforme';
  }

  getRoleIcon(): string {
    return this.selectedRole === 'organizer' ? '📸' : '🛡️';
  }

  // 🎯 Méthodes d'aide pour l'UI d'invitation
  getInvitationDisplayText(): string {
    if (!this.invitationInfo) return '';
    
    return `Vous êtes invité(e) à rejoindre l'événement "${this.invitationInfo.eventName}" 
            organisé par ${this.invitationInfo.organizerName}`;
  }

  isInvitationExpiringSoon(): boolean {
    if (!this.invitationInfo?.expiresAt) return false;
    
    const expirationDate = new Date(this.invitationInfo.expiresAt);
    const now = new Date();
    const hoursUntilExpiration = (expirationDate.getTime() - now.getTime()) / (1000 * 60 * 60);
    
    return hoursUntilExpiration <= 24; // Expire dans moins de 24h
  }

  // 🆕 Méthodes d'aide pour l'UI d'accès aux photos
  shouldShowRoleSelection(): boolean {
    // Ne pas montrer la sélection de rôle pour l'accès aux photos
    return !this.isPhotoAccessFlow && !this.isInvitedUser;
  }

  getPageTitle(): string {
    if (this.isPhotoAccessFlow) {
      return 'Créer un compte pour accéder à vos photos';
    }
    if (this.isInvitedUser) {
      return 'Créer un compte pour rejoindre l\'événement';
    }
    return 'Inscription';
  }

  getPageDescription(): string {
    if (this.isPhotoAccessFlow) {
      return 'Créez votre compte pour voir et télécharger les photos que vous venez d\'acheter.';
    }
    if (this.isInvitedUser && this.invitationInfo) {
      return `Vous êtes invité à rejoindre l'événement "${this.invitationInfo.eventName}".`;
    }
    return 'Choisissez votre rôle et créez votre compte EventPhoto.';
  }

  /**
   * 🔄 Rediriger vers la page de connexion
   */
  goToLogin() {
    const queryParams: any = {};
    
    if (this.isPhotoAccessFlow) {
      queryParams.redirectTo = 'my-purchases';
      queryParams.reason = 'photo-access';
    }
    
    this.router.navigate(['/auth/login'], { queryParams });
  }
}
