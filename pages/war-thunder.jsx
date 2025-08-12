import Head from 'next/head';
import React, { useState, useEffect } from 'react';
import { useOrders } from '../context/OrdersContext';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import { useApiError } from '../hooks/useApiError';
import UnifiedOrderSummary from '../components/UnifiedOrderSummary';


// --- War Thunder specific constants ---
const WT_SL_PRICE_PER_MILLION = 12.00; 
const WT_RP_PRICE_AIRCRAFT_PER_60K = 4.00; 
const WT_RP_PRICE_TANK_PER_60K = 6.00; 

// A robust, visual-only checkbox component
const CustomCheckboxVisual = ({ checked }) => {
    return (
        <div className={`w-6 h-6 rounded border flex items-center justify-center transition-all duration-200 ${checked ? 'bg-gradient-to-r from-blue-500 to-purple-600 border-blue-500' : 'bg-zinc-600 border-zinc-500'}`}>
            {checked && (
                <svg className="w-4 h-4 text-white fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                    <path d="M0 11l2-2 5 5L18 3l2 2L7 18z"/>
                </svg>
            )}
        </div>
    );
};

// Style object to visually hide an element
const srOnlyStyle = {
  position: 'absolute',
  width: '1px',
  height: '1px',
  padding: '0',
  margin: '-1px',
  overflow: 'hidden',
  clip: 'rect(0, 0, 0, 0)',
  whiteSpace: 'nowrap',
  borderWidth: '0',
};

