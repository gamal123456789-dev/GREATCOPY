import Head from 'next/head';
import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import OptimizedImage from './OptimizedImage';

// Lazy load المكونات غير الحرجة
const ReviewsSection = dynamic(() => import('./ReviewsSection'), {
  loading: () => <div className="h-64 bg-slate-800 animate-pulse rounded-lg mx-4 my-8" />,
  ssr: false
});

const FeaturesSection = dynamic(() => import('./FeaturesSection'), {
  loading: () => <div className="h-96 bg-slate-800 animate-pulse rounded-lg mx-4 my-8" />,
  ssr: true
});

const GamesSection = dynamic(() => import('./GamesSection'), {
  loading: () => <div className="h-80 bg-slate-800 animate-pulse rounded-lg mx-4 my-8" />,
  ssr: false
});

const HomePage = ({ reviews = [] }) => {
  const [isClient, setIsClient] = useState(false);
  const [showSections, setShowSections] = useState(false);

  useEffect(() => {
    setIsClient(true);
    
    // Preload الصفحات المهمة بعد التحميل الأولي
    const preloadPages = async () => {
      try {
        await Promise.all([
          import('../pages/games'),
          import('../pages/orders'),
          import('../pages/auth')
        ]);
      } catch (error) {
        console.log('Preload failed:', error);
      }
    };
    
    // تأجيل preload لتحسين الأداء الأولي
    const timer = setTimeout(() => {
      preloadPages();
      setShowSections(true);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);

  // Intersection Observer للتحميل التدريجي
  useEffect(() => {
    if (!isClient) return;
    
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('animate-fade-in');
          }
        });
      },
      { threshold: 0.1 }
    );

    const sections = document.querySelectorAll('.lazy-section');
    sections.forEach((section) => observer.observe(section));

    return () => observer.disconnect();
  }, [isClient, showSections]);

  return (
    <>
      <Head>
        <title>Gearscore - Professional Gaming Boosting Services</title>
        <meta name="description" content="Professional gaming boosting services for all popular games. Fast, secure, and reliable gaming assistance." />
        <meta name="keywords" content="gaming, boosting, professional, services, games, ranks, achievements" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta charSet="UTF-8" />
        
        {/* Open Graph */}
        <meta property="og:title" content="Gearscore - Professional Gaming Boosting Services" />
        <meta property="og:description" content="Professional gaming boosting services for all popular games" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://gear-score.com" />
        
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
              "url": "https://gear-score.com",
              "logo": "https://gear-score.com/logo.webp",
              "sameAs": [
                "https://discord.gg/gearscore"
              ]
            })
          }}
        />
      </Head>

      <div className="antialiased">
        {/* Hero Section محسن للـ LCP */}
        <section className="hero-section relative min-h-screen flex items-center justify-center will-change-transform">
          {/* Background optimized */}
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 opacity-90" />
          
          <div className="hero-content text-center px-4 max-w-4xl mx-auto relative z-10">
            {/* Logo محسن */}
            <div className="mb-8">
              <OptimizedImage
                src="/logo.webp"
                alt="Gearscore Logo"
                width={120}
                height={120}
                priority={true}
                className="mx-auto"
              />
            </div>
            
            <h1 className="text-4xl md:text-6xl font-bold text-glow mb-6 will-change-opacity">
              Professional Gaming Boosting
            </h1>
            <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-2xl mx-auto">
              Fast, Secure, and Reliable Services for All Your Gaming Needs
            </p>
            
            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <button className="btn-primary-hero inline-flex items-center">
                <span>Get Started</span>
                <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </button>
              
              <button className="px-8 py-3 border-2 border-purple-500 text-purple-400 rounded-full font-semibold hover:bg-purple-500 hover:text-white transition-all duration-300">
                View Services
              </button>
            </div>
          </div>
        </section>

        {/* المكونات المؤجلة */}
        {isClient && showSections && (
          <>
            <div className="lazy-section opacity-0 transition-opacity duration-1000">
              <FeaturesSection />
            </div>
            
            <div className="lazy-section opacity-0 transition-opacity duration-1000">
              <GamesSection />
            </div>
            
            <div className="lazy-section opacity-0 transition-opacity duration-1000">
              <ReviewsSection reviews={reviews} />
            </div>
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
          animation: pulse-bg 4s ease-in-out infinite;
        }
        
        @keyframes pulse-bg {
          0%, 100% {
            opacity: 0.3;
          }
          50% {
            opacity: 0.6;
          }
        }
        
        .text-glow {
          text-shadow: 0 0 10px rgba(99, 102, 241, 0.7), 0 0 20px rgba(99, 102, 241, 0.5);
          will-change: text-shadow;
        }
        
        .btn-primary-hero {
          background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
          transform: translateZ(0);
          will-change: transform;
        }
        
        .btn-primary-hero:hover {
          transform: translateY(-2px) translateZ(0);
          box-shadow: 0 10px 25px rgba(99, 102, 241, 0.3);
        }
        
        .animate-fade-in {
          opacity: 1 !important;
        }
        
        /* تحسين الأداء */
        * {
          transform: translateZ(0);
        }
      `}</style>
    </>
  );
};

export default HomePage;