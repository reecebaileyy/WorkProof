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
    config.externals.push("pino-pretty", "lokijs", "encoding");
    
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
    
    // Fix for MetaMask SDK trying to import React Native modules in web context
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        "@react-native-async-storage/async-storage": false,
      };
      
      // Ignore React Native modules that MetaMask SDK might try to import
      config.resolve.alias = {
        ...config.resolve.alias,
        "@react-native-async-storage/async-storage": false,
      };
      
      // Ignore specific modules that cause warnings - suppress all MetaMask SDK warnings
      config.ignoreWarnings = [
        ...(config.ignoreWarnings || []),
        // Suppress warnings about React Native modules in MetaMask SDK
        /@metamask\/sdk/,
        /@react-native-async-storage\/async-storage/,
        {
          module: /@metamask\/sdk/,
        },
        {
          message: /Can't resolve '@react-native-async-storage\/async-storage'/,
        },
      ];
    }
    
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