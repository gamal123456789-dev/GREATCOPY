// next.config.js
const path = require('path');

module.exports = {
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,
  
  // Performance optimizations for VPS
  experimental: {
    // Optimize memory usage
    workerThreads: false,
    // Increase request size limit to support large file uploads
    serverActions: {
      bodySizeLimit: '1024mb', // 1GB limit for server actions
    },
    // تحسينات الأداء المتقدمة
    optimizePackageImports: ['@heroicons/react', 'react-icons'],
  },
  
  // Production optimization
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  
  // Production optimization
  productionBrowserSourceMaps: false,
  
  // Image optimization for VPS - محسن للأداء
  images: {
    domains: ['localhost', '127.0.0.1', '0.0.0.0', '62.169.19.154', 'gear-score.com'],
    minimumCacheTTL: 31536000, // سنة واحدة للتخزين المؤقت
    dangerouslyAllowSVG: true,
    unoptimized: false, // تفعيل تحسين الصور
    deviceSizes: [640, 750, 828, 1080, 1200, 1920], // أحجام محسنة
    imageSizes: [16, 32, 48, 64, 96, 128, 256], // أحجام محسنة
    formats: ['image/avif', 'image/webp'], // تنسيقات حديثة
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;"
  },
  
  webpack: (config, { isServer, dev }) => {
    if (!isServer) {
      config.resolve.fallback = {
        fs: false,
        net: false,
        tls: false,
        crypto: false,
      };
      
      // تحسين تقسيم الكود للأداء
      if (!dev) {
        config.optimization.splitChunks = {
          chunks: 'all',
          cacheGroups: {
            vendor: {
              test: /[\\\\/]node_modules[\\\\/]/,
              name: 'vendors',
              priority: 10,
              reuseExistingChunk: true,
            },
            common: {
              name: 'common',
              minChunks: 2,
              priority: 5,
              reuseExistingChunk: true,
            },
          },
        };
      }
    }
    
    // Setup externals for server-side (guard against undefined)
    if (isServer) {
      if (!config.externals) {
        config.externals = [];
      }
      if (Array.isArray(config.externals)) {
        config.externals.push({
          'socket.io': 'socket.io',
          'socket.io-client': 'socket.io-client'
        });
      }
    }
    
    // تحسين الحزم
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.resolve(__dirname),
    };

    // Reduce dev reload loops by ignoring noisy folders
    if (dev) {
      config.watchOptions = {
        ...(config.watchOptions || {}),
        ignored: [
          "**/logs/**",
          "**/public/uploads/**",
          "**/dev.db",
        ],
      };
    }
    
    return config;
  },
  
  // Enable external packages for Socket.IO
  serverExternalPackages: ['socket.io', 'socket.io-client'],
  
  // Static file serving
  trailingSlash: false,
  generateEtags: false,
  
  // Static file serving
  async rewrites() {
    return [
      {
        source: '/uploads/:path*',
        destination: '/api/uploads/:path*'
      }
    ];
  },
  
  async headers() {
    return [
      {
        source: '/uploads/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=300, must-revalidate', // 5 minutes
          },
          {
            key: 'Access-Control-Allow-Origin',
            value: '*',
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, HEAD, OPTIONS',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type, Range, Authorization',
          },
          {
            key: 'Accept-Ranges',
            value: 'bytes',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
        ],
      },
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
        ],
      },
    ];
  },
  

  // Setup public environment variables
  env: {
    CUSTOM_ERROR_HANDLING: 'true',
  },
};

// Memory optimization for Node.js on VPS
if (process.env.NODE_ENV === 'production') {
  process.env.NODE_OPTIONS = '--max-old-space-size=4096';  // Increased for large file uploads
}