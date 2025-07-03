# Anvogue Backend API

This is the backend API for the Anvogue e-commerce application. It provides authentication endpoints for user registration and login.

## Technologies Used

- Node.js
- Express.js
- MongoDB
- JWT for authentication
- Swagger for API documentation

## Setup Instructions

### Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or Atlas)

### Installation

1. Clone the repository
2. Navigate to the backend directory:
   ```
   cd backend
   ```
3. Install dependencies:
   ```
   npm install
   ```
4. Create a `.env` file in the root directory with the following variables:
   ```
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/anvogue
   JWT_SECRET=your_jwt_secret_key
   JWT_EXPIRE=30d

   # Email Configuration
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_EMAIL=your_email@gmail.com
   SMTP_PASSWORD=your_app_password
   FROM_EMAIL=noreply@anvogue.com
   FROM_NAME=Anvogue

   # Frontend URL for password reset
   FRONTEND_URL=http://localhost:3000
   ```
### Running the Server

- For development (with nodemon):
  ```
  npm run dev
  ```
- For production:
  ```
  npm start
  ```

## API Documentation

Once the server is running, you can access the Swagger API documentation at:
```
http://localhost:5000/api-docs
```

## Available Endpoints

### Authentication

- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login a user
- `GET /api/auth/me` - Get current user (protected route)
- `POST /api/auth/forgotpassword` - Request password reset email
- `PUT /api/auth/resetpassword/:resettoken` - Reset password with token

### Addresses

- `GET /api/addresses` - Get all addresses for authenticated user
- `POST /api/addresses` - Create a new address
- `GET /api/addresses/:id` - Get a specific address
- `PUT /api/addresses/:id` - Update an address
- `DELETE /api/addresses/:id` - Delete an address
- `PUT /api/addresses/:id/set-default` - Set an address as default

### Cart & Orders

- `GET /api/cart` - Get user's cart
- `POST /api/cart/add` - Add item to cart
- `PUT /api/cart/update/:itemId` - Update cart item quantity
- `DELETE /api/cart/remove/:itemId` - Remove item from cart
- `POST /api/orders` - Create order from cart using existing address
- `POST /api/orders/with-new-address` - Create order with new shipping address
- `GET /api/orders` - Get user's orders
- `GET /api/orders/:orderId` - Get specific order
- `PUT /api/orders/:orderId/cancel` - Cancel order

### Products (Qogita Integration)

- `GET /api/products/brands` - Get available brands
- `GET /api/products/categories` - Get available categories
- `GET /api/products/search` - Search products
- `GET /api/products/:gtin` - Get product by GTIN

## Authentication

The API uses JWT (JSON Web Tokens) for authentication. To access protected routes, include the token in the Authorization header:

```
Authorization: Bearer <your_token>
```

## Password Reset Flow

The password reset functionality works as follows:

1. User requests a password reset by sending their email to `/api/auth/forgotpassword`
2. If the email exists in the database, a reset token is generated and a password reset link is sent to the user's email
3. The reset link contains a token and directs the user to the frontend reset password page
4. User enters a new password and submits it along with the token to `/api/auth/resetpassword/:resettoken`
5. If the token is valid and not expired, the password is updated and the user receives a new JWT token

Note: For the email functionality to work, you need to configure the email settings in the `.env` file. If you're using Gmail, you'll need to generate an app password.

