import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { AccessibilityService, AccessibilitySettings } from '../../services/accessibility.service';
import { ResponsiveService, ViewportSize } from '../../services/responsive.service';

@Component({
  selector: 'app-accessibility-panel',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './accessibility-panel.component.html',
  styleUrl: './accessibility-panel.component.css'
})
export class AccessibilityPanelComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  isOpen = false;
  settings: AccessibilitySettings = {
    fontSize: 'medium',
    contrast: 'normal',
    reducedMotion: false,
    screenReaderMode: false,
    keyboardNavigation: true,
    focusIndicators: true
  };
  
  viewport: ViewportSize = {
    width: 0,
    height: 0,
    isMobile: false,
    isTablet: false,
    isDesktop: true,
    orientation: 'landscape'
  };

  // Options for dropdowns
  fontSizeOptions = [
    { value: 'small', label: 'Petit (87.5%)', description: 'Texte plus petit que la normale' },
    { value: 'medium', label: 'Normal (100%)', description: 'Taille de texte par défaut' },
    { value: 'large', label: 'Grand (112.5%)', description: 'Texte plus grand pour une meilleure lisibilité' },
    { value: 'extra-large', label: 'Très grand (125%)', description: 'Texte le plus grand pour les malvoyants' }
  ];

  contrastOptions = [
    { value: 'normal', label: 'Normal', description: 'Couleurs standard' },
    { value: 'high', label: 'Contraste élevé', description: 'Noir et blanc pour une meilleure lisibilité' },
    { value: 'dark', label: 'Mode sombre', description: 'Fond sombre avec texte clair' }
  ];

  constructor(
    private accessibilityService: AccessibilityService,
    private responsiveService: ResponsiveService
  ) {}

  ngOnInit() {
    // Subscribe to accessibility settings
    this.accessibilityService.settings$
      .pipe(takeUntil(this.destroy$))
      .subscribe(settings => {
        this.settings = settings;
      });

    // Subscribe to viewport changes
    this.responsiveService.viewport$
      .pipe(takeUntil(this.destroy$))
      .subscribe(viewport => {
        this.viewport = viewport;
      });

    // Listen for keyboard shortcuts
    document.addEventListener('keydown', this.handleKeyboardShortcuts.bind(this));
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    document.removeEventListener('keydown', this.handleKeyboardShortcuts.bind(this));
  }

  private handleKeyboardShortcuts(event: KeyboardEvent) {
    // Alt + A = Open accessibility panel
    if (event.altKey && event.key === 'a') {
      event.preventDefault();
      this.togglePanel();
    }

    // Ctrl + Plus = Increase font size
    if (event.ctrlKey && event.key === '+') {
      event.preventDefault();
      this.increaseFontSize();
    }

    // Ctrl + Minus = Decrease font size
    if (event.ctrlKey && event.key === '-') {
      event.preventDefault();
      this.decreaseFontSize();
    }

    // Ctrl + Shift + C = Toggle contrast
    if (event.ctrlKey && event.shiftKey && event.key === 'C') {
      event.preventDefault();
      this.toggleContrast();
    }
  }

  togglePanel() {
    this.isOpen = !this.isOpen;
    this.accessibilityService.announce(
      this.isOpen ? 'Panneau d\'accessibilité ouvert' : 'Panneau d\'accessibilité fermé'
    );

    if (this.isOpen) {
      // Focus the first interactive element
      setTimeout(() => {
        const firstButton = document.querySelector('#accessibility-panel button') as HTMLElement;
        if (firstButton) {
          firstButton.focus();
        }
      }, 100);
    }
  }

  updateFontSize(fontSize: AccessibilitySettings['fontSize']) {
    this.accessibilityService.updateSettings({ fontSize });
    this.accessibilityService.announce(`Taille de police changée à ${this.getFontSizeLabel(fontSize)}`);
  }

  updateContrast(contrast: AccessibilitySettings['contrast']) {
    this.accessibilityService.updateSettings({ contrast });
    this.accessibilityService.announce(`Contraste changé à ${this.getContrastLabel(contrast)}`);
  }

  toggleReducedMotion() {
    const reducedMotion = !this.settings.reducedMotion;
    this.accessibilityService.updateSettings({ reducedMotion });
    this.accessibilityService.announce(
      reducedMotion ? 'Animations réduites activées' : 'Animations réduites désactivées'
    );
  }

  toggleScreenReaderMode() {
    const screenReaderMode = !this.settings.screenReaderMode;
    this.accessibilityService.updateSettings({ screenReaderMode });
    this.accessibilityService.announce(
      screenReaderMode ? 'Mode lecteur d\'écran activé' : 'Mode lecteur d\'écran désactivé'
    );
  }

  toggleKeyboardNavigation() {
    const keyboardNavigation = !this.settings.keyboardNavigation;
    this.accessibilityService.updateSettings({ keyboardNavigation });
    this.accessibilityService.announce(
      keyboardNavigation ? 'Navigation clavier activée' : 'Navigation clavier désactivée'
    );
  }

  toggleFocusIndicators() {
    const focusIndicators = !this.settings.focusIndicators;
    this.accessibilityService.updateSettings({ focusIndicators });
    this.accessibilityService.announce(
      focusIndicators ? 'Indicateurs de focus activés' : 'Indicateurs de focus désactivés'
    );
  }

  resetToDefaults() {
    const defaultSettings: AccessibilitySettings = {
      fontSize: 'medium',
      contrast: 'normal',
      reducedMotion: false,
      screenReaderMode: false,
      keyboardNavigation: true,
      focusIndicators: true
    };
    
    this.accessibilityService.updateSettings(defaultSettings);
    this.accessibilityService.announce('Paramètres d\'accessibilité réinitialisés');
  }

  // Keyboard shortcuts
  private increaseFontSize() {
    const sizes: AccessibilitySettings['fontSize'][] = ['small', 'medium', 'large', 'extra-large'];
    const currentIndex = sizes.indexOf(this.settings.fontSize);
    if (currentIndex < sizes.length - 1) {
      this.updateFontSize(sizes[currentIndex + 1]);
    }
  }

  private decreaseFontSize() {
    const sizes: AccessibilitySettings['fontSize'][] = ['small', 'medium', 'large', 'extra-large'];
    const currentIndex = sizes.indexOf(this.settings.fontSize);
    if (currentIndex > 0) {
      this.updateFontSize(sizes[currentIndex - 1]);
    }
  }

  private toggleContrast() {
    const contrasts: AccessibilitySettings['contrast'][] = ['normal', 'high', 'dark'];
    const currentIndex = contrasts.indexOf(this.settings.contrast);
    const nextIndex = (currentIndex + 1) % contrasts.length;
    this.updateContrast(contrasts[nextIndex]);
  }

  // Utility methods
  getFontSizeLabel(fontSize: AccessibilitySettings['fontSize']): string {
    return this.fontSizeOptions.find(option => option.value === fontSize)?.label || fontSize;
  }

  getContrastLabel(contrast: AccessibilitySettings['contrast']): string {
    return this.contrastOptions.find(option => option.value === contrast)?.label || contrast;
  }

  runAccessibilityCheck() {
    const report = this.accessibilityService.generateAccessibilityReport();
    this.accessibilityService.announce('Vérification d\'accessibilité terminée');
    console.log('Accessibility Report:', report);
  }

  // Template helper methods to avoid arrow functions in template
  getFontSizeDescription(): string {
    const option = this.fontSizeOptions.find(option => option.value === this.settings.fontSize);
    return option?.description || '';
  }

  getContrastDescription(): string {
    const option = this.contrastOptions.find(option => option.value === this.settings.contrast);
    return option?.description || '';
  }

  // Get panel position based on viewport
  getPanelPosition(): string {
    if (this.viewport.isMobile) {
      return 'fixed bottom-0 left-0 right-0';
    } else {
      return 'fixed top-20 right-4';
    }
  }

  // Get panel width based on viewport
  getPanelWidth(): string {
    if (this.viewport.isMobile) {
      return 'w-full';
    } else if (this.viewport.isTablet) {
      return 'w-96';
    } else {
      return 'w-80';
    }
  }
}