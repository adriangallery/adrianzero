#!/bin/bash

echo "🎨 TraitCreator Beta - Testing Script"
echo "====================================="

# Check if server is running
if curl -s http://localhost:3000 > /dev/null; then
    echo "✅ Servidor corriendo en http://localhost:3000"
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
    echo "🎯 Funcionalidades para probar:"
    echo "   • Dibujar en el canvas (64x64 píxeles)"
    echo "   • Cambiar colores de la paleta retro"
    echo "   • Usar diferentes tamaños de pincel"
    echo "   • Zoom in/out para detalles"
    echo "   • Toggle grid para precisión"
    echo "   • Undo/Redo acciones"
    echo "   • Guardar diseño como SVG"
    echo ""
    echo "💾 Los archivos se guardan en tu carpeta de descargas"
    echo "📁 Formato: trait-design-[timestamp].svg"
    echo ""
    echo "🔄 Para reiniciar el servidor:"
    echo "   Ctrl+C en la terminal del servidor"
    echo "   npm run dev"
    
else
    echo "❌ Servidor no está corriendo"
    echo ""
    echo "🚀 Para iniciar el servidor:"
    echo "   npm run dev"
    echo ""
    echo "📱 Luego abre: http://localhost:3000"
fi

echo ""
echo "🎉 ¡Disfruta creando diseños únicos!" 