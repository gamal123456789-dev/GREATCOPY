import React, { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useOrders } from '../context/OrdersContext';
import UnifiedOrderSummary from '../components/UnifiedOrderSummary';

// --- All constants used in price calculations ---
const MASTERY_RANK_PRICES = {
    'mr1to5': 20.00,
    'mr6to10': 30.00,
    'mr11to15': 40.00,
    'mr16to20': 50.00,
    'mr21to30': 60.00
};

const WARFRAME_FARM_PRICES = {
    'excalibur': 15.00,
    'mag': 15.00,
    'volt': 15.00,
    'rhino': 20.00,
    'frost': 20.00,
    'ember': 20.00,
    'loki': 25.00,
    'nyx': 25.00,
    'trinity': 30.00,
    'saryn': 30.00,
    'vauban': 35.00,
    'nova': 35.00
};

const WEAPON_FARM_PRICES = {
    'braton': 10.00,
    'soma': 15.00,
    'tigris': 20.00,
    'lex': 12.00,
    'kunai': 8.00,
    'nikana': 25.00,
    'opticor': 30.00,
    'ignis': 18.00
};

const QUEST_COMPLETION_PRICES = {
    'vorsPrize': 15.00,
    'onceAwake': 20.00,
    'theArchwingQuest': 25.00,
    'stolenDreams': 30.00,
    'theSecondDream': 35.00,
    'theWarWithin': 40.00,
    'chainsOfHarrow': 35.00,
    'theApostasyPrologue': 30.00
};

const NIGHTWAVE_PRICES = {
    'intermissionRank1to15': 25.00,
    'intermissionRank16to30': 35.00,
    'seriesRank1to30': 45.00,
    'prestigeRanks': 20.00
};

const EXTRAS_PRICES = {
    'liveStream': 5.00,
    'specificBuild': 8.00,
    'fastCompletion': 10.00,
    'modsIncluded': 12.00,
    'formaIncluded': 15.00
};

// A robust, visual-only checkbox component that relies on state, not CSS pseudo-elements.
const CustomCheckboxVisual = ({ checked }) => {
    return (
        <div className={`w-6 h-6 rounded border flex items-center justify-center transition-all duration-200 ${
            checked
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 border-cyan-500'
                : 'bg-zinc-600 border-zinc-500'
        }`}>
            {checked && (
                <svg className="w-4 h-4 text-white fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                    <path d="M0 11l2-2 5 5L18 3l2 2L7 18z"/>
                </svg>
            )}
        </div>
    );
};

// Style object to visually hide an element but keep it accessible
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

