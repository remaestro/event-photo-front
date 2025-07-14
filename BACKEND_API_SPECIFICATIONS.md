# Backend API Specifications

Based on the frontend Angular services analysis, here are the comprehensive API specifications with detailed request/response objects:

## Authentication API

### POST /api/auth/register
**Request Body:**
```typescript
{
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: 'organizer' | 'admin';
  phoneNumber?: string;
}
```

**Response:**
```typescript
{
  success: boolean;
  message: string;
  user?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    isEmailVerified: boolean;
    createdAt: string;
  };
  token?: string;
  refreshToken?: string;
}
```

### POST /api/auth/login
**Request Body:**
```typescript
{
  email: string;
  password: string;
}
```

**Response:**
```typescript
{
  success: boolean;
  message: string;
  user?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    isEmailVerified: boolean;
  };
  token?: string;
  refreshToken?: string;
}
```

### POST /api/auth/logout
**Request Body:**
```typescript
{
  refreshToken: string;
}
```

### POST /api/auth/refresh
**Request Body:**
```typescript
{
  refreshToken: string;
}
```

**Response:**
```typescript
{
  success: boolean;
  token?: string;
  refreshToken?: string;
  message?: string;
}
```

### POST /api/auth/forgot-password
**Request Body:**
```typescript
{
  email: string;
}
```

### POST /api/auth/reset-password
**Request Body:**
```typescript
{
  token: string;
  newPassword: string;
}
```

### POST /api/auth/verify-email
**Request Body:**
```typescript
{
  token: string;
}
```

## Events API

### GET /api/events
**Query Parameters:**
```typescript
{
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  status?: string;
  organizer?: string;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
}
```

**Response:**
```typescript
{
  events: Array<{
    id: string;
    name: string;
    code: string;
    description: string;
    location: string;
    date: string;
    organizer: {
      id: string;
      name: string;
      email: string;
    };
    status: string;
    photosCount: number;
    photoPrice: number;
    tags: string[];
    qrCode: string;
    revenue: number;
    settings: {
      allowDownload: boolean;
      allowShare: boolean;
      requireApproval: boolean;
      pricingTier: string;
    };
    createdAt: string;
    updatedAt: string;
  }>;
  totalCount: number;
  page: number;
  limit: number;
}
```

### GET /api/events/{id}
**Response:**
```typescript
{
  id: string;
  name: string;
  code: string;
  description: string;
  location: string;
  date: string;
  organizer: {
    id: string;
    name: string;
    email: string;
  };
  status: string;
  photosCount: number;
  photoPrice: number;
  tags: string[];
  qrCode: string;
  revenue: number;
  settings: {
    allowDownload: boolean;
    allowShare: boolean;
    requireApproval: boolean;
    pricingTier: string;
  };
  createdAt: string;
  updatedAt: string;
}
```

### POST /api/events
**Request Body:**
```typescript
{
  name: string;
  description: string;
  location: string;
  date: string;
  organizerId: string;
  settings?: {
    allowDownload?: boolean;
    allowShare?: boolean;
    requireApproval?: boolean;
    pricingTier?: string;
  };
  tags?: string[];
}
```

### PUT /api/events/{id}
**Request Body:**
```typescript
{
  name?: string;
  description?: string;
  location?: string;
  date?: string;
  status?: string;
  settings?: {
    allowDownload?: boolean;
    allowShare?: boolean;
    requireApproval?: boolean;
    pricingTier?: string;
  };
}
```

### DELETE /api/events/{id}

### POST /api/events/{id}/duplicate

### GET /api/events/search
**Query Parameters:**
```typescript
{
  query?: string;
  code?: string;
  filters?: {
    dateFrom?: string;
    dateTo?: string;
    location?: string;
    status?: string;
  };
  page?: number;
  limit?: number;
}
```

### GET /api/events/public/{code}
**Response:**
```typescript
{
  id: string;
  title: string;
  description: string;
  location: string;
  date: string;
  organizerName: string;
  totalPhotos: number;
  settings: {
    allowDownload: boolean;
    allowShare: boolean;
  };
}
```

### GET /api/events/{eventId}/statistics
**Response:**
```typescript
{
  totalViews: number;
  totalPhotos: number;
  totalSales: number;
  totalRevenue: number;
  averageOrderValue: number;
  conversionRate: number;
  topSellingPhotos: Array<{
    photoId: string;
    thumbnail: string;
    salesCount: number;
  }>;
}
```

