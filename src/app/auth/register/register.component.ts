import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService, RegisterRequest } from '../../shared/services/auth.service';
import { NotificationService } from '../../shared/services/notification.service';
import { InvitationService } from '../../shared/services/invitation.service';

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
  
  // 🎯 Nouvelles propriétés pour les invitations
  invitationToken: string | null = null;
  eventId: string | null = null;
  invitationInfo: any = null;
  isInvitedUser = false;
  isValidatingInvitation = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private notificationService: NotificationService,
    private router: Router,
    private route: ActivatedRoute,
    private invitationService: InvitationService
  ) {
    this.registerForm = this.createForm();
  }

  ngOnInit(): void {
    // 🎯 Détecter les paramètres d'invitation
    this.route.queryParams.subscribe(params => {
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
    if (this.registerForm.invalid || !this.selectedRole) {
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
      role: this.selectedRole,
      agreeToTerms: formValue.agreeToTerms
    };

    this.authService.register(registerRequest).subscribe({
      next: (response) => {
        if (response.success) {
          this.registrationSuccess = true;
          
          // 🎯 Si c'est un utilisateur invité, accepter automatiquement l'invitation
          if (this.isInvitedUser && this.invitationToken && response.user?.id) {
            this.acceptInvitation(response.user.id);
          } else {
            this.handleNormalRegistration();
          }
          
          // Track the registration for analytics
          this.trackRegistration(this.selectedRole!);
          
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
   * 📝 Gérer l'inscription normale (sans invitation)
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

  // 🎯 Nouvelles méthodes d'aide pour l'UI
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

  /**
   * 🔄 Rediriger vers la page de connexion
   */
  goToLogin() {
    this.router.navigate(['/login']);
  }
}
