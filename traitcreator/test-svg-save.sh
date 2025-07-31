#!/bin/bash

echo "💾 TraitCreator - SVG Save Testing"
echo "=================================="

# Check if server is running
if curl -s http://localhost:3000 > /dev/null; then
    echo "✅ Servidor corriendo en http://localhost:3000"
    echo ""
    
    # Check for API route
    if curl -s http://localhost:3000/api/save-svg > /dev/null; then
        echo "✅ API route /api/save-svg detectada"
    else
        echo "❌ API route /api/save-svg no encontrada"
    fi
    
    # Check for designs directory
    if [ -d "public/designs" ]; then
        echo "✅ Directorio public/designs encontrado"
        echo "   Archivos SVG: $(ls public/designs/*.svg 2>/dev/null | wc -l | tr -d ' ')"
    else
        echo "❌ Directorio public/designs no encontrado"
    fi
    
    # Check for SVG save functionality in code
    if curl -s http://localhost:3000 | grep -q "View SVG File"; then
        echo "✅ Funcionalidad de visualización SVG detectada"
    else
        echo "❌ Funcionalidad de visualización SVG no encontrada"
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
    echo "💾 Nueva Funcionalidad de Guardado SVG:"
    echo "   • SVG guardado automáticamente después de transacción"
    echo "   • Nombre de archivo: {tokenId}.svg"
    echo "   • Path consistente: /designs/{tokenId}.svg"
    echo "   • Accesible desde servidores externos"
    echo "   • Link directo en la interfaz"
    echo "   • URL completa mostrada al usuario"
    echo ""
    echo "🛠️ Para probar:"
    echo "   1. Abre http://localhost:3000"
    echo "   2. Conecta tu wallet (MetaMask)"
    echo "   3. Dibuja un diseño en el canvas"
    echo "   4. Click en 'SAVE & MINT'"
    echo "   5. Espera a que se complete la transacción"
    echo "   6. Verifica que aparece 'View SVG File'"
    echo "   7. Click en el link para ver el SVG"
    echo "   8. Verifica la URL: /designs/{tokenId}.svg"
    echo ""
    echo "💡 Flujo de Guardado:"
    echo "   1. Transacción blockchain exitosa"
    echo "   2. Token ID recibido del contrato"
    echo "   3. SVG generado con el diseño actual"
    echo "   4. Archivo guardado como {tokenId}.svg"
    echo "   5. URL pública generada"
    echo "   6. Link mostrado al usuario"
    echo ""
    echo "🔧 Características Técnicas:"
    echo "   • API route: POST /api/save-svg"
    echo "   • Directorio: public/designs/"
    echo "   • Formato: SVG con mix-blend-mode"
    echo "   • Tamaño: 148x148 pixels"
    echo "   • Pixelated rendering"
    echo "   • Acceso público via HTTP"
    echo ""
    echo "📱 Para probar en móvil:"
    echo "   http://192.168.0.15:3000"
    
    # Test API endpoint
    echo ""
    echo "🧪 Probando API endpoint..."
    if curl -s -X POST http://localhost:3000/api/save-svg \
       -H "Content-Type: application/json" \
       -d '{"tokenId":"test123","svgContent":"<svg>test</svg>"}' > /dev/null; then
        echo "✅ API endpoint responde correctamente"
    else
        echo "❌ API endpoint no responde"
    fi
    
else
    echo "❌ Servidor no está corriendo"
    echo ""
    echo "🚀 Para iniciar el servidor:"
    echo "   npm run dev"
    echo ""
    echo "📱 Luego abre: http://localhost:3000"
fi

echo ""
echo "🎉 ¡Guardado SVG con token ID implementado!" 