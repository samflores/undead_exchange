# Undead Exchange API

Undead Exchange is a RESTful API built with Fastify, Objection.js, and Knex that simulates a post-apocalyptic survivor exchange system. Survivors can register with their inventory, update their location, report infections, and trade items with other survivors.

## Getting Started

### Prerequisites
- Node.js (v22+ recommended)
- npm

### Installation

1. Fork and clone the repository:
   ```bash
   git clone https://github.com/yourusername/undead_exchange.git
   cd undead_exchange

2. Install dependencies:

   npm install

3. Database Setup

Run the migrations to create and seed your database:

   npm run migrate

4. Start the development server with:

   npm run dev

The server will start (by default on port 8080). You can then access your API endpoints at http://localhost:8080.

5. Running the Test Suite

To run the tests (with coverage), execute:

   npm test

## API Endpoints

1. Create Survivor

- **Endpoint**: POST /survivors
- **Description**: Creates a new survivor along with their inventory (items).
- **Request Body Example**:
   ```json
   {
     "name": "Daryl Dixon",
     "age": 40,
     "gender": "male",
     "latitude": 34.0522,
     "longitude": -118.2437,
     "items": [
       {
         "name": "Fiji Water",
         "quantity": 3
       }
     ]
   }
   ```
- **Success Response Example**:
   ```json
   {
     "id": 2,
     "name": "Daryl Dixon",
     "age": 40,
     "gender": "male",
     "latitude": 34.0522,
     "longitude": -118.2437,
     "items": [
       { "id": 1, "quantity": 3 }
     ]
   }
   ```

2. Update Survivor Location

- **Endpoint**: PATCH /survivors/:id
- **Description**: Updates the location (latitude and longitude) of an existing survivor. Other fields (including inventory) cannot be modified via this endpoint.
- **Request Body Example**:
   ```json
   {
     "latitude": 34.0000,
     "longitude": -118.0000
   }
   ```

- **Success Response Example**:
   ```json
   {
     "id": 2,
     "name": "Daryl Dixon",
     "age": 40,
     "gender": "male",
     "latitude": 34.0000,
     "longitude": -118.0000,
   }
   ```

3. Report Infection

- **Endpoint**: POST /survivors/:id/infection-reports
- **Description**: Flags a survivor as infected by creating an infection report. The request includes a reporterId (the survivor making the report) and optional notes. When a survivor receives 5 reports, a database trigger automatically sets their infected flag to true.
- **Request Body Example**:
   ```json
   {
     "reporterId": 1,
     "notes": "Saw a bite mark on his arm"
   }
   ```
- **Success Response Example**:
  ```json
  {
    "id": 2,
    "reportsReceived": [
      {
        "id": 1,
        "notes": "Saw a bite mark on his arm"
      }
    ]
  }
  ```

4. Trade Items

- **Endpoint**: POST /trades
- **Description**: Facilitates the trading of items between two survivors. The request contains two survivor objects (survivor1 and survivor2), each with an id and an array of offered items (with quantities). The endpoint workflow is:
- **Request Body Example**:
   ```json
   {
     "survivor1": {
       "id": 1,
       "items": [
         { "id": 1, "quantity": 2 }
       ]
     },
     "survivor2": {
       "id": 2,
       "items": [
         { "id": 1, "quantity": 2 }
       ]
     }
   }
   ```
- **Success Response Example**:
  ```json
  {
    "message": "Trade successful"
  }
  ```

## Task: Add Swagger Documentation

**Objective**: Enhance the API documentation by integrating Swagger (OpenAPI) to provide complete interactive API documentation for all endpoints using [fastify-swagger](https://github.com/fastify/fastify-swagger).

