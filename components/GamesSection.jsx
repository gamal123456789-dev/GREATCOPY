import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import OptimizedImage from './OptimizedImage';

const GamesSection = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [hoveredGame, setHoveredGame] = useState(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 300);
    
    return () => clearTimeout(timer);
  }, []);

  const games = [
    {
      id: 'destiny2',
      title: 'Destiny 2',
      subtitle: 'Guardian Services',
      description: 'Raids, Trials, Dungeons & More',
      image: '/images/games/destiny2.webp',
      fallbackImage: '/images/games/destiny2.jpg',
      gradient: 'from-orange-500 to-red-600',
      href: '/destiny2',
      popular: true,
      services: ['Raids', 'Trials of Osiris', 'Dungeons', 'Exotic Quests']
    },
    {
      id: 'war-thunder',
      title: 'War Thunder',
      subtitle: 'Military Vehicles',
      description: 'Research & Premium Services',
      image: '/images/games/war-thunder.webp',
      fallbackImage: '/images/games/war-thunder.jpg',
      gradient: 'from-green-500 to-teal-600',
      href: '/war-thunder',
      popular: false,
      services: ['Vehicle Research', 'Premium Account', 'Golden Eagles', 'Crew Training']
    },
    {
      id: 'rust',
      title: 'Rust',
      subtitle: 'Survival Boosting',
      description: 'Base Building & Resource Farming',
      image: '/images/games/rust.webp',
      fallbackImage: '/images/games/rust.jpg',
      gradient: 'from-yellow-500 to-orange-600',
      href: '/Rust',
      popular: true,
      services: ['Base Building', 'Resource Farming', 'PvP Training', 'Raid Defense']
    },
    {
      id: 'wow',
      title: 'World of Warcraft',
      subtitle: 'WoW Boosting',
      description: 'Leveling, Raids & Mythic+',
      image: '/images/games/wow.webp',
      fallbackImage: '/images/games/wow.jpg',
      gradient: 'from-blue-500 to-purple-600',
      href: '/games/wow',
      popular: true,
      services: ['Power Leveling', 'Mythic+ Dungeons', 'Raid Carries', 'PvP Rating']
    },
    {
      id: 'valorant',
      title: 'Valorant',
      subtitle: 'Rank Boosting',
      description: 'Competitive Rank Services',
      image: '/images/games/valorant.webp',
      fallbackImage: '/images/games/valorant.jpg',
      gradient: 'from-red-500 to-pink-600',
      href: '/games/valorant',
      popular: false,
      services: ['Rank Boosting', 'Placement Matches', 'Coaching', 'Account Recovery']
    },
    {
      id: 'apex',
      title: 'Apex Legends',
      subtitle: 'Battle Royale',
      description: 'Rank & Badge Services',
      image: '/images/games/apex.webp',
      fallbackImage: '/images/games/apex.jpg',
      gradient: 'from-purple-500 to-indigo-600',
      href: '/games/apex',
      popular: false,
      services: ['Rank Boosting', 'Badge Unlocks', 'Win Streaks', 'Damage Badges']
    }
  ];

  return (
    <section className="py-20 bg-gradient-to-b from-slate-900 to-slate-800 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-900/20 to-pink-900/20" />
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl" />
        </div>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Popular <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">Games</span>
          </h2>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto">
            Choose from our wide selection of gaming services across the most popular titles.
          </p>
        </div>

        {/* Games Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {games.map((game, index) => (
            <Link key={game.id} href={game.href}>
              <div
                className={`group relative bg-slate-800/50 backdrop-blur-sm rounded-2xl overflow-hidden border border-slate-700/50 hover:border-purple-500/50 transition-all duration-500 transform hover:scale-105 hover:-translate-y-2 cursor-pointer ${
                  isVisible ? 'animate-fade-in-up' : 'opacity-0'
                }`}
                style={{
                  animationDelay: `${index * 100}ms`,
                  willChange: 'transform'
                }}
                onMouseEnter={() => setHoveredGame(game.id)}
                onMouseLeave={() => setHoveredGame(null)}
              >
                {/* Popular Badge */}
                {game.popular && (
                  <div className="absolute top-4 right-4 z-20">
                    <span className="bg-gradient-to-r from-yellow-400 to-orange-500 text-black text-xs font-bold px-3 py-1 rounded-full">
                      POPULAR
                    </span>
                  </div>
                )}

                {/* Image Container */}
                <div className="relative h-48 overflow-hidden">
                  <OptimizedImage
                    src={game.image}
                    fallbackSrc={game.fallbackImage}
                    alt={game.title}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-110"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    priority={index < 3}
                  />
                  
                  {/* Gradient Overlay */}
                  <div className={`absolute inset-0 bg-gradient-to-t ${game.gradient} opacity-60 group-hover:opacity-40 transition-opacity duration-500`} />
                  
                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>

                {/* Content */}
                <div className="p-6 relative">
                  <div className="mb-4">
                    <h3 className="text-xl font-bold text-white mb-2 group-hover:text-purple-300 transition-colors duration-300">
                      {game.title}
                    </h3>
                    <p className="text-sm text-purple-400 font-medium mb-2">
                      {game.subtitle}
                    </p>
                    <p className="text-gray-400 text-sm">
                      {game.description}
                    </p>
                  </div>

                  {/* Services List */}
                  <div className={`transition-all duration-500 overflow-hidden ${
                    hoveredGame === game.id ? 'max-h-32 opacity-100' : 'max-h-0 opacity-0'
                  }`}>
                    <div className="border-t border-slate-700 pt-4 mt-4">
                      <p className="text-xs text-gray-500 mb-2">Available Services:</p>
                      <div className="flex flex-wrap gap-1">
                        {game.services.map((service, serviceIndex) => (
                          <span
                            key={serviceIndex}
                            className="text-xs bg-slate-700/50 text-gray-300 px-2 py-1 rounded-full"
                          >
                            {service}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* CTA Button */}
                  <div className="mt-4 pt-4 border-t border-slate-700/50">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-400">View Services</span>
                      <div className="flex items-center text-purple-400 group-hover:text-purple-300 transition-colors duration-300">
                        <span className="text-sm font-medium mr-2">Explore</span>
                        <svg className="w-4 h-4 transform group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Hover Glow Effect */}
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-purple-600/0 via-purple-600/5 to-pink-600/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              </div>
            </Link>
          ))}
        </div>

        {/* View All Games CTA */}
        <div className="text-center mt-16">
          <Link href="/games">
            <div className="inline-flex items-center justify-center p-1 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full hover:shadow-lg hover:shadow-purple-500/25 transition-all duration-300">
              <button className="px-8 py-3 bg-slate-900 text-white rounded-full font-semibold hover:bg-slate-800 transition-colors duration-300 flex items-center space-x-2">
                <span>View All Games</span>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </button>
            </div>
          </Link>
        </div>
      </div>

      <style jsx>{`
        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(40px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fade-in-up {
          animation: fade-in-up 0.8s ease-out forwards;
        }
        
        .backdrop-blur-sm {
          backdrop-filter: blur(4px);
        }
        
        /* تحسين الأداء */
        .group {
          transform: translateZ(0);
        }
        
        /* تحسين التمرير */
        .overflow-hidden {
          contain: layout style paint;
        }
      `}</style>
    </section>
  );
};

export default GamesSection;