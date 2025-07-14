import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { 
  FinancialService, 
  WalletBalance, 
  Transaction, 
  PaymentMethod, 
  WithdrawalRequest, 
  EarningsBreakdown 
} from '../../shared/services/financial.service';

@Component({
  selector: 'app-wallet',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './wallet.component.html',
  styleUrl: './wallet.component.css'
})
export class WalletComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  isLoading = true;
  
  // Wallet data
  walletBalance: WalletBalance = {
    currentBalance: 0,
    pendingBalance: 0,
    totalEarnings: 0,
    monthlyEarnings: 0,
    lastUpdated: ''
  };

  transactions: Transaction[] = [];
  paymentMethods: PaymentMethod[] = [];
  earningsBreakdown: EarningsBreakdown[] = [];

  // Filters and pagination
  selectedTransactionType = 'all';
  selectedPeriod = '30d';
  currentPage = 1;
  itemsPerPage = 10;

  // Withdrawal form
  showWithdrawalForm = false;
  withdrawalRequest: WithdrawalRequest = {
    amount: 0,
    paymentMethodId: ''
  };

  // Payment method form
  showPaymentMethodForm = false;
  newPaymentMethod = {
    type: 'paypal' as 'paypal' | 'bank_transfer',
    name: '',
    details: ''
  };

  constructor(
    private router: Router,
    private financialService: FinancialService
  ) {}

  ngOnInit() {
    this.loadWalletData();
    this.subscribeToFinancialUpdates();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private subscribeToFinancialUpdates() {
    // Subscribe to wallet balance updates
    this.financialService.walletBalance$
      .pipe(takeUntil(this.destroy$))
      .subscribe(balance => {
        if (balance) {
          this.walletBalance = balance;
        }
      });

    // Subscribe to transactions updates
    this.financialService.transactions$
      .pipe(takeUntil(this.destroy$))
      .subscribe(transactions => {
        this.transactions = transactions;
      });

    // Subscribe to payment methods updates
    this.financialService.paymentMethods$
      .pipe(takeUntil(this.destroy$))
      .subscribe(methods => {
        this.paymentMethods = methods;
      });
  }

  async loadWalletData() {
    this.isLoading = true;

    try {
      // Load all financial data
      await Promise.all([
        this.financialService.getWalletBalance().toPromise(),
        this.financialService.getPaymentMethods().toPromise(),
        this.loadEarningsBreakdown()
      ]);
    } catch (error) {
      console.error('Error loading wallet data:', error);
    } finally {
      this.isLoading = false;
    }
  }

  async loadEarningsBreakdown() {
    try {
      this.earningsBreakdown = await this.financialService.getEarningsBreakdown(this.selectedPeriod).toPromise() || [];
    } catch (error) {
      console.error('Error loading earnings breakdown:', error);
    }
  }

  // Withdrawal methods
  requestWithdrawal() {
    if (this.withdrawalRequest.amount < this.financialService.minimumWithdrawal) {
      alert(`Le montant minimum de retrait est de ${this.formatCurrency(this.financialService.minimumWithdrawal)}`);
      return;
    }

    if (this.withdrawalRequest.amount > this.walletBalance.currentBalance) {
      alert('Solde insuffisant pour ce retrait');
      return;
    }

    if (!this.withdrawalRequest.paymentMethodId) {
      alert('Veuillez sélectionner un moyen de paiement');
      return;
    }

    const fees = this.calculateWithdrawalFees(this.withdrawalRequest.amount);
    const netAmount = this.withdrawalRequest.amount - fees;

    if (confirm(`Confirmer le retrait de ${this.formatCurrency(this.withdrawalRequest.amount)}?\nFrais: ${this.formatCurrency(fees)}\nMontant net: ${this.formatCurrency(netAmount)}`)) {
      this.processWithdrawal();
    }
  }

  async processWithdrawal() {
    try {
      await this.financialService.requestWithdrawal(this.withdrawalRequest).toPromise();

      // Reset form
      this.withdrawalRequest = { amount: 0, paymentMethodId: '' };
      this.showWithdrawalForm = false;

      alert('Demande de retrait envoyée avec succès !');
    } catch (error) {
      alert('Erreur lors du traitement du retrait');
    }
  }

  calculateWithdrawalFees(amount: number): number {
    return this.financialService.calculateWithdrawalFees(amount, this.withdrawalRequest.paymentMethodId);
  }

  // Payment method management
  async addPaymentMethod() {
    if (!this.newPaymentMethod.name || !this.newPaymentMethod.details) {
      alert('Veuillez remplir tous les champs');
      return;
    }

    try {
      await this.financialService.addPaymentMethod({
        type: this.newPaymentMethod.type,
        name: this.newPaymentMethod.name,
        details: this.newPaymentMethod.details,
        isDefault: false
      }).toPromise();
      
      // Reset form
      this.newPaymentMethod = { type: 'paypal', name: '', details: '' };
      this.showPaymentMethodForm = false;

      alert('Moyen de paiement ajouté avec succès !');
    } catch (error) {
      alert('Erreur lors de l\'ajout du moyen de paiement');
    }
  }

  async setDefaultPaymentMethod(id: string) {
    try {
      await this.financialService.setDefaultPaymentMethod(id).toPromise();
      alert('Moyen de paiement par défaut mis à jour');
    } catch (error) {
      alert('Erreur lors de la mise à jour');
    }
  }

  async removePaymentMethod(id: string) {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce moyen de paiement ?')) {
      try {
        await this.financialService.removePaymentMethod(id).toPromise();
        alert('Moyen de paiement supprimé');
      } catch (error) {
        alert('Erreur lors de la suppression');
      }
    }
  }

  // Utility methods
  getPaymentMethodName(id: string): string {
    const method = this.paymentMethods.find(pm => pm.id === id);
    return method ? method.name : 'Inconnu';
  }

  getTransactionIcon(type: string): string {
    switch (type) {
      case 'earning': return '💰';
      case 'withdrawal': return '📤';
      case 'refund': return '↩️';
      case 'fee': return '💳';
      case 'share_distribution': return '🤝';
      default: return '📋';
    }
  }

  getTransactionColor(type: string): string {
    switch (type) {
      case 'earning': return 'text-green-600';
      case 'withdrawal': return 'text-blue-600';
      case 'refund': return 'text-orange-600';
      case 'fee': return 'text-red-600';
      case 'share_distribution': return 'text-purple-600';
      default: return 'text-gray-600';
    }
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'processing': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }

  getStatusText(status: string): string {
    switch (status) {
      case 'completed': return 'Terminé';
      case 'pending': return 'En cours';
      case 'failed': return 'Échec';
      case 'processing': return 'Traitement';
      default: return 'Inconnu';
    }
  }

  getFilteredTransactions(): Transaction[] {
    return this.financialService.getTransactions({
      type: this.selectedTransactionType,
      period: this.selectedPeriod
    }).pipe(takeUntil(this.destroy$)).subscribe() as any;
  }

  getPaginatedTransactions(): Transaction[] {
    let filtered = [...this.transactions];

    if (this.selectedTransactionType !== 'all') {
      filtered = filtered.filter(t => t.type === this.selectedTransactionType);
    }

    // Apply date filter
    const now = new Date();
    const periodDays = this.getPeriodDays();
    const cutoffDate = new Date(now.getTime() - (periodDays * 24 * 60 * 60 * 1000));
    
    filtered = filtered.filter(t => new Date(t.date) >= cutoffDate);

    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    return filtered.slice(startIndex, startIndex + this.itemsPerPage);
  }

  getPeriodDays(): number {
    switch (this.selectedPeriod) {
      case '7d': return 7;
      case '30d': return 30;
      case '90d': return 90;
      case '1y': return 365;
      default: return 30;
    }
  }

  getTotalPages(): number {
    const filtered = this.getPaginatedTransactions();
    return Math.ceil(filtered.length / this.itemsPerPage);
  }

  goToPage(page: number) {
    this.currentPage = page;
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
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  formatPercentage(value: number): string {
    return (value * 100).toFixed(1) + '%';
  }

  // Navigation methods
  viewEventDetails(eventId: string) {
    this.router.navigate(['/organizer/events', eventId]);
  }

  navigateToAnalytics() {
    this.router.navigate(['/organizer/analytics']);
  }

  // Get minimum withdrawal amount
  get minimumWithdrawal(): number {
    return this.financialService.minimumWithdrawal;
  }
}
