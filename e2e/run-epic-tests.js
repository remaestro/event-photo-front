#!/usr/bin/env node

const { execSync } = require('child_process');
const path = require('path');

console.log('🎯 Lancement des tests visuels personnalisés - Event Photo Platform');
console.log('📋 Basé sur les User Stories - Épiques 1-8 et 10\n');

// Configuration des tests par épique
const epicTests = {
  'epic1': {
    name: 'Authentification et Gestion des Comptes',
    tests: ['US-001', 'US-002', 'US-003'],
    pattern: 'Epic 1: Authentification'
  },
  'epic2': {
    name: 'Recherche et Découverte d\'Événements',
    tests: ['US-004', 'US-005'],
    pattern: 'Epic 2: Recherche'
  },
  'epic3': {
    name: 'Reconnaissance Faciale et Scan',
    tests: ['US-006', 'US-007'],
    pattern: 'Epic 3: Reconnaissance Faciale'
  },
  'epic4': {
    name: 'Achat et Paiement',
    tests: ['US-008', 'US-009', 'US-010'],
    pattern: 'Epic 4: Achat et Paiement'
  },
  'epic5': {
    name: 'Gestion d\'Événements (Organisateur)',
    tests: ['US-011', 'US-012', 'US-013', 'US-014'],
    pattern: 'Epic 5: Gestion'
  },
  'epic6': {
    name: 'Administration et Modération',
    tests: ['US-015', 'US-016', 'US-017', 'US-018'],
    pattern: 'Epic 6: Administration'
  },
  'epic7': {
    name: 'Statistiques et Rapports',
    tests: ['US-019', 'US-020'],
    pattern: 'Epic 7: Statistiques'
  },
  'epic8': {
    name: 'Gestion Financière',
    tests: ['US-021', 'US-022'],
    pattern: 'Epic 8: Gestion Financière'
  },
  'epic10': {
    name: 'Expérience Mobile et Accessibilité',
    tests: ['US-025', 'US-026'],
    pattern: 'Epic 10: Mobile'
  }
};

// Fonction pour exécuter les tests d'une épique spécifique
function runEpicTests(epicKey) {
  const epic = epicTests[epicKey];
  if (!epic) {
    console.error(`❌ Épique '${epicKey}' non trouvée`);
    return;
  }

  console.log(`\n🚀 Exécution des tests pour l'épique: ${epic.name}`);
  console.log(`📝 User Stories: ${epic.tests.join(', ')}`);
  
  try {
    const command = `npm run test:visual -- --testNamePattern="${epic.pattern}"`;
    console.log(`⚡ Commande: ${command}\n`);
    
    execSync(command, { 
      stdio: 'inherit',
      cwd: process.cwd()
    });
    
    console.log(`✅ Tests de l'épique ${epicKey} terminés avec succès\n`);
  } catch (error) {
    console.error(`❌ Erreur lors de l'exécution des tests pour l'épique ${epicKey}:`, error.message);
  }
}

// Fonction pour exécuter tous les tests
function runAllTests() {
  console.log('🔄 Exécution de tous les tests visuels personnalisés\n');
  
  try {
    const command = 'npm run test:visual';
    console.log(`⚡ Commande: ${command}\n`);
    
    execSync(command, { 
      stdio: 'inherit',
      cwd: process.cwd()
    });
    
    console.log('✅ Tous les tests visuels terminés avec succès');
  } catch (error) {
    console.error('❌ Erreur lors de l\'exécution des tests:', error.message);
  }
}

// Fonction pour exécuter les tests responsifs uniquement
function runResponsiveTests() {
  console.log('📱 Exécution des tests responsifs (Epic 10)\n');
  
  try {
    const command = 'npm run test:visual -- --testNamePattern="Epic 10.*Mobile|Tests responsifs"';
    console.log(`⚡ Commande: ${command}\n`);
    
    execSync(command, { 
      stdio: 'inherit',
      cwd: process.cwd()
    });
    
    console.log('✅ Tests responsifs terminés avec succès');
  } catch (error) {
    console.error('❌ Erreur lors de l\'exécution des tests responsifs:', error.message);
  }
}

