# Cart and Orders API Documentation

This document describes the Cart and Orders functionality implemented in the Anvogue backend API.

## Overview

The Cart and Orders system allows users to:
- Add products to their shopping cart
- Update cart item quantities
- Remove items from cart
- Create orders from cart items
- View order history
- Cancel orders
- Track order status

## Models

### Cart Model

The Cart model stores user shopping cart information:

```javascript
{
  user: ObjectId,           // Reference to User
  items: [CartItem],        // Array of cart items
  totalItems: Number,       // Total number of items
  createdAt: Date,
  updatedAt: Date
}
```

### CartItem Schema

```javascript
{
  gtin: String,            // GTIN for products (required)
  name: String,            // Product name (required)
  imageUrl: String,        // Product image URL
  category: String,        // Product category
  brand: String,           // Product brand
  quantity: Number,        // Quantity in cart (required)
  addedAt: Date,
  updatedAt: Date
}
```

### Order Model

The Order model stores completed orders:

```javascript
{
  orderNumber: String,      // Unique order number (auto-generated)
  user: ObjectId,          // Reference to User
  items: [OrderItem],      // Array of ordered items
  subtotal: Number,        // Order subtotal
  tax: Number,             // Tax amount
  shipping: Number,        // Shipping cost
  discount: Number,        // Discount amount
  totalAmount: Number,     // Total order amount
  currency: String,        // Currency
  status: String,          // Order status
  paymentStatus: String,   // Payment status
  paymentMethod: String,   // Payment method
  paymentId: String,       // Payment gateway transaction ID
  shippingAddress: Object, // Shipping address
  shippingMethod: String,  // Shipping method
  trackingNumber: String,  // Tracking number
  notes: String,           // Customer notes
  adminNotes: String,      // Admin notes
  createdAt: Date,
  updatedAt: Date,
  shippedAt: Date,
  deliveredAt: Date
}
```

## API Endpoints

### Cart Endpoints

#### GET /api/cart
Get user's cart

