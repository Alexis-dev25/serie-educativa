#!/bin/bash
# Script de verificación de mejoras
# Ejecutar en la carpeta raíz de serie-educativa

echo "================================================"
echo "✅ VERIFICACIÓN DE MEJORAS - SERIE EDUCATIVA"
echo "================================================"
echo ""

# Colores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Función para verificar archivo
check_file() {
    if [ -f "$1" ]; then
        echo -e "${GREEN}✅${NC} $1 existe"
        return 0
    else
        echo -e "${RED}❌${NC} $1 NO existe"
        return 1
    fi
}

# Función para contar líneas
count_lines() {
    if [ -f "$1" ]; then
        wc -l < "$1"
    else
        echo "0"
    fi
}

echo "📁 VERIFICANDO ARCHIVOS PRINCIPALES"
echo "---"
check_file "chatbot.js"
check_file "chatbot.css"
check_file "console-simulator.js"
check_file "console-simulator.css"
check_file "sitemap.xml"
check_file "robots.txt"
echo ""

echo "📁 VERIFICANDO DOCUMENTACIÓN"
echo "---"
check_file "INICIO_RAPIDO.md"
check_file "README_MEJORAS.md"
check_file "MEJORAS_IMPLEMENTADAS.md"
check_file "GUIA_APLICAR_MEJORAS.md"
check_file "MATRIZ_MEJORAS.md"
echo ""

echo "📁 VERIFICANDO PÁGINAS DE LENGUAJES"
echo "---"
check_file "lenguajes/python/index.html"
check_file "lenguajes/python/tutorial-styles.css"
check_file "lenguajes/javascript/index.html"
check_file "lenguajes/javascript/tutorial-styles.css"
check_file "lenguajes/html-css/index.html"
check_file "lenguajes/html-css/tutorial-styles.css"
echo ""

echo "📊 ESTADÍSTICAS DE CÓDIGO"
echo "---"
echo "Líneas chatbot.js: $(count_lines 'chatbot.js')"
echo "Líneas console-simulator.js: $(count_lines 'console-simulator.js')"
echo "Líneas python/tutorial-styles.css: $(count_lines 'lenguajes/python/tutorial-styles.css')"
echo ""

echo "🔍 VERIFICANDO CONTENIDO CLAVE"
echo "---"

# Verificar que index.html tiene tags SEO
if grep -q "og:type" "index.html"; then
    echo -e "${GREEN}✅${NC} Open Graph en index.html"
else
    echo -e "${RED}❌${NC} Open Graph NO en index.html"
fi

if grep -q "schema.org" "index.html"; then
    echo -e "${GREEN}✅${NC} Schema.org en index.html"
else
    echo -e "${RED}❌${NC} Schema.org NO en index.html"
fi

# Verificar chatbot
if grep -q "createChatbotUI" "lenguajes/python/index.html"; then
    echo -e "${GREEN}✅${NC} Chatbot integrado en Python"
else
    echo -e "${RED}❌${NC} Chatbot NO en Python"
fi

if grep -q "createConsoleUI" "lenguajes/javascript/index.html"; then
    echo -e "${GREEN}✅${NC} Consola integrada en JavaScript"
else
    echo -e "${RED}❌${NC} Consola NO en JavaScript"
fi

# Verificar tutoriales
if grep -q "tutorial-tabs" "lenguajes/html-css/index.html"; then
    echo -e "${GREEN}✅${NC} Tutorial tabs en HTML/CSS"
else
    echo -e "${RED}❌${NC} Tutorial tabs NO en HTML/CSS"
fi

echo ""
echo "================================================"
echo "✨ VERIFICACIÓN COMPLETADA"
echo "================================================"
echo ""
echo "PRÓXIMOS PASOS:"
echo "1. Abrir en navegador: lenguajes/python/index.html"
echo "2. Probar consola simulada"
echo "3. Escribir en chatbot"
echo "4. Revisar meta tags en navegador (F12)"
echo "5. Leer INICIO_RAPIDO.md para más información"
echo ""
