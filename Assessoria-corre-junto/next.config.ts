import type { NextConfig } from 'next';

/** @type {import('next').NextConfig} */
const nextConfig: NextConfig = {
  // Exportação estática (Firebase Hosting / Plano Spark).
  output: 'export',
  images: {
    unoptimized: true,
  },
  // A IA roda 100% no navegador via @google/generative-ai (fetch nativo),
  // portanto não são necessários polyfills de módulos Node no cliente.
};

export default nextConfig;
