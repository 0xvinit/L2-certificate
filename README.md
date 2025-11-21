# 🎓 University Certificate System with Verifiable Credentials

A blockchain-based system for issuing and verifying university certificates using **Verifiable Credentials (VCs)**, **DIDs (Decentralized Identifiers)**, and **smart contracts**.

## 🌟 Features

- ✅ **Issue Verifiable Credentials** as JWTs
- 🔐 **Blockchain Storage** using Arbitrum Sepolia
- 📱 **QR Code Generation** for easy sharing
- ✔️ **Signature Verification** for authenticity
- 🔄 **Batch Registration** (up to 10 certificates at once)
- 🚫 **Revocation Support** for invalid certificates
- 🎨 **Modern UI** with Next.js and Tailwind CSS

## 📚 Documentation

- **[QUICK_START.md](./QUICK_START.md)** - Get up and running in 5 minutes
- **[VC_SYSTEM_GUIDE.md](./VC_SYSTEM_GUIDE.md)** - Comprehensive system documentation
- **[NAVIGATION.md](./NAVIGATION.md)** - Navigate the codebase easily
- **[VISUAL_FLOW.md](./VISUAL_FLOW.md)** - Visual diagrams and flow charts

## 🚀 Quick Start

### 1. Install Dependencies
```bash
# Node.js dependencies
yarn install

# Foundry (for smart contracts)
curl -L https://foundry.paradigm.xyz | bash
foundryup
```

### 2. Setup Environment
```bash
# Copy example environment file
cp .env.example .env.local

# Edit .env.local with your values
# Required: PRIVATE_KEY, NEXT_PUBLIC_CERT_REGISTRY_ADDRESS, RPC_URL
```

### 3. Deploy Smart Contract
```bash
# Compile contracts
forge build

# Run tests
forge test

# Deploy to testnet
forge script script/DeployVcRegistry.s.sol:DeployVcRegistry \
  --rpc-url https://sepolia-rollup.arbitrum.io/rpc \
  --broadcast \
  --private-key $PRIVATE_KEY
```

### 4. Run the Application
```bash
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) to see your app.

## 📂 Project Structure

```
uni-certi/
├── contracts/              # Smart contracts (Solidity)
│   └── VcRegistry.sol     # Main registry contract
├── script/                # Deployment scripts
│   └── DeployVcRegistry.s.sol
├── test/                  # Contract tests
│   └── VcRegistry.t.sol
├── src/
│   ├── app/api/          # API routes
│   │   ├── issue-vc/     # Issue credentials
│   │   └── verify-vc/    # Verify credentials
│   ├── components/       # React components
│   │   ├── index.tsx     # Dashboard
│   │   └── VcVerifier.tsx # Verification UI
│   └── lib/              # Utilities
│       └── vc-utills.ts  # VC helper functions
└── foundry.toml          # Foundry configuration
```

## 🔄 How It Works

1. **Issue Credentials**
   - Enter student information in the dashboard
   - Click "Issue VCs" to create signed JWTs
   - System computes Merkle root and stores on blockchain
   - Receive transaction hash and signed VCs

2. **Verify Credentials**
   - Scan QR code or paste VC JWT
   - Click "Verify Credential"
   - System checks JWT signature and blockchain status
   - Display valid/invalid result

## 🛠️ Tech Stack

- **Frontend:** Next.js 16, React 19, TypeScript, Tailwind CSS
- **Backend:** Next.js API Routes
- **Blockchain:** Solidity, Foundry, Ethers.js
- **Authentication:** JWT (jose library)
- **Network:** Arbitrum Sepolia (testnet)

## 📝 Key Files

| File | Purpose |
|------|---------|
| `src/app/api/issue-vc/route.ts` | API endpoint for issuing VCs |
| `src/app/api/verify-vc/route.ts` | API endpoint for verifying VCs |
| `src/components/index.tsx` | Main dashboard UI |
| `src/components/VcVerifier.tsx` | VC verification component |
| `src/lib/vc-utills.ts` | Helper functions for VCs |
| `contracts/VcRegistry.sol` | Smart contract for certificate registry |

## 🧪 Testing

### Smart Contract Tests
```bash
# Run all tests
forge test

# Run with verbose output
forge test -vvv

# Test specific contract
forge test --match-contract VcRegistryTest
```

### Frontend Testing
```bash
yarn dev  # Start dev server
# Navigate to http://localhost:3000
# Test the issue and verify flows
```

## 🔐 Environment Variables

Required variables in `.env.local`:

```bash
PRIVATE_KEY=0x...                           # Wallet private key
NEXT_PUBLIC_CERT_REGISTRY_ADDRESS=0x...     # Deployed contract address
RPC_URL=https://sepolia-rollup.arbitrum.io/rpc  # RPC endpoint
```

## 📊 Smart Contract Functions

| Function | Description | Access |
|----------|-------------|--------|
| `batchRegister()` | Register up to 10 certificates | Authorized issuers |
| `revoke()` | Revoke a certificate | Authorized issuers |
| `isValid()` | Check if certificate is valid | Public |
| `getCertificate()` | Get certificate details | Public |
| `authorizeIssuer()` | Add authorized issuer | Owner only |

## 🆘 Troubleshooting

| Issue | Solution |
|-------|----------|
| "Missing environment configuration" | Create `.env.local` with required variables |
| Transaction fails | Check wallet has testnet ETH, ensure authorized |
| QR code not showing | Install: `yarn add qrcode @types/qrcode` |
| JWT signing errors | Ensure `jose` is installed: `yarn add jose` |

See [VC_SYSTEM_GUIDE.md](./VC_SYSTEM_GUIDE.md) for more detailed troubleshooting.

## 📖 Learn More

- [W3C Verifiable Credentials](https://www.w3.org/TR/vc-data-model/)
- [Decentralized Identifiers (DIDs)](https://www.w3.org/TR/did-core/)
- [Foundry Book](https://book.getfoundry.sh/)
- [Next.js Documentation](https://nextjs.org/docs)
- [Ethers.js Docs](https://docs.ethers.org/)

## 🤝 Contributing

Contributions are welcome! Please read the documentation files to understand the system architecture before making changes.

## 📄 License

MIT License - See LICENSE file for details

---

**Need help?** Check out:
- [QUICK_START.md](./QUICK_START.md) for setup instructions
- [NAVIGATION.md](./NAVIGATION.md) for codebase navigation
- [VISUAL_FLOW.md](./VISUAL_FLOW.md) for visual diagrams
