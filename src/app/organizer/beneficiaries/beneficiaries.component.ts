import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';

interface Beneficiary {
  id: string;
  name: string;
  email: string;
  percentage: number;
  status: 'pending' | 'accepted' | 'declined';
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
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    this.route.paramMap.pipe(takeUntil(this.destroy$)).subscribe(params => {
      this.eventId = params.get('id');
      if (this.eventId) {
        this.loadEventAndBeneficiaries();
      }
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadEventAndBeneficiaries() {
    // Simulate API call - replace with actual service
    setTimeout(() => {
      this.event = {
        id: '1',
        name: 'Mariage Sophie & Marc',
        date: '2025-07-15',
        location: 'Château de Versailles',
        status: 'active',
        totalRevenue: 1856.40,
        beneficiaries: [
          {
            id: 'b1',
            name: 'Jean Photographe',
            email: 'jean@photo.com',
            percentage: 20,
            status: 'accepted',
            invitedDate: '2025-06-01',
            respondedDate: '2025-06-02',
            totalEarnings: 371.28
          },
          {
            id: 'b2',
            name: 'Marie Assistante',
            email: 'marie@photo.com',
            percentage: 10,
            status: 'pending',
            invitedDate: '2025-06-15',
            totalEarnings: 0
          },
          {
            id: 'b3',
            name: 'Paul Retoucheur',
            email: 'paul@retouche.com',
            percentage: 15,
            status: 'declined',
            invitedDate: '2025-06-10',
            respondedDate: '2025-06-12',
            totalEarnings: 0
          }
        ]
      };

      this.beneficiaries = this.event.beneficiaries;
      this.isLoading = false;
    }, 1000);
  }

  toggleAddForm() {
    this.showAddForm = !this.showAddForm;
    if (!this.showAddForm) {
      this.resetForm();
    }
  }

  resetForm() {
    this.beneficiaryForm = {
      name: '',
      email: '',
      percentage: 0
    };
  }

  addBeneficiary() {
    if (this.validateForm()) {
      const newBeneficiary: Beneficiary = {
        id: 'b' + (this.beneficiaries.length + 1),
        name: this.beneficiaryForm.name,
        email: this.beneficiaryForm.email,
        percentage: this.beneficiaryForm.percentage,
        status: 'pending',
        invitedDate: new Date().toISOString(),
        totalEarnings: 0
      };

      // Simulate API call
      this.beneficiaries.push(newBeneficiary);
      this.resetForm();
      this.showAddForm = false;
      
      // Show success message
      alert(`Invitation envoyée à ${newBeneficiary.name}`);
    }
  }

  private validateForm(): boolean {
    if (!this.beneficiaryForm.name.trim()) {
      alert('Le nom est requis');
      return false;
    }
    if (!this.beneficiaryForm.email.trim()) {
      alert('L\'email est requis');
      return false;
    }
    if (!this.isValidEmail(this.beneficiaryForm.email)) {
      alert('Format d\'email invalide');
      return false;
    }
    if (this.beneficiaryForm.percentage <= 0 || this.beneficiaryForm.percentage > 100) {
      alert('Le pourcentage doit être entre 1 et 100');
      return false;
    }
    if (this.getTotalPercentage() + this.beneficiaryForm.percentage > 100) {
      alert('Le total des pourcentages ne peut pas dépasser 100%');
      return false;
    }
    return true;
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  removeBeneficiary(beneficiaryId: string) {
    const beneficiary = this.beneficiaries.find(b => b.id === beneficiaryId);
    if (beneficiary && confirm(`Êtes-vous sûr de vouloir retirer ${beneficiary.name} ?`)) {
      this.beneficiaries = this.beneficiaries.filter(b => b.id !== beneficiaryId);
    }
  }

  resendInvitation(beneficiaryId: string) {
    const beneficiary = this.beneficiaries.find(b => b.id === beneficiaryId);
    if (beneficiary) {
      // Simulate API call
      alert(`Invitation renvoyée à ${beneficiary.name}`);
    }
  }

  getTotalPercentage(): number {
    return this.beneficiaries
      .filter(b => b.status !== 'declined')
      .reduce((sum, b) => sum + b.percentage, 0);
  }

  getOrganizerPercentage(): number {
    return 100 - this.getTotalPercentage();
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'accepted':
        return 'text-green-600 bg-green-100';
      case 'pending':
        return 'text-yellow-600 bg-yellow-100';
      case 'declined':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  }

  getStatusText(status: string): string {
    switch (status) {
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

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  }

  goBack() {
    this.router.navigate(['/organizer/events']);
  }

  // Revenue sharing methods
  calculateTotalRevenuePotential(): number {
    return this.event?.totalRevenue || 0;
  }

  calculateOrganizerShare(): number {
    const totalRevenue = this.calculateTotalRevenuePotential();
    const organizerPercentage = this.getOrganizerPercentage();
    return (totalRevenue * organizerPercentage) / 100;
  }

  calculateBeneficiaryShare(beneficiary: Beneficiary): number {
    const totalRevenue = this.calculateTotalRevenuePotential();
    return (totalRevenue * beneficiary.percentage) / 100;
  }

  getRevenueAnalytics() {
    const totalRevenue = this.calculateTotalRevenuePotential();
    const organizerShare = this.calculateOrganizerShare();
    const totalBeneficiaryShares = this.beneficiaries
      .filter(b => b.status === 'accepted')
      .reduce((sum, b) => sum + this.calculateBeneficiaryShare(b), 0);

    return {
      totalRevenue,
      organizerShare,
      totalBeneficiaryShares,
      remainingRevenue: totalRevenue - organizerShare - totalBeneficiaryShares,
      distributionRate: totalRevenue > 0 ? ((organizerShare + totalBeneficiaryShares) / totalRevenue) * 100 : 0
    };
  }

  // Real-time revenue tracking
  processNewSale(saleAmount: number) {
    if (!this.event) return;

    // Update event total revenue
    this.event.totalRevenue += saleAmount;

    // Update beneficiary earnings in real-time
    this.beneficiaries.forEach(beneficiary => {
      if (beneficiary.status === 'accepted') {
        const shareAmount = (saleAmount * beneficiary.percentage) / 100;
        beneficiary.totalEarnings += shareAmount;
      }
    });

    // Trigger notifications to beneficiaries about new earnings
    this.notifyBeneficiariesOfEarnings(saleAmount);
  }

  private notifyBeneficiariesOfEarnings(saleAmount: number) {
    // In a real implementation, this would send notifications
    console.log('Notifying beneficiaries of new earnings:', saleAmount);
  }

  // Revenue dispute handling
  disputeRevenue(beneficiaryId: string, reason: string) {
    const beneficiary = this.beneficiaries.find(b => b.id === beneficiaryId);
    if (beneficiary) {
      // In real implementation, this would create a dispute ticket
      console.log('Revenue dispute created for:', beneficiary.name, 'Reason:', reason);
      alert(`Contestation créée pour ${beneficiary.name}. L'équipe support vous contactera sous 24h.`);
    }
  }

  // Automatic revenue distribution simulation
  distributeRevenue() {
    if (!this.event || this.event.totalRevenue === 0) {
      alert('Aucun revenu à distribuer');
      return;
    }

    const acceptedBeneficiaries = this.beneficiaries.filter(b => b.status === 'accepted');
    
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

  // Enhanced beneficiary invitation with revenue sharing details
  addBeneficiaryWithRevenueInfo() {
    if (!this.validateForm()) {
      return;
    }

    // Check if adding this beneficiary would exceed 100%
    const newTotalPercentage = this.getTotalPercentage() + this.beneficiaryForm.percentage;
    if (newTotalPercentage > 100) {
      alert(`La répartition totale ne peut pas dépasser 100%. Actuellement: ${this.getTotalPercentage()}%`);
      return;
    }

    const projectedEarnings = this.calculateTotalRevenuePotential() * (this.beneficiaryForm.percentage / 100);

    if (confirm(`Ajouter ${this.beneficiaryForm.name} comme bénéficiaire ?\n\nPourcentage: ${this.beneficiaryForm.percentage}%\nGains projetés basés sur les revenus actuels: ${this.formatCurrency(projectedEarnings)}\n\nUne invitation sera envoyée à ${this.beneficiaryForm.email}`)) {
      this.addBeneficiary();
    }
  }

  // Export revenue sharing report
  exportRevenueReport() {
    const analytics = this.getRevenueAnalytics();
    const reportData = {
      event: this.event,
      beneficiaries: this.beneficiaries,
      analytics,
      generatedAt: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `revenue-report-${this.event?.name}-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    alert('Rapport de répartition des revenus téléchargé !');
  }

  // Helper methods for template calculations
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

  // Safe event revenue getter
  getEventTotalRevenue(): number {
    return this.event?.totalRevenue || 0;
  }

  // Safe distribution rate calculation
  getDistributionRate(): number {
    const analytics = this.getRevenueAnalytics();
    return analytics.distributionRate;
  }
}
