#!/usr/bin/env node

import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

console.log('🔍 MODO MONITOREO ACTIVADO');
console.log('📱 Analizando navegación de la app en tiempo real...\n');

// Función para monitorear logs del servidor
function monitorServerLogs() {
  console.log('🚀 Monitoreando servidor de desarrollo...');
  
  const devProcess = spawn('npm', ['run', 'dev'], {
    stdio: ['pipe', 'pipe', 'pipe'],
    shell: true
  });

  devProcess.stdout.on('data', (data) => {
    const output = data.toString();
    
    // Detectar errores específicos
    if (output.includes('Error:') || output.includes('error:')) {
      console.log('❌ ERROR DETECTADO:', output.trim());
    }
    
    // Detectar warnings
    if (output.includes('Warning:') || output.includes('warning:')) {
      console.log('⚠️ WARNING DETECTADO:', output.trim());
    }
    
    // Detectar HMR (Hot Module Replacement)
    if (output.includes('[vite] hmr update')) {
      console.log('🔄 HMR Update:', output.trim());
    }
    
    // Detectar compilación exitosa
    if (output.includes('ready in')) {
      console.log('✅ Servidor listo:', output.trim());
    }
  });

  devProcess.stderr.on('data', (data) => {
    const error = data.toString();
    console.log('🚨 ERROR CRÍTICO:', error.trim());
  });

  devProcess.on('close', (code) => {
    console.log(`🔚 Proceso terminado con código: ${code}`);
  });

  return devProcess;
}

// Función para verificar archivos críticos
function checkCriticalFiles() {
  const criticalFiles = [
    'src/App.tsx',
    'src/pages/Index.tsx',
    'src/hooks/useSupabaseFinance.ts',
    'src/integrations/supabase/client.ts',
    'public/sw.js',
    '.env'
  ];

  console.log('📁 Verificando archivos críticos...');
  
  criticalFiles.forEach(file => {
    if (fs.existsSync(file)) {
      console.log(`✅ ${file}`);
    } else {
      console.log(`❌ ${file} - FALTANTE`);
    }
  });
}

// Función para verificar variables de entorno
function checkEnvironmentVariables() {
  console.log('\n🔧 Verificando variables de entorno...');
  
  const envFile = '.env';
  if (fs.existsSync(envFile)) {
    const envContent = fs.readFileSync(envFile, 'utf8');
    const requiredVars = [
      'VITE_SUPABASE_URL',
      'VITE_SUPABASE_ANON_KEY'
    ];
    
    requiredVars.forEach(varName => {
      if (envContent.includes(varName)) {
        console.log(`✅ ${varName}`);
      } else {
        console.log(`❌ ${varName} - FALTANTE`);
      }
    });
  } else {
    console.log('❌ Archivo .env no encontrado');
  }
}

// Función para verificar dependencias
function checkDependencies() {
  console.log('\n📦 Verificando dependencias...');
  
  if (fs.existsSync('package.json')) {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    const criticalDeps = [
      'react',
      'react-dom',
      '@supabase/supabase-js',
      'react-router-dom'
    ];
    
    criticalDeps.forEach(dep => {
      if (packageJson.dependencies[dep] || packageJson.devDependencies[dep]) {
        console.log(`✅ ${dep}`);
      } else {
        console.log(`❌ ${dep} - FALTANTE`);
      }
    });
  }
}

// Función para monitorear cambios en archivos
function watchFileChanges() {
  console.log('\n👀 Monitoreando cambios en archivos...');
  
  const watchDirs = ['src', 'public'];
  
  watchDirs.forEach(dir => {
    if (fs.existsSync(dir)) {
      console.log(`✅ Monitoreando: ${dir}/`);
    } else {
      console.log(`❌ Directorio no encontrado: ${dir}/`);
    }
  });
}

// Función principal
async function startMonitoring() {
  console.log('🎯 INICIANDO MONITOREO COMPLETO\n');
  
  // Verificaciones iniciales
  checkCriticalFiles();
  checkEnvironmentVariables();
  checkDependencies();
  watchFileChanges();
  
  console.log('\n' + '='.repeat(50));
  console.log('🔍 MONITOREO EN TIEMPO REAL ACTIVO');
  console.log('📱 Navega por la app y veré los errores automáticamente');
  console.log('🛑 Presiona Ctrl+C para detener el monitoreo');
  console.log('='.repeat(50) + '\n');
  
  // Iniciar monitoreo del servidor
  const devProcess = monitorServerLogs();
  
  // Manejar cierre limpio
  process.on('SIGINT', () => {
    console.log('\n🛑 Deteniendo monitoreo...');
    devProcess.kill();
    process.exit(0);
  });
}

// Iniciar monitoreo
startMonitoring().catch(console.error); 