### GET /api/events/{eventId}/revenue-breakdown
**Response:**
```typescript
{
  totalRevenue: number;
  platformFee: number;
  organizerShare: number;
  breakdown: Array<{
    date: string;
    revenue: number;
    salesCount: number;
  }>;
}
```

## Photos API

### GET /api/events/{eventId}/photos
**Query Parameters:**
```typescript
{
  page?: number;
  limit?: number;
  status?: 'pending' | 'approved' | 'rejected';
  tags?: string[];
  photographer?: string;
  dateFrom?: string;
  dateTo?: string;
}
```

**Response:**
```typescript
{
  photos: Array<{
    id: string;
    filename: string;
    urls: {
      thumbnail: string;
      watermarked: string;
      original: string;
    };
    dimensions: {
      width: number;
      height: number;
    };
    fileSize: number;
    tags: string[];
    status: 'pending' | 'approved' | 'rejected';
    uploadDate: string;
    photographer: {
      id: string;
      name: string;
    };
    pricing: {
      digital: number;
      print: number;
    };
    analytics: {
      views: number;
      sales: number;
      revenue: number;
    };
  }>;
  totalCount: number;
  page: number;
  limit: number;
}
```

### POST /api/events/{eventId}/photos/upload
**Request Body (FormData):**
```typescript
{
  files: FileList;
  metadata?: {
    tags?: string[];
    description?: string;
    photographer?: string;
    status?: 'pending' | 'approved' | 'rejected';
    pricing?: {
      digital?: number;
      print?: number;
    };
  };
}
```

**Response:**
```typescript
{
  sessionId: string;
  uploadedFiles: Array<{
    filename: string;
    status: 'uploaded' | 'processing' | 'failed';
    photoId?: string;
    error?: string;
  }>;
  totalFiles: number;
  processingStatus: 'pending' | 'processing' | 'completed';
}
```

### GET /api/photos/upload-status/{sessionId}
**Response:**
```typescript
{
  sessionId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  totalFiles: number;
  processedFiles: number;
  failedFiles: number;
  results?: Array<{
    filename: string;
    photoId: string;
    status: string;
    error?: string;
  }>;
}
```

### PUT /api/events/{eventId}/photos/{photoId}
**Request Body:**
```typescript
{
  tags?: string[];
  status?: 'pending' | 'approved' | 'rejected';
  pricing?: {
    digital?: number;
    print?: number;
  };
}
```

### DELETE /api/events/{eventId}/photos/{photoId}

### POST /api/events/{eventId}/photos/bulk-update
**Request Body:**
```typescript
{
  photoIds: string[];
  updates: {
    tags?: string[];
    status?: 'pending' | 'approved' | 'rejected';
    pricing?: {
      digital?: number;
      print?: number;
    };
  };
}
```

### POST /api/photos/{photoId}/reprocess

## Cart API

### GET /api/cart
**Response:**
```typescript
{
  id: string;
  items: Array<{
    id: string;
    photoId: string;
    eventId: string;
    eventName: string;
    photoThumbnail: string;
    price: number;
    quantity: number;
    format: 'digital' | 'print_4x6' | 'print_8x10' | 'print_16x20';
    addedAt: string;
  }>;
  summary: {
    itemCount: number;
    subtotal: number;
    tax: number;
    total: number;
  };
}
```

### POST /api/cart/items
**Request Body:**
```typescript
{
  photoId: string;
  quantity: number;
  format: 'digital' | 'print_4x6' | 'print_8x10' | 'print_16x20';
}
```

### PUT /api/cart/items/{itemId}
**Request Body:**
```typescript
{
  quantity?: number;
  format?: 'digital' | 'print_4x6' | 'print_8x10' | 'print_16x20';
}
```

### DELETE /api/cart/items/{itemId}

### DELETE /api/cart/clear

## Orders API

### POST /api/orders
**Request Body:**
```typescript
{
  items: Array<{
    photoId: string;
    quantity: number;
    format: string;
    price: number;
  }>;
  customerInfo: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
  };
  shippingAddress?: {
    street: string;
    city: string;
    postalCode: string;
    country: string;
  };
  paymentMethod: 'stripe' | 'paypal' | 'bank_transfer';
}
```

