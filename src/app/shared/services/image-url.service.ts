import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ImageUrlService {
  private readonly backendUrl = environment.apiUrl || 'http://localhost:5290';

  /**
   * Generate backend photo URL for serving images
   */
  getPhotoUrl(photoId: string, quality: 'thumbnail' | 'watermarked' | 'original' = 'watermarked'): string {
    if (!photoId) {
      console.warn('PhotoId is empty, returning placeholder');
      return this.getPlaceholderUrl();
    }
    return `${this.backendUrl}/api/photo/${photoId}/serve?quality=${quality}`;
  }

  /**
   * Get thumbnail URL for a photo
   */
  getThumbnailUrl(photoId: string): string {
    return this.getPhotoUrl(photoId, 'thumbnail');
  }

  /**
   * Get watermarked URL for a photo
   */
  getWatermarkedUrl(photoId: string): string {
    return this.getPhotoUrl(photoId, 'watermarked');
  }

  /**
   * Get original URL for a photo (for download/purchase)
   */
  getOriginalUrl(photoId: string): string {
    return this.getPhotoUrl(photoId, 'original');
  }

  /**
   * Get placeholder image URL
   */
  getPlaceholderUrl(): string {
    return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2Y3ZjdmNyIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBkb21pbmFudC1iYXNlbGluZT0ibWlkZGxlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjOTk5IiBmb250LWZhbWlseT0ic2Fucy1zZXJpZiI+SW1hZ2UgZW4gY291cnMuLi48L3RleHQ+PC9zdmc+';
  }

  /**
   * Handle image load errors
   */
  onImageError(event: any): void {
    console.warn('Image failed to load:', event.target.src);
    event.target.src = this.getPlaceholderUrl();
  }

  /**
   * Check if URL is a backend served image
   */
  isBackendServedImage(url: string): boolean {
    return url.includes('/api/photo/') && url.includes('/serve');
  }
}