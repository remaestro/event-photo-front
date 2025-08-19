export const environment = {
  production: false,
  apiUrl: 'http://localhost:5290',
  cdnUrl: 'https://cdn.eventphoto.local',
  stripePublicKey: 'pk_test_51234567890',
  faceRecognitionApiUrl: 'https://face-api.eventphoto.local',
  websocketUrl: 'ws://localhost:5290/hub',
  // NOUVEAU: Configuration Wave
  waveApiKey: 'wave_test_api_key_12345',
  waveMerchantId: 'merchant_test_67890',
  fileUpload: {
    maxFileSize: 52428800, // 50MB
    allowedFormats: ['jpg', 'jpeg', 'png', 'webp'],
    chunkSize: 1048576 // 1MB chunks for large file uploads
  },
  features: {
    enableFaceRecognition: true,
    enableRealTimeNotifications: true,
    enableAdvancedAnalytics: true,
    enableBulkOperations: true,
    enableWavePayments: true // NOUVEAU
  },
  app: {
    name: 'Event Photo Platform',
    version: '1.0.0',
    supportEmail: 'support@eventphoto.com'
  }
};