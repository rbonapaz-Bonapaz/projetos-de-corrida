import type { NextConfig } from 'next';

/** @type {import('next').NextConfig} */
const nextConfig: NextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
  },
  serverExternalPackages: ['genkit', '@genkit-ai/google-genai'],
  webpack: (config, { isServer, webpack }) => {
    if (!isServer) {
      // Polyfills para compatibilidade de navegador (Plano Spark)
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: require.resolve('path-browserify'),
        os: require.resolve('os-browserify/browser'),
        child_process: false,
        net: false,
        tls: false,
        dns: false,
        http2: false,
        async_hooks: false,
        dgram: false,
        readline: false,
        perf_hooks: false,
        worker_threads: false,
        buffer: require.resolve('buffer/'),
        stream: require.resolve('stream-browserify'),
        util: require.resolve('util/'),
        events: require.resolve('events/'),
        process: require.resolve('process/browser'),
        url: require.resolve('url/'),
        http: require.resolve('stream-http'),
        https: require.resolve('https-browserify'),
        zlib: require.resolve('browserify-zlib'),
      };
      
      // Resolve o erro UnhandledSchemeError para prefixos node: (https, async_hooks, etc)
      config.plugins.push(
        new webpack.NormalModuleReplacementPlugin(
          /^node:/,
          (resource: any) => {
            resource.request = resource.request.replace(/^node:/, '');
          }
        ),
        // Injeção global de Buffer e process para a IA
        new webpack.ProvidePlugin({
          Buffer: ['buffer', 'Buffer'],
          process: 'process/browser',
        })
      );

      // Alias adicionais para garantir que stubs de servidor não quebrem o build
      config.resolve.alias = {
        ...config.resolve.alias,
        'async_hooks': false,
        'perf_hooks': false,
        'worker_threads': false,
      };
    }
    return config;
  },
};

export default nextConfig;
