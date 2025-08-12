import { useRouter } from 'next/router';
import { offers } from '../../data.js';

export default function GamePage() {
  const router = useRouter();
  const { game_id } = router.query;
  const gameOffers = offers[game_id] || {};

  return (
    <div className="min-h-screen bg-[#0e0e1a] text-white p-6">
      <h1 className="text-3xl font-bold text-blue-400 mb-8 capitalize">{game_id?.replace(/-/g, ' ')}</h1>

      {Object.keys(gameOffers).length === 0 && (
        <p className="text-white/50">No offers available for this game yet.</p>
      )}

      {Object.entries(gameOffers).map(([category, items]) => (
        <div key={category} className="mb-10">
          <h2 className="text-xl font-semibold mb-4 capitalize">{category}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {items.map((item, index) => (
              <div key={index} className="bg-[#1a1a2a] p-5 rounded-xl border border-white/10">
                <h3 className="text-lg font-semibold">{item.title}</h3>
                <p className="text-sm text-white/60">{item.desc}</p>
                <div className="flex justify-between items-center mt-4">
                  <span className="text-blue-300 font-bold">{item.price}</span>
                  <a
                    href={item.link}
                    target="_blank"
                    className="text-sm bg-blue-400 text-black px-3 py-1 rounded hover:bg-blue-500"
                  >
                    Buy
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
