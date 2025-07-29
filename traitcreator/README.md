# TraitCreator DApp

A blockchain-powered pixel art creator for minting NFT T-shirt designs on Ethereum.

## 🎨 Features

- **Pixel Art Canvas**: 148x148 pixel drawing canvas with retro aesthetics
- **T-shirt Integration**: Draw directly on T-shirt template with alpha mask
- **Blockchain Integration**: Mint designs as NFTs using $ADRIAN tokens
- **Cascade Transactions**: Automatic approve → save → mint in one click
- **SVG Export**: Designs saved as SVG files with token ID naming
- **Mobile Friendly**: Responsive design with touch support
- **Retro Theme**: Authentic retro gaming aesthetic

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- MetaMask wallet
- $ADRIAN tokens for minting

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd traitcreator

# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🎮 How to Use

1. **Connect Wallet**: Click "CONNECT WALLET" to connect MetaMask
2. **Create Design**: Draw on the T-shirt canvas using the tools
3. **Save & Mint**: Click "SAVE & MINT" to create your NFT
4. **View Result**: Access your SVG file via the provided link

## 🔧 Technical Stack

- **Frontend**: Next.js 14, React, TypeScript
- **Styling**: Tailwind CSS with custom retro theme
- **Blockchain**: Ethers.js, MetaMask integration
- **Smart Contracts**: Ethereum Mainnet
- **File Storage**: Local SVG files with public URLs

## 📁 Project Structure

```
traitcreator/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   │   └── save-svg/      # SVG saving endpoint
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Main page
├── components/            # React components
│   ├── blockchain/        # Blockchain components
│   ├── design/           # Canvas and tools
│   └── ui/               # UI components
├── contracts/            # Smart contract ABIs
├── lib/                  # Utilities and stores
├── public/               # Static files
│   ├── designs/          # Generated SVG files
│   └── T-Shirt-148x148.svg
└── types/                # TypeScript definitions
```

## 🔗 Smart Contracts

- **AdrianSimpleSave**: `0x8e439e92f3a884716b39294248b0a47f645f0854`
- **$ADRIAN Token**: `0x7E99075Ce287F1cF8cBCAaa6A1C7894e404fD7Ea`
- **Network**: Ethereum Mainnet

## 💰 Pricing

- **Save & Mint**: 10 $ADRIAN tokens
- **Save Only**: Free (local download)

## 🎨 Canvas Features

- **Size**: 148x148 pixels
- **Tools**: Brush, Eraser, Color Picker
- **Brush Sizes**: 1x1, 2x2, 4x4, 8x8 pixels
- **Colors**: 16 retro colors + custom color picker
- **Zoom**: 0.5x to 4x
- **Grid**: Toggle pixel grid overlay
- **History**: Undo/Redo functionality

## 📱 Mobile Support

- Touch-friendly drawing interface
- Responsive layout for mobile devices
- Optimized canvas for touch input
- Mobile-specific UI adjustments

## 🔄 Transaction Flow

1. **Check Allowance**: Verify token approval
2. **Approve Tokens**: If needed, approve $ADRIAN tokens
3. **Save & Mint**: Execute `payForSave()` contract function
4. **Generate SVG**: Create SVG with design and T-shirt
5. **Save File**: Store as `{tokenId}.svg` in `/designs/`
6. **Return URL**: Provide public access URL

## 🌐 API Endpoints

### POST `/api/save-svg`

Saves SVG design with token ID.

**Request:**
```json
{
  "tokenId": "123",
  "svgContent": "<svg>...</svg>"
}
```

**Response:**
```json
{
  "success": true,
  "tokenId": "123",
  "filename": "123.svg",
  "publicUrl": "/designs/123.svg",
  "message": "SVG saved for token 123"
}
```

## 📄 File Access

Generated SVG files are accessible at:
```
http://localhost:3000/designs/{tokenId}.svg
```

For external servers:
```
https://yourdomain.com/designs/{tokenId}.svg
```

## 🛠️ Development

### Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
```

### Environment Variables

Create `.env.local`:
```env
NEXT_PUBLIC_CONTRACT_ADDRESS=0x8e439e92f3a884716b39294248b0a47f645f0854
NEXT_PUBLIC_TOKEN_ADDRESS=0x7E99075Ce287F1cF8cBCAaa6A1C7894e404fD7Ea
```

## 🧪 Testing

Run the test scripts to verify functionality:

```bash
./test-cascade.sh      # Test cascade transactions
./test-svg-save.sh     # Test SVG saving
./test-ui-updates.sh   # Test UI changes
```

## 🎯 Features Roadmap

- [ ] Batch minting
- [ ] Design templates
- [ ] Social sharing
- [ ] Design marketplace
- [ ] Advanced tools (fill, line, shapes)
- [ ] Animation support
- [ ] Layer system

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- Retro gaming community for inspiration
- Ethereum ecosystem for blockchain infrastructure
- Next.js team for the amazing framework
- Tailwind CSS for the utility-first styling

---

**Built with ❤️ for the NFT community** 