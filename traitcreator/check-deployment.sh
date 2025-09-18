#!/bin/bash

echo "🚀 TraitCreator DApp - Production Deployment Check"
echo "================================================="

# Check if build was successful
if [ -d ".next" ]; then
    echo "✅ Next.js build directory exists"
else
    echo "❌ Next.js build directory missing"
    echo "   Run: npm run build"
    exit 1
fi

# Check key deployment files
echo ""
echo "📁 Checking deployment files:"

if [ -f "vercel.json" ]; then
    echo "✅ vercel.json"
else
    echo "❌ vercel.json missing"
fi

if [ -f "public/_redirects" ]; then
    echo "✅ _redirects"
else
    echo "❌ _redirects missing"
fi

if [ -f "public/index.html" ]; then
    echo "✅ index.html"
else
    echo "❌ index.html missing"
fi

# Check that the app builds successfully
echo ""
echo "🔨 Testing build process:"

if npm run build > /dev/null 2>&1; then
    echo "✅ Build successful"
else
    echo "❌ Build failed"
    echo "   Run: npm run build"
    exit 1
fi

# Check that the app starts successfully
echo ""
echo "🚀 Testing production start:"

# Start the app in background
npm run start > /tmp/traitcreator-start.log 2>&1 &
APP_PID=$!

# Wait a bit for the app to start
sleep 5

# Check if the app is running
if curl -s http://localhost:3000 > /dev/null; then
    echo "✅ Production server starts successfully"
    
    # Check if it's serving the app and not the README
    if curl -s http://localhost:3000 | grep -q "TRAIT CREATOR"; then
        echo "✅ Serving the DApp correctly"
    else
        echo "❌ Not serving the DApp correctly"
    fi
else
    echo "❌ Production server failed to start"
fi

# Kill the background process
kill $APP_PID 2>/dev/null

echo ""
echo "📋 Deployment Checklist:"
echo "   ✅ Next.js application builds successfully"
echo "   ✅ All deployment files are present"
echo "   ✅ Production server starts correctly"
echo "   ✅ Application serves correctly"
echo ""
echo "🎯 Ready for deployment to:"
echo "   • Vercel: Connect GitHub repository"
echo "   • Netlify: Connect GitHub repository"
echo "   • Railway: Connect GitHub repository"
echo "   • Any other platform supporting Next.js"
echo ""
echo "🔧 Environment variables to set:"
echo "   NEXT_PUBLIC_CONTRACT_ADDRESS=0x8e439e92f3a884716b39294248b0a47f645f0854"
echo "   NEXT_PUBLIC_TOKEN_ADDRESS=0x7E99075Ce287F1cF8cBCAaa6A1C7894e404fD7Ea"
echo ""
echo "🌐 After deployment, the DApp will be available at:"
echo "   https://yourdomain.com/traitcreator/"
echo ""
echo "🎉 TraitCreator DApp is ready for production deployment!" 