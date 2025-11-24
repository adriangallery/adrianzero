#!/bin/bash

# Script para subir cambios a GitHub evitando problemas con el editor interactivo

# Eliminar archivos swap
find .git -name "*.swp" -delete 2>/dev/null

# Configurar git para no usar editor interactivo
export GIT_EDITOR=true
export EDITOR=true

# Intentar abortar el rebase si está en progreso
git rebase --abort 2>/dev/null || true

# Esperar un momento
sleep 1

# Verificar estado
echo "Estado actual de git:"
git status

# Agregar todos los cambios
echo "Agregando cambios..."
git add .

# Hacer commit con mensaje automático
echo "Haciendo commit..."
git commit -m "Actualizar cambios" || echo "No hay cambios para commitear"

# Hacer push
echo "Subiendo a GitHub..."
git push origin main || git push origin HEAD

echo "¡Listo!"

