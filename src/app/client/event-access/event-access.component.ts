import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-event-access',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './event-access.component.html',
  styleUrl: './event-access.component.css'
})
export class EventAccessComponent {
  eventCode: string = '';
  isLoading: boolean = false;
  errorMessage: string = '';
  successMessage: string = '';

  constructor(
    private router: Router,
    private http: HttpClient
  ) {}

  async onSubmitCode() {
    if (!this.eventCode.trim()) {
      this.errorMessage = 'Veuillez saisir un code d\'événement';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    try {
      // Vérifier si l'événement existe avec ce code
      const response = await this.http.get<any>(`${environment.apiUrl}/api/events/public/${this.eventCode.trim()}`).toPromise();
      
      if (response) {
        this.successMessage = `Événement trouvé: ${response.title}`;
        // Rediriger vers les photos de l'événement après un court délai
        setTimeout(() => {
          this.router.navigate(['/event', this.eventCode.trim(), 'photos']);
        }, 1000);
      }
    } catch (error: any) {
      console.error('Error verifying event code:', error);
      if (error.status === 404) {
        this.errorMessage = 'Code d\'événement introuvable. Vérifiez le code et réessayez.';
      } else {
        this.errorMessage = 'Erreur lors de la vérification du code. Veuillez réessayer.';
      }
    } finally {
      this.isLoading = false;
    }
  }

  onInputChange() {
    // Nettoyer les messages d'erreur quand l'utilisateur tape
    this.errorMessage = '';
    this.successMessage = '';
    // Forcer en majuscules pour les codes d'événement
    this.eventCode = this.eventCode.toUpperCase();
  }

  goBack() {
    this.router.navigate(['/']);
  }
}
