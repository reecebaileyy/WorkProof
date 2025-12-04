# Credibles Integration Guide

## Quick Start Checklist

- [x] Contracts deployed to Base Sepolia
- [x] Frontend environment configured
- [x] Backend connection tested
- [ ] Mint test NFT
- [ ] Create test attestation
- [ ] Test frontend dashboard
- [ ] Test Headhunter API

## Current Deployment

**Latest Contracts (Base Sepolia) - Updated Dec 4, 2025:**
- **Credibles**: `0x725b47c5fcd4f9dc0d2819ba2682b957499adfa8`
- **AttestationResolver**: `0x307502170787e06efa90fd751c4c625ab5932956`
- **Schema UID**: `0x33b404644850244e8b14591c6e561039dfafbf5028fb14daa714361dcb0f9104`

**Note:** This deployment includes:
- Public minting (anyone can mint one NFT)
- Daily task feature (add XP via quizzes)
- One-per-user restriction (soul-bound NFTs)

## Step-by-Step Integration

### 1. Verify Frontend Environment

Check that `/Credibles/.env.local` has the contract addresses:

```bash
cd Credibles
cat .env.local
```

Should contain:
```
NEXT_PUBLIC_CREDIBLES_CONTRACT_ADDRESS=0x725b47c5fcd4f9dc0d2819ba2682b957499adfa8
NEXT_PUBLIC_ATTESTATION_RESOLVER_ADDRESS=0x307502170787e06efa90fd751c4c625ab5932956
NEXT_PUBLIC_SCHEMA_UID=0x33b404644850244e8b14591c6e561039dfafbf5028fb14daa714361dcb0f9104
```

If missing, run:
```bash
cd blockchain
npm run update-frontend
```

### 2. Test Backend Connection

```bash
cd blockchain
npm run test-backend
```

Should show:
- ✅ Contracts found on-chain
- ✅ Contract reads working
- ✅ Network connection active

### 3. Mint a Test NFT

**Option A: Via Frontend (Recommended)**
1. Connect wallet on frontend
2. Click "Mint Your SkillPet NFT"
3. Approve transaction

**Option B: Via Script (Legacy)**
```bash
cd blockchain
# Note: Old mint function requires owner. Use frontend publicMint instead.
npx hardhat run scripts/mint.ts --network baseSepolia
```

### 4. Start Frontend

```bash
cd Credibles
npm run dev
```

Open http://localhost:3000

### 5. Test Frontend Features

1. **Connect Wallet**
   - Click wallet button
   - Connect to Base Sepolia
   - Ensure you have testnet ETH

2. **View Skill Tree**
   - Should show stats if you have a minted token
   - If no token, shows "No stats found"

3. **Complete Daily Task**
   - Click "Complete Daily Task" on any skill card
   - Answer quiz question (3 attempts)
   - Earn 10 XP on correct answer

4. **View Attestations**
   - Displays attestations for your address
   - Filtered by Schema UID

5. **Test Headhunter API**
   - Click "Fetch Top Talent (5 USDC)"
   - Should prompt for x402 payment
   - After payment, shows talent data

### 6. Create Test Attestation

Use EAS to create an attestation:

1. Go to: https://base-sepolia.easscan.org/
2. Connect wallet
3. Create Attestation:
   - Schema: `0x33b404644850244e8b14591c6e561039dfafbf5028fb14daa714361dcb0f9104`
   - Recipient: Your wallet address
   - Data: Encode `(uint256 studentId, string category, uint256 xpValue)`
     - Example: Token ID `1`, category `"dev"`, XP `50`

Or use a script (create `/blockchain/scripts/createAttestation.ts`)

## Useful Commands

### Blockchain Scripts

```bash
cd blockchain

# View deployment history
npm run deployments

# Test backend connection
npm run test-backend

# Update frontend environment
npm run update-frontend

# Verify contracts
npm run verify

# Deploy contracts
npm run deploy

# Mint NFT
npx hardhat run scripts/mint.ts --network baseSepolia
```

### Frontend

```bash
cd Credibles

# Start dev server
npm run dev

# Build for production
npm run build
```

## Troubleshooting

### Frontend shows "Contract address not configured"
- Run: `cd blockchain && npm run update-frontend`
- Check `.env.local` exists in `/Credibles/`
- Restart Next.js dev server

### "Token does not exist" error
- Mint an NFT first using the mint script
- Ensure token ID matches

### Attestations not showing
- Verify Schema UID matches
- Check EAS GraphQL endpoint
- Ensure attestations exist for your address

### x402 Payment not working
- Verify `WALLET_ADDRESS` in `.env.local`
- Check network is `base-sepolia`
- Ensure you have USDC on Base Sepolia

### Contract verification failed
- Contracts are verified on Sourcify (alternative)
- To verify on BaseScan, get API key and run: `npm run verify`

## Next Steps

1. ✅ Backend connected and tested
2. ✅ Frontend configured
3. ⏭️ Mint test NFT
4. ⏭️ Create test attestation
5. ⏭️ Test full flow end-to-end
6. ⏭️ Deploy frontend to production

## Contract Links

- **Credibles**: https://sepolia.basescan.org/address/0x725b47c5fcd4f9dc0d2819ba2682b957499adfa8
- **AttestationResolver**: https://sepolia.basescan.org/address/0x307502170787e06efa90fd751c4c625ab5932956
- **Blockscout Verification**: https://base-sepolia.blockscout.com/address/0x725b47c5fcd4f9dc0d2819ba2682b957499adfa8#code

