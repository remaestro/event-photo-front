import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';

interface EventData {
  id: string;
  name: string;
  date: string;
  time: string;
  location: string;
  description: string;
  visibility: 'public' | 'private';
  maxPhotos?: number;
  allowGuestUploads: boolean;
  requireApproval: boolean;
  watermarkPhotos: boolean;
}

@Component({
  selector: 'app-edit-event',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './edit-event.component.html',
  styleUrl: './edit-event.component.css'
})
export class EditEventComponent implements OnInit {
  eventForm: FormGroup;
  eventId: string = '';
  isLoading = true;
  isSaving = false;
  originalEventData: EventData | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private fb: FormBuilder
  ) {
    this.eventForm = this.createForm();
  }

  ngOnInit(): void {
    this.eventId = this.route.snapshot.params['id'];
    this.loadEventData();
  }

  private createForm(): FormGroup {
    return this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      date: ['', Validators.required],
      time: ['', Validators.required],
      location: ['', [Validators.required, Validators.minLength(3)]],
      description: ['', [Validators.required, Validators.minLength(10)]],
      visibility: ['public', Validators.required],
      maxPhotos: [null],
      allowGuestUploads: [true],
      requireApproval: [true],
      watermarkPhotos: [false]
    });
  }

  private loadEventData(): void {
    // Simuler le chargement des données depuis l'API
    setTimeout(() => {
      // Dans la vraie vie, ceci viendrait d'un service
      const mockEventData: EventData = {
        id: this.eventId,
        name: 'Mariage Sophie & Marc',
        date: '2025-07-15',
        time: '14:30',
        location: 'Château de Versailles',
        description: 'Cérémonie de mariage dans un cadre exceptionnel avec cocktail et réception',
        visibility: 'private',
        maxPhotos: 500,
        allowGuestUploads: true,
        requireApproval: true,
        watermarkPhotos: false
      };

      this.originalEventData = mockEventData;
      this.populateForm(mockEventData);
      this.isLoading = false;
    }, 1000);
  }

  private populateForm(eventData: EventData): void {
    this.eventForm.patchValue({
      name: eventData.name,
      date: eventData.date,
      time: eventData.time,
      location: eventData.location,
      description: eventData.description,
      visibility: eventData.visibility,
      maxPhotos: eventData.maxPhotos,
      allowGuestUploads: eventData.allowGuestUploads,
      requireApproval: eventData.requireApproval,
      watermarkPhotos: eventData.watermarkPhotos
    });
  }

  onSubmit(): void {
    if (this.eventForm.valid) {
      this.isSaving = true;
      
      const updatedData = {
        ...this.originalEventData,
        ...this.eventForm.value
      };

      // Simuler la sauvegarde
      setTimeout(() => {
        
        this.isSaving = false;
        
        // Afficher un message de succès
        alert('Événement mis à jour avec succès !');
        
        // Retourner à la liste des événements
        this.router.navigate(['/admin/events']);
      }, 1500);
    } else {
      this.markFormGroupTouched();
    }
  }

  onCancel(): void {
    if (this.hasUnsavedChanges()) {
      if (confirm('Vous avez des modifications non sauvegardées. Voulez-vous vraiment quitter ?')) {
        this.router.navigate(['/admin/events']);
      }
    } else {
      this.router.navigate(['/admin/events']);
    }
  }

  private hasUnsavedChanges(): boolean {
    if (!this.originalEventData) return false;
    
    const currentValues = this.eventForm.value;
    return Object.keys(currentValues).some(key => {
      return currentValues[key] !== (this.originalEventData as any)[key];
    });
  }

  private markFormGroupTouched(): void {
    Object.keys(this.eventForm.controls).forEach(key => {
      const control = this.eventForm.get(key);
      control?.markAsTouched();
    });
  }

  getFieldError(fieldName: string): string {
    const field = this.eventForm.get(fieldName);
    if (field?.errors && field.touched) {
      if (field.errors['required']) {
        return 'Ce champ est obligatoire';
      }
      if (field.errors['minlength']) {
        return `Minimum ${field.errors['minlength'].requiredLength} caractères`;
      }
    }
    return '';
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.eventForm.get(fieldName);
    return !!(field?.invalid && field.touched);
  }
}