const WarThunderOffersPage = () => {
    const [activeService, setActiveService] = useState('silverLions');
    const [silverLionsAmount, setSilverLionsAmount] = useState(1); // in millions
    const [silverLionsPrice, setSilverLionsPrice] = useState('12.00');
    const [silverLionsExtras, setSilverLionsExtras] = useState([]);
    const [researchPointsAmount, setResearchPointsAmount] = useState(60); // in thousands
    const [researchPointsPrice, setResearchPointsPrice] = useState('4.00');
    const [researchPointsExtras, setResearchPointsExtras] = useState([]);
    const [vehicleType, setVehicleType] = useState('aircraft');
    const [researchingType, setResearchingType] = useState('modifications');
    const [isProcessingPayment, setIsProcessingPayment] = useState(false);
    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('coinbase');

    const { addOrder } = useOrders();
    const router = useRouter();
    const { data: session, status } = useSession(); // Add useSession
    const { handleApiError } = useApiError(); // Enhanced error handling

    // No need to protect the page - protection only when purchasing

    useEffect(() => {
        calculateAllPrices();
    }, [silverLionsAmount, researchPointsAmount, vehicleType, researchingType]);



    const calculateAllPrices = () => {
        calculateSlPrice();
        calculateRpPrice();
    };

    const calculateSlPrice = () => {
        setSilverLionsPrice((silverLionsAmount * WT_SL_PRICE_PER_MILLION).toFixed(2));
    };

    const calculateRpPrice = () => {
        const basePricePer60k = vehicleType === 'aircraft' ? WT_RP_PRICE_AIRCRAFT_PER_60K : WT_RP_PRICE_TANK_PER_60K;
        const price = (researchPointsAmount / 60) * basePricePer60k;
        setResearchPointsPrice(price.toFixed(2));
    };
    
    const services = [
        { id: 'silverLions', name: 'Silver Lions', icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="currentColor" class="w-6 h-6"><path d="M256 0c-17.7 0-32 14.3-32 32V64H160c-17.7 0-32 14.3-32 32s14.3 32 32 32h64v32c0 17.7 14.3 32 32 32s32-14.3 32-32V128h64c17.7 0 32-14.3 32-32s-14.3-32-32-32H288V32c0-17.7-14.3-32-32-32zM416 224c0-17.7-14.3-32-32-32s-32 14.3-32 32v32H160V224c0-17.7-14.3-32-32-32s-32 14.3-32 32v96c0 53 43 96 96 96H352c53 0 96-43 96-96V224z"/></svg>` },
        { id: 'researchPoints', name: 'Research Points', icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="currentColor" class="w-6 h-6"><path d="M416 208c0 45.9-14.9 88.3-40 122.7L502.6 457.4c12.5 12.5 12.5 32.8 0 45.3s-32.8 12.5-45.3 0L330.7 376c-34.4 25.2-76.8 40-122.7 40C93.1 416 0 322.9 0 208S93.1 0 208 0S416 93.1 416 208zM208 352a144 144 0 1 0 0-288 144 144 0 1 0 0 288z"/></svg>` },
    ];

    const renderServiceContent = () => {
        switch (activeService) {
            case 'silverLions':
                return (
                    <div className="space-y-8">
                        <h3 className="text-4xl font-black text-white">Silver Lions Farming</h3>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center text-lg"><span className="text-gray-400">Amount:</span><span className="font-bold text-white">{(silverLionsAmount * 1000000).toLocaleString()} SL</span></div>
                            <input type="range" min="1" max="5" step="0.1" value={silverLionsAmount} onChange={(e) => setSilverLionsAmount(Number(e.target.value))} className="w-full h-2 bg-zinc-700 rounded-lg appearance-none cursor-pointer range-thumb" />
                        </div>
                        <div className="p-4 bg-zinc-800/50 rounded-lg border border-zinc-700">
                            <p className="text-lg text-gray-300">This service requires a <span className="font-bold text-white">Premium Vehicle of rank 6 or higher (aircraft only) and a Premium Account</span>.</p>
                        </div>
                    </div>
                );
            case 'researchPoints':
                return (
                    <div className="space-y-8">
                        <h3 className="text-4xl font-black text-white">Research Points (RP) Farming</h3>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center text-lg"><span className="text-gray-400">Amount:</span><span className="font-bold text-white">{(researchPointsAmount * 1000).toLocaleString()} RP</span></div>
                            <input type="range" min="60" max="5000" step="10" value={researchPointsAmount} onChange={(e) => setResearchPointsAmount(Number(e.target.value))} className="w-full h-2 bg-zinc-700 rounded-lg appearance-none cursor-pointer range-thumb" />
                        </div>
                         <div className="space-y-4">
                            <h4 className="text-xl font-bold text-white">Options</h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <button onClick={() => setVehicleType('tank')} className={`option-button ${vehicleType === 'tank' ? 'active' : ''}`}>Tank</button>
                                <button onClick={() => setVehicleType('aircraft')} className={`option-button ${vehicleType === 'aircraft' ? 'active' : ''}`}>Aircraft</button>
                            </div>
                             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <button className={`option-button active`}>Premium Account: Yes</button>
                            </div>
                        </div>
                        <div className="space-y-4">
                            <h4 className="text-xl font-bold text-white">What are you researching?</h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <button onClick={() => setResearchingType('modifications')} className={`option-button ${researchingType === 'modifications' ? 'active' : ''}`}>Modifications</button>
                                <button onClick={() => setResearchingType('vehicles')} className={`option-button ${researchingType === 'vehicles' ? 'active' : ''}`}>Vehicles</button>
                            </div>
                        </div>
                        <div className="p-4 bg-zinc-800/50 rounded-lg border border-zinc-700">
                            <p className="text-lg text-gray-300">This service requires a <span className="font-bold text-white">Premium Vehicle at the same rank or higher</span>.</p>
                        </div>
                    </div>
                );
            default:
                return null;
        }
    };

    const getCurrentPrice = () => {
        switch (activeService) {
            case 'silverLions': return silverLionsPrice;
            case 'researchPoints': return researchPointsPrice;
            default: return '0.00';
        }
    };

    const getCurrentService = () => {
        switch (activeService) {
            case 'silverLions': 
                return `${(silverLionsAmount * 1000000).toLocaleString()} Silver Lions Farming`;
            case 'researchPoints': 
                return `${(researchPointsAmount * 1000).toLocaleString()} Research Points ${vehicleType} ${researchingType} Farming`;
            default: 
                return 'Select Service';
        }
    };

    const getCurrentServiceDetails = () => {
        switch (activeService) {
            case 'silverLions': {
                let details = `${(silverLionsAmount * 1000000).toLocaleString()} SL`;
                if (silverLionsExtras && silverLionsExtras.length > 0) {
                    const extrasText = silverLionsExtras.map(extra => 
                        extra.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())
                    ).join(', ');
                    details += ` + ${extrasText}`;
                }
                return details;
            }
            case 'researchPoints': {
                 let details = `${(researchPointsAmount * 1000).toLocaleString()} RP`;
                 if (vehicleType) {
                     details += ` (${vehicleType.charAt(0).toUpperCase() + vehicleType.slice(1)})`;
                 }
                 if (researchingType) {
                     details += ` - ${researchingType}`;
                 }
                 if (researchPointsExtras && researchPointsExtras.length > 0) {
                     const extrasText = researchPointsExtras.map(extra => 
                         extra.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())
                     ).join(', ');
                     details += ` + ${extrasText}`;
                 }
                 return details;
             }
            default: 
                return null;
        }
    };

    const handlePaymentStart = (paymentData) => {
        setIsProcessingPayment(true);
        console.log('Payment started:', paymentData);
    };

    const handlePaymentComplete = (result) => {
        setIsProcessingPayment(false);
        console.log('Payment completed:', result);
    };

    const handlePaymentError = (error) => {
        setIsProcessingPayment(false);
        console.error('Payment error:', error);
    };



    return (
        <>
            <Head>
                <title>War Thunder Boosting Services - Gearscore</title>
                <meta name="viewport" content="width=device-width, initial-scale=1" />
                <meta charSet="UTF-8" />
                <meta name="description" content="Professional War Thunder boosting services - Silver Lions and Research Points farming with premium accounts and vehicles." />
                <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css" />
                <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
            </Head>
            <style jsx global>{`
                :root { --glow-color: hsl(220, 100%, 75%); }
                body { 
                    font-family: 'Inter', sans-serif; 
                    background-color: #0c0a09; 
                    color: #e2e8f0; 
                    overflow-x: hidden; 
                }
                .service-tab.active { 
                    background: linear-gradient(to right, #4a90e2, #7b68ee);
                    color: white; 
                    box-shadow: 0 0 20px rgba(74, 144, 226, 0.6); 
                    transform: translateY(-4px);
                }
                .service-tab {
                    padding: 1rem 1.5rem;
                    border-radius: 0.75rem;
                    border: 1px solid #52525b;
                    background-color: #27272a;
                    transition: all 0.3s ease;
                    color: #e2e8f0;
                    cursor: pointer;
                    flex-shrink: 0;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                .service-tab:hover:not(.active) {
                    background-color: #3f3f46;
                    border-color: #4a90e2;
                }
                .option-button { 
                    padding: 0.75rem 1rem; 
                    border-radius: 0.5rem; 
                    border: 1px solid #52525b; 
                    background-color: #3f3f46;
                    transition: all 0.2s ease; 
                    color: #e2e8f0; 
                }
                .option-button.active { 
                    background: linear-gradient(to right, #4a90e2, #7b68ee);
                    border-color: #4a90e2; 
                    color: white; 
                }
                input[type="range"]::-webkit-slider-thumb { 
                    -webkit-appearance: none; 
                    appearance: none; 
                    width: 20px; 
                    height: 20px; 
                    background: linear-gradient(to right, #4a90e2, #7b68ee);
                    cursor: pointer; 
                    border-radius: 50%; 
                    border: 2px solid #e2e8f0; 
                }
                input[type="range"]::-moz-range-thumb { 
                    width: 20px; 
                    height: 20px; 
                    background: linear-gradient(to right, #4a90e2, #7b68ee);
                    cursor: pointer; 
                    border-radius: 50%; 
                    border: 2px solid #e2e8f0; 
                }
                .text-glow { text-shadow: 0 0 20px rgba(255, 255, 255, 0.1), 0 0 40px var(--glow-color); }
                .card-bg {
                    background-color: #1f1f22;
                    border: 1px solid #3f3f46;
                    border-radius: 1.5rem;
                    box-shadow: 0 10px 20px rgba(0, 0, 0, 0.2);
                    backdrop-filter: blur(8px);
                    -webkit-backdrop-filter: blur(8px);
                }
                .hero-section-bg {
                    background-image: url('/images/games/warthunderbackground.png');
                    background-size: cover;
                    background-position: center;
                    position: relative;
                    z-index: 0;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    min-height: 600px;
                }
                .hero-overlay {
                    position: absolute;
                    inset: 0;
                    background: linear-gradient(to top, rgba(12, 10, 9, 1) 0%, rgba(12, 10, 9, 0.5) 50%, rgba(12, 10, 9, 1) 100%);
                    z-index: 1;
                }
                .start-boost-shape {
                    padding: 1.2rem 3rem;
                    border-radius: 9999px;
                    font-size: 1.6rem;
                    font-weight: 800;
                    letter-spacing: 0.05em;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    cursor: default;
                    user-select: none;
                    transition: all 0.4s ease-in-out;
                    position: relative;
                    overflow: hidden;
                    border: 2px solid transparent;
                    animation: pulse-glow 2s infinite alternate;
                }
                .start-boost-shape::before {
                    content: '';
                    position: absolute;
                    top: -50%;
                    left: -50%;
                    width: 200%;
                    height: 200%;
                    background: radial-gradient(circle at center, rgba(255, 255, 255, 0.15), transparent 70%);
                    transform: rotate(0deg);
                    animation: halo-glow 8s infinite linear;
                    z-index: -1;
                    opacity: 0.8;
                }
                @keyframes halo-glow {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                @keyframes pulse-glow {
                    from { box-shadow: 0 5px 15px rgba(74, 144, 226, 0.4); }
                    to { box-shadow: 0 8px 25px rgba(74, 144, 226, 0.7); }
                }
                .price-summary-card {
                    background-color: #1f1f22;
                    border: 1px solid #3f3f46;
                    border-radius: 1.5rem;
                    box-shadow: 0 10px 20px rgba(0, 0, 0, 0.2);
                    backdrop-filter: blur(8px);
                    -webkit-backdrop-filter: blur(8px);
                    padding: 1.5rem;
                }
                .price-text {
                    color: #4a90e2;
                }
                .purchase-button {
                    background: linear-gradient(to right, #4a90e2, #7b68ee);
                    box-shadow: 0 5px 15px rgba(74, 144, 226, 0.4);
                    transition: all 0.3s ease;
                }
                .purchase-button:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 8px 20px rgba(74, 144, 226, 0.7);
                }


            `}</style>
            <div className="min-h-screen">
                <section className="py-24 text-center text-white relative hero-section-bg">
                    <div className="hero-overlay"></div>
                    <div className="container mx-auto px-4 relative z-10 flex flex-col items-center justify-center h-full">
                        <h1 className="text-5xl md:text-7xl font-extrabold mb-4 text-glow">Dominate the Battlefield in War Thunder</h1>
                        <p className="text-lg md:text-xl max-w-3xl mx-auto text-gray-300">
                            Top-tier boosting services for aircraft, ground vehicles, and naval forces.
                        </p>
                        <div className="mt-8 start-boost-shape text-white shadow-lg">
                            Start Your Boost
                        </div>
                    </div>
                </section>

                <main className="container mx-auto px-4 py-16">
                    <div className="mb-12 flex flex-wrap justify-center gap-4 overflow-x-auto pb-4">
                        {services.map(service => (
                            <button 
                                key={service.id} 
                                onClick={() => setActiveService(service.id)}
                                className={`service-tab ${activeService === service.id ? 'active' : ''}`}
                            >
                                <span dangerouslySetInnerHTML={{ __html: service.icon }} className="mr-2 text-xl text-blue-300"></span>
                                <span className="font-semibold text-lg">{service.name}</span>
                            </button>
                        ))}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                        <div className="lg:col-span-8">
                            <div className="p-8 card-bg">
                                {renderServiceContent()}
                            </div>
                        </div>
                        <aside className="lg:col-span-4">
                            <UnifiedOrderSummary
                                gameName="War Thunder"
                                serviceName={getCurrentService()}
                                serviceDetails={getCurrentServiceDetails()}
                                price={getCurrentPrice()}
                                onPaymentStart={handlePaymentStart}
                                onPaymentComplete={handlePaymentComplete}
                                onPaymentError={handlePaymentError}
                                isProcessing={isProcessingPayment}
                            />
                        </aside>
                    </div>
                </main>
                

            </div>
            

            
            <footer className="bg-gray-900 py-10 text-gray-400 text-sm mt-16">
                <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div>
                        <h3 className="text-lg font-bold text-white mb-4">Gearscore</h3>
                        <p>Your gateway to professional gaming boosting services. We aim to provide the best experience for gamers.</p>
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-white mb-4">Quick Links</h3>
                        <ul>
                            <li className="mb-2"><a href="/" className="hover:text-white">Home</a></li>
                            <li className="mb-2"><a href="/games" className="hover:text-white">Games</a></li>
                            <li className="mb-2"><a href="/war-thunder" className="hover:text-white">War Thunder</a></li>
                            <li className="mb-2"><a href="/orders" className="hover:text-white">My Orders</a></li>
                        </ul>
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-white mb-4">Support</h3>
                        <ul>
                            <li className="mb-2"><a href="/faq" className="hover:text-white">FAQ</a></li>
                            <li className="mb-2"><a href="/contact" className="hover:text-white">Contact Us</a></li>
                            <li className="mb-2"><a href="/privacy" className="hover:text-white">Privacy Policy</a></li>
                            <li className="mb-2"><a href="/how-it-works" className="hover:text-white">How It Works</a></li>
                        </ul>
                    </div>
                </div>
                <div className="text-center mt-10 border-t border-gray-700 pt-8">
                    <p>&copy; 2024 Gearscore. All rights reserved.</p>
                </div>
            </footer>
        </>
    );
};

export default WarThunderOffersPage;