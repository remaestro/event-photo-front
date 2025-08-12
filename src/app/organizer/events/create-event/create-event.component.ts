import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule, FormBuilder, FormGroup, FormArray, Validators, AbstractControl } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { EventsDataService, CreateEventRequest, Event } from '../../../shared/services/events-data.service';
import { AuthService } from '../../../shared/services/auth.service';
import { InvitationService, InvitationRequest } from '../../../shared/services/invitation.service';

export interface Beneficiary {
  email: string;
  percentage: number;
  status: string;
}

@Component({
  selector: 'app-create-event',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './create-event.component.html',
  styleUrls: ['./create-event.component.css']
})
export class CreateEventComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  eventForm!: FormGroup;
  isLoading = false;
  isSubmitting = false;
  duplicateEventId: string | null = null;
  editEventId: string | null = null;
  isEditMode = false;
  
  // Tag management
  currentTag = '';
  showTagSuggestions = false;
  suggestedTags = [
    'mariage', 'anniversaire', 'baptême', 'communion', 'concert', 'festival',
    'soirée', 'entreprise', 'conférence', 'séminaire', 'diplôme', 'remise-prix',
    'sport', 'course', 'match', 'tournoi', 'exposition', 'vernissage',
    'théâtre', 'spectacle', 'défilé', 'fashion', 'beauté', 'mode',
    'famille', 'enfants', 'naissance', 'grossesse', 'couple', 'engagement'
  ];
  filteredTags: string[] = [];

  beneficiaries: Beneficiary[] = [];
  newBeneficiaryEmail = '';
  newBeneficiaryPercentage = 0;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private eventsDataService: EventsDataService,
    private authService: AuthService,
    private invitationService: InvitationService
  ) {
    this.initializeForm();
  }

  ngOnInit(): void {
    // Check if we're duplicating or editing an event
    this.duplicateEventId = this.route.snapshot.queryParams['duplicate'];
    
    // Support both query param (?edit=3) and route param (:id/edit)
    this.editEventId = this.route.snapshot.queryParams['edit'] || this.route.snapshot.params['id'];
    this.isEditMode = !!this.editEventId;
    
    if (this.duplicateEventId) {
      this.loadEventForDuplication(this.duplicateEventId);
    } else if (this.editEventId) {
      this.loadEventForEdit(this.editEventId);
    }

    // Set minimum date to today (only for new events, not edits)
    if (!this.isEditMode) {
      const today = new Date().toISOString().split('T')[0];
      const dateInput = document.querySelector('input[type="date"]') as HTMLInputElement;
      if (dateInput) {
        dateInput.min = today;
      }
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeForm(): void {
    this.eventForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
      description: ['', [Validators.required, Validators.minLength(10)]],
      date: ['', [Validators.required, this.futureDateValidator.bind(this)]],
      location: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(200)]],
      visibility: ['public', Validators.required],
      photoPrice: [5, [Validators.required, Validators.min(0.1)]],
      tags: this.fb.array([]),
      beneficiaries: this.fb.array([]),
      settings: this.fb.group({
        allowDownload: [true],
        allowShare: [true],
        requireApproval: [false],
        pricingTier: ['standard']
      })
    });
  }

  // Custom validator for future dates
  private futureDateValidator(control: AbstractControl): {[key: string]: any} | null {
    if (!control.value) return null;
    
    const selectedDate = new Date(control.value);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // In edit mode, allow past dates (don't force future dates for existing events)
    if (this.isEditMode) {
      return null;
    }
    
    return selectedDate >= today ? null : { pastDate: true };
  }

  // Form getters
  get tags(): FormArray {
    return this.eventForm.get('tags') as FormArray;
  }

  get beneficiariesFormArray(): FormArray {
    return this.eventForm.get('beneficiaries') as FormArray;
  }

  // Form validation helpers
  isFieldInvalid(fieldName: string): boolean {
    const field = this.eventForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  // Debug method to check form validity
  debugFormValidation(): void {
    console.log('=== FORM VALIDATION DEBUG ===');
    console.log('Form valid:', this.eventForm.valid);
    console.log('Form value:', this.eventForm.value);
    
    Object.keys(this.eventForm.controls).forEach(key => {
      const control = this.eventForm.get(key);
      if (control) {
        console.log(`${key}:`, {
          valid: control.valid,
          value: control.value,
          errors: control.errors
        });
        
        // Check FormArray controls (like beneficiaries)
        if (control instanceof FormArray) {
          control.controls.forEach((subControl, index) => {
            if (subControl instanceof FormGroup) {
              console.log(`  ${key}[${index}]:`, {
                valid: subControl.valid,
                value: subControl.value,
                errors: subControl.errors
              });
              
              Object.keys(subControl.controls).forEach(subKey => {
                const subField = subControl.get(subKey);
                if (subField && !subField.valid) {
                  console.log(`    ${key}[${index}].${subKey}:`, {
                    valid: subField.valid,
                    value: subField.value,
                    errors: subField.errors
                  });
                }
              });
            }
          });
        }
      }
    });
    console.log('=== END DEBUG ===');
  }

  getFieldError(fieldName: string): string {
    const field = this.eventForm.get(fieldName);
    if (!field || !field.errors) return '';

    const errors = field.errors;
    
    if (errors['required']) return `${this.getFieldLabel(fieldName)} est requis`;
    if (errors['minlength']) return `${this.getFieldLabel(fieldName)} doit contenir au moins ${errors['minlength'].requiredLength} caractères`;
    if (errors['maxlength']) return `${this.getFieldLabel(fieldName)} ne peut pas dépasser ${errors['maxlength'].requiredLength} caractères`;
    if (errors['min']) return `Le prix minimum est de ${errors['min'].min}€`;
    if (errors['max']) return `Le prix maximum est de ${errors['max'].max}€`;
    if (errors['pastDate']) return 'La date doit être dans le futur';
    if (errors['email']) return 'Format d\'email invalide';
    
    return 'Champ invalide';
  }

  private getFieldLabel(fieldName: string): string {
    const labels: {[key: string]: string} = {
      'name': 'Le nom',
      'date': 'La date',
      'location': 'Le lieu',
      'description': 'La description',
      'photoPrice': 'Le prix'
    };
    return labels[fieldName] || 'Ce champ';
  }

  // Tag management
  onTagInputChange(event: any): void {
    const target = event.target as HTMLInputElement;
    const value = target?.value || '';
    this.currentTag = value;
    if (value.trim().length > 0) {
      this.filteredTags = this.suggestedTags
        .filter(tag => 
          tag.toLowerCase().includes(value.toLowerCase()) &&
          !this.tags.controls.some(control => control.value.toLowerCase() === tag.toLowerCase())
        )
        .slice(0, 10);
      this.showTagSuggestions = this.filteredTags.length > 0;
    } else {
      this.showTagSuggestions = false;
    }
  }

  onTagKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      event.preventDefault();
      this.addTag();
    } else if (event.key === 'Escape') {
      this.showTagSuggestions = false;
    }
  }

  addTag(tag?: string): void {
    const tagValue = tag || this.currentTag.trim().toLowerCase();
    
    if (!tagValue) return;
    
    // Check if tag already exists
    const existingTag = this.tags.controls.find(control => 
      control.value.toLowerCase() === tagValue.toLowerCase()
    );
    
    if (existingTag) return;
    
    this.tags.push(this.fb.control(tagValue));
    this.currentTag = '';
    this.showTagSuggestions = false;
  }

  selectSuggestedTag(tag: string): void {
    this.addTag(tag);
  }

  removeTag(index: number): void {
    this.tags.removeAt(index);
  }

  // Beneficiary management
  addBeneficiary(): void {
    if (!this.newBeneficiaryEmail || this.newBeneficiaryPercentage <= 0) return;
    
    // Check if email already exists in FormArray
    const exists = this.beneficiariesFormArray.controls.some(control => 
      control.get('email')?.value === this.newBeneficiaryEmail
    );
    if (exists) {
      alert('Cet email est déjà ajouté comme bénéficiaire');
      return;
    }
    
    // Check if total percentage would exceed 100
    const currentTotal = this.getTotalBeneficiaryPercentage();
    if (currentTotal + this.newBeneficiaryPercentage > 100) {
      alert(`Le pourcentage total ne peut pas dépasser 100%. Actuellement: ${currentTotal}%, tentative d'ajout: ${this.newBeneficiaryPercentage}%`);
      return;
    }
    
    // Generate a default name from email
    const defaultName = this.newBeneficiaryEmail.split('@')[0];
    
    // Add to FormArray
    const beneficiaryGroup = this.fb.group({
      name: [defaultName, Validators.required],
      email: [this.newBeneficiaryEmail, [Validators.required, Validators.email]],
      percentage: [this.newBeneficiaryPercentage, [Validators.required, Validators.min(1), Validators.max(90)]]
    });
    
    this.beneficiariesFormArray.push(beneficiaryGroup);
    
    // Reset form
    this.newBeneficiaryEmail = '';
    this.newBeneficiaryPercentage = 0;
    
    // Show success message
    console.log('Bénéficiaire ajouté avec succès');
  }

  removeBeneficiary(index: number): void {
    this.beneficiariesFormArray.removeAt(index);
  }

  // Beneficiary percentage calculations
  getTotalBeneficiaryPercentage(): number {
    return this.beneficiariesFormArray.controls.reduce((sum, control) => {
      const percentage = control.get('percentage')?.value || 0;
      return sum + percentage;
    }, 0);
  }

  getRemainingPercentage(): number {
    return 100 - this.getTotalBeneficiaryPercentage();
  }

  private loadEventForDuplication(eventId: string): void {
    this.isLoading = true;
    this.eventsDataService.getEvent(eventId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (event) => {
          if (event) {
            const duplicatedEventData = {
              name: `${event.name} (copie)`,
              description: event.description,
              date: '',
              location: event.location,
              photoPrice: event.photoPrice,
              tags: event.tags || [],
              settings: event.settings || {
                allowDownload: true,
                allowShare: true,
                requireApproval: false,
                pricingTier: 'standard'
              }
            };
            
            this.populateForm(duplicatedEventData);
            // Note: Don't copy beneficiaries for duplicated events
            this.beneficiaries = [];
          }
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error loading event for duplication:', error);
          this.isLoading = false;
        }
      });
  }

  private loadEventForEdit(eventId: string): void {
    this.isLoading = true;
    this.eventsDataService.getEvent(eventId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (event) => {
          if (event) {
            this.populateForm(event);
            // For edit mode, load existing beneficiaries if available
            this.beneficiaries = [];
          }
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error loading event for edit:', error);
          this.isLoading = false;
        }
      });
  }

  private populateForm(event: any): void {
    // Clear existing tags
    while (this.tags.length !== 0) {
      this.tags.removeAt(0);
    }
    
    // Add tags
    if (event.tags) {
      event.tags.forEach((tag: string) => {
        this.tags.push(this.fb.control(tag));
      });
    }
    
    // Format date for input (YYYY-MM-DD)
    let formattedDate = '';
    if (event.date) {
      const date = new Date(event.date);
      formattedDate = date.toISOString().split('T')[0];
    }
    
    this.eventForm.patchValue({
      name: event.name,
      description: event.description,
      date: formattedDate,
      location: event.location,
      visibility: event.visibility || 'public',
      photoPrice: event.photoPrice,
      settings: event.settings || {
        allowDownload: true,
        allowShare: true,
        requireApproval: false,
        pricingTier: 'standard'
      }
    });

    // Re-validate the date field now that isEditMode is set
    if (this.isEditMode) {
      const dateControl = this.eventForm.get('date');
      if (dateControl) {
        dateControl.updateValueAndValidity();
      }
    }
  }

  // Form submission
  onSubmit(): void {
    if (this.eventForm.valid) {
      this.isSubmitting = true;
      
      const formValue = this.eventForm.value;
      const currentUser = this.authService.getCurrentUser();
      
      const createRequest: CreateEventRequest = {
        name: formValue.name,
        description: formValue.description,
        location: formValue.location,
        date: formValue.date,
        organizerId: currentUser?.id || '',
        photoPrice: formValue.photoPrice || 0,
        settings: formValue.settings || {
          allowDownload: true,
          allowShare: true,
          requireApproval: false,
          pricingTier: 'standard'
        },
        tags: formValue.tags || [],
        beneficiaries: formValue.beneficiaries?.map((b: any) => ({
          email: b.email,
          percentage: b.percentage,
          status: 'pending'
        })) || []
      };

      if (this.isEditMode && this.editEventId) {
        // Update existing event
        this.eventsDataService.updateEvent(this.editEventId, createRequest)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: (response) => {
              console.log('Event updated successfully:', response);
              this.router.navigate(['/organizer/events']);
            },
            error: (error) => {
              console.error('Error updating event:', error);
              this.isSubmitting = false;
            }
          });
      } else {
        // Create new event
        this.eventsDataService.createEvent(createRequest)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: (response) => {
              console.log('Event created successfully:', response);
              
              // 🎯 ENVOI DES INVITATIONS PAR EMAIL
              if (formValue.beneficiaries && formValue.beneficiaries.length > 0) {
                this.sendInvitationsToeBeneficiaries(response.id, formValue.beneficiaries);
              } else {
                // Pas de bénéficiaires, aller directement à la liste des événements
                this.router.navigate(['/organizer/events']);
                this.isSubmitting = false;
              }
            },
            error: (error) => {
              console.error('Error creating event:', error);
              this.isSubmitting = false;
            }
          });
      }
    } else {
      this.markFormGroupTouched(this.eventForm);
    }
  }

  /**
   * 📧 Envoyer les invitations par email aux bénéficiaires
   */
  private sendInvitationsToeBeneficiaries(eventId: string, beneficiaries: any[]): void {
    const invitationRequest: InvitationRequest = {
      eventId: eventId,
      beneficiaries: beneficiaries.map(b => ({
        email: b.email,
        name: b.name || b.email.split('@')[0],
        percentage: b.percentage
      }))
    };

    console.log('Envoi des invitations...', invitationRequest);

    this.invitationService.sendInvitations(invitationRequest)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          console.log('Invitations envoyées:', response);
          
          if (response.success) {
            // Afficher un message de succès détaillé
            let message = `✅ Événement créé avec succès!\n\n`;
            message += `📧 ${response.invitationsSent} invitation(s) envoyée(s) par email`;
            
            if (response.failedInvitations && response.failedInvitations.length > 0) {
              message += `\n\n⚠️ ${response.failedInvitations.length} invitation(s) échouée(s):`;
              response.failedInvitations.forEach(failed => {
                message += `\n• ${failed.email}: ${failed.error}`;
              });
            }
            
            message += `\n\nLes bénéficiaires recevront un email avec un lien pour créer leur compte et accepter l'invitation.`;
            
            alert(message);
          } else {
            alert(`⚠️ Événement créé mais erreur lors de l'envoi des invitations:\n${response.message}`);
          }
          
          // Rediriger vers la liste des événements
          this.router.navigate(['/organizer/events']);
          this.isSubmitting = false;
        },
        error: (error) => {
          console.error('Erreur lors de l\'envoi des invitations:', error);
          
          // Même si les invitations échouent, l'événement a été créé
          alert(`✅ Événement créé avec succès!\n\n❌ Mais erreur lors de l'envoi des invitations par email.\nVous pouvez renvoyer les invitations depuis la page de gestion des bénéficiaires.`);
          
          this.router.navigate(['/organizer/events']);
          this.isSubmitting = false;
        }
      });
  }

  onCancel(): void {
    this.router.navigate(['/organizer/events']);
  }

  previewEvent(): void {
    if (this.eventForm.valid) {
      // Store form data in session storage for preview
      const formData = {
        ...this.eventForm.value
      };
      sessionStorage.setItem('previewEventData', JSON.stringify(formData));
      
      // Navigate to preview (you would need to create this route/component)
      this.router.navigate(['/organizer/events/preview']);
    } else {
      this.markFormGroupTouched(this.eventForm);
    }
  }

  // UI Helper methods for dynamic content
  getPageTitle(): string {
    if (this.isEditMode) {
      return 'Modifier l\'événement';
    } else if (this.duplicateEventId) {
      return 'Dupliquer l\'événement';
    } else {
      return 'Créer un nouvel événement';
    }
  }

  getPageDescription(): string {
    if (this.isEditMode) {
      return 'Modifiez les informations de votre événement photo';
    } else if (this.duplicateEventId) {
      return 'Créez un nouvel événement basé sur un événement existant';
    } else {
      return 'Créez votre événement photo et commencez à vendre vos images';
    }
  }

  getSubmitButtonText(): string {
    if (this.isSubmitting) {
      if (this.isEditMode) {
        return 'Modification...';
      } else {
        return 'Création...';
      }
    } else {
      if (this.isEditMode) {
        return 'Modifier l\'événement';
      } else {
        return 'Créer l\'événement';
      }
    }
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();

      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }
}
