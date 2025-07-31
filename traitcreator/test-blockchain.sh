#!/bin/bash

echo "🔗 TraitCreator - Blockchain Testing"
echo "===================================="

# Check if server is running
if curl -s http://localhost:3000 > /dev/null; then
    echo "✅ Servidor corriendo en http://localhost:3000"
    echo ""
    
    # Check for blockchain components
    if curl -s http://localhost:3000 | grep -q "WALLET CONNECTED\|CONNECT WALLET"; then
        echo "✅ Componentes de wallet detectados"
    else
        echo "❌ Componentes de wallet no encontrados"
    fi
    
    # Check for blockchain info
    if curl -s http://localhost:3000 | grep -q "SAVE & MINT"; then
        echo "✅ Componentes de minting detectados"
    else
        echo "❌ Componentes de minting no encontrados"
    fi
    
    # Check for contract files
    if [ -f "contracts/AdrianSimpleSave.json" ]; then
        echo "✅ ABI AdrianSimpleSave encontrado"
        echo "   Tamaño: $(ls -lh contracts/AdrianSimpleSave.json | awk '{print $5}')"
    else
        echo "❌ ABI AdrianSimpleSave no encontrado"
    fi
    
    if [ -f "contracts/AdrianToken.json" ]; then
        echo "✅ ABI AdrianToken encontrado"
        echo "   Tamaño: $(ls -lh contracts/AdrianToken.json | awk '{print $5}')"
    else
        echo "❌ ABI AdrianToken no encontrado"
    fi
    
    echo ""
    echo "🌐 Abriendo en el navegador..."
    
    # Open in default browser
    if command -v open &> /dev/null; then
        open http://localhost:3000
    elif command -v xdg-open &> /dev/null; then
        xdg-open http://localhost:3000
    else
        echo "📱 Abre manualmente: http://localhost:3000"
    fi
    
    echo ""
    echo "🔗 Funcionalidades Blockchain Implementadas:"
    echo "   • Conexión de wallet con MetaMask"
    echo "   • Lectura de balance de $ADRIAN tokens"
    echo "   • Lectura de allowance para el contrato"
    echo "   • Lectura del precio de save desde el contrato"
    echo "   • Aprobación de tokens para el contrato"
    echo "   • Función payForSave() para guardar y mintear"
    echo "   • Manejo de eventos SavePaid y TokenMinted"
    echo "   • Interfaz responsive para mobile y desktop"
    echo ""
    echo "🛠️ Para probar:"
    echo "   1. Abre http://localhost:3000"
    echo "   2. Conecta tu wallet (MetaMask)"
    echo "   3. Verifica que se muestre tu balance"
    echo "   4. Dibuja un diseño en el canvas"
    echo "   5. Prueba 'SAVE ONLY' (gratis)"
    echo "   6. Prueba 'SAVE & MINT' (requiere $ADRIAN)"
    echo "   7. Verifica la aprobación de tokens"
    echo ""
    echo "💡 Características del contrato:"
    echo "   • CA: 0x8e439e92f3a884716b39294248b0a47f645f0854"
    echo "   • Token: 0x7E99075Ce287F1cF8cBCAaa6A1C7894e404fD7Ea ($ADRIAN)"
    echo "   • Precio: 2 $ADRIAN por save"
    echo "   • Mint automático al pagar"
    echo "   • Network: Ethereum Mainnet"
    echo ""
    echo "📱 Para probar en móvil:"
    echo "   http://192.168.0.15:3000"
    
else
    echo "❌ Servidor no está corriendo"
    echo ""
    echo "🚀 Para iniciar el servidor:"
    echo "   npm run dev"
    echo ""
    echo "📱 Luego abre: http://localhost:3000"
fi

echo ""
echo "🎉 ¡Disfruta del TraitCreator con blockchain!" 