import { Injectable, OnDestroy, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { BehaviorSubject, fromEvent, Observable, Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';

export interface ViewportSize {
  width: number;
  height: number;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  orientation: 'portrait' | 'landscape';
}

export interface DeviceCapabilities {
  hasCamera: boolean;
  hasTouch: boolean;
  hasGeolocation: boolean;
  supportsWebGL: boolean;
  connectionType: string;
  isLowEndDevice: boolean;
}

export interface PerformanceMetrics {
  loadTime: number;
  renderTime: number;
  imageLoadTime: number;
  cameraInitTime: number;
}

@Injectable({
  providedIn: 'root'
})
export class ResponsiveService implements OnDestroy {
  private destroy$ = new Subject<void>();
  private viewportSubject: BehaviorSubject<ViewportSize>;
  private deviceCapabilitiesSubject: BehaviorSubject<DeviceCapabilities>;
  private performanceSubject = new BehaviorSubject<PerformanceMetrics>({
    loadTime: 0,
    renderTime: 0,
    imageLoadTime: 0,
    cameraInitTime: 0
  });

  // Public observables
  viewport$: Observable<ViewportSize>;
  deviceCapabilities$: Observable<DeviceCapabilities>;
  performance$ = this.performanceSubject.asObservable();

  // Breakpoints
  private readonly BREAKPOINTS = {
    mobile: 768,
    tablet: 1024,
    desktop: 1280
  };

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    // Initialize with default values first
    const defaultViewport = this.getDefaultViewport();
    const defaultCapabilities = this.getDefaultCapabilities();
    
    this.viewportSubject = new BehaviorSubject<ViewportSize>(defaultViewport);
    this.deviceCapabilitiesSubject = new BehaviorSubject<DeviceCapabilities>(defaultCapabilities);
    
    this.viewport$ = this.viewportSubject.asObservable();
    this.deviceCapabilities$ = this.deviceCapabilitiesSubject.asObservable();

    // Only initialize browser-specific features if we're in the browser
    if (isPlatformBrowser(this.platformId)) {
      // Update with actual values
      this.viewportSubject.next(this.getCurrentViewport());
      this.deviceCapabilitiesSubject.next(this.detectDeviceCapabilities());
      
      this.initializeViewportTracking();
      this.initializePerformanceTracking();
    }
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private getDefaultViewport(): ViewportSize {
    return {
      width: 1024,
      height: 768,
      isMobile: false,
      isTablet: true,
      isDesktop: false,
      orientation: 'landscape'
    };
  }

  private getDefaultCapabilities(): DeviceCapabilities {
    return {
      hasCamera: false,
      hasTouch: false,
      hasGeolocation: false,
      supportsWebGL: false,
      connectionType: 'unknown',
      isLowEndDevice: false
    };
  }

  private initializeViewportTracking() {
    if (!isPlatformBrowser(this.platformId) || typeof window === 'undefined') {
      return;
    }

    fromEvent(window, 'resize')
      .pipe(
        debounceTime(100),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.viewportSubject.next(this.getCurrentViewport());
      });

    fromEvent(window, 'orientationchange')
      .pipe(
        debounceTime(300),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        setTimeout(() => {
          this.viewportSubject.next(this.getCurrentViewport());
        }, 100);
      });
  }

  private getCurrentViewport(): ViewportSize {
    if (!isPlatformBrowser(this.platformId) || typeof window === 'undefined') {
      return this.getDefaultViewport();
    }

    const width = window.innerWidth || 1024;
    const height = window.innerHeight || 768;

    return {
      width,
      height,
      isMobile: width < this.BREAKPOINTS.mobile,
      isTablet: width >= this.BREAKPOINTS.mobile && width < this.BREAKPOINTS.tablet,
      isDesktop: width >= this.BREAKPOINTS.tablet,
      orientation: width > height ? 'landscape' : 'portrait'
    };
  }

  private detectDeviceCapabilities(): DeviceCapabilities {
    if (!isPlatformBrowser(this.platformId) || typeof window === 'undefined') {
      return this.getDefaultCapabilities();
    }

    const hasCamera = !!(navigator?.mediaDevices && navigator.mediaDevices.getUserMedia);
    const hasTouch = 'ontouchstart' in window || !!(navigator?.maxTouchPoints && navigator.maxTouchPoints > 0);
    const hasGeolocation = !!navigator?.geolocation;
    const supportsWebGL = this.checkWebGLSupport();
    const connectionType = this.getConnectionType();
    const isLowEndDevice = this.detectLowEndDevice();

    return {
      hasCamera,
      hasTouch,
      hasGeolocation,
      supportsWebGL,
      connectionType,
      isLowEndDevice
    };
  }

  private checkWebGLSupport(): boolean {
    if (!isPlatformBrowser(this.platformId) || typeof document === 'undefined') {
      return false;
    }

    try {
      const canvas = document.createElement('canvas');
      return !!(canvas.getContext('webgl') || canvas.getContext('experimental-webgl'));
    } catch {
      return false;
    }
  }

  private getConnectionType(): string {
    if (!isPlatformBrowser(this.platformId) || typeof navigator === 'undefined') {
      return 'unknown';
    }

    const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
    return connection ? connection.effectiveType || 'unknown' : 'unknown';
  }

  private detectLowEndDevice(): boolean {
    if (!isPlatformBrowser(this.platformId) || typeof navigator === 'undefined') {
      return false;
    }

    // Detect low-end devices based on various factors
    const hardwareConcurrency = navigator.hardwareConcurrency || 1;
    const memory = (navigator as any).deviceMemory || 1;
    const connection = (navigator as any).connection;
    
    let score = 0;
    
    // CPU cores
    if (hardwareConcurrency <= 2) score++;
    if (hardwareConcurrency <= 4) score += 0.5;
    
    // Memory
    if (memory <= 1) score += 2;
    if (memory <= 2) score++;
    
    // Connection
    if (connection) {
      if (connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g') score += 2;
      if (connection.effectiveType === '3g') score++;
    }
    
    return score >= 2;
  }

  private initializePerformanceTracking() {
    if (!isPlatformBrowser(this.platformId) || typeof window === 'undefined' || !('performance' in window)) {
      return;
    }

    window.addEventListener('load', () => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      if (navigation) {
        const loadTime = navigation.loadEventEnd - navigation.loadEventStart;
        this.updatePerformanceMetric('loadTime', loadTime);
      }
    });
  }

  // Public methods
  isMobile(): boolean {
    return this.viewportSubject.value.isMobile;
  }

  isTablet(): boolean {
    return this.viewportSubject.value.isTablet;
  }

  isDesktop(): boolean {
    return this.viewportSubject.value.isDesktop;
  }

  isTouchDevice(): boolean {
    return this.deviceCapabilitiesSubject.value.hasTouch;
  }

  hasCamera(): boolean {
    return this.deviceCapabilitiesSubject.value.hasCamera;
  }

  isLowEndDevice(): boolean {
    return this.deviceCapabilitiesSubject.value.isLowEndDevice;
  }

  getOptimalImageSize(): { width: number; height: number } {
    const viewport = this.viewportSubject.value;
    const isLowEnd = this.isLowEndDevice();
    
    if (viewport.isMobile) {
      return isLowEnd 
        ? { width: 320, height: 240 }
        : { width: 640, height: 480 };
    } else if (viewport.isTablet) {
      return isLowEnd
        ? { width: 640, height: 480 }
        : { width: 1024, height: 768 };
    } else {
      return isLowEnd
        ? { width: 1024, height: 768 }
        : { width: 1920, height: 1080 };
    }
  }

  getOptimalGridColumns(): number {
    const viewport = this.viewportSubject.value;
    
    if (viewport.isMobile) {
      return viewport.orientation === 'portrait' ? 2 : 3;
    } else if (viewport.isTablet) {
      return viewport.orientation === 'portrait' ? 3 : 4;
    } else {
      return 4;
    }
  }

  shouldUseLazyLoading(): boolean {
    return this.isMobile() || this.isLowEndDevice();
  }

  shouldPreloadImages(): boolean {
    const connection = this.deviceCapabilitiesSubject.value.connectionType;
    return !this.isLowEndDevice() && 
           connection !== 'slow-2g' && 
           connection !== '2g';
  }

  updatePerformanceMetric(metric: keyof PerformanceMetrics, value: number) {
    const current = this.performanceSubject.value;
    this.performanceSubject.next({
      ...current,
      [metric]: value
    });
  }

  measureImageLoadTime(callback: () => void): () => void {
    const startTime = performance.now();
    
    return () => {
      const endTime = performance.now();
      this.updatePerformanceMetric('imageLoadTime', endTime - startTime);
      callback();
    };
  }

  measureCameraInitTime(): () => void {
    const startTime = performance.now();
    
    return () => {
      const endTime = performance.now();
      this.updatePerformanceMetric('cameraInitTime', endTime - startTime);
    };
  }

  // Utility methods for UI optimization
  getOptimalChunkSize(): number {
    return this.isLowEndDevice() ? 5 : 10;
  }

  getDebounceDelay(): number {
    return this.isLowEndDevice() ? 500 : 300;
  }

  shouldUseVirtualScrolling(): boolean {
    return this.isMobile() || this.isLowEndDevice();
  }

  getMaxConcurrentRequests(): number {
    if (this.isLowEndDevice()) return 2;
    if (this.isMobile()) return 4;
    return 6;
  }
}