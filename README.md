# EverGuard - Your Universal Secure Data Ecosystem

EverGuard is a comprehensive secure data platform built on BlockDAG blockchain technology. It provides encrypted storage and emergency access for medical, legal, financial, and personal data.

## Features

- **Secure Data Storage**: AES-256-GCM encryption for all data
- **Emergency Access**: QR code-based emergency medical access
- **Blockchain Integration**: BlockDAG blockchain for audit trails
- **User Authentication**: Secure user registration and login
- **Admin Dashboard**: Comprehensive system monitoring
- **Multi-Capsule Support**: Medical, Legal, Financial, Education, Safety, Legacy

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Firebase project setup
- BlockDAG testnet access

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd everguard-digi-life
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Start the backend server:
   ```bash
   cd server
   npm install
   node server.js
   ```

## Architecture

- **Frontend**: React + TypeScript + Vite
- **Backend**: Node.js + Express
- **Database**: Firebase Firestore
- **Blockchain**: BlockDAG (Awakening Testnet)
- **Encryption**: AES-256-GCM

## Deployment

Build for production:
```bash
npm run build
```

Deploy the built files to your preferred hosting service.