const WarframeOffersPage = () => {
    const { data: session, status } = useSession();
    const router = useRouter();
    const { addOrder } = useOrders();
    const [isProcessingPayment, setIsProcessingPayment] = useState(false);
    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('coinbase');
    
    // Default active service state
    const [activeService, setActiveService] = useState('masteryRank');
    
    // States for Mastery Rank service
    const [selectedMasteryRank, setSelectedMasteryRank] = useState('');
    const [masteryRankExtras, setMasteryRankExtras] = useState([]);
    const [masteryRankPrice, setMasteryRankPrice] = useState(0);

    // States for Warframe Farm service
    const [selectedWarframeFarm, setSelectedWarframeFarm] = useState('');
    const [warframeFarmExtras, setWarframeFarmExtras] = useState([]);
    const [warframeFarmPrice, setWarframeFarmPrice] = useState(0);

    // States for Weapon Farm service
    const [selectedWeaponFarm, setSelectedWeaponFarm] = useState('');
    const [weaponFarmExtras, setWeaponFarmExtras] = useState([]);
    const [weaponFarmPrice, setWeaponFarmPrice] = useState(0);

    // States for Quest Completion service
    const [selectedQuestCompletion, setSelectedQuestCompletion] = useState('');
    const [questCompletionExtras, setQuestCompletionExtras] = useState([]);
    const [questCompletionPrice, setQuestCompletionPrice] = useState(0);

    // States for Nightwave service
    const [selectedNightwave, setSelectedNightwave] = useState('');
    const [nightwaveExtras, setNightwaveExtras] = useState([]);
    const [nightwavePrice, setNightwavePrice] = useState(0);

    // --- Price calculation effects ---
    useEffect(() => {
        let price = MASTERY_RANK_PRICES[selectedMasteryRank] || 0;
        masteryRankExtras.forEach(extra => price += EXTRAS_PRICES[extra] || 0);
        setMasteryRankPrice(price.toFixed(2));
    }, [selectedMasteryRank, masteryRankExtras]);

    useEffect(() => {
        let price = WARFRAME_FARM_PRICES[selectedWarframeFarm] || 0;
        warframeFarmExtras.forEach(extra => price += EXTRAS_PRICES[extra] || 0);
        setWarframeFarmPrice(price.toFixed(2));
    }, [selectedWarframeFarm, warframeFarmExtras]);

    useEffect(() => {
        let price = WEAPON_FARM_PRICES[selectedWeaponFarm] || 0;
        weaponFarmExtras.forEach(extra => price += EXTRAS_PRICES[extra] || 0);
        setWeaponFarmPrice(price.toFixed(2));
    }, [selectedWeaponFarm, weaponFarmExtras]);

    useEffect(() => {
        let price = QUEST_COMPLETION_PRICES[selectedQuestCompletion] || 0;
        questCompletionExtras.forEach(extra => price += EXTRAS_PRICES[extra] || 0);
        setQuestCompletionPrice(price.toFixed(2));
    }, [selectedQuestCompletion, questCompletionExtras]);

    useEffect(() => {
        let price = NIGHTWAVE_PRICES[selectedNightwave] || 0;
        nightwaveExtras.forEach(extra => price += EXTRAS_PRICES[extra] || 0);
        setNightwavePrice(price.toFixed(2));
    }, [selectedNightwave, nightwaveExtras]);

    // --- Helper functions for handling changes ---
    const handleExtraChange = (setter) => (e) => {
        const { value, checked } = e.target;
        setter(prev => checked ? [...prev, value] : prev.filter(item => item !== value));
    };
    
    const handleMasteryRankExtraChange = handleExtraChange(setMasteryRankExtras);
    const handleWarframeFarmExtraChange = handleExtraChange(setWarframeFarmExtras);
    const handleWeaponFarmExtraChange = handleExtraChange(setWeaponFarmExtras);
    const handleQuestCompletionExtraChange = handleExtraChange(setQuestCompletionExtras);
    const handleNightwaveExtraChange = handleExtraChange(setNightwaveExtras);

    // Definition of services list with SVG icons
    const services = [
        { id: 'masteryRank', name: 'Mastery Rank', icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="currentColor" class="w-6 h-6"><path d="M256 0c-17.7 0-32 14.3-32 32V256c0 17.7 14.3 32 32 32s32-14.3 32-32V32c0-17.7-14.3-32-32-32zM128 192a128 128 0 1 0 256 0 128 128 0 10-256 0zM512 416c0 35.3-28.7 64-64 64H64c-35.3 0-64-28.7-64-64V352c0-17.7 14.3-32 32-32s32 14.3 32 32v64H448V352c0-17.7 14.3-32 32-32s32 14.3 32 32v64z"/></svg>` },
        { id: 'warframeFarm', name: 'Warframe Farm', icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="currentColor" class="w-6 h-6"><path d="M256 0C114.6 0 0 114.6 0 256S114.6 512 256 512s256-114.6 256-256S397.4 0 256 0zM128 256a32 32 0 1 1 64 0 32 32 0 1 1-64 0zm192 0a32 32 0 1 1 64 0 32 32 0 1 1-64 0zM256 320c-35.3 0-64-28.7-64-64s28.7-64 64-64 64 28.7 64 64-28.7 64-64 64z"/></svg>` },
        { id: 'weaponFarm', name: 'Weapon Farm', icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512" fill="currentColor" class="w-6 h-6"><path d="M573.7 206.6L372.4 39.5c-2.4-2.4-5.4-3.5-8.5-3.5s-6.1 1.1-8.5 3.5L150.3 244.7c-2.4 2.4-3.5 5.4-3.5 8.5s1.1 6.1 3.5 8.5L351.6 472.5c2.4 2.4 5.4 3.5 8.5 3.5s6.1-1.1 8.5-3.5L573.7 223.6c2.4-2.4 3.5-5.4 3.5-8.5s-1.1-6.1-3.5-8.5z"/></svg>` },
        { id: 'questCompletion', name: 'Quest Completion', icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512" fill="currentColor" class="w-6 h-6"><path d="M0 64C0 28.7 28.7 0 64 0H224V128c0 17.7 14.3 32 32 32H384V448c0 35.3-28.7 64-64 64H64c-35.3 0-64-28.7-64-64V64zm384 64H256V0L384 128z"/></svg>` },
        { id: 'nightwave', name: 'Nightwave', icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="currentColor" class="w-6 h-6"><path d="M226.5 9.4c1.7-6.2 2.9-10.9 2.9-10.9S234.4 0 256 0s26.6 4.6 26.6 4.6c0 0 1.2 4.7 2.9 10.9L384 192l128 0c17.7 0 32 14.3 32 32s-14.3 32-32 32l-128 0-64 192c-1.7 6.2-2.9 10.9-2.9 10.9s-4.6 4.6-26.6 4.6s-26.6-4.6-26.6-4.6c0 0-1.2-4.7-2.9-10.9L128 256 0 256c-17.7 0-32-14.3-32-32s14.3-32 32-32l128 0L226.5 9.4z"/></svg>` },
    ];

    // Function to render content for the active service
    const renderServiceContent = () => {
        switch (activeService) {
            case 'masteryRank':
                return (
                    <div className="space-y-8">
                        <h3 className="text-4xl font-black text-white">Mastery Rank</h3>
                        <div className="space-y-4">
                            <label htmlFor="mastery-rank-select" className="text-xl font-bold text-white">Select Mastery Rank Range</label>
                            <select id="mastery-rank-select" className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-3 text-lg" value={selectedMasteryRank} onChange={(e) => setSelectedMasteryRank(e.target.value)}>
                                <option value="">-- Choose Mastery Rank Range --</option>
                                {Object.entries(MASTERY_RANK_PRICES).map(([key, price]) => (
                                    <option key={key} value={key}>{key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())} - ${price.toFixed(2)}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <h4 className="text-xl font-bold text-white mb-4">Extras</h4>
                            <div className="space-y-3">
                                {Object.entries(EXTRAS_PRICES).map(([key, price]) => (
                                    <label key={key} className="flex items-center justify-between p-4 bg-zinc-900/50 rounded-lg border border-zinc-700 cursor-pointer hover:border-cyan-500 transition-colors">
                                        <div>
                                            <span className="font-semibold text-white">{key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</span>
                                            <span className="text-blue-400 font-bold ml-2">{price > 0 ? `+$${price.toFixed(2)}` : 'Free'}</span>
                                        </div>
                                        <input type="checkbox" value={key} onChange={handleMasteryRankExtraChange} checked={masteryRankExtras.includes(key)} style={srOnlyStyle} />
                                        <CustomCheckboxVisual checked={masteryRankExtras.includes(key)} />
                                    </label>
                                ))}
                            </div>
                        </div>
                    </div>
                );
            case 'warframeFarm':
                return (
                    <div className="space-y-8">
                        <h3 className="text-4xl font-black text-white">Warframe Farm</h3>
                        <div className="space-y-4">
                            <label htmlFor="warframe-farm-select" className="text-xl font-bold text-white">Select Warframe</label>
                            <select id="warframe-farm-select" className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-3 text-lg" value={selectedWarframeFarm} onChange={(e) => setSelectedWarframeFarm(e.target.value)}>
                                <option value="">-- Choose a Warframe --</option>
                                {Object.entries(WARFRAME_FARM_PRICES).map(([key, price]) => (
                                    <option key={key} value={key}>{key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())} - ${price.toFixed(2)}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <h4 className="text-xl font-bold text-white mb-4">Extras</h4>
                            <div className="space-y-3">
                                {Object.entries(EXTRAS_PRICES).map(([key, price]) => (
                                    <label key={key} className="flex items-center justify-between p-4 bg-zinc-900/50 rounded-lg border border-zinc-700 cursor-pointer hover:border-cyan-500 transition-colors">
                                        <div>
                                            <span className="font-semibold text-white">{key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</span>
                                            <span className="text-cyan-400 font-bold ml-2">{price > 0 ? `+$${price.toFixed(2)}` : 'Free'}</span>
                                        </div>
                                        <input type="checkbox" value={key} onChange={handleWarframeFarmExtraChange} checked={warframeFarmExtras.includes(key)} style={srOnlyStyle} />
                                        <CustomCheckboxVisual checked={warframeFarmExtras.includes(key)} />
                                    </label>
                                ))}
                            </div>
                        </div>
                    </div>
                );
            case 'weaponFarm':
                return (
                    <div className="space-y-8">
                        <h3 className="text-4xl font-black text-white">Weapon Farm</h3>
                        <div className="space-y-4">
                            <label htmlFor="weapon-farm-select" className="text-xl font-bold text-white">Select Weapon</label>
                            <select id="weapon-farm-select" className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-3 text-lg" value={selectedWeaponFarm} onChange={(e) => setSelectedWeaponFarm(e.target.value)}>
                                <option value="">-- Choose a Weapon --</option>
                                {Object.entries(WEAPON_FARM_PRICES).map(([key, price]) => (
                                    <option key={key} value={key}>{key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())} - ${price.toFixed(2)}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <h4 className="text-xl font-bold text-white mb-4">Extras</h4>
                            <div className="space-y-3">
                                {Object.entries(EXTRAS_PRICES).map(([key, price]) => (
                                    <label key={key} className="flex items-center justify-between p-4 bg-zinc-900/50 rounded-lg border border-zinc-700 cursor-pointer hover:border-cyan-500 transition-colors">
                                        <div>
                                            <span className="font-semibold text-white">{key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</span>
                                            <span className="text-cyan-400 font-bold ml-2">{price > 0 ? `+$${price.toFixed(2)}` : 'Free'}</span>
                                        </div>
                                        <input type="checkbox" value={key} onChange={handleWeaponFarmExtraChange} checked={weaponFarmExtras.includes(key)} style={srOnlyStyle} />
                                        <CustomCheckboxVisual checked={weaponFarmExtras.includes(key)} />
                                    </label>
                                ))}
                            </div>
                        </div>
                    </div>
                );
            case 'questCompletion':
                return (
                    <div className="space-y-8">
                        <h3 className="text-4xl font-black text-white">Quest Completion</h3>
                        <div className="space-y-4">
                            <label htmlFor="quest-completion-select" className="text-xl font-bold text-white">Select Quest</label>
                            <select id="quest-completion-select" className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-3 text-lg" value={selectedQuestCompletion} onChange={(e) => setSelectedQuestCompletion(e.target.value)}>
                                <option value="">-- Choose a Quest --</option>
                                {Object.entries(QUEST_COMPLETION_PRICES).map(([key, price]) => (
                                    <option key={key} value={key}>{key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())} - ${price.toFixed(2)}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <h4 className="text-xl font-bold text-white mb-4">Extras</h4>
                            <div className="space-y-3">
                                {Object.entries(EXTRAS_PRICES).map(([key, price]) => (
                                    <label key={key} className="flex items-center justify-between p-4 bg-zinc-900/50 rounded-lg border border-zinc-700 cursor-pointer hover:border-cyan-500 transition-colors">
                                        <div>
                                            <span className="font-semibold text-white">{key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</span>
                                            <span className="text-cyan-400 font-bold ml-2">{price > 0 ? `+$${price.toFixed(2)}` : 'Free'}</span>
                                        </div>
                                        <input type="checkbox" value={key} onChange={handleQuestCompletionExtraChange} checked={questCompletionExtras.includes(key)} style={srOnlyStyle} />
                                        <CustomCheckboxVisual checked={questCompletionExtras.includes(key)} />
                                    </label>
                                ))}
                            </div>
                        </div>
                    </div>
                );
            case 'nightwave':
                return (
                    <div className="space-y-8">
                        <h3 className="text-4xl font-black text-white">Nightwave</h3>
                        <div className="space-y-4">
                            <label htmlFor="nightwave-select" className="text-xl font-bold text-white">Select Nightwave Tier</label>
                            <select id="nightwave-select" className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-3 text-lg" value={selectedNightwave} onChange={(e) => setSelectedNightwave(e.target.value)}>
                                <option value="">-- Choose Nightwave Tier --</option>
                                {Object.entries(NIGHTWAVE_PRICES).map(([key, price]) => (
                                    <option key={key} value={key}>{key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())} - ${price.toFixed(2)}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <h4 className="text-xl font-bold text-white mb-4">Extras</h4>
                            <div className="space-y-3">
                                {Object.entries(EXTRAS_PRICES).map(([key, price]) => (
                                    <label key={key} className="flex items-center justify-between p-4 bg-zinc-900/50 rounded-lg border border-zinc-700 cursor-pointer hover:border-cyan-500 transition-colors">
                                        <div>
                                            <span className="font-semibold text-white">{key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</span>
                                            <span className="text-cyan-400 font-bold ml-2">{price > 0 ? `+$${price.toFixed(2)}` : 'Free'}</span>
                                        </div>
                                        <input type="checkbox" value={key} onChange={handleNightwaveExtraChange} checked={nightwaveExtras.includes(key)} style={srOnlyStyle} />
                                        <CustomCheckboxVisual checked={nightwaveExtras.includes(key)} />
                                    </label>
                                ))}
                            </div>
                        </div>
                    </div>
                );
            default:
                return null;
        }
    };

    // Calculate total price
    const getTotalPrice = () => {
        switch (activeService) {
            case 'masteryRank': return masteryRankPrice;
            case 'warframeFarm': return warframeFarmPrice;
            case 'weaponFarm': return weaponFarmPrice;
            case 'questCompletion': return questCompletionPrice;
            case 'nightwave': return nightwavePrice;
            default: return '0.00';
        }
    };

    // Helper functions for the unified payment system
    const getCurrentPrice = () => {
        return getTotalPrice();
    };

    const getCurrentService = () => {
        return services.find(s => s.id === activeService)?.name || 'Select Service';
    };

    const getCurrentServiceDetails = () => {
        switch (activeService) {
            case 'masteryRank': {
                let details = selectedMasteryRank ? `Mastery Rank: ${selectedMasteryRank}` : 'Select Mastery Rank';
                if (masteryRankExtras.length > 0) {
                    const extrasText = masteryRankExtras.map(extra => 
                        extra.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())
                    ).join(', ');
                    details += ` + ${extrasText}`;
                }
                return details;
            }
            case 'warframeFarm': {
                let details = selectedWarframeFarm ? `Warframe: ${selectedWarframeFarm}` : 'Select Warframe';
                if (warframeFarmExtras.length > 0) {
                    const extrasText = warframeFarmExtras.map(extra => 
                        extra.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())
                    ).join(', ');
                    details += ` + ${extrasText}`;
                }
                return details;
            }
            case 'weaponFarm': {
                let details = selectedWeaponFarm ? `Weapon: ${selectedWeaponFarm}` : 'Select Weapon';
                if (weaponFarmExtras.length > 0) {
                    const extrasText = weaponFarmExtras.map(extra => 
                        extra.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())
                    ).join(', ');
                    details += ` + ${extrasText}`;
                }
                return details;
            }
            case 'questCompletion': {
                let details = selectedQuestCompletion ? `Quest: ${selectedQuestCompletion}` : 'Select Quest';
                if (questCompletionExtras.length > 0) {
                    const extrasText = questCompletionExtras.map(extra => 
                        extra.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())
                    ).join(', ');
                    details += ` + ${extrasText}`;
                }
                return details;
            }
            case 'nightwave': {
                let details = selectedNightwave ? `Nightwave: ${selectedNightwave}` : 'Select Nightwave';
                if (nightwaveExtras.length > 0) {
                    const extrasText = nightwaveExtras.map(extra => 
                        extra.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())
                    ).join(', ');
                    details += ` + ${extrasText}`;
                }
                return details;
            }
            default: return 'Select Service';
        }
    };

    const handlePaymentStart = () => {
        setIsProcessingPayment(true);
    };

    const handlePaymentComplete = () => {
        setIsProcessingPayment(false);
        router.push('/orders');
    };

    const handlePaymentError = (error) => {
        setIsProcessingPayment(false);
        console.error('Payment error:', error);
        alert('Payment failed. Please contact support.');
    };

    // Purchase handling function
    const handlePurchase = async () => {
        if (status === 'loading') return;
        
        if (!session) {
            router.push('/auth');
            return;
        }

        setIsProcessingPayment(true);
        
        try {
            const totalPrice = parseFloat(getTotalPrice());
            if (totalPrice <= 0) {
                alert('Please select a service first.');
                setIsProcessingPayment(false);
                return;
            }

            let serviceDescription = '';
            switch (activeService) {
                case 'masteryRank':
                    serviceDescription = `Warframe Mastery Rank: ${selectedMasteryRank}`;
                    break;
                case 'warframeFarm':
                    serviceDescription = `Warframe Farm: ${selectedWarframeFarm}`;
                    break;
                case 'weaponFarm':
                    serviceDescription = `Warframe Weapon Farm: ${selectedWeaponFarm}`;
                    break;
                case 'questCompletion':
                    serviceDescription = `Warframe Quest: ${selectedQuestCompletion}`;
                    break;
                case 'nightwave':
                    serviceDescription = `Warframe Nightwave: ${selectedNightwave}`;
                    break;
            }

            const orderData = {
                game: 'Warframe',
                service: serviceDescription,
                price: totalPrice,
                paymentMethod: selectedPaymentMethod,
                userId: session.user.id,
                userEmail: session.user.email
            };

            const response = await fetch('/api/pay/coinbase/create-payment', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(orderData)
            });

            const result = await response.json();
            
            if (result.success && result.paymentUrl) {
                // Order will be created after successful payment confirmation
                // via /api/pay/confirm-payment or webhook
                window.location.href = result.paymentUrl;
            } else {
                throw new Error(result.error || 'Payment creation failed');
            }
        } catch (error) {
            console.error('Payment error:', error);
            alert('Payment processing failed. Please try again.');
        } finally {
            setIsProcessingPayment(false);
        }
    };



    return (
        <>
            <style jsx>{`
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
                    background-image: url('/images/games/warframe.jpg');
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
                        <h1 className="text-5xl md:text-7xl font-extrabold mb-4 text-glow">Become a Tenno Legend</h1>
                        <p className="text-lg md:text-xl max-w-3xl mx-auto text-gray-300">
                            Professional Warframe boosting services. Mastery rank, warframe farming, weapon farming, quest completion, and nightwave.
                        </p>
                        <div className="mt-8 start-boost-shape text-white shadow-lg">
                            <a href="#services">Awaken Your Power</a>
                        </div>
                    </div>
                </section>

                <main className="container mx-auto px-4 py-16" id="services">
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
                                gameName="Warframe"
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
        </>
    );
}

export default WarframeOffersPage;