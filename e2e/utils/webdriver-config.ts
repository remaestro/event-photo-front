import { Builder, WebDriver, Capabilities } from 'selenium-webdriver';
import chrome from 'selenium-webdriver/chrome';
import firefox from 'selenium-webdriver/firefox';
import * as path from 'path';

export interface WebDriverConfig {
  browser: 'chrome' | 'firefox';
  headless?: boolean;
  windowSize?: { width: number; height: number };
  timeout?: number;
}

export class WebDriverManager {
  private static instance: WebDriverManager;
  private driver: WebDriver | null = null;
  private config: WebDriverConfig = {
    browser: 'chrome',
    headless: process.env.HEADLESS === 'true',
    windowSize: { width: 1920, height: 1080 },
    timeout: 30000
  };

  static getInstance(): WebDriverManager {
    if (!WebDriverManager.instance) {
      WebDriverManager.instance = new WebDriverManager();
    }
    return WebDriverManager.instance;
  }

  async initialize(config?: WebDriverConfig): Promise<void> {
    if (config) {
      this.config = { ...this.config, ...config };
    }
    await this.createDriver(this.config);
  }

  async createDriver(config: WebDriverConfig): Promise<WebDriver> {
    const { browser, headless = false, windowSize = { width: 1920, height: 1080 }, timeout = 30000 } = config;

    let builder = new Builder();

    switch (browser) {
      case 'chrome':
        const chromeOptions = new chrome.Options();
        if (headless) {
          chromeOptions.addArguments('--headless');
        }
        chromeOptions.addArguments('--no-sandbox');
        chromeOptions.addArguments('--disable-dev-shm-usage');
        chromeOptions.addArguments('--disable-gpu');
        chromeOptions.addArguments('--disable-web-security');
        chromeOptions.addArguments('--allow-running-insecure-content');
        chromeOptions.addArguments(`--window-size=${windowSize.width},${windowSize.height}`);
        
        // Définir le chemin vers chromedriver installé via npm
        const service = new chrome.ServiceBuilder(path.resolve(__dirname, '../../node_modules/chromedriver/bin/chromedriver'));
        
        builder = builder
          .forBrowser('chrome')
          .setChromeOptions(chromeOptions)
          .setChromeService(service);
        break;

      case 'firefox':
        const firefoxOptions = new firefox.Options();
        if (headless) {
          firefoxOptions.addArguments('--headless');
        }
        firefoxOptions.addArguments(`--width=${windowSize.width}`);
        firefoxOptions.addArguments(`--height=${windowSize.height}`);
        builder = builder.forBrowser('firefox').setFirefoxOptions(firefoxOptions);
        break;

      default:
        throw new Error(`Navigateur non supporté: ${browser}`);
    }

    this.driver = await builder.build();
    await this.driver.manage().setTimeouts({ implicit: timeout });
    
    return this.driver;
  }

  async quit(): Promise<void> {
    if (this.driver) {
      await this.driver.quit();
      this.driver = null;
    }
  }

  async closeDriver(): Promise<void> {
    await this.quit();
  }

  async clearSession(): Promise<void> {
    if (this.driver) {
      try {
        await this.driver.manage().deleteAllCookies();
      } catch (error) {
        console.warn('Could not clear cookies:', error);
      }
      
      try {
        await this.driver.executeScript('window.localStorage.clear()');
      } catch (error) {
        console.warn('Could not clear localStorage:', error);
      }
      
      try {
        await this.driver.executeScript('window.sessionStorage.clear()');
      } catch (error) {
        console.warn('Could not clear sessionStorage:', error);
      }
    }
  }

  getDriver(): WebDriver {
    if (!this.driver) {
      throw new Error('Driver non initialisé. Appelez initialize() d\'abord.');
    }
    return this.driver;
  }
}