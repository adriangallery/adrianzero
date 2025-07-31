#!/bin/bash

echo "🔄 TraitCreator - Cascade Transactions Testing"
echo "=============================================="

# Check if server is running
if curl -s http://localhost:3000 > /dev/null; then
    echo "✅ Servidor corriendo en http://localhost:3000"
    echo ""
    
    # Check for cascade functionality
    if curl -s http://localhost:3000 | grep -q "APPROVING & MINTING"; then
        echo "✅ Funcionalidad de cascada detectada"
    else
        echo "❌ Funcionalidad de cascada no encontrada"
    fi
    
    # Check for updated ABI
    if [ -f "contracts/AdrianToken.json" ]; then
        echo "✅ ABI AdrianToken actualizado"
        echo "   Tamaño: $(ls -lh contracts/AdrianToken.json | awk '{print $5}')"
        
        # Check if it's the full ABI (should be larger than before)
        size=$(wc -c < contracts/AdrianToken.json)
        if [ $size -gt 5000 ]; then
            echo "   ✅ ABI completo detectado"
        else
            echo "   ❌ ABI parece incompleto"
        fi
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
    echo "🔄 Nueva Funcionalidad de Transacciones en Cascada:"
    echo "   • Un solo botón para todo el proceso"
    echo "   • Approve automático si es necesario"
    echo "   • Save y Mint en secuencia"
    echo "   • Manejo de errores mejorado"
    echo "   • Feedback en tiempo real"
    echo "   • ABI completo del token $ADRIAN"
    echo ""
    echo "🛠️ Para probar:"
    echo "   1. Abre http://localhost:3000"
    echo "   2. Conecta tu wallet (MetaMask)"
    echo "   3. Dibuja un diseño en el canvas"
    echo "   4. Click en 'SAVE & MINT'"
    echo "   5. Observa el proceso en cascada:"
    echo "      • Approve (si es necesario)"
    echo "      • Save & Mint"
    echo "   6. Verifica el resultado"
    echo ""
    echo "💡 Flujo de Transacciones:"
    echo "   1. Verificar allowance"
    echo "   2. Si es necesario: Approve tokens"
    echo "   3. Ejecutar payForSave()"
    echo "   4. Procesar eventos SavePaid"
    echo "   5. Confirmar mint success"
    echo ""
    echo "🔧 Características Técnicas:"
    echo "   • ABI completo del token $ADRIAN"
    echo "   • 18 decimales (wei)"
    echo "   • Transacciones secuenciales"
    echo "   • Manejo de eventos mejorado"
    echo "   • Logs detallados en consola"
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
echo "🎉 ¡Disfruta de las transacciones en cascada!" 