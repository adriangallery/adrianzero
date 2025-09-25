// Builder Battle - Supabase Configuration
const SUPABASE_CONFIG = {
    url: 'YOUR_SUPABASE_URL', // Reemplazar con tu URL de Supabase
    anonKey: 'YOUR_SUPABASE_ANON_KEY' // Reemplazar con tu clave anónima de Supabase
};

// Admin address (same as original)
const ADMIN_ADDRESS = '0x1234567890123456789012345678901234567890'; // Reemplazar con tu dirección admin

// Export for use in other files
window.SUPABASE_CONFIG = SUPABASE_CONFIG;
window.ADMIN_ADDRESS = ADMIN_ADDRESS;
