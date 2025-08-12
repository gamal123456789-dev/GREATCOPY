import React, { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useOrders } from '../context/OrdersContext';
import UnifiedOrderSummary from '../components/UnifiedOrderSummary';

// --- All constants used in price calculations ---
const POWER_LEVELING_PRICES = {
    'level1to20': 15.00,
    'level20to40': 25.00,
    'level40to60': 35.00,
    'level60to80': 45.00,
    'level80to100': 55.00
};

const ENDGAME_CONTENT_PRICES = {
    'mapTier1to5': 20.00,
    'mapTier6to10': 30.00,
    'mapTier11to15': 40.00,
    'mapTier16Plus': 50.00
};

const BOSS_KILL_PRICES = {
    'pinnacleAtlas': 35.00,
    'elderGuardians': 30.00,
    'shaperGuardians': 25.00,
    'atziri': 20.00,
    'uberAtziri': 40.00
};

const CURRENCY_FARMING_PRICES = {
    'chaosOrbs100': 25.00,
    'exaltedOrbs10': 35.00,
    'divineOrbs5': 45.00,
    'ancientOrbs10': 30.00
};

const ASCENDANCY_PRICES = {
    'normalAscendancy': 20.00,
    'mercilessAscendancy': 30.00,
    'eternalAscendancy': 40.00
};

const EXTRAS_PRICES = {
    'liveStream': 5.00,
    'specificBuild': 10.00,
    'fastCompletion': 8.00,
    'gearIncluded': 15.00
};

