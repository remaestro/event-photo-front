import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { GuestListService, Guest, GuestList, AddGuestRequest } from '../../shared/services/guest-list.service';
import { EventService } from '../../shared/services/event.service';
import { NotificationService } from '../../shared/services/notification.service';
import { environment } from '../../../environments/environment'; // 🆕 Import environment

@Component({
  selector: 'app-guest-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './guest-list.component.html',
  styleUrl: './guest-list.component.css'
})
export class GuestListComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  eventId: number = 0;
  eventName: string = '';
  guestList: GuestList | null = null;
  isLoading = true;
  
  // Mode d'ajout : 'manual' ou 'qrcode'
  addMode: 'manual' | 'qrcode' = 'manual';
  showAddModal = false;
  
  // Formulaire d'ajout manuel
  newGuest: AddGuestRequest = {
    eventId: 0, // Changed to number
    name: '',
    email: '',
    phone: '',
    whatsApp: ''
  };
  
  // QR Code
  qrCodeUrl: string = '';
  selfRegisterUrl: string = ''; // 🆕 Pour afficher l'URL générée
  showQRCodeModal = false;
  
  // Sélection multiple pour envoi en masse
  selectedGuests: Set<number> = new Set();
  selectAll = false;
  
  // Méthode d'envoi
  sendMethod: 'Email' | 'SMS' | 'WhatsApp' = 'Email';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private guestListService: GuestListService,
    private eventService: EventService,
    private notificationService: NotificationService
  ) {}

  ngOnInit() {
    const eventIdParam = this.route.snapshot.paramMap.get('eventId');
    this.eventId = eventIdParam ? parseInt(eventIdParam, 10) : 0;
    
    if (!this.eventId) {
      this.notificationService.error('Erreur', 'ID d\'événement manquant');
      this.router.navigate(['/organizer/events']);
      return;
    }
    
    this.loadGuestList();
    this.loadEventInfo();
    
    // 🔔 S'abonner aux changements en temps réel de la liste d'invités
    this.guestListService.guestList$
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (guestList) => {
          if (guestList && guestList.eventId === this.eventId) {
            this.guestList = guestList;
            this.updateSelectAllState();
          }
        }
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadEventInfo() {
    this.eventService.getEventById(this.eventId.toString())
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (event) => {
          if (event) {
            this.eventName = event.name;
          }
        },
        error: (error) => {
          console.error('Error loading event:', error);
        }
      });
  }

  private loadGuestList() {
    this.isLoading = true;
    console.log('🔄 [GuestListComponent] Loading guest list for event:', this.eventId);
    
    this.guestListService.getGuestList(this.eventId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (guestList) => {
          console.log('📦 [GuestListComponent] Received guest list:', guestList);
          console.log('👥 [GuestListComponent] Guests array:', guestList?.guests);
          console.log('🔢 [GuestListComponent] Number of guests:', guestList?.guests?.length || 0);
          
          if (guestList) {
            this.guestList = guestList;
            console.log('✅ [GuestListComponent] Guest list assigned to component');
          } else {
            console.warn('⚠️ [GuestListComponent] Guest list is null, creating new one');
            // Créer une nouvelle liste si elle n'existe pas
            this.createNewGuestList();
          }
          this.isLoading = false;
        },
        error: (error) => {
          console.error('❌ [GuestListComponent] Error loading guest list:', error);
          this.notificationService.error('Erreur', 'Impossible de charger la liste d\'invités');
          this.isLoading = false;
        }
      });
  }

  private createNewGuestList() {
    this.guestListService.createGuestList(this.eventId, true, false)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (guestList) => {
          this.guestList = guestList;
          this.notificationService.success('Succès', 'Liste d\'invités créée');
        },
        error: (error) => {
          console.error('Error creating guest list:', error);
          this.notificationService.error('Erreur', 'Impossible de créer la liste');
        }
      });
  }

  // 🆕 Ouvrir le modal d'ajout manuel
  openAddModal() {
    this.addMode = 'manual';
    this.showAddModal = true;
    this.resetNewGuestForm();
  }

  // 🆕 Ouvrir le modal QR Code
  openQRCodeModal() {
    this.addMode = 'qrcode';
    this.generateQRCode();
    this.showQRCodeModal = true;
  }

  // 🆕 Fermer les modals
  closeAddModal() {
    this.showAddModal = false;
    this.resetNewGuestForm();
  }

  closeQRCodeModal() {
    this.showQRCodeModal = false;
  }

  // 🆕 Générer le QR Code pour l'auto-inscription
  private generateQRCode() {
    // Utiliser l'URL de l'environnement au lieu de window.location.origin
    const baseUrl = environment.frontendUrl || window.location.origin;
    const selfRegisterUrl = `${baseUrl}/guest/register/${this.eventId}`;
    
    // Debug: afficher l'URL générée dans la console et l'interface
    console.log('🔗 URL générée pour le QR code:', selfRegisterUrl);
    console.log('🌍 Base URL utilisée:', baseUrl);
    console.log('🏗️ Environment:', environment.production ? 'Production' : 'Development');
    
    // Utiliser une API de génération de QR code
    this.qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(selfRegisterUrl)}`;
    
    // Stocker l'URL pour l'afficher dans l'interface
    this.selfRegisterUrl = selfRegisterUrl;
  }

  // 🆕 Ajouter un invité manuellement
  addGuestManually() {
    if (!this.newGuest.name || (!this.newGuest.email && !this.newGuest.phone)) {
      this.notificationService.warning('Champs requis', 'Veuillez renseigner au moins le nom et un email ou téléphone');
      return;
    }

    this.newGuest.eventId = this.eventId;
    this.newGuest.addMethod = 'manual';
    
    this.guestListService.addGuest(this.newGuest)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (guest) => {
          this.notificationService.success('Succès', `${guest.name} a été ajouté à la liste`);
          this.closeAddModal();
        },
        error: (error) => {
          console.error('Error adding guest:', error);
          this.notificationService.error('Erreur', 'Impossible d\'ajouter l\'invité');
        }
      });
  }

  // 🆕 Supprimer un invité
  removeGuest(guest: Guest) {
    if (!confirm(`Voulez-vous vraiment retirer ${guest.name} de la liste ?`)) {
      return;
    }

    this.guestListService.removeGuest(this.eventId, guest.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (success) => {
          if (success) {
            this.notificationService.success('Succès', `${guest.name} a été retiré de la liste`);
          }
        },
        error: (error) => {
          console.error('Error removing guest:', error);
          this.notificationService.error('Erreur', 'Impossible de retirer l\'invité');
        }
      });
  }

  // 🆕 Envoyer une invitation individuelle
  sendInvitation(guest: Guest) {
    if (!guest.email && this.sendMethod === 'Email') {
      this.notificationService.warning('Email manquant', 'Cet invité n\'a pas d\'adresse email');
      return;
    }
    if (!guest.phone && (this.sendMethod === 'SMS' || this.sendMethod === 'WhatsApp')) {
      this.notificationService.warning('Téléphone manquant', 'Cet invité n\'a pas de numéro de téléphone');
      return;
    }

    this.guestListService.sendInvitation(this.eventId, guest.id, this.sendMethod)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (success) => {
          if (success) {
            this.notificationService.success('Envoyé', `Invitation envoyée à ${guest.name}`);
          }
        },
        error: (error) => {
          console.error('Error sending invitation:', error);
          this.notificationService.error('Erreur', 'Impossible d\'envoyer l\'invitation');
        }
      });
  }

  // 🆕 Envoyer des invitations en masse
  sendBulkInvitations() {
    if (this.selectedGuests.size === 0) {
      this.notificationService.warning('Aucune sélection', 'Veuillez sélectionner au moins un invité');
      return;
    }

    const guestIds = Array.from(this.selectedGuests);
    
    this.guestListService.sendBulkInvitations(this.eventId, guestIds, this.sendMethod)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result) => {
          this.notificationService.success('Envoyé', `${result.sentCount} invitation(s) envoyée(s)`);
          this.selectedGuests.clear();
          this.selectAll = false;
        },
        error: (error) => {
          console.error('Error sending bulk invitations:', error);
          this.notificationService.error('Erreur', 'Impossible d\'envoyer les invitations');
        }
      });
  }

  // 🆕 Sélection/désélection d'un invité
  toggleGuestSelection(guestId: number) {
    if (this.selectedGuests.has(guestId)) {
      this.selectedGuests.delete(guestId);
    } else {
      this.selectedGuests.add(guestId);
    }
    this.updateSelectAllState();
  }

  // 🆕 Sélectionner/désélectionner tous les invités
  toggleSelectAll() {
    this.selectAll = !this.selectAll;
    
    if (this.selectAll) {
      this.guestList?.guests.forEach(guest => {
        if (!guest.invitationSent) {
          this.selectedGuests.add(guest.id);
        }
      });
    } else {
      this.selectedGuests.clear();
    }
  }

  private updateSelectAllState() {
    const unsentGuests = this.guestList?.guests.filter(g => !g.invitationSent) || [];
    this.selectAll = unsentGuests.length > 0 && 
                     unsentGuests.every(g => this.selectedGuests.has(g.id));
  }

  // 🆕 Exporter la liste en CSV
  exportToCSV() {
    if (!this.guestList) return;

    this.guestListService.exportToCsv(this.eventId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (blob) => {
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `liste_invites_${this.eventName}_${new Date().toISOString().split('T')[0]}.csv`;
          link.click();
          window.URL.revokeObjectURL(url);
          this.notificationService.success('Exporté', 'Liste exportée en CSV');
        },
        error: (error) => {
          console.error('Error exporting CSV:', error);
          this.notificationService.error('Erreur', 'Impossible d\'exporter la liste');
        }
      });
  }

  // 🆕 Copier le lien d'accès
  copyAccessLink(guest: Guest) {
    const accessLink = this.guestListService.generateAccessLink(this.eventId, guest.accessToken);
    navigator.clipboard.writeText(accessLink).then(() => {
      this.notificationService.success('Copié', 'Lien d\'accès copié dans le presse-papier');
    });
  }

  private resetNewGuestForm() {
    this.newGuest = {
      eventId: this.eventId,
      name: '',
      email: '',
      phone: '',
      whatsApp: ''
    };
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  goBack() {
    this.router.navigate(['/organizer/events']);
  }
}
