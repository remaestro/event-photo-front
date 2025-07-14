import { Component } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { Location } from '@angular/common';

@Component({
  selector: 'app-event-detail',
  standalone: true,
  imports: [],
  templateUrl: './event-detail.component.html',
  styleUrl: './event-detail.component.css'
})
export class EventDetailComponent {
  eventId: string | null = null;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private location: Location
  ) {
    this.eventId = this.route.snapshot.paramMap.get('id');
  }

  goBack() {
    this.location.back();
  }

  startFacialScan() {
    if (this.eventId) {
      this.router.navigate(['/scan', this.eventId]);
    }
  }
}
