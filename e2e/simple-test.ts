import { WebDriverManager, WebDriverConfig } from './utils/webdriver-config';
import { VisualTestHelper } from './utils/visual-test-helper';

async function runSimpleTest() {
  const config: WebDriverConfig = {
    browser: 'chrome',
    headless: false,
    windowSize: { width: 1280, height: 720 }
  };

  const driverManager = WebDriverManager.getInstance();
  
  try {
    console.log('🚀 Démarrage du test visuel simple...');
    
    const driver = await driverManager.createDriver(config);
    const visualHelper = new VisualTestHelper(driver);

    // Test simple : capture de Google
    await driver.get('https://www.google.com');
    await driver.sleep(2000);
    
    const screenshotPath = await visualHelper.takeScreenshot({
      filename: 'test-google.png'
    });
    
    console.log('✅ Capture d\'écran réussie:', screenshotPath);
    
    // Test de votre application locale (si elle tourne)
    try {
      await driver.get('http://localhost:4200');
      await driver.sleep(3000);
      
      const appScreenshot = await visualHelper.takeScreenshot({
        filename: 'test-local-app.png'
      });
      
      console.log('✅ Capture de l\'application locale réussie:', appScreenshot);
    } catch (error) {
      console.log('⚠️ Application locale non disponible (démarrez avec: npm start)');
    }
    
  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await driverManager.closeDriver();
    console.log('🏁 Test terminé');
  }
}

runSimpleTest();