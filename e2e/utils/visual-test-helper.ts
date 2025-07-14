import { WebDriver, By, until, WebElement } from 'selenium-webdriver';
import { WebDriverManager } from './webdriver-config';
import { promises as fs } from 'fs';
import * as path from 'path';

export interface ScreenshotOptions {
  fullPage?: boolean;
  element?: WebElement;
  filename?: string;
  directory?: string;
  description?: string;
}

export interface VisualTestResult {
  testName: string;
  passed: boolean;
  screenshotPath: string;
  error?: string;
  timestamp: Date;
}

export class VisualTestHelper {
  private driverManager: WebDriverManager;
  private screenshotDir: string;

  constructor(driverManager: WebDriverManager, screenshotDir: string = './e2e/screenshots') {
    this.driverManager = driverManager;
    this.screenshotDir = screenshotDir;
  }

  private getDriver(): WebDriver {
    return this.driverManager.getDriver();
  }

  /**
   * Prend une capture d'écran de la page ou d'un élément spécifique
   */
  async takeScreenshot(options: ScreenshotOptions = {}): Promise<string> {
    const {
      fullPage = true,
      element,
      filename = `screenshot-${Date.now()}.png`,
      directory = this.screenshotDir,
      description = ''
    } = options;

    // Créer le dossier s'il n'existe pas
    await fs.mkdir(directory, { recursive: true });

    const filepath = path.join(directory, filename);

    try {
      const driver = this.getDriver();
      let screenshot: string;
      
      if (element) {
        // Capture d'un élément spécifique
        screenshot = await element.takeScreenshot();
      } else {
        // Capture de la page entière
        screenshot = await driver.takeScreenshot();
      }

      await fs.writeFile(filepath, screenshot, 'base64');
      console.log(`📸 Screenshot sauvegardée: ${filepath}${description ? ` - ${description}` : ''}`);
      
      return filepath;
    } catch (error) {
      throw new Error(`Erreur lors de la capture d'écran: ${error}`);
    }
  }

  /**
   * Attend qu'un élément soit visible avant de prendre une capture
   */
  async waitAndScreenshot(selector: string, options: ScreenshotOptions = {}): Promise<string> {
    const driver = this.getDriver();
    const element = await driver.wait(
      until.elementLocated(By.css(selector)),
      10000
    );
    
    await driver.wait(until.elementIsVisible(element), 10000);
    
    return await this.takeScreenshot({
      ...options,
      element: options.element || element
    });
  }

  /**
   * Compare deux captures d'écran (implémentation basique)
   */
  async compareScreenshots(baselinePath: string, currentPath: string): Promise<boolean> {
    try {
      const baseline = await fs.readFile(baselinePath);
      const current = await fs.readFile(currentPath);
      
      // Comparaison simple par taille de fichier
      // Pour une vraie comparaison visuelle, utilisez une librairie comme pixelmatch
      return baseline.length === current.length;
    } catch (error) {
      console.warn(`Erreur lors de la comparaison: ${error}`);
      return false;
    }
  }

  /**
   * Teste l'affichage responsive d'une page
   */
  async testResponsiveDisplay(url: string, viewports: Array<{width: number, height: number, name: string}>): Promise<VisualTestResult[]> {
    const results: VisualTestResult[] = [];
    const driver = this.getDriver();

    for (const viewport of viewports) {
      try {
        await driver.manage().window().setRect({
          width: viewport.width,
          height: viewport.height,
          x: 0,
          y: 0
        });

        await driver.get(url);
        await driver.sleep(2000); // Attendre le chargement

        const screenshotPath = await this.takeScreenshot({
          filename: `responsive-${viewport.name}-${viewport.width}x${viewport.height}.png`
        });

        results.push({
          testName: `Responsive ${viewport.name} (${viewport.width}x${viewport.height})`,
          passed: true,
          screenshotPath,
          timestamp: new Date()
        });
      } catch (error) {
        results.push({
          testName: `Responsive ${viewport.name} (${viewport.width}x${viewport.height})`,
          passed: false,
          screenshotPath: '',
          error: error instanceof Error ? error.message : String(error),
          timestamp: new Date()
        });
      }
    }

    return results;
  }

