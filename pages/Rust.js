import React, { Component } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useOrders } from '../context/OrdersContext';
import UnifiedOrderSummary from '../components/UnifiedOrderSummary';

// --- Rust Constants ---
const RUST_SCRAP_FARMING_RATE = 5.00; // Price per 1000 scrap
const RUST_HOURLY_RATE = 4.00; // Price per hour

const RUST_COMPONENT_PRICES = {
    gears: 5 / 15,
    pipes: 5 / 40,
    road_signs: 4 / 20,
    sewing_kits: 5 / 40,
    tech_trash: 10 / 10,
    rifle_body: 8 / 5,
    smg_body: 13 / 10,
    cctv_camera: 17 / 10,
    metal_blade: 5 / 20,
    rope: 3 / 50,
    sheet_metal: 4 / 10,
};

const RUST_COMPONENT_DISPLAY_NAMES = {
    gears: 'Gears',
    pipes: 'Pipes',
    road_signs: 'Road Signs',
    sewing_kits: 'Sewing Kits',
    tech_trash: 'Tech Trash',
    rifle_body: 'Rifle Body',
    smg_body: 'SMG Body',
    cctv_camera: 'CCTV Camera',
    metal_blade: 'Metal Blade',
    rope: 'Rope',
    sheet_metal: 'Sheet Metal',
};

const RUST_RESOURCE_RATES = {
    sulfur_ore: { base_amount: 48000, price: 23.00, name: 'Sulfur Ore' },
    metal_ore: { base_amount: 48000, price: 15.00, name: 'Metal Ore' },
    sulfur: { base_amount: 48000, price: 27.00, name: 'Sulfur' },
    metal_fragments: { base_amount: 48000, price: 30.00, name: 'Metal Fragments' },
    stone: { base_amount: 48000, price: 7.00, name: 'Stone' },
    wood: { base_amount: 48000, price: 5.00, name: 'Wood' },
    hq_metal: { base_amount: 150, price: 6.00, name: 'High Quality Metal' },
    low_grade_fuel: { base_amount: 1000, price: 5.00, name: 'Low Grade Fuel' },
    cloth: { base_amount: 2000, price: 6.00, name: 'Cloth' },
};

const RUST_RAID_PRICES = {
    '2x2_stone': 30.00,
    '2x2_metal': 50.00,
    'medium_compound': 80.00,
    'zerg_base': 150.00,
};

const RUST_RAID_DISPLAY_NAMES = {
    '2x2_stone': '2x2 Stone Base',
    '2x2_metal': '2x2 Metal Base',
    'medium_compound': 'Medium Compound',
    'zerg_base': 'Zerg Base',
};

const RUST_WEAPON_PRICES = {
    assault_rifle: 7.00,
    bolt_action_rifle: 7.00,
    high_caliber_revolver: 6.00,
    custom_smg: 5.00,
    double_barrel_shotgun: 3.00,
    l96_rifle: 30.00,
    lr_300: 7.00,
    m39: 7.00,
    m92_pistol: 4.00,
    mp5: 7.00,
    python_revolver: 5.00,
    rocket_launcher: 20.00,
    semi_auto_rifle: 5.00,
    semi_auto_pistol: 3.00,
    spas12_shotgun: 8.00,
    thompson: 6.00,
};

const RUST_WEAPON_DISPLAY_NAMES = {
    assault_rifle: 'Assault Rifle',
    bolt_action_rifle: 'Bolt Action Rifle',
    high_caliber_revolver: 'High Caliber Revolver',
    custom_smg: 'Custom SMG',
    double_barrel_shotgun: 'Double Barrel Shotgun',
    l96_rifle: 'L96 Rifle',
    lr_300: 'LR-300',
    m39: 'M39',
    m92_pistol: 'M92 Pistol',
    mp5: 'MP5',
    python_revolver: 'Python Revolver',
    rocket_launcher: 'Rocket Launcher',
    semi_auto_rifle: 'Semi-Automatic Rifle',
    semi_auto_pistol: 'Semi-Automatic Pistol',
    spas12_shotgun: 'SPAS-12 Shotgun',
    thompson: 'Thompson',
};

const RUST_BASE_PACKAGES = {
    starter_t1: { name: 'Starter Base Tier 1', price: 10.00, description: 'LvL 1 Workbench, 2 Furnaces, 2 Large Boxes, Sleeping Bag, 2 Metal Doors' },
    starter_t2: { name: 'Starter Base Tier 2', price: 19.00, description: 'LvL 2 Workbench, 2 Furnaces, 4 Large Boxes, 3 Sheet Metal Double Doors, 2 Metal Doors' },
    starter_t3: { name: 'Starter Base Tier 3', price: 35.00, description: 'LvL 3 Workbench, Hidden Shotgun Trap, 4 Garage Doors, 4 Large Boxes, 3 Furnaces' },
    bunker: { name: 'Bunker Base', price: 20.00, description: 'A compact, highly-defensible bunker base design.' },
};

