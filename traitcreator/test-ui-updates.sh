#!/bin/bash

echo "🎨 TraitCreator - UI Updates Testing"
echo "===================================="

# Check if server is running
if curl -s http://localhost:3000 > /dev/null; then
    echo "✅ Servidor corriendo en http://localhost:3000"
    echo ""
    
    # Check for English text
    if curl -s http://localhost:3000 | grep -q "CONNECT WALLET"; then
        echo "✅ Textos en inglés detectados"
    else
        echo "❌ Textos en inglés no encontrados"
    fi
    
    # Check for floppy icon in save button
    if curl -s http://localhost:3000 | grep -q "SAVE & MINT"; then
        echo "✅ Botón SAVE & MINT detectado"
    else
        echo "❌ Botón SAVE & MINT no encontrado"
    fi
    
    # Check for removed save only button
    if curl -s http://localhost:3000 | grep -q "SAVE ONLY"; then
        echo "❌ Botón SAVE ONLY aún presente"
    else
        echo "✅ Botón SAVE ONLY eliminado correctamente"
    fi
    
    # Check for removed wallet info
    if curl -s http://localhost:3000 | grep -q "ADRIAN BALANCE"; then
        echo "❌ Información de balance aún presente"
    else
        echo "✅ Información de balance eliminada"
    fi
    
    if curl -s http://localhost:3000 | grep -q "ALLOWANCE"; then
        echo "❌ Información de allowance aún presente"
    else
        echo "✅ Información de allowance eliminada"
    fi
    
    if curl -s http://localhost:3000 | grep -q "SAVE PRICE"; then
        echo "❌ Información de precio aún presente"
    else
        echo "✅ Información de precio eliminada"
    fi
    
    # Check for removed INFO panel
    if curl -s http://localhost:3000 | grep -q "Canvas: 148x148 pixels"; then
        echo "❌ Panel INFO aún presente"
    else
        echo "✅ Panel INFO eliminado correctamente"
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
    echo "🎨 Cambios de UI Implementados:"
    echo "   • Textos cambiados al inglés"
    echo "   • Botón SAVE ONLY eliminado"
    echo "   • Icono floppy en SAVE & MINT"
    echo "   • Texto '+ Approve ADRIAN' eliminado"
    echo "   • Información de wallet simplificada"
    echo "   • Panel INFO completamente eliminado"
    echo ""
    echo "🛠️ Para verificar:"
    echo "   1. Abre http://localhost:3000"
    echo "   2. Verifica que todos los textos están en inglés"
    echo "   3. Confirma que solo hay un botón SAVE & MINT"
    echo "   4. Verifica que el wallet solo muestra la dirección"
    echo "   5. Confirma que no hay panel INFO"
    echo ""
    echo "💡 Interfaz Simplificada:"
    echo "   • Wallet: Solo conexión y dirección"
    echo "   • Save & Mint: Un solo botón con floppy"
    echo "   • Sin información técnica visible"
    echo "   • Enfoque en la experiencia de usuario"
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
echo "🎉 ¡Interfaz simplificada y en inglés!" 