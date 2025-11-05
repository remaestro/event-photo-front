export const environment = {
  production: true,
  apiUrl: 'https://event-photo-api-gwc2evhsdmf0f7eh.westeurope-01.azurewebsites.net',
  cdnUrl: 'https://cdn.eventphoto.com',
  stripePublicKey: 'pk_live_production_key_here',
  waveApiKey: 'wave_ci_prod_AEkC8Ur43z5wqy8so3nw2B6AvoUD1udbZilvKNP-Jzv0mtP1hnKNzE6QtZU3NzLtY_MEepDWvvz803Xauuu9hw4wK4nTya0KAA',
  waveBaseUrl: 'https://api.wave.com',
  faceRecognitionApiUrl: 'https://face-api.eventphoto.com',
  websocketUrl: 'wss://event-photo-api-gwc2evhsdmf0f7eh.westeurope-01.azurewebsites.net/hub',
  fileUpload: {
    maxFileSize: 52428800, // 50MB
    allowedFormats: ['jpg', 'jpeg', 'png', 'webp'],
    chunkSize: 1048576 // 1MB chunks for large file uploads
  },
  features: {
    enableFaceRecognition: true,
    enableRealTimeNotifications: true,
    enableAdvancedAnalytics: true,
    enableBulkOperations: true
  },
  app: {
    name: 'Event Photo Platform',
    version: '1.0.0',
    supportEmail: 'support@eventphoto.com'
  },
  currency: {
    code: 'EUR',
    symbol: '€',
    locale: 'fr-FR',
    defaultPhotoPrice: 5.99
  }
};