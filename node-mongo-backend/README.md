# Node.js MongoDB Backend

This project is a simple backend application built with Node.js and MongoDB. It provides a RESTful API for user management, including functionalities to create, read, update, and delete users.

## Table of Contents

- [Installation](#installation)
- [Usage](#usage)
- [API Endpoints](#api-endpoints)
- [Environment Variables](#environment-variables)
- [Testing](#testing)

## Installation

1. Clone the repository:
   ```
   git clone <repository-url>
   ```

2. Navigate to the project directory:
   ```
   cd node-mongo-backend
   ```

3. Install the dependencies:
   ```
   npm install
   ```

4. Create a `.env` file based on the `.env.example` template and fill in the required environment variables.

## Usage

To start the application, run:
```
npm start
```

The server will start on the specified port (default is 3000).

## API Endpoints

### User Routes

- **POST /api/users**: Create a new user
- **GET /api/users/:id**: Get user by ID
- **PUT /api/users/:id**: Update user by ID
- **DELETE /api/users/:id**: Delete user by ID

## Environment Variables

The application requires the following environment variables:

- `MONGODB_URI`: MongoDB connection string
- `PORT`: Port number for the server
- `JWT_SECRET`: Secret key for JWT authentication

## Testing

To run the tests, use:
```
npm test
```

This will execute the unit tests defined in the `test/user.test.js` file.

## License

This project is licensed under the MIT License.