# GirliesHub Project

**GirliesHub** - A comprehensive platform empowering South African women through integrated financial, safety, and hygiene support services with blockchain integration.

## 🚀 Project Overview

GirliesHub is a hackathon project that provides an integrated solution for women's empowerment, featuring:

- **Financial Empowerment**: Tailored investment advice and seminars
- **GBV Support**: Safe shelter locations and emergency resources
- **Sanitary Aid**: Free hygiene product donation bins
- **AI Assistant**: Intelligent support and guidance
- **Request System**: Easy submission and tracking of support requests

## 🏗️ Project Structure

```
GilriesHub/
├── client/                      # React frontend application
│   ├── public/
│   ├── src/
│   │   ├── blockchain/          # Frontend contract helpers
│   │   │   └── contract.js
│   │   ├── components/
│   │   │   ├── LanguageSelector.js
│   │   │   ├── NavBar.js
│   │   │   ├── RequestFormModal.js
│   │   │   └── WalletConnectButton.js
│   │   ├── config/
│   │   │   └── api.js
│   │   ├── contexts/
│   │   │   └── AuthContext.js
│   │   ├── i18n/
│   │   │   ├── index.js
│   │   │   └── locales/*.json
│   │   ├── pages/
│   │   │   ├── AboutPage.js
│   │   │   ├── AIAssistantPage.js
│   │   │   ├── DonationPage.js
│   │   │   ├── FinancePage.js
│   │   │   ├── GBVSupportPage.js
│   │   │   ├── HomePage.js
│   │   │   └── RequestsPage.js
│   │   ├── App.js
│   │   ├── index.css
│   │   └── index.js
│   └── package.json
├── server/                      # Node.js backend API
│   ├── blockdag/
│   │   ├── consensus.js
│   │   ├── core.js
│   │   └── network.js
│   ├── middleware/
│   │   └── authFirebase.js
│   ├── routes/
│   │   └── shelters.js
│   ├── services/
│   │   ├── blockchainSync.js
│   │   ├── dbToChainQueue.js
│   │   └── firestoreService.js
│   ├── utils/
│   │   ├── crypto.js
│   │   ├── fireAuthHelpers.js
│   │   └── hash.js
│   ├── ai.js
│   ├── blockchain.js
│   ├── firebase.js
│   ├── server.js
│   └── package.json
├── contracts/
│   └── EmpowerHubRequests.sol
├── scripts/                    # Repo-level scripts
│   ├── deploy.js
│   ├── deploy-blockdag.js
│   ├── exportData.js
│   └── importData.js
├── test/
│   ├── blockdag-test.js
│   └── EmpowerHubRequests.js
├── hardhat.config.js
├── env.example
└── package.json                # Root scripts
```

## 🛠️ Technology Stack

### Frontend
- **React** (v18) - UI framework
- **Material-UI (MUI)** v5 - Modern component library
- **React Router** - Client-side routing
- **Axios** - HTTP client for API calls

### Backend
- **Node.js** - Runtime environment
- **Express** - Web framework
- **CORS** - Cross-origin resource sharing
- **Helmet** - Security middleware
- **Morgan** - HTTP request logger

### Blockchain Integration
- **Hardhat** - Development framework for Ethereum
- **Solidity** - Smart contract language
- **ethers.js** - Ethereum library
- **Web3Modal** - Wallet connection interface
- **BlockDAG** - Target blockchain network

### Firebase Integration
- **Firebase Auth** - User authentication and ID token verification
- **Firestore** - Persistent database with encryption
- **Blockchain Sync** - Automatic reconciliation with blockchain events
- **Queue Processing** - Background blockchain transaction processing
- **Migration Tools** - Data export/import capabilities
- **Dual-Write Mode** - Optional immediate blockchain writes

### Status of Integrations
- **AI API** - Basic endpoints implemented (`/api/ai/chat`, `/api/ai/chat/enhanced`)

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn package manager
- Firebase project with Firestore database enabled

### Firebase Setup

1. **Create a Firebase project:**
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Create a new project or use existing one
   - Enable Firestore database in test mode

2. **Generate Service Account:**
   - Go to Project Settings → Service Accounts
   - Click "Generate new private key"
   - Download the JSON file
   - Save as `server/secrets/firebase-service-account.json`

3. **Configure Environment Variables:**
   ```bash
   # Copy the example environment file
   cp env.example .env
   
   # Edit .env with your Firebase project details
   FIREBASE_PROJECT_ID=your-project-id
   FIREBASE_SERVICE_ACCOUNT_PATH=./server/secrets/firebase-service-account.json
   ENCRYPTION_KEY=your-64-hex-characters-32-bytes
   ```

### Installation

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd GirliesHub
   ```

2. **Install all dependencies:**
   ```bash
   npm run install-all
   ```

   This will install dependencies for the root, client, and server directories.

3. **Start the development servers:**
   ```bash
   npm run dev
   ```

   This will start both the React frontend (port 3000) and Node.js backend (port 5001) concurrently.

### Additional Services

**Start Queue Worker (for blockchain processing):**
```bash
cd server && npm run queue:worker
```

**Run Blockchain Sync (one-time):**
```bash
cd server && npm run sync:blockchain
```

**Export/Import Data (run from repo root):**
```bash
# Export current data
node scripts/exportData.js

# Import data to Firestore
node scripts/importData.js scripts/exports/your-export-file.json
```

### Individual Commands

**Frontend only:**
```bash
npm run client
```

**Backend only:**
```bash
npm run server
```

**Install dependencies separately:**
```bash
# Root dependencies
npm install

# Frontend dependencies
cd client && npm install

