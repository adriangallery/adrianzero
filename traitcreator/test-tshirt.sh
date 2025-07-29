#!/bin/bash

echo "🎨 TraitCreator - T-Shirt Canvas Testing"
echo "========================================"

# Check if server is running
if curl -s http://localhost:3000 > /dev/null; then
    echo "✅ Servidor corriendo en http://localhost:3000"
    echo ""
    
    # Check for T-shirt canvas
    if curl -s http://localhost:3000 | grep -q "T-SHIRT CANVAS"; then
        echo "✅ T-SHIRT CANVAS detectado - Funcionalidad activa"
    else
        echo "❌ T-SHIRT CANVAS no encontrado"
    fi
    
    # Check for tshirt.svg file
    if [ -f "tshirt.svg" ]; then
        echo "✅ Archivo tshirt.svg encontrado"
        echo "   Tamaño: $(ls -lh tshirt.svg | awk '{print $5}')"
    else
        echo "❌ Archivo tshirt.svg no encontrado"
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
    echo "🎯 Nueva funcionalidad T-Shirt:"
    echo "   • Canvas con T-shirt como fondo"
    echo "   • Dibujo directo sobre la camiseta"
    echo "   • Exportación SVG con T-shirt incluida"
    echo "   • Opacidad ajustada para mejor visibilidad"
    echo ""
    echo "🛠️ Para probar:"
    echo "   1. Abre http://localhost:3000"
    echo "   2. Verifica que ves la T-shirt como fondo"
    echo "   3. Dibuja algunos píxeles sobre la camiseta"
    echo "   4. Guarda el diseño (incluirá la T-shirt)"
    echo "   5. Verifica el archivo SVG descargado"
    echo ""
    echo "💡 Características del T-shirt canvas:"
    echo "   • Fondo semitransparente (40% opacidad)"
    echo "   • Cursor crosshair para mejor precisión"
    echo "   • Grid overlay opcional"
    echo "   • Zoom para trabajo detallado"
    echo "   • Exportación vectorial completa"
    
else
    echo "❌ Servidor no está corriendo"
    echo ""
    echo "🚀 Para iniciar el servidor:"
    echo "   npm run dev"
    echo ""
    echo "📱 Luego abre: http://localhost:3000"
fi

echo ""
echo "🎉 ¡Disfruta dibujando sobre la T-shirt!" 