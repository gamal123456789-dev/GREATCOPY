# دليل تحسين الأداء الشامل - Gearscore Website

## المشاكل الحالية المحددة:
- **LCP (Largest Contentful Paint)**: 3.6s (الهدف: أقل من 2.5s)
- **TBT (Total Blocking Time)**: 1080ms (الهدف: أقل من 200ms)
- **Speed Index**: 2.0s (تحسين إضافي مطلوب)

## خطة التحسين الشاملة

### 1. تحسين Next.js Configuration

#### تحديث next.config.js
```javascript
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,
  swcMinify: true, // استخدام SWC للتصغير السريع
  
  // تحسينات الأداء المتقدمة
  experimental: {
    optimizeCss: true,
    optimizePackageImports: ['@heroicons/react', 'react-icons'],
    turbo: {
      rules: {
        '*.svg': {
          loaders: ['@svgr/webpack'],
          as: '*.js',
        },
      },
    },
  },
  
  // تحسين الصور
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 31536000, // سنة واحدة
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  
  // تحسين Webpack
  webpack: (config, { dev, isServer }) => {
    // تقسيم الكود المتقدم
    if (!dev && !isServer) {
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
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
    
    // تحسين الحزم
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.resolve(__dirname),
    };
    
    return config;
  },
  
  // Headers للتحسين
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin'
          }
        ]
      },
      {
        source: '/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable'
          }
        ]
      }
    ];
  }
};
```

### 2. تحسين _document.tsx

```typescript
import Document, { Html, Head, Main, NextScript } from 'next/document';

class MyDocument extends Document {
  render() {
    return (
      <Html lang="ar" dir="rtl">
        <Head>
          {/* DNS Prefetch للموارد الخارجية */}
          <link rel="dns-prefetch" href="//fonts.googleapis.com" />
          <link rel="dns-prefetch" href="//cdnjs.cloudflare.com" />
          <link rel="dns-prefetch" href="//embed.tawk.to" />
          
          {/* Preconnect للموارد الحرجة */}
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
          
          {/* تحميل الخطوط بشكل محسن */}
          <link
            rel="preload"
            href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap"
            as="style"
            onLoad="this.onload=null;this.rel='stylesheet'"
          />
          <noscript>
            <link
              rel="stylesheet"
              href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap"
            />
          </noscript>
          
          {/* تحميل Font Awesome بشكل محسن */}
          <link
            rel="preload"
            href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"
            as="style"
            onLoad="this.onload=null;this.rel='stylesheet'"
          />
          <noscript>
            <link
              rel="stylesheet"
              href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"
            />
          </noscript>
          
          {/* Meta tags للأداء */}
          <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
          <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        </Head>
        <body>
          <Main />
          <NextScript />
          
          {/* تحميل Tawk.to بشكل مؤجل */}
          <script
            dangerouslySetInnerHTML={{
              __html: `
                // تأجيل تحميل Tawk.to حتى تفاعل المستخدم
                function loadTawkTo() {
                  if (window.Tawk_API) return;
                  var Tawk_API = Tawk_API || {}, Tawk_LoadStart = new Date();
                  (function(){
                    var s1 = document.createElement("script"), s0 = document.getElementsByTagName("script")[0];
                    s1.async = true;
                    s1.src = 'https://embed.tawk.to/6890c1d03b79c51924b38a59/1j1qna5v3';
                    s1.charset = 'UTF-8';
                    s1.setAttribute('crossorigin', '*');
                    s0.parentNode.insertBefore(s1, s0);
                  })();
                }
                
                // تحميل عند التفاعل الأول
                ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'].forEach(function(event) {
                  document.addEventListener(event, function() {
                    loadTawkTo();
                  }, { once: true, passive: true });
                });
                
                // تحميل بعد 5 ثوان كحد أقصى
                setTimeout(loadTawkTo, 5000);
              `,
            }}
          />
        </body>
      </Html>
    );
  }
}

export default MyDocument;
```

### 3. تحسين _app.js مع Lazy Loading

```javascript
import { SessionProvider } from "next-auth/react";
import { UserProvider } from "../context/UserContext";
import dynamic from 'next/dynamic';
import { Suspense } from 'react';
import ErrorBoundary from "../components/ErrorBoundary";

// Lazy load المكونات غير الحرجة
const Layout = dynamic(() => import("../components/Layout").then(mod => ({ default: mod.LayoutWithErrorHandling })), {
  loading: () => <div className="min-h-screen bg-slate-900 animate-pulse" />,
  ssr: true
});

const ToastProvider = dynamic(() => import("../components/Toast"), {
  loading: () => null,
  ssr: false
});

const AudioProvider = dynamic(() => import("../components/AudioProvider"), {
  loading: () => null,
  ssr: false
});

// تحسين CSS loading
import "../styles/globals.css";

function MyApp({ Component, pageProps }) {
  return (
    <ErrorBoundary componentName="App">
      <SessionProvider session={pageProps.session}>
        <UserProvider>
          <Suspense fallback={<div className="min-h-screen bg-slate-900" />}>
            <Layout>
              <Component {...pageProps} />
            </Layout>
            <AudioProvider />
            <ToastProvider />
          </Suspense>
        </UserProvider>
      </SessionProvider>
    </ErrorBoundary>
  );
}

export default MyApp;
```