// A robust, visual-only checkbox component that relies on state, not CSS pseudo-elements.
const CustomCheckboxVisual = ({ checked }) => {
    return (
        <div className={`w-6 h-6 rounded border flex items-center justify-center transition-all duration-200 ${
            checked
                ? 'bg-gradient-to-r from-red-500 to-yellow-600 border-red-500'
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

const PathOfExile2OffersPage = () => {
    const { data: session, status } = useSession();
    const router = useRouter();
    const { addOrder } = useOrders();
    const [isProcessingPayment, setIsProcessingPayment] = useState(false);
    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('coinbase');
    
    // Default active service state
    const [activeService, setActiveService] = useState('powerLeveling');
    
    // States for Power Leveling service
    const [selectedPowerLevel, setSelectedPowerLevel] = useState('');
    const [powerLevelingExtras, setPowerLevelingExtras] = useState([]);
    const [powerLevelingPrice, setPowerLevelingPrice] = useState(0);

    // States for Endgame Content service
    const [selectedEndgameContent, setSelectedEndgameContent] = useState('');
    const [endgameContentExtras, setEndgameContentExtras] = useState([]);
    const [endgameContentPrice, setEndgameContentPrice] = useState(0);

    // States for Boss Kills service
    const [selectedBossKill, setSelectedBossKill] = useState('');
    const [bossKillExtras, setBossKillExtras] = useState([]);
    const [bossKillPrice, setBossKillPrice] = useState(0);

    // States for Currency Farming service
    const [selectedCurrencyFarming, setSelectedCurrencyFarming] = useState('');
    const [currencyFarmingExtras, setCurrencyFarmingExtras] = useState([]);
    const [currencyFarmingPrice, setCurrencyFarmingPrice] = useState(0);

    // States for Ascendancy service
    const [selectedAscendancy, setSelectedAscendancy] = useState('');
    const [ascendancyExtras, setAscendancyExtras] = useState([]);
    const [ascendancyPrice, setAscendancyPrice] = useState(0);

    // --- Price calculation effects ---
    useEffect(() => {
        let price = POWER_LEVELING_PRICES[selectedPowerLevel] || 0;
        powerLevelingExtras.forEach(extra => price += EXTRAS_PRICES[extra] || 0);
        setPowerLevelingPrice(price.toFixed(2));
    }, [selectedPowerLevel, powerLevelingExtras]);

    useEffect(() => {
        let price = ENDGAME_CONTENT_PRICES[selectedEndgameContent] || 0;
        endgameContentExtras.forEach(extra => price += EXTRAS_PRICES[extra] || 0);
        setEndgameContentPrice(price.toFixed(2));
    }, [selectedEndgameContent, endgameContentExtras]);

    useEffect(() => {
        let price = BOSS_KILL_PRICES[selectedBossKill] || 0;
        bossKillExtras.forEach(extra => price += EXTRAS_PRICES[extra] || 0);
        setBossKillPrice(price.toFixed(2));
    }, [selectedBossKill, bossKillExtras]);

    useEffect(() => {
        let price = CURRENCY_FARMING_PRICES[selectedCurrencyFarming] || 0;
        currencyFarmingExtras.forEach(extra => price += EXTRAS_PRICES[extra] || 0);
        setCurrencyFarmingPrice(price.toFixed(2));
    }, [selectedCurrencyFarming, currencyFarmingExtras]);

    useEffect(() => {
        let price = ASCENDANCY_PRICES[selectedAscendancy] || 0;
        ascendancyExtras.forEach(extra => price += EXTRAS_PRICES[extra] || 0);
        setAscendancyPrice(price.toFixed(2));
    }, [selectedAscendancy, ascendancyExtras]);

    // --- Helper functions for handling changes ---
    const handleExtraChange = (setter) => (e) => {
        const { value, checked } = e.target;
        setter(prev => checked ? [...prev, value] : prev.filter(item => item !== value));
    };
    
    const handlePowerLevelingExtraChange = handleExtraChange(setPowerLevelingExtras);
    const handleEndgameContentExtraChange = handleExtraChange(setEndgameContentExtras);
    const handleBossKillExtraChange = handleExtraChange(setBossKillExtras);
    const handleCurrencyFarmingExtraChange = handleExtraChange(setCurrencyFarmingExtras);
    const handleAscendancyExtraChange = handleExtraChange(setAscendancyExtras);

    // Define services list with icons (SVG)
    const services = [
        { id: 'powerLeveling', name: 'Power Leveling', icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="currentColor" class="w-6 h-6"><path d="M256 0c-17.7 0-32 14.3-32 32V256c0 17.7 14.3 32 32 32s32-14.3 32-32V32c0-17.7-14.3-32-32-32zM128 192a128 128 0 1 0 256 0 128 128 0 10-256 0zM512 416c0 35.3-28.7 64-64 64H64c-35.3 0-64-28.7-64-64V352c0-17.7 14.3-32 32-32s32 14.3 32 32v64H448V352c0-17.7 14.3-32 32-32s32 14.3 32 32v64z"/></svg>` },
        { id: 'endgameContent', name: 'Endgame Content', icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="currentColor" class="w-6 h-6"><path d="M256 0C114.6 0 0 114.6 0 256S114.6 512 256 512s256-114.6 256-256S397.4 0 256 0zM128 256a32 32 0 1 1 64 0 32 32 0 1 1-64 0zm192 0a32 32 0 1 1 64 0 32 32 0 1 1-64 0zM256 320c-35.3 0-64-28.7-64-64s28.7-64 64-64 64 28.7 64 64-28.7 64-64 64z"/></svg>` },
        { id: 'bossKills', name: 'Boss Kills', icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="currentColor" class="w-6 h-6"><path d="M32 32C14.3 32 0 46.3 0 64v96c0 17.7 14.3 32 32 32H64V416c0 17.7 14.3 32 32 32H416c17.7 0 32-14.3 32-32V192h32c17.7 0 32-14.3 32-32V64c0-17.7-14.3-32-32-32H32zM128 288a32 32 0 1 1 0-64 32 32 0 1 1 0 64zm224 0a32 32 0 1 1 0-64 32 32 0 1 1 0 64z"/></svg>` },
        { id: 'currencyFarming', name: 'Currency Farming', icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="currentColor" class="w-6 h-6"><path d="M226.5 9.4c1.7-6.2 2.9-10.9 2.9-10.9S234.4 0 256 0s26.6 4.6 26.6 4.6c0 0 1.2 4.7 2.9 10.9L384 192l128 0c17.7 0 32 14.3 32 32s-14.3 32-32 32l-128 0-64 192c-1.7 6.2-2.9 10.9-2.9 10.9s-4.6 4.6-26.6 4.6s-26.6-4.6-26.6-4.6c0 0-1.2-4.7-2.9-10.9L128 256 0 256c-17.7 0-32-14.3-32-32s14.3-32 32-32l128 0L226.5 9.4z"/></svg>` },
        { id: 'ascendancy', name: 'Ascendancy', icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512" fill="currentColor" class="w-6 h-6"><path d="M573.7 206.6L372.4 39.5c-2.4-2.4-5.4-3.5-8.5-3.5s-6.1 1.1-8.5 3.5L150.3 244.7c-2.4 2.4-3.5 5.4-3.5 8.5s1.1 6.1 3.5 8.5L351.6 472.5c2.4 2.4 5.4 3.5 8.5 3.5s6.1-1.1 8.5-3.5L573.7 223.6c2.4-2.4 3.5-5.4 3.5-8.5s-1.1-6.1-3.5-8.5z"/></svg>` },
    ];

    // Function to render content for the active service
    const renderServiceContent = () => {
        switch (activeService) {
            case 'powerLeveling':
                return (
                    <div className="space-y-8">
                        <h3 className="text-4xl font-black text-white">Power Leveling</h3>
                        <div className="space-y-4">
                            <label htmlFor="power-level-select" className="text-xl font-bold text-white">Select Level Range</label>
                            <select id="power-level-select" className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-3 text-lg" value={selectedPowerLevel} onChange={(e) => setSelectedPowerLevel(e.target.value)}>
                                <option value="">-- Choose Level Range --</option>
                                {Object.entries(POWER_LEVELING_PRICES).map(([key, price]) => (
                                    <option key={key} value={key}>{key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())} - ${price.toFixed(2)}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <h4 className="text-xl font-bold text-white mb-4">Extras</h4>
                            <div className="space-y-3">
                                {Object.entries(EXTRAS_PRICES).map(([key, price]) => (
                                    <label key={key} className="flex items-center justify-between p-4 bg-zinc-900/50 rounded-lg border border-zinc-700 cursor-pointer hover:border-red-500 transition-colors">
                                        <div>
                                            <span className="font-semibold text-white">{key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</span>
                                            <span className="text-blue-400 font-bold ml-2">{price > 0 ? `+$${price.toFixed(2)}` : 'Free'}</span>
                                        </div>
                                        <input type="checkbox" value={key} onChange={handlePowerLevelingExtraChange} checked={powerLevelingExtras.includes(key)} style={srOnlyStyle} />
                                        <CustomCheckboxVisual checked={powerLevelingExtras.includes(key)} />
                                    </label>
                                ))}
                            </div>
                        </div>
                    </div>
                );
            case 'endgameContent':
                return (
                    <div className="space-y-8">
                        <h3 className="text-4xl font-black text-white">Endgame Content</h3>
                        <div className="space-y-4">
                            <label htmlFor="endgame-content-select" className="text-xl font-bold text-white">Select Map Tier</label>
                            <select id="endgame-content-select" className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-3 text-lg" value={selectedEndgameContent} onChange={(e) => setSelectedEndgameContent(e.target.value)}>
                                <option value="">-- Choose Map Tier --</option>
                                {Object.entries(ENDGAME_CONTENT_PRICES).map(([key, price]) => (
                                    <option key={key} value={key}>{key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())} - ${price.toFixed(2)}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <h4 className="text-xl font-bold text-white mb-4">Extras</h4>
                            <div className="space-y-3">
                                {Object.entries(EXTRAS_PRICES).map(([key, price]) => (
                                    <label key={key} className="flex items-center justify-between p-4 bg-zinc-900/50 rounded-lg border border-zinc-700 cursor-pointer hover:border-red-500 transition-colors">
                                        <div>
                                            <span className="font-semibold text-white">{key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</span>
                                            <span className="text-red-400 font-bold ml-2">{price > 0 ? `+$${price.toFixed(2)}` : 'Free'}</span>
                                        </div>
                                        <input type="checkbox" value={key} onChange={handleEndgameContentExtraChange} checked={endgameContentExtras.includes(key)} style={srOnlyStyle} />
                                        <CustomCheckboxVisual checked={endgameContentExtras.includes(key)} />
                                    </label>
                                ))}
                            </div>
                        </div>
                    </div>
                );
            case 'bossKills':
                return (
                    <div className="space-y-8">
                        <h3 className="text-4xl font-black text-white">Boss Kills</h3>
                        <div className="space-y-4">
                            <label htmlFor="boss-kill-select" className="text-xl font-bold text-white">Select Boss</label>
                            <select id="boss-kill-select" className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-3 text-lg" value={selectedBossKill} onChange={(e) => setSelectedBossKill(e.target.value)}>
                                <option value="">-- Choose a Boss --</option>
                                {Object.entries(BOSS_KILL_PRICES).map(([key, price]) => (
                                    <option key={key} value={key}>{key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())} - ${price.toFixed(2)}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <h4 className="text-xl font-bold text-white mb-4">Extras</h4>
                            <div className="space-y-3">
                                {Object.entries(EXTRAS_PRICES).map(([key, price]) => (
                                    <label key={key} className="flex items-center justify-between p-4 bg-zinc-900/50 rounded-lg border border-zinc-700 cursor-pointer hover:border-red-500 transition-colors">
                                        <div>
                                            <span className="font-semibold text-white">{key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</span>
                                            <span className="text-red-400 font-bold ml-2">{price > 0 ? `+$${price.toFixed(2)}` : 'Free'}</span>
                                        </div>
                                        <input type="checkbox" value={key} onChange={handleBossKillExtraChange} checked={bossKillExtras.includes(key)} style={srOnlyStyle} />
                                        <CustomCheckboxVisual checked={bossKillExtras.includes(key)} />
                                    </label>
                                ))}
                            </div>
                        </div>
                    </div>
                );
            case 'currencyFarming':
                return (
                    <div className="space-y-8">
                        <h3 className="text-4xl font-black text-white">Currency Farming</h3>
                        <div className="space-y-4">
                            <label htmlFor="currency-farming-select" className="text-xl font-bold text-white">Select Currency Package</label>
                            <select id="currency-farming-select" className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-3 text-lg" value={selectedCurrencyFarming} onChange={(e) => setSelectedCurrencyFarming(e.target.value)}>
                                <option value="">-- Choose Currency Package --</option>
                                {Object.entries(CURRENCY_FARMING_PRICES).map(([key, price]) => (
                                    <option key={key} value={key}>{key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())} - ${price.toFixed(2)}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <h4 className="text-xl font-bold text-white mb-4">Extras</h4>
                            <div className="space-y-3">
                                {Object.entries(EXTRAS_PRICES).map(([key, price]) => (
                                    <label key={key} className="flex items-center justify-between p-4 bg-zinc-900/50 rounded-lg border border-zinc-700 cursor-pointer hover:border-red-500 transition-colors">
                                        <div>
                                            <span className="font-semibold text-white">{key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</span>
                                            <span className="text-red-400 font-bold ml-2">{price > 0 ? `+$${price.toFixed(2)}` : 'Free'}</span>
                                        </div>
                                        <input type="checkbox" value={key} onChange={handleCurrencyFarmingExtraChange} checked={currencyFarmingExtras.includes(key)} style={srOnlyStyle} />
                                        <CustomCheckboxVisual checked={currencyFarmingExtras.includes(key)} />
                                    </label>
                                ))}
                            </div>
                        </div>
                    </div>
                );
            case 'ascendancy':
                return (
                    <div className="space-y-8">
                        <h3 className="text-4xl font-black text-white">Ascendancy</h3>
                        <div className="space-y-4">
                            <label htmlFor="ascendancy-select" className="text-xl font-bold text-white">Select Ascendancy Difficulty</label>
                            <select id="ascendancy-select" className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-3 text-lg" value={selectedAscendancy} onChange={(e) => setSelectedAscendancy(e.target.value)}>
                                <option value="">-- Choose Ascendancy Difficulty --</option>
                                {Object.entries(ASCENDANCY_PRICES).map(([key, price]) => (
                                    <option key={key} value={key}>{key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())} - ${price.toFixed(2)}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <h4 className="text-xl font-bold text-white mb-4">Extras</h4>
                            <div className="space-y-3">
                                {Object.entries(EXTRAS_PRICES).map(([key, price]) => (
                                    <label key={key} className="flex items-center justify-between p-4 bg-zinc-900/50 rounded-lg border border-zinc-700 cursor-pointer hover:border-red-500 transition-colors">
                                        <div>
                                            <span className="font-semibold text-white">{key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</span>
                                            <span className="text-red-400 font-bold ml-2">{price > 0 ? `+$${price.toFixed(2)}` : 'Free'}</span>
                                        </div>
                                        <input type="checkbox" value={key} onChange={handleAscendancyExtraChange} checked={ascendancyExtras.includes(key)} style={srOnlyStyle} />
                                        <CustomCheckboxVisual checked={ascendancyExtras.includes(key)} />
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
            case 'powerLeveling': return powerLevelingPrice;
            case 'endgameContent': return endgameContentPrice;
            case 'bossKills': return bossKillPrice;
            case 'currencyFarming': return currencyFarmingPrice;
            case 'ascendancy': return ascendancyPrice;
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
            case 'powerLeveling': {
                let details = selectedPowerLevel ? `Power Leveling: ${selectedPowerLevel.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}` : 'Select Power Leveling';
                if (powerLevelingExtras.length > 0) {
                    const extrasText = powerLevelingExtras.map(extra => 
                        extra.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())
                    ).join(', ');
                    details += ` + ${extrasText}`;
                }
                return details;
            }
            case 'endgameContent': {
                let details = selectedEndgameContent ? `Endgame Content: ${selectedEndgameContent.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}` : 'Select Endgame Content';
                if (endgameContentExtras.length > 0) {
                    const extrasText = endgameContentExtras.map(extra => 
                        extra.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())
                    ).join(', ');
                    details += ` + ${extrasText}`;
                }
                return details;
            }
            case 'bossKills': {
                let details = selectedBossKill ? `Boss Kill: ${selectedBossKill.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}` : 'Select Boss Kill';
                if (bossKillExtras.length > 0) {
                    const extrasText = bossKillExtras.map(extra => 
                        extra.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())
                    ).join(', ');
                    details += ` + ${extrasText}`;
                }
                return details;
            }
            case 'currencyFarming': {
                let details = selectedCurrencyFarming ? `Currency Farming: ${selectedCurrencyFarming.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}` : 'Select Currency Farming';
                if (currencyFarmingExtras.length > 0) {
                    const extrasText = currencyFarmingExtras.map(extra => 
                        extra.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())
                    ).join(', ');
                    details += ` + ${extrasText}`;
                }
                return details;
            }
            case 'ascendancy': {
                let details = selectedAscendancy ? `Ascendancy: ${selectedAscendancy.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}` : 'Select Ascendancy';
                if (ascendancyExtras.length > 0) {
                    const extrasText = ascendancyExtras.map(extra => 
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
                case 'powerLeveling':
                    serviceDescription = `Path of Exile 2 Power Leveling: ${selectedPowerLevel}`;
                    break;
                case 'endgameContent':
                    serviceDescription = `Path of Exile 2 Endgame Content: ${selectedEndgameContent}`;
                    break;
                case 'bossKills':
                    serviceDescription = `Path of Exile 2 Boss Kill: ${selectedBossKill}`;
                    break;
                case 'currencyFarming':
                    serviceDescription = `Path of Exile 2 Currency Farming: ${selectedCurrencyFarming}`;
                    break;
                case 'ascendancy':
                    serviceDescription = `Path of Exile 2 Ascendancy: ${selectedAscendancy}`;
                    break;
            }

            const orderData = {
                game: 'Path of Exile 2',
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
                    background-image: url('/images/games/pathofexile2.jpg');
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
                        <h1 className="text-5xl md:text-7xl font-extrabold mb-4 text-glow">Conquer Wraeclast</h1>
                        <p className="text-lg md:text-xl max-w-3xl mx-auto text-gray-300">
                            Professional Path of Exile 2 boosting services. Power leveling, endgame content, boss kills, and currency farming.
                        </p>
                        <div className="mt-8 start-boost-shape text-white shadow-lg">
                            <a href="#services">Start Your Exile</a>
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
                                gameName="Path of Exile 2"
                                serviceName={getCurrentService()}
                                serviceDetails={getCurrentServiceDetails()}
                                price={getCurrentPrice()}
                                onPaymentStart={handlePaymentStart}
                                onPaymentComplete={handlePaymentComplete}
                                onPaymentError={handlePaymentError}
                            />
                        </aside>
                    </div>
                </main>
            </div>
        </>
    );
}

export default PathOfExile2OffersPage;