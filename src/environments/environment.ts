export const environment = {
  production: false,
  apiUrl: 'http://localhost:8080', // Retour au port 8080 comme indiqué dans les logs
  cdnUrl: 'http://localhost:3000',
  stripePublicKey: 'pk_test_development_key_here',
  waveApiKey: 'wave_ci_prod_AEkC8Ur43z5wqy8so3nw2B6AvoUD1udbZilvKNP-Jzv0mtP1hnKNzE6QtZU3NzLtY_MEepDWvvz803Xauuu9hw4wK4nTya0KAA',
  waveBaseUrl: 'https://api.wave.com',
  faceRecognitionApiUrl: 'http://localhost:8080',
  websocketUrl: 'ws://localhost:8080/hub', 
  fileUpload: {
    maxFileSize: 52428800, // 50MB
    allowedFormats: ['jpg', 'jpeg', 'png', 'webp'],
    chunkSize: 1048576 // 1MB chunks for large file uploads
  },
  features: {
    enableFaceRecognition: true,
    enableRealTimeNotifications: false, // Disable in dev for simplicity
    enableAdvancedAnalytics: false,
    enableBulkOperations: true,
    enableMockData: true // Enable mock data fallback in development
  },
  app: {
    name: 'Event Photo Platform (Dev)',
    version: '1.0.0-dev',
    supportEmail: 'dev@eventphoto.com'
  },
  currency: {
    code: 'EUR',
    symbol: '€',
    locale: 'fr-FR',
    defaultPhotoPrice: 5.99
  },
  debug: {
    enableConsoleLogging: true,
    enableErrorReporting: true,
    fallbackToMockData: true
  }
};