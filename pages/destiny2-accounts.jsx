import React from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';

export default function Destiny2Accounts() {
    const { data: session } = useSession();
    const router = useRouter();

    return (
        <div className="min-h-screen bg-gray-900 text-white">
            <style jsx>{`
                .hero-section {
                    background: linear-gradient(135deg, rgba(0, 0, 0, 0.8), rgba(74, 144, 226, 0.3)), 
                                url('/destiny2.jpg') center/cover;
                    min-height: 100vh;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    position: relative;
                }
                .coming-soon-card {
                    background: rgba(31, 41, 55, 0.9);
                    border: 2px solid #4a90e2;
                    border-radius: 20px;
                    padding: 3rem;
                    text-align: center;
                    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);
                    backdrop-filter: blur(10px);
                    max-width: 600px;
                    width: 90%;
                }
                .glow-text {
                    color: #4a90e2;
                    text-shadow: 0 0 20px rgba(74, 144, 226, 0.6);
                    animation: pulse-glow 2s ease-in-out infinite alternate;
                }
                @keyframes pulse-glow {
                    from { text-shadow: 0 0 20px rgba(74, 144, 226, 0.6); }
                    to { text-shadow: 0 0 30px rgba(74, 144, 226, 0.9); }
                }
                .destiny-icon {
                    font-size: 4rem;
                    color: #7b68ee;
                    margin-bottom: 1rem;
                    animation: float 3s ease-in-out infinite;
                }
                @keyframes float {
                    0%, 100% { transform: translateY(0px); }
                    50% { transform: translateY(-10px); }
                }
                .back-button {
                    position: absolute;
                    top: 2rem;
                    left: 2rem;
                    background: rgba(74, 144, 226, 0.2);
                    border: 1px solid #4a90e2;
                    color: white;
                    padding: 0.75rem 1.5rem;
                    border-radius: 10px;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    backdrop-filter: blur(10px);
                }
                .back-button:hover {
                    background: rgba(74, 144, 226, 0.4);
                    transform: translateY(-2px);
                    box-shadow: 0 5px 15px rgba(74, 144, 226, 0.3);
                }
            `}</style>
            
            <div className="hero-section">
                <button 
                    className="back-button"
                    onClick={() => router.back()}
                >
                    ← Back
                </button>
                
                <div className="coming-soon-card">
                    <div className="destiny-icon">
                        🎮
                    </div>
                    <h1 className="text-5xl font-bold mb-6 glow-text">
                        Destiny 2 Accounts
                    </h1>
                    <div className="text-6xl font-bold mb-8 glow-text">
                        Coming Soon
                    </div>
                    <p className="text-xl text-gray-300 mb-6">
                        We're working hard to bring you the best Destiny 2 account services.
                    </p>
                    <p className="text-lg text-gray-400">
                        Stay tuned for premium accounts, rare collections, and exclusive content!
                    </p>
                    
                    <div className="mt-8 flex justify-center space-x-4">
                        <div className="w-3 h-3 bg-blue-400 rounded-full animate-bounce"></div>
                        <div className="w-3 h-3 bg-purple-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                        <div className="w-3 h-3 bg-blue-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                    </div>
                </div>
            </div>
        </div>
    );
}