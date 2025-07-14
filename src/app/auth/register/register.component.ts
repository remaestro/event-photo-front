import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService, RegisterRequest } from '../../shared/services/auth.service';
import { NotificationService } from '../../shared/services/notification.service';

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

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private notificationService: NotificationService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.registerForm = this.createForm();
  }

  ngOnInit(): void {
    // Check if role is pre-selected from query params (from role-selection page)
    this.route.queryParams.subscribe(params => {
      if (params['role'] && (params['role'] === 'organizer' || params['role'] === 'admin')) {
        this.selectedRole = params['role'];
        this.updateFormWithRole();
      }
    });
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
        this.isLoading = false;
        
        if (response.success) {
          this.registrationSuccess = true;
          this.notificationService.success(
            'Inscription réussie',
            'Votre compte a été créé. Vérifiez votre email pour l\'activer.'
          );
          
          // Track the registration for analytics
          this.trackRegistration(this.selectedRole!);
          
        } else {
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

  goToLogin(): void {
    this.router.navigate(['/login']);
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
}
