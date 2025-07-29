#!/bin/bash

echo "🎨 Setting up TraitCreator DApp..."
echo "=================================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version 18+ is required. Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js version: $(node -v)"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Create .env.local if it doesn't exist
if [ ! -f .env.local ]; then
    echo "🔧 Creating .env.local file..."
    cat > .env.local << EOF
# Blockchain Configuration
RPC_URL=https://eth-mainnet.g.alchemy.com/v2/your-api-key
NEXT_PUBLIC_CONTRACT_ADDRESS=0x...

# App Configuration
NEXT_PUBLIC_APP_NAME=TraitCreator
NEXT_PUBLIC_APP_VERSION=1.0.0
EOF
    echo "✅ Created .env.local file"
    echo "⚠️  Please update the RPC_URL and CONTRACT_ADDRESS in .env.local"
fi

# Create designs directory
mkdir -p public/designs

echo "🎉 Setup complete!"
echo ""
echo "Next steps:"
echo "1. Update .env.local with your RPC URL and contract address"
echo "2. Run 'npm run dev' to start the development server"
echo "3. Open http://localhost:3000 in your browser"
echo ""
echo "Happy creating! 🎨✨" 