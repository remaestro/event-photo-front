import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { ImageUrlService } from '../../shared/services/image-url.service';

interface Photo {
  id: string;
  filename: string;
  eventId: string;
  eventName: string;
  uploaderId: string;
  uploaderName: string;
  uploadDate: string;
  status: 'pending' | 'approved' | 'rejected';
  moderationReason?: string;
  thumbnailUrl: string;
  fullUrl: string;
  tags: string[];
  reports: Report[];
  aiConfidence: number;
  isInappropriate: boolean;
}

interface Report {
  id: string;
  reporterId: string;
  reporterName: string;
  reason: string;
  description: string;
  timestamp: string;
  status: 'pending' | 'reviewed' | 'resolved';
}

interface ModerationAction {
  id: string;
  photoId: string;
  moderatorId: string;
  action: 'approve' | 'reject' | 'flag';
  reason: string;
  timestamp: string;
}

interface ModerationFilters {
  status: string;
  eventId: string;
  uploaderId: string;
  reportStatus: string;
  dateFrom: string;
  dateTo: string;
  hasReports: boolean;
  aiFlag: boolean;
}

@Component({
  selector: 'app-moderation',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './moderation.component.html',
  styleUrl: './moderation.component.css'
})
export class ModerationComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  photos: Photo[] = [];
  filteredPhotos: Photo[] = [];
  selectedPhotos: Set<string> = new Set();
  selectedPhoto: Photo | null = null;
  isLoading = true;
  showBulkActions = false;
  showPhotoModal = false;

  filters: ModerationFilters = {
    status: 'pending',
    eventId: '',
    uploaderId: '',
    reportStatus: '',
    dateFrom: '',
    dateTo: '',
    hasReports: false,
    aiFlag: false
  };

  moderationStats = {
    pending: 0,
    approved: 0,
    rejected: 0,
    reported: 0
  };

  constructor(
    private router: Router,
    public imageUrlService: ImageUrlService
  ) {}

  ngOnInit(): void {
    this.loadModerationData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadModerationData(): void {
    // Simulate API call
    setTimeout(() => {
      this.photos = [
        {
          id: '1',
          filename: 'IMG_2341.jpg',
          eventId: 'evt1',
          eventName: 'Mariage Sophie & Marc',
          uploaderId: 'user1',
          uploaderName: 'Marie Dupont',
          uploadDate: '2025-07-06T10:30:00Z',
          status: 'pending',
          thumbnailUrl: this.imageUrlService.getThumbnailUrl('1'),    // Use ImageUrlService
          fullUrl: this.imageUrlService.getWatermarkedUrl('1'),       // Use ImageUrlService
          tags: ['mariage', 'couple', 'cérémonie'],
          reports: [],
          aiConfidence: 0.95,
          isInappropriate: false
        },
        {
          id: '2',
          filename: 'IMG_2387.jpg',
          eventId: 'evt2',
          eventName: 'Festival Rock 2025',
          uploaderId: 'user2',
          uploaderName: 'Pierre Martin',
          uploadDate: '2025-07-05T15:45:00Z',
          status: 'pending',
          thumbnailUrl: this.imageUrlService.getThumbnailUrl('2'),    // Use ImageUrlService
          fullUrl: this.imageUrlService.getWatermarkedUrl('2'),       // Use ImageUrlService
          tags: ['festival', 'musique', 'foule'],
          reports: [
            {
              id: 'r1',
              reporterId: 'user3',
              reporterName: 'Client Anonyme',
              reason: 'Contenu inapproprié',
              description: 'Cette photo contient du contenu violent',
              timestamp: '2025-07-06T08:00:00Z',
              status: 'pending'
            }
          ],
          aiConfidence: 0.67,
          isInappropriate: true
        },
        {
          id: '3',
          filename: 'IMG_2401.jpg',
          eventId: 'evt1',
          eventName: 'Mariage Sophie & Marc',
          uploaderId: 'user1',
          uploaderName: 'Marie Dupont',
          uploadDate: '2025-07-04T20:15:00Z',
          status: 'approved',
          thumbnailUrl: this.imageUrlService.getThumbnailUrl('3'),    // Use ImageUrlService
          fullUrl: this.imageUrlService.getWatermarkedUrl('3'),       // Use ImageUrlService
          tags: ['mariage', 'groupe', 'famille'],
          reports: [],
          aiConfidence: 0.98,
          isInappropriate: false
        },
        {
          id: '4',
          filename: 'IMG_2425.jpg',
          eventId: 'evt3',
          eventName: 'Corporate Event',
          uploaderId: 'user4',
          uploaderName: 'Sophie Photo',
          uploadDate: '2025-07-03T14:20:00Z',
          status: 'rejected',
          moderationReason: 'Qualité insuffisante',
          thumbnailUrl: this.imageUrlService.getThumbnailUrl('4'),    // Use ImageUrlService
          fullUrl: this.imageUrlService.getWatermarkedUrl('4'),       // Use ImageUrlService
          tags: ['corporate', 'présentation'],
          reports: [],
          aiConfidence: 0.45,
          isInappropriate: false
        }
      ];

      this.updateStats();
      this.applyFilters();
      this.isLoading = false;
    }, 1000);
  }

  /**
   * Get image URL for a photo with specific quality
   */
  getPhotoUrl(photoId: string, quality: 'thumbnail' | 'watermarked' | 'original' = 'watermarked'): string {
    return this.imageUrlService.getPhotoUrl(photoId, quality);
  }

  /**
   * Handle image load errors
   */
  onImageError = (event: any): void => {
    this.imageUrlService.onImageError(event);
  }

  private updateStats(): void {
    this.moderationStats = {
      pending: this.photos.filter(p => p.status === 'pending').length,
      approved: this.photos.filter(p => p.status === 'approved').length,
      rejected: this.photos.filter(p => p.status === 'rejected').length,
      reported: this.photos.filter(p => p.reports.length > 0).length
    };
  }

  applyFilters(): void {
    let filtered = [...this.photos];

    // Status filter
    if (this.filters.status) {
      filtered = filtered.filter(photo => photo.status === this.filters.status);
    }

    // Event filter
    if (this.filters.eventId) {
      filtered = filtered.filter(photo => photo.eventId === this.filters.eventId);
    }

    // Uploader filter
    if (this.filters.uploaderId) {
      filtered = filtered.filter(photo => photo.uploaderId === this.filters.uploaderId);
    }

    // Reports filter
    if (this.filters.hasReports) {
      filtered = filtered.filter(photo => photo.reports.length > 0);
    }

    // AI flag filter
    if (this.filters.aiFlag) {
      filtered = filtered.filter(photo => photo.isInappropriate || photo.aiConfidence < 0.7);
    }

    // Date range filter
    if (this.filters.dateFrom || this.filters.dateTo) {
      filtered = filtered.filter(photo => {
        const uploadDate = new Date(photo.uploadDate);
        const fromDate = this.filters.dateFrom ? new Date(this.filters.dateFrom) : null;
        const toDate = this.filters.dateTo ? new Date(this.filters.dateTo) : null;

        return (!fromDate || uploadDate >= fromDate) && (!toDate || uploadDate <= toDate);
      });
    }

    this.filteredPhotos = filtered.sort((a, b) => {
      // Priority: reported photos first, then by upload date
      if (a.reports.length > 0 && b.reports.length === 0) return -1;
      if (a.reports.length === 0 && b.reports.length > 0) return 1;
      return new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime();
    });
  }

  onFilterChange(): void {
    this.applyFilters();
  }

  clearFilters(): void {
    this.filters = {
      status: '',
      eventId: '',
      uploaderId: '',
      reportStatus: '',
      dateFrom: '',
      dateTo: '',
      hasReports: false,
      aiFlag: false
    };
    this.onFilterChange();
  }

  togglePhotoSelection(photoId: string): void {
    if (this.selectedPhotos.has(photoId)) {
      this.selectedPhotos.delete(photoId);
    } else {
      this.selectedPhotos.add(photoId);
    }
    this.showBulkActions = this.selectedPhotos.size > 0;
  }

  selectAllPhotos(): void {
    this.filteredPhotos.forEach(photo => {
      if (photo.status === 'pending') {
        this.selectedPhotos.add(photo.id);
      }
    });
    this.showBulkActions = this.selectedPhotos.size > 0;
  }

  deselectAllPhotos(): void {
    this.selectedPhotos.clear();
    this.showBulkActions = false;
  }

  viewPhoto(photo: Photo): void {
    this.selectedPhoto = photo;
    this.showPhotoModal = true;
  }

  closePhotoModal(): void {
    this.showPhotoModal = false;
    this.selectedPhoto = null;
  }

  approvePhoto(photoId: string, reason: string = 'Contenu approprié'): void {
    const photo = this.photos.find(p => p.id === photoId);
    if (photo) {
      photo.status = 'approved';
      photo.moderationReason = reason;
      this.updateStats();
      this.applyFilters();
    }
  }

  rejectPhoto(photoId: string, reason: string): void {
    if (!reason.trim()) {
      alert('Veuillez fournir une raison pour le rejet');
      return;
    }

    const photo = this.photos.find(p => p.id === photoId);
    if (photo) {
      photo.status = 'rejected';
      photo.moderationReason = reason;
      this.updateStats();
      this.applyFilters();
    }
  }

  bulkApprove(): void {
    if (confirm(`Approuver ${this.selectedPhotos.size} photo(s) sélectionnée(s) ?`)) {
      this.selectedPhotos.forEach(photoId => {
        this.approvePhoto(photoId);
      });
      this.deselectAllPhotos();
    }
  }

  bulkReject(): void {
    const reason = prompt('Raison du rejet en masse:');
    if (reason && reason.trim()) {
      this.selectedPhotos.forEach(photoId => {
        this.rejectPhoto(photoId, reason);
      });
      this.deselectAllPhotos();
    }
  }

  resolveReport(reportId: string, photoId: string): void {
    const photo = this.photos.find(p => p.id === photoId);
    if (photo) {
      const report = photo.reports.find(r => r.id === reportId);
      if (report) {
        report.status = 'resolved';
        this.applyFilters();
      }
    }
  }

  contactUploader(uploaderId: string): void {
    // Simulate contacting uploader
    alert(`Message envoyé à l'utilisateur ${uploaderId}`);
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'pending':
        return 'text-yellow-600 bg-yellow-100';
      case 'approved':
        return 'text-green-600 bg-green-100';
      case 'rejected':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  }

  getStatusText(status: string): string {
    switch (status) {
      case 'pending':
        return 'En attente';
      case 'approved':
        return 'Approuvé';
      case 'rejected':
        return 'Rejeté';
      default:
        return 'Inconnu';
    }
  }

  getReportStatusColor(status: string): string {
    switch (status) {
      case 'pending':
        return 'text-red-600 bg-red-100';
      case 'reviewed':
        return 'text-yellow-600 bg-yellow-100';
      case 'resolved':
        return 'text-green-600 bg-green-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getAIConfidenceColor(confidence: number): string {
    if (confidence >= 0.8) return 'text-green-600';
    if (confidence >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  }

  getPriorityIcon(photo: Photo): string {
    if (photo.reports.length > 0) return '🚨';
    if (photo.isInappropriate) return '⚠️';
    if (photo.aiConfidence < 0.7) return '🤖';
    return '';
  }

  getPromptInput(message: string): string | null {
    return prompt(message);
  }
}