  /**
   * Teste l'affichage avec différents thèmes (clair/sombre)
   */
  async testThemeDisplay(url: string, themes: string[]): Promise<VisualTestResult[]> {
    const results: VisualTestResult[] = [];
    const driver = this.getDriver();

    for (const theme of themes) {
      try {
        await driver.get(url);
        
        // Simuler le changement de thème (adapter selon votre implémentation)
        await driver.executeScript(`
          document.body.classList.remove('light-theme', 'dark-theme');
          document.body.classList.add('${theme}-theme');
        `);

        await driver.sleep(1000); // Attendre l'application du thème

        const screenshotPath = await this.takeScreenshot({
          filename: `theme-${theme}.png`
        });

        results.push({
          testName: `Thème ${theme}`,
          passed: true,
          screenshotPath,
          timestamp: new Date()
        });
      } catch (error) {
        results.push({
          testName: `Thème ${theme}`,
          passed: false,
          screenshotPath: '',
          error: error instanceof Error ? error.message : String(error),
          timestamp: new Date()
        });
      }
    }

    return results;
  }

  /**
   * Teste les interactions utilisateur avec captures d'écran
   */
  async testUserInteraction(steps: Array<{action: string, selector?: string, value?: string, description: string}>): Promise<VisualTestResult[]> {
    const results: VisualTestResult[] = [];
    const driver = this.getDriver();

    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      try {
        switch (step.action) {
          case 'click':
            if (step.selector) {
              const element = await driver.findElement(By.css(step.selector));
              await element.click();
            }
            break;
          case 'input':
            if (step.selector && step.value) {
              const element = await driver.findElement(By.css(step.selector));
              await element.clear();
              await element.sendKeys(step.value);
            }
            break;
          case 'hover':
            if (step.selector) {
              const element = await driver.findElement(By.css(step.selector));
              await driver.actions().move({origin: element}).perform();
            }
            break;
          case 'scroll':
            await driver.executeScript('window.scrollTo(0, document.body.scrollHeight)');
            break;
        }

        await driver.sleep(1000); // Attendre l'effet de l'interaction

        const screenshotPath = await this.takeScreenshot({
          filename: `interaction-step-${i + 1}-${step.action}.png`
        });

        results.push({
          testName: `Étape ${i + 1}: ${step.description}`,
          passed: true,
          screenshotPath,
          timestamp: new Date()
        });
      } catch (error) {
        results.push({
          testName: `Étape ${i + 1}: ${step.description}`,
          passed: false,
          screenshotPath: '',
          error: error instanceof Error ? error.message : String(error),
          timestamp: new Date()
        });
      }
    }

    return results;
  }

  /**
   * Génère un rapport HTML des résultats de tests visuels
   */
  async generateReport(results: VisualTestResult[], outputPath: string = './e2e/visual-test-report.html'): Promise<void> {
    const html = `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Rapport de Tests Visuels</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background: #f5f5f5; padding: 20px; border-radius: 8px; }
        .test-result { margin: 20px 0; padding: 15px; border: 1px solid #ddd; border-radius: 8px; }
        .passed { border-left: 5px solid #4CAF50; }
        .failed { border-left: 5px solid #f44336; }
        .screenshot { max-width: 300px; margin: 10px 0; }
        .error { color: #f44336; font-style: italic; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Rapport de Tests Visuels</h1>
        <p>Généré le: ${new Date().toLocaleString('fr-FR')}</p>
        <p>Total des tests: ${results.length}</p>
        <p>Réussis: ${results.filter(r => r.passed).length}</p>
        <p>Échoués: ${results.filter(r => !r.passed).length}</p>
    </div>
    
    ${results.map(result => `
        <div class="test-result ${result.passed ? 'passed' : 'failed'}">
            <h3>${result.testName}</h3>
            <p>Status: ${result.passed ? '✅ Réussi' : '❌ Échoué'}</p>
            <p>Timestamp: ${result.timestamp.toLocaleString('fr-FR')}</p>
            ${result.screenshotPath ? `<img src="${result.screenshotPath}" alt="Screenshot" class="screenshot">` : ''}
            ${result.error ? `<p class="error">Erreur: ${result.error}</p>` : ''}
        </div>
    `).join('')}
</body>
</html>`;

    await fs.writeFile(outputPath, html);
    console.log(`📊 Rapport généré: ${outputPath}`);
  }
}