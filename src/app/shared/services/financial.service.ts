import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { delay, map, catchError } from 'rxjs/operators';
import { PaymentsDataService } from './payments-data.service';
import { OrdersDataService } from './orders-data.service';

export interface WalletBalance {
  currentBalance: number;
  pendingBalance: number;
  totalEarnings: number;
  monthlyEarnings: number;
  lastUpdated: string;
}

export interface Transaction {
  id: string;
  type: 'earning' | 'withdrawal' | 'fee';
  amount: number;
  description: string;
  eventName?: string;
  eventId?: string;
  date: string;
  status: 'pending' | 'completed' | 'failed';
  photoCount?: number;
}

export interface PaymentMethod {
  id: string;
  type: 'paypal' | 'bank_transfer' | 'card';
  name: string;
  details: string;
  isDefault: boolean;
  isVerified: boolean;
  createdAt: string;
  verifiedAt?: string;
}

export interface RevenueShare {
  id: string;
  eventId: string;
  eventName: string;
  organizerId: string;
  beneficiaryId: string;
  beneficiaryName: string;
  beneficiaryEmail: string;
  percentage: number;
  totalRevenue: number;
  shareAmount: number;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
  acceptedAt?: string;
}

@Injectable({
  providedIn: 'root'
})
export class FinancialService {
  private walletBalanceSubject = new BehaviorSubject<WalletBalance | null>(null);
  public walletBalance$ = this.walletBalanceSubject.asObservable();

  private transactionsSubject = new BehaviorSubject<Transaction[]>([]);
  public transactions$ = this.transactionsSubject.asObservable();

  private paymentMethodsSubject = new BehaviorSubject<PaymentMethod[]>([]);
  public paymentMethods$ = this.paymentMethodsSubject.asObservable();

  private revenueSharesSubject = new BehaviorSubject<RevenueShare[]>([]);
  public revenueShares$ = this.revenueSharesSubject.asObservable();

  constructor(
    private paymentsDataService: PaymentsDataService,
    private ordersDataService: OrdersDataService
  ) {
    this.initializeMockData();
  }

  // Wallet Operations - uses mock for now (would need dedicated endpoint)
  getWalletBalance(): Observable<WalletBalance> {
    if (this.walletBalanceSubject.value) {
      return of(this.walletBalanceSubject.value);
    }

    return this.fetchWalletBalance();
  }

  private fetchWalletBalance(): Observable<WalletBalance> {
    // This would be part of a user/organizer statistics endpoint
    return this.fetchWalletBalanceMock();
  }

  // Transaction Operations - now uses real API with fallback  
  getTransactions(limit?: number): Observable<Transaction[]> {
    return this.ordersDataService.getOrders({ page: 1, limit: limit || 20 }).pipe(
      map(response => {
        // Map the simplified order data from API to transactions
        return response.orders.map(order => ({
          id: order.id,
          type: 'earning' as const,
          amount: typeof order.total === 'number' ? order.total : parseFloat(order.total) || 0,
          description: `Vente de photos`,
          date: order.createdAt,
          status: order.status === 'completed' ? 'completed' as const : 'pending' as const,
          photoCount: order.itemCount || 1
        }));
      }),
      catchError(() => this.getTransactionsMock(limit))
    );
  }

  // Payment Methods - uses mock for now (API methods not yet available)
  getPaymentMethods(): Observable<PaymentMethod[]> {
    return this.getPaymentMethodsMock();
  }

  addPaymentMethod(method: Omit<PaymentMethod, 'id' | 'isVerified' | 'createdAt' | 'verifiedAt'>): Observable<PaymentMethod> {
    return this.addPaymentMethodMock(method);
  }

  removePaymentMethod(methodId: string): Observable<boolean> {
    return this.removePaymentMethodMock(methodId);
  }

  setDefaultPaymentMethod(methodId: string): Observable<boolean> {
    return this.setDefaultPaymentMethodMock(methodId);
  }

  // Revenue Shares - mock for now (would need dedicated endpoints)
  getRevenueShares(): Observable<RevenueShare[]> {
    return this.getRevenueSharesMock();
  }

  acceptRevenueShare(shareId: string): Observable<boolean> {
    return this.acceptRevenueShareMock(shareId);
  }

  rejectRevenueShare(shareId: string): Observable<boolean> {
    return this.rejectRevenueShareMock(shareId);
  }

  // Mock implementations
  private fetchWalletBalanceMock(): Observable<WalletBalance> {
    const mockBalance: WalletBalance = {
      currentBalance: 1847.32,
      pendingBalance: 324.78,
      totalEarnings: 8932.15,
      monthlyEarnings: 2341.67,
      lastUpdated: new Date().toISOString()
    };

    return of(mockBalance).pipe(
      delay(500),
      map(balance => {
        this.walletBalanceSubject.next(balance);
        return balance;
      })
    );
  }

