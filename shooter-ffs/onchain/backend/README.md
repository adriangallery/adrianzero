# Shooter Game Backend

Backend server for the Shooter Game with onchain rewards and signature system.

## Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Configuration

#### For Local Development:
1. Copy `env.example` to `.env`:
```bash
cp env.example .env
```

2. Set your backend signer private key in `.env`:
```env
BACKEND_SIGNER_KEY=your_backend_signer_private_key_here
```

#### For Production (GitHub Actions):
The backend will automatically use the `BACKEND_SIGNER_KEY` repository secret.

### 3. Run the Server

#### Development:
```bash
npm run dev
```

#### Production:
```bash
npm start
```

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `BACKEND_SIGNER_KEY` | Private key for signing reward messages | Required |
| `CONTRACT_ADDRESS` | ERC1155 contract address | `0x90546848474fb3c9fda3fdad887969bb244e7e58` |
| `ADMIN_WALLET` | Admin wallet address | `0x4943407105999e3E97EFA2035F5cbC64D72581C6` |
| `RPC_URL` | Base RPC URL | `https://mainnet.base.org` |
| `PORT` | Server port | `3001` |

### Repository Secrets

The following secret must be configured in your GitHub repository:

- `BACKEND_SIGNER_KEY`: Private key of the backend signer wallet

## API Endpoints

### Health Check
```
GET /health
```

### Game Configuration
```
GET /config
```

### Sign Reward
```
POST /sign-reward
Body: {
  "playerAddress": "0x...",
  "score": 1000,
  "rewardTokenId": 2,
  "rewardAmount": 5
}
```

### Submit Score
```
POST /submit-score
Body: {
  "playerAddress": "0x...",
  "score": 1000,
  "gameData": {...}
}
```

### Leaderboard
```
GET /leaderboard?limit=10
```

## Security

- The backend signer private key is stored as a GitHub repository secret
- Never commit private keys to the repository
- The backend signer should be a dedicated wallet, separate from the admin wallet
- All reward signatures are generated server-side for security

## Architecture

The backend provides:
1. **Reward Signing**: Signs reward messages for onchain claims
2. **Nonce Management**: Tracks nonces to prevent replay attacks
3. **Score Tracking**: Stores and retrieves player scores
4. **Configuration**: Provides game configuration to frontend

## Development

The server uses:
- **Express.js** for the web framework
- **ethers v6** for blockchain interactions
- **CORS** for cross-origin requests
- **dotenv** for environment variable management
