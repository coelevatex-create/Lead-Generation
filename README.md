# Loan AI CRM & Webhook Receiver

Production-ready Node.js + Express backend acting as a simplified CRM and webhook receiver for a VAPI-based AI loan calling agent.

## Features

- **Webhook Receiver**: Receives VAPI call events, stores call data, and updates lead status.
- **Lead Management**: Stores leads with status tracking (new, contacted, interested, etc.).
- **Call Logging**: detailed logs of every AI call (transcript, sentiment, outcome).
- **REST API**: Endpoints to manage leads and retrieve call history.

## Tech Stack

- Node.js & Express.js
- MongoDB & Mongoose
- Generic Middleware: `helmet` (security), `cors`, `morgan` (logging)

## Prerequisites

- Node.js (v14+)
- MongoDB (Local or Atlas)
- npm or yarn

## Setup

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Environment Variables**
   Copy `.env.example` to `.env` and update values:
   ```bash
   cp .env.example .env
   ```
   
   Default `.env`:
   ```
   PORT=5000
   MONGO_URI=mongodb://localhost:27017/loan-ai-crm
   NODE_ENV=development
   VAPI_SECRET=your_vapi_secret_key_here
   ```

3. **Start MongoDB**
   Ensure your MongoDB instance is running.

4. **Run Server**
   ```bash
   # Development (with nodemon)
   npm run dev
   
   # Production
   npm start
   ```

## API Endpoints

### 🧠 AI Tools (VAPI Integration)
- `GET /api/leads/context?phone=`: Get optimized context for the AI agent.
- `POST /api/vapi/save-call`: Save structured data (intent, income, objections).
- `POST /api/finance/calculate-emi`: Calculate EMI.
- `GET /api/plans`: Get available loan plans.
- `POST /api/callbacks/schedule`: Schedule a callback.

### 📞 Webhook (VAPI)
`POST /webhook/vapi`
- Protected by signature verification (`x-vapi-signature`).

### 👥 Leads
- `GET /api/leads`: List all leads (supports pagination `?page=1&limit=10`).
- `GET /api/leads/:id`: Get single lead details.
- `GET /api/leads/phone/:phone`: Get lead by phone number.
- `GET /api/leads/:id/calls`: Get all calls for a specific lead.
- `DELETE /api/leads/:id`: Remove a lead.

## Testing with Postman

1. **Webhook Test**:
   - URL: `http://localhost:5000/webhook/vapi`
   - Method: `POST`
   - Header: `Content-Type: application/json`
   - Body (Raw JSON):
     ```json
     {
       "message": {
         "type": "end-of-call-report",
         "call": {
           "id": "test-call-id-123",
           "customer": {
             "number": "+1234567890"
           },
           "duration": 45
         },
         "transcript": "Hello, I am interested in a loan.",
         "analysis": {
           "summary": "Customer wants a loan.",
           "sentiment": "positive",
           "structuredData": {
             "outcome": "interested"
           }
         }
       }
     }
     ```

2. **Verify Data**:
   - Check `GET /api/leads` to see the new lead created with status `interested`.
   - Check `GET /api/leads/phone/+1234567890` to find by phone.

## Deployment

- **Render/Railway**:
  - Connect repo.
  - Set Environment Variables (`MONGO_URI`).
  - Command: `npm start`.

- **EC2**:
  - Install Node & PM2.
  - `pm2 start server.js`.

- **Expose Locally (ngrok)**:
  ```bash
  ngrok http 5000
  ```
  Use the generated URL as the Server URL in VAPI dashboard.
# Lead-Generation
# Lead-Generation
