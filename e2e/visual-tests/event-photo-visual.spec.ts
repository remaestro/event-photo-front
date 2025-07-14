import { WebDriverManager } from '../utils/webdriver-config';
import { VisualTestHelper } from '../utils/visual-test-helper';

describe('Event Photo Platform - Tests Visuels par Épique', () => {
  let driverManager: WebDriverManager;
  let visualHelper: VisualTestHelper;
  const baseUrl = 'http://localhost:4200';

  beforeAll(async () => {
    driverManager = new WebDriverManager();
    await driverManager.initialize();
    visualHelper = new VisualTestHelper(driverManager);
  });

  afterAll(async () => {
    await driverManager.quit();
  });

  beforeEach(async () => {
    await driverManager.clearSession();
  });

  // =============================================================================
  // EPIC 1: AUTHENTIFICATION ET GESTION DES COMPTES (US-001, US-002, US-003)
  // =============================================================================
  describe('Epic 1: Authentification et Gestion des Comptes', () => {
    
    it('US-001: Interface d\'inscription utilisateur', async () => {
      const driver = driverManager.getDriver();
      await driver.get(`${baseUrl}/auth/register`);
      await driver.sleep(2000);

      // Test responsive - Mobile, Tablet, Desktop
      const viewports = [
        { width: 375, height: 667, name: 'mobile' },
        { width: 768, height: 1024, name: 'tablet' },
        { width: 1440, height: 900, name: 'desktop' }
      ];

      for (const viewport of viewports) {
        await driver.manage().window().setRect(viewport);
        await driver.sleep(500);
        
        const screenshotPath = await visualHelper.takeScreenshot({
          filename: `epic1-us001-inscription-${viewport.name}.png`,
          description: `Interface d'inscription - ${viewport.name}`
        });
        
        expect(screenshotPath).toBeTruthy();
      }
    });

    it('US-002: Interface de connexion utilisateur', async () => {
      const driver = driverManager.getDriver();
      await driver.get(`${baseUrl}/auth/login`);
      await driver.sleep(2000);

      // Test de l'interface de connexion
      const screenshotPath = await visualHelper.takeScreenshot({
        filename: 'epic1-us002-connexion.png',
        description: 'Interface de connexion utilisateur'
      });
      
      expect(screenshotPath).toBeTruthy();
    });

    it('US-002: Sélection de rôle après connexion', async () => {
      const driver = driverManager.getDriver();
      await driver.get(`${baseUrl}/auth/role-selection`);
      await driver.sleep(2000);

      const screenshotPath = await visualHelper.takeScreenshot({
        filename: 'epic1-us002-role-selection.png',
        description: 'Sélection de rôle utilisateur'
      });
      
      expect(screenshotPath).toBeTruthy();
    });

    it('US-003: Interface de gestion du profil', async () => {
      const driver = driverManager.getDriver();
      
      // Test pour différents rôles
      const roles = ['client', 'photographer', 'organizer'];
      
      for (const role of roles) {
        await driver.get(`${baseUrl}/${role}/profile`);
        await driver.sleep(2000);
        
        const screenshotPath = await visualHelper.takeScreenshot({
          filename: `epic1-us003-profil-${role}.png`,
          description: `Interface de profil - ${role}`
        });
        
        expect(screenshotPath).toBeTruthy();
      }
    });
  });

  // =============================================================================
  // EPIC 2: RECHERCHE ET DÉCOUVERTE D'ÉVÉNEMENTS (US-004, US-005)
  // =============================================================================
  describe('Epic 2: Recherche et Découverte d\'Événements', () => {
    
    it('US-004: Interface de recherche d\'événements', async () => {
      const driver = driverManager.getDriver();
      await driver.get(`${baseUrl}/events-search`);
      await driver.sleep(2000);

      const screenshotPath = await visualHelper.takeScreenshot({
        filename: 'epic2-us004-recherche-evenements.png',
        description: 'Interface de recherche d\'événements'
      });
      
      expect(screenshotPath).toBeTruthy();
    });

    it('US-004: Page principale d\'événements', async () => {
      const driver = driverManager.getDriver();
      await driver.get(`${baseUrl}/events`);
      await driver.sleep(2000);

      const screenshotPath = await visualHelper.takeScreenshot({
        filename: 'epic2-us004-liste-evenements.png',
        description: 'Liste des événements disponibles'
      });
      
      expect(screenshotPath).toBeTruthy();
    });

    it('US-005: Page de détail d\'événement public', async () => {
      const driver = driverManager.getDriver();
      await driver.get(`${baseUrl}/event-detail/sample-event`);
      await driver.sleep(2000);

      const screenshotPath = await visualHelper.takeScreenshot({
        filename: 'epic2-us005-detail-evenement.png',
        description: 'Détail d\'un événement public'
      });
      
      expect(screenshotPath).toBeTruthy();
    });

    it('US-005: Page événement public avec aperçu photos', async () => {
      const driver = driverManager.getDriver();
      await driver.get(`${baseUrl}/event-public/sample-event`);
      await driver.sleep(2000);

      const screenshotPath = await visualHelper.takeScreenshot({
        filename: 'epic2-us005-evenement-public.png',
        description: 'Événement public avec aperçu photos'
      });
      
      expect(screenshotPath).toBeTruthy();
    });
  });

  // =============================================================================
  // EPIC 3: RECONNAISSANCE FACIALE ET SCAN (US-006, US-007)
  // =============================================================================
  describe('Epic 3: Reconnaissance Faciale et Scan', () => {
    
    it('US-006: Interface de scan facial', async () => {
      const driver = driverManager.getDriver();
      await driver.get(`${baseUrl}/scan`);
      await driver.sleep(2000);

      const screenshotPath = await visualHelper.takeScreenshot({
        filename: 'epic3-us006-scan-facial.png',
        description: 'Interface de scan facial'
      });
      
      expect(screenshotPath).toBeTruthy();
    });

    it('US-006: Interface de scan - Version mobile', async () => {
      const driver = driverManager.getDriver();
      await driver.manage().window().setRect({ width: 375, height: 667 });
      await driver.get(`${baseUrl}/scan`);
      await driver.sleep(2000);

      const screenshotPath = await visualHelper.takeScreenshot({
        filename: 'epic3-us006-scan-mobile.png',
        description: 'Interface de scan facial - Mobile'
      });
      
      expect(screenshotPath).toBeTruthy();
    });

    it('US-007: Page de résultats de scan', async () => {
      const driver = driverManager.getDriver();
      await driver.get(`${baseUrl}/client/scan-results`);
      await driver.sleep(2000);

      const screenshotPath = await visualHelper.takeScreenshot({
        filename: 'epic3-us007-resultats-scan.png',
        description: 'Résultats de scan facial'
      });
      
      expect(screenshotPath).toBeTruthy();
    });
  });

  // =============================================================================
  // EPIC 4: ACHAT ET PAIEMENT (US-008, US-009, US-010)
  // =============================================================================
  describe('Epic 4: Achat et Paiement', () => {
    
    it('US-008: Interface de gestion du panier', async () => {
      const driver = driverManager.getDriver();
      await driver.get(`${baseUrl}/client/cart`);
      await driver.sleep(2000);

      const screenshotPath = await visualHelper.takeScreenshot({
        filename: 'epic4-us008-panier.png',
        description: 'Interface de gestion du panier'
      });
      
      expect(screenshotPath).toBeTruthy();
    });

    it('US-009: Interface de processus de paiement', async () => {
      const driver = driverManager.getDriver();
      await driver.get(`${baseUrl}/client/checkout`);
      await driver.sleep(2000);

      const screenshotPath = await visualHelper.takeScreenshot({
        filename: 'epic4-us009-checkout.png',
        description: 'Interface de processus de paiement'
      });
      
      expect(screenshotPath).toBeTruthy();
    });

    it('US-009: Page de confirmation de commande', async () => {
      const driver = driverManager.getDriver();
      await driver.get(`${baseUrl}/client/order-confirmation`);
      await driver.sleep(2000);

      const screenshotPath = await visualHelper.takeScreenshot({
        filename: 'epic4-us009-confirmation.png',
        description: 'Page de confirmation de commande'
      });
      
      expect(screenshotPath).toBeTruthy();
    });

    it('US-010: Historique des achats', async () => {
      const driver = driverManager.getDriver();
      await driver.get(`${baseUrl}/client/my-purchases`);
      await driver.sleep(2000);

      const screenshotPath = await visualHelper.takeScreenshot({
        filename: 'epic4-us010-historique-achats.png',
        description: 'Historique des achats client'
      });
      
      expect(screenshotPath).toBeTruthy();
    });
  });

  // =============================================================================
  // EPIC 5: GESTION D'ÉVÉNEMENTS ORGANISATEUR (US-011, US-012, US-013, US-014)
  // =============================================================================
  describe('Epic 5: Gestion d\'Événements (Organisateur)', () => {
    
    it('US-011: Interface de création d\'événement', async () => {
      const driver = driverManager.getDriver();
      await driver.get(`${baseUrl}/organizer/events/create`);
      await driver.sleep(2000);

      const screenshotPath = await visualHelper.takeScreenshot({
        filename: 'epic5-us011-creation-evenement.png',
        description: 'Interface de création d\'événement'
      });
      
      expect(screenshotPath).toBeTruthy();
    });

    it('US-012: Interface de gestion des bénéficiaires', async () => {
      const driver = driverManager.getDriver();
      await driver.get(`${baseUrl}/organizer/beneficiaries`);
      await driver.sleep(2000);

      const screenshotPath = await visualHelper.takeScreenshot({
        filename: 'epic5-us012-beneficiaires.png',
        description: 'Interface de gestion des bénéficiaires'
      });
      
      expect(screenshotPath).toBeTruthy();
    });

    it('US-013: Interface d\'upload de photos', async () => {
      const driver = driverManager.getDriver();
      await driver.get(`${baseUrl}/photographer/upload`);
      await driver.sleep(2000);

      const screenshotPath = await visualHelper.takeScreenshot({
        filename: 'epic5-us013-upload-photos.png',
        description: 'Interface d\'upload de photos'
      });
      
      expect(screenshotPath).toBeTruthy();
    });

    it('US-013: Gestion des photos organisateur', async () => {
      const driver = driverManager.getDriver();
      await driver.get(`${baseUrl}/organizer/photos`);
      await driver.sleep(2000);

      const screenshotPath = await visualHelper.takeScreenshot({
        filename: 'epic5-us013-gestion-photos.png',
        description: 'Gestion des photos organisateur'
      });
      
      expect(screenshotPath).toBeTruthy();
    });

    it('US-014: Dashboard organisateur', async () => {
      const driver = driverManager.getDriver();
      await driver.get(`${baseUrl}/organizer/dashboard`);
      await driver.sleep(2000);

      const screenshotPath = await visualHelper.takeScreenshot({
        filename: 'epic5-us014-dashboard-organisateur.png',
        description: 'Dashboard organisateur'
      });
      
      expect(screenshotPath).toBeTruthy();
    });
  });

  // =============================================================================
  // EPIC 6: ADMINISTRATION ET MODÉRATION (US-015, US-016, US-017, US-018)
  // =============================================================================
  describe('Epic 6: Administration et Modération', () => {
    
    it('US-015: Dashboard administrateur', async () => {
      const driver = driverManager.getDriver();
      await driver.get(`${baseUrl}/admin/dashboard`);
      await driver.sleep(2000);

      const screenshotPath = await visualHelper.takeScreenshot({
        filename: 'epic6-us015-dashboard-admin.png',
        description: 'Dashboard administrateur'
      });
      
      expect(screenshotPath).toBeTruthy();
    });

    it('US-016: Interface de gestion des utilisateurs', async () => {
      const driver = driverManager.getDriver();
      await driver.get(`${baseUrl}/admin/users`);
      await driver.sleep(2000);

      const screenshotPath = await visualHelper.takeScreenshot({
        filename: 'epic6-us016-gestion-utilisateurs.png',
        description: 'Interface de gestion des utilisateurs'
      });
      
      expect(screenshotPath).toBeTruthy();
    });

    it('US-017: Interface de modération du contenu', async () => {
      const driver = driverManager.getDriver();
      await driver.get(`${baseUrl}/admin/moderation`);
      await driver.sleep(2000);

      const screenshotPath = await visualHelper.takeScreenshot({
        filename: 'epic6-us017-moderation-contenu.png',
        description: 'Interface de modération du contenu'
      });
      
      expect(screenshotPath).toBeTruthy();
    });

    it('US-018: Gestion des événements admin', async () => {
      const driver = driverManager.getDriver();
      await driver.get(`${baseUrl}/admin/events`);
      await driver.sleep(2000);

      const screenshotPath = await visualHelper.takeScreenshot({
        filename: 'epic6-us018-gestion-evenements-admin.png',
        description: 'Gestion des événements par admin'
      });
      
      expect(screenshotPath).toBeTruthy();
    });
  });

  // =============================================================================
  // EPIC 7: STATISTIQUES ET RAPPORTS (US-019, US-020)
  // =============================================================================
  describe('Epic 7: Statistiques et Rapports', () => {
    
    it('US-019: Statistiques organisateur', async () => {
      const driver = driverManager.getDriver();
      await driver.get(`${baseUrl}/organizer/statistics`);
      await driver.sleep(2000);

      const screenshotPath = await visualHelper.takeScreenshot({
        filename: 'epic7-us019-statistiques-organisateur.png',
        description: 'Statistiques organisateur'
      });
      
      expect(screenshotPath).toBeTruthy();
    });

    it('US-020: Analytics administrateur', async () => {
      const driver = driverManager.getDriver();
      await driver.get(`${baseUrl}/admin/statistics`);
      await driver.sleep(2000);

      const screenshotPath = await visualHelper.takeScreenshot({
        filename: 'epic7-us020-analytics-admin.png',
        description: 'Analytics administrateur'
      });
      
      expect(screenshotPath).toBeTruthy();
    });
  });

  // =============================================================================
  // EPIC 8: GESTION FINANCIÈRE (US-021, US-022)
  // =============================================================================
  describe('Epic 8: Gestion Financière', () => {
    
    it('US-021: Portefeuille organisateur', async () => {
      const driver = driverManager.getDriver();
      await driver.get(`${baseUrl}/photographer/wallet`);
      await driver.sleep(2000);

      const screenshotPath = await visualHelper.takeScreenshot({
        filename: 'epic8-us021-portefeuille-organisateur.png',
        description: 'Portefeuille organisateur'
      });
      
      expect(screenshotPath).toBeTruthy();
    });

    it('US-022: Interface de partage des revenus', async () => {
      const driver = driverManager.getDriver();
      await driver.get(`${baseUrl}/organizer/beneficiaries/revenue-sharing`);
      await driver.sleep(2000);

      const screenshotPath = await visualHelper.takeScreenshot({
        filename: 'epic8-us022-partage-revenus.png',
        description: 'Interface de partage des revenus'
      });
      
      expect(screenshotPath).toBeTruthy();
    });
  });

  // =============================================================================
  // EPIC 10: EXPÉRIENCE MOBILE ET ACCESSIBILITÉ (US-025, US-026)
  // =============================================================================
  describe('Epic 10: Expérience Mobile et Accessibilité', () => {
    
    it('US-025: Tests responsifs - Page d\'accueil', async () => {
      const driver = driverManager.getDriver();
      
      const mobileViewports = [
        { width: 320, height: 568, name: 'iphone-se' },
        { width: 375, height: 667, name: 'iphone-8' },
        { width: 390, height: 844, name: 'iphone-12' },
        { width: 414, height: 896, name: 'iphone-11-pro-max' }
      ];

      for (const viewport of mobileViewports) {
        await driver.manage().window().setRect(viewport);
        await driver.get(`${baseUrl}/home`);
        await driver.sleep(2000);
        
        const screenshotPath = await visualHelper.takeScreenshot({
          filename: `epic10-us025-mobile-home-${viewport.name}.png`,
          description: `Page d'accueil - ${viewport.name}`
        });
        
        expect(screenshotPath).toBeTruthy();
      }
    });

    it('US-025: Tests responsifs - Interface de scan mobile', async () => {
      const driver = driverManager.getDriver();
      await driver.manage().window().setRect({ width: 375, height: 667 });
      await driver.get(`${baseUrl}/scan`);
      await driver.sleep(2000);

      const screenshotPath = await visualHelper.takeScreenshot({
        filename: 'epic10-us025-scan-mobile-optimized.png',
        description: 'Interface de scan optimisée mobile'
      });
      
      expect(screenshotPath).toBeTruthy();
    });

    it('US-026: Tests d\'accessibilité - Contraste élevé', async () => {
      const driver = driverManager.getDriver();
      await driver.get(`${baseUrl}/home`);
      
      // Simuler le mode contraste élevé
      await driver.executeScript(`
        document.body.style.filter = 'contrast(2) brightness(0.8)';
        document.body.classList.add('high-contrast');
      `);
      
      await driver.sleep(2000);

      const screenshotPath = await visualHelper.takeScreenshot({
        filename: 'epic10-us026-accessibilite-contraste.png',
        description: 'Test d\'accessibilité - Contraste élevé'
      });
      
      expect(screenshotPath).toBeTruthy();
    });

    it('US-026: Tests d\'accessibilité - Navigation clavier', async () => {
      const driver = driverManager.getDriver();
      await driver.get(`${baseUrl}/home`);
      
      // Simuler la navigation clavier en mettant le focus visible
      await driver.executeScript(`
        document.body.style.outline = '2px solid #0066cc';
        document.body.classList.add('keyboard-navigation');
        const style = document.createElement('style');
        style.textContent = '*:focus { outline: 2px solid #0066cc !important; }';
        document.head.appendChild(style);
      `);
      
      await driver.sleep(2000);

      const screenshotPath = await visualHelper.takeScreenshot({
        filename: 'epic10-us026-accessibilite-clavier.png',
        description: 'Test d\'accessibilité - Navigation clavier'
      });
      
      expect(screenshotPath).toBeTruthy();
    });

    it('US-026: Tests d\'accessibilité - Texte agrandi', async () => {
      const driver = driverManager.getDriver();
      await driver.get(`${baseUrl}/home`);
      
      // Simuler l'agrandissement du texte
      await driver.executeScript(`
        document.body.style.fontSize = '150%';
        document.body.classList.add('large-text');
      `);
      
      await driver.sleep(2000);

      const screenshotPath = await visualHelper.takeScreenshot({
        filename: 'epic10-us026-accessibilite-texte-agrandi.png',
        description: 'Test d\'accessibilité - Texte agrandi'
      });
      
      expect(screenshotPath).toBeTruthy();
    });
  });

  // =============================================================================
  // TESTS TRANSVERSAUX - NAVIGATION ET FLUX UTILISATEUR
  // =============================================================================
  describe('Tests Transversaux - Navigation et Flux', () => {
    
    it('Navigation principale - Toutes les pages', async () => {
      const driver = driverManager.getDriver();
      
      const mainPages = [
        { url: '/home', name: 'accueil' },
        { url: '/events', name: 'evenements' },
        { url: '/how-it-works', name: 'comment-ca-marche' },
        { url: '/support', name: 'support' },
        { url: '/terms', name: 'conditions' },
        { url: '/privacy', name: 'confidentialite' }
      ];

      for (const page of mainPages) {
        await driver.get(`${baseUrl}${page.url}`);
        await driver.sleep(2000);
        
        const screenshotPath = await visualHelper.takeScreenshot({
          filename: `navigation-${page.name}.png`,
          description: `Page ${page.name}`
        });
        
        expect(screenshotPath).toBeTruthy();
      }
    });

    it('Flux utilisateur - Processus complet scan-achat', async () => {
      const driver = driverManager.getDriver();
      
      const userFlow = [
        { url: '/events-search', name: 'recherche' },
        { url: '/event-public/sample', name: 'evenement-public' },
        { url: '/scan', name: 'scan-facial' },
        { url: '/client/scan-results', name: 'resultats' },
        { url: '/client/cart', name: 'panier' },
        { url: '/client/checkout', name: 'paiement' }
      ];

      for (const step of userFlow) {
        await driver.get(`${baseUrl}${step.url}`);
        await driver.sleep(2000);
        
        const screenshotPath = await visualHelper.takeScreenshot({
          filename: `flux-utilisateur-${step.name}.png`,
          description: `Flux utilisateur - ${step.name}`
        });
        
        expect(screenshotPath).toBeTruthy();
      }
    });

    it('Test de performance - Chargement des pages', async () => {
      const driver = driverManager.getDriver();
      
      const performancePages = [
        '/home',
        '/events',
        '/scan',
        '/organizer/dashboard',
        '/admin/dashboard'
      ];

      for (const page of performancePages) {
        const startTime = Date.now();
        await driver.get(`${baseUrl}${page}`);
        await driver.sleep(3000);
        const loadTime = Date.now() - startTime;
        
        const screenshotPath = await visualHelper.takeScreenshot({
          filename: `performance-${page.replace(/\//g, '-')}.png`,
          description: `Performance page ${page} - ${loadTime}ms`
        });
        
        expect(screenshotPath).toBeTruthy();
        expect(loadTime).toBeLessThan(10000); // Moins de 10 secondes
      }
    });
  });
});