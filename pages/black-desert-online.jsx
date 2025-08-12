import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useOrders } from '../context/OrdersContext';
import UnifiedOrderSummary from '../components/UnifiedOrderSummary';

// --- Black Desert Online specific constants ---
const BDO_SILVER_BRACKET_PRICES = {
    '150 AP / 200 DP': 7.00,
    '240 AP / 290 DP': 5.00,
    '270 AP / 340 DP': 4.00,
    '301 AP / 380 DP': 3.50,
    '320+ AP / 400+ DP': 3.00,
    '340+ AP / 415+ DP': 2.00,
};

const BDO_PRICE_PER_LEVEL = (level) => {
    if (level >= 1 && level < 55) return 5.00 / 54; 
    if (level >= 55 && level < 60) return 10.00 / 5;
    if (level === 60) return 10.00;
    if (level === 61) return 25.00;
    if (level === 62) return 35.00;
    if (level === 63) return 70.00;
    if (level === 64) return 150.00;
    return 0;
};

const BDO_POWER_LEVELING_EXTRAS = {
    'mainQuestline': 0.01,
    'chengaTome': 10.00,
};

const BDO_GEAR_BOOST_EXTRAS = {
    'adviceGear': 7.00,
};
const BDO_TIME_FILLED_STONE_PRICE_PER_2000_STANDALONE = 10.00;


const BDO_LIVE_STREAM_HOURLY_RATE = 2.00;

const BDO_GEAR_BOOST_PRICES = {
    '240ap_305dp': 20.00,
    '265ap_325dp': 100.00,
    '280ap_340dp': 250.00,
    '290ap_375dp': 400.00,
    '305ap_380dp': 500.00,
    '320ap_400dp': 600.00,
};

const BDO_GEAR_BOOST_DISPLAY_NAMES = {
    '240ap_305dp': '240 AP, 305 DP',
    '265ap_325dp': '265 AP, 325 DP',
    '280ap_340dp': '280 AP, 340 DP',
    '290ap_375dp': '290 AP, 375 DP',
    '305ap_380dp': '305 AP, 380 DP',
    '320ap_400dp': '320 AP, 400 DP',
};


const BDO_MAIN_QUEST_PRICES = {
    'balenosToMediah': 0.01,
    'valencia': 9.50,
    'kamasylvia': 10.00,
    'drieghan': 10.00,
    'mountainOfEternalWinter': 6.00,
    'landOfMorningLight': 20.00,
};

const FULL_SEASON_BASE_PRICE = 25.00;
const FULL_SEASON_EXTRAS = {
    'fullPenTuvala': 5.00,
};

const BDO_ADVENTURE_LOG_PRICES = {
    'bartali_1_14': 20.00,
    'bartali_1_15': 25.00,
};
const BDO_ADVENTURE_LOG_DISPLAY_NAMES = {
    'bartali_1_14': 'Bartali 1-14 (AP/DP Pages)',
    'bartali_1_15': 'Bartali 1-15 (Full Book)',
};

const ATORAXXION_DATA = {
    'Normal': {
        requirement: '270 AP, 380 DP',
        dungeons: {
            'vahmalkea': 5.00,
            'sycrakea': 5.00,
            'yolunakea': 5.00,
            'orze': 15.00,
        }
    },
    'Solo Dungeon': {
        requirement: '230 AP, 290 DP',
        dungeons: {
            'vahmalkea': 10.00,
            'sycrakea': 10.00,
            'yolunakea': 10.00,
        }
    },
    'Elvia Realm': {
        requirement: '309 AP, 380 DP',
        dungeons: {
            'vahmalkea': 10.00,
            'sycrakea': 10.00,
            'yolunakea': 10.00,
            'orze': 25.00,
        }
    }
};

const ORZE_ELVIA_REQUIREMENT = '320 AP, 401 DP';


const BDO_GRINDING_SPOT_PRICES = {
    'Hexe Sanctuary': 3.00,
    'Gyrfin Rhasia Underground': 2.00,
    'Quint Hill': 3.00,
    'Sycraia Lower Abyssal': 3.00,
    'Dehkia Olun\'s': 6.00,
    'Tungrad Ruins': 4.00,
    'Yzrahid Highlands': 4.00,
    'Dehkia Cyclops': 4.00,
    'Dehkia Hystria Ruins': 4.00,
    'Dehkia Aakman Temple': 4.00,
};

const BDO_SHRINES_PRICES = {
    c1_c5: 3.00,
    c6_c7: 3.00,
    c8: 4.00,
    c9: 5.00,
    c10: 6.00,
};

const BDO_SHRINES_DISPLAY_NAMES = {
    c1_c5: 'C1 to C5 per boss',
    c6_c7: 'C6 - C7 per boss',
    c8: 'C8 per boss',
    c9: 'C9 per boss',
    c10: 'C10 per boss',
};

const BDO_GRINDING_SPOT_REQUIREMENTS = {
    'Hexe Sanctuary': '300 AP, 380 DP',
    'Gyrfin Rhasia Underground': '280 AP, 360 DP',
    'Quint Hill': '300 AP, 380 DP',
    'Sycraia Lower Abyssal': '260 AP, 340 DP',
    'Dehkia Olun\'s': '330 AP, 400 DP',
    'Tungrad Ruins': '309 AP, 400 DP',
    'Yzrahid Highlands': '309 AP, 400 DP',
    'Dehkia Cyclops': '309 AP, 400 DP',
    'Dehkia Hystria Ruins': '305 AP, 380 DP',
    'Dehkia Aakman Temple': '305 AP, 380 DP',
};