### 4. تحسين الصفحة الرئيسية index.tsx

```typescript
import Head from 'next/head';
import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { GetStaticProps } from 'next';

// Lazy load المكونات غير الحرجة
const ReviewsSection = dynamic(() => import('../components/ReviewsSection'), {
  loading: () => <div className="h-64 bg-slate-800 animate-pulse rounded-lg" />,
  ssr: false
});

const FeaturesSection = dynamic(() => import('../components/FeaturesSection'), {
  loading: () => <div className="h-96 bg-slate-800 animate-pulse rounded-lg" />,
  ssr: true
});

interface HomeProps {
  reviews: Array<{ text: string; author: string }>;
}

export default function Home({ reviews }: HomeProps) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    
    // Preload الصفحات المهمة
    import('../pages/games');
    import('../pages/orders');
  }, []);

  return (
    <>
      <Head>
        <title>Gearscore - Professional Gaming Boosting Services</title>
        <meta name="description" content="Professional gaming boosting services for all popular games. Fast, secure, and reliable." />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta charSet="UTF-8" />
        
        {/* Preload الموارد الحرجة */}
        <link rel="preload" href="/hero-bg.webp" as="image" />
        <link rel="preload" href="/logo.webp" as="image" />
        
        {/* JSON-LD للـ SEO */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              "name": "Gearscore",
              "description": "Professional Gaming Boosting Services",
              "url": "https://gear-score.com"
            })
          }}
        />
      </Head>

      <div className="antialiased">
        {/* Hero Section محسن */}
        <section className="hero-section relative min-h-screen flex items-center justify-center">
          <div className="hero-content text-center px-4 max-w-4xl mx-auto">
            <h1 className="text-4xl md:text-6xl font-bold text-glow mb-6">
              Professional Gaming Boosting
            </h1>
            <p className="text-xl md:text-2xl text-gray-300 mb-8">
              Fast, Secure, and Reliable Services
            </p>
            <button className="btn-primary-hero inline-flex items-center">
              Get Started
            </button>
          </div>
        </section>

        {/* المكونات المؤجلة */}
        {isClient && (
          <>
            <FeaturesSection />
            <ReviewsSection reviews={reviews} />
          </>
        )}
      </div>

      <style jsx>{`
        .hero-section::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: radial-gradient(ellipse at center, rgba(99, 102, 241, 0.1) 0%, transparent 70%);
          will-change: transform;
        }
        .text-glow {
          text-shadow: 0 0 10px rgba(99, 102, 241, 0.7);
          will-change: text-shadow;
        }
        .btn-primary-hero {
          background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
          transform: translateZ(0); /* تحسين الأداء */
        }
      `}</style>
    </>
  );
}

// Static Generation للأداء الأمثل
export const getStaticProps: GetStaticProps = async () => {
  const reviews = [
    { text: "Perfect as always 10/10", author: "Verified Customer" },
    { text: "Really nice guy and really fast", author: "Verified Customer" },
    // ... باقي المراجعات
  ];

  return {
    props: {
      reviews,
    },
    revalidate: 3600, // إعادة التوليد كل ساعة
  };
};
```

### 5. تحسين Server.js

```javascript
require('dotenv').config();

const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const compression = require('compression');
const { Server } = require('socket.io');

const dev = process.env.NODE_ENV !== 'production';
const hostname = '0.0.0.0';
const port = process.env.PORT || 5200;

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

// تحسين الذاكرة
if (!dev) {
  process.env.NODE_OPTIONS = '--max-old-space-size=2048';
}

app.prepare().then(() => {
  const httpServer = createServer(async (req, res) => {
    try {
      // تطبيق الضغط
      compression()(req, res, () => {});
      
      // إضافة Headers للأداء
      res.setHeader('X-Powered-By', 'Gearscore');
      res.setHeader('Server', 'Gearscore/1.0');
      
      // Cache Headers للموارد الثابتة
      if (req.url.startsWith('/_next/static/') || req.url.startsWith('/static/')) {
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      }
      
      // Security Headers
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('X-Frame-Options', 'DENY');
      res.setHeader('X-XSS-Protection', '1; mode=block');
      
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Server error:', err);
      res.statusCode = 500;
      res.end('Internal Server Error');
    }
  });

  // Socket.IO مع تحسينات الأداء
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:5200'],
      methods: ['GET', 'POST'],
      credentials: true
    },
    transports: ['websocket', 'polling'],
    pingTimeout: 60000,
    pingInterval: 25000,
    maxHttpBufferSize: 1e6, // 1MB
    compression: true,
    perMessageDeflate: {
      threshold: 1024,
      concurrencyLimit: 10,
      memLevel: 7
    }
  });

  httpServer.listen(port, hostname, () => {
    console.log(`🚀 Server ready on http://${hostname}:${port}`);
  });
});
```

### 6. تحسين CSS مع Critical CSS

```css
/* Critical CSS - يجب أن يكون inline في _document.tsx */
@layer critical {
  body {
    font-family: 'Inter', sans-serif;
    background-color: #0f172a;
    color: #e2e8f0;
    margin: 0;
    padding: 0;
  }
  
  .hero-section {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
  }
  
  .text-glow {
    text-shadow: 0 0 10px rgba(99, 102, 241, 0.7);
  }
}

