import React, { Component } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useOrders } from '../context/OrdersContext';
import { useApiError } from '../hooks/useApiError';
import UnifiedOrderSummary from '../components/UnifiedOrderSummary';

// --- Path of Exile Constants ---
const POE_CHAOS_ORB_RATE = 1.50; // Price per 100 Chaos Orbs
const POE_DIVINE_ORB_RATE = 2.50; // Price per Divine Orb
const PRICE_PER_ACT = 1.50; // Price per act for campaign completion

const POE_LAB_PRICES = {
    lab1: 1.00,
    lab2: 1.00,
    lab3: 1.00,
    lab4: 1.00,
};

const POE_LAB_DISPLAY_NAMES = {
    lab1: 'Lab 1 (Normal)',
    lab2: 'Lab 2 (Cruel)',
    lab3: 'Lab 3 (Merciless)',
    lab4: 'Lab 4 (Uber)',
};

const initialState = {
    activeService: 'currencyFarming',
    divineOrbs: 0,
    divineOrbPrice: '0.00',
    chaosOrbs: 0,
    chaosOrbPrice: '0.00',
    startLevel: 1,
    targetLevel: 60,
    levelingPrice: '10.00',
    selectedLabs: [],
    labPrice: '0.00',
    startAct: 1,
    targetAct: 10,
    actPrice: '13.50',
    playMode: 'piloted', // 'piloted' or 'selfPlay'
    isModalOpen: false,
    isProcessingPayment: false,
};

