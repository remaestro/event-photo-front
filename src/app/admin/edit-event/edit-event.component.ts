import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface Event {
  id: string;
  name: string;
  description: string;
  date: string;
  time: string;
  location: string;
  address: string;
  visibility: 'public' | 'private';
  maxParticipants: number;
  eventCode: string;
  organizerName: string;
  organizerEmail: string;
  organizerPhone: string;
  status: string;
  category: string;
  tags: string[];
  pricePerPhoto: number;
  allowDownload: boolean;
  watermark: boolean;
  beneficiaries: string[];
}

@Component({
  selector: 'app-edit-event',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './edit-event.component.html',
  styleUrls: ['./edit-event.component.css']
})
export class EditEventComponent implements OnInit {
  event: Event = {
    id: '',
    name: '',
    description: '',
    date: '',
    time: '',
    location: '',
    address: '',
    visibility: 'public',
    maxParticipants: 0,
    eventCode: '',
    organizerName: '',
    organizerEmail: '',
    organizerPhone: '',
    status: '',
    category: '',
    tags: [],
    pricePerPhoto: 0,
    allowDownload: true,
    watermark: true,
    beneficiaries: []
  };

  isLoading = true;
  isSaving = false;
  categories = ['Mariage', 'Anniversaire', 'Corporatif', 'Sport', 'Concert', 'Autre'];

  constructor(
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadEvent();
  }

  loadEvent() {
    const eventId = this.route.snapshot.paramMap.get('id');
    if (!eventId) {
      this.router.navigate(['/admin/events']);
      return;
    }

    // Simulation du chargement des données de l'événement
    // Dans une vraie application, vous feriez un appel API ici
    setTimeout(() => {
      this.event = this.getMockEvent(eventId);
      this.isLoading = false;
    }, 1000);
  }

  getMockEvent(id: string): Event {
    // Données simulées - remplacez par un appel API réel
    return {
      id: id,
      name: 'Mariage de Marie et Pierre',
      description: 'Célébration du mariage de Marie et Pierre dans un cadre magnifique.',
      date: '2025-08-15',
      time: '14:30',
      location: 'Château de Versailles',
      address: 'Place d\'Armes, 78000 Versailles',
      visibility: 'private',
      maxParticipants: 150,
      eventCode: 'MAR2025',
      organizerName: 'Marie Dupont',
      organizerEmail: 'marie.dupont@email.com',
      organizerPhone: '+33 6 12 34 56 78',
      status: 'active',
      category: 'Mariage',
      tags: ['mariage', 'château', 'élégant'],
      pricePerPhoto: 3.50,
      allowDownload: true,
      watermark: true,
      beneficiaries: ['Association des Enfants']
    };
  }

  onTagInput(event: any) {
    const value = event.target.value;
    if (value.includes(',')) {
      const newTags = value.split(',').map((tag: string) => tag.trim()).filter((tag: string) => tag);
      this.event.tags = [...new Set([...this.event.tags, ...newTags])];
      event.target.value = '';
    }
  }

  removeTag(index: number) {
    this.event.tags.splice(index, 1);
  }

  onBeneficiaryInput(event: any) {
    const value = event.target.value;
    if (value.includes(',')) {
      const newBeneficiaries = value.split(',').map((b: string) => b.trim()).filter((b: string) => b);
      this.event.beneficiaries = [...new Set([...this.event.beneficiaries, ...newBeneficiaries])];
      event.target.value = '';
    }
  }

  removeBeneficiary(index: number) {
    this.event.beneficiaries.splice(index, 1);
  }

  onSubmit() {
    if (!this.isValidForm()) {
      return;
    }

    this.isSaving = true;

    // Simulation de la sauvegarde
    // Dans une vraie application, vous feriez un appel API PUT/PATCH ici
    setTimeout(() => {
      console.log('Événement mis à jour:', this.event);
      this.isSaving = false;
      
      // Afficher un message de succès (vous pouvez utiliser un service de notification)
      alert('Événement mis à jour avec succès !');
      
      // Rediriger vers la liste des événements
      this.router.navigate(['/admin/events']);
    }, 2000);
  }

  isValidForm(): boolean {
    return !!(
      this.event.name?.trim() &&
      this.event.date &&
      this.event.time &&
      this.event.location?.trim() &&
      this.event.organizerName?.trim() &&
      this.event.organizerEmail?.trim()
    );
  }

  cancel() {
    if (confirm('Êtes-vous sûr de vouloir annuler ? Les modifications non sauvegardées seront perdues.')) {
      this.router.navigate(['/admin/events']);
    }
  }

  formatDateForInput(dateString: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toISOString().split('T')[0];
  }
}