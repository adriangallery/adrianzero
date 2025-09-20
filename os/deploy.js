// Script de despliegue para AdrianLAB OpenSea Integration
// Este script reemplaza la API key en el código antes del despliegue

const fs = require('fs');
const path = require('path');

// Función para reemplazar la API key en los archivos
function replaceApiKey(apiKey) {
    const files = ['app.js', 'config.js'];
    
    files.forEach(file => {
        const filePath = path.join(__dirname, file);
        
        if (fs.existsSync(filePath)) {
            let content = fs.readFileSync(filePath, 'utf8');
            
            // Reemplazar placeholder con la API key real
            content = content.replace(/OPENSEA_API_KEY/g, apiKey);
            content = content.replace(/process\.env\.OPENSEA_API_KEY/g, `'${apiKey}'`);
            
            fs.writeFileSync(filePath, content);
            console.log(`✅ API key actualizada en ${file}`);
        }
    });
}

// Función para crear versión de producción
function createProductionVersion() {
    const sourceDir = __dirname;
    const buildDir = path.join(__dirname, 'dist');
    
    // Crear directorio de build si no existe
    if (!fs.existsSync(buildDir)) {
        fs.mkdirSync(buildDir);
    }
    
    // Copiar archivos necesarios
    const filesToCopy = ['index.html', 'styles.css', 'app.js', 'config.js'];
    
    filesToCopy.forEach(file => {
        const sourcePath = path.join(sourceDir, file);
        const destPath = path.join(buildDir, file);
        
        if (fs.existsSync(sourcePath)) {
            fs.copyFileSync(sourcePath, destPath);
            console.log(`✅ ${file} copiado a dist/`);
        }
    });
    
    console.log('✅ Versión de producción creada en dist/');
}

// Función principal
function main() {
    const apiKey = process.env.OPENSEA_API_KEY;
    
    if (!apiKey) {
        console.error('❌ Error: OPENSEA_API_KEY no está definida en las variables de entorno');
        process.exit(1);
    }
    
    console.log('🚀 Iniciando proceso de despliegue...');
    
    // Reemplazar API key
    replaceApiKey(apiKey);
    
    // Crear versión de producción
    createProductionVersion();
    
    console.log('✅ Despliegue completado exitosamente');
}

// Ejecutar si es llamado directamente
if (require.main === module) {
    main();
}

module.exports = {
    replaceApiKey,
    createProductionVersion,
    main
};