// A robust, visual-only checkbox component
const CustomCheckboxVisual = ({ checked }) => {
    return (
        <div className={`w-6 h-6 rounded border flex items-center justify-center transition-all duration-200 ${
            checked
                ? 'bg-gradient-to-r from-blue-500 to-purple-600 border-blue-500'
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

// Modal Component
const Modal = ({ isOpen, onClose, children }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
            <div className="bg-zinc-800 p-8 rounded-lg shadow-xl max-w-sm w-full text-center relative">
                <button onClick={onClose} className="absolute top-2 right-2 text-gray-400 hover:text-white text-2xl">&times;</button>
                {children}
            </div>
        </div>
    );
};

class PathofExileOffersPage extends Component {
    constructor(props) {
        super(props);
        this.state = { ...initialState };
    }

    componentDidMount() {
        this.calculateAllPrices();
    }

    componentDidUpdate(prevProps, prevState) {
        const fieldsToWatch = ['divineOrbs', 'chaosOrbs', 'startLevel', 'targetLevel', 'selectedLabs', 'startAct', 'targetAct', 'playMode'];
        if (fieldsToWatch.some(field => prevState[field] !== this.state[field])) {
            this.calculateAllPrices();
        }
    }
    
    resetState = () => {
        const activeService = this.state.activeService;
        this.setState({ ...initialState, activeService });
    }

    openModal = () => this.setState({ isModalOpen: true });
    closeModal = () => this.setState({ isModalOpen: false });



    getCurrentPrice = () => {
        const { activeService, divineOrbPrice, chaosOrbPrice, levelingPrice, labPrice, actPrice } = this.state;
        switch (activeService) {
            case 'currencyFarming': 
                return (parseFloat(divineOrbPrice) + parseFloat(chaosOrbPrice)).toFixed(2);
            case 'powerLeveling': 
                return levelingPrice;
            case 'actCompletion': 
                return actPrice;
            case 'labRuns': 
                return labPrice;
            default: 
                return '0.00';
        }
    };

    calculateAllPrices = () => {
        this.calculateCurrencyPrice();
        this.calculateLevelingPrice();
        this.calculateLabPrice();
        this.calculateActPrice();
    };

    calculateCurrencyPrice = () => {
        const { divineOrbs, chaosOrbs } = this.state;
        const divinePrice = divineOrbs * POE_DIVINE_ORB_RATE;
        const chaosPrice = (chaosOrbs / 100) * POE_CHAOS_ORB_RATE;
        this.setState({
            divineOrbPrice: divinePrice.toFixed(2),
            chaosOrbPrice: chaosPrice.toFixed(2),
        });
    };
    
    calculateLevelingPrice = () => {
        const { startLevel, targetLevel } = this.state;
        let price = 0;

        if (targetLevel <= startLevel) {
            this.setState({ levelingPrice: '0.00' });
            return;
        }

        if (startLevel === 1) {
            if (targetLevel <= 60) price = 10.00;
            else if (targetLevel <= 70) price = 14.00;
            else if (targetLevel <= 80) price = 20.00;
        }
        
        if (price === 0) { // Fallback for custom ranges or ranges above packages
            for (let level = startLevel; level < targetLevel; level++) {
                if (level < 60) price += 0.25;
                else if (level < 80) price += 0.40;
                else if (level < 90) price += 0.80;
                else price += 1.50;
            }
        }

        this.setState({ levelingPrice: price.toFixed(2) });
    };

    calculateLabPrice = () => {
        let price = 0;
        this.state.selectedLabs.forEach(lab => {
            price += POE_LAB_PRICES[lab] || 0;
        });
        this.setState({ labPrice: price.toFixed(2) });
    };
    
    calculateActPrice = () => {
        const { startAct, targetAct } = this.state;
        let price = 0;
        if (targetAct > startAct) {
            price = (targetAct - startAct) * PRICE_PER_ACT;
        }
        this.setState({ actPrice: price.toFixed(2) });
    };

    handleSelectionChange = (stateKey, e) => {
        const { value, checked } = e.target;
        this.setState(prevState => {
            const currentSelection = prevState[stateKey];
            const newSelection = checked
                ? [...currentSelection, value]
                : currentSelection.filter(item => item !== value);
            return { [stateKey]: newSelection };
        });
    };
    
    handleRangeChange = (type, value) => {
        const numericValue = Number(value);
        this.setState(prevState => {
            const newState = { ...prevState };
            if (type === 'startLevel') {
                if (numericValue < prevState.targetLevel) newState.startLevel = numericValue;
            } else if (type === 'targetLevel') {
                const maxLevel = 95;
                if (numericValue > prevState.startLevel && numericValue <= maxLevel) newState.targetLevel = numericValue;
                else if (numericValue > prevState.startLevel && numericValue > maxLevel) newState.targetLevel = maxLevel;
            } else if (type === 'startAct') {
                if (numericValue < prevState.targetAct) newState.startAct = numericValue;
            } else if (type === 'targetAct') {
                if (numericValue > prevState.startAct) newState.targetAct = numericValue;
            }
            return newState;
        });
    }

    services = [
        { id: 'currencyFarming', name: 'Currency Farming', icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="currentColor" class="w-6 h-6"><path d="M256 0c-17.7 0-32 14.3-32 32V64H160c-35.3 0-64 28.7-64 64v32c0 8.8 7.2 16 16 16H400c8.8 0 16-7.2 16-16V128c0-35.3-28.7-64-64-64H288V32c0-17.7-14.3-32-32-32zM416 224H96c-17.7 0-32 14.3-32 32v64c0 17.7 14.3 32 32 32H416c17.7 0 32-14.3 32-32V256c0-17.7-14.3-32-32-32zM64 384v32c0 35.3 28.7 64 64 64H384c35.3 0 64-28.7 64-64V384H64z"/></svg>` },
        { id: 'powerLeveling', name: 'Power Leveling', icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" fill="currentColor" class="w-6 h-6"><path d="M224 256A128 128 0 1 0 224 0a128 128 0 1 0 0 256zm-45.7 48C79.8 304 0 383.8 0 482.3C0 498.7 13.3 512 29.7 512H418.3c16.4 0 29.7-13.3 29.7-29.7C448 383.8 368.2 304 269.7 304H178.3z"/></svg>` },
        { id: 'actCompletion', name: 'Act Completion', icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512" fill="currentColor" class="w-6 h-6"><path d="M384 480c35.3 0 64-28.7 64-64l0-224c0-35.3-28.7-64-64-64L192 128c-35.3 0-64 28.7-64 64l0 224c0 35.3 28.7 64 64 64l192 0zM192 96c53 0 96 43 96 96l0 224c0 17.7-14.3 32-32 32L192 448c-17.7 0-32-14.3-32-32l0-224c0-53 43-96 96-96z"/></svg>` },
        { id: 'labRuns', name: 'Lab Runs', icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="currentColor" class="w-6 h-6"><path d="M256 0c-17.7 0-32 14.3-32 32V192h-32c-17.7 0-32 14.3-32 32s14.3 32 32 32h32v48c0 17.7 14.3 32 32 32h16c17.7 0 32-14.3 32-32V256h32c17.7 0 32-14.3 32-32s-14.3-32-32-32h-32V32c0-17.7-14.3-32-32-32h-16zM88 288c-17.7 0-32 14.3-32 32v16c0 17.7 14.3 32 32 32h48c17.7 0 32-14.3 32-32V320c0-17.7-14.3-32-32-32H88zm288 0c-17.7 0-32 14.3-32 32v16c0 17.7 14.3 32 32 32h48c17.7 0 32-14.3 32-32V320c0-17.7-14.3-32-32-32h-48zM120 416c-17.7 0-32 14.3-32 32v16c0 17.7 14.3 32 32 32h272c17.7 0 32-14.3 32-32V448c0-17.7-14.3-32-32-32H120z"/></svg>` },
    ];

    renderRequirements = () => {
        const { activeService, playMode } = this.state;
        const tradeRequirement = "To complete the trade, please list a single item (e.g., a rare, corrupted, or fractured item) for the total amount of your currency order.";

        let serviceRequirements = {
            currencyFarming: [tradeRequirement],
            powerLeveling: [],
            actCompletion: [],
            labRuns: [],
        };

        if (['powerLeveling', 'actCompletion', 'labRuns'].includes(activeService)) {
            if (playMode === 'piloted') {
                serviceRequirements[activeService].push('Access to your account is required.');
                serviceRequirements[activeService].push('We will not use any of your currency or items unless requested.');
            } else { // selfPlay
                serviceRequirements[activeService].push('You must be online to join the party and follow the booster.');
            }
        }
        
        if (activeService === 'actCompletion') {
             serviceRequirements.actCompletion.push('Campaign completion will also finish all mandatory side quests.');
        }
        if (activeService === 'labRuns') {
             serviceRequirements.labRuns.push('The character must have completed the trial requirements to access the Labyrinth.');
        }

        let requirements = serviceRequirements[activeService];
        if (!requirements || requirements.length === 0) return null;

        return (
            <div className="mb-8 p-6 card-bg">
                <h3 className="text-2xl font-bold text-white mb-4">Requirements</h3>
                <ul className="list-disc list-inside space-y-2">
                    {requirements.map((req, index) => (
                        <li key={index} className="text-gray-300">{req}</li>
                    ))}
                </ul>
            </div>
        );
    };

    renderPlayModeSelector = () => {
        return (
            <div className="mt-6 pt-6 border-t border-zinc-700">
                <h4 className="text-xl font-bold text-white mb-4">Play Mode</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <button
                        onClick={() => this.setState({ playMode: 'piloted' })}
                        className={`option-button ${this.state.playMode === 'piloted' ? 'active' : ''}`}
                    >
                        Piloted
                    </button>
                    <button
                        onClick={() => this.setState({ playMode: 'selfPlay' })}
                        className={`option-button ${this.state.playMode === 'selfPlay' ? 'active' : ''}`}
                    >
                        Self Play
                    </button>
                </div>
            </div>
        );
    }

    renderServiceContent = () => {
        const { activeService, divineOrbs, chaosOrbs, startLevel, targetLevel, selectedLabs, startAct, targetAct } = this.state;
        switch (activeService) {
            case 'currencyFarming':
                return (
                    <div className="space-y-8">
                        <h3 className="text-4xl font-black text-white">Path of Exile Currency Farming</h3>
                        <p className="text-sm text-gray-400 -mt-4">Choose your desired amount of currency. Any extra loot is yours.</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-4">
                                <div className="flex justify-between items-center text-lg">
                                    <span className="text-gray-400">Divine Orbs:</span>
                                    <span className="font-bold text-white">{divineOrbs.toLocaleString()}</span>
                                </div>
                                <input type="range" min="0" max="100" step="1" value={divineOrbs} onChange={(e) => this.setState({ divineOrbs: Number(e.target.value) })} className="w-full h-2 bg-zinc-700 rounded-lg appearance-none cursor-pointer range-thumb" />
                            </div>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center text-lg">
                                    <span className="text-gray-400">Chaos Orbs:</span>
                                    <span className="font-bold text-white">{chaosOrbs.toLocaleString()}</span>
                                </div>
                                <input type="range" min="0" max="10000" step="100" value={chaosOrbs} onChange={(e) => this.setState({ chaosOrbs: Number(e.target.value) })} className="w-full h-2 bg-zinc-700 rounded-lg appearance-none cursor-pointer range-thumb" />
                            </div>
                        </div>
                    </div>
                );
            case 'powerLeveling':
                return (
                    <div className="space-y-8">
                        <h3 className="text-4xl font-black text-white">Power Leveling</h3>
                        <p className="text-sm text-gray-400 -mt-4">We will level up your character quickly and efficiently.</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                           <div className="space-y-4">
                                <div className="flex justify-between items-center text-lg">
                                    <span className="text-gray-400">Current Level:</span>
                                    <span className="font-bold text-white">{startLevel}</span>
                                </div>
                                <input type="range" min="1" max="94" step="1" value={startLevel} onChange={(e) => this.handleRangeChange('startLevel', e.target.value)} className="w-full h-2 bg-zinc-700 rounded-lg appearance-none cursor-pointer range-thumb" />
                            </div>
                             <div className="space-y-4">
                                <div className="flex justify-between items-center text-lg">
                                    <span className="text-gray-400">Desired Level:</span>
                                    <span className="font-bold text-white">{targetLevel}</span>
                                </div>
                                <input type="range" min="2" max="95" step="1" value={targetLevel} onChange={(e) => this.handleRangeChange('targetLevel', e.target.value)} className="w-full h-2 bg-zinc-700 rounded-lg appearance-none cursor-pointer range-thumb" />
                            </div>
                        </div>
                        {this.renderPlayModeSelector()}
                    </div>
                );
            case 'actCompletion':
                 return (
                    <div className="space-y-8">
                        <h3 className="text-4xl font-black text-white">Campaign Completion</h3>
                        <p className="text-sm text-gray-400 -mt-4">Let us handle the story, so you can get to maps faster.</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                           <div className="space-y-4">
                                <div className="flex justify-between items-center text-lg">
                                    <span className="text-gray-400">Current Act:</span>
                                    <span className="font-bold text-white">{startAct}</span>
                                </div>
                                <input type="range" min="1" max="9" step="1" value={startAct} onChange={(e) => this.handleRangeChange('startAct', e.target.value)} className="w-full h-2 bg-zinc-700 rounded-lg appearance-none cursor-pointer range-thumb" />
                            </div>
                             <div className="space-y-4">
                                <div className="flex justify-between items-center text-lg">
                                    <span className="text-gray-400">Desired Act:</span>
                                    <span className="font-bold text-white">{targetAct}</span>
                                </div>
                                <input type="range" min="2" max="10" step="1" value={targetAct} onChange={(e) => this.handleRangeChange('targetAct', e.target.value)} className="w-full h-2 bg-zinc-700 rounded-lg appearance-none cursor-pointer range-thumb" />
                            </div>
                        </div>
                        {this.renderPlayModeSelector()}
                    </div>
                );
            case 'labRuns':
                 return (
                    <div className="space-y-8">
                        <h3 className="text-4xl font-black text-white">Labyrinth Runs</h3>
                        <p className="text-sm text-gray-400 -mt-4">We guarantee Labyrinth completion for your Ascendancy points.</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {Object.entries(POE_LAB_PRICES).map(([key, price]) => (
                                <label key={key} className="flex items-center justify-between p-4 bg-zinc-900/50 rounded-lg border border-zinc-700 cursor-pointer hover:border-blue-500 transition-colors">
                                    <div>
                                        <span className="font-semibold text-white">{POE_LAB_DISPLAY_NAMES[key]}</span>
                                        <span className="text-purple-400 font-bold ml-2"> +${price.toFixed(2)}</span>
                                    </div>
                                    <input type="checkbox" value={key} onChange={(e) => this.handleSelectionChange('selectedLabs', e)} checked={selectedLabs.includes(key)} style={srOnlyStyle} />
                                    <CustomCheckboxVisual checked={selectedLabs.includes(key)} />
                                </label>
                            ))}
                        </div>
                        {this.renderPlayModeSelector()}
                    </div>
                );
            default:
                return null;
        }
    };

    // Helper functions for unified payment system
    getCurrentService = () => {
        return this.services.find(s => s.id === this.state.activeService)?.name || 'Select Service';
    }

    getCurrentServiceDetails = () => {
        const { activeService, divineOrbs, chaosOrbs, startLevel, targetLevel, startAct, targetAct, playMode, currencyExtras, powerLevelingExtras, actExtras, labExtras } = this.state;
        switch (activeService) {
            case 'currencyFarming': {
                let details = `${divineOrbs} Divine, ${chaosOrbs} Chaos`;
                if (currencyExtras && currencyExtras.length > 0) {
                    const extrasText = currencyExtras.map(extra => 
                        extra.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())
                    ).join(', ');
                    details += ` + ${extrasText}`;
                }
                return details;
            }
            case 'powerLeveling': {
                let details = `Leveling from ${startLevel} to ${targetLevel}`;
                if (playMode) {
                    details += ` (${playMode === 'piloted' ? 'Piloted' : 'Self Play'})`;
                }
                if (powerLevelingExtras && powerLevelingExtras.length > 0) {
                    const extrasText = powerLevelingExtras.map(extra => 
                        extra.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())
                    ).join(', ');
                    details += ` + ${extrasText}`;
                }
                return details;
            }
            case 'actCompletion': {
                let details = `Acts ${startAct} to ${targetAct}`;
                if (playMode) {
                    details += ` (${playMode === 'piloted' ? 'Piloted' : 'Self Play'})`;
                }
                if (actExtras && actExtras.length > 0) {
                    const extrasText = actExtras.map(extra => 
                        extra.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())
                    ).join(', ');
                    details += ` + ${extrasText}`;
                }
                return details;
            }
            case 'labRuns': {
                const { selectedLabs } = this.state;
                let details = 'No Lab Runs Selected';
                if (selectedLabs && selectedLabs.length > 0) {
                    const labNames = selectedLabs.map(labKey => POE_LAB_DISPLAY_NAMES[labKey]).join(', ');
                    details = labNames;
                }
                if (playMode) {
                    details += ` (${playMode === 'piloted' ? 'Piloted' : 'Self Play'})`;
                }
                if (labExtras && labExtras.length > 0) {
                    const extrasText = labExtras.map(extra => 
                        extra.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())
                    ).join(', ');
                    details += ` + ${extrasText}`;
                }
                return details;
            }
            default: 
                return 'Select a Service';
        }
    }

    handlePaymentStart = () => {
        this.setState({ isProcessingPayment: true });
    }

    handlePaymentComplete = () => {
        this.setState({ isProcessingPayment: false });
        // Note: Router navigation would need to be handled differently in class component
        window.location.href = '/orders';
    }

    handlePaymentError = (error) => {
        this.setState({ isProcessingPayment: false });
        console.error('Payment error:', error);
        alert('Payment failed. Please contact support.');
    }



    render() {
        const { activeService } = this.state;
        return (
            <>
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
                        background-image: url('/images/games/pathofexilebackground.png');
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
                    <Modal isOpen={this.state.isModalOpen} onClose={this.closeModal}>
                        <h2 className="text-2xl font-bold text-white mb-4">Confirm Order</h2>
                        <p className="text-gray-300 mb-6">To complete your order, please contact us on Discord with your order details.</p>
                        <button onClick={this.closeModal} className="w-full py-3 px-6 rounded-lg font-semibold text-lg text-white bg-blue-600 hover:bg-blue-700 transition-all duration-300">
                            Got it!
                        </button>
                    </Modal>

                    <section className="py-24 text-center text-white relative hero-section-bg">
                        <div className="hero-overlay"></div>
                        <div className="container mx-auto px-4 relative z-10 flex flex-col items-center justify-center h-full">
                            <h1 className="text-5xl md:text-7xl font-extrabold mb-4 text-glow">Conquer Wraeclast</h1>
                            <p className="text-lg md:text-xl max-w-3xl mx-auto text-gray-300">
                                Professional Path of Exile services to give you the edge. Currency farming, boss carries, and more.
                            </p>
                            <div className="mt-8 start-boost-shape text-white shadow-lg">
                                Start Your Journey
                            </div>
                        </div>
                    </section>

                    <main className="container mx-auto px-4 py-16">
                        <div className="mb-12 flex flex-wrap justify-center gap-4 overflow-x-auto pb-4">
                            {this.services.map(service => (
                                <button 
                                    key={service.id} 
                                    onClick={() => this.setState({ activeService: service.id })}
                                    className={`service-tab ${activeService === service.id ? 'active' : ''}`}
                                >
                                    <span dangerouslySetInnerHTML={{ __html: service.icon }} className="mr-2 text-xl text-blue-300"></span>
                                    <span className="font-semibold text-lg">{service.name}</span>
                                </button>
                            ))}
                        </div>

                        {this.renderRequirements()}

                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                            <div className="lg:col-span-8">
                                <div className="p-8 card-bg">
                                    {this.renderServiceContent()}
                                </div>
                            </div>
                            <aside className="lg:col-span-4">
                                <UnifiedOrderSummary 
                                    gameName="Path of Exile"
                                    serviceName={this.getCurrentService()}
                                    serviceDetails={this.getCurrentServiceDetails()}
                                    price={this.getCurrentPrice()}
                                    onPaymentStart={this.handlePaymentStart}
                                    onPaymentComplete={this.handlePaymentComplete}
                                    onPaymentError={this.handlePaymentError}
                                />
                            </aside>
                        </div>
                    </main>
                </div>
            </>
        );
    }
}

export default PathofExileOffersPage;
