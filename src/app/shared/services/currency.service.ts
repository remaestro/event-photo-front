import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';

export interface CurrencyConfig {
  code: string;
  symbol: string;
  locale: string;
  defaultPhotoPrice: number;
}

export interface CurrencyOption {
  code: string;
  name: string;
  symbol: string;
  locale: string;
  defaultPrice: number;
  flag: string; // Emoji du drapeau
}

@Injectable({
  providedIn: 'root'
})
export class CurrencyService {
  private config: CurrencyConfig = environment.currency || {
    code: 'EUR',
    symbol: '€',
    locale: 'fr-FR',
    defaultPhotoPrice: 5.99
  };

  // Liste des devises supportées
  private readonly supportedCurrencies: CurrencyOption[] = [
    {
      code: 'EUR',
      name: 'Euro',
      symbol: '€',
      locale: 'fr-FR',
      defaultPrice: 5.99,
      flag: '🇪🇺'
    },
    {
      code: 'USD',
      name: 'Dollar américain',
      symbol: '$',
      locale: 'en-US',
      defaultPrice: 6.99,
      flag: '🇺🇸'
    },
    {
      code: 'GBP',
      name: 'Livre sterling',
      symbol: '£',
      locale: 'en-GB',
      defaultPrice: 4.99,
      flag: '🇬🇧'
    },
    {
      code: 'CHF',
      name: 'Franc suisse',
      symbol: 'CHF',
      locale: 'de-CH',
      defaultPrice: 6.49,
      flag: '🇨🇭'
    },
    {
      code: 'CAD',
      name: 'Dollar canadien',
      symbol: 'CAD$',
      locale: 'en-CA',
      defaultPrice: 8.99,
      flag: '🇨🇦'
    },
    {
      code: 'XOF',
      name: 'Franc CFA (BCEAO)',
      symbol: 'CFA',
      locale: 'fr-SN',
      defaultPrice: 3500,
      flag: '🌍'
    }
  ];

  formatCurrency(amount: number, currencyCode?: string): string {
    const currency = currencyCode || this.config.code;
    const currencyOption = this.supportedCurrencies.find(c => c.code === currency);
    const locale = currencyOption?.locale || this.config.locale;
    
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency
    }).format(amount);
  }

  formatPrice(amount: number, currencyCode?: string): string {
    return this.formatCurrency(amount, currencyCode);
  }

  getCurrencySymbol(): string {
    return this.config.symbol;
  }

  getCurrencyCode(): string {
    return this.config.code;
  }

  getDefaultPhotoPrice(): number {
    return this.config.defaultPhotoPrice;
  }

  // Nouvelles méthodes pour le sélecteur de devise
  getSupportedCurrencies(): CurrencyOption[] {
    return this.supportedCurrencies;
  }

  getCurrencyByCode(code: string): CurrencyOption | undefined {
    return this.supportedCurrencies.find(currency => currency.code === code);
  }

  getDefaultPriceForCurrency(currencyCode: string): number {
    const currency = this.getCurrencyByCode(currencyCode);
    return currency?.defaultPrice || this.config.defaultPhotoPrice;
  }

  // Pour supporter d'autres devises à l'avenir
  setCurrency(config: Partial<CurrencyConfig>): void {
    this.config = { ...this.config, ...config };
  }

  // Convertir un prix d'une devise à une autre (approximation simple)
  convertPrice(amount: number, fromCurrency: string, toCurrency: string): number {
    if (fromCurrency === toCurrency) return amount;
    
    // Taux de change approximatifs (en production, utiliser une vraie API de change)
    const exchangeRates: { [key: string]: number } = {
      'EUR_USD': 1.10,
      'EUR_GBP': 0.85,
      'EUR_CHF': 1.08,
      'EUR_CAD': 1.45,
      'EUR_XOF': 655.957,
      'USD_EUR': 0.91,
      'USD_GBP': 0.77,
      'USD_CHF': 0.98,
      'USD_CAD': 1.32,
      'USD_XOF': 596.32,
      'GBP_EUR': 1.18,
      'GBP_USD': 1.30,
      'GBP_CHF': 1.27,
      'GBP_CAD': 1.71,
      'GBP_XOF': 774.69,
      'CHF_EUR': 0.93,
      'CHF_USD': 1.02,
      'CHF_GBP': 0.79,
      'CHF_CAD': 1.35,
      'CHF_XOF': 610.33,
      'CAD_EUR': 0.69,
      'CAD_USD': 0.76,
      'CAD_GBP': 0.58,
      'CAD_CHF': 0.74,
      'CAD_XOF': 452.04,
      'XOF_EUR': 0.00152,
      'XOF_USD': 0.00168,
      'XOF_GBP': 0.00129,
      'XOF_CHF': 0.00164,
      'XOF_CAD': 0.00221
    };

    const rateKey = `${fromCurrency}_${toCurrency}`;
    const rate = exchangeRates[rateKey] || 1;
    
    return Math.round((amount * rate) * 100) / 100; // Arrondir à 2 décimales
  }
}