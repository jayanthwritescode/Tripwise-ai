
import React, { useState, useEffect, useRef } from 'react';
import { Plane, Building, ExternalLink, Search, MapPin, Check, Plus, Star, ChevronDown, ChevronUp, Clock, Milestone, Wallet, Sparkles, Quote, Info, RefreshCw, Coffee, Map, Loader2, Coins, Gem } from 'lucide-react';
import { searchTravelData, getDestinationSuggestions } from '../services/gemini';
import { SearchResult, FlightInfo, HotelInfo } from '../types';

interface SearchWidgetProps {
  destination: string;
  startDate: string;
  onSelectFlight?: (flight: FlightInfo) => void;
  selectedFlight?: FlightInfo;
  onSelectHotel?: (hotel: HotelInfo) => void;
  selectedHotel?: HotelInfo;
}

const parseFieldValue = (section: string, key: string): string => {
  // Regex looks for KEY: with optional markdown bolding or surrounding whitespace
  const pattern = new RegExp(`(?:^|\\n)\\s*\\*?\\*?${key}\\*?\\*?\\s*:\\s*(.+)`, 'i');
  const match = section.match(pattern);
  if (match && match[1]) {
    return match[1].replace(/[*_#`]/g, '').trim();
  }
  return '';
};

const PremiumResultCard: React.FC<{ 
  section: string; 
  onSelect?: (details: string) => void;
  type: 'flights' | 'hotels';
}> = ({ section, onSelect, type }) => {
  const [showDetails, setShowDetails] = useState(false);
  
  const name = parseFieldValue(section, 'NAME') || (type === 'flights' ? 'Curated Flight Option' : 'Recommended Stay');
  const price = parseFieldValue(section, 'PRICE') || "Check Provider";
  const rating = parseFieldValue(section, 'RATING') || "4.5/5";
  const duration = parseFieldValue(section, 'DURATION') || "Direct / Optimal";
  const stops = parseFieldValue(section, 'STOPS') || "Non-stop";
  const times = parseFieldValue(section, 'TIMES');
  const layovers = parseFieldValue(section, 'LAYOVERS');
  const amenities = parseFieldValue(section, 'AMENITIES');
  const context = parseFieldValue(section, 'CONTEXT');
  const tag = parseFieldValue(section, 'TAG') || (type === 'flights' ? 'Top Route' : 'Curated Stay');
  const reasoning = parseFieldValue(section, 'REASONING');

  return (
    <div className="group bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-2xl hover:border-indigo-100 transition-all flex flex-col h-full animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex justify-between items-start gap-4 mb-6">
        <div className="space-y-2.5">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#1E1B4B] text-white rounded-lg text-[10px] font-extrabold uppercase tracking-widest shadow-sm">
            <Sparkles className="w-2.5 h-2.5" /> {tag}
          </div>
          <h4 className="text-2xl font-editorial italic text-[#1E1B4B] leading-tight group-hover:text-indigo-600 transition-colors">
            {name}
          </h4>
        </div>
        <div className="text-right">
          <div className="text-2xl font-black text-[#1E1B4B] leading-none mb-1">{price}</div>
          <div className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-slate-400">Expected</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-8">
        {type === 'flights' ? (
          <>
            <div className="flex items-center gap-2.5 text-slate-600">
              <Clock className="w-4 h-4 text-indigo-400" />
              <span className="text-[13px] font-bold">{duration}</span>
            </div>
            <div className="flex items-center gap-2.5 text-slate-600">
              <Milestone className="w-4 h-4 text-indigo-400" />
              <span className="text-[13px] font-bold">{stops}</span>
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center gap-2.5 text-slate-600">
              <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
              <span className="text-[13px] font-bold">{rating}</span>
            </div>
            <div className="flex items-center gap-2.5 text-slate-600">
              <MapPin className="w-4 h-4 text-indigo-400" />
              <span className="text-[13px] font-bold">Verified Locale</span>
            </div>
          </>
        )}
      </div>

      {reasoning && (
        <div className="mb-8 p-6 bg-indigo-50/50 rounded-2xl border border-indigo-100/30">
          <div className="flex items-start gap-3">
            <Quote className="w-4 h-4 text-indigo-400 shrink-0 mt-1 rotate-180" />
            <p className="text-[14.5px] text-[#1E1B4B] font-medium leading-relaxed italic opacity-90">
              {reasoning}
            </p>
          </div>
        </div>
      )}

      <div className="mt-auto space-y-4">
        <div className={`overflow-hidden transition-all duration-500 ${showDetails ? 'max-h-[600px] opacity-100 mb-6' : 'max-h-0 opacity-0'}`}>
          <div className="pt-5 border-t border-gray-100/60 space-y-6">
             {type === 'flights' ? (
               <div className="space-y-6">
                 {times && (
                   <div className="space-y-2">
                     <div className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                       <Clock className="w-3 h-3" /> Scheduled Times
                     </div>
                     <p className="text-[15px] font-bold text-[#1E1B4B]">{times}</p>
                   </div>
                 )}
                 {layovers && (
                   <div className="space-y-2">
                     <div className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                       <Map className="w-3 h-3" /> Journey Log
                     </div>
                     <p className="text-sm text-slate-600 leading-relaxed font-medium">
                       {layovers === 'None' ? 'Direct flight: No scheduled stops.' : layovers}
                     </p>
                   </div>
                 )}
                 {amenities && (
                   <div className="space-y-2">
                     <div className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                       <Coffee className="w-3 h-3" /> Cabin Experience
                     </div>
                     <p className="text-sm text-slate-600 leading-relaxed font-medium">
                       {amenities}
                     </p>
                   </div>
                 )}
               </div>
             ) : (
               <div className="space-y-4">
                 <div className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <Info className="w-3 h-3" /> Provider Context
                 </div>
                 <p className="text-sm text-slate-600 leading-loose font-medium bg-slate-50 p-4 rounded-xl border border-slate-100">
                   {context || section.split('\n').filter(l => !l.includes(':')).join(' ').trim() || "Discovery data is still being verified by our curation engine."}
                 </p>
               </div>
             )}
          </div>
        </div>

        <div className="flex gap-2.5">
          <button
            onClick={() => onSelect?.(section)}
            className="flex-1 py-4.5 rounded-2xl bg-[#1E1B4B] text-white font-bold text-[14px] hover:bg-black transition-all flex items-center justify-center gap-2 shadow-lg active:scale-95"
          >
            <Plus className="w-4.5 h-4.5" /> Add to Plan
          </button>
          <button
            onClick={() => setShowDetails(!showDetails)}
            className={`px-5 py-4.5 rounded-2xl border font-bold text-sm transition-all flex items-center justify-center gap-2 ${
              showDetails ? 'bg-slate-50 border-slate-200 text-[#1E1B4B]' : 'bg-white border-slate-100 text-slate-400 hover:border-indigo-100'
            }`}
          >
            {showDetails ? <ChevronUp className="w-4.5 h-4.5" /> : <ChevronDown className="w-4.5 h-4.5" />}
          </button>
        </div>
      </div>
    </div>
  );
};

const SearchWidget: React.FC<SearchWidgetProps> = ({ destination, startDate, onSelectFlight, selectedFlight, onSelectHotel, selectedHotel }) => {
  const [activeTab, setActiveTab] = useState<'flights' | 'hotels'>('flights');
  const [tripType, setTripType] = useState<'round' | 'one-way'>('round');
  const [budgetTier, setBudgetTier] = useState<'Value' | 'Standard' | 'Luxury'>('Standard');
  const [currency, setCurrency] = useState('INR');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SearchResult | null>(null);
  const [originCity, setOriginCity] = useState('');
  const [loadingMsg, setLoadingMsg] = useState('');

  // Autocomplete state for Origin City
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isSearchingOrigin, setIsSearchingOrigin] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1);
  const searchTimeoutRef = useRef<any>(null);
  const lastSelectedOriginRef = useRef<string | null>(null);

  const currencies = ['INR', 'USD', 'EUR', 'GBP', 'AED', 'SGD', 'JPY'];

  const messages = [
    "Analyzing transport networks...",
    "Verifying live availability...",
    "Cross-referencing traveler feedback...",
    "Synthesizing the best options...",
    "Finalizing recommendations..."
  ];

  useEffect(() => {
    let interval: any;
    if (loading) {
      let idx = 0;
      setLoadingMsg(messages[0]);
      interval = setInterval(() => {
        idx = (idx + 1) % messages.length;
        setLoadingMsg(messages[idx]);
      }, 2000);
    }
    return () => clearInterval(interval);
  }, [loading]);

  // Autocomplete logic for originCity
  useEffect(() => {
    if (originCity === lastSelectedOriginRef.current) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    if (originCity.trim().length >= 2 && activeTab === 'flights') {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
      
      // Reduced debounce for faster feel (200ms)
      searchTimeoutRef.current = setTimeout(async () => {
        setIsSearchingOrigin(true);
        try {
          const results = await getDestinationSuggestions(originCity);
          if (activeTab === 'flights') {
            setSuggestions(results);
            setShowSuggestions(results.length > 0);
          }
        } finally {
          setIsSearchingOrigin(false);
        }
      }, 200);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }

    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, [originCity, activeTab]);

  const handleSearch = async () => {
    if (activeTab === 'flights' && !originCity) return;
    
    setLoading(true);
    setResults(null);
    try {
      let query = '';
      if (activeTab === 'flights') {
        query = `${tripType} flights from ${originCity} to ${destination} for ${startDate}`;
      } else {
        const tierInstructions: Record<string, string> = {
          Value: "budget-friendly, affordable hotels, high-rated hostels, or guesthouses under standard rates",
          Standard: "comfortable 3-star and 4-star boutique hotels with excellent reviews",
          Luxury: "5-star luxury hotels, 5-star iconic resorts, and world-class luxury accommodations"
        };
        query = `${tierInstructions[budgetTier]} in ${destination} for ${startDate} showing prices in ${currency}`;
      }
      
      const data = await searchTravelData(query, activeTab === 'flights');
      setResults(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const selectOriginSuggestion = (suggestion: string) => {
    lastSelectedOriginRef.current = suggestion;
    setOriginCity(suggestion);
    setSuggestions([]);
    setShowSuggestions(false);
    setActiveSuggestionIndex(-1);
  };

  const handleOriginKeyDown = (e: React.KeyboardEvent) => {
    if (showSuggestions) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveSuggestionIndex(prev => Math.min(prev + 1, suggestions.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveSuggestionIndex(prev => Math.max(prev - 1, 0));
      } else if (e.key === 'Enter') {
        if (activeSuggestionIndex >= 0) {
          e.preventDefault();
          selectOriginSuggestion(suggestions[activeSuggestionIndex]);
        }
      } else if (e.key === 'Escape') {
        setShowSuggestions(false);
      }
    }
  };

  const handleAttachOption = (section: string) => {
    if (activeTab === 'flights') {
      const flight: FlightInfo = {
        airline: parseFieldValue(section, 'NAME') || 'Curated Flight Option',
        duration: parseFieldValue(section, 'DURATION') || 'Direct',
        stops: parseFieldValue(section, 'STOPS') || 'Non-stop',
        priceRange: parseFieldValue(section, 'PRICE') || 'Check Provider',
        times: parseFieldValue(section, 'TIMES'),
        layoverDetails: parseFieldValue(section, 'LAYOVERS'),
        amenities: parseFieldValue(section, 'AMENITIES'),
        details: section
      };
      onSelectFlight?.(flight);
    } else {
      const hotel: HotelInfo = {
        name: parseFieldValue(section, 'NAME') || 'Recommended Stay',
        rating: parseFieldValue(section, 'RATING') || '4.5/5',
        priceRange: parseFieldValue(section, 'PRICE') || 'Check Provider',
        highlight: parseFieldValue(section, 'TAG') || 'Curated Stay',
        details: section
      };
      onSelectHotel?.(hotel);
    }
  };

  const BudgetOption: React.FC<{ tier: typeof budgetTier; icon: React.ReactNode }> = ({ tier, icon }) => (
    <button 
      onClick={() => setBudgetTier(tier)} 
      className={`relative z-10 flex-1 flex flex-col items-center justify-center gap-1 h-full rounded-2xl transition-all duration-500 group/btn ${
        budgetTier === tier 
          ? 'bg-white text-[#1E1B4B] shadow-[0_8px_20px_-4px_rgba(0,0,0,0.12)] scale-[1.03] border border-indigo-50/50' 
          : 'text-slate-400 hover:text-indigo-500 hover:bg-slate-100/40'
      }`}
    >
      <div className={`transition-transform duration-500 ${budgetTier === tier ? 'scale-110' : 'group-hover/btn:scale-110'}`}>
        {icon}
      </div>
      <span className={`text-[9px] font-black uppercase tracking-widest transition-opacity ${budgetTier === tier ? 'opacity-100' : 'opacity-60'}`}>
        {tier}
      </span>
    </button>
  );

  return (
    <div className="max-w-6xl mx-auto space-y-12">
      <div className="bg-white p-2 rounded-[2rem] shadow-xl shadow-indigo-900/5 border border-gray-100 flex gap-2 w-fit mx-auto">
        <button
          onClick={() => { setActiveTab('flights'); setResults(null); }}
          className={`px-8 py-3.5 rounded-[1.5rem] flex items-center gap-3 font-bold transition-all text-[14px] ${
            activeTab === 'flights' ? 'bg-[#1E1B4B] text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'
          }`}
        >
          <Plane className="w-4.5 h-4.5" /> Flights
        </button>
        <button
          onClick={() => { setActiveTab('hotels'); setResults(null); }}
          className={`px-8 py-3.5 rounded-[1.5rem] flex items-center gap-3 font-bold transition-all text-[14px] ${
            activeTab === 'hotels' ? 'bg-[#1E1B4B] text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'
          }`}
        >
          <Building className="w-4.5 h-4.5" /> Hotels
        </button>
      </div>

      <div className="bg-white rounded-[3.5rem] shadow-2xl shadow-indigo-900/5 border border-gray-100 overflow-hidden min-h-[500px]">
        <div className="p-10 md:p-14 space-y-12">
          {/* Main Controls Grid */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-stretch">
            {activeTab === 'flights' ? (
              <>
                <div className="md:col-span-3 space-y-3.5">
                  <label className="text-[11px] font-extrabold text-indigo-500 uppercase tracking-widest ml-1">Flight Type</label>
                  <div className="flex bg-slate-50 p-1.5 rounded-xl border border-slate-100 h-[72px]">
                    {['round', 'one-way'].map(t => (
                      <button key={t} onClick={() => setTripType(t as any)} className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${tripType === t ? 'bg-white text-[#1E1B4B] shadow-sm' : 'text-slate-500'}`}>
                        {t === 'round' ? 'Round' : 'One-way'}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="md:col-span-4 space-y-3.5 relative">
                  <label className="text-[11px] font-extrabold text-indigo-500 uppercase tracking-widest ml-1 text-left block">Departure Origin</label>
                  <div className="relative h-[72px]">
                    <MapPin className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-indigo-400" />
                    <input 
                      type="text" 
                      placeholder="Origin city" 
                      value={originCity} 
                      autoComplete="off"
                      onChange={(e) => {
                        lastSelectedOriginRef.current = null;
                        setOriginCity(e.target.value);
                      }} 
                      onKeyDown={handleOriginKeyDown}
                      onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                      onFocus={() => originCity.length >= 2 && originCity !== lastSelectedOriginRef.current && setShowSuggestions(true)}
                      className="w-full h-full pl-14 pr-6 bg-slate-50 border-none rounded-2xl focus:ring-4 focus:ring-indigo-50 outline-none text-[15px] font-bold text-[#1E1B4B]" 
                    />
                    {isSearchingOrigin && (
                      <div className="absolute right-5 top-1/2 -translate-y-1/2 text-indigo-400">
                        <Loader2 className="w-5 h-5 animate-spin" />
                      </div>
                    )}
                  </div>
                  {showSuggestions && suggestions.length > 0 && (
                    <div className="absolute top-full left-0 w-full mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-[100] animate-in fade-in slide-in-from-top-2 duration-300">
                      {suggestions.map((suggestion, index) => (
                        <button key={suggestion} type="button" onClick={() => selectOriginSuggestion(suggestion)} className={`w-full text-left px-5 py-3.5 text-sm font-bold flex items-center gap-3 ${activeSuggestionIndex === index ? 'bg-indigo-50 text-indigo-700' : 'text-[#1E1B4B] hover:bg-gray-50'}`}>
                          <Search className="w-4 h-4 text-gray-300" /> {suggestion}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <div className="md:col-span-3 space-y-3.5">
                  <label className="text-[11px] font-extrabold text-indigo-500 uppercase tracking-widest ml-1 text-left block">Destination</label>
                  <div className="w-full h-[72px] px-7 bg-indigo-50/50 rounded-2xl text-[15px] font-bold text-[#1E1B4B] flex items-center gap-3 border border-indigo-100/30 truncate">
                    <MapPin className="w-4.5 h-4.5 text-indigo-600 shrink-0" /> {destination}
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="md:col-span-4 space-y-3.5">
                  <label className="text-[11px] font-extrabold text-indigo-500 uppercase tracking-widest ml-1 text-left block">Discovery Destination</label>
                  <div className="w-full h-[84px] px-8 bg-indigo-50/50 rounded-[1.75rem] text-[15px] font-bold text-[#1E1B4B] flex items-center gap-4 border border-indigo-100/40 shadow-sm transition-all">
                    <MapPin className="w-5 h-5 text-indigo-600 shrink-0" />
                    <span className="truncate">{destination}</span>
                  </div>
                </div>
                <div className="md:col-span-4 space-y-3.5">
                  <label className="text-[11px] font-extrabold text-indigo-500 uppercase tracking-widest ml-1 text-left block">Budget Preference</label>
                  <div className="flex bg-slate-50/80 p-2 rounded-[1.75rem] border border-slate-100 h-[84px] gap-1.5 shadow-inner">
                    <BudgetOption tier="Value" icon={<Wallet className="w-4 h-4" />} />
                    <BudgetOption tier="Standard" icon={<Coins className="w-4 h-4" />} />
                    <BudgetOption tier="Luxury" icon={<Gem className="w-4 h-4" />} />
                  </div>
                </div>
                <div className="md:col-span-2 space-y-3.5">
                  <label className="text-[11px] font-extrabold text-indigo-500 uppercase tracking-widest ml-1 text-left block">Currency</label>
                  <div className="relative h-[84px]">
                    <Coins className="absolute left-6 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-indigo-400" />
                    <select
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value)}
                      className="w-full h-full pl-14 pr-8 bg-slate-50 border border-slate-100 rounded-[1.75rem] focus:ring-4 focus:ring-indigo-50 focus:border-indigo-200 outline-none text-[14px] font-bold text-[#1E1B4B] appearance-none cursor-pointer transition-all shadow-sm"
                    >
                      {currencies.map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  </div>
                </div>
              </>
            )}

            <div className="md:col-span-2 space-y-3.5">
              <label className="text-transparent hidden md:block select-none pointer-events-none">Action</label>
              <button 
                onClick={handleSearch} 
                disabled={loading || (activeTab === 'flights' && !originCity)} 
                className={`w-full ${activeTab === 'flights' ? 'h-[72px]' : 'h-[84px]'} bg-[#1E1B4B] text-white rounded-[1.75rem] font-bold flex items-center justify-center gap-3 hover:bg-black transition-all disabled:opacity-20 shadow-xl shadow-indigo-900/10 text-[15px] group active:scale-95`}
              >
                {loading ? (
                  <RefreshCw className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Search className="w-5 h-5 group-hover:scale-110 transition-transform" /> 
                    <span>Search</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Results/Loading Logic */}
          {loading ? (
            <div className="py-32 flex flex-col items-center justify-center text-center animate-in fade-in duration-500">
              <div className="relative mb-10">
                <div className="w-24 h-24 border-4 border-indigo-50 rounded-full border-t-indigo-600 animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <Sparkles className="w-8 h-8 text-indigo-500" />
                </div>
              </div>
              <p className="text-2xl font-editorial italic text-[#1E1B4B] mb-3">{loadingMsg}</p>
              <p className="text-[15px] text-slate-500 font-medium">This usually takes a moment as we verify real-time data.</p>
            </div>
          ) : results ? (
            <div className="space-y-12">
              <div className="flex items-center justify-between border-b border-slate-100 pb-8">
                <div>
                  <h3 className="text-4xl font-editorial italic text-[#1E1B4B]">Handpicked Options</h3>
                  <p className="text-[15px] text-slate-500 font-medium mt-1">Curated for your specific journey profile.</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                {(() => {
                  let rawSections = results.text.split(/(?:---|(?:\n|^)Option\s+\d+:|(?:\n|^)\d+\.\s+NAME:)/i)
                    .map(s => s.trim())
                    .filter(s => s.length > 20 && (s.includes('NAME:') || s.includes('PRICE:')));

                  // If delimiter splitting resulted in only 1 block, try splitting on NAME:
                  if (rawSections.length <= 1 && (results.text.match(/NAME:/gi) || []).length > 1) {
                    const nameSplits = results.text.split(/(?=(?:^|\n)\s*\*?\*?NAME:)/i)
                      .map(s => s.trim())
                      .filter(s => s.length > 20);
                    if (nameSplits.length > 1) rawSections = nameSplits;
                  }

                  if (rawSections.length === 0) {
                    rawSections = [results.text];
                  }

                  return rawSections.map((section, idx) => (
                    <PremiumResultCard key={idx} section={section} type={activeTab} onSelect={handleAttachOption} />
                  ));
                })()}
              </div>

              {results.sources.length > 0 && (
                <div className="pt-12 border-t border-slate-100">
                  <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-8">Discovery Sources</p>
                  <div className="flex flex-wrap gap-4">
                    {results.sources.slice(0, 4).map((source, i) => source.web && (
                      <a key={i} href={source.web.uri} target="_blank" rel="noopener noreferrer" className="px-6 py-3.5 bg-slate-50 rounded-xl hover:bg-indigo-50 transition-all flex items-center gap-3 border border-transparent shadow-sm">
                        <ExternalLink className="w-4 h-4 text-slate-400" />
                        <span className="text-[13px] font-bold truncate max-w-[140px] text-slate-700">{source.web.title}</span>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="py-24 flex flex-col items-center justify-center text-center">
              <div className="w-24 h-24 bg-indigo-50/50 rounded-3xl flex items-center justify-center mb-10">
                 {activeTab === 'flights' ? <Plane className="w-10 h-10 text-indigo-300" /> : <Building className="w-10 h-10 text-indigo-300" />}
              </div>
              <h4 className="text-3xl font-editorial italic text-[#1E1B4B] mb-4">Begin Discovery</h4>
              <p className="text-slate-500 max-w-sm font-medium leading-relaxed">Enter your search criteria above to reveal bespoke travel options.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SearchWidget;