  private getTransactionsMock(limit?: number): Observable<Transaction[]> {
    const mockTransactions: Transaction[] = [
      {
        id: 'tx_001',
        type: 'earning',
        amount: 45.50,
        description: 'Vente de 5 photos',
        eventName: 'Mariage Sophie & Marc',
        eventId: 'evt_001',
        date: '2025-07-06T10:30:00Z',
        status: 'completed',
        photoCount: 5
      },
      {
        id: 'tx_002',
        type: 'withdrawal',
        amount: -250.00,
        description: 'Retrait PayPal',
        date: '2025-07-05T14:15:00Z',
        status: 'completed'
      },
      {
        id: 'tx_003',
        type: 'earning',
        amount: 32.75,
        description: 'Vente de 3 photos',
        eventName: 'Festival Rock 2025',
        eventId: 'evt_002',
        date: '2025-07-04T16:45:00Z',
        status: 'completed',
        photoCount: 3
      },
      {
        id: 'tx_004',
        type: 'fee',
        amount: -2.15,
        description: 'Frais de transaction',
        date: '2025-07-04T16:45:00Z',
        status: 'completed'
      },
      {
        id: 'tx_005',
        type: 'earning',
        amount: 78.25,
        description: 'Vente de 8 photos',
        eventName: 'Corporate Event TechCorp',
        eventId: 'evt_003',
        date: '2025-07-03T11:20:00Z',
        status: 'pending',
        photoCount: 8
      }
    ];

    const limitedTransactions = limit ? mockTransactions.slice(0, limit) : mockTransactions;
    this.transactionsSubject.next(limitedTransactions);
    return of(limitedTransactions).pipe(delay(400));
  }

  private getPaymentMethodsMock(): Observable<PaymentMethod[]> {
    const mockPaymentMethods: PaymentMethod[] = [
      {
        id: 'pm_001',
        type: 'paypal',
        name: 'PayPal Personnel',
        details: 'organizer@email.com',
        isDefault: true,
        isVerified: true,
        createdAt: '2025-06-01T10:00:00Z',
        verifiedAt: '2025-06-02T14:30:00Z'
      },
      {
        id: 'pm_002',
        type: 'bank_transfer',
        name: 'Compte Courant',
        details: 'FR76 **** **** **** 1234',
        isDefault: false,
        isVerified: true,
        createdAt: '2025-06-15T16:20:00Z',
        verifiedAt: '2025-06-18T09:15:00Z'
      }
    ];

    this.paymentMethodsSubject.next(mockPaymentMethods);
    return of(mockPaymentMethods).pipe(delay(300));
  }

  private addPaymentMethodMock(method: Omit<PaymentMethod, 'id' | 'isVerified' | 'createdAt' | 'verifiedAt'>): Observable<PaymentMethod> {
    return of(null).pipe(
      delay(800),
      map(() => {
        const newMethod: PaymentMethod = {
          ...method,
          id: 'pm_' + Date.now(),
          isVerified: false,
          createdAt: new Date().toISOString()
        };

        const currentMethods = this.paymentMethodsSubject.value;
        const updatedMethods = [...currentMethods, newMethod];
        this.paymentMethodsSubject.next(updatedMethods);

        return newMethod;
      })
    );
  }

  private removePaymentMethodMock(methodId: string): Observable<boolean> {
    return of(null).pipe(
      delay(300),
      map(() => {
        const currentMethods = this.paymentMethodsSubject.value;
        const updatedMethods = currentMethods.filter(m => m.id !== methodId);
        this.paymentMethodsSubject.next(updatedMethods);
        return true;
      })
    );
  }

  private setDefaultPaymentMethodMock(methodId: string): Observable<boolean> {
    return of(null).pipe(
      delay(200),
      map(() => {
        const currentMethods = this.paymentMethodsSubject.value;
        const updatedMethods = currentMethods.map(m => ({
          ...m,
          isDefault: m.id === methodId
        }));
        this.paymentMethodsSubject.next(updatedMethods);
        return true;
      })
    );
  }

  private getRevenueSharesMock(): Observable<RevenueShare[]> {
    const mockRevenueShares: RevenueShare[] = [
      {
        id: 'rs_001',
        eventId: 'evt_001',
        eventName: 'Mariage Sophie & Marc',
        organizerId: 'org_001',
        beneficiaryId: 'ben_001',
        beneficiaryName: 'Jean Dupont',
        beneficiaryEmail: 'jean.dupont@email.com',
        percentage: 10,
        totalRevenue: 287.50,
        shareAmount: 28.75,
        status: 'accepted',
        createdAt: '2025-06-01T10:00:00Z',
        acceptedAt: '2025-06-02T14:30:00Z'
      },
      {
        id: 'rs_002',
        eventId: 'evt_003',
        eventName: 'Corporate Event TechCorp',
        organizerId: 'org_001',
        beneficiaryId: 'ben_002',
        beneficiaryName: 'Marie Martin',
        beneficiaryEmail: 'marie.martin@email.com',
        percentage: 20,
        totalRevenue: 198.75,
        shareAmount: 39.75,
        status: 'pending',
        createdAt: '2025-06-25T16:00:00Z'
      }
    ];

    this.revenueSharesSubject.next(mockRevenueShares);
    return of(mockRevenueShares).pipe(delay(400));
  }

  private acceptRevenueShareMock(shareId: string): Observable<boolean> {
    return of(null).pipe(
      delay(500),
      map(() => {
        const currentShares = this.revenueSharesSubject.value;
        const updatedShares = currentShares.map(share => 
          share.id === shareId 
            ? { ...share, status: 'accepted' as const, acceptedAt: new Date().toISOString() }
            : share
        );
        this.revenueSharesSubject.next(updatedShares);
        return true;
      })
    );
  }

  private rejectRevenueShareMock(shareId: string): Observable<boolean> {
    return of(null).pipe(
      delay(500),
      map(() => {
        const currentShares = this.revenueSharesSubject.value;
        const updatedShares = currentShares.map(share => 
          share.id === shareId 
            ? { ...share, status: 'rejected' as const }
            : share
        );
        this.revenueSharesSubject.next(updatedShares);
        return true;
      })
    );
  }

  // Initialize mock data
  private initializeMockData(): void {
    // Load initial data
    this.getPaymentMethods().subscribe();
    this.getTransactions().subscribe();
    this.getRevenueShares().subscribe();
  }
}