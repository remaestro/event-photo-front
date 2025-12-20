import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { GuestListService, AddGuestRequest } from '../../shared/services/guest-list.service';
import { EventService } from '../../shared/services/event.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css'
})
export class RegisterComponent implements OnInit {
  eventId: number = 0; // Changed from string to number
  eventName: string = '';
  eventDate: string = '';
  eventLocation: string = '';
  isLoading = true;
  isSubmitting = false;
  registrationSuccess = false;
  errorMessage = '';

  guestData: AddGuestRequest = {
    eventId: 0, // Changed from string to number
    name: '',
    email: '',
    phone: '',
    whatsApp: '' // Fixed property name
  };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private guestListService: GuestListService,
    private eventService: EventService
  ) {}

  ngOnInit() {
    console.log('🚀 [RegisterComponent] Component initialized');
    console.log('📍 [URL] Current URL:', window.location.href);
    console.log('🌐 [URL] Origin:', window.location.origin);
    console.log('📱 [Device] User Agent:', navigator.userAgent);
    
    const eventIdParam = this.route.snapshot.paramMap.get('eventId');
    console.log('🔢 [EventID] Raw parameter:', eventIdParam);
    
    this.eventId = eventIdParam ? parseInt(eventIdParam, 10) : 0;
    console.log('🔢 [EventID] Parsed value:', this.eventId);
    
    if (!this.eventId) {
      console.error('❌ [ERROR] Event ID is missing or invalid');
      this.errorMessage = 'Événement introuvable';
      this.isLoading = false;
      return;
    }
    
    console.log('✅ [EventID] Valid event ID, loading event info...');
    this.loadEventInfo();
  }

  private loadEventInfo() {
    this.eventService.getEventById(this.eventId.toString()).subscribe({
      next: (event) => {
        if (event) {
          this.eventName = event.name;
          this.eventDate = new Date(event.date).toLocaleDateString('fr-FR', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
          });
          this.eventLocation = event.location;
        } else {
          this.errorMessage = 'Événement introuvable';
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading event:', error);
        this.errorMessage = 'Impossible de charger les informations de l\'événement';
        this.isLoading = false;
      }
    });
  }

  onSubmit() {
    // Validation
    if (!this.guestData.name || (!this.guestData.email && !this.guestData.phone)) {
      this.errorMessage = 'Veuillez renseigner au moins votre nom et un email ou téléphone';
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';
    this.guestData.eventId = this.eventId;
    this.guestData.addMethod = 'qrcode'; // Set the add method for QR code registration

    // 🔧 Utiliser addGuestViaQrCode au lieu de addGuest pour permettre l'accès public
    this.guestListService.addGuestViaQrCode(this.guestData).subscribe({
      next: (guest) => {
        console.log('Guest registered successfully:', guest);
        this.registrationSuccess = true;
        this.isSubmitting = false;
        
        // Rediriger vers une page de confirmation après 3 secondes
        setTimeout(() => {
          this.resetForm();
        }, 3000);
      },
      error: (error) => {
        console.error('Error registering guest:', error);
        this.errorMessage = 'Une erreur est survenue lors de votre inscription. Veuillez réessayer.';
        this.isSubmitting = false;
      }
    });
  }

  resetForm() {
    this.guestData = {
      eventId: this.eventId,
      name: '',
      email: '',
      phone: '',
      whatsApp: ''
    };
    this.registrationSuccess = false;
    this.errorMessage = '';
  }

  registerAnother() {
    this.resetForm();
  }
}
