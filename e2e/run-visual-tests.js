#!/usr/bin/env node
const { execSync } = require('child_process');
const path = require('path');

console.log('🧪 Démarrage des tests visuels Event Photo Platform');

// Vérifier si l'application Angular est en cours d'exécution
async function checkAppRunning() {
  try {
    const { default: fetch } = await import('node-fetch');
    const response = await fetch('http://localhost:4200', { timeout: 3000 });
    return response.ok;
  } catch (error) {
    return false;
  }
}

async function runVisualTests() {
  const isAppRunning = await checkAppRunning();
  
  if (!isAppRunning) {
    console.log('⚠️  Application Angular non détectée sur http://localhost:4200');
    console.log('💡 Démarrez votre application avec: npm start');
    console.log('📸 Les tests continueront avec des sites externes...\n');
  } else {
    console.log('✅ Application Angular détectée sur http://localhost:4200\n');
  }

  try {
    // Exécuter les tests visuels avec Jest
    console.log('🏃‍♂️ Exécution des tests visuels...');
    execSync('npx jest e2e/visual-tests --testTimeout=60000 --verbose', {
      stdio: 'inherit',
      cwd: process.cwd()
    });
    
    console.log('\n✅ Tests visuels terminés avec succès!');
    console.log('📊 Consultez le rapport: e2e/visual-test-report.html');
    
  } catch (error) {
    console.error('\n❌ Erreur lors de l\'exécution des tests:', error.message);
    process.exit(1);
  }
}

runVisualTests();