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
  
  // Optimize production build
  productionBrowserSourceMaps: false,
  
  // Disable SWC minification and use Terser as fallback
  swcMinify: true,
  
  // Exclude blockchain folder from webpack processing
  webpack: (config, { isServer }) => {
    // Add externals
    if (!config.externals) {
      config.externals = [];
    }
    
    if (Array.isArray(config.externals)) {
      config.externals.push("pino-pretty", "lokijs", "encoding");
    }
    
    // Ignore blockchain folder from watching
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
    
    // Fix for React Native modules (client-side only)
    if (!isServer) {
      config.resolve = config.resolve || {};
      
      config.resolve.fallback = {
        ...config.resolve.fallback,
        "@react-native-async-storage/async-storage": false,
        "react-native": false,
        "react-native-fs": false,
        "fs": false,
        "net": false,
        "tls": false,
      };
      
      config.resolve.alias = {
        ...config.resolve.alias,
        "@react-native-async-storage/async-storage": false,
        "react-native": false,
      };
    }
    
    // Suppress warnings about missing React Native modules
    config.ignoreWarnings = [
      ...(config.ignoreWarnings || []),
      /Can't resolve '@react-native-async-storage\/async-storage'/,
      /Can't resolve 'react-native'/,
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