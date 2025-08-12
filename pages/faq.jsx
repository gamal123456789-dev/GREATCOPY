import Head from "next/head";
import { useState, useEffect } from "react";
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'], display: 'swap' });

export default function FAQ() {
  const [openItems, setOpenItems] = useState({});

  const toggleItem = (index) => {
    setOpenItems(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const faqData = [
    {
      category: "General Questions",
      items: [
        {
          question: "What is Gearscore?",
          answer: "Gearscore is a professional gaming boosting service that helps players achieve their gaming goals across multiple popular titles. We provide safe, reliable, and efficient boosting services with experienced players."
        },
        {
          question: "How does the boosting process work?",
          answer: "After placing an order, you'll be matched with one of our professional boosters. We'll coordinate the service details, timeline, and any specific requirements. You can track progress and communicate with your booster throughout the process."
        },
        {
          question: "Is my account safe during boosting?",
          answer: "Absolutely. We use VPN protection, never share account details, and our boosters are thoroughly vetted professionals. We also offer account recovery assistance and have a 100% safety guarantee."
        },
        {
          question: "What games do you support?",
          answer: "We currently support New World, Destiny 2, Path of Exile, War Thunder, Black Desert Online, and Rust. We're constantly expanding our game library based on community demand."
        }
      ]
    },
    {
      category: "Orders & Payment",
      items: [
        {
          question: "What payment methods do you accept?",
          answer: "We accept cryptocurrency payments through Coinbase Commerce, including Bitcoin, Ethereum, USDT, and many other popular cryptocurrencies. This ensures secure and anonymous transactions."
        },
        {
          question: "How long does it take to complete an order?",
          answer: "Completion times vary by service type and game. Most power leveling services take 6-48 hours, while specific achievements or raids can be completed within 1-24 hours. Exact timeframes are provided during checkout."
        },
        {
          question: "Can I cancel or modify my order?",
          answer: "Orders can be cancelled or modified before work begins. Once a booster starts working on your order, modifications may be limited. Contact our support team immediately for any changes."
        },
        {
            question: "Do you offer refunds?",
            answer: (
              <span>
                We offer full refunds if the order hasn't started yet. Once work begins on your order, refunds are subject to specific conditions outlined in our{' '}
                <a href='/terms#refund-policy' className='text-blue-400 hover:text-blue-300 underline'>
                  Refund Policy
                </a>
                . Please review our terms for complete details.
              </span>
            )
          }
      ]
    },
    {
      category: "Account Security",
      items: [
        {
          question: "Do I need to share my password?",
          answer: "For most services, yes. However, we recommend changing your password before and after the service. We use secure, encrypted systems to store credentials and they're deleted immediately after completion."
        },
        {
           question: "How do you ensure service quality?",
           answer: "All our boosters are carefully vetted professionals with proven track records. We monitor service quality through customer feedback, completion rates, and regular performance reviews to maintain our high standards."
         },
        {
          question: "Can I play while you're boosting?",
          answer: "This depends on the service type. For some services, we can coordinate play times. For others, account access is needed exclusively. We'll discuss this during order setup."
        }
      ]
    },
    {
      category: "Support & Communication",
      items: [
        {
          question: "How can I contact support?",
          answer: "You can reach us through our Discord server, contact form, or live chat. Our support team is available 24/7 to assist with any questions or concerns."
        },
        {
          question: "Can I track my order progress?",
          answer: "Yes! You can track your order status in real-time through your account dashboard and communicate directly with your assigned booster."
        },
        {
           question: "What if I'm not satisfied with the service?",
           answer: "Customer satisfaction is our priority. If you're not happy with the service, you can track and communicate about your order through the order chat system. Contact our support team immediately and we'll work to resolve any issues."
         }
      ]
    },
    {
      category: "Technical Questions",
      items: [
        {
          question: "Do you use bots or automation?",
          answer: "No, all our services are performed by real, skilled players. We never use bots, cheats, or any automated tools that could compromise your account or violate game terms of service."
        },
        {
          question: "What regions do you support?",
          answer: "We support all major regions including NA East, NA West, EU Central, SA East, and AP Southeast. Our boosters are distributed globally to provide optimal service times."
        },
        {
          question: "Can you help with specific builds or strategies?",
          answer: "Absolutely! Our boosters are experienced players who can provide guidance on optimal builds, strategies, and gameplay tips for your specific goals and playstyle."
        }
      ]
    }
  ];

  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setTimeout(() => setLoaded(true), 100);
  }, []);

  return (
    <>
      <Head>
        <title>Gearscore - Frequently Asked Questions</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="description" content="Find answers to common questions about Gearscore's professional gaming boosting services, account security, payments, and more." />
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.1.1/css/all.min.css" />
      </Head>

      <div className={`${inter.className} antialiased ${loaded ? 'is-loaded' : ''} min-h-screen`}>
        <style jsx global>{`
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
          body {
            font-family: 'Inter', sans-serif;
            background-color: #0d1117;
            color: #e2e8f0;
            overflow-x: hidden;
            min-height: 100vh;
          }
          .page-header {
            position: relative;
            background: linear-gradient(135deg, #0d1117 0%, #1a1a2e 50%, #16213e 100%);
          }
          .page-header::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: radial-gradient(ellipse at center, rgba(99, 102, 241, 0.1) 0%, transparent 70%);
            animation: pulse 4s ease-in-out infinite;
          }
          .text-glow {
            text-shadow: 0 0 10px rgba(99, 102, 241, 0.7), 0 0 20px rgba(99, 102, 241, 0.5), 0 0 30px rgba(99, 102, 241, 0.3);
            animation: pulseTextGlow 2s infinite alternate;
          }
          @keyframes pulseTextGlow {
            from { text-shadow: 0 0 10px rgba(99, 102, 241, 0.7), 0 0 20px rgba(99, 102, 241, 0.5); }
            to { text-shadow: 0 0 15px rgba(167, 139, 250, 0.9), 0 0 25px rgba(167, 139, 250, 0.7); }
          }
          @keyframes pulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.05); }
          }
          .faq-card {
            background: linear-gradient(135deg, rgba(30, 41, 59, 0.8) 0%, rgba(15, 23, 42, 0.9) 100%);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(99, 102, 241, 0.2);
            border-radius: 1rem;
            box-shadow: 0 10px 30px -10px rgba(0,0,0,0.5), 0 0 20px rgba(99, 102, 241, 0.1);
            transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
            opacity: 0;
            transform: translateY(20px);
            animation: fade-in 0.6s ease forwards;
            position: relative;
            overflow: hidden;
          }
          .faq-card::before {
            content: '';
            position: absolute;
            top: 0;
            left: -100%;
            width: 100%;
            height: 100%;
            background: linear-gradient(90deg, transparent, rgba(99, 102, 241, 0.1), transparent);
            transition: left 0.6s ease;
          }
          .faq-card:hover::before {
            left: 100%;
          }
          @keyframes fade-in {
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          @keyframes float {
            0%, 100% {
              transform: translateY(0px);
            }
            50% {
              transform: translateY(-5px);
            }
          }
          @keyframes shimmer {
            0% {
              background-position: -200% 0;
            }
            100% {
              background-position: 200% 0;
            }
          }
          .faq-card:hover {
            box-shadow: 0 25px 50px -15px rgba(0,0,0,0.7), 0 0 40px rgba(99, 102, 241, 0.4);
            transform: translateY(-2px) scale(1.01);
            border-color: rgba(99, 102, 241, 0.6);
            background: linear-gradient(135deg, rgba(30, 41, 59, 0.9) 0%, rgba(15, 23, 42, 1) 100%);
          }
          .category-title {
            background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
            background-clip: text;
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            font-weight: 700;
          }
          .question-text {
            color: #e2e8f0;
            font-weight: 600;
          }
          .answer-text {
            color: #94a3b8;
            line-height: 1.6;
          }
          .cta-section {
            background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
            border-radius: 1.5rem;
            box-shadow: 0 20px 40px -15px rgba(99, 102, 241, 0.4);
            position: relative;
            overflow: hidden;
            transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          }
          .cta-section::before {
            content: '';
            position: absolute;
            top: -50%;
            left: -50%;
            width: 200%;
            height: 200%;
            background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
            animation: float 4s ease-in-out infinite;
          }
          .cta-section:hover {
            transform: translateY(-5px) scale(1.02);
            box-shadow: 0 30px 60px -20px rgba(99, 102, 241, 0.6);
          }
        `}</style>

        {/* Hero Section */}
        <header className="page-header py-32 text-center relative">
          <div className="hero-content relative z-10">
            <div className="container mx-auto px-4">
              <div className="mb-6">
                <i className="fas fa-question-circle text-6xl text-blue-500 mb-4 animate-bounce"></i>
              </div>
              <h1 className="text-5xl md:text-7xl font-black mb-6 text-glow bg-gradient-to-r from-blue-400 via-purple-500 to-blue-600 bg-clip-text text-transparent">
                Frequently Asked Questions
              </h1>
              <p className="text-lg md:text-xl max-w-3xl mx-auto text-slate-300 leading-relaxed">
                Everything you need to know about our professional gaming boosting services. 
                <br className="hidden md:block" />
                Can't find what you're looking for? Our support team is here to help!
              </p>
              <div className="mt-8 flex justify-center space-x-4">
                <div className="flex items-center text-green-400">
                  <i className="fas fa-shield-alt mr-2"></i>
                  <span className="text-sm">100% Safe</span>
                </div>
                <div className="flex items-center text-blue-400">
                  <i className="fas fa-clock mr-2"></i>
                  <span className="text-sm">24/7 Support</span>
                </div>
                <div className="flex items-center text-purple-400">
                  <i className="fas fa-star mr-2"></i>
                  <span className="text-sm">Professional</span>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* FAQ Content */}
        <main className="container mx-auto px-4 py-12">
          <div className="max-w-4xl mx-auto">
            {faqData.map((category, categoryIndex) => (
              <section key={categoryIndex} className="mb-16">
                <h2 className="text-3xl md:text-4xl font-bold mb-8 text-center category-title">
                  {category.category}
                </h2>
                
                <div className="space-y-6">
                  {category.items.map((item, itemIndex) => {
                    const uniqueIndex = `${categoryIndex}-${itemIndex}`;
                    const isOpen = openItems[uniqueIndex];
                    
                    return (
                      <div 
                        key={itemIndex} 
                        className="faq-card overflow-hidden"
                        style={{ animationDelay: `${itemIndex * 100}ms` }}
                      >
                        <button
                          onClick={() => toggleItem(uniqueIndex)}
                          className="w-full px-6 py-5 text-left flex items-center justify-between hover:bg-slate-800/50 transition-all duration-300 group"
                        >
                          <div className="flex items-center">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center mr-4 group-hover:scale-110 transition-transform duration-300">
                              <i className="fas fa-question text-white text-sm"></i>
                            </div>
                            <h3 className="text-lg font-semibold question-text pr-4 group-hover:text-blue-300 transition-colors duration-300">
                              {item.question}
                            </h3>
                          </div>
                          <div className={`transform transition-all duration-300 ${isOpen ? 'rotate-180 text-purple-400' : 'text-blue-500'} group-hover:scale-110`}>
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </div>
                        </button>
                        
                        <div className={`transition-all duration-500 ease-in-out ${isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'} overflow-hidden`}>
                          <div className="px-6 pb-6">
                             <div className="h-px bg-gradient-to-r from-transparent via-blue-500/50 to-transparent mb-6"></div>
                             <div className="answer-text bg-slate-800/30 rounded-lg p-4 border-l-4 border-blue-500">
                               <div className="flex items-start">
                                 <i className="fas fa-lightbulb text-yellow-400 mr-3 mt-1 flex-shrink-0"></i>
                                 <div className="text-slate-300 leading-relaxed">
                                   {typeof item.answer === 'string' ? (
                                     <p>{item.answer}</p>
                                   ) : (
                                     item.answer
                                   )}
                                 </div>
                               </div>
                             </div>
                           </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        </main>

        {/* Contact CTA */}
        <section className="py-20 px-4 relative">
          <div className="container mx-auto text-center">
            <div className="cta-section p-10 max-w-3xl mx-auto text-white relative">
              <div className="mb-6">
                <i className="fas fa-headset text-5xl text-white mb-4 animate-pulse"></i>
              </div>
              <h2 className="text-4xl font-bold mb-6 bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">
                Still Have Questions?
              </h2>
              <p className="mb-8 text-xl opacity-90 leading-relaxed">
                Our dedicated support team is available 24/7 to help you with any questions or concerns.
                <br className="hidden md:block" />
                Get instant answers and personalized assistance!
              </p>
              <div className="flex flex-col sm:flex-row gap-6 justify-center">
                <a 
                  href="https://discord.gg/s88WnxvG" 
                  target="_blank" 
                  className="group inline-flex items-center justify-center px-8 py-4 bg-white text-blue-600 font-bold rounded-xl hover:bg-gray-100 transition-all duration-300 transform hover:scale-105 hover:shadow-2xl"
                >
                  <i className="fab fa-discord mr-3 text-xl group-hover:animate-bounce"></i>
                  Join Our Discord
                  <i className="fas fa-external-link-alt ml-2 text-sm opacity-70"></i>
                </a>
                <a 
                  href="/contact" 
                  className="group inline-flex items-center justify-center px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 hover:shadow-2xl"
                >
                  <i className="fas fa-envelope mr-3 text-xl group-hover:animate-pulse"></i>
                  Contact Support
                  <i className="fas fa-arrow-right ml-2 text-sm group-hover:translate-x-1 transition-transform"></i>
                </a>
              </div>
              <div className="mt-8 flex justify-center space-x-8 text-sm opacity-80">
                <div className="flex items-center">
                  <i className="fas fa-clock mr-2 text-green-400"></i>
                  <span>24/7 Available</span>
                </div>
                <div className="flex items-center">
                  <i className="fas fa-reply mr-2 text-blue-400"></i>
                  <span>Quick Response</span>
                </div>
                <div className="flex items-center">
                  <i className="fas fa-users mr-2 text-purple-400"></i>
                  <span>Expert Team</span>
                </div>
              </div>
            </div>
          </div>
        </section>

      </div>
    </>
  );
}
