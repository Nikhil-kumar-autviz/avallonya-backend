# Qogita API Integration

This document describes the integration with the Qogita API for product data retrieval.

## Architecture Overview

The Qogita API integration is implemented as a backend-only service. The frontend interacts with our own API endpoints, which in turn communicate with the Qogita API behind the scenes.

### Authentication Flow

1. **Server Initialization**:
   - When the server starts, it automatically initializes the Qogita API connection
   - It uses credentials from environment variables (QOGITA_EMAIL and QOGITA_PASSWORD)
   - The access token is stored in the database for future use

2. **Token Refresh Process**:
   - Before making any request to Qogita API, the system checks if the current token is valid
   - If the token is expired or about to expire (within 5 minutes), it automatically refreshes it
   - The refresh process sends the current access token to Qogita's refresh endpoint
   - Qogita returns a new access token, expiration time, user data, and signature
   - The system updates the stored token information

3. **API Request Process**:
   - All requests to Qogita API are made from the backend services
   - The system attaches the current valid access token to each request
   - If token refresh fails, an error is logged and the request fails

## Implementation Details

### Backend Components

1. **QogitaToken Model**:
   - Stores access tokens, expiration times, user data, and signatures
   - Tracks when tokens are created and updated

2. **Qogita Service**:
   - `initialize()` - Authenticates with Qogita API and stores tokens
   - `refreshToken()` - Refreshes the access token when needed
   - `getValidAccessToken()` - Gets a valid token, refreshing if necessary
   - `makeAuthenticatedRequest()` - Makes authenticated requests to Qogita API

3. **Product Service**:
   - Uses the Qogita service to fetch product data
   - Provides methods for getting products, categories, and searching

4. **Product Controller**:
   - Exposes RESTful API endpoints for the frontend
   - Handles error cases and formats responses

5. **Product Routes**:
   - `/api/products` - Get all products
   - `/api/products/:id` - Get a product by ID
   - `/api/products/search` - Search products
   - `/api/products/categories` - Get product categories

### Frontend Components

1. **Product Service**:
   - TypeScript interfaces for product data types
   - Functions to interact with our backend product endpoints

2. **React Query Hooks**:
   - `useProducts()` - Hook for fetching products
   - `useProduct()` - Hook for fetching a single product
   - `useProductSearch()` - Hook for searching products
   - `useCategories()` - Hook for fetching categories

## Configuration

To use the Qogita API integration, you need to set the following environment variables:

```
QOGITA_EMAIL=your_qogita_email@example.com
QOGITA_PASSWORD=your_qogita_password
```

## API Endpoints

### Backend Endpoints

- `GET /api/products/brands` - Get all brands
  - Query parameters: page, page_size
  - Response: Paginated list of brands

- `GET /api/products/categories` - Get product categories
  - Query parameters: page, page_size
  - Response: Paginated list of categories

- `GET /api/products/search` - Search products (variants)
  - Query parameters:
    - category_name: Filter by category name
    - brand_name: Filter by brand name(s). Can be provided multiple times to filter for multiple brands (e.g., ?brand_name=Apple&brand_name=Samsung)
    - category_slug: Filter by category slug(s). Can be specified multiple times for different slugs (e.g., ?category_slug=health-beauty&category_slug=makeup)
    - min_price: Filter by minimum price
    - max_price: Filter by maximum price
    - page: Page number for pagination
    - page_size: Number of items per page
  - Response: Paginated list of products with facets for filtering

- `GET /api/products/:id` - Get a product (variant) by ID
  - Response: Product details

## Data Models

### QogitaToken Model

```javascript
{
  accessToken: String,  // Qogita access token
  accessExp: Number,    // Token expiration timestamp
  user: Object,         // Qogita user data
  signature: String,    // Qogita signature
  createdAt: Date,      // When the token was first created
  updatedAt: Date       // When the token was last updated
}
```

## Error Handling

- If Qogita API initialization fails, an error is logged but the server continues to run
- If a token refresh fails, an error is logged and the request fails
- All API errors from Qogita are logged and appropriate error responses are sent to the frontend

## Usage Examples

### Backend Example

```javascript
// Get brands
const brands = await productService.getBrands({ page: 1, page_size: 20 });

// Get categories
const categories = await productService.getCategories({ page: 1, page_size: 20 });

// Search products by category name, multiple brands, and price range
const products = await productService.searchProducts({
  category_name: 'Electronics',
  brand_name: ['Apple', 'Samsung', 'Sony'],
  min_price: 100,
  max_price: 1000,
  page: 1,
  page_size: 20
});

// Get a product by ID
const product = await productService.getProductById('product-qid');
```

### Frontend Example

```typescript
// Get brands with pagination
const { data: brandsData } = useBrands({ page: 1, page_size: 20 });

// Get categories with pagination
const { data: categoriesData } = useCategories({ page: 1, page_size: 20 });

// Search products by category name, multiple brands, and price range
const { data: productsData } = useProductSearch({
  category_name: 'Electronics',
  brand_name: ['Apple', 'Samsung', 'Sony'],
  min_price: 100,
  max_price: 1000,
  page: 1,
  page_size: 20
});

// Get a single product
const { data: product } = useProduct('product-qid');
```
