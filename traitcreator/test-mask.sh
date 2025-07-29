#!/bin/bash

echo "🎨 TraitCreator - Alpha Mask Testing"
echo "===================================="

# Check if server is running
if curl -s http://localhost:3000 > /dev/null; then
    echo "✅ Servidor corriendo en http://localhost:3000"
    echo ""
    
    # Check for mask functionality
    if curl -s http://localhost:3000 | grep -q "Mask loaded"; then
        echo "✅ Máscara alfa detectada - Funcionalidad activa"
    else
        echo "❌ Máscara alfa no encontrada"
    fi
    
    # Check for T-shirt file
    if [ -f "public/T-Shirt-148x148.svg" ]; then
        echo "✅ Archivo T-Shirt-148x148.svg encontrado en public/"
        echo "   Tamaño: $(ls -lh public/T-Shirt-148x148.svg | awk '{print $5}')"
    else
        echo "❌ Archivo T-Shirt-148x148.svg no encontrado en public/"
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
    echo "🎯 Nueva funcionalidad Alpha Mask:"
    echo "   • Restricción basada en canal alfa del SVG"
    echo "   • Solo se puede dibujar en píxeles con color"
    echo "   • Área pintable dinámica según la T-shirt"
    echo "   • Mix-blend-mode multiply para integración"
    echo ""
    echo "🛠️ Para probar:"
    echo "   1. Abre http://localhost:3000"
    echo "   2. Verifica que aparece 'Mask loaded'"
    echo "   3. Intenta dibujar fuera de la T-shirt (no debería funcionar)"
    echo "   4. Dibuja solo en el área de la T-shirt"
    echo "   5. Verifica que el mix-blend-mode funciona"
    echo ""
    echo "💡 Características de la máscara alfa:"
    echo "   • Análisis automático del SVG de la T-shirt"
    echo "   • Detección de píxeles con color vs transparentes"
    echo "   • Restricción precisa del área pintable"
    echo "   • Compatible con diferentes tamaños de pincel"
    echo "   • Integración perfecta con mix-blend-mode"
    
else
    echo "❌ Servidor no está corriendo"
    echo ""
    echo "🚀 Para iniciar el servidor:"
    echo "   npm run dev"
    echo ""
    echo "📱 Luego abre: http://localhost:3000"
fi

echo ""
echo "🎉 ¡Disfruta del dibujo restringido por alfa!" 