**Response:**
```typescript
{
  id: string;
  orderNumber: string;
  status: 'pending' | 'processing' | 'completed' | 'cancelled';
  items: Array<{
    photoId: string;
    filename: string;
    quantity: number;
    format: string;
    price: number;
    total: number;
  }>;
  customerInfo: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
  };
  pricing: {
    subtotal: number;
    tax: number;
    shipping: number;
    total: number;
  };
  createdAt: string;
  updatedAt: string;
}
```

### GET /api/orders/{orderId}

### GET /api/orders
**Query Parameters:**
```typescript
{
  page?: number;
  limit?: number;
  status?: string;
  customerId?: string;
  eventId?: string;
  dateFrom?: string;
  dateTo?: string;
}
```

**Response:**
```typescript
{
  orders: Array<{
    id: string;
    orderNumber: string;
    status: string;
    customerEmail: string;
    totalAmount: number;
    itemCount: number;
    createdAt: string;
  }>;
  totalCount: number;
  page: number;
  limit: number;
}
```

## Face Recognition API

### POST /api/face-recognition/scan
**Request Body (FormData):**
```typescript
{
  photo: File;
  eventCode: string;
}
```

**Response:**
```typescript
{
  scanId: string;
  status: 'processing' | 'completed' | 'failed';
  message: string;
}
```

### GET /api/face-recognition/scan/{scanId}/status
**Response:**
```typescript
{
  scanId: string;
  status: 'processing' | 'completed' | 'failed';
  progress: number;
  estimatedTimeRemaining?: number;
}
```

### GET /api/face-recognition/scan/{scanId}/results
**Response:**
```typescript
{
  scanId: string;
  status: 'completed' | 'failed';
  totalMatches: number;
  photos: Array<{
    id: string;
    eventId: string;
    eventName: string;
    thumbnail: string;
    watermarked: string;
    price: number;
    tags: string[];
    timestamp: string;
    matchConfidence: number;
  }>;
  processingTime: number;
}
```

## Payments API

### POST /api/payments/confirm
**Request Body:**
```typescript
{
  orderId: string;
  paymentIntentId: string;
  paymentMethodId?: string;
}
```

**Response:**
```typescript
{
  orderId: string;
  paymentIntentId: string;
  paymentMethod: 'stripe' | 'paypal' | 'bank_transfer';
  amount: number;
  currency: string;
  status: 'succeeded' | 'failed' | 'pending';
  failureReason?: string;
  processedAt: string;
}
```

### GET /api/payments/{orderId}/status
**Response:**
```typescript
{
  orderId: string;
  paymentStatus: 'pending' | 'processing' | 'succeeded' | 'failed' | 'cancelled';
  amount: number;
  currency: string;
  paymentMethod: 'stripe' | 'paypal' | 'bank_transfer';
  transactionId?: string;
  failureReason?: string;
  lastUpdated: string;
}
```

## Beneficiaries API

### GET /api/events/{eventId}/beneficiaries
**Response:**
```typescript
Array<{
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'photographer' | 'organizer' | 'viewer';
  status: 'pending' | 'accepted' | 'declined';
  permissions: {
    canViewPhotos: boolean;
    canDownloadPhotos: boolean;
    canUploadPhotos: boolean;
    canManageEvent: boolean;
  };
  addedAt: string;
  invitedBy: string;
}>
```

### POST /api/events/{eventId}/beneficiaries
**Request Body:**
```typescript
{
  email: string;
  firstName?: string;
  lastName?: string;
  role?: 'photographer' | 'organizer' | 'viewer';
  permissions?: {
    canViewPhotos?: boolean;
    canDownloadPhotos?: boolean;
    canUploadPhotos?: boolean;
    canManageEvent?: boolean;
  };
}
```

### PUT /api/events/{eventId}/beneficiaries/{beneficiaryId}
**Request Body:**
```typescript
{
  role?: 'photographer' | 'organizer' | 'viewer';
  permissions?: {
    canViewPhotos?: boolean;
    canDownloadPhotos?: boolean;
    canUploadPhotos?: boolean;
    canManageEvent?: boolean;
  };
}
```

### DELETE /api/events/{eventId}/beneficiaries/{beneficiaryId}

### POST /api/events/{eventId}/beneficiaries/{beneficiaryId}/accept

### POST /api/events/{eventId}/beneficiaries/{beneficiaryId}/decline

## Admin APIs

