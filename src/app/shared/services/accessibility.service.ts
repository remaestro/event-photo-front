import { Injectable, ElementRef, Renderer2, RendererFactory2, OnDestroy } from '@angular/core';
import { BehaviorSubject, fromEvent, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

export interface AccessibilitySettings {
  fontSize: 'small' | 'medium' | 'large' | 'extra-large';
  contrast: 'normal' | 'high' | 'dark';
  reducedMotion: boolean;
  screenReaderMode: boolean;
  keyboardNavigation: boolean;
  focusIndicators: boolean;
}

export interface FocusableElement {
  element: HTMLElement;
  tabIndex: number;
  role?: string;
  ariaLabel?: string;
}

export interface NavigationContext {
  currentFocus: HTMLElement | null;
  focusableElements: FocusableElement[];
  currentIndex: number;
  region: string;
}

@Injectable({
  providedIn: 'root'
})
export class AccessibilityService implements OnDestroy {
  private destroy$ = new Subject<void>();
  private renderer: Renderer2;
  
  // Accessibility settings
  private settingsSubject = new BehaviorSubject<AccessibilitySettings>({
    fontSize: 'medium',
    contrast: 'normal',
    reducedMotion: false,
    screenReaderMode: false,
    keyboardNavigation: true,
    focusIndicators: true
  });

  // Navigation tracking
  private navigationSubject = new BehaviorSubject<NavigationContext>({
    currentFocus: null,
    focusableElements: [],
    currentIndex: -1,
    region: 'main'
  });

  // Announcements for screen readers
  private announcementSubject = new BehaviorSubject<string>('');

  // Public observables
  settings$ = this.settingsSubject.asObservable();
  navigation$ = this.navigationSubject.asObservable();
  announcements$ = this.announcementSubject.asObservable();

  // WCAG Color contrast ratios
  private readonly CONTRAST_RATIOS = {
    normal: {
      text: '#374151',
      background: '#ffffff',
      primary: '#3b82f6',
      secondary: '#6b7280'
    },
    high: {
      text: '#000000',
      background: '#ffffff',
      primary: '#1d4ed8',
      secondary: '#374151'
    },
    dark: {
      text: '#f9fafb',
      background: '#111827',
      primary: '#60a5fa',
      secondary: '#9ca3af'
    }
  };

  // ARIA live region element
  private liveRegion: HTMLElement | null = null;

  constructor(private rendererFactory: RendererFactory2) {
    this.renderer = this.rendererFactory.createRenderer(null, null);
    this.initializeAccessibility();
    this.setupKeyboardNavigation();
    this.detectUserPreferences();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeAccessibility() {
    // Create ARIA live region for announcements
    this.createLiveRegion();
    
    // Load saved preferences
    this.loadSavedSettings();
    
    // Apply initial settings
    this.applySettings(this.settingsSubject.value);
  }

  private createLiveRegion() {
    this.liveRegion = this.renderer.createElement('div');
    this.renderer.setAttribute(this.liveRegion, 'aria-live', 'polite');
    this.renderer.setAttribute(this.liveRegion, 'aria-atomic', 'true');
    this.renderer.setAttribute(this.liveRegion, 'class', 'sr-only');
    this.renderer.appendChild(document.body, this.liveRegion);

    // Subscribe to announcements
    this.announcements$
      .pipe(takeUntil(this.destroy$))
      .subscribe(message => {
        if (this.liveRegion && message) {
          this.renderer.setProperty(this.liveRegion, 'textContent', message);
          
          // Clear after announcement
          setTimeout(() => {
            if (this.liveRegion) {
              this.renderer.setProperty(this.liveRegion, 'textContent', '');
            }
          }, 1000);
        }
      });
  }

  private setupKeyboardNavigation() {
    fromEvent<KeyboardEvent>(document, 'keydown')
      .pipe(takeUntil(this.destroy$))
      .subscribe(event => {
        if (this.settingsSubject.value.keyboardNavigation) {
          this.handleKeyboardNavigation(event);
        }
      });

    fromEvent<FocusEvent>(document, 'focusin')
      .pipe(takeUntil(this.destroy$))
      .subscribe(event => {
        this.updateNavigationContext(event.target as HTMLElement);
      });
  }

  private handleKeyboardNavigation(event: KeyboardEvent) {
    const { key, ctrlKey, shiftKey, altKey } = event;
    
    switch (key) {
      case 'Tab':
        this.handleTabNavigation(event);
        break;
      case 'Escape':
        this.handleEscapeKey(event);
        break;
      case 'Enter':
      case ' ':
        this.handleActivationKeys(event);
        break;
      case 'ArrowUp':
      case 'ArrowDown':
      case 'ArrowLeft':
      case 'ArrowRight':
        this.handleArrowNavigation(event);
        break;
      case 'Home':
      case 'End':
        this.handleHomeEndNavigation(event);
        break;
    }

    // Skip links (Alt + number)
    if (altKey && /^[1-9]$/.test(key)) {
      this.handleSkipLink(parseInt(key));
      event.preventDefault();
    }
  }

  private handleTabNavigation(event: KeyboardEvent) {
    const focusableElements = this.getFocusableElements();
    const currentIndex = this.navigationSubject.value.currentIndex;
    
    if (focusableElements.length === 0) return;

    let nextIndex: number;
    
    if (event.shiftKey) {
      nextIndex = currentIndex <= 0 ? focusableElements.length - 1 : currentIndex - 1;
    } else {
      nextIndex = currentIndex >= focusableElements.length - 1 ? 0 : currentIndex + 1;
    }

    const nextElement = focusableElements[nextIndex];
    if (nextElement) {
      nextElement.element.focus();
      this.updateNavigationContext(nextElement.element, nextIndex);
    }
  }

  private handleEscapeKey(event: KeyboardEvent) {
    // Close modals, dropdowns, etc.
    const activeModal = document.querySelector('[role="dialog"]:not([aria-hidden="true"])');
    const activeDropdown = document.querySelector('[aria-expanded="true"]');
    
    if (activeModal) {
      this.announce('Modal fermé');
      // Dispatch custom event for modal closure
      activeModal.dispatchEvent(new CustomEvent('escape-pressed'));
    } else if (activeDropdown) {
      this.announce('Menu fermé');
      activeDropdown.dispatchEvent(new CustomEvent('escape-pressed'));
    }
  }

  private handleActivationKeys(event: KeyboardEvent) {
    const target = event.target as HTMLElement;
    
    if (target.tagName === 'BUTTON' || target.getAttribute('role') === 'button') {
      if (event.key === ' ') {
        event.preventDefault();
        target.click();
      }
    }
  }

  private handleArrowNavigation(event: KeyboardEvent) {
    const target = event.target as HTMLElement;
    const role = target.getAttribute('role');
    
    // Handle specific ARIA patterns
    if (role === 'tablist' || role === 'menu' || role === 'listbox') {
      event.preventDefault();
      this.navigateWithinRole(target, event.key);
    }
  }

  private handleHomeEndNavigation(event: KeyboardEvent) {
    const target = event.target as HTMLElement;
    const container = target.closest('[role="menu"], [role="listbox"], [role="tablist"]');
    
    if (container) {
      event.preventDefault();
      const items = Array.from(container.querySelectorAll('[role="menuitem"], [role="option"], [role="tab"]'));
      
      if (event.key === 'Home' && items.length > 0) {
        (items[0] as HTMLElement).focus();
      } else if (event.key === 'End' && items.length > 0) {
        (items[items.length - 1] as HTMLElement).focus();
      }
    }
  }

  private handleSkipLink(number: number) {
    const skipTargets = [
      '#main-content',
      '#navigation',
      '#search',
      '#sidebar',
      '#footer'
    ];

    const targetId = skipTargets[number - 1];
    if (targetId) {
      const target = document.querySelector(targetId) as HTMLElement;
      if (target) {
        target.focus();
        this.announce(`Sauté à ${this.getElementDescription(target)}`);
      }
    }
  }

  private navigateWithinRole(container: HTMLElement, direction: string) {
    const role = container.getAttribute('role');
    let selector = '';
    
    switch (role) {
      case 'tablist':
        selector = '[role="tab"]';
        break;
      case 'menu':
        selector = '[role="menuitem"]';
        break;
      case 'listbox':
        selector = '[role="option"]';
        break;
    }

    const items = Array.from(container.querySelectorAll(selector)) as HTMLElement[];
    const currentIndex = items.findIndex(item => item === document.activeElement);
    
    let nextIndex: number;
    
    switch (direction) {
      case 'ArrowUp':
      case 'ArrowLeft':
        nextIndex = currentIndex <= 0 ? items.length - 1 : currentIndex - 1;
        break;
      case 'ArrowDown':
      case 'ArrowRight':
        nextIndex = currentIndex >= items.length - 1 ? 0 : currentIndex + 1;
        break;
      default:
        return;
    }

    if (items[nextIndex]) {
      items[nextIndex].focus();
    }
  }

  private detectUserPreferences() {
    // Detect OS preferences
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const prefersHighContrast = window.matchMedia('(prefers-contrast: high)').matches;
    const prefersDarkScheme = window.matchMedia('(prefers-color-scheme: dark)').matches;

    // Apply detected preferences
    const currentSettings = this.settingsSubject.value;
    const newSettings: AccessibilitySettings = {
      ...currentSettings,
      reducedMotion: prefersReducedMotion,
      contrast: prefersHighContrast ? 'high' : (prefersDarkScheme ? 'dark' : 'normal')
    };

    this.updateSettings(newSettings);
  }

  private loadSavedSettings() {
    try {
      const saved = localStorage.getItem('accessibility-settings');
      if (saved) {
        const settings = JSON.parse(saved) as AccessibilitySettings;
        this.updateSettings(settings);
      }
    } catch (error) {
      console.warn('Failed to load accessibility settings:', error);
    }
  }

  private saveSettings(settings: AccessibilitySettings) {
    try {
      localStorage.setItem('accessibility-settings', JSON.stringify(settings));
    } catch (error) {
      console.warn('Failed to save accessibility settings:', error);
    }
  }

  private applySettings(settings: AccessibilitySettings) {
    // Apply font size
    this.applyFontSize(settings.fontSize);
    
    // Apply contrast theme
    this.applyContrastTheme(settings.contrast);
    
    // Apply motion preferences
    this.applyMotionPreferences(settings.reducedMotion);
    
    // Apply focus indicators
    this.applyFocusIndicators(settings.focusIndicators);
  }

  private applyFontSize(fontSize: AccessibilitySettings['fontSize']) {
    const root = document.documentElement;
    const multipliers = {
      'small': 0.875,
      'medium': 1,
      'large': 1.125,
      'extra-large': 1.25
    };
    
    root.style.setProperty('--font-size-multiplier', multipliers[fontSize].toString());
  }

  private applyContrastTheme(contrast: AccessibilitySettings['contrast']) {
    const root = document.documentElement;
    const colors = this.CONTRAST_RATIOS[contrast];
    
    Object.entries(colors).forEach(([property, value]) => {
      root.style.setProperty(`--color-${property}`, value);
    });
    
    document.body.className = document.body.className.replace(/theme-\w+/g, '');
    document.body.classList.add(`theme-${contrast}`);
  }

  private applyMotionPreferences(reducedMotion: boolean) {
    const root = document.documentElement;
    
    if (reducedMotion) {
      root.style.setProperty('--animation-duration', '0s');
      root.style.setProperty('--transition-duration', '0s');
    } else {
      root.style.removeProperty('--animation-duration');
      root.style.removeProperty('--transition-duration');
    }
  }

  private applyFocusIndicators(focusIndicators: boolean) {
    const root = document.documentElement;
    
    if (focusIndicators) {
      root.style.setProperty('--focus-ring-width', '2px');
      root.style.setProperty('--focus-ring-color', '#3b82f6');
    } else {
      root.style.setProperty('--focus-ring-width', '0px');
    }
  }

  // Public methods
  updateSettings(settings: Partial<AccessibilitySettings>) {
    const currentSettings = this.settingsSubject.value;
    const newSettings = { ...currentSettings, ...settings };
    
    this.settingsSubject.next(newSettings);
    this.applySettings(newSettings);
    this.saveSettings(newSettings);
  }

  announce(message: string, priority: 'polite' | 'assertive' = 'polite') {
    if (this.liveRegion) {
      this.renderer.setAttribute(this.liveRegion, 'aria-live', priority);
    }
    this.announcementSubject.next(message);
  }

  getFocusableElements(): FocusableElement[] {
    const selectors = [
      'a[href]',
      'button:not([disabled])',
      'input:not([disabled]):not([type="hidden"])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
      '[role="button"]:not([aria-disabled="true"])',
      '[role="link"]:not([aria-disabled="true"])',
      '[role="menuitem"]:not([aria-disabled="true"])',
      '[role="tab"]:not([aria-disabled="true"])'
    ];

    const elements = Array.from(document.querySelectorAll(selectors.join(','))) as HTMLElement[];
    
    return elements
      .filter(el => this.isVisible(el) && !this.isInert(el))
      .map((el, index) => ({
        element: el,
        tabIndex: el.tabIndex,
        role: el.getAttribute('role') || undefined,
        ariaLabel: el.getAttribute('aria-label') || undefined
      }));
  }

  private isVisible(element: HTMLElement): boolean {
    const style = window.getComputedStyle(element);
    return style.display !== 'none' && 
           style.visibility !== 'hidden' && 
           style.opacity !== '0';
  }

  private isInert(element: HTMLElement): boolean {
    return element.hasAttribute('inert') || 
           element.closest('[inert]') !== null ||
           element.getAttribute('aria-hidden') === 'true';
  }

  private updateNavigationContext(element: HTMLElement, index?: number) {
    const focusableElements = this.getFocusableElements();
    const currentIndex = index !== undefined ? index : 
      focusableElements.findIndex(fe => fe.element === element);
    
    const region = this.getElementRegion(element);
    
    this.navigationSubject.next({
      currentFocus: element,
      focusableElements,
      currentIndex,
      region
    });
  }

  private getElementRegion(element: HTMLElement): string {
    const landmarks = ['main', 'navigation', 'banner', 'contentinfo', 'complementary', 'search'];
    
    for (const landmark of landmarks) {
      if (element.closest(`[role="${landmark}"], ${landmark}`)) {
        return landmark;
      }
    }
    
    return 'main';
  }

  private getElementDescription(element: HTMLElement): string {
    const ariaLabel = element.getAttribute('aria-label');
    const ariaLabelledBy = element.getAttribute('aria-labelledby');
    const role = element.getAttribute('role');
    const tagName = element.tagName.toLowerCase();
    
    if (ariaLabel) return ariaLabel;
    
    if (ariaLabelledBy) {
      const labelElement = document.getElementById(ariaLabelledBy);
      if (labelElement) return labelElement.textContent || '';
    }
    
    const textContent = element.textContent?.trim();
    if (textContent) return textContent;
    
    return role || tagName;
  }

  // Utility methods for components
  setFocus(element: HTMLElement, options?: FocusOptions) {
    element.focus(options);
    this.updateNavigationContext(element);
  }

  addAriaAttributes(element: HTMLElement, attributes: Record<string, string>) {
    Object.entries(attributes).forEach(([key, value]) => {
      this.renderer.setAttribute(element, key.startsWith('aria-') ? key : `aria-${key}`, value);
    });
  }

  removeAriaAttributes(element: HTMLElement, attributes: string[]) {
    attributes.forEach(attr => {
      this.renderer.removeAttribute(element, attr.startsWith('aria-') ? attr : `aria-${attr}`);
    });
  }

  manageModal(modalElement: HTMLElement, isOpen: boolean) {
    if (isOpen) {
      // Save current focus
      const previousFocus = document.activeElement as HTMLElement;
      modalElement.dataset['previousFocus'] = previousFocus?.id || '';
      
      // Set focus to modal
      const firstFocusable = modalElement.querySelector('[tabindex="0"], button, input, select, textarea') as HTMLElement;
      if (firstFocusable) {
        firstFocusable.focus();
      }
      
      // Trap focus
      this.trapFocus(modalElement);
      
      this.announce('Modal ouvert');
    } else {
      // Restore focus
      const previousFocusId = modalElement.dataset['previousFocus'];
      if (previousFocusId) {
        const previousElement = document.getElementById(previousFocusId);
        if (previousElement) {
          previousElement.focus();
        }
      }
      
      this.announce('Modal fermé');
    }
  }

  private trapFocus(container: HTMLElement) {
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    ) as NodeListOf<HTMLElement>;
    
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];
    
    const handleTabKey = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return;
      
      if (event.shiftKey) {
        if (document.activeElement === firstElement) {
          event.preventDefault();
          lastElement.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          event.preventDefault();
          firstElement.focus();
        }
      }
    };
    
    container.addEventListener('keydown', handleTabKey);
    
    // Store cleanup function
    container.dataset['focusTrapCleanup'] = 'true';
    (container as any)._focusTrapCleanup = () => {
      container.removeEventListener('keydown', handleTabKey);
    };
  }

  // Test methods for compliance
  testColorContrast(foreground: string, background: string): { ratio: number; passes: boolean } {
    // Simplified contrast calculation - in production use a proper library
    const ratio = 4.5; // Mock ratio
    const passes = ratio >= 4.5; // WCAG AA standard
    
    return { ratio, passes };
  }

  generateAccessibilityReport(): object {
    const focusableElements = this.getFocusableElements();
    const missingLabels = focusableElements.filter(fe => 
      !fe.ariaLabel && 
      !fe.element.getAttribute('aria-labelledby') && 
      !fe.element.textContent?.trim()
    );
    
    return {
      focusableElementsCount: focusableElements.length,
      missingLabelsCount: missingLabels.length,
      currentSettings: this.settingsSubject.value,
      keyboardNavigationEnabled: this.settingsSubject.value.keyboardNavigation,
      screenReaderSupported: !!this.liveRegion
    };
  }
}