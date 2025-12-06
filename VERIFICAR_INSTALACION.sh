#!/usr/bin/env bash
# Script de verificación rápida del sistema de moderación

# PASOS PARA VERIFICAR QUE TODO FUNCIONA CORRECTAMENTE
# ═════════════════════════════════════════════════════════════════════════

# 1. VERIFICAR ARCHIVOS EXISTENTES
echo "✅ Verificando archivos..."
echo ""
echo "Archivos NUEVOS que deberían existir:"
ls -lh moderator.js MODERACION.md TEST_MODERACION.js README_MODERACION.md RESUMEN_IMPLEMENTACION.txt GUIA_RAPIDA.md EJEMPLOS_INTERFAZ.js 2>/dev/null || echo "❌ Algunos archivos no encontrados"

echo ""
echo "Archivos MODIFICADOS (verificar que tengan <script src=\"moderator.js\"></script>):"
grep -l "moderator.js" index.html 2>/dev/null && echo "✅ index.html - moderator.js cargado" || echo "❌ index.html - moderator.js NO encontrado"

echo ""

# 2. VERIFICAR CONTENIDO DE ARCHIVOS
echo "✅ Verificando contenido de archivos..."
echo ""

# Verificar que moderator.js tiene la clase CommentModerator
grep -q "class CommentModerator" moderator.js && echo "✅ moderator.js - Clase CommentModerator encontrada" || echo "❌ moderator.js - Clase NO encontrada"

# Verificar que moderator.js tiene el método buildRegexes
grep -q "buildRegexes()" moderator.js && echo "✅ moderator.js - Método buildRegexes() encontrado" || echo "❌ moderator.js - Método buildRegexes() NO encontrado"

# Verificar que comments.js usa el moderador
grep -q "this.moderator.moderate" comments.js && echo "✅ comments.js - Usa this.moderator.moderate()" || echo "❌ comments.js - NO usa el moderador"

# Verificar que comments.js tiene getMessage amigables
grep -q "getUserFriendlyMessage" comments.js && echo "✅ comments.js - Tiene getUserFriendlyMessage()" || echo "❌ comments.js - NO tiene getUserFriendlyMessage()"

echo ""

# 3. VERIFICAR PALABRAS OFENSIVAS
echo "✅ Verificando listas de palabras ofensivas..."
echo ""

# Contar palabras españolas
spanish_count=$(grep -o "'[^']*'" moderator.js | grep -c "^'[^']*'$" || true)
echo "   Palabras españolas en moderator.js: $(grep "spanish:" -A 50 moderator.js | grep -o "'" | wc -l) menciones"

echo ""

# 4. EXPLICAR SIGUIENTE PASO
echo "═════════════════════════════════════════════════════════════════════"
echo ""
echo "📝 SIGUIENTE PASO: PROBAR EN EL NAVEGADOR"
echo ""
echo "1. Abre: file:///e:/VS-Code/HTML/serie-educativa/index.html"
echo ""
echo "2. Abre la consola del navegador (F12)"
echo ""
echo "3. Prueba estos comandos:"
echo ""
echo "   // Comentario válido:"
echo "   window.commentSystem.moderator.moderate('¡Excelente contenido!')"
echo ""
echo "   // Palabra ofensiva:"
echo "   window.commentSystem.moderator.moderate('Esto es pendejada')"
echo ""
echo "   // Intento de evasión:"
echo "   window.commentSystem.moderator.moderate('P1d3j0 total')"
echo ""
echo "   // Ver historial:"
echo "   JSON.parse(localStorage.getItem('moderationHistory'))"
echo ""
echo "4. Prueba escribiendo comentarios directamente en la interfaz"
echo ""
echo "═════════════════════════════════════════════════════════════════════"
echo ""
echo "✅ VERIFICACIÓN COMPLETADA"
echo ""