const initialState = {
    activeService: 'scrapFarming',
    scrapAmount: 1000,
    scrapPrice: '5.00',
    serverType: 'normal',
    componentAmounts: Object.keys(RUST_COMPONENT_PRICES).reduce((acc, key) => ({ ...acc, [key]: 0 }), {}),
    componentPrice: '0.00',
    selectedRaids: [],
    raidPrice: '0.00',
    resourceAmounts: Object.keys(RUST_RESOURCE_RATES).reduce((acc, key) => ({ ...acc, [key]: 0 }), {}),
    resourcePrice: '0.00',
    rustHours: 1,
    rustHourlyPrice: '4.00',
    fortificationHours: 1,
    fortificationPrice: '4.00',
    selectedBases: [],
    baseBuildingPrice: '0.00',
    weaponAmounts: Object.keys(RUST_WEAPON_PRICES).reduce((acc, key) => ({ ...acc, [key]: 0 }), {}),
    weaponPrice: '0.00',
    isProcessingPayment: false,
    isModalOpen: false,
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

class RustOffersPage extends Component {
    constructor(props) {
        super(props);
        this.state = { ...initialState };
    }

    componentDidMount() {
        this.calculateAllPrices();
    }

    componentDidUpdate(prevProps, prevState) {
        if (
            prevState.scrapAmount !== this.state.scrapAmount ||
            prevState.componentAmounts !== this.state.componentAmounts ||
            prevState.selectedRaids !== this.state.selectedRaids ||
            prevState.resourceAmounts !== this.state.resourceAmounts ||
            prevState.rustHours !== this.state.rustHours ||
            prevState.fortificationHours !== this.state.fortificationHours ||
            prevState.selectedBases !== this.state.selectedBases ||
            prevState.weaponAmounts !== this.state.weaponAmounts
        ) {
            this.calculateAllPrices();
        }
    }
    
    resetState = () => {
        this.setState({ ...initialState });
    }



    getCurrentPrice = () => {
        const { activeService, scrapPrice, componentPrice, raidPrice, resourcePrice, rustHourlyPrice, fortificationPrice, baseBuildingPrice, weaponPrice } = this.state;
        switch (activeService) {
            case 'scrapFarming': return scrapPrice;
            case 'componentFarming': return componentPrice;
            case 'resourceFarming': return resourcePrice;
            case 'baseBuilding': return baseBuildingPrice;
            case 'baseFortification': return fortificationPrice;
            case 'weaponKits': return weaponPrice;
            case 'rustHourly': return rustHourlyPrice;
            case 'raiding': return raidPrice;
            default: return '0.00';
        }
    }

    openModal = () => this.setState({ isModalOpen: true });
    closeModal = () => this.setState({ isModalOpen: false });

    calculateAllPrices = () => {
        this.calculateScrapPrice();
        this.calculateComponentPrice();
        this.calculateRaidPrice();
        this.calculateResourcePrice();
        this.calculateHourlyPrice();
        this.calculateFortificationPrice();
        this.calculateBaseBuildingPrice();
        this.calculateWeaponPrice();
    };

    calculateScrapPrice = () => {
        const { scrapAmount } = this.state;
        this.setState({
            scrapPrice: ((scrapAmount / 1000) * RUST_SCRAP_FARMING_RATE).toFixed(2)
        });
    };

    calculateComponentPrice = () => {
        let price = 0;
        for (const [component, quantity] of Object.entries(this.state.componentAmounts)) {
            price += quantity * (RUST_COMPONENT_PRICES[component] || 0);
        }
        this.setState({ componentPrice: price.toFixed(2) });
    };
    
    calculateRaidPrice = () => {
        let price = 0;
        this.state.selectedRaids.forEach(raid => {
            price += RUST_RAID_PRICES[raid] || 0;
        });
        this.setState({ raidPrice: price.toFixed(2) });
    };

    calculateResourcePrice = () => {
        let price = 0;
        for (const [resource, amount] of Object.entries(this.state.resourceAmounts)) {
            const rate = RUST_RESOURCE_RATES[resource];
            if (rate) {
                price += (amount / rate.base_amount) * rate.price;
            }
        }
        this.setState({ resourcePrice: price.toFixed(2) });
    };

    calculateHourlyPrice = () => {
        const { rustHours } = this.state;
        this.setState({ rustHourlyPrice: (rustHours * RUST_HOURLY_RATE).toFixed(2) });
    };

    calculateFortificationPrice = () => {
        const { fortificationHours } = this.state;
        this.setState({ fortificationPrice: (fortificationHours * RUST_HOURLY_RATE).toFixed(2) });
    };

    calculateBaseBuildingPrice = () => {
        let price = 0;
        this.state.selectedBases.forEach(base => {
            price += RUST_BASE_PACKAGES[base]?.price || 0;
        });
        this.setState({ baseBuildingPrice: price.toFixed(2) });
    };

    calculateWeaponPrice = () => {
        let price = 0;
        for (const [weapon, quantity] of Object.entries(this.state.weaponAmounts)) {
            price += quantity * (RUST_WEAPON_PRICES[weapon] || 0);
        }
        this.setState({ weaponPrice: price.toFixed(2) });
    };

    handleExtraChange = (stateKey, e) => {
        const { value, checked } = e.target;
        this.setState(prevState => {
            const currentExtras = prevState[stateKey];
            const newExtras = checked
                ? [...currentExtras, value]
                : currentExtras.filter(item => item !== value);
            return { [stateKey]: newExtras };
        });
    };

    handleComponentQuantityChange = (component, value) => {
        this.setState(prevState => ({
            componentAmounts: {
                ...prevState.componentAmounts,
                [component]: Number(value)
            }
        }));
    };

    handleResourceAmountChange = (resource, value) => {
        this.setState(prevState => ({
            resourceAmounts: {
                ...prevState.resourceAmounts,
                [resource]: Number(value)
            }
        }));
    };

    handleWeaponAmountChange = (weapon, value) => {
        this.setState(prevState => ({
            weaponAmounts: {
                ...prevState.weaponAmounts,
                [weapon]: Number(value)
            }
        }));
    };

    services = [
        { id: 'scrapFarming', name: 'Scrap Farming', icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="currentColor" class="w-6 h-6"><path d="M512 256c0 .9 0 1.8 0 2.7c-.4 36.5-32.3 65.3-68.8 65.3H320v-128h123.2c36.5 0 68.4 28.8 68.8 65.3zM256 0c-17.7 0-32 14.3-32 32V480c0 17.7 14.3 32 32 32s32-14.3 32-32V32c0-17.7-14.3-32-32-32zM192 192H68.8C32.3 192 0 220.8 0 257.3c0 .9 0 1.8 0 2.7c.4 36.5 32.3 65.3 68.8 65.3H192V192z"/></svg>` },
        { id: 'componentFarming', name: 'Component Farming', icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="currentColor" class="w-6 h-6"><path d="M192 160h-48c-17.7 0-32 14.3-32 32s14.3 32 32 32h48c17.7 0 32-14.3 32-32s-14.3-32-32-32zm48 112h-48c-17.7 0-32 14.3-32 32s14.3 32 32 32h48c17.7 0 32-14.3 32-32s-14.3-32-32-32zM320 160h48c17.7 0 32 14.3 32 32s-14.3 32-32 32h-48c-17.7 0-32-14.3-32-32s14.3-32 32-32zm-48 112h48c17.7 0 32 14.3 32 32s-14.3 32-32 32h-48c-17.7 0-32-14.3-32-32s14.3-32 32-32zM256 0C114.6 0 0 114.6 0 256s114.6 256 256 256s256-114.6 256-256S397.4 0 256 0zm0 448c-106 0-192-86-192-192S150 64 256 64s192 86 192 192s-86 192-192 192z"/></svg>` },
        { id: 'resourceFarming', name: 'Resource Farming', icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="currentColor" class="w-6 h-6"><path d="M128 128c0-53 43-96 96-96s96 43 96 96s-43 96-96 96s-96-43-96-96zM384 128c0-53 43-96 96-96s96 43 96 96s-43 96-96 96s-96-43-96-96zM128 384c0-53 43-96 96-96s96 43 96 96s-43 96-96 96s-96-43-96-96zm256 0c0-53 43-96 96-96s96 43 96 96s-43 96-96 96s-96-43-96-96z"/></svg>` },
        { id: 'baseBuilding', name: 'Base Building', icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512" fill="currentColor" class="w-6 h-6"><path d="M575.8 255.5c0 18-15 32.1-32 32.1h-32l.7 160.2c0 2.7-.2 5.4-.5 8.1V472c0 22.1-17.9 40-40 40H456c-1.1 0-2.2 0-3.3-.1c-1.4 .1-2.8 .1-4.2 .1H128.1c-1.5 0-3-.1-4.5-.2c-1.2 .1-2.4 .2-3.6 .2H120c-22.1 0-40-17.9-40-40V448 384c0-2.7.2-5.4.5-8.1l.7-160.2h-32c-18 0-32-14-32-32.1c0-9 3-17 10-24L266.4 8c7-7 15-8 22-8s15 2 21 7L564.8 231.5c8 7 12 15 11 24zM352 224a32 32 0 1 0 -64 0 32 32 0 1 0 64 0zM256 320a32 32 0 1 0 0-64 32 32 0 1 0 0 64z"/></svg>` },
        { id: 'baseFortification', name: 'Base Fortification', icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="currentColor" class="w-6 h-6"><path d="M256 0c4.6 0 9.2 1 13.4 2.9L457.7 82.8c22 9.3 38.4 31 38.3 57.2c-.5 99.2-41.3 280.7-213.6 363.2c-16.7 8-36.1 8-52.8 0C57.3 420.7 16.5 239.2 16 140c-.1-26.2 16.3-47.9 38.3-57.2L242.7 2.9C246.8 1 251.4 0 256 0zm0 64L64 128v14.2c.5 73.6 34.5 220 186.7 297.5c6.5 3.1 13.5 3.1 20 0C413.5 362.2 447.5 215.8 448 142.2V128L256 64z"/></svg>` },
        { id: 'weaponKits', name: 'Weapon Kits', icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512" fill="currentColor" class="w-6 h-6"><path d="M528 56c0-13.3-10.7-24-24-24H392c-13.3 0-24 10.7-24 24s10.7 24 24 24h4.3l-62.1 62.1c-42.3-24.3-94.1-24.3-136.4 0L135.7 80H140c13.3 0 24-10.7 24-24s-10.7-24-24-24H24C10.7 32 0 42.7 0 56v48c0 13.3 10.7 24 24 24h48c13.3 0 24-10.7 24-24V83.7l62.1 62.1c-24.3 42.3-24.3 94.1 0 136.4L80 344.3V340c0-13.3-10.7-24-24-24s-24 10.7-24 24v48c0 13.3 10.7 24 24 24h116c13.3 0 24-10.7 24-24s-10.7-24-24-24h-4.3l62.1-62.1c42.3 24.3 94.1 24.3 136.4 0l62.1 62.1H340c-13.3 0-24 10.7-24 24s10.7 24 24 24h164c13.3 0 24-10.7 24-24V340c0-13.3-10.7-24-24-24H460c-13.3 0-24 10.7-24 24v4.3l-62.1-62.1c24.3-42.3 24.3-94.1 0-136.4l62.1-62.1H460c13.3 0 24-10.7 24-24s-10.7-24-24-24h-48c-13.3 0-24 10.7-24 24v20.3l-62.1 62.1c-42.3-24.3-94.1-24.3-136.4 0L151.7 156.3V140c0-13.3-10.7-24-24-24s-24 10.7-24 24v48c0 13.3 10.7 24 24 24h20.3l62.1 62.1c24.3-42.3 24.3-94.1 0-136.4L135.7 104H140c13.3 0 24-10.7 24-24z"/></svg>` },
        { id: 'rustHourly', name: 'Rust Hourly', icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="currentColor" class="w-6 h-6"><path d="M256 0a256 256 0 1 1 0 512A256 256 0 1 1 256 0zM232 120V256c0 8 4 15.5 10.7 20l96 64c11 7.4 25.9 4.4 33.3-6.7s4.4-25.9-6.7-33.3L280 243.2V120c0-13.3-10.7-24-24-24s-24 10.7-24 24z"/></svg>` },
        { id: 'raiding', name: 'Raiding', icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="currentColor" class="w-6 h-6"><path d="M256 0c-17.7 0-32 14.3-32 32V66.7C117.2 87.1 32 193.3 32 320c0 79.1 40.2 149.1 100.2 187.5c-12.7 23.3-11.1 51.4 4.6 72.6c15.7 21.2 43 29.8 68.2 20.2c25.2-9.6 42.4-34.1 42.4-61.2c0-37.7-30.3-68.8-68-68.8c-7.9 0-15.5 1.4-22.7 3.9C198.8 446.1 226.1 448 256 448c123.7 0 224-100.3 224-224S379.7 0 256 0zm0 64c88.4 0 160 71.6 160 160s-71.6 160-160 160S96 312.4 96 224S167.6 64 256 64z"/></svg>` },
    ];

    renderRequirements = () => {
        const { activeService } = this.state;

        const RUST_SERVICE_REQUIREMENTS = {
            scrapFarming: ['Server access and a safe place to store scrap (e.g., a base).'],
            componentFarming: ['Server access and a secure base with storage.'],
            resourceFarming: ['Server access and toolsets (can be provided for an extra fee).', 'A secure base for resource drop-off.'],
            baseBuilding: ['Server access.', 'A clear spot to build.', 'Please specify the desired build location on the map.'],
            baseFortification: ['Server access.', 'A base to fortify.'],
            weaponKits: ['Server access and a secure place to receive the items.'],
            rustHourly: ['Server access.', 'A clear goal for the hourly session (e.g., building, farming, roaming).'],
            raiding: ['Server access.', 'Explosives and raiding tools must be provided by the client.', 'Clear target identification (base location/owner).'],
        };

        let requirements = RUST_SERVICE_REQUIREMENTS[activeService];
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

    renderServiceContent = () => {
        const { activeService, scrapAmount, serverType, componentAmounts, selectedRaids, resourceAmounts, rustHours, fortificationHours, weaponAmounts, selectedBases } = this.state;
        switch (activeService) {
            case 'scrapFarming':
                return (
                    <div className="space-y-8">
                        <h3 className="text-4xl font-black text-white">Rust Scrap Farming</h3>
                        <p className="text-sm text-gray-400 -mt-4">Any extra items we find during farming are yours to keep.</p>
                        <div>
                            <h4 className="text-xl font-bold text-white mb-4">Select Server Type</h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <button
                                    onClick={() => this.setState({ serverType: 'normal' })}
                                    className={`option-button ${serverType === 'normal' ? 'active' : ''}`}
                                >
                                    Normal Server
                                </button>
                                <button
                                    onClick={() => this.setState({ serverType: 'premium' })}
                                    className={`option-button ${serverType === 'premium' ? 'active' : ''}`}
                                >
                                    Premium Server
                                </button>
                            </div>
                        </div>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center text-lg">
                                <span className="text-gray-400">Scrap Amount:</span>
                                <span className="font-bold text-white">{scrapAmount.toLocaleString()}</span>
                            </div>
                            <input 
                                type="range" 
                                min="1000" 
                                max="20000" 
                                step="1000"
                                value={scrapAmount} 
                                onChange={(e) => this.setState({ scrapAmount: Number(e.target.value) })} 
                                className="w-full h-2 bg-zinc-700 rounded-lg appearance-none cursor-pointer range-thumb" 
                            />
                        </div>
                    </div>
                );
            case 'componentFarming':
                return (
                    <div className="space-y-8">
                        <h3 className="text-4xl font-black text-white">Component Farming</h3>
                        <p className="text-sm text-gray-400 -mt-4">Select the quantity for each component. Any extra items we find are yours to keep.</p>
                        <div>
                            <h4 className="text-xl font-bold text-white mb-4">Select Server Type</h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <button
                                    onClick={() => this.setState({ serverType: 'normal' })}
                                    className={`option-button ${serverType === 'normal' ? 'active' : ''}`}
                                >
                                    Normal Server
                                </button>
                                <button
                                    onClick={() => this.setState({ serverType: 'premium' })}
                                    className={`option-button ${serverType === 'premium' ? 'active' : ''}`}
                                >
                                    Premium Server
                                </button>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {Object.keys(RUST_COMPONENT_DISPLAY_NAMES).map(key => (
                                <div key={key} className="space-y-4">
                                    <div className="flex justify-between items-center text-lg">
                                        <span className="text-gray-400">{RUST_COMPONENT_DISPLAY_NAMES[key]} (+${RUST_COMPONENT_PRICES[key].toFixed(2)} each):</span>
                                        <span className="font-bold text-white">{componentAmounts[key]}</span>
                                    </div>
                                    <input 
                                        type="range" 
                                        min="0" 
                                        max="100"
                                        step="1"
                                        value={componentAmounts[key]} 
                                        onChange={(e) => this.handleComponentQuantityChange(key, e.target.value)} 
                                        className="w-full h-2 bg-zinc-700 rounded-lg appearance-none cursor-pointer range-thumb" 
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                );
            case 'resourceFarming':
                return (
                    <div className="space-y-8">
                        <h3 className="text-4xl font-black text-white">Resource Farming</h3>
                        <p className="text-sm text-gray-400 -mt-4">Any extra items we find during farming are yours to keep.</p>
                        <div>
                            <h4 className="text-xl font-bold text-white mb-4">Select Server Type</h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <button
                                    onClick={() => this.setState({ serverType: 'normal' })}
                                    className={`option-button ${serverType === 'normal' ? 'active' : ''}`}
                                >
                                    Normal Server
                                </button>
                                <button
                                    onClick={() => this.setState({ serverType: 'premium' })}
                                    className={`option-button ${serverType === 'premium' ? 'active' : ''}`}
                                >
                                    Premium Server
                                </button>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                           {Object.entries(RUST_RESOURCE_RATES).map(([key, { name, base_amount }]) => (
                                <div key={key} className="space-y-4">
                                    <div className="flex justify-between items-center text-lg">
                                        <span className="text-gray-400">{name}:</span>
                                        <span className="font-bold text-white">{resourceAmounts[key].toLocaleString()}</span>
                                    </div>
                                    <input 
                                        type="range" 
                                        min="0" 
                                        max={base_amount * 5}
                                        step={Math.max(1, Math.round(base_amount / 100))}
                                        value={resourceAmounts[key]} 
                                        onChange={(e) => this.handleResourceAmountChange(key, e.target.value)} 
                                        className="w-full h-2 bg-zinc-700 rounded-lg appearance-none cursor-pointer range-thumb" 
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                );
            case 'baseBuilding':
                 return (
                    <div className="space-y-8">
                        <h3 className="text-4xl font-black text-white">Base Building</h3>
                        <p className="text-sm text-gray-400 -mt-4">Any extra loot is yours.</p>
                        <div>
                            <h4 className="text-xl font-bold text-white mb-4">Select Server Type</h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <button
                                    onClick={() => this.setState({ serverType: 'normal' })}
                                    className={`option-button ${serverType === 'normal' ? 'active' : ''}`}
                                >
                                    Normal Server
                                </button>
                                <button
                                    onClick={() => this.setState({ serverType: 'premium' })}
                                    className={`option-button ${serverType === 'premium' ? 'active' : ''}`}
                                >
                                    Premium Server
                                </button>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {Object.entries(RUST_BASE_PACKAGES).map(([key, { name, price, description }]) => (
                                <label key={key} className="flex flex-col p-4 bg-zinc-900/50 rounded-lg border border-zinc-700 cursor-pointer hover:border-blue-500 transition-colors">
                                    <div className="flex items-center justify-between">
                                        <span className="font-semibold text-white">{name}</span>
                                        <span className="text-purple-400 font-bold ml-2"> +${price.toFixed(2)}</span>
                                    </div>
                                    <p className="text-sm text-gray-400 mt-2">{description}</p>
                                    <div className="mt-auto pt-4">
                                         <input type="checkbox" value={key} onChange={(e) => this.handleExtraChange('selectedBases', e)} checked={selectedBases.includes(key)} style={srOnlyStyle} />
                                         <CustomCheckboxVisual checked={selectedBases.includes(key)} />
                                    </div>
                                </label>
                            ))}
                        </div>
                    </div>
                );
            case 'baseFortification':
                return (
                    <div className="space-y-8">
                        <h3 className="text-4xl font-black text-white">Base Fortification</h3>
                        <p className="text-sm text-gray-400 -mt-4">We will spend the purchased time fortifying your base. Any extra items are yours.</p>
                        <div>
                            <h4 className="text-xl font-bold text-white mb-4">Select Server Type</h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <button
                                    onClick={() => this.setState({ serverType: 'normal' })}
                                    className={`option-button ${serverType === 'normal' ? 'active' : ''}`}
                                >
                                    Normal Server
                                </button>
                                <button
                                    onClick={() => this.setState({ serverType: 'premium' })}
                                    className={`option-button ${serverType === 'premium' ? 'active' : ''}`}
                                >
                                    Premium Server
                                </button>
                            </div>
                        </div>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center text-lg">
                                <span className="text-gray-400">Number of Hours:</span>
                                <span className="font-bold text-white">{fortificationHours}</span>
                            </div>
                            <input 
                                type="range" 
                                min="1" 
                                max="24" 
                                step="1"
                                value={fortificationHours} 
                                onChange={(e) => this.setState({ fortificationHours: Number(e.target.value) })} 
                                className="w-full h-2 bg-zinc-700 rounded-lg appearance-none cursor-pointer range-thumb" 
                            />
                        </div>
                    </div>
                );
            case 'weaponKits':
                return (
                    <div className="space-y-8">
                        <h3 className="text-4xl font-black text-white">Weapon Kits</h3>
                        <p className="text-sm text-gray-400 -mt-4">Select your desired weapons. Comes with a full stack of ammo.</p>
                        <div>
                            <h4 className="text-xl font-bold text-white mb-4">Select Server Type</h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <button
                                    onClick={() => this.setState({ serverType: 'normal' })}
                                    className={`option-button ${serverType === 'normal' ? 'active' : ''}`}
                                >
                                    Normal Server
                                </button>
                                <button
                                    onClick={() => this.setState({ serverType: 'premium' })}
                                    className={`option-button ${serverType === 'premium' ? 'active' : ''}`}
                                >
                                    Premium Server
                                </button>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {Object.keys(RUST_WEAPON_DISPLAY_NAMES).map(key => (
                                <div key={key} className="space-y-4">
                                    <div className="flex justify-between items-center text-lg">
                                        <span className="text-gray-400">{RUST_WEAPON_DISPLAY_NAMES[key]} (+${RUST_WEAPON_PRICES[key].toFixed(2)} each):</span>
                                        <span className="font-bold text-white">{weaponAmounts[key]}</span>
                                    </div>
                                    <input 
                                        type="range" 
                                        min="0" 
                                        max="10"
                                        step="1"
                                        value={weaponAmounts[key]} 
                                        onChange={(e) => this.handleWeaponAmountChange(key, e.target.value)} 
                                        className="w-full h-2 bg-zinc-700 rounded-lg appearance-none cursor-pointer range-thumb" 
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                );
            case 'rustHourly':
                return (
                    <div className="space-y-8">
                        <h3 className="text-4xl font-black text-white">Rust Hourly Service</h3>
                        <p className="text-sm text-gray-400 -mt-4">Any extra items we find during the session are yours to keep.</p>
                        <div>
                            <h4 className="text-xl font-bold text-white mb-4">Select Server Type</h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <button
                                    onClick={() => this.setState({ serverType: 'normal' })}
                                    className={`option-button ${serverType === 'normal' ? 'active' : ''}`}
                                >
                                    Normal Server
                                </button>
                                <button
                                    onClick={() => this.setState({ serverType: 'premium' })}
                                    className={`option-button ${serverType === 'premium' ? 'active' : ''}`}
                                >
                                    Premium Server
                                </button>
                            </div>
                        </div>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center text-lg">
                                <span className="text-gray-400">Number of Hours:</span>
                                <span className="font-bold text-white">{rustHours}</span>
                            </div>
                            <input 
                                type="range" 
                                min="1" 
                                max="24" 
                                step="1"
                                value={rustHours} 
                                onChange={(e) => this.setState({ rustHours: Number(e.target.value) })} 
                                className="w-full h-2 bg-zinc-700 rounded-lg appearance-none cursor-pointer range-thumb" 
                            />
                        </div>
                    </div>
                );
            case 'raiding':
                return (
                    <div className="space-y-8">
                        <h3 className="text-4xl font-black text-white">Raiding Services</h3>
                        <p className="text-sm text-gray-400 -mt-4">You provide the boom, we do the work. Any extra loot is yours to keep.</p>
                        <div>
                            <h4 className="text-xl font-bold text-white mb-4">Select Server Type</h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <button
                                    onClick={() => this.setState({ serverType: 'normal' })}
                                    className={`option-button ${serverType === 'normal' ? 'active' : ''}`}
                                >
                                    Normal Server
                                </button>
                                <button
                                    onClick={() => this.setState({ serverType: 'premium' })}
                                    className={`option-button ${serverType === 'premium' ? 'active' : ''}`}
                                >
                                    Premium Server
                                </button>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {Object.entries(RUST_RAID_PRICES).map(([key, price]) => (
                                <label key={key} className="flex items-center justify-between p-4 bg-zinc-900/50 rounded-lg border border-zinc-700 cursor-pointer hover:border-blue-500 transition-colors">
                                    <div>
                                        <span className="font-semibold text-white">{RUST_RAID_DISPLAY_NAMES[key]}</span>
                                        <span className="text-purple-400 font-bold ml-2"> +${price.toFixed(2)}</span>
                                    </div>
                                    <input type="checkbox" value={key} onChange={(e) => this.handleExtraChange('selectedRaids', e)} checked={selectedRaids.includes(key)} style={srOnlyStyle} />
                                    <CustomCheckboxVisual checked={selectedRaids.includes(key)} />
                                </label>
                            ))}
                        </div>
                    </div>
                );
            default:
                return null;
        }
    };

    // Helper functions for unified payment system
    getCurrentPrice = () => {
        const { activeService, scrapPrice, componentPrice, raidPrice, resourcePrice, rustHourlyPrice, fortificationPrice, baseBuildingPrice, weaponPrice } = this.state;
        switch (activeService) {
            case 'scrapFarming': return scrapPrice;
            case 'componentFarming': return componentPrice;
            case 'resourceFarming': return resourcePrice;
            case 'baseBuilding': return baseBuildingPrice;
            case 'baseFortification': return fortificationPrice;
            case 'weaponKits': return weaponPrice;
            case 'rustHourly': return rustHourlyPrice;
            case 'raiding': return raidPrice;
            default: return '0.00';
        }
    }

    getCurrentService = () => {
        return this.services.find(s => s.id === this.state.activeService)?.name || 'Select Service';
    }

    getCurrentServiceDetails = () => {
        const { activeService, scrapAmount, rustHours, fortificationHours, serverType, scrapExtras, componentExtras, resourceExtras, baseExtras, fortificationExtras, weaponExtras, hourlyExtras, raidExtras } = this.state;
        switch (activeService) {
            case 'scrapFarming': {
                let details = `${scrapAmount.toLocaleString()} Scrap (${serverType === 'normal' ? 'Normal' : 'Premium'} Server)`;
                if (scrapExtras && scrapExtras.length > 0) {
                    const extrasText = scrapExtras.map(extra => 
                        extra.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())
                    ).join(', ');
                    details += ` + ${extrasText}`;
                }
                return details;
            }
            case 'componentFarming': {
                const selectedComponents = Object.entries(this.state.componentAmounts)
                    .filter(([key, amount]) => amount > 0)
                    .map(([key, amount]) => `${RUST_COMPONENT_DISPLAY_NAMES[key]} (${amount})`)
                    .join(', ');
                let details = (selectedComponents || 'No Components Selected') + ` (${serverType === 'normal' ? 'Normal' : 'Premium'} Server)`;
                if (componentExtras && componentExtras.length > 0) {
                    const extrasText = componentExtras.map(extra => 
                        extra.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())
                    ).join(', ');
                    details += ` + ${extrasText}`;
                }
                return details;
            }
            case 'resourceFarming': {
                const selectedResources = Object.entries(this.state.resourceAmounts)
                    .filter(([key, amount]) => amount > 0)
                    .map(([key, amount]) => `${RUST_RESOURCE_RATES[key].name} (${amount.toLocaleString()})`)
                    .join(', ');
                let details = (selectedResources || 'No Resources Selected') + ` (${serverType === 'normal' ? 'Normal' : 'Premium'} Server)`;
                if (resourceExtras && resourceExtras.length > 0) {
                    const extrasText = resourceExtras.map(extra => 
                        extra.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())
                    ).join(', ');
                    details += ` + ${extrasText}`;
                }
                return details;
            }
            case 'baseBuilding': {
                const selectedBasesText = this.state.selectedBases.length > 0 
                    ? this.state.selectedBases.map(baseKey => RUST_BASE_PACKAGES[baseKey].name).join(', ')
                    : 'No Bases Selected';
                let details = selectedBasesText + ` (${serverType === 'normal' ? 'Normal' : 'Premium'} Server)`;
                if (baseExtras && baseExtras.length > 0) {
                    const extrasText = baseExtras.map(extra => 
                        extra.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())
                    ).join(', ');
                    details += ` + ${extrasText}`;
                }
                return details;
            }
            case 'baseFortification': {
                let details = `${fortificationHours} Hour(s) of Fortification (${serverType === 'normal' ? 'Normal' : 'Premium'} Server)`;
                if (fortificationExtras && fortificationExtras.length > 0) {
                    const extrasText = fortificationExtras.map(extra => 
                        extra.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())
                    ).join(', ');
                    details += ` + ${extrasText}`;
                }
                return details;
            }
            case 'weaponKits': {
                const selectedWeapons = Object.entries(this.state.weaponAmounts)
                    .filter(([key, amount]) => amount > 0)
                    .map(([key, amount]) => `${RUST_WEAPON_DISPLAY_NAMES[key]} (${amount})`)
                    .join(', ');
                let details = (selectedWeapons || 'No Weapons Selected') + ` (${serverType === 'normal' ? 'Normal' : 'Premium'} Server)`;
                if (weaponExtras && weaponExtras.length > 0) {
                    const extrasText = weaponExtras.map(extra => 
                        extra.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())
                    ).join(', ');
                    details += ` + ${extrasText}`;
                }
                return details;
            }
            case 'rustHourly': {
                let details = `${rustHours} Hour(s) of Service (${serverType === 'normal' ? 'Normal' : 'Premium'} Server)`;
                if (hourlyExtras && hourlyExtras.length > 0) {
                    const extrasText = hourlyExtras.map(extra => 
                        extra.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())
                    ).join(', ');
                    details += ` + ${extrasText}`;
                }
                return details;
            }
            case 'raiding': {
                const selectedRaidsText = this.state.selectedRaids.length > 0
                    ? this.state.selectedRaids.map(raidKey => RUST_RAID_DISPLAY_NAMES[raidKey]).join(', ')
                    : 'No Raids Selected';
                let details = selectedRaidsText + ` (${serverType === 'normal' ? 'Normal' : 'Premium'} Server)`;
                if (raidExtras && raidExtras.length > 0) {
                    const extrasText = raidExtras.map(extra => 
                        extra.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())
                    ).join(', ');
                    details += ` + ${extrasText}`;
                }
                return details;
            }
            default: return 'Select Service';
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

    PriceDisplay = () => {
        return (
            <div>
                <UnifiedOrderSummary
                    gameName="Rust"
                    serviceName={this.getCurrentService()}
                    serviceDetails={this.getCurrentServiceDetails()}
                    price={this.getCurrentPrice()}
                    onPaymentStart={this.handlePaymentStart}
                    onPaymentComplete={this.handlePaymentComplete}
                    onPaymentError={this.handlePaymentError}
                    isProcessing={this.state.isProcessingPayment}
                />
                <button 
                    onClick={this.resetState}
                    className="w-full mt-4 py-3 px-6 rounded-lg font-semibold text-lg text-gray-300 bg-zinc-700 hover:bg-zinc-600 transition-all duration-300">
                    Reset
                </button>
            </div>
        )
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
                        background-image: url('/images/games/rustbackground.png');
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
                        <h2 className="text-2xl font-bold text-white mb-4">Custom Order</h2>
                        <p className="text-gray-300 mb-6">To order custom weapon kits, please contact us on Discord with your selected items.</p>
                        <button onClick={this.closeModal} className="w-full py-3 px-6 rounded-lg font-semibold text-lg text-white bg-blue-600 hover:bg-blue-700 transition-all duration-300">
                            Got it!
                        </button>
                    </Modal>

                    <section className="py-24 text-center text-white relative hero-section-bg">
                        <div className="hero-overlay"></div>
                        <div className="container mx-auto px-4 relative z-10 flex flex-col items-center justify-center h-full">
                            <h1 className="text-5xl md:text-7xl font-extrabold mb-4 text-glow">Dominate the Island</h1>
                            <p className="text-lg md:text-xl max-w-3xl mx-auto text-gray-300">
                                Professional Rust services to give you the edge. Farming, raiding, and more.
                            </p>
                            <div className="mt-8 start-boost-shape text-white shadow-lg">
                                Start Your Wipe
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
                                <this.PriceDisplay onContactUsClick={this.openModal} />
                            </aside>
                        </div>
                    </main>
                </div>
            </>
        );
    }
}

export default RustOffersPage;
