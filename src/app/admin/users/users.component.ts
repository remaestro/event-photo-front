import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'organizer' | 'admin';
  status: 'active' | 'suspended' | 'pending';
  registrationDate: string;
  lastLogin: string;
  eventsCount: number;
  photosCount: number;
  totalRevenue: number;
  isVerified: boolean;
}

interface UserFilters {
  role: string;
  status: string;
  search: string;
  dateFrom: string;
  dateTo: string;
}

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './users.component.html',
  styleUrl: './users.component.css'
})
export class UsersComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  users: User[] = [];
  filteredUsers: User[] = [];
  selectedUsers: Set<string> = new Set();
  isLoading = true;
  showBulkActions = false;

  filters: UserFilters = {
    role: '',
    status: '',
    search: '',
    dateFrom: '',
    dateTo: ''
  };

  pagination = {
    currentPage: 1,
    itemsPerPage: 20,
    totalItems: 0,
    totalPages: 0
  };

  constructor(private router: Router) {}

  ngOnInit(): void {
    this.loadUsers();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadUsers(): void {
    // Simulate API call
    setTimeout(() => {
      this.users = [
        {
          id: '1',
          email: 'marie.dupont@example.com',
          firstName: 'Marie',
          lastName: 'Dupont',
          role: 'organizer',
          status: 'active',
          registrationDate: '2025-01-15',
          lastLogin: '2025-07-06',
          eventsCount: 5,
          photosCount: 847,
          totalRevenue: 2456.78,
          isVerified: true
        },
        {
          id: '2',
          email: 'pierre.martin@example.com',
          firstName: 'Pierre',
          lastName: 'Martin',
          role: 'organizer',
          status: 'active',
          registrationDate: '2025-02-20',
          lastLogin: '2025-07-07',
          eventsCount: 12,
          photosCount: 1523,
          totalRevenue: 8945.60,
          isVerified: true
        },
        {
          id: '3',
          email: 'admin@example.com',
          firstName: 'Admin',
          lastName: 'System',
          role: 'admin',
          status: 'active',
          registrationDate: '2024-12-01',
          lastLogin: '2025-07-07',
          eventsCount: 0,
          photosCount: 0,
          totalRevenue: 0,
          isVerified: true
        },
        {
          id: '4',
          email: 'sophie.photo@example.com',
          firstName: 'Sophie',
          lastName: 'Photo',
          role: 'organizer',
          status: 'suspended',
          registrationDate: '2025-03-10',
          lastLogin: '2025-06-28',
          eventsCount: 3,
          photosCount: 234,
          totalRevenue: 567.89,
          isVerified: false
        },
        {
          id: '5',
          email: 'julie.events@example.com',
          firstName: 'Julie',
          lastName: 'Events',
          role: 'organizer',
          status: 'pending',
          registrationDate: '2025-07-05',
          lastLogin: 'Jamais',
          eventsCount: 0,
          photosCount: 0,
          totalRevenue: 0,
          isVerified: false
        }
      ];

      this.applyFilters();
      this.isLoading = false;
    }, 1000);
  }

  applyFilters(): void {
    let filtered = [...this.users];

    // Search filter
    if (this.filters.search) {
      const searchTerm = this.filters.search.toLowerCase();
      filtered = filtered.filter(user => 
        user.email.toLowerCase().includes(searchTerm) ||
        user.firstName.toLowerCase().includes(searchTerm) ||
        user.lastName.toLowerCase().includes(searchTerm)
      );
    }

    // Role filter
    if (this.filters.role) {
      filtered = filtered.filter(user => user.role === this.filters.role);
    }

    // Status filter
    if (this.filters.status) {
      filtered = filtered.filter(user => user.status === this.filters.status);
    }

    // Date range filter
    if (this.filters.dateFrom || this.filters.dateTo) {
      filtered = filtered.filter(user => {
        const regDate = new Date(user.registrationDate);
        const fromDate = this.filters.dateFrom ? new Date(this.filters.dateFrom) : null;
        const toDate = this.filters.dateTo ? new Date(this.filters.dateTo) : null;

        return (!fromDate || regDate >= fromDate) && (!toDate || regDate <= toDate);
      });
    }

    this.filteredUsers = filtered;
    this.updatePagination();
  }

  private updatePagination(): void {
    this.pagination.totalItems = this.filteredUsers.length;
    this.pagination.totalPages = Math.ceil(this.pagination.totalItems / this.pagination.itemsPerPage);
    this.pagination.currentPage = Math.min(this.pagination.currentPage, this.pagination.totalPages || 1);
  }

  getPaginatedUsers(): User[] {
    const startIndex = (this.pagination.currentPage - 1) * this.pagination.itemsPerPage;
    const endIndex = startIndex + this.pagination.itemsPerPage;
    return this.filteredUsers.slice(startIndex, endIndex);
  }

  onFilterChange(): void {
    this.pagination.currentPage = 1;
    this.applyFilters();
  }

  clearFilters(): void {
    this.filters = {
      role: '',
      status: '',
      search: '',
      dateFrom: '',
      dateTo: ''
    };
    this.onFilterChange();
  }

  toggleUserSelection(userId: string): void {
    if (this.selectedUsers.has(userId)) {
      this.selectedUsers.delete(userId);
    } else {
      this.selectedUsers.add(userId);
    }
    this.showBulkActions = this.selectedUsers.size > 0;
  }

  selectAllUsers(): void {
    this.getPaginatedUsers().forEach(user => {
      this.selectedUsers.add(user.id);
    });
    this.showBulkActions = this.selectedUsers.size > 0;
  }

  deselectAllUsers(): void {
    this.selectedUsers.clear();
    this.showBulkActions = false;
  }

  viewUserDetails(userId: string): void {
    this.router.navigate(['/admin/users', userId]);
  }

  editUser(userId: string): void {
    this.router.navigate(['/admin/users', userId, 'edit']);
  }

  suspendUser(userId: string): void {
    const user = this.users.find(u => u.id === userId);
    if (user && confirm(`Êtes-vous sûr de vouloir suspendre ${user.firstName} ${user.lastName} ?`)) {
      user.status = 'suspended';
      this.applyFilters();
    }
  }

  activateUser(userId: string): void {
    const user = this.users.find(u => u.id === userId);
    if (user) {
      user.status = 'active';
      this.applyFilters();
    }
  }

  changeUserRole(userId: string, newRole: 'organizer' | 'admin'): void {
    const user = this.users.find(u => u.id === userId);
    if (user && confirm(`Changer le rôle de ${user.firstName} ${user.lastName} vers ${newRole} ?`)) {
      user.role = newRole;
      this.applyFilters();
    }
  }

  bulkSuspend(): void {
    if (confirm(`Suspendre ${this.selectedUsers.size} utilisateur(s) sélectionné(s) ?`)) {
      this.selectedUsers.forEach(userId => {
        const user = this.users.find(u => u.id === userId);
        if (user) {
          user.status = 'suspended';
        }
      });
      this.deselectAllUsers();
      this.applyFilters();
    }
  }

  bulkActivate(): void {
    this.selectedUsers.forEach(userId => {
      const user = this.users.find(u => u.id === userId);
      if (user) {
        user.status = 'active';
      }
    });
    this.deselectAllUsers();
    this.applyFilters();
  }

  exportUsers(): void {
    // Simulate export functionality
    const csvContent = this.generateCSV();
    this.downloadCSV(csvContent, 'users-export.csv');
  }

  private generateCSV(): string {
    const headers = ['Email', 'Prénom', 'Nom', 'Rôle', 'Statut', 'Date inscription', 'Événements', 'Photos', 'Revenus'];
    const rows = this.filteredUsers.map(user => [
      user.email,
      user.firstName,
      user.lastName,
      user.role,
      user.status,
      user.registrationDate,
      user.eventsCount.toString(),
      user.photosCount.toString(),
      user.totalRevenue.toString()
    ]);

    return [headers, ...rows].map(row => row.join(',')).join('\n');
  }

  private downloadCSV(content: string, filename: string): void {
    const blob = new Blob([content], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
  }

  changePage(page: number): void {
    if (page >= 1 && page <= this.pagination.totalPages) {
      this.pagination.currentPage = page;
    }
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'active':
        return 'text-green-600 bg-green-100';
      case 'suspended':
        return 'text-red-600 bg-red-100';
      case 'pending':
        return 'text-yellow-600 bg-yellow-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  }

  getStatusText(status: string): string {
    switch (status) {
      case 'active':
        return 'Actif';
      case 'suspended':
        return 'Suspendu';
      case 'pending':
        return 'En attente';
      default:
        return 'Inconnu';
    }
  }

  getRoleText(role: string): string {
    switch (role) {
      case 'organizer':
        return 'Organisateur';
      case 'admin':
        return 'Administrateur';
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
    if (dateString === 'Jamais') return dateString;
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR');
  }

  getMathMin(a: number, b: number): number {
    return Math.min(a, b);
  }

  handleCheckboxChange(event: Event): boolean {
    const target = event.target as HTMLInputElement;
    return target.checked;
  }
}
