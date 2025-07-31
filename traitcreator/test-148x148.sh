#!/bin/bash

echo "🎨 TraitCreator 148x148 - Testing Script"
echo "========================================"

# Check if server is running
if curl -s http://localhost:3000 > /dev/null; then
    echo "✅ Servidor corriendo en http://localhost:3000"
    echo ""
    
    # Check for new canvas size
    if curl -s http://localhost:3000 | grep -q "148.*148"; then
        echo "✅ Canvas 148x148 detectado"
    else
        echo "❌ Canvas 148x148 no encontrado"
    fi
    
    # Check for new T-shirt file
    if [ -f "T-Shirt-148x148.svg" ]; then
        echo "✅ Archivo T-Shirt-148x148.svg encontrado"
        echo "   Tamaño: $(ls -lh T-Shirt-148x148.svg | awk '{print $5}')"
    else
        echo "❌ Archivo T-Shirt-148x148.svg no encontrado"
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
    echo "🎯 Nuevas funcionalidades 148x148:"
    echo "   • Canvas de 148x148 píxeles"
    echo "   • Área pintable restringida"
    echo "   • Mix-blend-mode multiply"
    echo "   • Exportación SVG pixelada"
    echo "   • T-shirt actualizada"
    echo ""
    echo "🛠️ Para probar:"
    echo "   1. Verifica que el canvas no ocupe toda la pantalla"
    echo "   2. Comprueba que los controles sean visibles"
    echo "   3. Dibuja en el área de la T-shirt"
    echo "   4. Verifica el mix-blend-mode multiply"
    echo "   5. Guarda el diseño y revisa el SVG"
    echo ""
    echo "💡 Características del nuevo canvas:"
    echo "   • Tamaño: 148x148 píxeles"
    echo "   • Pixel size: 3px (ajustado)"
    echo "   • Área pintable: Solo la T-shirt"
    echo "   • Blend mode: Multiply"
    echo "   • Exportación: Pixelada"
    
else
    echo "❌ Servidor no está corriendo"
    echo ""
    echo "🚀 Para iniciar el servidor:"
    echo "   npm run dev"
    echo ""
    echo "📱 Luego abre: http://localhost:3000"
fi

echo ""
echo "🎉 ¡Disfruta del nuevo canvas 148x148!" 