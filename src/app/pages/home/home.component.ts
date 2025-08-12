import { Component } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../shared/services/auth.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink, CommonModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent {
  constructor(
    private router: Router,
    private authService: AuthService
  ) {}

  goToEvent(eventId: string) {
    this.router.navigate(['/events', eventId, 'public']);
  }

  onCreateEventClick() {
    if (this.authService.isAuthenticated()) {
      const userRole = this.authService.getUserRole();
      console.log('userRole',userRole);
      
      if (userRole === 'Organizer' || userRole === 'Admin') {
        // Rediriger vers la page de création d'événement
        this.router.navigate(['/organizer/events/create']);
      } else {
        // Fallback vers l'inscription si le rôle n'est pas reconnu
        this.router.navigate(['/register']);
      }
    } else {
      // Utilisateur non connecté -> rediriger vers l'inscription
      this.router.navigate(['/register']);
    }
  }

  get isAuthenticated(): boolean {
    return this.authService.isAuthenticated();
  }

  get currentUser() {
    return this.authService.getCurrentUser();
  }

  /**
   * 🔧 DEBUG: Force real backend authentication
   */
  async debugBackendAuth() {
    console.log('🔧 DEBUG: Forcing real backend authentication...');
    
    try {
      // First, clear any existing mock auth
      this.authService.forceLogout();
      
      // Wait a moment
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Try to authenticate with real backend
      this.authService.loginToRealBackend().subscribe({
        next: (response) => {
          if (response.success) {
            console.log('✅ Real backend authentication successful!');
            console.log('🎫 Token type:', this.authService.getCurrentToken()?.startsWith('token_') ? 'MOCK' : 'REAL JWT');
            
            // Show success message
            alert('✅ Authentification backend réussie! Vous pouvez maintenant créer des événements.');
            
            // Refresh the page to update the UI
            window.location.reload();
          } else {
            console.log('❌ Backend authentication failed:', response.message);
            alert('❌ Échec de l\'authentification backend: ' + response.message);
          }
        },
        error: (error) => {
          console.error('🚨 Authentication error:', error);
          alert('🚨 Erreur d\'authentification. Vérifiez que le backend est démarré.');
        }
      });
    } catch (error) {
      console.error('🚨 Debug auth error:', error);
      alert('🚨 Erreur lors de l\'authentification debug.');
    }
  }
}