const BDO_GRINDING_SPOT_DISPLAY_NAMES = {
    'Hexe Sanctuary': 'Hexe Sanctuary',
    'Gyrfin Rhasia Underground': 'Gyrfin Rhasia Underground',
    'Quint Hill': 'Quint Hill',
    'Sycraia Lower Abyssal': 'Sycraia Lower Abyssal',
    'Dehkia Olun\'s': 'Dehkia Olun\'s',
    'Tungrad Ruins': 'Tungrad Ruins',
    'Yzrahid Highlands': 'Yzrahid Highlands',
    'Dehkia Cyclops': 'Dehkia Cyclops',
    'Dehkia Hystria Ruins': 'Dehkia Hystria Ruins',
    'Dehkia Aakman Temple': 'Dehkia Aakman Temple',
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

const BdoOffersPage = () => {
    const { data: session, status } = useSession();
    const router = useRouter();
    const { addOrder } = useOrders();
    
    const [activeService, setActiveService] = useState('powerLeveling');

    const [silverAmount, setSilverAmount] = useState(1);
    const [silverFarmingBracket, setSilverFarmingBracket] = useState('150 AP / 200 DP');
    const [silverPrice, setSilverPrice] = useState('7.00');
    const [currentLevel, setCurrentLevel] = useState(1);
    const [desiredLevel, setDesiredLevel] = useState(60);
    const [powerLevelingExtras, setPowerLevelingExtras] = useState([]);
    const [liveStreamHours, setLiveStreamHours] = useState(0);
    const [powerLevelingPrice, setPowerLevelingPrice] = useState('0.00');
    const [selectedGearPackages, setSelectedGearPackages] = useState([]);
    const [gearBoostExtras, setGearBoostExtras] = useState([]);
    const [gearBoostPrice, setGearBoostPrice] = useState('0.00');
    const [standaloneStoneAmount, setStandaloneStoneAmount] = useState(1000);
    const [standaloneStonePrice, setStandaloneStonePrice] = useState('5.00');
    const [selectedQuests, setSelectedQuests] = useState([]);
    const [mainQuestPrice, setMainQuestPrice] = useState('0.00');
    const [fullSeasonExtras, setFullSeasonExtras] = useState([]);
    const [fullSeasonCompletePrice, setFullSeasonCompletePrice] = useState(FULL_SEASON_BASE_PRICE.toFixed(2));
    const [selectedAdventureLog, setSelectedAdventureLog] = useState('bartali_1_14');
    const [adventureLogsPrice, setAdventureLogsPrice] = useState('20.00');
    const [atoraxxionServer, setAtoraxxionServer] = useState('Normal');
    const [selectedDungeons, setSelectedDungeons] = useState([]);
    const [atoraxxionRuns, setAtoraxxionRuns] = useState(1);
    const [atoraxxionPrice, setAtoraxxionPrice] = useState('0.00');
    const [grindingSpots, setGrindingSpots] = useState([]);
    const [grindingHours, setGrindingHours] = useState(1);
    const [grindingPrice, setGrindingPrice] = useState('0.00');
    const [selectedShrines, setSelectedShrines] = useState([]);
    const [shrinesPrice, setShrinesPrice] = useState('0.00');
    const [isProcessingPayment, setIsProcessingPayment] = useState(false);

    useEffect(() => {
        calculateAllPrices();
    }, [
        silverAmount, silverFarmingBracket, currentLevel, desiredLevel, powerLevelingExtras,
        liveStreamHours, selectedGearPackages, gearBoostExtras, standaloneStoneAmount,
        fullSeasonExtras, selectedQuests, selectedAdventureLog, atoraxxionServer,
        selectedDungeons, atoraxxionRuns, grindingSpots, grindingHours, selectedShrines
    ]);

    const calculateAllPrices = () => {
        calculateSilverPrice();
        calculatePowerLevelingPrice();
        calculateGearBoostPrice();
        calculateMainQuestPrice();
        calculateStandaloneStonePrice();
        calculateFullSeasonPrice();
        calculateAdventureLogsPrice();
        calculateAtoraxxionPrice();
        calculateGrindingPrice();
        calculateShrinesPrice();
    };



    const calculateSilverPrice = () => {
        const pricePerBillion = BDO_SILVER_BRACKET_PRICES[silverFarmingBracket] || 0;
        setSilverPrice((silverAmount * pricePerBillion).toFixed(2));
    };

    const calculatePowerLevelingPrice = () => {
        let price = 0;
        for (let i = currentLevel; i < desiredLevel; i++) {
            price += BDO_PRICE_PER_LEVEL(i);
        }
        
        powerLevelingExtras.forEach(extra => {
            price += BDO_POWER_LEVELING_EXTRAS[extra] || 0;
        });

        price += liveStreamHours * BDO_LIVE_STREAM_HOURLY_RATE;

        setPowerLevelingPrice(price.toFixed(2));
    };
    
    const calculateGearBoostPrice = () => {
        let price = 0;
        selectedGearPackages.forEach(pkg => {
            price += BDO_GEAR_BOOST_PRICES[pkg] || 0;
        });
        gearBoostExtras.forEach(extra => {
            price += BDO_GEAR_BOOST_EXTRAS[extra] || 0;
        });
        setGearBoostPrice(price.toFixed(2));
    };

    const calculateStandaloneStonePrice = () => {
        setStandaloneStonePrice(((standaloneStoneAmount / 2000) * BDO_TIME_FILLED_STONE_PRICE_PER_2000_STANDALONE).toFixed(2));
    };

    const calculateMainQuestPrice = () => {
        let price = 0;
        selectedQuests.forEach(quest => {
            price += BDO_MAIN_QUEST_PRICES[quest] || 0;
        });
        setMainQuestPrice(price.toFixed(2));
    };

    const calculateFullSeasonPrice = () => {
        let price = FULL_SEASON_BASE_PRICE;
        fullSeasonExtras.forEach(extra => {
            price += FULL_SEASON_EXTRAS[extra] || 0;
        });
        setFullSeasonCompletePrice(price.toFixed(2));
    };

    const calculateAdventureLogsPrice = () => {
        setAdventureLogsPrice((BDO_ADVENTURE_LOG_PRICES[selectedAdventureLog] || 0).toFixed(2));
    };

    const calculateAtoraxxionPrice = () => {
        let price = 0;
        selectedDungeons.forEach(dungeon => {
            price += ATORAXXION_DATA[atoraxxionServer]?.dungeons[dungeon] || 0;
        });
        
        let totalPrice = price * atoraxxionRuns;

        setAtoraxxionPrice(totalPrice.toFixed(2));
    };

    const calculateGrindingPrice = () => {
        let price = 0;
        grindingSpots.forEach(spot => {
            price += BDO_GRINDING_SPOT_PRICES[spot] || 0;
        });
        const totalPrice = price * grindingHours;
        setGrindingPrice(totalPrice.toFixed(2));
    };

    const calculateShrinesPrice = () => {
        let price = 0;
        selectedShrines.forEach(shrine => {
            price += BDO_SHRINES_PRICES[shrine] || 0;
        });
        setShrinesPrice(price.toFixed(2));
    };

    const handleExtraChange = (stateKey, e) => {
        const { value, checked } = e.target;
        const setterMap = {
            powerLevelingExtras: setPowerLevelingExtras,
            gearBoostExtras: setGearBoostExtras,
            fullSeasonExtras: setFullSeasonExtras,
            selectedQuests: setSelectedQuests,
            grindingSpots: setGrindingSpots,
            selectedShrines: setSelectedShrines,
            selectedGearPackages: setSelectedGearPackages
        };
        
        const currentExtras = {
            powerLevelingExtras,
            gearBoostExtras,
            fullSeasonExtras,
            selectedQuests,
            grindingSpots,
            selectedShrines,
            selectedGearPackages
        }[stateKey] || [];
        
        const newExtras = checked
            ? [...currentExtras, value]
            : currentExtras.filter(item => item !== value);
        
        setterMap[stateKey](newExtras);
    };

    const handleDungeonChange = (e) => {
        const { value, checked } = e.target;
        let newDungeons = checked
            ? [...selectedDungeons, value]
            : selectedDungeons.filter(item => item !== value);

        let newServer = atoraxxionServer;
        if (newDungeons.includes('orze') && atoraxxionServer === 'Solo Dungeon') {
            newServer = 'Normal';
            newDungeons = newDungeons.filter(d => ATORAXXION_DATA[newServer].dungeons[d]);
        }
        
        setSelectedDungeons(newDungeons);
        setAtoraxxionServer(newServer);
    };
    
    const services = [
        { id: 'powerLeveling', name: 'Power Leveling', icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="currentColor" class="w-6 h-6"><path d="M4.1 38.3C1 35.2-1.2 30.3 .8 26.1s8-6.6 12.5-5.3L64 32l41.2-41.2c5.1-5.1 13.3-5.1 18.4 0l22.6 22.6c5.1 5.1 5.1 13.3 0 18.4L105 73l11.2 11.2 8.5-8.5c5.1-5.1 13.3-5.1 18.4 0l22.6 22.6c5.1 5.1 5.1 13.3 0 18.4l-8.5 8.5 11.2 11.2 8.5-8.5c5.1-5.1 13.3-5.1 18.4 0l22.6 22.6c5.1 5.1 5.1 13.3 0 18.4l-8.5 8.5 11.2 11.2 41.2-41.2c5.1-5.1 13.3-5.1 18.4 0l22.6 22.6c5.1 5.1 5.1 13.3 0 18.4L321.2 256l41.2 41.2c5.1 5.1 5.1 13.3 0 18.4l-22.6 22.6c-5.1 5.1-13.3 5.1-18.4 0L280.3 297l-11.2-11.2-8.5 8.5c-5.1 5.1-13.3 5.1-18.4 0l-22.6-22.6c-5.1-5.1-5.1-13.3 0-18.4l8.5-8.5-11.2-11.2-8.5 8.5c-5.1 5.1-13.3 5.1-18.4 0l-22.6-22.6c-5.1-5.1-5.1-13.3 0-18.4l8.5-8.5-11.2-11.2L73 257.2c-5.1 5.1-13.3 5.1-18.4 0L32 234.6c-5.1-5.1-5.1-13.3 0-18.4L73.2 175 32 133.9 20.8 146.4c-1.7 1.7-3.7 2.8-5.9 3.2L.8 152.9c-4.2 1.2-8.5-1-9.8-5.2s1-8.5 5.2-9.8l13.3-4.1c1.7-.5 3.2-1.5 4.3-2.7L32 108.3 4.1 38.3z"/></svg>` },
        { id: 'silverFarming', name: 'Silver Farming', icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="currentColor" class="w-6 h-6"><path d="M256 0c-17.7 0-32 14.3-32 32V64H448c17.7 0 32 14.3 32 32s-14.3 32-32 32H384v32c0 17.7-14.3 32-32 32s-32-14.3-32-32V128H288v32c0 17.7-14.3 32-32 32s-32-14.3-32-32V128H192v32c0 17.7-14.3 32-32 32s-32-14.3-32-32V128H64c-17.7 0-32-14.3-32-32s14.3-32 32-32H224V32c0-17.7 14.3-32 32-32zM128 224v32c0 17.7-14.3 32-32 32s-32-14.3-32-32V224H32c-17.7 0-32 14.3-32 32v96c0 53 43 96 96 96H416c53 0 96-43 96-96V256c0-17.7-14.3-32-32-32H128z"/></svg>` },
        { id: 'fullSeasonComplete', name: 'Full Season Complete', icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512" fill="currentColor" class="w-6 h-6"><path d="M288 0c-17.7 0-32 14.3-32 32V69.5c-18.4-14.5-41.9-22.6-67.2-22.6c-53.9 0-99.3 39.1-107.5 90.3c-1.2 7.4-8.3 12.3-15.8 11.1S48.3 140 49.5 132.6C60.1 64.2 119.3 16 188.8 16c33.2 0 63.4 13.9 84.7 36.7L288 32c17.7 0 32-14.3 32-32s-14.3-32-32-32zM560 128c-13.3 0-24 10.7-24 24V256c0 53-43 96-96 96H136c-53 0-96-43-96-96V152c0-13.3-10.7-24-24-24s-24 10.7-24 24V256c0 80 64 144 144 144H440c80 0 144-64 144-144V152c0-13.3-10.7-24-24-24z"/></svg>`},
        { id: 'timeFilledStone', name: 'Time-Filled Stone', icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512" fill="currentColor" class="w-6 h-6"><path d="M32 32C14.3 32 0 46.3 0 64v96c0 17.7 14.3 32 32 32h96c17.7 0 32-14.3 32-32V64c0-17.7-14.3-32-32-32H32zM192 32c-17.7 0-32 14.3-32 32v96c0 17.7 14.3 32 32 32h96c17.7 0 32-14.3 32-32V64c0-17.7-14.3-32-32-32H192zM32 224c-17.7 0-32 14.3-32 32v96c0 17.7 14.3 32 32 32h96c17.7 0 32-14.3 32-32V256c0-17.7-14.3-32-32-32H32zM192 224c-17.7 0-32 14.3-32 32v96c0 17.7 14.3 32 32 32h96c17.7 0 32-14.3 32-32V256c0-17.7-14.3-32-32-32H192z"/></svg>`},
        { id: 'atoraxxionDungeon', name: 'Atoraxxion Dungeon', icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="currentColor" class="w-6 h-6"><path d="M272 96c0-26.5-21.5-48-48-48s-48 21.5-48 48s21.5 48 48 48s48-21.5 48-48zM128 208c0-26.5-21.5-48-48-48s-48 21.5-48 48s21.5 48 48 48s48-21.5 48-48zM432 160c-26.5 0-48 21.5-48 48s21.5 48 48 48s48-21.5 48-48s-21.5-48-48-48zM272 320c0-26.5-21.5-48-48-48s-48 21.5-48 48s21.5 48 48 48s48-21.5 48-48zM128 416c0-26.5-21.5-48-48-48s-48 21.5-48 48s21.5 48 48 48s48-21.5 48-48zM432 368c-26.5 0-48 21.5-48 48s21.5 48 48 48s48-21.5 48-48s-21.5-48-48-48z"/></svg>`},
        { id: 'grindingSpots', name: 'Grinding Spots', icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="currentColor" class="w-6 h-6"><path d="M320 0c-17.7 0-32 14.3-32 32s14.3 32 32 32h48.3L232.2 199.8C226 205.2 224 212.9 224 220.8V384H192c-17.7 0-32 14.3-32 32s14.3 32 32 32H320c17.7 0 32-14.3 32-32s-14.3-32-32-32H288V220.8c0-7.9 2-15.6 6.2-21.8L419.7 64H464c17.7 0 32-14.3 32-32s-14.3-32-32-32H320zM128 0C83.8 0 48 35.8 48 80V192c0 17.7-14.3 32-32 32s-32-14.3-32-32V80C16 35.8 51.8 0 96 0h32z"/></svg>`},
        { id: 'shrines', name: 'Shrines', icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512" fill="currentColor" class="w-6 h-6"><path d="M511.8 287.6H512V288H64V287.6H63.8C39.9 285.9 24 265.2 24 240V112C24 50.1 74.1 0 136 0S248 50.1 248 112V240c0 25.2-15.9 45.9-39.8 47.6H208V288h160V287.6h-.2c-23.9-1.7-39.8-22.4-39.8-47.6V112c0-61.9 50.1-112 112-112s112 50.1 112 112V240c0 25.2-15.9 45.9-39.8 47.6zM152 112a24 24 0 1 1-48 0 24 24 0 1 1 48 0zm264 0a24 24 0 1 1-48 0 24 24 0 1 1 48 0zM24 336c0-8.8 7.2-16 16-16H536c8.8 0 16 7.2 16 16s-7.2 16-16 16H40c-8.8 0-16-7.2-16-16zm0 80c0-8.8 7.2-16 16-16H536c8.8 0 16 7.2 16 16s-7.2 16-16 16H40c-8.8 0-16-7.2-16-16zm16 64H536c8.8 0 16 7.2 16 16s-7.2 16-16 16H40c-8.8 0-16-7.2-16-16z"/></svg>` },
        { id: 'gearBoost', name: 'Gear Boost', icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="currentColor" class="w-6 h-6"><path d="M256 0L12.3 121.3c-11.3 10.7-11.8 28.7-.9 40.2l112 128c10.4 11.9 28.2 12.3 39.2 .9l92.5-96.5c11.9-12.4 31.3-12.4 43.2 0L392 290.3c11 11.4 28.8 11 39.2-.9l112-128c10.9-11.5 10.4-29.5-.9-40.2L256 0zM31.3 201.2l-18.4-21c-10.9-12.4-8.8-30.5 4.2-40.2L240 4.2c5.8-4.7 14.2-4.7 20 0L484.9 140c13 9.7 15.1 27.8 4.2 40.2l-18.4 21c-10.9 12.4-28.9 11.3-38.4-2.1L277.5 120.5c-11-10.9-28.5-10.9-39.5 0L81.8 199.1c-9.5 13.4-27.5 14.5-38.4 2.1zM480.7 265.2l-112 128c-10.4 11.9-28.2 12.3-39.2 .9L236.9 300.5c-11.9-12.4-31.3-12.4-43.2 0L101.1 394c-11 11.4-28.8 11-39.2-.9l-112-128c-10.9-11.5-10.4-29.5.9-40.2l18.4-21c10.9-12.4 28.9-11.3 38.4 2.1l154.7 136.6c11 10.9 28.5 10.9 39.5 0L439.1 204c9.5-13.4 27.5-14.5 38.4-2.1l18.4 21c10.9 11.5 10.4 29.5-.9 40.2z"/></svg>` },
        { id: 'adventureLogs', name: 'Adventure Logs', icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" fill="currentColor" class="w-6 h-6"><path d="M96 0C43 0 0 43 0 96V416c0 53 43 96 96 96H384c35.3 0 64-28.7 64-64V96c0-53-43-96-96-96H96zM48 96C48 78.3 62.3 64 80 64H384c17.7 0 32 14.3 32 32s-14.3 32-32 32H80c-17.7 0-32-14.3-32-32z"/></svg>`},
        { id: 'mainQuest', name: 'Main Quest', icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512" fill="currentColor" class="w-6 h-6"><path d="M0 64C0 28.7 28.7 0 64 0H224V128c0 17.7 14.3 32 32 32H384V448c0 35.3-28.7 64-64 64H64c-35.3 0-64-28.7-64-64V64zm384 64H256V0L384 128z"/></svg>` },
    ];

    const renderRequirements = () => {

        const BDO_SERVICE_REQUIREMENTS = {
            powerLeveling: [
                'Active account on PC (NA or EU).', 
                'Blessed Message Scroll',
                'Combat & Skill EXP 530% Scroll',
                '300% EXP scroll'
            ],
            silverFarming: ['Active account on PC (NA or EU).', 'Character must meet the AP/DP for the selected bracket.', 'Value Pack is highly recommended.'],
            fullSeasonComplete: ['Active account on PC (NA or EU).', 'A seasonal character must be created.'],
            timeFilledStone: ['Active account on PC (NA or EU).', 'A seasonal character is required.', 'full pets tier 4'],
            grindingSpots: ['Active account on PC (NA or EU).', 'Character must meet the AP/DP for the selected spot(s).', 'Loot scrolls are highly recommended.', 'full pets tier 4'],
            shrines: [
                'Active account on PC (NA or EU).',
                'Normal: 280 AP / 350 DP',
                'Hard: 320 AP / 401 DP'
            ],
            gearBoost: ['Active account on PC (NA or EU).', 'Service is for gearing up from a fresh state.'],
            adventureLogs: ['Active account on PC (NA or EU).'],
            mainQuest: ['Active account on PC (NA or EU).', 'Character must be able to start the selected questline.'],
        };

        let requirements = BDO_SERVICE_REQUIREMENTS[activeService];
        let content;

        if (activeService === 'atoraxxionDungeon') {
            const requirementText = ATORAXXION_DATA[atoraxxionServer]?.requirement;
            content = (
                <ul className="list-disc list-inside space-y-2">
                    <li className="text-gray-300">Active account on PC (NA or EU).</li>
                    {atoraxxionServer === 'Solo Dungeon' && <li className="text-gray-300">Character must have completed the prerequisite quests.</li>}
                    {requirementText && <li className="text-gray-300">{`Gear Requirement: ${requirementText}`}</li>}
                </ul>
            );
        } else {
            if (!requirements || requirements.length === 0) return null;
            content = (
                <ul className="list-disc list-inside space-y-2">
                    {requirements.map((req, index) => (
                        <li key={index} className="text-gray-300">{req}</li>
                    ))}
                </ul>
            );
        }
        
        return (
            <div className="mb-8 p-6 card-bg">
                <h3 className="text-2xl font-bold text-white mb-4">Requirements</h3>
                {content}
            </div>
        );
    };

    const renderServiceContent = () => {
        switch (activeService) {
            case 'powerLeveling':
                return (
                    <div className="space-y-8">
                        <h3 className="text-4xl font-black text-white">BDO Power Leveling</h3>
                        <p className="text-sm text-gray-400 -mt-4">PC NA & EU only</p>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center text-lg">
                                <span className="text-gray-400">Current Level:</span>
                                <span className="font-bold text-white">{currentLevel}</span>
                            </div>
                            <input 
                                type="range" 
                                min="1" 
                                max="64" 
                                value={currentLevel} 
                                onChange={(e) => setCurrentLevel(Math.min(Number(e.target.value), desiredLevel - 1))} 
                                className="w-full h-2 bg-zinc-700 rounded-lg appearance-none cursor-pointer range-thumb" 
                            />
                        </div>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center text-lg">
                                <span className="text-gray-400">Desired Level:</span>
                                <span className="font-bold text-white">{desiredLevel}</span>
                            </div>
                            <input 
                                type="range" 
                                min="2" 
                                max="65" 
                                value={desiredLevel} 
                                onChange={(e) => setDesiredLevel(Math.max(Number(e.target.value), currentLevel + 1))} 
                                className="w-full h-2 bg-zinc-700 rounded-lg appearance-none cursor-pointer range-thumb" 
                            />
                        </div>
                        <div>
                            <h4 className="text-xl font-bold text-white mb-4">Extras</h4>
                            <div className="space-y-3">
                                {Object.entries(BDO_POWER_LEVELING_EXTRAS).map(([key, price]) => {
                                    const displayName = key === 'mainQuestline' ? 'Main Questline (Balenos to Mediah)' : key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
                                    return (
                                        <label key={key} className="flex items-center justify-between p-4 bg-zinc-900/50 rounded-lg border border-zinc-700 cursor-pointer hover:border-blue-500 transition-colors">
                                            <div>
                                                <span className="font-semibold text-white">{displayName}</span>
                                                <span className="text-purple-400 font-bold ml-2"> +${price.toFixed(2)}</span>
                                            </div>
                                            <input type="checkbox" value={key} onChange={(e) => handleExtraChange('powerLevelingExtras', e)} checked={powerLevelingExtras.includes(key)} style={srOnlyStyle} />
                                            <CustomCheckboxVisual checked={powerLevelingExtras.includes(key)} />
                                        </label>
                                    );
                                })}
                            </div>
                            <div className="space-y-4 mt-4">
                                <div className="flex justify-between items-center text-lg">
                                    <span className="text-gray-400">Live Stream Hours (+$2.00/hr):</span>
                                    <span className="font-bold text-white">{liveStreamHours}</span>
                                </div>
                                <input 
                                    type="range" 
                                    min="0" 
                                    max="24" 
                                    value={liveStreamHours} 
                                    onChange={(e) => setLiveStreamHours(Number(e.target.value))} 
                                    className="w-full h-2 bg-zinc-700 rounded-lg appearance-none cursor-pointer range-thumb" 
                                />
                            </div>
                        </div>
                    </div>
                );
            case 'silverFarming':
                return (
                    <div className="space-y-8">
                        <h3 className="text-4xl font-black text-white">BDO Silver Farming</h3>
                        <p className="text-sm text-gray-400 -mt-4">PC NA & EU only</p>
                        <div>
                            <h4 className="text-xl font-bold text-white mb-4">Select Your Gear Bracket</h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {Object.keys(BDO_SILVER_BRACKET_PRICES).map(bracket => (
                                    <button 
                                        key={bracket} 
                                        onClick={() => setSilverFarmingBracket(bracket)} 
                                        className={`option-button ${silverFarmingBracket === bracket ? 'active' : ''}`}
                                    >
                                        {bracket}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center text-lg"><span className="text-gray-400">Amount (Billion):</span><span className="font-bold text-white">{silverAmount}B</span></div>
                            <input type="range" min="1" max="1000" step="1" value={silverAmount} onChange={(e) => setSilverAmount(Number(e.target.value))} className="w-full h-2 bg-zinc-700 rounded-lg appearance-none cursor-pointer range-thumb" />
                        </div>
                    </div>
                );
            case 'fullSeasonComplete':
                return (
                    <div className="space-y-8">
                        <h3 className="text-4xl font-black text-white">Finishing BDO Season Pass</h3>
                        <p className="text-sm text-gray-400 -mt-4">PC NA & EU only</p>
                        <p className="text-lg text-gray-300">Base price for completing the season pass is ${FULL_SEASON_BASE_PRICE.toFixed(2)}.</p>
                        <div>
                            <h4 className="text-xl font-bold text-white mb-4 mt-8">Extras</h4>
                            <div className="space-y-3">
                                {Object.entries(FULL_SEASON_EXTRAS).map(([key, price]) => (
                                    <label key={key} className="flex items-center justify-between p-4 bg-zinc-900/50 rounded-lg border border-zinc-700 cursor-pointer hover:border-blue-500 transition-colors">
                                        <div>
                                            <span className="font-semibold text-white">Full PEN Tuvala</span>
                                            <span className="text-purple-400 font-bold ml-2"> +${price.toFixed(2)}</span>
                                        </div>
                                        <input type="checkbox" value={key} onChange={(e) => handleExtraChange('fullSeasonExtras', e)} checked={fullSeasonExtras.includes(key)} style={srOnlyStyle} />
                                        <CustomCheckboxVisual checked={fullSeasonExtras.includes(key)} />
                                    </label>
                                ))}
                            </div>
                        </div>
                    </div>
                );
            case 'timeFilledStone':
                return (
                    <div className="space-y-8">
                        <h3 className="text-4xl font-black text-white">Time-Filled Black Stone Farming</h3>
                        <p className="text-sm text-gray-400 -mt-4">PC NA & EU only</p>
                         <div className="space-y-4 mt-4">
                            <div className="flex justify-between items-center text-lg">
                                <span className="text-gray-400">Amount (+$10.00/2k):</span>
                                <span className="font-bold text-white">{standaloneStoneAmount.toLocaleString()}</span>
                            </div>
                            <input 
                                type="range" 
                                min="1000" 
                                max="500000" 
                                step="1000"
                                value={standaloneStoneAmount} 
                                onChange={(e) => setStandaloneStoneAmount(Number(e.target.value))} 
                                className="w-full h-2 bg-zinc-700 rounded-lg appearance-none cursor-pointer range-thumb" 
                            />
                        </div>
                    </div>
                );
            case 'atoraxxionDungeon':
                return (
                     <div className="space-y-8">
                        <h3 className="text-4xl font-black text-white">BDO Atoraxxion Dungeon Boost</h3>
                        <p className="text-sm text-gray-400 -mt-4">PC NA & EU only</p>
                         <div className="space-y-4">
                             <h4 className="text-xl font-bold text-white">Choose a Server</h4>
                             <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                 {Object.keys(ATORAXXION_DATA).map(server => (
                                     <button 
                                        key={server} 
                                        onClick={() => setAtoraxxionServer(server)} 
                                        className={`option-button ${atoraxxionServer === server ? 'active' : ''} ${selectedDungeons.includes('orze') && server === 'Solo Dungeon' ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        disabled={selectedDungeons.includes('orze') && server === 'Solo Dungeon'}
                                     >
                                         {server}
                                     </button>
                                 ))}
                             </div>
                         </div>
                         <div className="space-y-4">
                             <h4 className="text-xl font-bold text-white">Choose a Dungeon</h4>
                             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                 {Object.keys(ATORAXXION_DATA[atoraxxionServer].dungeons).map(dungeon => (
                                     <label key={dungeon} className="flex items-center justify-between p-4 bg-zinc-900/50 rounded-lg border border-zinc-700 cursor-pointer hover:border-blue-500 transition-colors">
                                        <div>
                                            <span className="font-semibold text-white">{dungeon.charAt(0).toUpperCase() + dungeon.slice(1)}</span>
                                        </div>
                                        <input type="checkbox" value={dungeon} onChange={handleDungeonChange} checked={selectedDungeons.includes(dungeon)} style={srOnlyStyle} />
                                        <CustomCheckboxVisual checked={selectedDungeons.includes(dungeon)} />
                                    </label>
                                 ))}
                             </div>
                         </div>
                         <div className="space-y-4">
                             <div className="flex justify-between items-center text-lg"><span className="text-gray-400">Number of Runs:</span><span className="font-bold text-white">{atoraxxionRuns}</span></div>
                             <input type="range" min="1" max="2" value={atoraxxionRuns} onChange={(e) => setAtoraxxionRuns(Number(e.target.value))} className="w-full h-2 bg-zinc-700 rounded-lg appearance-none cursor-pointer range-thumb" />
                         </div>
                     </div>
                );
            case 'grindingSpots':
                return (
                    <div className="space-y-8">
                        <h3 className="text-4xl font-black text-white">BDO Grinding Spots Farming</h3>
                        <p className="text-sm text-gray-400 -mt-4">PC NA & EU only</p>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center text-lg"><span className="text-gray-400">Number of Hours:</span><span className="font-bold text-white">{grindingHours}</span></div>
                            <input type="range" min="1" max="24" value={grindingHours} onChange={(e) => setGrindingHours(Number(e.target.value))} className="w-full h-2 bg-zinc-700 rounded-lg appearance-none cursor-pointer range-thumb" />
                        </div>
                        <div>
                            <h4 className="text-xl font-bold text-white mb-4">Select Grinding Spot(s)</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                {Object.entries(BDO_GRINDING_SPOT_PRICES).map(([spot, price]) => (
                                    <label key={spot} className="flex items-center justify-between p-4 bg-zinc-900/50 rounded-lg border border-zinc-700 cursor-pointer hover:border-blue-500 transition-colors">
                                        <div>
                                            <span className="font-semibold text-white">{spot}</span>
                                            <span className="text-purple-400 font-bold ml-2"> +${price.toFixed(2)}/hr</span>
                                        </div>
                                        <input type="checkbox" value={spot} onChange={(e) => handleExtraChange('grindingSpots', e)} checked={grindingSpots.includes(spot)} style={srOnlyStyle} />
                                        <CustomCheckboxVisual checked={grindingSpots.includes(spot)} />
                                    </label>
                                ))}
                            </div>
                        </div>
                    </div>
                );
            case 'shrines':
                return (
                    <div className="space-y-8">
                        <h3 className="text-4xl font-black text-white">Shrines Weekly Bosses</h3>
                        <p className="text-sm text-gray-400 -mt-4">PC NA & EU only</p>
                        <div className="space-y-3">
                            {Object.entries(BDO_SHRINES_PRICES).map(([key, price]) => (
                                <label key={key} className="flex items-center justify-between p-4 bg-zinc-900/50 rounded-lg border border-zinc-700 cursor-pointer hover:border-blue-500 transition-colors">
                                    <div>
                                        <span className="font-semibold text-white">{BDO_SHRINES_DISPLAY_NAMES[key]}</span>
                                        <span className="text-purple-400 font-bold ml-2"> +${price.toFixed(2)}</span>
                                    </div>
                                    <input type="checkbox" value={key} onChange={(e) => handleExtraChange('selectedShrines', e)} checked={selectedShrines.includes(key)} style={srOnlyStyle} />
                                    <CustomCheckboxVisual checked={selectedShrines.includes(key)} />
                                </label>
                            ))}
                        </div>
                    </div>
                );
            case 'gearBoost':
                 return (
                    <div className="space-y-8">
                        <h3 className="text-4xl font-black text-white">BDO Gear Boost</h3>
                        <p className="text-lg text-gray-400">all the prices from 0 to the mentioned ap - dp</p>
                        <p className="text-sm text-gray-400 -mt-4">PC NA & EU only</p>
                        <div className="space-y-3">
                            {Object.entries(BDO_GEAR_BOOST_PRICES).map(([key, price]) => (
                                 <label key={key} className="flex items-center justify-between p-4 bg-zinc-900/50 rounded-lg border border-zinc-700 cursor-pointer hover:border-blue-500 transition-colors">
                                    <div>
                                        <span className="font-semibold text-white">{BDO_GEAR_BOOST_DISPLAY_NAMES[key]}</span>
                                        <span className="text-purple-400 font-bold ml-2"> +${price.toFixed(2)}</span>
                                    </div>
                                    <input type="checkbox" value={key} onChange={(e) => handleExtraChange('selectedGearPackages', e)} checked={selectedGearPackages.includes(key)} style={srOnlyStyle} />
                                    <CustomCheckboxVisual checked={selectedGearPackages.includes(key)} />
                                </label>
                            ))}
                        </div>
                        <div>
                             <h4 className="text-xl font-bold text-white mb-4 mt-8">Extras</h4>
                            <div className="space-y-3">
                                {Object.entries(BDO_GEAR_BOOST_EXTRAS).map(([key, price]) => (
                                    <label key={key} className="flex items-center justify-between p-4 bg-zinc-900/50 rounded-lg border border-zinc-700 cursor-pointer hover:border-blue-500 transition-colors">
                                        <div>
                                            <span className="font-semibold text-white">Advice Gear</span>
                                            <span className="text-purple-400 font-bold ml-2"> +${price.toFixed(2)}</span>
                                        </div>
                                        <input type="checkbox" value={key} onChange={(e) => handleExtraChange('gearBoostExtras', e)} checked={gearBoostExtras.includes(key)} style={srOnlyStyle} />
                                        <CustomCheckboxVisual checked={gearBoostExtras.includes(key)} />
                                    </label>
                                ))}
                            </div>
                        </div>
                        <div>
                             <h4 className="text-xl font-bold text-white mb-4 mt-8">Custom Offer</h4>
                             <p className="text-lg text-gray-300">Customer will contact us and type details for his gear.</p>
                             <button className="w-full mt-4 py-3 px-6 rounded-lg font-bold text-lg text-white transition-all duration-300 shadow-lg transform hover:-translate-y-1 purchase-button">
                                Contact Us
                             </button>
                        </div>
                    </div>
                );
            case 'adventureLogs':
                return (
                    <div className="space-y-8">
                        <h3 className="text-4xl font-black text-white">BDO Adventure Logs</h3>
                        <p className="text-sm text-gray-400 -mt-4">PC NA & EU only</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {Object.keys(BDO_ADVENTURE_LOG_PRICES).map(logKey => (
                                <button 
                                    key={logKey} 
                                    onClick={() => setSelectedAdventureLog(logKey)} 
                                    className={`option-button ${selectedAdventureLog === logKey ? 'active' : ''}`}
                                >
                                    {BDO_ADVENTURE_LOG_DISPLAY_NAMES[logKey]}
                                </button>
                            ))}
                        </div>
                    </div>
                );
            case 'mainQuest':
                return (
                    <div className="space-y-8">
                        <h3 className="text-4xl font-black text-white">BDO Main Questline</h3>
                        <p className="text-sm text-gray-400 -mt-4">PC NA & EU only</p>
                        <div className="space-y-3">
                            {Object.entries(BDO_MAIN_QUEST_PRICES).map(([key, price]) => (
                                <label key={key} className="flex items-center justify-between p-4 bg-zinc-900/50 rounded-lg border border-zinc-700 cursor-pointer hover:border-blue-500 transition-colors">
                                    <div>
                                        <span className="font-semibold text-white">{key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</span>
                                        <span className="text-purple-400 font-bold ml-2"> +${price.toFixed(2)}</span>
                                    </div>
                                    <input type="checkbox" value={key} onChange={(e) => handleExtraChange('selectedQuests', e)} checked={selectedQuests.includes(key)} style={srOnlyStyle} />
                                    <CustomCheckboxVisual checked={selectedQuests.includes(key)} />
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
    const getCurrentPrice = () => {
        switch (activeService) {
            case 'powerLeveling': return powerLevelingPrice;
            case 'silverFarming': return silverPrice;
            case 'fullSeasonComplete': return fullSeasonCompletePrice;
            case 'timeFilledStone': return standaloneStonePrice;
            case 'atoraxxionDungeon': return atoraxxionPrice;
            case 'grindingSpots': return grindingPrice;
            case 'shrines': return shrinesPrice;
            case 'gearBoost': return gearBoostPrice;
            case 'adventureLogs': return adventureLogsPrice;
            case 'mainQuest': return mainQuestPrice;
            default: return '0.00';
        }
    };

    const getCurrentService = () => {
        return services.find(s => s.id === activeService)?.name || 'Select Service';
    };

    const getCurrentServiceDetails = () => {
        switch (activeService) {
            case 'powerLeveling': {
                let details = `Level ${currentLevel} to ${desiredLevel}`;
                if (powerLevelingExtras.length > 0) {
                    const extrasText = powerLevelingExtras.map(extra => {
                        if (extra === 'mainQuestline') return 'Main Questline (Balenos to Mediah)';
                        return extra.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
                    }).join(', ');
                    details += ` + ${extrasText}`;
                }
                if (liveStreamHours > 0) {
                    details += ` + Live Stream (${liveStreamHours}h)`;
                }
                return details;
            }
            case 'silverFarming': return `${silverAmount}B Silver (${silverFarmingBracket})`;
            case 'fullSeasonComplete': {
                let details = 'Full Season Complete';
                if (fullSeasonExtras.length > 0) {
                    const extrasText = fullSeasonExtras.map(extra => {
                        if (extra === 'fullPenTuvala') return 'Full PEN Tuvala';
                        return extra.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
                    }).join(', ');
                    details += ` + ${extrasText}`;
                }
                return details;
            }
            case 'timeFilledStone': return `${standaloneStoneAmount.toLocaleString()} Time-Filled Stones`;
            case 'atoraxxionDungeon': {
                let details = `Atoraxxion (${atoraxxionServer}) - ${atoraxxionRuns} Run(s)`;
                if (selectedDungeons.length > 0) {
                    const dungeonsText = selectedDungeons.map(dungeon => 
                        dungeon.charAt(0).toUpperCase() + dungeon.slice(1)
                    ).join(', ');
                    details += ` - ${dungeonsText}`;
                }
                return details;
            }
            case 'grindingSpots': {
                let details = `Grinding for ${grindingHours} hour(s)`;
                if (grindingSpots.length > 0) {
                    const spotsText = grindingSpots.map(spot => 
                        BDO_GRINDING_SPOT_DISPLAY_NAMES[spot] || spot.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())
                    ).join(', ');
                    details += ` at ${spotsText}`;
                }
                return details;
            }
            case 'shrines': {
                let details = 'Shrine Bosses';
                if (selectedShrines.length > 0) {
                    const shrinesText = selectedShrines.map(shrine => 
                        BDO_SHRINES_DISPLAY_NAMES[shrine] || shrine.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())
                    ).join(', ');
                    details += ` - ${shrinesText}`;
                }
                return details;
            }
            case 'gearBoost': {
                let details = 'Gear Boost';
                if (selectedGearPackages.length > 0) {
                    const packagesText = selectedGearPackages.map(pkg => 
                        BDO_GEAR_BOOST_DISPLAY_NAMES[pkg] || pkg.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())
                    ).join(', ');
                    details += ` - ${packagesText}`;
                }
                if (gearBoostExtras.length > 0) {
                    details += ' + Advice Gear';
                }
                return details;
            }
            case 'adventureLogs': return BDO_ADVENTURE_LOG_DISPLAY_NAMES[selectedAdventureLog];
            case 'mainQuest': {
                let details = 'Main Quest';
                if (selectedQuests.length > 0) {
                    const questsText = selectedQuests.map(quest => {
                        switch(quest) {
                            case 'balenosToMediah': return 'Balenos to Mediah';
                            case 'valencia': return 'Valencia';
                            case 'kamasylvia': return 'Kamasylvia';
                            case 'drieghan': return 'Drieghan';
                            case 'mountainOfEternalWinter': return 'Mountain of Eternal Winter';
                            case 'landOfMorningLight': return 'Land of Morning Light';
                            default: return quest.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
                        }
                    }).join(', ');
                    details += ` - ${questsText}`;
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
                        background-image: url('/images/games/Bdobackground.png');
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
                            <h1 className="text-5xl md:text-7xl font-extrabold mb-4 text-glow">Elevate Your Black Desert Online Journey</h1>
                            <p className="text-lg md:text-xl max-w-3xl mx-auto text-gray-300">
                                Professional boosting services for Black Desert Online. Safe, fast, and reliable.
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

                        {renderRequirements()}

                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                            <div className="lg:col-span-8">
                                <div className="p-8 card-bg">
                                    {renderServiceContent()}
                                </div>
                            </div>
                            <aside className="lg:col-span-4">
                                <UnifiedOrderSummary 
                                    gameName="Black Desert Online"
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
};

export default BdoOffersPage;
