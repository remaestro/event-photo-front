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
}
