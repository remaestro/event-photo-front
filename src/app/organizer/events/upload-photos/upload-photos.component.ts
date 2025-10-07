import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, takeUntil, BehaviorSubject } from 'rxjs';
import { HttpClient, HttpEventType, HttpHeaders, HttpProgressEvent, HttpResponse } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

export interface PhotoFile {
  id: string;
  file: File;
  preview: string;
  name: string;
  size: number;
  type: string;
  tags: string[];
  description: string;
  uploadProgress: number;
  uploadStatus: 'pending' | 'uploading' | 'completed' | 'error';
  watermarkApplied: boolean;
  errorMessage?: string;
}

export interface UploadSession {
  eventId: string;
  totalFiles: number;
  completedFiles: number;
  failedFiles: number;
  totalSize: number;
  uploadedSize: number;
  startTime: Date;
  isActive: boolean;
}

@Component({
  selector: 'app-upload-photos',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './upload-photos.component.html',
  styleUrl: './upload-photos.component.css'
})
export class UploadPhotosComponent implements OnInit, OnDestroy {
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;
  @ViewChild('dropZone') dropZone!: ElementRef<HTMLDivElement>;

  private destroy$ = new Subject<void>();
  private uploadQueue$ = new BehaviorSubject<PhotoFile[]>([]);
  
  eventId: string = '';
  event: any = null;
  
  // Upload state
  photos: PhotoFile[] = [];
  uploadSession: UploadSession | null = null;
  isDragOver = false;
  isUploading = false;
  
  // Form for metadata
  metadataForm!: FormGroup;
  selectedPhotos: Set<string> = new Set();
  
  // Settings
  maxFileSize = 50 * 1024 * 1024; // 50MB
  allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  maxFiles = 100;
  
