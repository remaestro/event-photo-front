import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Subject, takeUntil, interval } from 'rxjs';
import { AuthService, User } from '../../services/auth.service';
import { NotificationService } from '../../services/notification.service';

@Component({
  selector: 'app-session-status',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './session-status.component.html',
  styleUrl: './session-status.component.css'
})
export class SessionStatusComponent implements OnInit, OnDestroy {
  isAuthenticated = false;
  currentUser: User | null = null;
  sessionInfo: { isValid: boolean; hoursRemaining: number; lastLogin?: Date | undefined } = { 
    isValid: false, 
    hoursRemaining: 0, 
    lastLogin: undefined 
  };
  showDetails = false;
  isRenewing = false;
  
  private destroy$ = new Subject<void>();

  constructor(
    private authService: AuthService,
    private notificationService: NotificationService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // S'abonner aux changements d'authentification
    this.authService.isAuthenticated$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(isAuth => {
      this.isAuthenticated = isAuth;
      this.updateSessionInfo();
    });

    // S'abonner aux changements d'utilisateur
    this.authService.currentUser$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(user => {
      this.currentUser = user;
      this.updateSessionInfo();
    });

    // Mettre à jour les informations de session toutes les minutes
    interval(60000).pipe(
      takeUntil(this.destroy$)
    ).subscribe(() => {
      if (this.isAuthenticated) {
        this.updateSessionInfo();
      }
    });

    // Mise à jour initiale
    this.updateSessionInfo();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private updateSessionInfo(): void {
    if (this.isAuthenticated) {
      this.sessionInfo = this.authService.getSessionInfo();
      
      // Notifier si la session expire bientôt (première fois seulement)
      if (this.sessionInfo.hoursRemaining <= 1 && this.sessionInfo.hoursRemaining > 0.9) {
        this.notificationService.warning(
          'Session expirante',
          'Votre session expire dans moins d\'une heure. Pensez à la renouveler.'
        );
      }
    }
  }

  toggleDetails(): void {
    this.showDetails = !this.showDetails;
  }

  renewSession(): void {
    this.isRenewing = true;
    
    this.authService.renewSession().subscribe({
      next: (response) => {
        this.isRenewing = false;
        
        if (response.success) {
          this.notificationService.success(
            'Session renouvelée',
            'Votre session a été prolongée de 24 heures.'
          );
          this.updateSessionInfo();
        } else {
          this.notificationService.error(
            'Erreur de renouvellement',
            response.message
          );
        }
      },
      error: (error) => {
        this.isRenewing = false;
        console.error('Session renewal error:', error);
        this.notificationService.error(
          'Erreur technique',
          'Impossible de renouveler la session. Veuillez vous reconnecter.'
        );
      }
    });
  }

  logout(): void {
    this.authService.logout();
    this.notificationService.info(
      'Déconnexion',
      'Vous avez été déconnecté avec succès.'
    );
    this.router.navigate(['/']);
  }

  formatTimeRemaining(hours: number): string {
    if (hours >= 1) {
      const h = Math.floor(hours);
      const m = Math.round((hours - h) * 60);
      return m > 0 ? `${h}h ${m}min` : `${h}h`;
    } else {
      const minutes = Math.round(hours * 60);
      return `${minutes}min`;
    }
  }

  formatLastLogin(): string {
    if (!this.sessionInfo.lastLogin) return 'Inconnue';
    
    const now = new Date();
    const login = new Date(this.sessionInfo.lastLogin);
    const diffMs = now.getTime() - login.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);
    
    if (diffHours < 1) {
      const minutes = Math.round(diffMs / (1000 * 60));
      return `Il y a ${minutes} min`; 
    } else if (diffHours < 24) {
      const hours = Math.floor(diffHours);
      return `Il y a ${hours}h`;
    } else {
      return login.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  }

  getProgressPercentage(): number {
    return Math.max(0, (this.sessionInfo.hoursRemaining / 24) * 100);
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
}
