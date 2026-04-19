#!/usr/bin/env node

/**
 * Script de verificación para el deploy de Vercel
 * Verifica que todos los endpoints y assets estén funcionando correctamente
 */

const https = require('https');
const http = require('http');

// Configuración
const BASE_URL = process.argv[2] || 'http://localhost:3000';
const TIMEOUT = 5000;

console.log(`🔍 Verificando deploy en: ${BASE_URL}\n`);

// Lista de endpoints y assets a verificar
const checks = [
    {
        name: 'Página Principal',
        path: '/',
        expectedContent: 'Shooter Game - Onchain Rewards'
    },
    {
        name: 'Health Check API',
        path: '/api/health',
        expectedContent: '"status":"ok"'
    },
    {
        name: 'Config API',
        path: '/api/config',
        expectedContent: 'contractAddress'
    },
    {
        name: 'Archivo CSS',
        path: '/styles.css',
        expectedContent: 'body'
    },
    {
        name: 'Imagen de fondo',
        path: '/level1.png',
        binary: true
    },
    {
        name: 'GIF Zombie',
        path: '/Zombie_Adrian.gif',
        binary: true
    },
    {
        name: 'Crosshair',
        path: '/images/crosshair.png',
        binary: true
    },
    {
        name: 'Audio',
        path: '/music/DeadOfNight.mp3',
        binary: true
    }
];

// Función para hacer request HTTP/HTTPS
function makeRequest(url) {
    return new Promise((resolve, reject) => {
        const client = url.startsWith('https:') ? https : http;
        
        const req = client.get(url, { timeout: TIMEOUT }, (res) => {
            let data = '';
            
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                resolve({
                    statusCode: res.statusCode,
                    headers: res.headers,
                    data: data
                });
            });
        });
        
        req.on('timeout', () => {
            req.destroy();
            reject(new Error('Request timeout'));
        });
        
        req.on('error', (err) => {
            reject(err);
        });
    });
}

// Función para verificar un endpoint
async function checkEndpoint(check) {
    const url = BASE_URL + check.path;
    
    try {
        const response = await makeRequest(url);
        
        // Verificar status code
        if (response.statusCode !== 200) {
            return {
                success: false,
                error: `Status code: ${response.statusCode}`
            };
        }
        
        // Para archivos binarios, solo verificar que existan
        if (check.binary) {
            return {
                success: true,
                message: `✅ Binary file loaded (${response.data.length} bytes)`
            };
        }
        
        // Verificar contenido esperado
        if (check.expectedContent && !response.data.includes(check.expectedContent)) {
            return {
                success: false,
                error: `Expected content not found: "${check.expectedContent}"`
            };
        }
        
        return {
            success: true,
            message: '✅ OK'
        };
        
    } catch (error) {
        return {
            success: false,
            error: error.message
        };
    }
}

// Ejecutar todas las verificaciones
async function runChecks() {
    let passedChecks = 0;
    let totalChecks = checks.length;
    
    console.log('Ejecutando verificaciones...\n');
    
    for (const check of checks) {
        process.stdout.write(`${check.name.padEnd(25)} ... `);
        
        const result = await checkEndpoint(check);
        
        if (result.success) {
            console.log(result.message);
            passedChecks++;
        } else {
            console.log(`❌ FALLO: ${result.error}`);
        }
    }
    
    console.log(`\n📊 Resultados: ${passedChecks}/${totalChecks} verificaciones pasaron`);
    
    if (passedChecks === totalChecks) {
        console.log('🎉 ¡Todos los checks pasaron! Deploy exitoso.');
        process.exit(0);
    } else {
        console.log('⚠️  Algunos checks fallaron. Revisa la configuración.');
        process.exit(1);
    }
}

// Ejecutar script
runChecks().catch(console.error);
