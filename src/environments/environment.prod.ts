export const environment = {
  production: true,
  apiUrl: 'https://event-photo-backend.azurewebsites.net',
  cdnUrl: 'https://cdn.eventphoto.com',
  stripePublicKey: 'pk_live_production_key_here',
  faceRecognitionApiUrl: 'https://face-api.eventphoto.com',
  websocketUrl: 'wss://api.eventphoto.com/hub',
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
  }
};