  // Available tags for suggestions
  suggestedTags = [
    'portrait', 'groupe', 'famille', 'amis', 'couple', 'enfants',
    'danse', 'musique', 'cérémonie', 'réception', 'cocktail',
    'extérieur', 'intérieur', 'jardín', 'salle', 'église',
    'gâteau', 'bouquet', 'décoration', 'table', 'buffet',
    'sourire', 'émotion', 'joie', 'surprise', 'tendresse',
    'noir-et-blanc', 'couleur', 'gros-plan', 'panorama'
  ];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private fb: FormBuilder,
    private http: HttpClient
  ) {
    this.initializeForm();
  }

  ngOnInit(): void {
    this.eventId = this.route.snapshot.params['id'];
    if (!this.eventId) {
      this.router.navigate(['/organizer/events']);
      return;
    }
    
    this.loadEvent();
    this.setupDragAndDrop();
    this.setupUploadQueue();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.cleanupObjectUrls();
  }

  private initializeForm(): void {
    this.metadataForm = this.fb.group({
      bulkTags: [''],
      bulkDescription: [''],
      applyToSelected: [false]
    });
  }

  private loadEvent(): void {
    // Load event from API instead of localStorage
    this.http.get<any>(`${environment.apiUrl}/api/events/${this.eventId}`, {
      headers: this.getAuthHeaders()
    }).subscribe({
      next: (event) => {
        this.event = event;
      },
      error: (error) => {
        this.router.navigate(['/organizer/events']);
      }
    });
  }

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
    let headers = new HttpHeaders();
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }
    return headers;
  }

  private setupDragAndDrop(): void {
    // Will be bound to the drop zone in the template
  }

  private setupUploadQueue(): void {
    this.uploadQueue$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(photos => {
      this.processUploadQueue(photos);
    });
  }

  // File selection and drag & drop handlers
  onFileSelect(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      this.handleFiles(Array.from(input.files));
    }
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = false;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = false;

    const files = Array.from(event.dataTransfer?.files || []);
    this.handleFiles(files);
  }

  onDropZoneClick(): void {
    this.fileInput.nativeElement.click();
  }

  private handleFiles(files: File[]): void {
    if (files.length === 0) return;

    // Validate file count
    if (this.photos.length + files.length > this.maxFiles) {
      alert(`Vous ne pouvez pas uploader plus de ${this.maxFiles} photos à la fois.`);
      return;
    }

    const validFiles = files.filter(file => this.validateFile(file));
    const photoFiles = validFiles.map(file => this.createPhotoFile(file));
    
    this.photos.push(...photoFiles);
    this.generatePreviews(photoFiles);
  }

  private validateFile(file: File): boolean {
    // Check file type
    if (!this.allowedTypes.includes(file.type)) {
      alert(`Type de fichier non supporté: ${file.name}. Types autorisés: JPEG, PNG, WebP`);
      return false;
    }

    // Check file size
    if (file.size > this.maxFileSize) {
      alert(`Fichier trop volumineux: ${file.name}. Taille maximale: ${this.formatFileSize(this.maxFileSize)}`);
      return false;
    }

    return true;
  }

  private createPhotoFile(file: File): PhotoFile {
    return {
      id: this.generateId(),
      file,
      preview: '',
      name: file.name,
      size: file.size,
      type: file.type,
      tags: [],
      description: '',
      uploadProgress: 0,
      uploadStatus: 'pending',
      watermarkApplied: false
    };
  }

  private generatePreviews(photoFiles: PhotoFile[]): void {
    photoFiles.forEach(photoFile => {
      if (photoFile.file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          photoFile.preview = e.target?.result as string;
        };
        reader.readAsDataURL(photoFile.file);
      }
    });
  }

  // Photo management
  removePhoto(photoId: string): void {
    const index = this.photos.findIndex(p => p.id === photoId);
    if (index !== -1) {
      const photo = this.photos[index];
      if (photo.preview) {
        URL.revokeObjectURL(photo.preview);
      }
      this.photos.splice(index, 1);
      this.selectedPhotos.delete(photoId);
    }
  }

  togglePhotoSelection(photoId: string): void {
    if (this.selectedPhotos.has(photoId)) {
      this.selectedPhotos.delete(photoId);
    } else {
      this.selectedPhotos.add(photoId);
    }
  }

  selectAllPhotos(): void {
    this.photos.forEach(photo => {
      this.selectedPhotos.add(photo.id);
    });
  }

  deselectAllPhotos(): void {
    this.selectedPhotos.clear();
  }

  // Metadata management
  addTagToPhoto(photoId: string, tag: string): void {
    const photo = this.photos.find(p => p.id === photoId);
    if (photo && tag.trim() && !photo.tags.includes(tag.trim())) {
      photo.tags.push(tag.trim());
    }
  }

  removeTagFromPhoto(photoId: string, tagIndex: number): void {
    const photo = this.photos.find(p => p.id === photoId);
    if (photo) {
      photo.tags.splice(tagIndex, 1);
    }
  }

  updatePhotoDescription(photoId: string, description: string): void {
    const photo = this.photos.find(p => p.id === photoId);
    if (photo) {
      photo.description = description;
    }
  }

  // Bulk operations
  applyBulkMetadata(): void {
    const formValue = this.metadataForm.value;
    const photosToUpdate = formValue.applyToSelected 
      ? this.photos.filter(p => this.selectedPhotos.has(p.id))
      : this.photos;

    photosToUpdate.forEach(photo => {
      if (formValue.bulkTags) {
        const newTags = formValue.bulkTags.split(',')
          .map((tag: string) => tag.trim())
          .filter((tag: string) => tag && !photo.tags.includes(tag));
        photo.tags.push(...newTags);
      }

      if (formValue.bulkDescription && !photo.description) {
        photo.description = formValue.bulkDescription;
      }
    });

    // Reset form
    this.metadataForm.patchValue({
      bulkTags: '',
      bulkDescription: ''
    });
  }

  // Upload process
  async startUpload(): Promise<void> {
    if (this.photos.length === 0) {
      alert('Aucune photo à uploader');
      return;
    }

    this.isUploading = true;
    this.initializeUploadSession();

    // Process photos in batches of 5
    const batchSize = 5;
    for (let i = 0; i < this.photos.length; i += batchSize) {
      const batch = this.photos.slice(i, i + batchSize);
      await this.uploadBatch(batch);
    }

    this.completeUploadSession();
  }

  private initializeUploadSession(): void {
    this.uploadSession = {
      eventId: this.eventId,
      totalFiles: this.photos.length,
      completedFiles: 0,
      failedFiles: 0,
      totalSize: this.photos.reduce((sum, p) => sum + p.size, 0),
      uploadedSize: 0,
      startTime: new Date(),
      isActive: true
    };
  }

  private async uploadBatch(batch: PhotoFile[]): Promise<void> {
    const uploadPromises = batch.map(photo => this.uploadSinglePhoto(photo));
    await Promise.all(uploadPromises);
  }

  private async uploadSinglePhoto(photo: PhotoFile): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        photo.uploadStatus = 'uploading';
        
        // Create FormData for the API call
        const formData = new FormData();
        formData.append('files', photo.file);
        
        // Add metadata if available
        if (photo.tags.length > 0 || photo.description) {
          const metadata = {
            tags: photo.tags,
            description: photo.description,
            pricing: {
              digital: 5.0, // Default price from your event
              print: 10.0
            }
          };
          formData.append('metadata', JSON.stringify(metadata));
        }

        // Get auth token
        const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
        let headers = new HttpHeaders();
        if (token) {
          headers = headers.set('Authorization', `Bearer ${token}`);
        }

        const apiUrl = `${environment.apiUrl}/api/photo/upload/${this.eventId}`;

        // Upload to backend API with proper HTTP event handling
        this.http.post<any>(
          apiUrl,
          formData,
          {
            headers,
            reportProgress: true,
            observe: 'events'
          }
        ).subscribe({
          next: (event) => {
            if (event.type === HttpEventType.UploadProgress) {
              // Handle upload progress
              const progressEvent = event as HttpProgressEvent;
              if (progressEvent.total) {
                photo.uploadProgress = Math.round(100 * progressEvent.loaded / progressEvent.total);
              }
            } else if (event.type === HttpEventType.Response) {
              // Handle upload completion
              const responseEvent = event as HttpResponse<any>;
              
              // Vérifier si la réponse indique un succès
              if (responseEvent.status >= 200 && responseEvent.status < 300) {
                photo.uploadStatus = 'completed';
                photo.uploadProgress = 100;
                
                // Store the response data (photo URLs, etc.)
                if (responseEvent.body?.photos?.length > 0) {
                  const uploadedPhoto = responseEvent.body.photos[0];
                  photo.id = uploadedPhoto.photoId.toString();
                }
                
                if (this.uploadSession) {
                  this.uploadSession.completedFiles++;
                  this.uploadSession.uploadedSize += photo.size;
                }
                
                resolve(); // Resolve the promise when upload is complete
              } else {
                photo.uploadStatus = 'error';
                photo.errorMessage = `Erreur HTTP ${responseEvent.status}`;
                
                if (this.uploadSession) {
                  this.uploadSession.failedFiles++;
                }
                
                reject(new Error(`HTTP ${responseEvent.status}`));
              }
            }
          },
          error: (error: any) => {
            photo.uploadStatus = 'error';
            photo.errorMessage = error?.error?.message || error?.message || 'Erreur lors de l\'upload';
            
            if (this.uploadSession) {
              this.uploadSession.failedFiles++;
            }
            
            reject(error); // Reject the promise on error
          }
        });
        
      } catch (error: any) {
        photo.uploadStatus = 'error';
        photo.errorMessage = error?.error?.message || error?.message || 'Erreur lors de l\'upload';
        
        if (this.uploadSession) {
          this.uploadSession.failedFiles++;
        }
        
        reject(error);
      }
    });
  }

  private completeUploadSession(): void {
    this.isUploading = false;
    
    if (this.uploadSession) {
      this.uploadSession.isActive = false;
      
      const duration = new Date().getTime() - this.uploadSession.startTime.getTime();
      const successCount = this.uploadSession.completedFiles;
      const failCount = this.uploadSession.failedFiles;
      
      if (failCount === 0) {
        alert(`Upload terminé avec succès ! ${successCount} photos uploadées.`);
        this.router.navigate(['/organizer/photos'], { queryParams: { eventId: this.eventId } });
      } else {
        alert(`Upload terminé avec ${failCount} erreurs. ${successCount} photos uploadées avec succès.`);
      }
    }
  }

  private processUploadQueue(photos: PhotoFile[]): void {
    // Process the upload queue (can be used for future enhancements)
  }

  retryFailedUpload(photoId: string): void {
    const photo = this.photos.find(p => p.id === photoId);
    if (photo && photo.uploadStatus === 'error') {
      photo.uploadStatus = 'pending';
      photo.uploadProgress = 0;
      photo.errorMessage = undefined;
      this.uploadSinglePhoto(photo);
    }
  }

  // Computed properties for template
  get completedPhotosCount(): number {
    return this.getCompletedCount();
  }

  get failedPhotosCount(): number {
    return this.getFailedCount();
  }

  get selectedPhotosCount(): number {
    return this.selectedPhotos.size;
  }

  get totalSize(): string {
    const total = this.photos.reduce((sum, photo) => sum + photo.size, 0);
    return this.formatFileSize(total);
  }

  get canStartUpload(): boolean {
    return this.photos.length > 0 && !this.isUploading && this.photos.some(p => p.uploadStatus === 'pending');
  }

  // Additional methods for template
  getOverallProgress(): number {
    return this.getUploadProgress();
  }

  getUploadTimeRemaining(): string | null {
    if (!this.uploadSession || !this.uploadSession.isActive) return null;
    
    const elapsed = new Date().getTime() - this.uploadSession.startTime.getTime();
    const completed = this.uploadSession.completedFiles;
    const total = this.uploadSession.totalFiles;
    
    if (completed === 0) return null;
    
    const estimatedTotal = (elapsed / completed) * total;
    const remaining = estimatedTotal - elapsed;
    
    if (remaining <= 0) return null;
    
    const minutes = Math.floor(remaining / 60000);
    const seconds = Math.floor((remaining % 60000) / 1000);
    
    if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    } else {
      return `${seconds}s`;
    }
  }

  retryFailedUploads(): void {
    const failedPhotos = this.photos.filter(p => p.uploadStatus === 'error');
    failedPhotos.forEach(photo => {
      photo.uploadStatus = 'pending';
      photo.uploadProgress = 0;
      photo.errorMessage = undefined;
      this.uploadSinglePhoto(photo);
    });
  }

  clearCompletedPhotos(): void {
    const completedPhotos = this.photos.filter(p => p.uploadStatus === 'completed');
    completedPhotos.forEach(photo => {
      this.removePhoto(photo.id);
    });
  }

  trackByPhotoId(index: number, photo: PhotoFile): string {
    return photo.id;
  }

  // Utility methods
  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  getUploadProgress(): number {
    if (this.photos.length === 0) return 0;
    const totalProgress = this.photos.reduce((sum, photo) => sum + photo.uploadProgress, 0);
    return Math.round(totalProgress / this.photos.length);
  }

  getCompletedCount(): number {
    return this.photos.filter(p => p.uploadStatus === 'completed').length;
  }

  getFailedCount(): number {
    return this.photos.filter(p => p.uploadStatus === 'error').length;
  }

  getPendingCount(): number {
    return this.photos.filter(p => p.uploadStatus === 'pending').length;
  }

  getUploadingCount(): number {
    return this.photos.filter(p => p.uploadStatus === 'uploading').length;
  }

  private cleanupObjectUrls(): void {
    this.photos.forEach(photo => {
      if (photo.preview && photo.preview.startsWith('blob:')) {
        URL.revokeObjectURL(photo.preview);
      }
    });
  }

  // Navigation
  goBack(): void {
    this.router.navigate(['/organizer/events', this.eventId]);
  }

  openFileDialog(): void {
    this.fileInput.nativeElement.click();
  }

  // Tag suggestions
  getFilteredTagSuggestions(currentInput: string): string[] {
    if (!currentInput.trim()) return this.suggestedTags.slice(0, 10);
    
    return this.suggestedTags.filter(tag => 
      tag.toLowerCase().includes(currentInput.toLowerCase())
    ).slice(0, 10);
  }
}
