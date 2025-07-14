import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-events',
  standalone: true,
  imports: [],
  templateUrl: './events.component.html',
  styleUrl: './events.component.css'
})
export class EventsComponent {
  constructor(private router: Router) {}

  goToEvent(eventId: string) {
    this.router.navigate(['/events', eventId]);
  }
}