// Fonction pour exécuter les tests d'accessibilité uniquement
function runAccessibilityTests() {
  console.log('♿ Exécution des tests d\'accessibilité\n');
  
  try {
    const command = 'npm run test:visual -- --testNamePattern="Accessibilité"';
    console.log(`⚡ Commande: ${command}\n`);
    
    execSync(command, { 
      stdio: 'inherit',
      cwd: process.cwd()
    });
    
    console.log('✅ Tests d\'accessibilité terminés avec succès');
  } catch (error) {
    console.error('❌ Erreur lors de l\'exécution des tests d\'accessibilité:', error.message);
  }
}

// Fonction pour afficher l'aide
function showHelp() {
  console.log('📖 Aide - Script de tests visuels Event Photo Platform\n');
  
  console.log('Usage:');
  console.log('  node run-epic-tests.js [commande] [options]\n');
  
  console.log('Commandes disponibles:');
  console.log('  all              Exécuter tous les tests visuels');
  console.log('  responsive       Exécuter uniquement les tests responsifs');
  console.log('  accessibility    Exécuter uniquement les tests d\'accessibilité');
  console.log('  epic<N>          Exécuter les tests d\'une épique spécifique (ex: epic1, epic2, etc.)');
  console.log('  help             Afficher cette aide\n');
  
  console.log('Épiques disponibles:');
  Object.entries(epicTests).forEach(([key, epic]) => {
    console.log(`  ${key.padEnd(8)} ${epic.name} (${epic.tests.join(', ')})`);
  });
  
  console.log('\nExemples:');
  console.log('  node run-epic-tests.js epic1        # Tests d\'authentification');
  console.log('  node run-epic-tests.js epic10       # Tests mobile et accessibilité');
  console.log('  node run-epic-tests.js all          # Tous les tests');
  console.log('  node run-epic-tests.js responsive   # Tests responsifs uniquement');
}

// Fonction pour générer un rapport des tests
function generateTestReport() {
  console.log('📊 Génération du rapport de tests\n');
  
  const screenshotsDir = path.join(process.cwd(), 'e2e', 'screenshots');
  
  try {
    const fs = require('fs');
    const files = fs.readdirSync(screenshotsDir);
    
    console.log(`📸 ${files.length} captures d'écran générées:`);
    
    Object.entries(epicTests).forEach(([epicKey, epic]) => {
      const epicFiles = files.filter(file => file.includes(epicKey));
      if (epicFiles.length > 0) {
        console.log(`\n${epic.name}:`);
        epicFiles.forEach(file => console.log(`  ✓ ${file}`));
      }
    });
    
  } catch (error) {
    console.error('❌ Erreur lors de la génération du rapport:', error.message);
  }
}

// Parser les arguments de ligne de commande
const args = process.argv.slice(2);
const command = args[0] || 'help';

console.log(`Event Photo Platform - Tests Visuels Personnalisés`);
console.log(`=================================================\n`);

switch (command) {
  case 'all':
    runAllTests();
    break;
    
  case 'responsive':
    runResponsiveTests();
    break;
    
  case 'accessibility':
    runAccessibilityTests();
    break;
    
  case 'report':
    generateTestReport();
    break;
    
  case 'help':
  case '--help':
  case '-h':
    showHelp();
    break;
    
  default:
    // Vérifier si c'est une épique spécifique
    if (command.startsWith('epic') && epicTests[command]) {
      runEpicTests(command);
    } else {
      console.error(`❌ Commande '${command}' non reconnue`);
      console.log('💡 Utilisez "help" pour voir les commandes disponibles\n');
      showHelp();
      process.exit(1);
    }
    break;
}

// Ajouter une option pour nettoyer les anciens screenshots
if (args.includes('--clean')) {
  console.log('🧹 Nettoyage des anciens screenshots...');
  try {
    const fs = require('fs');
    const screenshotsDir = path.join(process.cwd(), 'e2e', 'screenshots');
    const files = fs.readdirSync(screenshotsDir);
    
    files.forEach(file => {
      if (file.startsWith('epic') || file.startsWith('navigation-') || file.startsWith('page-')) {
        fs.unlinkSync(path.join(screenshotsDir, file));
        console.log(`🗑️ Supprimé: ${file}`);
      }
    });
    
    console.log('✅ Nettoyage terminé\n');
  } catch (error) {
    console.error('❌ Erreur lors du nettoyage:', error.message);
  }
}