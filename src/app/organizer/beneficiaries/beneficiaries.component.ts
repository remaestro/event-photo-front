import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { EventsDataService } from '../../shared/services/events-data.service';
import { BeneficiariesDataService } from '../../shared/services/beneficiaries-data.service';
import { InvitationService } from '../../shared/services/invitation.service';

interface Beneficiary {
  id: string;
  name: string;
  email: string;
  percentage: number;
  status: 'to_be_sent' | 'pending' | 'accepted' | 'declined';
  invitedDate: string;
  respondedDate?: string;
  totalEarnings: number;
}

interface Event {
  id: string;
  name: string;
  date: string;
  location: string;
  status: 'draft' | 'active' | 'completed';
  totalRevenue: number;
  beneficiaries: Beneficiary[];
}

interface BeneficiaryForm {
  name: string;
  email: string;
  percentage: number;
}

@Component({
  selector: 'app-beneficiaries',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './beneficiaries.component.html',
  styleUrl: './beneficiaries.component.css'
})
export class BeneficiariesComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  event: Event | null = null;
  eventId: string | null = null;
  beneficiaries: Beneficiary[] = [];
  isLoading = true;
  showAddForm = false;
  
  beneficiaryForm: BeneficiaryForm = {
    name: '',
    email: '',
    percentage: 0
  };

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private eventsDataService: EventsDataService,
    private beneficiariesDataService: BeneficiariesDataService,
    private invitationService: InvitationService
  ) {}

  ngOnInit() {
    this.route.paramMap.pipe(takeUntil(this.destroy$)).subscribe(params => {
      this.eventId = params.get('id');
      this.loadEventAndBeneficiaries();
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * 🔄 Charger l'événement et les bénéficiaires (méthode publique)
   */
  public loadEventAndBeneficiaries() {
    this.isLoading = true;
    // Si on a un eventId, on charge un événement spécifique
    // Sinon, on charge une vue globale de tous les bénéficiaires
    if (this.eventId) {
      this.loadSpecificEventBeneficiaries();
    } else {
      this.loadAllBeneficiaries();
    }
  }

  private loadSpecificEventBeneficiaries() {
    this.eventsDataService.getEvent(this.eventId!).pipe(takeUntil(this.destroy$)).subscribe({
      next: (event) => {
        if (event) {
          // Mapper les données de l'API vers notre interface locale
          this.event = {
            id: event.id,
            name: event.name || event.title || '',
            date: event.date,
            location: event.location,
            status: this.mapApiStatusToLocal(event.status),
            totalRevenue: event.stats?.totalRevenue || 0,
            beneficiaries: [] // Les bénéficiaires seront chargés séparément
          };

          // Charger les bénéficiaires de l'événement
          if (this.eventId) {
            this.loadEventBeneficiaries(this.eventId);
          }
        } else {
          console.error('Événement non trouvé');
          this.router.navigate(['/organizer/events']);
        }
      },
      error: (error) => {
        console.error('Erreur lors du chargement de l\'événement:', error);
        this.isLoading = false;
        // Fallback vers des données mockées en cas d'erreur API
        this.loadMockEventData();
      }
    });
  }

  private loadEventBeneficiaries(eventId: string) {
    this.beneficiariesDataService.getBeneficiaries(eventId).pipe(takeUntil(this.destroy$)).subscribe({
      next: (beneficiaries) => {
        // Mapper les données API vers notre interface locale
        this.beneficiaries = beneficiaries.map(b => ({
          id: b.id.toString(), // Convertir number en string pour l'interface locale
          name: b.firstName && b.lastName ? `${b.firstName} ${b.lastName}`.trim() : b.email.split('@')[0],
          email: b.email,
          percentage: b.percentage, // Utiliser le vrai pourcentage depuis l'API
          status: b.status as 'to_be_sent' | 'pending' | 'accepted' | 'declined',
          invitedDate: b.invitedAt,
          respondedDate: b.respondedAt,
          totalEarnings: 0 // À calculer selon les statistiques réelles
        }));
        
        if (this.event) {
          this.event.beneficiaries = this.beneficiaries;
        }
        
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Erreur lors du chargement des bénéficiaires:', error);
        // Fallback vers des données mockées
        this.loadMockBeneficiariesData();
        this.isLoading = false;
      }
    });
  }

  private mapApiStatusToLocal(apiStatus: string): 'draft' | 'active' | 'completed' {
    switch (apiStatus?.toLowerCase()) {
      case 'inactive':
      case 'draft':
        return 'draft';
      case 'completed':
      case 'finished':
        return 'completed';
      case 'active':
      case 'published':
      default:
        return 'active';
    }
  }

  // Méthodes de fallback avec données mockées
  private loadMockEventData() {
    this.event = {
      id: this.eventId!,
      name: 'Événement (données temporaires)',
      date: '2025-07-15',
      location: 'Lieu non spécifié',
      status: 'active',
      totalRevenue: 0,
      beneficiaries: []
    };
    this.loadMockBeneficiariesData();
  }

  private loadMockBeneficiariesData() {
    this.beneficiaries = [
      {
        id: 'mock1',
        name: 'Bénéficiaire 1',
        email: 'beneficiaire1@exemple.com',
        percentage: 20,
        status: 'pending',
        invitedDate: new Date().toISOString(),
        totalEarnings: 0
      }
    ];
    
    if (this.event) {
      this.event.beneficiaries = this.beneficiaries;
    }
    
    this.isLoading = false;
  }

  private loadAllBeneficiaries() {
    // Simulate API call for all beneficiaries across all events
    setTimeout(() => {
      // Vue globale - pas d'événement spécifique
      this.event = null;
      
      // Charger tous les bénéficiaires de l'organisateur
      this.beneficiaries = [
        {
          id: 'b1',
          name: 'Jean Photographe',
          email: 'jean@photo.com',
          percentage: 20,
          status: 'accepted',
          invitedDate: '2025-06-01',
          respondedDate: '2025-06-02',
          totalEarnings: 500.00
        },
        {
          id: 'b2',
          name: 'Marie Assistante',
          email: 'marie@photo.com',
          percentage: 15,
          status: 'accepted',
          invitedDate: '2025-05-15',
          respondedDate: '2025-05-16',
          totalEarnings: 250.00
        },
        {
          id: 'b3',
          name: 'Paul Retoucheur',
          email: 'paul@retouche.com',
          percentage: 10,
          status: 'pending',
          invitedDate: '2025-06-10',
          totalEarnings: 0
        }
      ];
      
      this.isLoading = false;
    }, 1000);
  }

  /**
   * 📧 Renvoyer une invitation via le service d'invitation
   */
  resendInvitationEmail(beneficiaryId: string) {
    const beneficiary = this.beneficiaries.find(b => b.id === beneficiaryId);
    if (!beneficiary || !this.eventId) return;

    if (beneficiary.status === 'accepted') {
      alert('Ce bénéficiaire a déjà accepté l\'invitation.');
      return;
    }

    if (confirm(`Renvoyer l'invitation à ${beneficiary.name} (${beneficiary.email}) ?`)) {
      this.invitationService.resendInvitation(this.eventId, beneficiaryId)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response) => {
            alert(`✅ Invitation renvoyée avec succès à ${beneficiary.name}`);
            
            // Mettre à jour la date d'invitation
            beneficiary.invitedDate = new Date().toISOString();
          },
          error: (error) => {
            console.error('Erreur lors du renvoi de l\'invitation:', error);
            alert('❌ Erreur lors du renvoi de l\'invitation. Réessayez.');
          }
        });
    }
  }

  /**
   * 📊 Obtenir les statistiques d'invitation
   */
  getInvitationStats() {
    const total = this.beneficiaries.length;
    const accepted = this.beneficiaries.filter(b => b.status === 'accepted').length;
    const pending = this.beneficiaries.filter(b => b.status === 'pending').length;
    const declined = this.beneficiaries.filter(b => b.status === 'declined').length;

    return {
      total,
      accepted,
      pending,
      declined,
      acceptanceRate: total > 0 ? (accepted / total) * 100 : 0
    };
  }

  /**
   * ⏰ Vérifier si une invitation est récente (moins de 24h)
   */
  isInvitationRecent(invitedDate: string): boolean {
    const inviteDate = new Date(invitedDate);
    const now = new Date();
    const hoursAgo = (now.getTime() - inviteDate.getTime()) / (1000 * 60 * 60);
    return hoursAgo <= 24;
  }

  /**
   * 📅 Obtenir le temps écoulé depuis l'invitation
   */
  getInvitationAge(invitedDate: string): string {
    const inviteDate = new Date(invitedDate);
    const now = new Date();
    const diffMs = now.getTime() - inviteDate.getTime();
    
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) {
      return `${days} jour${days > 1 ? 's' : ''}`;
    } else if (hours > 0) {
      return `${hours}h`;
    } else {
      return 'Récent';
    }
  }

  /**
   * 🎨 Obtenir l'icône du statut d'invitation
   */
  getStatusIcon(status: string): string {
    switch (status) {
      case 'to_be_sent':
        return '📤';
      case 'accepted':
        return '✅';
      case 'pending':
        return '⏳';
      case 'declined':
        return '❌';
      default:
        return '❓';
    }
  }

  /**
   * 🔄 Actualiser le statut d'un bénéficiaire
   */
  refreshBeneficiaryStatus(beneficiaryId: string) {
    if (!this.eventId) return;

    // Utiliser getBeneficiaries pour récupérer la liste et trouver le bénéficiaire
    this.beneficiariesDataService.getBeneficiaries(this.eventId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (allBeneficiaries: any[]) => {
          const updatedBeneficiary = allBeneficiaries.find(b => b.id.toString() === beneficiaryId);
          if (updatedBeneficiary) {
            // Mettre à jour le bénéficiaire dans la liste locale
            const index = this.beneficiaries.findIndex(b => b.id === beneficiaryId);
            if (index !== -1) {
              this.beneficiaries[index] = {
                ...this.beneficiaries[index],
                status: updatedBeneficiary.status as 'to_be_sent' | 'pending' | 'accepted' | 'declined',
                invitedDate: updatedBeneficiary.invitedAt,
                respondedDate: updatedBeneficiary.respondedAt
              };
            }
          }
        },
        error: (error) => {
          console.error('Erreur lors de la mise à jour du statut:', error);
        }
      });
  }

  /**
   * 💸 Distribuer les revenus
   */
  distributeRevenue() {
    if (!this.event || this.event.totalRevenue === 0) {
      alert('Aucun revenu à distribuer');
      return;
    }

    const acceptedBeneficiaries = this.beneficiaries.filter(b => b.status === 'accepted');
    const organizerPercentage = this.getOrganizerPercentage();
    
    if (confirm(`Distribuer les revenus maintenant ?\n\nTotal à distribuer: ${this.formatCurrency(this.event.totalRevenue)}\nBénéficiaires: ${acceptedBeneficiaries.length + 1} (vous inclus)`)) {
      // Simulate automatic distribution
      acceptedBeneficiaries.forEach(beneficiary => {
        const shareAmount = this.calculateBeneficiaryShare(beneficiary);
        // In real implementation, this would trigger actual payments
        console.log(`Distributing ${shareAmount}€ to ${beneficiary.name}`);
      });

      const organizerShare = this.calculateOrganizerShare();
      console.log(`Distributing ${organizerShare}€ to organizer`);

      alert('Distribution des revenus initiée ! Les paiements seront traités dans les prochaines heures.');
    }
  }

  /**
   * 📈 Méthodes de calcul des revenus
   */
  calculateOrganizerShare(): number {
    const totalRevenue = this.event?.totalRevenue || 0;
    const organizerPercentage = this.getOrganizerPercentage();
    return (totalRevenue * organizerPercentage) / 100;
  }

  calculateBeneficiaryShare(beneficiary: Beneficiary): number {
    const totalRevenue = this.event?.totalRevenue || 0;
    return (totalRevenue * beneficiary.percentage) / 100;
  }

  getTotalBeneficiaryShares(): number {
    return this.beneficiaries
      .filter(b => b.status === 'accepted')
      .reduce((sum, b) => sum + this.calculateBeneficiaryShare(b), 0);
  }

  getAcceptedBeneficiaries(): Beneficiary[] {
    return this.beneficiaries.filter(b => b.status === 'accepted');
  }

  getAcceptedBeneficiariesCount(): number {
    return this.beneficiaries.filter(b => b.status === 'accepted').length;
  }

  getEventTotalRevenue(): number {
    return this.event?.totalRevenue || 0;
  }

  getDistributionRate(): number {
    const analytics = this.getRevenueAnalytics();
    return analytics.distributionRate;
  }

  getRevenueAnalytics() {
    const totalRevenue = this.event?.totalRevenue || 0;
    const organizerShare = this.calculateOrganizerShare();
    const totalBeneficiaryShares = this.getTotalBeneficiaryShares();

    return {
      totalRevenue,
      organizerShare,
      totalBeneficiaryShares,
      remainingRevenue: totalRevenue - organizerShare - totalBeneficiaryShares,
      distributionRate: totalRevenue > 0 ? ((organizerShare + totalBeneficiaryShares) / totalRevenue) * 100 : 0
    };
  }

  /**
   * 📧 Envoyer toutes les invitations en attente
   */
  sendAllPendingInvitations() {
    const pendingBeneficiaries = this.beneficiaries.filter(b => b.status === 'pending');
    
    if (pendingBeneficiaries.length === 0) {
      alert('Aucune invitation en attente.');
      return;
    }

    if (!this.eventId) return;

    if (confirm(`Envoyer ${pendingBeneficiaries.length} invitation(s) en attente ?`)) {
      // Envoyer les invitations une par une
      let successCount = 0;
      let failureCount = 0;

      pendingBeneficiaries.forEach((beneficiary, index) => {
        this.invitationService.resendInvitation(this.eventId!, beneficiary.id)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: (response: any) => {
              successCount++;
              beneficiary.invitedDate = new Date().toISOString();
              
              // Si c'est la dernière invitation
              if (index === pendingBeneficiaries.length - 1) {
                this.showBulkInvitationResults(successCount, failureCount);
              }
            },
            error: (error: any) => {
              failureCount++;
              console.error(`Erreur pour ${beneficiary.name}:`, error);
              
              // Si c'est la dernière invitation
              if (index === pendingBeneficiaries.length - 1) {
                this.showBulkInvitationResults(successCount, failureCount);
              }
            }
          });
      });
    }
  }

  private showBulkInvitationResults(successCount: number, failureCount: number) {
    if (failureCount === 0) {
      alert(`✅ ${successCount} invitation(s) envoyée(s) avec succès !`);
    } else {
      alert(`✅ ${successCount} invitation(s) envoyée(s)\n⚠️ ${failureCount} invitation(s) ont échoué`);
    }
  }

  /**
   * 📊 Exporter le rapport des revenus
   */
  exportRevenueReport() {
    const analytics = this.getRevenueAnalytics();
    const reportData = {
      event: this.event,
      beneficiaries: this.beneficiaries,
      analytics: analytics,
      exportDate: new Date().toISOString()
    };

    // Simuler l'export en téléchargeant un JSON
    const dataStr = JSON.stringify(reportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `rapport-revenus-${this.event?.name || 'global'}-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    
    URL.revokeObjectURL(url);
    
    alert('📊 Rapport des revenus exporté avec succès !');
  }

  // Helper methods manquantes
  getTotalPercentage(): number {
    return this.beneficiaries
      .filter(b => b.status === 'accepted')
      .reduce((sum, b) => sum + b.percentage, 0);
  }

  getOrganizerPercentage(): number {
    const totalBeneficiaryPercentage = this.getTotalPercentage();
    return Math.max(0, 100 - totalBeneficiaryPercentage);
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'to_be_sent':
        return 'bg-orange-100 text-orange-800';
      case 'accepted':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'declined':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  getStatusText(status: string): string {
    switch (status) {
      case 'to_be_sent':
        return 'À envoyer';
      case 'accepted':
        return 'Accepté';
      case 'pending':
        return 'En attente';
      case 'declined':
        return 'Refusé';
      default:
        return 'Inconnu';
    }
  }

  goBack(): void {
    this.router.navigate(['/organizer/events']);
  }

  /**
   * 🎯 Obtenir les actions disponibles pour un bénéficiaire
   */
  getAvailableActions(beneficiary: Beneficiary): string[] {
    const actions: string[] = [];
    
    switch (beneficiary.status) {
      case 'pending':
        actions.push('resend', 'remove');
        break;
      case 'accepted':
        actions.push('remove');
        break;
      case 'declined':
        actions.push('resend', 'remove');
        break;
    }
    
    return actions;
  }

  /**
   * 🔍 Filtrer les bénéficiaires par statut
   */
  filterBeneficiariesByStatus(status?: 'pending' | 'accepted' | 'declined'): Beneficiary[] {
    if (!status) return this.beneficiaries;
    return this.beneficiaries.filter(b => b.status === status);
  }

  /**
   * 🗑️ Supprimer un bénéficiaire
   */
  removeBeneficiary(beneficiaryId: string) {
    const beneficiary = this.beneficiaries.find(b => b.id === beneficiaryId);
    if (!beneficiary || !this.eventId) return;

    if (confirm(`Êtes-vous sûr de vouloir retirer ${beneficiary.name} de cet événement ?\n\nCette action est irréversible.`)) {
      this.beneficiariesDataService.removeBeneficiary(this.eventId, beneficiaryId)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            // Retirer le bénéficiaire de la liste locale
            this.beneficiaries = this.beneficiaries.filter(b => b.id !== beneficiaryId);
            
            // Mettre à jour l'événement
            if (this.event) {
              this.event.beneficiaries = this.beneficiaries;
            }
            
            alert(`✅ ${beneficiary.name} a été retiré avec succès`);
          },
          error: (error: any) => {
            console.error('Erreur lors de la suppression du bénéficiaire:', error);
            
            if (error.status === 404) {
              alert('❌ Bénéficiaire non trouvé');
            } else {
              alert('❌ Erreur lors de la suppression. Réessayez.');
            }
          }
        });
    }
  }

  resetForm() {
    this.beneficiaryForm = {
      name: '',
      email: '',
      percentage: 0
    };
  }

  toggleAddForm() {
    this.showAddForm = !this.showAddForm;
    if (!this.showAddForm) {
      this.resetForm();
    }
  }

  validateForm(): boolean {
    if (!this.beneficiaryForm.name.trim()) {
      alert('Le nom est requis');
      return false;
    }
    if (!this.beneficiaryForm.email.trim()) {
      alert('L\'email est requis');
      return false;
    }
    if (this.beneficiaryForm.percentage <= 0 || this.beneficiaryForm.percentage > 100) {
      alert('Le pourcentage doit être entre 1 et 100');
      return false;
    }

    // Vérifier que le total ne dépasse pas 100%
    const currentTotal = this.getTotalPercentage();
    if (currentTotal + this.beneficiaryForm.percentage > 100) {
      alert(`Le pourcentage total ne peut pas dépasser 100%. Actuellement: ${currentTotal}%`);
      return false;
    }

    return true;
  }

  addBeneficiary() {
    if (!this.validateForm() || !this.eventId) {
      return;
    }

    const request = {
      email: this.beneficiaryForm.email,
      firstName: this.extractFirstName(this.beneficiaryForm.name),
      lastName: this.extractLastName(this.beneficiaryForm.name),
      percentage: this.beneficiaryForm.percentage,
      role: 'viewer' as const,
      canViewPhotos: true,
      canDownloadPhotos: false,
      canUploadPhotos: false,
      canManageEvent: false
    };

    this.beneficiariesDataService.addBeneficiary(this.eventId, request)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          // Créer le bénéficiaire local pour l'affichage immédiat
          const beneficiary: Beneficiary = {
            id: response.id.toString(),
            name: this.beneficiaryForm.name,
            email: this.beneficiaryForm.email,
            percentage: this.beneficiaryForm.percentage,
            status: 'to_be_sent', // Commencer avec to_be_sent au lieu de pending
            invitedDate: new Date().toISOString(),
            totalEarnings: 0
          };

          // Ajouter à la liste locale
          this.beneficiaries.push(beneficiary);
          
          if (this.event) {
            this.event.beneficiaries = this.beneficiaries;
          }

          this.resetForm();
          this.showAddForm = false;
          
          // Vrai message de succès
          alert(`✅ Invitation envoyée avec succès à ${beneficiary.name} (${beneficiary.email})`);
        },
        error: (error) => {
          console.error('Erreur lors de l\'ajout du bénéficiaire:', error);
          
          // Messages d'erreur spécifiques
          if (error.status === 400) {
            if (error.error?.message?.includes('already exists')) {
              alert('❌ Ce bénéficiaire existe déjà pour cet événement');
            } else if (error.error?.message?.includes('exceed 100%')) {
              alert('❌ Le pourcentage total ne peut pas dépasser 100%');
            } else {
              alert('❌ Données invalides. Vérifiez le formulaire.');
            }
          } else if (error.status === 404) {
            alert('❌ Événement non trouvé');
          } else {
            alert('❌ Erreur lors de l\'envoi de l\'invitation. Réessayez.');
          }
        }
      });
  }

  private extractFirstName(fullName: string): string {
    const names = fullName.split(' ');
    return names.length > 1 ? names[0] : fullName;
  }

  private extractLastName(fullName: string): string {
    const names = fullName.split(' ');
    return names.length > 1 ? names[names.length - 1] : '';
  }
}
