# Address API Documentation

This document describes the Address functionality implemented in the Anvogue backend API.

## Overview

The Address system allows users to:
- Create and manage multiple addresses
- Set a default address
- Update and delete addresses
- Retrieve all addresses or a specific address

## Models

### Address Model

The Address model stores user address information:

```javascript
{
  user: ObjectId,              // Reference to User
  firstName: String,           // Required, max 50 chars
  lastName: String,            // Required, max 50 chars
  companyName: String,         // Optional, max 100 chars
  streetAddress: String,       // Required, max 200 chars
  townCity: String,            // Required, max 100 chars
  state: String,               // Required, max 100 chars
  zip: String,                 // Required, max 20 chars
  countryRegion: String,       // Required, max 100 chars
  phone: String,               // Required, max 20 chars
  email: String,               // Required, valid email
  isDefault: Boolean,          // Default: false
  addressType: String,         // Enum: ['home', 'work', 'other'], default: 'home'
  createdAt: Date,
  updatedAt: Date
}
```

## API Endpoints

### GET /api/addresses
Get all addresses for the authenticated user

**Authentication:** Required

**Response:**
```json
{
  "success": true,
  "count": 2,
  "data": [
    {
      "_id": "address_id",
      "user": "user_id",
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
      "isDefault": true,
      "addressType": "home",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

### GET /api/addresses/:id
Get a specific address by ID

**Authentication:** Required

**Parameters:**
- `id` (string): Address ID

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "address_id",
    "user": "user_id",
    "firstName": "John",
    "lastName": "Doe",
    // ... other address fields
  }
}
```

### POST /api/addresses
Create a new address

**Authentication:** Required

**Request Body:**
```json
{
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
  "addressType": "home",
  "isDefault": false
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "new_address_id",
    "user": "user_id",
    "firstName": "John",
    "lastName": "Doe",
    // ... other address fields
  }
}
```

### PUT /api/addresses/:id
Update an address

**Authentication:** Required

**Parameters:**
- `id` (string): Address ID

**Request Body:** Same as POST (all fields optional for update)

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "address_id",
    "user": "user_id",
    // ... updated address fields
  }
}
```

### DELETE /api/addresses/:id
Delete an address

**Authentication:** Required

**Parameters:**
- `id` (string): Address ID

**Response:**
```json
{
  "success": true,
  "message": "Address deleted successfully"
}
```

### PUT /api/addresses/:id/set-default
Set an address as default

**Authentication:** Required

**Parameters:**
- `id` (string): Address ID

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "address_id",
    "user": "user_id",
    "isDefault": true,
    // ... other address fields
  }
}
```

## Features

### Default Address Management
- Only one address can be default per user
- When setting an address as default, all other addresses automatically become non-default
- First address created for a user is automatically set as default

### Validation
- All required fields are validated
- Email format validation
- String length limits enforced
- Address type must be one of: 'home', 'work', 'other'

### Security
- Users can only access their own addresses
- All endpoints require authentication
- Address ownership is verified on all operations

## Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "firstName",
      "message": "First name is required"
    }
  ]
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "message": "Not authorized to access this route"
}
```

### 404 Not Found
```json
{
  "success": false,
  "message": "Address not found"
}
```

### 500 Server Error
```json
{
  "success": false,
  "message": "Server Error"
}
```