**Authentication:** Required

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "cart_id",
    "user": "user_id",
    "items": [...],
    "totalItems": 3,
    "totalAmount": 150.00,
    "currency": "USD"
  }
}
```

#### POST /api/cart/add
Add item to cart

**Authentication:** Required

**Request Body:**
```json
{
  "gtin": "1234567890123",
  "name": "Product Name",
  "imageUrl": "https://example.com/image.jpg",
  "category": "Fashion",
  "brand": "Brand Name",
  "quantity": 2
}
```

#### PUT /api/cart/update/:itemId
Update cart item quantity

**Authentication:** Required

**Request Body:**
```json
{
  "quantity": 3
}
```

#### DELETE /api/cart/remove/:itemId
Remove item from cart

**Authentication:** Required

#### DELETE /api/cart/clear
Clear all items from cart

**Authentication:** Required

### Order Endpoints

#### POST /api/orders
Create new order using existing address

**Authentication:** Required

**Request Body (using cart items):**
```json
{
  "addressId": "address_id_here",
  "paymentMethod": "credit_card",
  "shippingMethod": "standard",
  "notes": "Please handle with care"
}
```

**Request Body (using direct items):**
```json
{
  "addressId": "address_id_here",
  "paymentMethod": "credit_card",
  "shippingMethod": "standard",
  "notes": "Please handle with care",
  "items": [
    {
      "gtin": "1234567890123",
      "name": "Product Name",
      "imageUrl": "https://example.com/image.jpg",
      "category": "Beauty",
      "brand": "Brand Name",
      "quantity": 2,
      "price": 29.99,
      "originPrice": 39.99,
      "selectedSize": "Medium",
      "selectedColor": "Red",
      "isInStock": true
    }
  ]
}
```

#### POST /api/orders/with-new-address
Create new order with new shipping address

**Authentication:** Required

**Request Body (using cart items):**
```json
{
  "shippingAddress": {
    "firstName": "John",
    "lastName": "Doe",
    "companyName": "Acme Corp",
    "streetAddress": "123 Main St",
    "townCity": "New York",
    "state": "NY",
    "zip": "10001",
    "countryRegion": "United States",
    "phone": "+1234567890",
    "email": "john@example.com",
    "addressType": "home"
  },
  "paymentMethod": "credit_card",
  "shippingMethod": "standard",
  "notes": "Please handle with care",
  "saveAddress": true
}
```

**Request Body (using direct items):**
```json
{
  "shippingAddress": {
    "firstName": "John",
    "lastName": "Doe",
    "companyName": "Acme Corp",
    "streetAddress": "123 Main St",
    "townCity": "New York",
    "state": "NY",
    "zip": "10001",
    "countryRegion": "United States",
    "phone": "+1234567890",
    "email": "john@example.com",
    "addressType": "home"
  },
  "paymentMethod": "credit_card",
  "shippingMethod": "standard",
  "notes": "Please handle with care",
  "saveAddress": true,
  "items": [
    {
      "gtin": "1234567890123",
      "name": "Product Name",
      "imageUrl": "https://example.com/image.jpg",
      "category": "Beauty",
      "brand": "Brand Name",
      "quantity": 2,
      "price": 29.99,
      "originPrice": 39.99,
      "selectedSize": "Medium",
      "selectedColor": "Red",
      "isInStock": true
    }
  ]
}
```

#### GET /api/orders
Get user's orders with pagination

**Authentication:** Required

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)

#### GET /api/orders/:orderId
Get specific order by ID

**Authentication:** Required

#### PUT /api/orders/:orderId/cancel
Cancel an order

**Authentication:** Required

#### PUT /api/orders/:orderId/status
Update order status (Admin functionality)

**Authentication:** Required

**Request Body:**
```json
{
  "status": "accepted",
  "notes": "Order has been reviewed and accepted",
  "trackingNumber": "TRK123456789"
}
```

**Available Status Values:**
- `pending` - Order placed, awaiting review
- `accepted` - Order accepted and being prepared
- `shipped` - Order shipped to customer
- `delivered` - Order delivered to customer
- `cancelled` - Order cancelled
- `refunded` - Order refunded

**Status Transition Rules:**
- `pending` → `accepted`, `cancelled`
- `accepted` → `shipped`, `cancelled`
- `shipped` → `delivered`
- `delivered` → `refunded` (final state)
- `cancelled` → `refunded` (final state)

**Response:**
```json
{
  "success": true,
  "message": "Order status updated to accepted",
  "data": {
    "_id": "order_id_here",
    "orderNumber": "ORD-20241201-12345",
    "status": "accepted",
    "acceptedAt": "2024-12-01T10:30:00.000Z",
    "adminNotes": "Order has been reviewed and accepted",
    "trackingNumber": null
  }
}
```

#### GET /api/orders/stats
Get order statistics for user

**Authentication:** Required

## Order Status Flow

1. **pending** - Order created, awaiting review
2. **accepted** - Order accepted and being prepared
3. **shipped** - Order shipped to customer
4. **delivered** - Order delivered to customer
5. **cancelled** - Order cancelled (can happen from pending or accepted)
6. **refunded** - Order refunded (final state)

## Payment Status

- **pending** - Payment not yet processed
- **paid** - Payment successful
- **failed** - Payment failed
- **refunded** - Payment refunded

## Integration with Frontend

The backend cart and orders API is designed to work seamlessly with the frontend cart context:

### Frontend Cart Context Integration

```javascript
// Add to cart
const addToCart = async (product) => {
  const response = await fetch('/api/cart/add', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      gtin: product.gtin,
      name: product.name,
      imageUrl: product.imageUrl || product.thumbImage?.[0],
      category: product.category,
      brand: product.brand,
      quantity: 1
    })
  });
};
```

### Order Creation

```javascript
// Create order
const createOrder = async (orderData) => {
  const response = await fetch('/api/orders', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(orderData)
  });
};
```

## Features

### Cart Features
- ✅ Persistent cart storage per user
- ✅ Support for Qogita products via GTIN
- ✅ Simplified product information storage
- ✅ Essential product details (name, image, category, brand)
- ✅ Quantity management
- ✅ Automatic item count calculation

### Order Features
- ✅ Order number generation
- ✅ Multiple payment methods
- ✅ Shipping address management
- ✅ Order status tracking with timestamps
- ✅ Order status updates (pending → accepted → shipped → delivered)
- ✅ Order cancellation
- ✅ Order history with pagination
- ✅ Order statistics
- ✅ Status transition validation
- ✅ Admin notes for status updates
- ✅ Tracking number support

### Security
- ✅ JWT authentication required for all endpoints
- ✅ User-specific data isolation
- ✅ Input validation and sanitization
- ✅ Error handling and logging

## Testing

You can test the API endpoints using the Swagger documentation available at:
`http://localhost:4000/api-docs`

Or use tools like Postman with the following base URL:
`http://localhost:4000/api`

## Error Handling

All endpoints return consistent error responses:

```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error message"
}
```

Common HTTP status codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `404` - Not Found
- `500` - Internal Server Error
