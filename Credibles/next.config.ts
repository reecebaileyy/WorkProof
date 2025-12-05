import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Skip ESLint during builds
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  // Skip TypeScript errors during builds
  typescript: {
    ignoreBuildErrors: true,
  },
  
  // Exclude blockchain folder from webpack processing
  webpack: (config, { isServer }) => {
    config.externals.push(
      "pino-pretty", 
      "lokijs", 
      "encoding",
      "@react-native-async-storage/async-storage",
      "react-native",
      "react-native-fs"
    );
    
    // Ignore blockchain folder from watching - create new object to avoid read-only error
    const existingIgnored = config.watchOptions?.ignored 
      ? (Array.isArray(config.watchOptions.ignored) 
          ? config.watchOptions.ignored 
          : [config.watchOptions.ignored])
      : [];
    
    config.watchOptions = {
      ...config.watchOptions,
      ignored: [
        ...existingIgnored.filter((item): item is string => typeof item === 'string' && item.length > 0),
        '**/blockchain/**',
      ],
    };
    
    // Fix for MetaMask SDK and other packages trying to import React Native modules
    config.resolve.fallback = {
      ...config.resolve.fallback,
      "@react-native-async-storage/async-storage": false,
      "react-native": false,
      "react-native-fs": false,
    };
    
    // Alias React Native modules to false to prevent resolution errors
    config.resolve.alias = {
      ...config.resolve.alias,
      "@react-native-async-storage/async-storage": false,
      "react-native": false,
      "react-native-fs": false,
    };
    
    // Ignore specific modules that cause warnings
    config.ignoreWarnings = [
      ...(config.ignoreWarnings || []),
      // Suppress warnings about React Native modules
      /@metamask\/sdk/,
      /@react-native-async-storage\/async-storage/,
      /react-native/,
      {
        module: /@metamask\/sdk/,
      },
      {
        module: /@react-native-async-storage\/async-storage/,
      },
      {
        message: /Can't resolve '@react-native-async-storage\/async-storage'/,
      },
      {
        message: /Can't resolve 'react-native'/,
      },
    ];
    
    return config;
  },
  async headers() {
    return [
      {
        // Apply headers to all routes
        source: '/:path*',
        headers: [
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin-allow-popups',
          },
          {
            key: 'Cross-Origin-Embedder-Policy',
            value: 'unsafe-none',
          },
          {
            key: 'Content-Security-Policy',
            value: "frame-ancestors 'self' https://*.farcaster.xyz https://*.base.org",
          },
        ],
      },
    ];
  },
};

export default nextConfig;