# Backend dependencies
cd server && npm install
```

## 📱 Features & Pages

### 🏠 Home Page
- Hero section with mission statement
- Feature overview cards
- Call-to-action buttons
- Responsive design

### 📋 Requests Page
- Submit new support requests
- View request history
- Track request status
- Floating action button for quick access

### 💰 Finance Page
- Upcoming financial seminars
- Investment advice tips
- Success statistics
- Registration information

### 🛡️ GBV Support Page
- Safe shelter locations
- Emergency contact numbers
- 24/7 support hotlines
- Legal resource information

### 🧼 Sanitary Aid Page
- Donation bin locations
- Available product information
- Hygiene tips and education
- Stock status updates

### 🤖 AI Assistant Page
- Interactive chat interface
- Contextual responses
- Quick question buttons
- Support guidance

### ℹ️ About Page
- Platform mission and values
- Service descriptions
- Impact statistics
- Technology roadmap

## 🔧 API Endpoints

Base URL defaults to `http://localhost:5001`.

### Health
- `GET /api/health` - API health check
- `GET /health` - Service health check

### Requests
- `GET /api/requests` - Fetch requests (Firestore-backed; optional auth for user context)
- `GET /api/requests/all` - Fetch all including deleted (auth required)
- `POST /api/requests` - Submit new request (preferred)
- `POST /api/request` - Submit new request (legacy endpoint)
- `GET /api/request/:id` - Get specific request
- `DELETE /api/requests/:id` - Soft-delete a request (auth required)

### AI Assistant
- `POST /api/ai/chat` - Basic AI chat (auth required)
- `POST /api/ai/chat/enhanced` - AI chat with suggestions

### Blockchain
- `GET /api/blockchain/verify/:id` - Verify a request or donation transaction
- `GET /api/blockchain/requests` - List on-chain requests (mock/provider-backed)
- `GET /api/blockchain/count` - Count of on-chain requests
- `POST /api/blockchain/donation` - Store donation tx on chain

### Donations
- `POST /api/donations` - Record a donation
- `GET /api/donations/stats` - Donation statistics

### Other
- `GET /api/shelters` - Shelter resources
- `GET /api/stats` - Platform statistics (auth required)

## 🎨 Design System

### Color Palette
- **Primary**: Pink (#E91E63)
- **Secondary**: White (#FFFFFF)
- **Background**: Light Grey (#F5F5F5)

### Typography
- **Font Family**: Roboto
- **Headings**: Bold weights
- **Body**: Regular weights

### Components
- **Rounded buttons** with hover effects
- **Elevated cards** with subtle shadows
- **Responsive navigation** (drawer on mobile)
- **Material Design** principles

## 🔮 Current Status & Roadmap

### Implemented
- ✅ UI scaffold, navigation, multi-language i18n
- ✅ Firestore-backed requests with optional encryption and hashing
- ✅ AI endpoints wired with `@google/generative-ai`
- ✅ Donation flow and statistics
- ✅ Queue worker and blockchain sync scaffolding

### In Progress / Planned
- 🔄 Authentication-first UX in client
- 🔄 Enhanced AI grounding and context
- 🔄 BlockDAG end-to-end on-chain writes and reads in production
- 🔄 Contract deployment and wallet UX polish

## 🚀 Deployment
- **Frontend** → Vercel/Netlify/IPFS
- **Smart Contracts** → BlockDAG EVM chain

### Phase 4 (Scale)
- 🔄 Mobile app development
- 🔄 Advanced analytics
- 🔄 Multi-language support
- 🔄 Third-party integrations

## 🤝 Development Workflow

### Teammate Workflow
- **UI teammates**: Work in `/client/src/pages` and `/client/src/components`.
- Use `client/src/blockchain/contract.js` helpers.
- Avoid editing server blockchain internals unless assigned.

### Blockchain Developer Workflow
- Implement contracts in `/contracts`
- Run tests in `/test`
- Use `/scripts/deploy.js` with Hardhat

### For Team Members

1. **Frontend Developers**: `/client/src/pages`, `/client/src/components`, i18n under `/client/src/i18n`
2. **Backend Developers**: Implement logic in `/server/services`, routes in `/server/routes`
3. **Blockchain Developers**: Work in `/contracts`, `/server/blockdag`, `/server/blockchain.js`
4. **AI Developers**: Enhance `/server/ai.js` and client UX in `AIAssistantPage.js`

### Current Stub/Scaffolded Areas

**Blockchain (`/server/blockchain.js` and `/server/blockdag/*`):**
- `storeHashOnBlockchain()` - Returns provider-backed/mock transaction depending on env
- `getTransactionProof()` - Returns proof based on stored data/mocks

**AI (`/server/ai.js`):**
- `chatWithAI()` and `chatWithSuggestions()` - Minimal logic; extend as needed

## 🧪 Testing

The current implementation includes:
- Mock data for all pages
- Functional API endpoints with stub responses
- Complete UI navigation flow
- Responsive design testing

## 📄 License

This project is developed for hackathon purposes. See license terms for detailed usage rights.

## 🙋‍♀️ Support

For questions or support during development:
- Check the console logs for detailed API interaction information
- Review the component structure in `/client/src/`
- Examine API endpoints in `/server/server.js`
- Test with the provided mock data

  ## Demo Video 🎥
Click here to watch the GirliesHub application demo video  

[![Watch the demo](https://img.youtube.com/vi/Xop4gMLgbiw/0.jpg)](https://www.youtube.com/watch?v=Xop4gMLgbiw)

## Presentation 📑
[View Presentation (PDF)](./GirliesHub.pdf)

---

**Built with ❤️ for women's empowerment in South Africa**