### GET /api/admin/users
**Query Parameters:**
```typescript
{
  page?: number;
  limit?: number;
  role?: string;
  status?: string;
  search?: string;
}
```

**Response:**
```typescript
{
  users: Array<{
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    status: string;
    createdAt: string;
    lastLoginAt?: string;
    stats: {
      eventsCount: number;
      photosCount: number;
      totalRevenue: number;
    };
  }>;
  totalCount: number;
  page: number;
  limit: number;
}
```

### GET /api/admin/users/{userId}
**Response:**
```typescript
{
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  status: string;
  createdAt: string;
  lastLoginAt?: string;
  profile: {
    phoneNumber?: string;
    preferences: object;
  };
  stats: {
    eventsCount: number;
    photosCount: number;
    totalRevenue: number;
    orderCount: number;
  };
  recentActivity: Array<{
    type: string;
    description: string;
    timestamp: string;
  }>;
}
```

### PUT /api/admin/users/{userId}/status
**Request Body:**
```typescript
{
  status: string;
  reason?: string;
}
```

### PUT /api/admin/users/{userId}/role
**Request Body:**
```typescript
{
  role: string;
}
```

### GET /api/admin/events
**Query Parameters:**
```typescript
{
  page?: number;
  limit?: number;
  status?: string;
  organizer?: string;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
}
```

**Response:**
```typescript
{
  events: Array<{
    id: string;
    name: string;
    organizer: {
      id: string;
      name: string;
      email: string;
    };
    date: string;
    status: string;
    photosCount: number;
    revenue: number;
    createdAt: string;
  }>;
  totalCount: number;
  page: number;
  limit: number;
}
```

### GET /api/admin/statistics/dashboard
**Response:**
```typescript
{
  platform: {
    totalUsers: number;
    totalEvents: number;
    totalPhotos: number;
    totalRevenue: number;
    monthlyActiveUsers: number;
  };
  growth: {
    usersGrowth: number;
    eventsGrowth: number;
    revenueGrowth: number;
  };
  recentActivity: Array<{
    type: string;
    user: string;
    eventName?: string;
    timestamp: string;
  }>;
}
```

## Notifications API

### GET /api/notifications
**Query Parameters:**
```typescript
{
  page?: number;
  limit?: number;
  unreadOnly?: boolean;
}
```

**Response:**
```typescript
{
  notifications: Array<{
    id: string;
    type: 'order_completed' | 'photo_uploaded' | 'event_created' | 'system_announcement' | 'revenue_share';
    title: string;
    message: string;
    isRead: boolean;
    data?: {
      orderId?: string;
      eventId?: string;
      eventName?: string;
      photoId?: string;
      [key: string]: any;
    };
    createdAt: string;
  }>;
  unreadCount: number;
  totalCount: number;
}
```

### PUT /api/notifications/{notificationId}/read

### PUT /api/notifications/mark-all-read

### POST /api/notifications/send
**Request Body:**
```typescript
{
  recipients: string[];
  type: string;
  title: string;
  message: string;
  channels: Array<'email' | 'push' | 'in_app'>;
}
```

## Downloads API

### GET /api/downloads/{orderId}
**Response:**
```typescript
Array<{
  photoId: string;
  filename: string;
  downloadUrl: string;
  expiresAt: string;
  downloadCount: number;
  maxDownloads: number;
}>
```

### POST /api/downloads/{photoId}/generate
**Request Body:**
```typescript
{
  orderId: string;
  format: string;
}
```

**Response:**
```typescript
{
  downloadUrl: string;
  expiresAt: string;
  filename: string;
  fileSize: number;
}
```

## Common Response Patterns

### Error Response
```typescript
{
  success: false;
  message: string;
  errors?: Array<{
    field: string;
    message: string;
  }>;
  code?: string;
}
```

### Success Response
```typescript
{
  success: true;
  message?: string;
  data?: any;
}
```

### Pagination
```typescript
{
  page: number;
  limit: number;
  totalCount: number;
  totalPages: number;
}
```

## Authentication
- **Authorization Header**: `Bearer {token}`
- **Token Type**: JWT
- **Refresh Token**: Stored securely, used for token renewal

## Status Codes
- **200**: Success
- **201**: Created
- **400**: Bad Request
- **401**: Unauthorized
- **403**: Forbidden
- **404**: Not Found
- **422**: Unprocessable Entity
- **500**: Internal Server Error