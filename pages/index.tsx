import Head from 'next/head';
import React, { useEffect } from 'react';
import useAudioManager from '../hooks/useAudioManager';


export default function Home() {
  const { enableAudio } = useAudioManager();

  useEffect(() => {
    console.log('🏠 Home page loaded - audio will be initialized by useAudioManager');
  }, []);
  const reviews = [
    { text: "Perfect as always 10/10", author: "Verified Customer" },
    { text: "Really nice guy and really fast", author: "Verified Customer" },
    { text: "Sehr Schneller Grind. Der Kontakt war sehr schnell und vor allem sehr freundlich. Das wird nicht das letzte Mal gewesen sein das ich bei diesem Verkäufer gewesen bin. Macht weiter so.", author: "Verified Customer" },
    { text: "very affordable and did exactly what i wanted in a reasonable time", author: "Verified Customer" },
    { text: "amazing service thanks for the speedy run", author: "Verified Customer" },
    { text: "Fast delivery :D", author: "Verified Customer" },
    { text: "very fast delivery and would recomend it to smoneone 10/10", author: "Verified Customer" },
    { text: "super nice guy supper friendly and would recomend it to everyone the service he provides is just unreal and the delivery time is super quick", author: "Verified Customer" },
    { text: "Fast delivery. Kind guy. :)", author: "Verified Customer" }
  ];

  return (
    <>
      <Head>
        <title>Gearscore - Professional Gaming Boosting Services</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta charSet="UTF-8" />

        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      </Head>

      <div className="antialiased">
        {/* Global Notification System */}
  
        <style jsx global>{`
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
          body {
            font-family: 'Inter', sans-serif;
            background-color: #0d1117;
            color: #e2e8f0;
            overflow-x: hidden;
            min-height: 100vh;
          }
          .hero-section {
            position: relative;
          }
          .hero-section::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: radial-gradient(ellipse at center, rgba(99, 102, 241, 0.1) 0%, transparent 70%);
            animation: pulse 4s ease-in-out infinite;
          }
          .hero-content {
            position: relative;
            z-index: 2;
          }
          .text-glow {
            text-shadow: 0 0 10px rgba(99, 102, 241, 0.7), 0 0 20px rgba(99, 102, 241, 0.5), 0 0 30px rgba(99, 102, 241, 0.3);
            animation: pulseTextGlow 2s infinite alternate;
          }
          @keyframes pulseTextGlow {
            from { text-shadow: 0 0 10px rgba(99, 102, 241, 0.7), 0 0 20px rgba(99, 102, 241, 0.5); }
            to { text-shadow: 0 0 15px rgba(167, 139, 250, 0.9), 0 0 25px rgba(167, 139, 250, 0.7); }
          }
          @keyframes float {
            0%, 100% {
              transform: translateY(0px);
            }
            50% {
              transform: translateY(-10px);
            }
          }
          @keyframes pulse {
            0%, 100% {
              transform: scale(1);
            }
            50% {
              transform: scale(1.05);
            }
          }
          @keyframes glow {
            0%, 100% {
              box-shadow: 0 0 20px rgba(99, 102, 241, 0.3);
            }
            50% {
              box-shadow: 0 0 30px rgba(99, 102, 241, 0.6);
            }
          }
          .btn-primary-hero {
            background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
            color: white;
            padding: 1rem 2.5rem;
            border-radius: 9999px;
            font-weight: 700;
            font-size: 1.125rem;
            transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
            box-shadow: 0 5px 15px rgba(99, 102, 241, 0.4);
            position: relative;
            overflow: hidden;
          }
          .btn-primary-hero::before {
            content: '';
            position: absolute;
            top: 0;
            left: -100%;
            width: 100%;
            height: 100%;
            background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
            transition: left 0.6s ease;
          }
          .btn-primary-hero:hover::before {
            left: 100%;
          }
          .btn-primary-hero:hover {
            background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
            transform: translateY(-3px) scale(1.05);
            box-shadow: 0 15px 30px rgba(99, 102, 241, 0.6);
          }
          .section-title {
            font-size: 3rem;
            font-weight: 800;
            background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
            background-clip: text;
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            margin-bottom: 1rem;
            text-shadow: 0 0 30px rgba(99, 102, 241, 0.3);
          }
          .section-subtitle {
            font-size: 1.25rem;
            color: #94a3b8;
            max-width: 600px;
            margin: 0 auto 3rem auto;
          }
          .feature-card {
            background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
            border-radius: 1rem;
            padding: 2.5rem 2rem;
            text-align: center;
            border: 1px solid #334155;
            transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
            position: relative;
            overflow: hidden;
          }
          .feature-card::before {
            content: '';
            position: absolute;
            top: 0;
            left: -100%;
            width: 100%;
            height: 100%;
            background: linear-gradient(90deg, transparent, rgba(99, 102, 241, 0.1), transparent);
            transition: left 0.6s ease;
          }
          .feature-card:hover::before {
            left: 100%;
          }
          .feature-card:hover {
            transform: translateY(-12px) scale(1.02);
            box-shadow: 0 25px 50px rgba(0,0,0,0.7), 0 0 30px rgba(99, 102, 241, 0.3);
            border-color: #6366f1;
          }
          .feature-icon-wrapper {
            width: 80px;
            height: 80px;
            margin: 0 auto 1.5rem auto;
            border-radius: 50%;
            background: linear-gradient(135deg, #6366f1, #a78bfa);
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 0 20px rgba(99, 102, 241, 0.5);
            transition: all 0.3s ease;
            animation: float 3s ease-in-out infinite;
          }
          .feature-card:hover .feature-icon-wrapper {
            transform: scale(1.15);
            box-shadow: 0 0 40px rgba(167, 139, 250, 0.8);
            animation: pulse 1s ease-in-out infinite;
          }
          .feature-icon {
            font-size: 2.5rem;
            color: white;
          }
          .payment-security-banner {
            margin-top: 4rem;
            padding: 1.5rem 2rem;
            background-color: #1a202c;
            border: 1px solid #2d3748;
            border-radius: 1rem;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 1rem;
            max-width: 600px;
            margin-left: auto;
            margin-right: auto;
            color: #cbd5e0;
          }
          .payment-security-banner i {
            font-size: 2rem;
            color: #6366f1;
          }
          .about-section {
            background-color: #0d1117;
          }
          .about-card {
            background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
            border-radius: 1.5rem;
            padding: 3rem;
            position: relative;
            overflow: hidden;
            border: 1px solid #334155;
            transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          }
          .about-card:hover {
            transform: translateY(-8px) scale(1.02);
            box-shadow: 0 25px 50px rgba(0,0,0,0.7), 0 0 30px rgba(99, 102, 241, 0.3);
          }
          .about-card::before {
            content: '';
            position: absolute;
            inset: 0;
            border-radius: 1.5rem;
            padding: 2px;
            background: linear-gradient(135deg, #6366f1, #a78bfa);
            -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
            -webkit-mask-composite: xor;
            mask-composite: exclude;
            pointer-events: none;
            opacity: 0.5;
          }
          .review-card {
            background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
            border-radius: 1rem;
            padding: 2rem;
            border: 1px solid #334155;
            display: flex;
            flex-direction: column;
            height: 100%;
            transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
            position: relative;
            overflow: hidden;
          }
          .review-card::after {
            content: '';
            position: absolute;
            top: -2px;
            left: -2px;
            right: -2px;
            bottom: -2px;
            background: linear-gradient(45deg, #6366f1, #8b5cf6, #6366f1);
            border-radius: 1rem;
            opacity: 0;
            z-index: -1;
            transition: opacity 0.3s ease;
          }
          .review-card:hover::after {
            opacity: 1;
          }
          .review-card:hover {
            transform: translateY(-8px) scale(1.02);
            box-shadow: 0 25px 50px rgba(0,0,0,0.7);
            border-color: transparent;
          }
          .review-stars {
            color: #f59e0b;
            margin-bottom: 1rem;
          }
          .review-text {
            color: #cbd5e0;
            font-style: italic;
            flex-grow: 1;
            margin-bottom: 1rem;
          }
          .review-author {
            color: #94a3b8;
            font-weight: 600;
            text-align: right;
            margin-top: auto;
          }
          .cta-footer {
            background: linear-gradient(135deg, #1e3a8a, #4f46e5);
            box-shadow: 0 10px 20px rgba(0, 0, 0, 0.3);
            position: relative;
            overflow: hidden;
          }
          .cta-footer::before {
            content: '';
            position: absolute;
            top: -50%;
            left: -50%;
            width: 200%;
            height: 200%;
            background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
            animation: glow 4s ease-in-out infinite;
          }
          .cta-button {
            background: linear-gradient(to right, #ffffff, #e2e8f0);
            color: #4f46e5;
            padding: 1rem 2.5rem;
            border-radius: 9999px;
            font-weight: 800;
            font-size: 1.5rem;
            transition: all 0.3s ease-in-out;
            box-shadow: 0 8px 20px rgba(0, 0, 0, 0.4);
          }
          .cta-button:hover {
            transform: translateY(-2px) scale(1.01);
            box-shadow: 0 10px 22px rgba(0, 0, 0, 0.5);
            color: #3b82f6;
          }
        `}</style>

        <main>
          {/* Hero */}
          <section className="hero-section py-28 md:py-40 text-center text-white">
            <div className="hero-content container mx-auto px-4">
              <h1 className="text-5xl md:text-7xl font-extrabold mb-4 leading-tight text-glow">
                Elevate Your Gameplay
              </h1>
              <p className="text-xl md:text-2xl mb-10 max-w-3xl mx-auto opacity-90">
                Reach new heights with our professional boosting and coaching services. Safe, fast, and reliable.
              </p>
              <div className="flex justify-center items-center">
                <a href="/games" className="btn-primary-hero">Browse Games</a>
              </div>
            </div>
          </section>

          {/* Services */}
          <section id="services" className="py-20 bg-gray-900 text-center">
            <div className="container mx-auto px-4">
              <h2 className="section-title">Our <span className="text-indigo-400">Services</span></h2>
              <p className="section-subtitle">We offer a wide range of services to help you achieve your gaming goals.</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                <div className="feature-card">
                  <div className="feature-icon-wrapper">
                    <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-3">Game Boosting</h3>
                  <p className="text-gray-400">Our expert players will help you reach your desired rank or level quickly and securely.</p>
                </div>
                <div className="feature-card">
                  <div className="feature-icon-wrapper">
                    <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z" />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-3">Pro Coaching</h3>
                  <p className="text-gray-400">Learn from the best with personalized one-on-one coaching sessions to improve your skills.</p>
                </div>
                <div className="feature-card">
                  <div className="feature-icon-wrapper">
                    <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-3">Account Sales</h3>
                  <p className="text-gray-400">Browse our selection of high-quality, secure game accounts for various popular titles.</p>
                </div>
              </div>

              <div className="payment-security-banner">
                <i className="fas fa-shield-alt"></i>
                <span><strong>100% Secure Payments:</strong> Your transactions are protected.</span>
              </div>
            </div>
          </section>

          {/* About */}
          <section id="about" className="py-20 about-section">
            <div className="container mx-auto px-4 max-w-6xl">
              <div className="about-card">
                <h2 className="section-title text-left !text-4xl">About <span className="text-indigo-400">Gearscore</span></h2>
                <p className="text-gray-300 leading-relaxed mb-4">
                  Gearscore is at the forefront of delivering professional gaming enhancement services across a spectrum of online titles...
                </p>
                <p className="text-gray-300 leading-relaxed">
                  Every service is meticulously executed by our cadre of highly experienced and rigorously verified gaming professionals...
                </p>
              </div>
            </div>
          </section>

          {/* Reviews */}
          <section id="reviews" className="py-20 bg-gray-900">
            <div className="container mx-auto px-4 text-center">
              <h2 className="section-title">What Our <span className="text-indigo-400">Customers Say</span></h2>
              <p className="section-subtitle">Our service is trusted by gamers worldwide. Here's what they have to say.</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
                {reviews.map((review, index) => (
                  <div key={index} className="review-card">
                    <div className="review-stars">
                      <i className="fas fa-star"></i>
                      <i className="fas fa-star"></i>
                      <i className="fas fa-star"></i>
                      <i className="fas fa-star"></i>
                      <i className="fas fa-star"></i>
                    </div>
                    <p className="review-text">"{review.text}"</p>
                    <p className="review-author">- {review.author}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* CTA */}
          <section className="cta-footer text-white py-16 text-center rounded-t-xl mx-auto max-w-7xl mt-12 shadow-xl">
            <div className="container mx-auto px-4">
              <h2 className="text-4xl font-bold mb-6">Ready to Elevate Your Game?</h2>
              <p className="text-xl mb-8 text-gray-200">Join our elite community and let Gearscore unleash your full potential.</p>
              <a href="https://discord.gg/s88WnxvG" target="_blank" className="cta-button inline-block bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold py-4 px-8 rounded-full transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl">
                <i className="fab fa-discord mr-3 text-xl"></i>
                Join Our Discord Server
              </a>
            </div>
          </section>
        </main>

        <footer className="bg-gray-900 py-10 text-gray-400 text-sm">
          <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-lg font-bold text-white mb-4">Gearscore</h3>
              <p>Your gateway to professional gaming boosting services. We aim to provide the best experience for gamers.</p>
            </div>
            <div>
              <h3 className="text-lg font-bold text-white mb-4">Quick Links</h3>
              <ul>
                <li className="mb-2"><a href="/" className="hover:text-white">Home</a></li>
                <li className="mb-2"><a href="/games" className="hover:text-white">Games</a></li>
                <li className="mb-2"><a href="#services" className="hover:text-white">Services</a></li>
                <li className="mb-2"><a href="#about" className="hover:text-white">About Us</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-bold text-white mb-4">Support</h3>
              <ul>
                <li className="mb-2"><a href="/faq" className="hover:text-white">FAQ</a></li>
                <li className="mb-2"><a href="/contact" className="hover:text-white">Contact Us</a></li>
                <li className="mb-2"><a href="/privacy" className="hover:text-white">Privacy Policy</a></li>
                <li className="mb-2"><a href="/refund-policy" className="hover:text-white">Refund Policy</a></li>
                <li className="mb-2"><a href="/terms" className="hover:text-white">Terms of Service</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-bold text-white mb-4">Follow Us</h3>
              <div className="flex space-x-4 text-2xl mb-4">
                <a href="https://www.instagram.com/gearscoreboosting/" target="_blank" className="hover:text-white transition-colors duration-300">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                  </svg>
                </a>
                <a href="https://discord.gg/s88WnxvG" target="_blank" className="hover:text-white transition-colors duration-300">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419-.0190 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1568 2.4189Z"/>
                  </svg>
                </a>
              </div>
              <div className="mt-4">
                <h4 className="text-md font-semibold text-white mb-2">Contact</h4>
                <p className="text-gray-400">support@gear-score.com</p>
              </div>
            </div>
          </div>
          <div className="text-center mt-10 border-t border-gray-700 pt-8">
            {/* Logo */}
            <div className="mb-4">
              <div className="flex items-center justify-center gap-2 mb-2">
                <i className="fas fa-cog text-white text-3xl"></i>
                <span className="bg-gradient-to-r from-indigo-500 to-purple-500 text-transparent bg-clip-text text-2xl font-bold">Gearscore</span>
              </div>
            </div>
            <p>&copy; 2025 Gearscore. All rights reserved.</p>
          </div>
        </footer>
      </div>
    </>
  );
}
