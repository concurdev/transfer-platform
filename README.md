````markdown
# Transfer Platform

This project is a transfer platform that allows users to perform token transfers between different addresses, with signature verification, refund functionality, and status tracking. It also includes a microservice architecture designed for high scalability, using **Node.js**, **MySQL**, **Redis**, **ethers.js**

## Features

- **Transfer functionality**: Enables users to send tokens between different addresses
- **Signature Verification**: Ensures that the transfer requests are verified with the provided signature using `ethers.js`.
- **Refund**: Handles refunds through signed transactions
- **Transfer Status**: Fetch the status of a transfer
- **User Balance Management**: Track user balances using MySQL
- **Concurrency Handling**: Supports concurrent transfer processing

## Tech Stack

- **Node.js**: JavaScript runtime for the backend
- **Express.js**: Web framework for API endpoints
- **MySQL**: Relational database to store user balances and transfer details
- **Redis**: In-memory data structure store used for temporary data and caching
- **ethers.js**: A library for interacting with the Ethereum blockchain, used for signature verification.
- **Docker**: For containerization of MySQL and Redis services

## Setup & Installation

### Prerequisites

1. **Node.js** and **npm** installed on your local machine
2. **Docker** for running MySQL and Redis in containers

### Clone the repository

```bash
git clone git@github.com:concurdev/transfer-platform.git
cd transfer-platform
```

### Setup Environment Variables

Create a `.env` file in the root directory of the project and define the necessary variables:

```plaintext
SERVER_IP=0.0.0.0
PORT=6363
REDIS_URL=redis://redis_cache:6379
DB_HOST=mysql_db
DB_USER=root
DB_PASSWORD=password
DB_NAME=transfer_platform
```

### Install dependencies

Run the following command to install the project dependencies:

```bash
npm install
```

### Docker Setup

You need to run **MySQL** and **Redis** in Docker containers. Use the following commands to spin up the services:

```bash
# Start MySQL and Redis containers
docker-compose up
```

This will create containers for MySQL and Redis and run them locally. The configuration for these services can be modified in the `docker-compose.yml` file

### Running the Application

Once dependencies are installed and Docker containers are up and running, you can start the Node.js application:

```bash
npm run dev # suggestion is to use `npm run rebuild`
```

```bash
# Start MySQL and Redis containers
npm run rebuild # this will do all this:     docker compose down && docker ps && docker compose up -d --build && docker restart transfer_app && docker logs -f transfer_app
```

This will start the server locally on `http://0.0.0.0:6363`

### Endpoints

#### 1. Transfer Token

before you use the below endpoint you need to run

```sh
node genWallet.js # to generate some etherum wallet address and then add them into user_balances table with some balance, syntax is mention below scroll down
```

next you need to run

```sh
node sign # whatever sender and receiver address and amount you use get a signature using it by running this script manually for the wallet address
```

```sh
curl -X POST http://0.0.0.0:6363/api/transfer \
   -H "Content-Type: application/json" \
   -d '{
         "sender": "0xf05249C12f02AA6B7D3A62AeC852AFFB19a6e3Fc",
         "recipient": "0xdAC17F958D2ee523a2206206994597C13D831ec7",
         "token": {
           "amount": 10
         },
         "signature": "0xc8e15648b632775fdd2c1e7a6b4ec357ceb5489fe974a7ea39991c90057b71da2258cf952120904e664cdfcc4ca89e6a56bdd6db38ff617f186f98d9a10b59cd1b"
       }'
```

- **Response**:
  ```json
  { "success": true, "message": "Transfer executed", "transferId": "b5c1939f-7b9e-4fe3-8522-a9f153581c5e" }
  ```

#### Refund Included

```sh
curl -X POST http://0.0.0.0:6363/api/transfer \
 -H "Content-Type: application/json" \
 -d '{
"sender": "0xf05249C12f02AA6B7D3A62AeC852AFFB19a6e3Fc",
"recipient": "0xdAC17F958D2ee523a2206206994597C13D831ec7",
"token": {
"amount": 10
},
"signature": "0xc8e15648b632775fdd2c1e7a6b4ec357ceb5489fe974a7ea39991c90057b71da2258cf952120904e664cdfcc4ca89e6a56bdd6db38ff617f186f98d9a10b59cd1b",
"refund": {
"chainId": 1,
"tx": "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
"signedTx": "0xabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefab"
}
}'
```

- **Response**:
  ```json
  { "success": true, "message": "Transfer executed", "transferId": "ac5d2458-3c39-478c-88c1-bd3179eed0ad" }
  ```

#### 2. Get Transfer Status

```sh
curl -X GET "http://0.0.0.0:6363/api/transfer/status/8cd0cae5-e8d0-4b12-8f7d-07d364d6e0cb" -H "Content-Type: application/json"
```

- **Response**:
  ```json
  { "transferId": "8cd0cae5-e8d0-4b12-8f7d-07d364d6e0cb", "status": "pending" }
  ```

## Database Structure

### `user_balances` table

This table stores the user balances for each address.

```sql
CREATE TABLE user_balances (
    id INT AUTO_INCREMENT PRIMARY KEY,          -- unique identifier for each entry
    user_address VARCHAR(42) NOT NULL UNIQUE,   -- ETH address of the user
    balance DECIMAL(18,8) NOT NULL DEFAULT 0    -- current balance of the user
);
```

### Run below to generate an ETH wallet and then INSERT that to user_balances table using below SQL

```sh
node genWallet.js
```

```sql
INSERT INTO user_balances (user_address, balance)
VALUES ('0xA1b2C3D4E5F67890123456789AbCdEf012345678', 100.00);
```

### `transfers` table

This table tracks all transfer requests made by users.

```sql
CREATE TABLE transfers (
    id INT AUTO_INCREMENT PRIMARY KEY,          -- unique identifier for each transfer
    transfer_id VARCHAR(255) NOT NULL UNIQUE,   -- unique transfer identifier
    sender_address VARCHAR(42) NOT NULL,        -- sender's ETH address
    recipient_address VARCHAR(42) NOT NULL,     -- recipient's Ethereum address
    amount DECIMAL(18,8) NOT NULL,              -- amount of tokens transferred
    status ENUM('pending', 'completed', 'failed') NOT NULL DEFAULT 'pending', -- transfer status
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- date and time when the transfer was initiated
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP -- date and time when the transfer status was updated
);
```

### `refunds` table

```sql
CREATE TABLE refunds (
  id INT AUTO_INCREMENT PRIMARY KEY,             -- unique identifier for each refund
  transfer_id UUID NOT NULL,                     -- unique identifier linking the refund to a specific transfer
  chain_id INT NOT NULL,                         -- blockchain identifier (ETH, BSC)
  tx VARCHAR(255) NOT NULL,                      -- txn hash for the refund on the blockchain
  signed_tx VARCHAR(255) NOT NULL,               -- signed txn data for authorizing the refund
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP -- date and time when the refund was initiated
);
```

### `solver_balances` table:

```sql
CREATE TABLE solver_balances (
  chain_id INT PRIMARY KEY, -- blockchain or network
  balance DECIMAL(18, 8)    -- balance
);
```

```sql
INSERT INTO solver_balances (chain_id, balance) VALUES (1, 100);
```

## Logging

The project uses **Winston** for logging application events. Logs are available in the console and can be configured to persist to files if needed

## Testing

### Unit & Integration Tests

To run the tests, use the following command:

```bash
npm test
```
````
