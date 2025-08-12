import Head from "next/head";
import { useState, useEffect } from "react";
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'], display: 'swap' });

export default function Games() {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setTimeout(() => setLoaded(true), 100);
  }, []);

  const allGames = [
    { id: 1, name: 'New World', category: 'MMORPG', imageUrl: '/images/games/newworldgames.png', href: '/newworldoffers' },
    { id: 2, name: 'Black Desert Online', category: 'MMORPG', imageUrl: '/images/games/bdo.jpg', href: '/black-desert-online' },
    { id: 3, name: 'Rust', category: 'Survival', imageUrl: '/images/games/rust.webp', href: '/Rust' },
    { id: 4, name: 'Path of Exile', category: 'ARPG', imageUrl: '/images/games/pathofexile.png', href: '/pathofexile' },
    { id: 5, name: 'Destiny 2 Accounts', category: 'FPS', imageUrl: '/images/games/destiney2acount.png', href: '/destiny2-accounts' },
    { id: 6, name: 'Destiny 2', category: 'FPS', imageUrl: '/images/games/destiney2.png', href: '/destiny2' },
    { id: 7, name: 'War Thunder ', category: 'Simulation', imageUrl: '/images/games/warthunder.png', href: '/war-thunder' },
    { id: 8, name: 'Path of Exile 2', category: '', imageUrl: '/images/games/Pathofexile22.png', href: '/pathofexile2' },
    { id: 9, name: 'WarFrame', category: 'Action RPG', imageUrl: '/images/games/warframe.png', href: '/warframe' },
  ];

  const filters = ['All', 'MMORPG', 'ARPG', 'FPS', 'Simulation', 'Survival', 'Action RPG' ];

  const filteredGames = allGames.filter(game => {
    const matchesFilter = activeFilter === 'All' || game.category === activeFilter;
    const matchesSearch = game.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <>
      <Head>
        <title>Gearscore - Game Services</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta charSet="UTF-8" />
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.1.1/css/all.min.css" />
      </Head>

      <div className={`${inter.className} antialiased ${loaded ? 'is-loaded' : ''}`}>
        <style jsx global>{`
          body {
            background-color: #0d1117;
            color: #e2e8f0;
            overflow-x: hidden;
          }
          .page-header {
            background: linear-gradient(to top, #0d1117 5%, transparent 50%);
          }
          .text-glow {
            text-shadow: 0 0 25px rgba(192, 132, 252, 0.5), 0 0 50px rgba(129, 140, 248, 0.3);
          }
          .search-bar {
            background: linear-gradient(to right, #1e293b, #0f172a);
            border: 1px solid #334155;
            box-shadow: 0 10px 30px -10px rgba(0,0,0,0.5);
          }
          .filter-btn {
            background-color: #1e293b;
            color: #94a3b8;
            border: 1px solid #334155;
            transition: all 0.2s ease-in-out;
          }
          .filter-btn:hover {
            color: white;
            border-color: #818cf8;
          }
          .filter-btn.active {
            background: #6366f1;
            color: white;
            border-color: #6366f1;
            box-shadow: 0 0 20px rgba(99, 102, 241, 0.6);
          }
          .game-card {
            border-radius: 1rem;
            overflow: hidden;
            position: relative;
            opacity: 0;
            transform: scale(0.95) translateY(20px);
            animation: pop-in 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
            box-shadow: 0 20px 40px -15px rgba(0,0,0,0.6);
            border: 1px solid #334155;
            transition: all 0.4s ease;
          }
          @keyframes pop-in {
            to {
              opacity: 1;
              transform: scale(1) translateY(0);
            }
          }
          .game-card:hover {
            transform: scale(1.03);
            box-shadow: 0 30px 50px -20px rgba(0,0,0,0.8);
          }
          .game-card-image {
            width: 100%;
            height: 100%;
            object-fit: cover;
            transition: transform 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94);
          }
          .game-card:hover .game-card-image {
            transform: scale(1.15);
          }
          .game-card-content {
            position: absolute;
            inset: 0;
            display: flex;
            flex-direction: column;
            justify-content: flex-end;
            padding: 1.5rem;
            background: linear-gradient(to top, #0d1117 20%, rgba(13, 17, 23, 0.8) 40%, transparent 80%);
          }
          .game-card-title {
            font-size: 1.75rem;
            font-weight: 800;
            color: white;
            line-height: 1.2;
            margin-bottom: 0.5rem;
          }
          .game-card-category {
            font-size: 0.875rem;
            font-weight: 500;
            color: #a78bfa;
            margin-bottom: 1rem;
          }
          .game-card-button {
            background: #6366f1;
            color: white;
            padding: 0.75rem 1.5rem;
            border-radius: 9999px;
            font-weight: 600;
            transition: all 0.3s ease;
            opacity: 0;
            transform: translateY(20px);
            transition-delay: 0.1s;
          }
          .game-card:hover .game-card-button {
            transform: translateY(0);
            opacity: 1;
          }
          .game-card-button:hover {
            background-color: #4f46e5;
            box-shadow: 0 5px 15px rgba(99, 102, 241, 0.4);
          }
        `}</style>

        <header className="page-header py-24 text-center text-white relative">
          <div className="container mx-auto px-4">
            <h1 className="text-5xl md:text-7xl font-black mb-4 text-glow">
              Game Services
            </h1>
            <p className="text-lg md:text-xl max-w-3xl mx-auto text-gray-400">
              Explore our catalog of supported games. We provide professional services to help you achieve your goals.
            </p>
          </div>
        </header>

        <main className="container mx-auto px-4 py-12">
          <section className="mb-12 sticky top-4 z-20">
            <div className="max-w-4xl mx-auto p-4 rounded-2xl search-bar">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                <div className="md:col-span-1 relative">
                  <input
                    type="text"
                    placeholder="Search games..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg py-3 px-5 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                  />
                  <i className="fas fa-search absolute right-5 top-1/2 -translate-y-1/2 text-gray-500"></i>
                </div>
                <div className="md:col-span-2 flex justify-center md:justify-end flex-wrap gap-3">
                  {filters.map(filter => (
                    <button
                      key={filter}
                      onClick={() => setActiveFilter(filter)}
                      className={`filter-btn py-2 px-5 rounded-lg font-semibold text-sm ${activeFilter === filter ? 'active' : ''}`}
                    >
                      {filter}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredGames.length > 0 ? (
                filteredGames.map((game, index) => (
                  <div key={game.id} className="game-card h-[500px]" style={{ animationDelay: `${index * 100}ms` }}>
                    <img src={game.imageUrl} alt={game.name} className="game-card-image absolute inset-0" onError={(e) => { e.target.onerror = null; e.target.src='https://placehold.co/600x900/1a202c/e2e8f0?text=Image+Not+Found'; }} />
                    <div className="game-card-content">
                      <h3 className="game-card-title">{game.name}</h3>
                      <p className="game-card-category">{game.category}</p>
                      <a href={game.href || `/games/${game.name.toLowerCase().replace(/\s/g, '-')}`} className="game-card-button">
                        View Services
                      </a>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-full text-center py-16">
                  <i className="fas fa-ghost text-5xl text-gray-600 mb-4"></i>
                  <p className="text-2xl text-gray-400">No games found matching your criteria.</p>
                </div>
              )}
            </div>
          </section>
        </main>
      </div>
    </>
  );
}
