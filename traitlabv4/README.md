# TraitLAB V4

A complete rebuild of the AdrianZERO NFT management dApp with a mobile-first approach, modern tech stack, and professional UX/UI.

## 🎯 Project Overview

TraitLAB V4 is a decentralized application (dApp) for managing AdrianZERO NFTs on Base Mainnet. It provides a comprehensive suite of tools for:

- **NFT Management**: View and manage your AdrianZERO ERC721 tokens
- **Traits System**: Apply 479+ ERC1155 traits to customize your NFTs
- **Pack Opening**: Open Floppy Discs and Action Packs to receive new traits
- **Crafting**: Combine traits using recipes to create new ones
- **Serum Application**: Apply special serums to enhance NFTs
- **Customization**: Rename tokens and toggle visual effects
- **Lambo Variants**: Generate special Lamborghini variants

## ✨ Key Features

### Mobile-First Design
- Optimized for mobile wallets (MetaMask Mobile, Trust Wallet)
- Touch-optimized interface with smooth interactions
- Progressive loading and virtualization for 1000+ items
- Responsive design from 375px to 1920px+

### Modern Tech Stack
- **React 18** + **TypeScript** for type-safe development
- **Vite** for lightning-fast builds
- **Tailwind CSS v4** for utility-first styling
- **Wagmi + RainbowKit** for seamless wallet connections
- **TanStack Query** for efficient data fetching
- **Zustand** for lightweight state management

### Performance Optimized
- Code splitting for optimal bundle sizes
- Lazy loading of routes and heavy components
- React Virtuoso for virtualizing large lists
- IndexedDB caching for offline support
- Image optimization with lazy loading

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ (20+ recommended)
- npm or yarn
- A Web3 wallet (MetaMask, Trust Wallet, etc.)

### Installation

1. Clone the repository:
```bash
cd traitlabv4
```

2. Install dependencies:
```bash
npm install
```

3. Create environment file:
```bash
cp .env.example .env
```

4. Add your environment variables:
```env
VITE_ALCHEMY_API_KEY=your_alchemy_api_key
VITE_WALLETCONNECT_PROJECT_ID=your_walletconnect_project_id
VITE_VERCEL_API_URL=https://adrianlab.vercel.app/api
```

5. Start the development server:
```bash
npm run dev
```

6. Open [http://localhost:5173](http://localhost:5173) in your browser

### Building for Production

```bash
npm run build
```

The optimized build will be in the `dist/` directory.

### Running Tests

```bash
npm run test
```

## 📁 Project Structure

```
traitlabv4/
├── public/              # Static assets
├── src/
│   ├── app/
│   │   └── providers/   # React context providers
│   ├── components/      # Reusable UI components
│   │   ├── common/      # Buttons, Cards, Modals, etc.
│   │   ├── layout/      # Header, Sidebar, Footer
│   │   ├── wallet/      # Wallet connection components
│   │   ├── nft/         # NFT display components
│   │   └── traits/      # Trait-related components
│   ├── features/        # Feature modules
│   │   ├── adrianzero/  # AdrianZERO NFT module
│   │   ├── traits/      # Traits system module
│   │   ├── packs/       # Pack opening module
│   │   ├── crafting/    # Crafting module
│   │   ├── serum/       # Serum application module
│   │   ├── customization/ # Token customization
│   │   ├── lambo/       # Lambo variants module
│   │   ├── dashboard/   # Analytics dashboard
│   │   └── search/      # Advanced search
│   ├── lib/
│   │   ├── web3/        # Web3 utilities and ABIs
│   │   ├── api/         # API clients (Alchemy, Vercel)
│   │   └── cache/       # IndexedDB caching
│   ├── hooks/           # Custom React hooks
│   ├── store/           # Zustand stores
│   ├── types/           # TypeScript type definitions
│   ├── config/          # Configuration files
│   ├── routes/          # Route definitions
│   └── styles/          # Global styles
├── .env.example         # Environment variables template
└── vite.config.ts       # Vite configuration
```

## 🔗 Smart Contracts

All contracts are deployed on **Base Mainnet** (Chain ID: 8453)

### Core Contracts
- **AdrianZERO (ERC721)**: `0x6e369bf0e4e0c106192d606fb6d85836d684da75`
- **AdrianLAB (ERC1155)**: `0x90546848474fb3c9fda3fdad887969bb244e7e58`

### Extension Contracts
- **Traits Extensions**: `0x0995c0dA1ca071b792E852b6Ec531b7cD7d1F8D6`
- **Crafting**: `0x9ab651F50ac78A13a1612CCDDF5a074B2e570829`
- **Name Registry**: `0xaeC5ED33c88c1943BB7452aC4B571ad0b4c4068C`
- **Serum Module**: `0xEb84a51F8d59d1C55cACFd15074AeB104D82B2ec`
- **Zoom Toggle**: `0x568933634be4027339c80F126C91742d41A515A0`

### Pack Contracts
- **Action Packs**: `0xa7e2ae50e7f15d220cd3f61728e52d0e6e1b2e36`
- **Floppy Discs**: `0x56B3fCc1417f269138CB7eBA1272e8Ccfee8fFc8`
- **OpenPack V4**: `0x238083148F4FBF4232efe16261e7aa87CE787022`

See `/src/config/contracts.ts` for the complete list.

## 🛠️ Development

### Code Style
- ESLint + Prettier for code formatting
- TypeScript strict mode enabled
- No `any` types allowed
- Component props must be typed

### Naming Conventions
- Components: PascalCase (`NFTCard.tsx`)
- Hooks: camelCase with `use` prefix (`useTraits.ts`)
- Utilities: camelCase (`formatAddress.ts`)
- Constants: UPPER_SNAKE_CASE (`CONTRACT_ADDRESSES`)

### Git Workflow
1. Create feature branch from `main`
2. Make changes and commit with descriptive messages
3. Push and create Pull Request
4. Wait for review and CI checks
5. Merge to `main`

## 📊 Performance Targets

- **Bundle Size**: < 200KB main bundle (gzipped)
- **Initial Load**: < 3s on 3G
- **Lighthouse Score**: > 90 (mobile)
- **Time to Interactive**: < 5s

## 🧪 Testing Strategy

- **Unit Tests**: Vitest for components and utilities
- **Integration Tests**: Testing Library for user flows
- **E2E Tests**: Playwright for critical paths
- **Target Coverage**: > 70%

## 🚀 Deployment

The application is deployed automatically via GitHub Actions on push to `main`.

**Production URL**: TBD

## 📝 License

MIT License - see LICENSE file for details

## 🤝 Contributing

Contributions are welcome! Please read our contributing guidelines before submitting PRs.

## 📞 Support

For issues or questions:
- Create an issue on GitHub
- Join our Discord community
- Check the documentation

---

Built with ❤️ for the AdrianZERO community
