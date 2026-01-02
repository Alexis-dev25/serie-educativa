/**
 * ============================================
 * CONFIGURACIÓN DE FIREBASE
 * ============================================
 * INSTRUCCIONES:
 * 1. Reemplaza los valores entre comillas con tus credenciales de Firebase
 * 2. Obtén estos valores desde: Firebase Console > Project Settings > General
 * 3. No comitas este archivo si contiene datos sensibles (añade a .gitignore)
 * ============================================
 */

const FIREBASE_CONFIG = {
    apiKey: "AIzaSyCaWdZXzilLuZpicDYghG0P09vH0WKDzkA",
    authDomain: "academia-7b07b.firebaseapp.com",
    databaseURL: "https://academia-7b07b-default-rtdb.firebaseio.com",
    projectId: "academia-7b07b",
    storageBucket: "academia-7b07b.firebasestorage.app",
    messagingSenderId: "877002159008",
    appId: "1:877002159008:web:dc382da8c9142123ec6ac5",
    measurementId: "G-1K5DY72RHL"
};

/**
 * Validación básica de configuración
 */
function validateFirebaseConfig() {
  const requiredFields = ['apiKey', 'projectId', 'databaseURL'];
  const missing = requiredFields.filter(field => !FIREBASE_CONFIG[field]);
  
  if (missing.length > 0) {
    console.warn('⚠️ Campos de Firebase faltantes:', missing);
    return false;
  }
  
  console.log('✅ Configuración de Firebase validada');
  return true;
}