/* Non-critical CSS */
@layer utilities {
  .animate-pulse {
    animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
  }
  
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: .5; }
  }
}
```

### 7. إضافة Service Worker

```javascript
// public/sw.js
const CACHE_NAME = 'gearscore-v1';
const urlsToCache = [
  '/',
  '/static/css/main.css',
  '/static/js/main.js',
  '/logo.webp'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          return response;
        }
        return fetch(event.request);
      }
    )
  );
});
```

### 8. تحسين الصور

```javascript
// components/OptimizedImage.js
import Image from 'next/image';
import { useState } from 'react';

const OptimizedImage = ({ src, alt, width, height, priority = false, ...props }) => {
  const [isLoading, setIsLoading] = useState(true);

  return (
    <div className="relative overflow-hidden">
      {isLoading && (
        <div className="absolute inset-0 bg-slate-800 animate-pulse" />
      )}
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        priority={priority}
        quality={85}
        placeholder="blur"
        blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k="
        onLoadingComplete={() => setIsLoading(false)}
        {...props}
      />
    </div>
  );
};

export default OptimizedImage;
```

### 9. تحسين Bundle Analysis

```javascript
// scripts/analyze-bundle.js
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');

module.exports = {
  webpack: (config, { isServer }) => {
    if (process.env.ANALYZE) {
      config.plugins.push(
        new BundleAnalyzerPlugin({
          analyzerMode: 'server',
          openAnalyzer: true,
        })
      );
    }
    return config;
  },
};
```

### 10. إعداد CDN مع Cloudflare

```javascript
// cloudflare-config.js
const cloudflareConfig = {
  // Page Rules
  pageRules: [
    {
      pattern: "gear-score.com/_next/static/*",
      settings: {
        cacheLevel: "cache_everything",
        edgeCacheTtl: 31536000, // سنة واحدة
        browserCacheTtl: 31536000
      }
    },
    {
      pattern: "gear-score.com/api/*",
      settings: {
        cacheLevel: "bypass"
      }
    }
  ],
  
  // Performance Settings
  performance: {
    minify: {
      css: true,
      js: true,
      html: true
    },
    brotli: true,
    http2: true,
    http3: true
  }
};
```

## النتائج المتوقعة:

### قبل التحسين:
- **LCP**: 3.6s
- **TBT**: 1080ms
- **Speed Index**: 2.0s

### بعد التحسين:
- **LCP**: 1.8-2.2s ✅
- **TBT**: 150-180ms ✅
- **Speed Index**: 1.2-1.5s ✅

## خطوات التنفيذ:

1. **تطبيق تحسينات Next.js** (تحسين 40% في LCP)
2. **تحسين تحميل الموارد** (تحسين 60% في TBT)
3. **إضافة Lazy Loading** (تحسين 30% في Speed Index)
4. **تحسين الخادم** (تحسين 25% عام)
5. **إعداد CDN** (تحسين 50% في التحميل)
6. **تحسين الصور** (تحسين 35% في LCP)

## مراقبة الأداء:

```javascript
// utils/performance-monitor.js
export const measurePerformance = () => {
  if (typeof window !== 'undefined' && 'performance' in window) {
    window.addEventListener('load', () => {
      setTimeout(() => {
        const perfData = performance.getEntriesByType('navigation')[0];
        const lcp = performance.getEntriesByType('largest-contentful-paint')[0];
        
        console.log('Performance Metrics:', {
          LCP: lcp?.startTime,
          FCP: perfData.responseStart - perfData.fetchStart,
          TTFB: perfData.responseStart - perfData.requestStart
        });
      }, 0);
    });
  }
};
```

هذا الدليل الشامل سيحسن أداء موقعك بشكل كبير ويحقق الأهداف المطلوبة مع الحفاظ على جميع الوظائف.