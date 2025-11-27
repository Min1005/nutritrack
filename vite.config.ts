
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, process.cwd(), '');

  return {
    define: {
      // This is the key fix: It maps the VITE_API_KEY (safe for browser) 
      // to process.env.API_KEY (expected by the code)
      'process.env.API_KEY': JSON.stringify(env.VITE_API_KEY),
    },
    plugins: [
      react(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg'],
        manifest: {
          name: 'NutriTrack AI',
          short_name: 'NutriTrack',
          description: 'AI-powered daily diet and workout tracker',
          theme_color: '#ffffff',
          background_color: '#ffffff',
          display: 'standalone', // This hides the browser UI
          orientation: 'portrait',
          icons: [
            {
              src: 'https://cdn-icons-png.flaticon.com/512/2921/2921822.png',
              sizes: '192x192',
              type: 'image/png'
            },
            {
              src: 'https://cdn-icons-png.flaticon.com/512/2921/2921822.png',
              sizes: '512x512',
              type: 'image/png'
            }
          ]
        }
      })
    ],
    server: {
      host: true,
      port: 5173,
    },
    // @ts-ignore
    test: {
      globals: true,
      environment: 'jsdom',
    },
  };
});