import React, { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import UnifiedOrderSummary from '../components/UnifiedOrderSummary';

// --- All constants used in price calculations ---
const TOTAL_LEVELS_TO_BOOST = 64, MIN_PRICE_PER_ONE_LEVEL = 2.00, PILOTED_MULTIPLIER = 1.0, PRICE_60_65_REGULAR = 10, PRICE_60_65_SEASONAL = 13, LEVELS_IN_60_65_RANGE = 5, PRICE_30_40_REGULAR = 5, PRICE_30_40_SEASONAL = 6.5, LEVELS_IN_30_40_RANGE = 11, REGULAR_WORLD_TOTAL_PRICE_FULL_RANGE = 35, SEASONAL_WORLD_TOTAL_PRICE_FULL_RANGE = 45, TOTAL_LEVELS_IN_FIXED_PRICE_SEGMENTS = LEVELS_IN_30_40_RANGE + LEVELS_IN_60_65_RANGE, LEVELS_FOR_VARIABLE_PRICING = TOTAL_LEVELS_TO_BOOST - TOTAL_LEVELS_IN_FIXED_PRICE_SEGMENTS, FIXED_PRICE_TOTAL_REGULAR = PRICE_30_40_REGULAR + PRICE_60_65_REGULAR, FIXED_PRICE_TOTAL_SEASONAL = PRICE_30_40_SEASONAL + PRICE_60_65_SEASONAL, REMAINING_PRICE_REGULAR = REGULAR_WORLD_TOTAL_PRICE_FULL_RANGE - FIXED_PRICE_TOTAL_REGULAR, REMAINING_PRICE_SEASONAL = SEASONAL_WORLD_TOTAL_PRICE_FULL_RANGE - FIXED_PRICE_TOTAL_SEASONAL, PRICE_PER_LEVEL_VARIABLE_REGULAR = REMAINING_PRICE_REGULAR / LEVELS_FOR_VARIABLE_PRICING, PRICE_PER_LEVEL_VARIABLE_SEASONAL = REMAINING_PRICE_SEASONAL / LEVELS_FOR_VARIABLE_PRICING, GORGON_BOSS_PRICES = {'1': 15.00, '2': 30.00, '3': 40.00}, POWER_LEVELING_EXTRAS_PRICES = {'weaponMastery': 7.00, 'specificWeapons': 0, 'specificCovenant': 0, 'liveStreamDiscord': 5.00}, DUNGEON_PRICES = {'Amrine Excavation': 0, 'Starstone Barrows': 0, 'The Depths': 0, 'Dynasty Shipyard': 0, 'Garden of Genesis': 0, 'Lazarus Instrumentality': 0, 'Tempest’s Heart': 0, 'Barnacles and Black Powder': 0, 'The Ennead': 0, 'Empyrean Forge': 0, 'Savage Divide': 0, 'The Glacial Tarn': 0}, MUTATION_LEVEL_PRICES = {'Level 1': 0, 'Level 2': 0}, ARTIFACT_PRICES = {'Trsna': 60.00, 'Power Stone': 20.00, 'Inferno': 12.00, 'The Abyss': 12.00, 'Odo': 12.00, 'The Wall': 12.00, 'Spark of Mjolnir': 12.00, 'The Butcher': 12.00, 'Scorpion’s Sting': 12.00, 'Freya’s Francisca': 12.00, 'The Mechanic': 12.00, 'Finisher': 12.00, 'Lifetaker': 12.00, 'Boltcaster': 12.00}, ARTIFACT_BOOST_OPTIONS_PRICES = {'questCompletion': 13.00, 'fullUpgrade': 119.00, 'liveStreamDiscord': 5.00}, ARTIFACT_COMPLETION_SPEED_PRICES = {'express': 2.80, 'superExpress': 5.60}, PRICE_PER_RUN = 1.50, MIN_RUNS = 1, MAX_RUNS = 35, PRICE_PER_ELITE_CHEST_DAY = 7.00, MIN_ELITE_CHEST_DAYS = 1, MAX_ELITE_CHEST_DAYS = 30, ELITE_CHEST_EXTRAS_PRICES = {'liveStreamDiscord': 5.00}, WEAPON_MASTERY_PRICES = {'1': 0.50, '2': 0.50, '3': 0.50, '4': 0.50, '5': 0.50, '6': 0.50, '7': 0.50, '8': 0.50, '9': 0.50, '10': 0.50, '11': 0.50, '12': 0.50, '13': 0.50, '14': 0.50, '15': 0.50, '16': 0.50, '17': 0.50, '18': 0.50, '19': 0.50, '20': 0.50}, WEAPON_TYPE_PRICES = {'Sword': 0, 'Greatsword': 0, 'Hatchet': 0, 'War Hammer': 0, 'Spear': 0, 'Great Axe': 0, 'Blunderbuss': 0, 'Musket': 0, 'Bow': 0, 'Life Staff': 0, 'Fire Staff': 0, 'Ice Gauntlet': 0, 'Void Gauntlet': 0, 'Rapier': 0, 'Shield': 0}, WEAPON_MASTERY_EXTRAS_PRICES = {'liveStreamDiscord': 5.00, 'addSecondWeapon': 5.00}, PVP_TRACK_BASE_PRICE_PER_LEVEL = 2.50, PVP_TRACK_PRICE_BELOW_60_TOTAL = 3.00, REGIONS = ['NA East', 'NA West', 'EU Central', 'SA East', 'AP Southeast'], PVP_EXTRAS_PRICES = {'liveStreamDiscord': 5.00, 'forceBelow60Price': 0}, GORGON_EXTRAS_PRICES = {'liveStreamDiscord': 5.00}, EXPEDITION_EXTRAS_PRICES = {'liveStreamDiscord': 5.00}, MAIN_QUEST_PRICES = {'mainQuestBaseGame': 40.00, 'brimstoneSandsMainQuest': 12.00, 'elysianWildsMainQuest': 12.00, 'allMainAndSideQuestsAnyTerritory': 25.00, 'skillProgressionQuestLineFishing': 45.00}, MAIN_QUEST_EXTRAS_PRICES = {'liveStreamDiscord': 5.00}, FACTION_REPUTATION_PRICES = {'rank1': 2.00, 'rank2': 5.00, 'rank3': 9.00, 'rank4': 12.00, 'rank5': 15.00, 'rank1to5Discount': 25.00}, FACTION_REPUTATION_EXTRAS_PRICES = {'liveStreamDiscord': 5.00};

// A robust, visual-only checkbox component that relies on state, not CSS pseudo-elements.
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

const NewWorldOffersPage = () => {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [isProcessingPayment, setIsProcessingPayment] = useState(false);
    
    // Default active service state
    const [activeService, setActiveService] = useState('powerLeveling');
    
    // States for Power Leveling service
    const [currentLevel, setCurrentLevel] = useState(1);
    const [desiredLevel, setDesiredLevel] = useState(65);
    const [worldType, setWorldType] = useState('Seasonal World');
    const [powerLevelingExtras, setPowerLevelingExtras] = useState([]);
    const [powerLevelingPrice, setPowerLevelingPrice] = useState(0);

    // States for Artifacts service
    const [selectedArtifact, setSelectedArtifact] = useState('');
    const [artifactBoostOption, setArtifactBoostOption] = useState([]);
    const [completionSpeed, setCompletionSpeed] = useState(null);
    const [artifactTotalPrice, setArtifactTotalPrice] = useState(0);

    // States for Gorgon Raid service
    const [gorgonBosses, setGorgonBosses] = useState('1');
    const [gorgonExtras, setGorgonExtras] = useState([]);
    const [gorgonPrice, setGorgonPrice] = useState(0);

    // States for Expedition Runs service
    const [selectedRuns, setSelectedRuns] = useState(1);
    const [selectedDungeon, setSelectedDungeon] = useState('');
    const [selectedMutationLevel, setSelectedMutationLevel] = useState('');
    const [expeditionExtras, setExpeditionExtras] = useState([]);
    const [expeditionPrice, setExpeditionPrice] = useState(0);

    // States for Elite Chest Runs service
    const [eliteChestDays, setEliteChestDays] = useState(1);
    const [eliteChestExtras, setEliteChestExtras] = useState([]);
    const [eliteChestPrice, setEliteChestPrice] = useState(0);

    // States for Weapon Mastery service
    const [selectedWeaponType, setSelectedWeaponType] = useState('');
    const [currentWeaponLevel, setCurrentWeaponLevel] = useState(1);
    const [desiredWeaponLevel, setDesiredWeaponLevel] = useState(20);
    const [weaponMasteryExtras, setWeaponMasteryExtras] = useState([]);
    const [weaponMasteryPrice, setWeaponMasteryPrice] = useState(0);

    // States for PvP Rewards Track service
    const [currentPvpTrack, setCurrentPvpTrack] = useState(1);
    const [desiredPvpTrack, setDesiredPvpTrack] = useState(200);
    const [pvpExtras, setPvpExtras] = useState([]);
    const [pvpTrackPrice, setPvpTrackPrice] = useState(0);

    // States for Main Quests service
    const [selectedMainQuests, setSelectedMainQuests] = useState([]);
    const [mainQuestExtras, setMainQuestExtras] = useState([]);
    const [mainQuestPrice, setMainQuestPrice] = useState(0);
    
    // States for Faction Reputation service
    const [selectedFactionReputationLevels, setSelectedFactionReputationLevels] = useState([]);
    const [factionReputationExtras, setFactionReputationExtras] = useState([]);
    const [factionReputationPrice, setFactionReputationPrice] = useState(0);

    // --- Price calculation effects ---
    // Calculate Power Leveling price
    useEffect(() => {
        const levelDifference = desiredLevel - currentLevel;
        let calculatedPrice = 0;
        if (levelDifference > 0) {
            for (let i = currentLevel; i < desiredLevel; i++) {
                let levelPrice = 0;
                if (i >= 30 && i <= 39) levelPrice = (worldType === 'Regular World' ? PRICE_30_40_REGULAR : PRICE_30_40_SEASONAL) / LEVELS_IN_30_40_RANGE;
                else if (i >= 60 && i <= 64) levelPrice = (worldType === 'Regular World' ? PRICE_60_65_REGULAR : PRICE_60_65_SEASONAL) / LEVELS_IN_60_65_RANGE;
                else levelPrice = (worldType === 'Regular World' ? PRICE_PER_LEVEL_VARIABLE_REGULAR : PRICE_PER_LEVEL_VARIABLE_SEASONAL);
                calculatedPrice += levelPrice;
            }
            if (levelDifference === 1 && calculatedPrice < MIN_PRICE_PER_ONE_LEVEL) calculatedPrice = MIN_PRICE_PER_ONE_LEVEL;
        }
        powerLevelingExtras.forEach(extra => calculatedPrice += POWER_LEVELING_EXTRAS_PRICES[extra]);
        setPowerLevelingPrice((calculatedPrice * PILOTED_MULTIPLIER).toFixed(2));
    }, [currentLevel, desiredLevel, worldType, powerLevelingExtras]);

    // Calculate Artifacts price
    useEffect(() => {
        let price = 0;
        if (selectedArtifact && ARTIFACT_PRICES[selectedArtifact]) price += ARTIFACT_PRICES[selectedArtifact];
        artifactBoostOption.forEach(option => { if (ARTIFACT_BOOST_OPTIONS_PRICES[option]) price += ARTIFACT_BOOST_OPTIONS_PRICES[option]; });
        if (completionSpeed && ARTIFACT_COMPLETION_SPEED_PRICES[completionSpeed]) price += ARTIFACT_COMPLETION_SPEED_PRICES[completionSpeed];
        setArtifactTotalPrice(price.toFixed(2));
    }, [selectedArtifact, artifactBoostOption, completionSpeed]);
    
    // Calculate Gorgon Raid price
    useEffect(() => {
        let price = GORGON_BOSS_PRICES[gorgonBosses] || 0;
        gorgonExtras.forEach(extra => price += GORGON_EXTRAS_PRICES[extra]);
        setGorgonPrice((price * PILOTED_MULTIPLIER).toFixed(2));
    }, [gorgonBosses, gorgonExtras]);

    // Calculate Expedition Runs price
    useEffect(() => {
        let price = selectedRuns * PRICE_PER_RUN;
        if (selectedDungeon && DUNGEON_PRICES[selectedDungeon]) price += DUNGEON_PRICES[selectedDungeon];
        if (selectedMutationLevel && MUTATION_LEVEL_PRICES[selectedMutationLevel]) price += MUTATION_LEVEL_PRICES[selectedMutationLevel];
        expeditionExtras.forEach(extra => price += EXPEDITION_EXTRAS_PRICES[extra]);
        setExpeditionPrice((price * PILOTED_MULTIPLIER).toFixed(2));
    }, [selectedRuns, selectedDungeon, selectedMutationLevel, expeditionExtras]);
    
    // Calculate Elite Chest Runs price
    useEffect(() => {
        let price = eliteChestDays * PRICE_PER_ELITE_CHEST_DAY;
        eliteChestExtras.forEach(extra => price += ELITE_CHEST_EXTRAS_PRICES[extra]);
        setEliteChestPrice((price * PILOTED_MULTIPLIER).toFixed(2));
    }, [eliteChestDays, eliteChestExtras]);

    // Calculate Weapon Mastery price
    useEffect(() => {
        let calculatedPrice = 0;
        const levelDifference = desiredWeaponLevel - currentWeaponLevel;
        if (currentWeaponLevel === 19 && desiredWeaponLevel === 20) calculatedPrice = 9.00;
        else if (currentWeaponLevel === 18 && desiredWeaponLevel === 20) calculatedPrice = 9.00;
        else if (currentWeaponLevel === 17 && desiredWeaponLevel === 20) calculatedPrice = 9.00;
        else if (currentWeaponLevel === 16 && desiredWeaponLevel === 20) calculatedPrice = 9.00;
        else if (currentWeaponLevel === 15 && desiredWeaponLevel === 20) calculatedPrice = 9.00;
        else if (currentWeaponLevel === 14 && desiredWeaponLevel === 20) calculatedPrice = 10.00;
        else if (currentWeaponLevel === 13 && desiredWeaponLevel === 20) calculatedPrice = 11.00;
        else if (currentWeaponLevel >= 10 && currentWeaponLevel <= 12 && desiredWeaponLevel === 20) calculatedPrice = 12.00;
        else if (currentWeaponLevel >= 2 && currentWeaponLevel <= 9 && desiredWeaponLevel === 20) calculatedPrice = 13.00;
        else if (currentWeaponLevel === 1 && desiredWeaponLevel === 20) calculatedPrice = 14.00; 
        else {
            const defaultPricePerLevel = 0.50;
            calculatedPrice = levelDifference * defaultPricePerLevel;
        }
        weaponMasteryExtras.forEach(extra => {
            if (WEAPON_MASTERY_EXTRAS_PRICES[extra]) {
                calculatedPrice += WEAPON_MASTERY_EXTRAS_PRICES[extra];
            }
        });
        setWeaponMasteryPrice((calculatedPrice * PILOTED_MULTIPLIER).toFixed(2));
    }, [currentWeaponLevel, desiredWeaponLevel, weaponMasteryExtras]);

    // Calculate PvP Rewards Track price
    useEffect(() => {
        const trackDifference = desiredPvpTrack - currentPvpTrack;
        let calculatedPrice = 0;
        let pricePerLevel = pvpExtras.includes('forceBelow60Price') ? PVP_TRACK_PRICE_BELOW_60_TOTAL : PVP_TRACK_BASE_PRICE_PER_LEVEL;
        if (trackDifference > 0) calculatedPrice = trackDifference * pricePerLevel;
        pvpExtras.forEach(extra => { if (extra !== 'forceBelow60Price') calculatedPrice += PVP_EXTRAS_PRICES[extra]; });
        setPvpTrackPrice((calculatedPrice * PILOTED_MULTIPLIER).toFixed(2));
    }, [currentPvpTrack, desiredPvpTrack, pvpExtras]);
    
    // Calculate Main Quests price
    useEffect(() => {
        let price = 0;
        selectedMainQuests.forEach(quest => { if (MAIN_QUEST_PRICES[quest]) price += MAIN_QUEST_PRICES[quest]; });
        mainQuestExtras.forEach(extra => price += MAIN_QUEST_EXTRAS_PRICES[extra]);
        setMainQuestPrice((price * PILOTED_MULTIPLIER).toFixed(2));
    }, [selectedMainQuests, mainQuestExtras]);

    // Calculate Faction Reputation price
    useEffect(() => {
        let price = 0;
        if (selectedFactionReputationLevels.includes('rank1to5Discount')) {
            price = FACTION_REPUTATION_PRICES['rank1to5Discount'];
        } else {
            selectedFactionReputationLevels.forEach(level => { if (FACTION_REPUTATION_PRICES[level]) price += FACTION_REPUTATION_PRICES[level]; });
        }
        factionReputationExtras.forEach(extra => price += FACTION_REPUTATION_EXTRAS_PRICES[extra]);
        setFactionReputationPrice((price * PILOTED_MULTIPLIER).toFixed(2));
    }, [selectedFactionReputationLevels, factionReputationExtras]);

    // --- Helper functions for handling changes ---
    const handleExtraChange = (setter) => (e) => {
        const { value, checked } = e.target;
        setter(prev => checked ? [...prev, value] : prev.filter(item => item !== value));
    };
    
    const handlePowerLevelingExtraChange = handleExtraChange(setPowerLevelingExtras);
    const handleArtifactBoostOptionChange = handleExtraChange(setArtifactBoostOption);
    const handleGorgonExtraChange = handleExtraChange(setGorgonExtras);
    const handleExpeditionExtraChange = handleExtraChange(setExpeditionExtras);
    const handleEliteChestExtraChange = handleExtraChange(setEliteChestExtras);
    const handleWeaponMasteryExtraChange = handleExtraChange(setWeaponMasteryExtras);
    const handlePvpExtraChange = handleExtraChange(setPvpExtras);
    const handleMainQuestChange = handleExtraChange(setSelectedMainQuests);
    const handleFactionReputationExtraChange = handleExtraChange(setFactionReputationExtras);
    const handleMainQuestExtraChange = handleExtraChange(setMainQuestExtras);

    const handleFactionReputationChange = useCallback((e) => {
        const { value, checked } = e.target;
        setSelectedFactionReputationLevels(prev => {
            if (value === 'rank1to5Discount' && checked) return ['rank1to5Discount'];
            if (value === 'rank1to5Discount' && !checked) return [];
            const newSelection = prev.filter(item => item !== 'rank1to5Discount');
            return checked ? [...newSelection, value] : newSelection.filter(item => item !== value);
        });
    }, []);

    // Define services list with icons (SVG)
    const services = [
        { id: 'powerLeveling', name: 'Power Leveling', icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="currentColor" class="w-6 h-6"><path d="M256 0c-17.7 0-32 14.3-32 32V256c0 17.7 14.3 32 32 32s32-14.3 32-32V32c0-17.7-14.3-32-32-32zM128 192a128 128 0 1 0 256 0 128 128 0 10-256 0zM512 416c0 35.3-28.7 64-64 64H64c-35.3 0-64-28.7-64-64V352c0-17.7 14.3-32 32-32s32 14.3 32 32v64H448V352c0-17.7 14.3-32 32-32s32 14.3 32 32v64z"/></svg>` },
        { id: 'artifacts', name: 'Artifacts', icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="currentColor" class="w-6 h-6"><path d="M226.5 9.4c1.7-6.2 2.9-10.9 2.9-10.9S234.4 0 256 0s26.6 4.6 26.6 4.6c0 0 1.2 4.7 2.9 10.9L384 192l128 0c17.7 0 32 14.3 32 32s-14.3 32-32 32l-128 0-64 192c-1.7 6.2-2.9 10.9-2.9 10.9s-4.6 4.6-26.6 4.6s-26.6-4.6-26.6-4.6c0 0-1.2-4.7-2.9-10.9L128 256 0 256c-17.7 0-32-14.3-32-32s14.3-32 32-32l128 0L226.5 9.4z"/></svg>` },
        { id: 'gorgonRaid', name: 'Gorgon Raid', icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="currentColor" class="w-6 h-6"><path d="M256 0C114.6 0 0 114.6 0 256S114.6 512 256 512s256-114.6 256-256S397.4 0 256 0zM128 256a32 32 0 1 1 64 0 32 32 0 1 1-64 0zm192 0a32 32 0 1 1 64 0 32 32 0 1 1-64 0zM256 320c-35.3 0-64-28.7-64-64s28.7-64 64-64 64 28.7 64 64-28.7 64-64 64z"/></svg>` },
        { id: 'expeditionRuns', name: 'Expedition Runs', icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="currentColor" class="w-6 h-6"><path d="M32 32C14.3 32 0 46.3 0 64v96c0 17.7 14.3 32 32 32H64V416c0 17.7 14.3 32 32 32H416c17.7 0 32-14.3 32-32V192h32c17.7 0 32-14.3 32-32V64c0-17.7-14.3-32-32-32H32zM128 288a32 32 0 1 1 0-64 32 32 0 1 1 0 64zm224 0a32 32 0 1 1 0-64 32 32 0 1 1 0 64z"/></svg>` },
        { id: 'eliteChestRuns', name: 'Elite Chest Runs', icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 512" fill="currentColor" class="w-6 h-6"><path d="M576 160H64C28.7 160 0 188.7 0 224V448c0 35.3 28.7 64 64 64H576c35.3 0 64-28.7 64-64V224c0-35.3-28.7-64-64-64zM128 288a32 32 0 1 1 0-64 32 32 0 1 1 0 64zm384-32a32 32 0 1 1 0 64 32 32 0 1 1 0-64zM64 96H576c35.3 0 64-28.7 64-64S600.7 0 576 0H64C28.7 0 0 28.7 0 64S28.7 96 64 96z"/></svg>` },
        { id: 'weaponMastery', name: 'Weapon Mastery', icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512" fill="currentColor" class="w-6 h-6"><path d="M573.7 206.6L372.4 39.5c-2.4-2.4-5.4-3.5-8.5-3.5s-6.1 1.1-8.5 3.5L150.3 244.7c-2.4 2.4-3.5 5.4-3.5 8.5s1.1 6.1 3.5 8.5L351.6 472.5c2.4 2.4 5.4 3.5 8.5 3.5s6.1-1.1 8.5-3.5L573.7 223.6c2.4-2.4 3.5-5.4 3.5-8.5s-1.1-6.1-3.5-8.5zM128 32c-17.7 0-32 14.3-32 32V96H64C28.7 96 0 124.7 0 160v32c0 17.7 14.3 32 32 32h64v64c0 17.7 14.3 32 32 32h32c17.7 0 32-14.3 32-32V256h64c17.7 0 32-14.3 32-32V160c0-17.7-14.3-32-32-32H160V64c0-17.7-14.3-32-32-32z"/></svg>` },
        { id: 'pvpRewardsTrack', name: 'PvP Rewards', icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="currentColor" class="w-6 h-6"><path d="M256 0c-17.7 0-32 14.3-32 32V256c0 17.7 14.3 32 32 32s32-14.3 32-32V32c0-17.7-14.3-32-32-32zM128 192a128 128 0 1 0 256 0 128 128 0 10-256 0zM512 416c0 35.3-28.7 64-64 64H64c-35.3 0-64-28.7-64-64V352c0-17.7 14.3-32 32-32s32 14.3 32 32v64H448V352c0-17.7 14.3-32 32-32s32 14.3 32 32v64z"/></svg>` },
        { id: 'mainQuests', name: 'Main Quests', icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512" fill="currentColor" class="w-6 h-6"><path d="M0 64C0 28.7 28.7 0 64 0H224V128c0 17.7 14.3 32 32 32H384V448c0 35.3-28.7 64-64 64H64c-35.3 0-64-28.7-64-64V64zm384 64H256V0L384 128z"/></svg>` },
        { id: 'factionReputation', name: 'Faction Reputation', icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="currentColor" class="w-6 h-6"><path d="M0 416c0 35.3 28.7 64 64 64H448c35.3 0 64-28.7 64-64V96H0V416zM320 256c0-17.7 14.3-32 32-32s32 14.3 32 32v64c0 17.7-14.3 32-32 32s-32-14.3-32-32V256zM160 256c0-17.7 14.3-32 32-32s32 14.3 32 32v64c0 17.7-14.3 32-32 32s-32-14.3-32-32V256zM0 64C0 28.7 28.7 0 64 0H448c35.3 0 64 28.7 64 64V96H0V64z"/></svg>` },
    ];

    // Function to display content for the active service
    const renderServiceContent = () => {
        switch (activeService) {
            case 'powerLeveling':
                return (
                    <div className="space-y-8">
                        <h3 className="text-4xl font-black text-white">Power Leveling</h3>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center text-lg"><span className="text-gray-400">Current Level:</span><span className="font-bold text-white">{currentLevel}</span></div>
                            <input type="range" min="1" max="64" value={currentLevel} onChange={(e) => setCurrentLevel(Math.min(Number(e.target.value), desiredLevel - 1))} className="w-full h-2 bg-zinc-700 rounded-lg appearance-none cursor-pointer range-thumb" />
                        </div>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center text-lg"><span className="text-gray-400">Desired Level:</span><span className="font-bold text-white">{desiredLevel}</span></div>
                            <input type="range" min="2" max="65" value={desiredLevel} onChange={(e) => setDesiredLevel(Math.max(Number(e.target.value), currentLevel + 1))} className="w-full h-2 bg-zinc-700 rounded-lg appearance-none cursor-pointer" />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <button onClick={() => setWorldType('Seasonal World')} className={`option-button ${worldType === 'Seasonal World' ? 'active' : ''}`}>Seasonal World</button>
                            <button onClick={() => setWorldType('Regular World')} className={`option-button ${worldType === 'Regular World' ? 'active' : ''}`}>Regular World</button>
                        </div>
                        <div>
                            <h4 className="text-xl font-bold text-white mb-4">Extras</h4>
                            <div className="space-y-3">
                                {Object.entries(POWER_LEVELING_EXTRAS_PRICES).map(([key, price]) => (
                                    <label key={key} className="flex items-center justify-between p-4 bg-zinc-900/50 rounded-lg border border-zinc-700 cursor-pointer hover:border-blue-500 transition-colors">
                                        <div>
                                            <span className="font-semibold text-white">{key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</span>
                                            <span className="text-purple-400 font-bold ml-2">{price > 0 ? `+$${price.toFixed(2)}` : 'Free'}</span>
                                        </div>
                                        <input type="checkbox" value={key} onChange={handlePowerLevelingExtraChange} checked={powerLevelingExtras.includes(key)} style={srOnlyStyle} />
                                        <CustomCheckboxVisual checked={powerLevelingExtras.includes(key)} />
                                    </label>
                                ))}
                            </div>
                        </div>
                    </div>
                );
            case 'artifacts':
                return (
                    <div className="space-y-8">
                        <h3 className="text-4xl font-black text-white">Artifacts</h3>
                        <div className="space-y-4">
                            <label htmlFor="artifact-select" className="text-xl font-bold text-white">Select Artifact</label>
                            <select id="artifact-select" className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-3 text-lg" value={selectedArtifact} onChange={(e) => setSelectedArtifact(e.target.value)}>
                                <option value="">-- Choose an Artifact --</option>
                                {Object.keys(ARTIFACT_PRICES).map(artifact => (
                                    <option key={artifact} value={artifact}>{artifact} - ${ARTIFACT_PRICES[artifact].toFixed(2)}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <h4 className="text-xl font-bold text-white mb-4">Boost Options</h4>
                            <div className="space-y-3">
                                {Object.entries(ARTIFACT_BOOST_OPTIONS_PRICES).map(([key, price]) => (
                                    <label key={key} className="flex items-center justify-between p-4 bg-zinc-900/50 rounded-lg border border-zinc-700 cursor-pointer hover:border-blue-500 transition-colors">
                                        <div>
                                            <span className="font-semibold text-white">{key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</span>
                                            <span className="text-purple-400 font-bold ml-2">{price > 0 ? `+$${price.toFixed(2)}` : 'Free'}</span>
                                        </div>
                                        <input type="checkbox" value={key} onChange={handleArtifactBoostOptionChange} checked={artifactBoostOption.includes(key)} style={srOnlyStyle} />
                                        <CustomCheckboxVisual checked={artifactBoostOption.includes(key)} />
                                    </label>
                                ))}
                            </div>
                        </div>
                    </div>
                );
            case 'gorgonRaid':
                return (
                    <div className="space-y-8">
                        <h3 className="text-4xl font-black text-white">Gorgon Raid</h3>
                        <p className="text-gray-400">Complete the Gorgon raid with our professional team.</p>
                        <div>
                            <h4 className="text-xl font-bold text-white mb-4">Number of Bosses</h4>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                {Object.keys(GORGON_BOSS_PRICES).map(bossCount => (
                                    <button key={bossCount} onClick={() => setGorgonBosses(bossCount)} className={`option-button ${gorgonBosses === bossCount ? 'active' : ''}`}>{bossCount} Boss</button>
                                ))}
                            </div>
                        </div>
                        <div>
                            <h4 className="text-xl font-bold text-white mb-4">Extras</h4>
                            <div className="space-y-3">
                                {Object.entries(GORGON_EXTRAS_PRICES).map(([key, price]) => (
                                    <label key={key} className="flex items-center justify-between p-4 bg-zinc-900/50 rounded-lg border border-zinc-700 cursor-pointer hover:border-blue-500 transition-colors">
                                        <div>
                                            <span className="font-semibold text-white">{key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</span>
                                            <span className="text-purple-400 font-bold ml-2">{price > 0 ? `+$${price.toFixed(2)}` : 'Free'}</span>
                                        </div>
                                        <input type="checkbox" value={key} onChange={handleGorgonExtraChange} checked={gorgonExtras.includes(key)} style={srOnlyStyle} />
                                        <CustomCheckboxVisual checked={gorgonExtras.includes(key)} />
                                    </label>
                                ))}
                            </div>
                        </div>
                    </div>
                );
            case 'expeditionRuns':
                return (
                    <div className="space-y-8">
                        <h3 className="text-4xl font-black text-white">Expedition Runs</h3>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center text-lg"><span className="text-gray-400">Number of Runs:</span><span className="font-bold text-white">{selectedRuns}</span></div>
                            <input type="range" min={MIN_RUNS} max={MAX_RUNS} value={selectedRuns} onChange={(e) => setSelectedRuns(Number(e.target.value))} className="w-full h-2 bg-zinc-700 rounded-lg appearance-none cursor-pointer range-thumb" />
                        </div>
                        <div className="space-y-4">
                            <label htmlFor="dungeon-select" className="text-xl font-bold text-white">Select Dungeon</label>
                            <select id="dungeon-select" className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-3 text-lg" value={selectedDungeon} onChange={(e) => setSelectedDungeon(e.target.value)}>
                                <option value="">-- Choose a Dungeon --</option>
                                {Object.keys(DUNGEON_PRICES).map(dungeon => (
                                    <option key={dungeon} value={dungeon}>{dungeon}</option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-4">
                            <label htmlFor="mutation-select" className="text-xl font-bold text-white">Select Mutation Level</label>
                            <select id="mutation-select" className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-3 text-lg" value={selectedMutationLevel} onChange={(e) => setSelectedMutationLevel(e.target.value)}>
                                <option value="">-- None --</option>
                                {Object.keys(MUTATION_LEVEL_PRICES).map(level => (
                                    <option key={level} value={level}>{level}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <h4 className="text-xl font-bold text-white mb-4">Extras</h4>
                            <div className="space-y-3">
                                {Object.entries(EXPEDITION_EXTRAS_PRICES).map(([key, price]) => (
                                    <label key={key} className="flex items-center justify-between p-4 bg-zinc-900/50 rounded-lg border border-zinc-700 cursor-pointer hover:border-blue-500 transition-colors">
                                        <div>
                                            <span className="font-semibold text-white">{key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</span>
                                            <span className="text-purple-400 font-bold ml-2">{price > 0 ? `+$${price.toFixed(2)}` : 'Free'}</span>
                                        </div>
                                        <input type="checkbox" value={key} onChange={handleExpeditionExtraChange} checked={expeditionExtras.includes(key)} style={srOnlyStyle} />
                                        <CustomCheckboxVisual checked={expeditionExtras.includes(key)} />
                                    </label>
                                ))}
                            </div>
                        </div>
                    </div>
                );
            case 'eliteChestRuns':
                return (
                    <div className="space-y-8">
                        <h3 className="text-4xl font-black text-white">Elite Chest Runs</h3>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center text-lg"><span className="text-gray-400">Number of Days:</span><span className="font-bold text-white">{eliteChestDays}</span></div>
                            <input type="range" min={MIN_ELITE_CHEST_DAYS} max={MAX_ELITE_CHEST_DAYS} value={eliteChestDays} onChange={(e) => setEliteChestDays(Number(e.target.value))} className="w-full h-2 bg-zinc-700 rounded-lg appearance-none cursor-pointer range-thumb" />
                        </div>
                        <div>
                            <h4 className="text-xl font-bold text-white mb-4">Extras</h4>
                            <div className="space-y-3">
                                {Object.entries(ELITE_CHEST_EXTRAS_PRICES).map(([key, price]) => (
                                    <label key={key} className="flex items-center justify-between p-4 bg-zinc-900/50 rounded-lg border border-zinc-700 cursor-pointer hover:border-blue-500 transition-colors">
                                        <div>
                                            <span className="font-semibold text-white">{key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</span>
                                            <span className="text-purple-400 font-bold ml-2">{price > 0 ? `+$${price.toFixed(2)}` : 'Free'}</span>
                                        </div>
                                        <input type="checkbox" value={key} onChange={handleEliteChestExtraChange} checked={eliteChestExtras.includes(key)} style={srOnlyStyle} />
                                        <CustomCheckboxVisual checked={eliteChestExtras.includes(key)} />
                                    </label>
                                ))}
                            </div>
                        </div>
                    </div>
                );
            case 'weaponMastery':
                return (
                    <div className="space-y-8">
                        <h3 className="text-4xl font-black text-white">Weapon Mastery</h3>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center text-lg"><span className="text-gray-400">Current Level:</span><span className="font-bold text-white">{currentWeaponLevel}</span></div>
                            <input type="range" min="1" max="19" value={currentWeaponLevel} onChange={(e) => setCurrentWeaponLevel(Math.min(Number(e.target.value), desiredWeaponLevel - 1))} className="w-full h-2 bg-zinc-700 rounded-lg appearance-none cursor-pointer range-thumb" />
                        </div>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center text-lg"><span className="text-gray-400">Desired Level:</span><span className="font-bold text-white">{desiredWeaponLevel}</span></div>
                            <input type="range" min="2" max="20" value={desiredWeaponLevel} onChange={(e) => setDesiredWeaponLevel(Math.max(Number(e.target.value), currentWeaponLevel + 1))} className="w-full h-2 bg-zinc-700 rounded-lg appearance-none cursor-pointer" />
                        </div>
                        <div className="space-y-4">
                            <label htmlFor="weapon-select" className="text-xl font-bold text-white">Select Weapon</label>
                            <select id="weapon-select" className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-3 text-lg" value={selectedWeaponType} onChange={(e) => setSelectedWeaponType(e.target.value)}>
                                <option value="">-- Choose a Weapon --</option>
                                {Object.keys(WEAPON_TYPE_PRICES).map(weapon => (
                                    <option key={weapon} value={weapon}>{weapon}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <h4 className="text-xl font-bold text-white mb-4">Extras</h4>
                            <div className="space-y-3">
                                {Object.entries(WEAPON_MASTERY_EXTRAS_PRICES).map(([key, price]) => (
                                    <label key={key} className="flex items-center justify-between p-4 bg-zinc-900/50 rounded-lg border border-zinc-700 cursor-pointer hover:border-blue-500 transition-colors">
                                        <div>
                                            <span className="font-semibold text-white">{key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</span>
                                            <span className="text-purple-400 font-bold ml-2">{price > 0 ? `+$${price.toFixed(2)}` : 'Free'}</span>
                                        </div>
                                        <input type="checkbox" value={key} onChange={handleWeaponMasteryExtraChange} checked={weaponMasteryExtras.includes(key)} style={srOnlyStyle} />
                                        <CustomCheckboxVisual checked={weaponMasteryExtras.includes(key)} />
                                    </label>
                                ))}
                            </div>
                        </div>
                    </div>
                );
            case 'pvpRewardsTrack':
                return (
                    <div className="space-y-8">
                        <h3 className="text-4xl font-black text-white">PvP Rewards Track</h3>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center text-lg"><span className="text-gray-400">Current Track:</span><span className="font-bold text-white">{currentPvpTrack}</span></div>
                            <input type="range" min="1" max="199" value={currentPvpTrack} onChange={(e) => setCurrentPvpTrack(Math.min(Number(e.target.value), desiredPvpTrack - 1))} className="w-full h-2 bg-zinc-700 rounded-lg appearance-none cursor-pointer range-thumb" />
                        </div>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center text-lg"><span className="text-gray-400">Desired Track:</span><span className="font-bold text-white">{desiredPvpTrack}</span></div>
                            <input type="range" min="2" max="200" value={desiredPvpTrack} onChange={(e) => setDesiredPvpTrack(Math.max(Number(e.target.value), currentPvpTrack + 1))} className="w-full h-2 bg-zinc-700 rounded-lg appearance-none cursor-pointer" />
                        </div>
                        <div>
                            <h4 className="text-xl font-bold text-white mb-4">Extras</h4>
                            <div className="space-y-3">
                                {Object.entries(PVP_EXTRAS_PRICES).map(([key, price]) => (
                                    <label key={key} className="flex items-center justify-between p-4 bg-zinc-900/50 rounded-lg border border-zinc-700 cursor-pointer hover:border-blue-500 transition-colors">
                                        <div>
                                            <span className="font-semibold text-white">{key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</span>
                                            <span className="text-purple-400 font-bold ml-2">{price > 0 ? `+$${price.toFixed(2)}` : 'Free'}</span>
                                        </div>
                                        <input type="checkbox" value={key} onChange={handlePvpExtraChange} checked={pvpExtras.includes(key)} style={srOnlyStyle} />
                                        <CustomCheckboxVisual checked={pvpExtras.includes(key)} />
                                    </label>
                                ))}
                            </div>
                        </div>
                    </div>
                );
            case 'mainQuests':
                return (
                    <div className="space-y-8">
                        <h3 className="text-4xl font-black text-white">Main Quests</h3>
                        <div>
                            <h4 className="text-xl font-bold text-white mb-4">Select Questlines</h4>
                            <div className="space-y-3">
                                {Object.entries(MAIN_QUEST_PRICES).map(([key, price]) => (
                                    <label key={key} className="flex items-center justify-between p-4 bg-zinc-900/50 rounded-lg border border-zinc-700 cursor-pointer hover:border-blue-500 transition-colors">
                                        <div>
                                            <span className="font-semibold text-white">{key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</span>
                                            <span className="text-purple-400 font-bold ml-2">{price > 0 ? `+$${price.toFixed(2)}` : 'Free'}</span>
                                        </div>
                                        <input type="checkbox" value={key} onChange={handleMainQuestChange} checked={selectedMainQuests.includes(key)} style={srOnlyStyle} />
                                        <CustomCheckboxVisual checked={selectedMainQuests.includes(key)} />
                                    </label>
                                ))}
                            </div>
                        </div>
                        <div>
                            <h4 className="text-xl font-bold text-white mb-4">Extras</h4>
                            <div className="space-y-3">
                                {Object.entries(MAIN_QUEST_EXTRAS_PRICES).map(([key, price]) => (
                                    <label key={key} className="flex items-center justify-between p-4 bg-zinc-900/50 rounded-lg border border-zinc-700 cursor-pointer hover:border-blue-500 transition-colors">
                                        <div>
                                            <span className="font-semibold text-white">{key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</span>
                                            <span className="text-purple-400 font-bold ml-2">{price > 0 ? `+$${price.toFixed(2)}` : 'Free'}</span>
                                        </div>
                                        <input type="checkbox" value={key} onChange={handleMainQuestExtraChange} checked={mainQuestExtras.includes(key)} style={srOnlyStyle} />
                                        <CustomCheckboxVisual checked={mainQuestExtras.includes(key)} />
                                    </label>
                                ))}
                            </div>
                        </div>
                    </div>
                );
            case 'factionReputation':
                return (
                    <div className="space-y-8">
                        <h3 className="text-4xl font-black text-white">Faction Reputation</h3>
                        <div>
                            <h4 className="text-xl font-bold text-white mb-4">Select Rank</h4>
                            <div className="space-y-3">
                                {Object.entries(FACTION_REPUTATION_PRICES).map(([key, price]) => (
                                    <label key={key} className="flex items-center justify-between p-4 bg-zinc-900/50 rounded-lg border border-zinc-700 cursor-pointer hover:border-blue-500 transition-colors">
                                        <div>
                                            <span className="font-semibold text-white">{key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</span>
                                            <span className="text-purple-400 font-bold ml-2">{price > 0 ? `+$${price.toFixed(2)}` : 'Free'}</span>
                                        </div>
                                        <input type="checkbox" value={key} onChange={handleFactionReputationChange} checked={selectedFactionReputationLevels.includes(key)} style={srOnlyStyle} />
                                        <CustomCheckboxVisual checked={selectedFactionReputationLevels.includes(key)} />
                                    </label>
                                ))}
                            </div>
                        </div>
                        <div>
                            <h4 className="text-xl font-bold text-white mb-4">Extras</h4>
                            <div className="space-y-3">
                                {Object.entries(FACTION_REPUTATION_EXTRAS_PRICES).map(([key, price]) => (
                                    <label key={key} className="flex items-center justify-between p-4 bg-zinc-900/50 rounded-lg border border-zinc-700 cursor-pointer hover:border-blue-500 transition-colors">
                                        <div>
                                            <span className="font-semibold text-white">{key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</span>
                                            <span className="text-purple-400 font-bold ml-2">{price > 0 ? `+$${price.toFixed(2)}` : 'Free'}</span>
                                        </div>
                                        <input type="checkbox" value={key} onChange={handleFactionReputationExtraChange} checked={factionReputationExtras.includes(key)} style={srOnlyStyle} />
                                        <CustomCheckboxVisual checked={factionReputationExtras.includes(key)} />
                                    </label>
                                ))}
                            </div>
                        </div>
                    </div>
                );
            default:
                return <div className="text-center py-10"><p className="text-xl text-gray-400">Select a service from the menu above.</p></div>;
        }
    };



    // Helper functions for the unified payment system
    const getCurrentPrice = () => {
        switch (activeService) {
            case 'powerLeveling': return powerLevelingPrice;
            case 'artifacts': return artifactTotalPrice;
            case 'gorgonRaid': return gorgonPrice;
            case 'expeditionRuns': return expeditionPrice;
            case 'eliteChestRuns': return eliteChestPrice;
            case 'weaponMastery': return weaponMasteryPrice;
            case 'pvpRewardsTrack': return pvpTrackPrice;
            case 'mainQuests': return mainQuestPrice;
            case 'factionReputation': return factionReputationPrice;
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
                    const extrasText = powerLevelingExtras.map(extra => 
                        extra.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())
                    ).join(', ');
                    details += ` + ${extrasText}`;
                }
                return details;
            }
            case 'artifacts': {
                let details = selectedArtifact || 'Artifact';
                if (artifactBoostOption.length > 0) {
                    const extrasText = artifactBoostOption.map(extra => 
                        extra.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())
                    ).join(', ');
                    details += ` + ${extrasText}`;
                }
                return details;
            }
            case 'gorgonRaid': {
                let details = `${gorgonBosses} Bosses`;
                if (gorgonExtras.length > 0) {
                    const extrasText = gorgonExtras.map(extra => 
                        extra.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())
                    ).join(', ');
                    details += ` + ${extrasText}`;
                }
                return details;
            }
            case 'expeditionRuns': {
                let details = `${selectedRuns} Run(s)`;
                if (expeditionExtras.length > 0) {
                    const extrasText = expeditionExtras.map(extra => 
                        extra.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())
                    ).join(', ');
                    details += ` + ${extrasText}`;
                }
                return details;
            }
            case 'eliteChestRuns': {
                let details = `${eliteChestDays} Day(s)`;
                if (eliteChestExtras.length > 0) {
                    const extrasText = eliteChestExtras.map(extra => 
                        extra.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())
                    ).join(', ');
                    details += ` + ${extrasText}`;
                }
                return details;
            }
            case 'weaponMastery': {
                let details = `Level ${currentWeaponLevel} to ${desiredWeaponLevel}`;
                if (weaponMasteryExtras.length > 0) {
                    const extrasText = weaponMasteryExtras.map(extra => 
                        extra.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())
                    ).join(', ');
                    details += ` + ${extrasText}`;
                }
                return details;
            }
            case 'pvpRewardsTrack': {
                let details = `Track ${currentPvpTrack} to ${desiredPvpTrack}`;
                if (pvpExtras.length > 0) {
                    const extrasText = pvpExtras.map(extra => 
                        extra.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())
                    ).join(', ');
                    details += ` + ${extrasText}`;
                }
                return details;
            }
            case 'mainQuests': {
                let details = `Selected Quests`;
                if (mainQuestExtras.length > 0) {
                    const extrasText = mainQuestExtras.map(extra => 
                        extra.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())
                    ).join(', ');
                    details += ` + ${extrasText}`;
                }
                return details;
            }
            case 'factionReputation': {
                let details = 'Faction Reputation';
                if (selectedFactionReputationLevels.length > 0) {
                    const ranksText = selectedFactionReputationLevels.map(rank => 
                        rank.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())
                    ).join(', ');
                    details += ` - ${ranksText}`;
                }
                if (factionReputationExtras.length > 0) {
                    const extrasText = factionReputationExtras.map(extra => 
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
                    background-image: url('/images/games/newworld.png');
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
                        <h1 className="text-5xl md:text-7xl font-extrabold mb-4 text-glow">Elevate Your New World Journey</h1>
                        <p className="text-lg md:text-xl max-w-3xl mx-auto text-gray-300">
                            Discover professional boosting and account services tailored for Aeternum. Safe, fast, and reliable.
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
                                gameName="New World"
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

export default NewWorldOffersPage;
