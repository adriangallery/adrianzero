#!/bin/bash

echo "📱 TraitCreator - Mobile Testing"
echo "================================"

# Check if server is running
if curl -s http://localhost:3000 > /dev/null; then
    echo "✅ Servidor corriendo en http://localhost:3000"
    echo ""
    
    # Check for mobile responsive classes
    if curl -s http://localhost:3000 | grep -q "block lg:hidden"; then
        echo "✅ Layout mobile detectado"
    else
        echo "❌ Layout mobile no encontrado"
    fi
    
    # Check for touch events
    if curl -s http://localhost:3000 | grep -q "onTouchStart"; then
        echo "✅ Eventos táctiles detectados"
    else
        echo "❌ Eventos táctiles no encontrados"
    fi
    
    # Check for mobile-friendly classes
    if curl -s http://localhost:3000 | grep -q "text-xs sm:text-sm"; then
        echo "✅ Texto responsive detectado"
    else
        echo "❌ Texto responsive no encontrado"
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
    echo "📱 Funcionalidades Mobile Implementadas:"
    echo "   • Layout responsive (mobile/desktop)"
    echo "   • Eventos táctiles (touchstart, touchmove, touchend)"
    echo "   • Canvas optimizado para móviles"
    echo "   • Controles touch-friendly"
    echo "   • Texto y botones responsive"
    echo "   • Máscara alfa para restricción de dibujo"
    echo ""
    echo "🛠️ Para probar en móvil:"
    echo "   1. Abre http://localhost:3000 en tu móvil"
    echo "   2. Verifica que el layout se adapta"
    echo "   3. Prueba dibujar con el dedo"
    echo "   4. Verifica que los controles son táctiles"
    echo "   5. Comprueba que solo puedes dibujar en la T-shirt"
    echo ""
    echo "💡 Características mobile:"
    echo "   • Canvas con maxWidth: 100vw"
    echo "   • Canvas con maxHeight: 60vh"
    echo "   • Touch events con preventDefault"
    echo "   • Botones más grandes para touch"
    echo "   • Texto responsive (xs en móvil, sm en desktop)"
    echo "   • Layout vertical en móvil, horizontal en desktop"
    
else
    echo "❌ Servidor no está corriendo"
    echo ""
    echo "🚀 Para iniciar el servidor:"
    echo "   npm run dev"
    echo ""
    echo "📱 Luego abre: http://localhost:3000"
fi

echo ""
echo "📱 Para probar en móvil real:"
echo "   1. Encuentra tu IP local: ifconfig | grep inet"
echo "   2. Abre http://[TU_IP]:3000 en tu móvil"
echo "   3. Asegúrate de estar en la misma red WiFi"
echo ""
echo "🎉 ¡Disfruta del TraitCreator mobile-friendly!" 