# Credibles Implementation Summary

## Overview

This document summarizes the implementation of the Credibles "Living Resume" protocol for the Base Hackathon.

## Project Structure

```
Credibles/
├── blockchain/                    # Hardhat project
│   ├── contracts/
│   │   ├── Credibles.sol         # Soulbound ERC-721 with XP system
│   │   ├── AttestationResolver.sol # EAS SchemaResolver
│   │   └── PaymentSplitter.sol   # 50/50 USDC payment splitter
│   ├── scripts/
│   │   └── deploy.ts            # Deployment script
│   └── hardhat.config.ts        # Base Sepolia configuration
├── app/
│   ├── api/
│   │   └── headhunter/
│   │       └── route.ts         # x402-gated API route
│   ├── dashboard/
│   │   └── page.tsx             # Main dashboard
│   ├── components/
│   │   ├── SkillPetDisplay.tsx  # NFT visualization
│   │   ├── SkillTree.tsx        # XP progress bars
│   │   └── AttestationList.tsx  # Attestation display
│   └── lib/
│       ├── contracts.ts         # Contract ABIs & addresses
│       └── hooks/
│           ├── useSkillPet.ts   # SkillPet data hook
│           ├── useAttestations.ts # EAS attestations hook
│           └── usePaymentSplitter.ts # Payment splitter hook
```

## Smart Contracts

### 1. Credibles.sol
- **Type**: ERC-721 Soulbound NFT
- **Features**:
  - Soulbound enforcement (no transfers except mint/burn)
  - XP system with 4 categories: dev, defi, gov, social
  - Level system (levels up when XP crosses 100)
  - Only AttestationResolver can call `addXP()`

### 2. AttestationResolver.sol
- **Type**: EAS SchemaResolver
- **Features**:
  - Registers schema: `"uint256 studentId, string category, uint256 xpValue"`
  - Processes EAS attestations and calls `Credibles.addXP()`
  - Uses Base Sepolia EAS addresses

### 3. PaymentSplitter.sol
- **Type**: Payment Splitter Contract
- **Features**:
  - Splits USDC payments 50/50 between student and platform
  - Students can withdraw their accumulated balance
  - Platform can withdraw their share

## API Routes

### `/api/headhunter`
- **Protocol**: x402 (Payment-gated API)
- **Price**: 5.00 USDC
- **Network**: base-sepolia
- **Returns**: Mock verified user data when payment is verified
- **Query Params**:
  - `skill`: Filter by category (dev, defi, gov, social)
  - `level`: Minimum level filter

## Frontend Components

### Dashboard (`/dashboard`)
- Displays user's SkillPet NFT
- Shows XP progress for all 4 categories
- Lists user's EAS attestations
- Displays available USDC earnings from PaymentSplitter
- Quick actions for university verification and course completion

### Components
- **SkillPetDisplay**: Visualizes the NFT with stats and level
- **SkillTree**: Shows 4 progress bars for XP categories
- **AttestationList**: Displays user's EAS attestations from GraphQL

## Hooks

### `useSkillPet()`
- Fetches user's SkillPet NFT data
- Returns: tokenId, level, stats, tokenURI, exists

### `useAttestations(schemaUID?)`
- Fetches EAS attestations from GraphQL API
- Filters by schema UID if provided
- Returns: attestations array, loading state, error

### `usePaymentSplitter()`
- Gets student's USDC balance
- Handles withdrawal functionality
- Returns: balance, withdraw function, loading states

## Deployment

### Prerequisites
1. Set up `.env` in `/blockchain` folder:
   ```
   PRIVATE_KEY=your_private_key
   BASESCAN_API_KEY=your_basescan_api_key
   USDC_ADDRESS=0x036CbD53842c5426634e7929541eC2318f3dCF7e
   PLATFORM_WALLET=your_platform_wallet_address
   ```

2. Install dependencies:
   ```bash
   cd blockchain
   npm install
   ```

3. Deploy contracts:
   ```bash
   npm run deploy
   ```

4. Update frontend environment variables:
   ```
   NEXT_PUBLIC_CREDIBLES_ADDRESS=<deployed_address>
   NEXT_PUBLIC_ATTESTATION_RESOLVER_ADDRESS=<deployed_address>
   NEXT_PUBLIC_PAYMENT_SPLITTER_ADDRESS=<deployed_address>
   NEXT_PUBLIC_WALLET_ADDRESS=<your_wallet_for_x402>
   ```

## Environment Variables

### Frontend (.env.local)
```
NEXT_PUBLIC_CREDIBLES_ADDRESS=0x...
NEXT_PUBLIC_ATTESTATION_RESOLVER_ADDRESS=0x...
NEXT_PUBLIC_PAYMENT_SPLITTER_ADDRESS=0x...
NEXT_PUBLIC_USDC_ADDRESS=0x036CbD53842c5426634e7929541eC2318f3dCF7e
NEXT_PUBLIC_WALLET_ADDRESS=0x...
NEXT_PUBLIC_ONCHAINKIT_API_KEY=your_key
```

### Blockchain (.env)
```
PRIVATE_KEY=your_private_key
BASESCAN_API_KEY=your_basescan_api_key
EAS_ADDRESS=0x4200000000000000000000000000000000000021
SCHEMA_REGISTRY_ADDRESS=0x4200000000000000000000000000000000000020
USDC_ADDRESS=0x036CbD53842c5426634e7929541eC2318f3dCF7e
PLATFORM_WALLET=your_platform_wallet
```

## Testing the x402 API

1. Make a request to `/api/headhunter` without payment:
   ```bash
   curl http://localhost:3000/api/headhunter
   ```
   Should return `402 Payment Required` with payment details.

2. With payment proof (after paying 5 USDC):
   ```bash
   curl -H "X-Payment: <transaction_hash>" http://localhost:3000/api/headhunter
   ```
   Should return verified users JSON.

## Next Steps

1. Deploy contracts to Base Sepolia
2. Update frontend with deployed addresses
3. Test x402 API with actual payments
4. Integrate EAS SDK for attestation creation
5. Add ZK Email verification for .edu emails
6. Connect to Supabase for user data storage

## Notes

- The x402 middleware uses Coinbase's facilitator for payment verification
- EAS attestations are fetched from the Base Sepolia GraphQL endpoint
- Token enumeration is simplified (assumes tokenId 1 for MVP)
- PaymentSplitter requires USDC approval before splitting payments

