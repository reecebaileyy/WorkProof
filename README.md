# Credibles - Living Resume Project

A blockchain-based skill tracking system where users mint soul-bound NFTs (SkillPets) that evolve as they complete courses and earn attestations. Skills are tracked across four categories: Development, DeFi, Governance, and Social.

## 📋 Table of Contents

- [Project Overview](#project-overview)
- [Architecture](#architecture)
- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Project Structure](#project-structure)
- [Current Deployment](#current-deployment)
- [Development Workflow](#development-workflow)
- [Key Features](#key-features)
- [Environment Setup](#environment-setup)
- [Common Tasks](#common-tasks)
- [Troubleshooting](#troubleshooting)

## 🎯 Project Overview

**Credibles** is a gamified learning platform that:
- Allows users to mint **one soul-bound NFT per wallet** (SkillPet)
- Tracks XP across 4 skill categories: Development, DeFi, Governance, Social
- Evolves NFTs from "Egg" → "Baby Dragon" → "Young Dragon" → "Dragon" based on total XP
- Supports daily tasks/quizzes that award XP directly to skill categories
- Integrates with EAS (Ethereum Attestation Service) for course completion attestations
- Features a modern Next.js frontend with light/dark mode support

## 🏗️ Architecture

```
WorkProof/
├── blockchain/          # Smart contracts (Hardhat)
│   ├── contracts/      # Solidity contracts
│   ├── scripts/        # Deployment & utility scripts
│   └── test/           # Contract tests
└── Credibles/          # Next.js frontend
    ├── app/            # Next.js app directory
    └── public/         # Static assets
```

### Smart Contracts

1. **Credibles.sol** - Main NFT contract
   - ERC721 soul-bound tokens (non-transferable)
   - Tracks XP per skill category
   - Public minting (one per wallet)
   - Direct XP addition for daily tasks

2. **AttestationResolver.sol** - EAS integration
   - Resolves attestations to add XP to NFTs
   - Schema: `(uint256 studentId, string category, uint256 xpValue)`

### Frontend

- **Next.js 15** with App Router
- **OnchainKit** for wallet integration
- **wagmi** + **viem** for blockchain interactions
- **TypeScript** throughout

## ✅ Prerequisites

Before you begin, ensure you have:

- **Node.js** 22.10.0 or later (LTS recommended)
  ```bash
  node --version  # Should be v22.x.x or higher
  ```
- **npm** or **yarn** package manager
- A **Base Sepolia** wallet with testnet ETH
- **Git** for version control

### Optional but Recommended

- **nvm** (Node Version Manager) for managing Node versions
- **Hardhat** account with private key for deployments
- **BaseScan API key** for contract verification

## 🚀 Quick Start

### 1. Clone and Install Dependencies

```bash
# Clone the repository
git clone <repository-url>
cd WorkProof

# Install blockchain dependencies
cd blockchain
npm install

# Install frontend dependencies
cd ../Credibles
npm install
```

### 2. Set Up Environment Variables

#### Blockchain (`.env` in `blockchain/`)

Create `blockchain/.env`:

```env
PRIVATE_KEY=your_private_key_without_0x_prefix
RPC_URL=https://sepolia.base.org
BASESCAN_API_KEY=your_basescan_api_key_optional
```

#### Frontend (`.env.local` in `Credibles/`)

The frontend environment is automatically updated after deployment. If missing, create `Credibles/.env.local`:

```env
NEXT_PUBLIC_CREDIBLES_CONTRACT_ADDRESS=0x725b47c5fcd4f9dc0d2819ba2682b957499adfa8
NEXT_PUBLIC_ATTESTATION_RESOLVER_ADDRESS=0x307502170787e06efa90fd751c4c625ab5932956
NEXT_PUBLIC_SCHEMA_UID=0x33b404644850244e8b14591c6e561039dfafbf5028fb14daa714361dcb0f9104
```

### 3. Run the Frontend

```bash
cd Credibles
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📁 Project Structure

```
WorkProof/
├── blockchain/
│   ├── contracts/
│   │   ├── Credibles.sol              # Main NFT contract
│   │   ├── AttestationResolver.sol    # EAS resolver
│   │   ├── IEAS.sol                   # EAS interface
│   │   └── ISchemaRegistry.sol        # Schema registry interface
│   ├── scripts/
│   │   ├── deploy.ts                  # Deploy contracts
│   │   ├── update-frontend-env.ts    # Update frontend env vars
│   │   ├── test-backend.ts           # Test contract connections
│   │   ├── list-deployments.ts       # List deployment history
│   │   └── mint.ts                   # Mint NFT (legacy, use frontend now)
│   ├── test/                         # Contract tests
│   ├── deployments.json              # Deployment history
│   └── hardhat.config.ts             # Hardhat configuration
│
└── Credibles/
    ├── app/
    │   ├── page.tsx                  # Main page component
    │   ├── layout.tsx                # Root layout
    │   ├── rootProvider.tsx           # Wallet provider setup
    │   ├── page.module.css           # Page styles
    │   ├── globals.css                # Global styles
    │   ├── api/
    │   │   └── headhunter/
    │   │       └── route.ts           # Headhunter API endpoint
    │   └── types/
    │       └── contracts.ts          # TypeScript contract types
    └── public/                       # Static assets
```

## 🌐 Current Deployment

**Network:** Base Sepolia Testnet

**Latest Contracts (Deployed: Dec 4, 2025):**

| Contract | Address | Explorer |
|----------|---------|----------|
| **Credibles** | `0x725b47c5fcd4f9dc0d2819ba2682b957499adfa8` | [BaseScan](https://sepolia.basescan.org/address/0x725b47c5fcd4f9dc0d2819ba2682b957499adfa8) |
| **AttestationResolver** | `0x307502170787e06efa90fd751c4c625ab5932956` | [BaseScan](https://sepolia.basescan.org/address/0x307502170787e06efa90fd751c4c625ab5932956) |
| **Schema UID** | `0x33b404644850244e8b14591c6e561039dfafbf5028fb14daa714361dcb0f9104` | - |

**Contract Owner:** `0x41b1e204e9c15fF5894bd47C6Dc3a7Fa98C775C7`

## 🔄 Development Workflow

### Making Contract Changes

1. **Edit contracts** in `blockchain/contracts/`
2. **Compile** contracts:
   ```bash
   cd blockchain
   npx hardhat compile
   ```
3. **Test** your changes:
   ```bash
   npx hardhat test
   ```
4. **Deploy** to Base Sepolia:
   ```bash
   npx hardhat run scripts/deploy.ts
   ```
5. **Update frontend** environment:
   ```bash
   npx hardhat run scripts/update-frontend-env.ts
   ```
6. **Restart** frontend dev server

### Making Frontend Changes

1. **Edit** files in `Credibles/app/`
2. **Hot reload** - changes appear automatically in dev mode
3. **Build** for production:
   ```bash
   cd Credibles
   npm run build
   ```

## ✨ Key Features

### 1. Public NFT Minting
- Anyone can mint **one NFT per wallet**
- Auto-assigned token IDs
- Soul-bound (non-transferable)

### 2. Skill Tree System
- **4 Categories:** Development, DeFi, Governance, Social
- **XP Tracking:** Each category tracks XP independently
- **Level System:** 1 level per 100 XP
- **Evolution Stages:**
  - Egg (0 XP)
  - Baby Dragon (100+ XP)
  - Young Dragon (300+ XP)
  - Dragon (600+ XP)

### 3. Daily Tasks
- Quiz questions per skill category
- **3 attempts** per question
- **10 XP** awarded for correct answers
- Direct on-chain XP addition

### 4. EAS Attestation Integration
- Course completion attestations
- Automatic XP addition via AttestationResolver
- GraphQL query for user attestations

### 5. Modern UI
- Light/dark mode support
- Responsive design
- Real-time XP updates
- Transaction status tracking

## 🔧 Environment Setup

### Required Environment Variables

#### Blockchain (`blockchain/.env`)
```env
PRIVATE_KEY=your_private_key_without_0x
RPC_URL=https://sepolia.base.org  # Optional, has default
BASESCAN_API_KEY=your_key  # Optional, for verification
```

#### Frontend (`Credibles/.env.local`)
```env
NEXT_PUBLIC_CREDIBLES_CONTRACT_ADDRESS=0x...
NEXT_PUBLIC_ATTESTATION_RESOLVER_ADDRESS=0x...
NEXT_PUBLIC_SCHEMA_UID=0x...
```

### Getting Testnet ETH

1. Go to [Base Sepolia Faucet](https://www.coinbase.com/faucets/base-ethereum-goerli-faucet)
2. Connect your wallet
3. Request testnet ETH

## 📝 Common Tasks

### View Deployment History

```bash
cd blockchain
npm run deployments
# or
npx hardhat run scripts/list-deployments.ts
```

### Test Backend Connection

```bash
cd blockchain
npm run test-backend
```

### Deploy Contracts

```bash
cd blockchain
npm run deploy
# Automatically updates frontend env after deployment
```

### Verify Contracts

```bash
cd blockchain
npm run verify
```

### Mint an NFT (via Frontend)

1. Connect wallet on frontend
2. Click "Mint Your SkillPet NFT"
3. Approve transaction in wallet

### Complete Daily Task

1. Navigate to Skill Tree section
2. Click "Complete Daily Task" on any skill card
3. Answer quiz question (3 attempts)
4. Earn 10 XP on correct answer

### Create EAS Attestation

1. Go to [Base Sepolia EAS Explorer](https://base-sepolia.easscan.org/)
2. Connect wallet
3. Create attestation with:
   - **Schema:** `0x33b404644850244e8b14591c6e561039dfafbf5028fb14daa714361dcb0f9104`
   - **Recipient:** Your wallet address
   - **Data:** Encode `(uint256 studentId, string category, uint256 xpValue)`
     - Example: Token ID `1`, category `"dev"`, XP `50`

## 🐛 Troubleshooting

### "Contract address not configured"

**Solution:**
```bash
cd blockchain
npm run update-frontend
# Then restart frontend dev server
```

### "You already have an NFT"

This is expected - each wallet can only mint one NFT. The contract enforces this.

### "NaN" values showing for XP

**Fixed in latest deployment!** If you still see this:
1. Ensure you're using the latest contract address
2. Check that `characterStats` is being read correctly
3. Verify your token ID exists

### Node.js version error

**Error:** `You are using Node.js 20.x.x which is not supported`

**Solution:**
```bash
# Using nvm
nvm use 22
# or install Node 22+
```

### Compilation errors

**Solution:**
```bash
cd blockchain
rm -rf cache artifacts
npx hardhat clean
npx hardhat compile
```

### Frontend not connecting to wallet

1. Ensure you're on Base Sepolia network
2. Check wallet extension is installed
3. Try refreshing the page
4. Check browser console for errors

### Transaction fails

1. Check you have enough Base Sepolia ETH
2. Verify network is Base Sepolia (not mainnet)
3. Check contract address is correct
4. Review transaction on [BaseScan](https://sepolia.basescan.org/)

## 📚 Useful Commands

### Blockchain

```bash
cd blockchain

# Compile contracts
npx hardhat compile

# Run tests
npm test

# Deploy contracts
npm run deploy

# List deployments
npm run deployments

# Test backend
npm run test-backend

# Update frontend env
npm run update-frontend

# Verify contracts
npm run verify
```

### Frontend

```bash
cd Credibles

# Start dev server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Lint code
npm run lint
```

## 🔗 Useful Links

- **Base Sepolia Explorer:** https://sepolia.basescan.org/
- **EAS Explorer:** https://base-sepolia.easscan.org/
- **Base Sepolia Faucet:** https://www.coinbase.com/faucets/base-ethereum-goerli-faucet
- **OnchainKit Docs:** https://docs.base.org/onchainkit
- **Hardhat Docs:** https://hardhat.org/docs

## 📖 Additional Documentation

- `INTEGRATION_GUIDE.md` - Integration checklist and testing guide
- `blockchain/README.md` - Hardhat project documentation
- `Credibles/README.md` - Next.js project documentation

## 🤝 Contributing

1. Create a feature branch
2. Make your changes
3. Test thoroughly (contracts + frontend)
4. Submit a pull request

## 📄 License

[Add your license here]

## 👥 Team
1. Reece Bailey (@reecebaileyy)
2. Niha (@nihaparkashuni-del)
3. Christian Huerta

For questions or issues, contact the team or open an issue in the repository.

---

**Last Updated:** December 4, 2025  
**Contract Version:** v2 (Public Minting + Daily Tasks)

