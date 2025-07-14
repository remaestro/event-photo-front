import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { AuthService, User } from '../../services/auth.service';
import { NotificationService } from '../../services/notification.service';

interface TabItem {
  id: string;
  label: string;
  icon: string;
}

interface NotificationPreferences {
  emailOrders: boolean;
  emailWeeklyReport: boolean;
  emailSecurity: boolean;
  inAppOrders: boolean;
  inAppMessages: boolean;
}

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css'
})
export class ProfileComponent implements OnInit, OnDestroy {
  currentUser: User | null = null;
  activeTab = 'personal';
  
  // États de chargement
  isUpdatingPersonal = false;
  isUpdatingPassword = false;
  isUpdatingNotifications = false;
  isDeletingAccount = false;

  // Formulaires
  personalInfoForm!: FormGroup;
  passwordForm!: FormGroup;
  notificationForm!: FormGroup;
  deleteAccountForm!: FormGroup;

  // Configuration des onglets
  tabs: TabItem[] = [
    { id: 'personal', label: 'Informations personnelles', icon: '👤' },
    { id: 'password', label: 'Mot de passe', icon: '🔒' },
    { id: 'notifications', label: 'Notifications', icon: '🔔' },
    { id: 'delete', label: 'Suppression', icon: '🗑️' }
  ];

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private notificationService: NotificationService,
    private router: Router
  ) {
    this.initializeForms();
  }

  ngOnInit(): void {
    // S'abonner aux changements d'utilisateur
    this.authService.currentUser$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(user => {
      this.currentUser = user;
      if (user) {
        this.populatePersonalInfoForm(user);
        this.loadNotificationPreferences();
      }
    });

    // Rediriger si non connecté
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/login'], { 
        queryParams: { returnUrl: '/profile' } 
      });
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Initialisation de tous les formulaires
   */
  private initializeForms(): void {
    // Formulaire informations personnelles
    this.personalInfoForm = this.fb.group({
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      bio: ['']
    });

    // Formulaire mot de passe
    this.passwordForm = this.fb.group({
      currentPassword: ['', [Validators.required]],
      newPassword: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', [Validators.required]]
    }, { 
      validators: this.passwordMatchValidator 
    });

    // Formulaire notifications
    this.notificationForm = this.fb.group({
      emailOrders: [true],
      emailWeeklyReport: [false],
      emailSecurity: [true],
      inAppOrders: [true],
      inAppMessages: [true]
    });

    // Formulaire suppression de compte
    this.deleteAccountForm = this.fb.group({
      confirmEmail: ['', [Validators.required, Validators.email]],
      deletePassword: ['', [Validators.required]],
      confirmDeletion: [false, [Validators.requiredTrue]]
    });
  }

  /**
   * Validateur personnalisé pour la correspondance des mots de passe
   */
  private passwordMatchValidator(control: AbstractControl): {[key: string]: any} | null {
    const newPassword = control.get('newPassword');
    const confirmPassword = control.get('confirmPassword');
    
    if (newPassword && confirmPassword && newPassword.value !== confirmPassword.value) {
      return { 'passwordMismatch': true };
    }
    
    return null;
  }

  /**
   * Populer le formulaire avec les données utilisateur
   */
  private populatePersonalInfoForm(user: User): void {
    this.personalInfoForm.patchValue({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      bio: (user as any).bio || '' // Extension du type User
    });
  }

  /**
   * Charger les préférences de notification depuis le localStorage
   */
  private loadNotificationPreferences(): void {
    const stored = localStorage.getItem(`notification_prefs_${this.currentUser?.id}`);
    if (stored) {
      try {
        const prefs: NotificationPreferences = JSON.parse(stored);
        this.notificationForm.patchValue(prefs);
      } catch (error) {
        console.error('Erreur lors du chargement des préférences:', error);
      }
    }
  }

  /**
   * Sauvegarder les préférences de notification
   */
  private saveNotificationPreferences(prefs: NotificationPreferences): void {
    if (this.currentUser) {
      localStorage.setItem(
        `notification_prefs_${this.currentUser.id}`, 
        JSON.stringify(prefs)
      );
    }
  }

  /**
   * Navigation entre onglets
   */
  setActiveTab(tabId: string): void {
    this.activeTab = tabId;
  }

  getTabClasses(tabId: string): string {
    const baseClasses = 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300';
    const activeClasses = 'border-indigo-500 text-indigo-600';
    
    return this.activeTab === tabId ? activeClasses : baseClasses;
  }

  /**
   * Mise à jour des informations personnelles - Critère US-003
   */
  updatePersonalInfo(): void {
    if (this.personalInfoForm.invalid || !this.currentUser) {
      return;
    }

    this.isUpdatingPersonal = true;
    const formData = this.personalInfoForm.value;

    // Simuler l'appel API
    setTimeout(() => {
      try {
        // Mettre à jour l'utilisateur
        const updatedUser: User = {
          ...this.currentUser!,
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          ...(formData.bio && { bio: formData.bio })
        };

        // Sauvegarder dans le localStorage (simulation)
        this.updateUserInStorage(updatedUser);

        // Mettre à jour le service d'authentification
        this.authService['currentUserSubject'].next(updatedUser);

        this.notificationService.success(
          'Profil mis à jour',
          'Vos informations personnelles ont été sauvegardées avec succès.'
        );

        // Si l'email a changé, simuler l'envoi d'un email de confirmation
        if (formData.email !== this.currentUser!.email) {
          this.notificationService.info(
            'Confirmation requise',
            'Un email de confirmation a été envoyé à votre nouvelle adresse.'
          );
        }

      } catch (error) {
        console.error('Erreur de mise à jour:', error);
        this.notificationService.error(
          'Erreur',
          'Impossible de mettre à jour vos informations. Veuillez réessayer.'
        );
      } finally {
        this.isUpdatingPersonal = false;
      }
    }, 1000);
  }

  /**
   * Changement de mot de passe - Critère US-003
   */
  updatePassword(): void {
    if (this.passwordForm.invalid) {
      return;
    }

    this.isUpdatingPassword = true;
    const formData = this.passwordForm.value;

    // Simuler la vérification et la mise à jour
    setTimeout(() => {
      try {
        // Vérifier le mot de passe actuel (simulation)
        const storedCredentials = this.getStoredCredentials();
        const userCredentials = storedCredentials.find(c => c.email === this.currentUser?.email);

        if (!userCredentials || userCredentials.password !== formData.currentPassword) {
          this.notificationService.error(
            'Erreur',
            'Le mot de passe actuel est incorrect.'
          );
          this.isUpdatingPassword = false;
          return;
        }

        // Mettre à jour le mot de passe
        userCredentials.password = formData.newPassword;
        localStorage.setItem('app_credentials', JSON.stringify(storedCredentials));

        // Réinitialiser le formulaire
        this.passwordForm.reset();

        this.notificationService.success(
          'Mot de passe modifié',
          'Votre mot de passe a été changé avec succès.'
        );

      } catch (error) {
        console.error('Erreur de changement de mot de passe:', error);
        this.notificationService.error(
          'Erreur',
          'Impossible de changer le mot de passe. Veuillez réessayer.'
        );
      } finally {
        this.isUpdatingPassword = false;
      }
    }, 1000);
  }

  /**
   * Mise à jour des préférences de notification - Critère US-003
   */
  updateNotifications(): void {
    this.isUpdatingNotifications = true;
    const preferences: NotificationPreferences = this.notificationForm.value;

    // Simuler la sauvegarde
    setTimeout(() => {
      try {
        this.saveNotificationPreferences(preferences);

        this.notificationService.success(
          'Préférences sauvegardées',
          'Vos préférences de notification ont été mises à jour.'
        );

      } catch (error) {
        console.error('Erreur de sauvegarde des préférences:', error);
        this.notificationService.error(
          'Erreur',
          'Impossible de sauvegarder vos préférences. Veuillez réessayer.'
        );
      } finally {
        this.isUpdatingNotifications = false;
      }
    }, 500);
  }

  /**
   * Suppression du compte - Critère US-003
   */
  deleteAccount(): void {
    if (this.deleteAccountForm.invalid || !this.currentUser) {
      return;
    }

    const formData = this.deleteAccountForm.value;

    // Vérifications de sécurité
    if (formData.confirmEmail !== this.currentUser.email) {
      this.notificationService.error(
        'Email incorrect',
        'L\'email de confirmation ne correspond pas à votre email.'
      );
      return;
    }

    this.isDeletingAccount = true;

    // Simuler la suppression
    setTimeout(() => {
      try {
        // Vérifier le mot de passe
        const storedCredentials = this.getStoredCredentials();
        const userCredentials = storedCredentials.find(c => c.email === this.currentUser?.email);

        if (!userCredentials || userCredentials.password !== formData.deletePassword) {
          this.notificationService.error(
            'Mot de passe incorrect',
            'Le mot de passe saisi est incorrect.'
          );
          this.isDeletingAccount = false;
          return;
        }

        // Supprimer toutes les données utilisateur
        this.deleteUserData();

        // Déconnecter l'utilisateur
        this.authService.logout();

        this.notificationService.info(
          'Compte supprimé',
          'Votre compte a été supprimé définitivement. Au revoir !'
        );

        // Rediriger vers la page d'accueil
        this.router.navigate(['/']);

      } catch (error) {
        console.error('Erreur de suppression:', error);
        this.notificationService.error(
          'Erreur',
          'Impossible de supprimer le compte. Veuillez contacter le support.'
        );
        this.isDeletingAccount = false;
      }
    }, 2000);
  }

  /**
   * Réinitialisation des formulaires
   */
  resetPersonalInfo(): void {
    if (this.currentUser) {
      this.populatePersonalInfoForm(this.currentUser);
    }
  }

  resetPasswordForm(): void {
    this.passwordForm.reset();
  }

  resetNotificationForm(): void {
    this.loadNotificationPreferences();
  }

  resetDeleteForm(): void {
    this.deleteAccountForm.reset();
  }

  /**
   * Utilitaires d'affichage
   */
  getUserInitials(): string {
    if (!this.currentUser) return '??';
    
    const firstInitial = this.currentUser.firstName?.charAt(0).toUpperCase() || '';
    const lastInitial = this.currentUser.lastName?.charAt(0).toUpperCase() || '';
    
    return firstInitial + lastInitial;
  }

  getRoleDisplayName(): string {
    switch (this.currentUser?.role) {
      case 'Admin':
        return 'Administrateur';
      case 'Organizer':
        return 'Organisateur';
      default:
        return 'Utilisateur';
    }
  }

  formatJoinDate(): string {
    if (!this.currentUser?.createdAt) return 'Inconnue';
    
    const date = new Date(this.currentUser.createdAt);
    return date.toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long'
    });
  }

  /**
   * Méthodes privées pour la gestion des données
   */
  private updateUserInStorage(updatedUser: User): void {
    const users = this.getStoredUsers();
    const index = users.findIndex(u => u.id === updatedUser.id);
    
    if (index !== -1) {
      users[index] = updatedUser;
      localStorage.setItem('app_users', JSON.stringify(users));
    }
  }

  private deleteUserData(): void {
    if (!this.currentUser) return;

    // Supprimer l'utilisateur de la liste
    const users = this.getStoredUsers();
    const filteredUsers = users.filter(u => u.id !== this.currentUser!.id);
    localStorage.setItem('app_users', JSON.stringify(filteredUsers));

    // Supprimer les credentials
    const credentials = this.getStoredCredentials();
    const filteredCredentials = credentials.filter(c => c.email !== this.currentUser!.email);
    localStorage.setItem('app_credentials', JSON.stringify(filteredCredentials));

    // Supprimer les préférences de notification
    localStorage.removeItem(`notification_prefs_${this.currentUser.id}`);

    // Supprimer autres données liées (événements, photos, etc.)
    // En production, cela serait géré par l'API backend
  }

  private getStoredUsers(): User[] {
    const usersStr = localStorage.getItem('app_users');
    return usersStr ? JSON.parse(usersStr) : [];
  }

  private getStoredCredentials(): Array<{email: string, password: string}> {
    const credsStr = localStorage.getItem('app_credentials');
    return credsStr ? JSON.parse(credsStr) : [];
  }
}
