import { Component } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-role-selection',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './role-selection.component.html',
  styleUrl: './role-selection.component.css'
})
export class RoleSelectionComponent {
  constructor(private router: Router) {}

  selectRole(role: 'organizer' | 'admin') {
    // TODO: Stocker le rôle sélectionné
    console.log('Rôle sélectionné:', role);
    
    if (role === 'organizer') {
      // Rediriger vers l'inscription organisateur
      this.router.navigate(['/register'], { queryParams: { role: 'organizer' } });
    } else {
      // Rediriger vers l'inscription administrateur
      this.router.navigate(['/register'], { queryParams: { role: 'admin' } });
    }
  }
}
