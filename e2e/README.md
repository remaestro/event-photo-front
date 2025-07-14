# Tests Visuels avec Selenium - Event Photo Platform

## 📋 Vue d'ensemble

Ce système de tests visuels utilise Selenium WebDriver pour automatiser les tests d'interface utilisateur et capturer des captures d'écran de votre application Angular Event Photo Platform.

## 🚀 Installation et Configuration

Les dépendances sont déjà installées. Voici ce qui a été configuré :

- **Selenium WebDriver** : Pour l'automatisation des navigateurs
- **ChromeDriver** : Pour les tests avec Google Chrome
- **Jest** : Framework de test pour exécuter les tests
- **TypeScript** : Support complet pour TypeScript

## 📁 Structure des fichiers

```
e2e/
├── screenshots/           # Captures d'écran générées
├── utils/
│   ├── webdriver-config.ts    # Configuration Selenium
│   └── visual-test-helper.ts  # Utilitaires pour tests visuels
├── visual-tests/
│   └── event-photo-visual.spec.ts  # Tests spécifiques à votre app
├── simple-test.ts         # Test simple pour vérifier la config
├── run-visual-tests.js    # Script d'orchestration
├── jest.setup.ts          # Configuration Jest
└── tsconfig.json          # Configuration TypeScript pour e2e
```

## 🎯 Commandes disponibles

### Tests de base
```bash
# Test simple pour vérifier la configuration
npm run e2e:visual:simple

# Exécuter tous les tests visuels
npm run e2e:visual

# Exécuter les tests en mode headless (sans interface)
npm run e2e:visual:headless

# Exécuter les tests et ouvrir le rapport
npm run e2e:visual:report
```

### Prérequis
- Votre application Angular doit être démarrée (`npm start`) sur http://localhost:4200
- Google Chrome doit être installé sur votre système

## 🧪 Types de tests disponibles

### 1. Tests de Pages
- **Page d'accueil** : Capture et validation de l'affichage
- **Authentification** : Processus de connexion/inscription
- **Scan de photos** : Interface de scan et résultats
- **Dashboard photographe** : Interface photographe
- **E-commerce** : Panier et processus de commande

### 2. Tests Responsive
- **Mobile** : 375x667px
- **Tablet** : 768x1024px  
- **Desktop** : 1440x900px
- **Large Desktop** : 1920x1080px

### 3. Tests d'Accessibilité
- **Contraste élevé** : Mode high contrast
- **Agrandissement** : Polices agrandies
- **Navigation clavier** : Tests de navigation

### 4. Tests d'Interaction
- **Formulaires** : Saisie et validation
- **Boutons** : Clics et états hover
- **Modales** : Ouverture et fermeture
- **Navigation** : Défilement et liens

## 📊 Rapports

Les tests génèrent automatiquement :
- **Captures d'écran** dans `e2e/screenshots/`
- **Rapport HTML** : `e2e/visual-test-report.html`
- **Logs détaillés** dans la console

## 🔧 Configuration avancée

### Modifier les navigateurs
```typescript
// Dans webdriver-config.ts
const config: WebDriverConfig = {
  browser: 'chrome', // ou 'firefox'
  headless: true,    // true pour CI/CD
  windowSize: { width: 1920, height: 1080 }
};
```

### Ajouter de nouveaux tests
```typescript
// Dans visual-tests/event-photo-visual.spec.ts
it('devrait tester ma nouvelle fonctionnalité', async () => {
  const driver = driverManager.getDriver();
  await driver.get(`${baseUrl}/ma-page`);
  
  const screenshotPath = await visualHelper.takeScreenshot({
    filename: 'ma-fonctionnalite.png'
  });
  
  expect(screenshotPath).toBeTruthy();
});
```

### Personnaliser les viewports
```typescript
const customViewports = [
  { width: 320, height: 568, name: 'iphone-se' },
  { width: 390, height: 844, name: 'iphone-12' },
  { width: 1536, height: 864, name: 'laptop' }
];
```

## 🐛 Dépannage

### Problèmes courants

1. **ChromeDriver introuvable**
   ```bash
   npm install chromedriver
   ```

2. **Application non accessible**
   - Vérifiez que `npm start` est lancé
   - Confirmez que http://localhost:4200 est accessible

3. **Timeout des tests**
   - Augmentez le timeout dans `jest.config.js`
   - Vérifiez la vitesse de votre connexion

4. **Captures d'écran vides**
   - Vérifiez que les éléments sont chargés
   - Ajoutez des attentes (`await driver.sleep()`)

## 📝 Bonnes pratiques

1. **Stabilité** : Ajoutez des attentes pour les éléments dynamiques
2. **Réutilisabilité** : Utilisez les méthodes helper pour les actions communes
3. **Maintenance** : Mettez à jour les sélecteurs si l'UI change
4. **Performance** : Utilisez le mode headless pour les tests automatisés
5. **Documentation** : Nommez clairement vos tests et captures

## 🚀 Intégration CI/CD

Pour intégrer dans votre pipeline CI/CD :

```yaml
# Exemple GitHub Actions
- name: Run Visual Tests
  run: |
    npm install
    npm start &
    sleep 30
    npm run e2e:visual:headless
```

## 📧 Support

En cas de problème :
1. Vérifiez la configuration dans `e2e/utils/webdriver-config.ts`
2. Consultez les logs dans la console
3. Examinez les captures d'écran générées
4. Testez avec le script simple : `npm run e2e:visual:simple`