# TrueMED: Blockchain-Based Medical Report Verifier

TrueMED is a tamper-evident verification platform for medical reports. A laboratory uploads a report, the backend creates a SHA-256 fingerprint, and the system validates authenticity later by recomputing and comparing that fingerprint with trusted records.

This repository supports two execution modes:
- Full blockchain mode (Ethereum Sepolia + Solidity contract)
- Local demo mode (database-backed verification without contract deployment)

## Why This Project Matters

Healthcare documents are often shared across labs, hospitals, insurers, and patients. Traditional files can be altered without an obvious trail. TrueMED adds cryptographic proof of integrity:
- If the file changes, its SHA-256 hash changes.
- If hash comparison fails, tampering is immediately visible.
- If hash comparison succeeds, the file is authentic.

## Core Capabilities

- User authentication with role-based access (`admin`, `lab`, `verifier`)
- Medical report upload with file validation
- SHA-256 hash generation from file binary
- Smart contract anchoring of hash metadata (blockchain mode)
- MongoDB storage of file + metadata
- Verification by file re-hash and trusted record lookup
- Report search by hash
- Dashboard and admin panel

## High-Level Flow

1. Lab uploads report.
2. Backend computes SHA-256 hash.
3. Backend stores report in MongoDB.
4. Backend optionally writes hash metadata on-chain.
5. Verifier uploads the file again.
6. Backend re-computes hash and checks trusted records.
7. Match means authentic, mismatch means potentially tampered.

## Monorepo Structure

```text
medical-report-verifier/
  backend/
    blockchain/
    controllers/
    middleware/
    mongodb/
      config/
      models/
    routes/
    services/
    utils/
    server.js
  smart-contract/
    contracts/
    scripts/
    hardhat.config.js
  frontend/
    src/
      components/
      context/
      pages/
      services/
```

## Stack

- Frontend: React, Vite, Tailwind CSS
- Backend: Node.js, Express.js, Multer, Ethers.js
- Database: MongoDB Atlas
- Blockchain: Solidity, Hardhat, Ethereum Sepolia

## Quick Start

### 1) Install Dependencies

```bash
cd backend && npm install
cd ../frontend && npm install
cd ../smart-contract && npm install
```

### 2) Configure Environment Files

Create `.env` files from examples:

```bash
cd backend && cp .env.example .env
cd ../frontend && cp .env.example .env
cd ../smart-contract && cp .env.example .env
```

### 3) Choose a Runtime Mode

Blockchain mode (recommended for final evaluation):
- Set `BLOCKCHAIN_ENABLED=true` in `backend/.env`
- Fill `RPC_URL`, `PRIVATE_KEY`, `CONTRACT_ADDRESS`

Local demo mode (no deployment needed):
- Set `BLOCKCHAIN_ENABLED=false` in `backend/.env`

### 4) Start Backend

```bash
cd backend
npm run dev
```

### 5) Start Frontend

```bash
cd frontend
npm run dev
```

Frontend runs on `http://localhost:5173` by default.

## Smart Contract Setup (Blockchain Mode)

### Compile

```bash
cd smart-contract
npm run compile
```

### Deploy to Sepolia

```bash
npm run deploy:sepolia
```

Copy the printed deployed address into `backend/.env`:

```dotenv
CONTRACT_ADDRESS=0xYOUR_DEPLOYED_CONTRACT_ADDRESS
```

### Authorize a Lab Wallet

Use owner wallet in Hardhat console:

```bash
npx hardhat console --network sepolia
```

```javascript
const contract = await ethers.getContractAt("MedicalReportVerifier", "0xYOUR_DEPLOYED_CONTRACT_ADDRESS")
await contract.setLabAuthorization("0xLAB_WALLET_ADDRESS", true)
```

## Backend Environment Reference

Minimal required values in `backend/.env`:

```dotenv
PORT=5000
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/medical_verifier?retryWrites=true&w=majority
JWT_SECRET=replace_with_strong_secret
JWT_EXPIRES_IN=7d
CORS_ORIGIN=http://localhost:5173

# Toggle
BLOCKCHAIN_ENABLED=true

# Needed only when BLOCKCHAIN_ENABLED=true
RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_KEY
PRIVATE_KEY=0xYOUR_BACKEND_WALLET_PRIVATE_KEY
CONTRACT_ADDRESS=0xYOUR_DEPLOYED_CONTRACT_ADDRESS
```

## API Surface

Auth:
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`

Reports:
- `POST /api/reports/upload-report`
- `POST /api/reports/verify-report`
- `GET /api/reports/report/:hash`
- `GET /api/reports/report-file/:hash`
- `GET /api/reports/my-reports`

Admin:
- `GET /api/admin/stats`
- `GET /api/admin/users`

## Demo Checklist (Fast Presentation)

1. Register lab user and login.
2. Upload a report for a sample patient ID.
3. Show generated hash and stored report entry.
4. Verify using the same file (authentic result).
5. Modify file slightly and verify again (mismatch result).
6. Open dashboard/admin stats.

## Troubleshooting

`insufficient funds for gas * price + value` during deploy:
- Fund deploy wallet with Sepolia ETH faucet.
- Confirm signer address with `npx hardhat console --network sepolia`.

`Invalid EVM address format` in faucet:
- Use wallet address, not private key.
- Address format is `0x` + 40 hex chars.

Upload works but no on-chain tx:
- Verify `BLOCKCHAIN_ENABLED=true`.
- Check `RPC_URL`, `PRIVATE_KEY`, and `CONTRACT_ADDRESS`.

## Security Notes

- Never commit `.env` files.
- Never share private keys in screenshots or chat.
- If a private key was exposed, rotate immediately.
- Use separate low-balance test wallet for deployment tasks.

## Roadmap

- Contract event indexing worker
- Audit log export
- Multi-lab tenancy and fine-grained permissions
- CI test pipeline for backend + contract
- File malware scanning before persistence

## License

MIT
