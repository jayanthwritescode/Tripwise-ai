
import React, { useState, useEffect, useRef } from 'react';
import { Calendar, MapPin, Target, Send, Sparkles, ChevronRight, ChevronLeft, Minus, Plus, Info, Search, Loader2 } from 'lucide-react';
import { TripDetails } from '../types';
import { getDestinationSuggestions } from '../services/gemini';

interface TripFormProps {
  onSubmit: (details: TripDetails) => void;
  loading: boolean;
}

const TripForm: React.FC<TripFormProps> = ({ onSubmit, loading }) => {
  const [step, setStep] = useState(1);
  const [details, setDetails] = useState<TripDetails>({
    destination: '',
    days: 3,
    objective: '',
    startDate: new Date().toISOString().split('T')[0],
  });

  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1);
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  const searchTimeoutRef = useRef<any>(null);
  const lastSelectedRef = useRef<string | null>(null);

  const objectives = [
    'Sightseeing', 
    'Food Exploration', 
    'Shopping', 
    'Adventure Sports', 
    'Relaxation', 
    'Cultural Immersion',
    'Nightlife'
  ];

  const totalSteps = 3;

  useEffect(() => {
    // Prevent re-searching if the change was due to a selection
    if (details.destination === lastSelectedRef.current) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    if (details.destination.trim().length >= 2 && step === 1) {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
      
      searchTimeoutRef.current = setTimeout(async () => {
        setIsSearching(true);
        try {
          const results = await getDestinationSuggestions(details.destination);
          if (step === 1) {
            setSuggestions(results);
            setShowSuggestions(results.length > 0);
          }
        } finally {
          setIsSearching(false);
        }
      }, 180);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }

    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, [details.destination, step]);

  const popularDestinations = [
    'Paris, France',
    'Tokyo, Japan',
    'Rome, Italy',
    'Bali, Indonesia',
    'New York, USA',
    'London, UK'
  ];

  const handleNext = () => {
    if (step === 1 && !details.destination.trim()) return;
    if (step < totalSteps) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const selectSuggestion = (suggestion: string) => {
    lastSelectedRef.current = suggestion;
    setDetails(prev => ({ ...prev, destination: suggestion }));
    setSuggestions([]);
    setShowSuggestions(false);
    setActiveSuggestionIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (step === 1 && showSuggestions && suggestions.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveSuggestionIndex(prev => Math.min(prev + 1, suggestions.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveSuggestionIndex(prev => Math.max(prev - 1, 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (activeSuggestionIndex >= 0 && activeSuggestionIndex < suggestions.length) {
          selectSuggestion(suggestions[activeSuggestionIndex]);
        } else {
          handleNext();
        }
      } else if (e.key === 'Escape') {
        setShowSuggestions(false);
      }
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (step < totalSteps) {
        handleNext();
      } else if (details.objective) {
        onSubmit(details);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (step < totalSteps) {
      handleNext();
      return;
    }
    if (!details.destination || !details.objective) return;
    onSubmit(details);
  };

  const progress = (step / totalSteps) * 100;

  return (
    <div className="max-w-3xl mx-auto w-full">
      <div className="bg-white rounded-[3.5rem] shadow-[0_50px_100px_-20px_rgba(30,27,75,0.08)] border border-gray-100 transition-all duration-700 relative">
        <div className="h-1.5 w-full bg-gray-50 rounded-t-[3.5rem] overflow-hidden">
          <div className="h-full bg-[#1E1B4B] transition-all duration-1000 ease-out" style={{ width: `${progress}%` }} />
        </div>

        <div className="p-12 md:p-16">
          <form onSubmit={handleSubmit} className="space-y-12 min-h-[400px] flex flex-col">
            
            {step === 1 && (
              <div className="animate-in fade-in slide-in-from-right-8 duration-700 flex-1 space-y-10 relative z-30">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="bg-indigo-50 p-2.5 rounded-2xl">
                      <MapPin className="w-6 h-6 text-indigo-600" />
                    </div>
                    <span className="text-xs font-black uppercase tracking-[0.3em] text-indigo-400">Step 01</span>
                  </div>
                  <h2 className="text-4xl md:text-5xl font-editorial italic text-[#1E1B4B]">Where are we heading?</h2>
                  <p className="text-gray-400 text-lg max-w-md font-medium">Type a city, country, or pick a destination.</p>
                </div>

                <div className="relative">
                  <div className="relative flex items-center">
                    <input
                      autoFocus
                      type="text"
                      required
                      className="w-full px-0 py-6 bg-transparent border-b-2 border-gray-100 focus:border-indigo-600 outline-none transition-all text-3xl md:text-4xl font-bold placeholder:text-gray-200 text-[#1E1B4B]"
                      placeholder="Search destination..."
                      value={details.destination}
                      autoComplete="off"
                      onChange={(e) => {
                        lastSelectedRef.current = null;
                        setDetails({ ...details, destination: e.target.value });
                      }}
                      onKeyDown={handleKeyDown}
                      onBlur={() => setTimeout(() => setShowSuggestions(false), 250)}
                      onFocus={() => {
                        if (details.destination.trim().length >= 2) {
                          setShowSuggestions(true);
                        }
                      }}
                    />
                    {isSearching && (
                      <div className="absolute right-0 top-1/2 -translate-y-1/2 text-indigo-400">
                        <Loader2 className="w-6 h-6 animate-spin" />
                      </div>
                    )}
                  </div>

                  {showSuggestions && suggestions.length > 0 && (
                    <div className="absolute top-full left-0 w-full mt-3 bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden z-[100] animate-in fade-in slide-in-from-top-4 duration-300">
                      {suggestions.map((suggestion, index) => (
                        <button
                          key={suggestion}
                          type="button"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            selectSuggestion(suggestion);
                          }}
                          onClick={() => selectSuggestion(suggestion)}
                          onMouseEnter={() => setActiveSuggestionIndex(index)}
                          className={`w-full text-left px-8 py-5 text-xl font-bold transition-colors flex items-center gap-4 ${
                            activeSuggestionIndex === index ? 'bg-indigo-50 text-indigo-700' : 'text-[#1E1B4B] hover:bg-gray-50'
                          }`}
                        >
                          <Search className={`w-5 h-5 ${activeSuggestionIndex === index ? 'text-indigo-600' : 'text-gray-300'}`} />
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  )}

                  {!details.destination && (
                    <div className="pt-6">
                      <p className="text-[11px] font-black uppercase tracking-widest text-gray-400 mb-3">Popular Journeys</p>
                      <div className="flex flex-wrap gap-2">
                        {popularDestinations.map(dest => (
                          <button
                            key={dest}
                            type="button"
                            onClick={() => selectSuggestion(dest)}
                            className="px-4 py-2 bg-slate-50 hover:bg-indigo-50 text-[#1E1B4B] hover:text-indigo-600 text-xs font-bold rounded-xl border border-slate-100 transition-all active:scale-95"
                          >
                            {dest}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {!showSuggestions && details.destination && details.destination === lastSelectedRef.current && (
                    <div className="mt-4 animate-in fade-in slide-in-from-top-2">
                       <p className="text-xs font-bold text-indigo-500 uppercase tracking-widest flex items-center gap-2">
                         <Sparkles className="w-3.5 h-3.5" /> Ready to explore {details.destination}?
                       </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="animate-in fade-in slide-in-from-right-8 duration-700 flex-1 space-y-12">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="bg-indigo-50 p-2.5 rounded-2xl">
                      <Calendar className="w-6 h-6 text-indigo-600" />
                    </div>
                    <span className="text-xs font-black uppercase tracking-[0.3em] text-indigo-400">Step 02</span>
                  </div>
                  <h2 className="text-4xl md:text-5xl font-editorial italic text-[#1E1B4B]">The rhythm of time.</h2>
                  <p className="text-gray-400 text-lg max-w-md font-medium">Select your duration and departure date.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                  <div className="space-y-8">
                    <label className="text-xs font-black text-[#1E1B4B] uppercase tracking-widest block">Duration: {details.days} Days</label>
                    <div className="flex items-center gap-6">
                      <button type="button" onClick={() => setDetails(d => ({ ...d, days: Math.max(1, d.days - 1) }))} className="w-12 h-12 rounded-full border border-gray-100 flex items-center justify-center hover:bg-gray-50 active:scale-95 transition-all">
                        <Minus className="w-5 h-5 text-gray-400" />
                      </button>
                      <input type="range" min="1" max="14" className="flex-1 h-2 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-[#1E1B4B]" value={details.days} onChange={(e) => setDetails({ ...details, days: parseInt(e.target.value) })} />
                      <button type="button" onClick={() => setDetails(d => ({ ...d, days: Math.min(14, d.days + 1) }))} className="w-12 h-12 rounded-full border border-gray-100 flex items-center justify-center hover:bg-gray-50 active:scale-95 transition-all">
                        <Plus className="w-5 h-5 text-gray-400" />
                      </button>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <label className="text-xs font-black text-[#1E1B4B] uppercase tracking-widest block">Start Date</label>
                    <div className="relative group/date">
                      <Calendar className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-indigo-400 group-focus-within/date:text-indigo-600 transition-colors pointer-events-none" />
                      <input 
                        type="date" 
                        required 
                        className="w-full pl-16 pr-8 py-5 rounded-2xl bg-gray-50 border-none focus:bg-white focus:ring-4 focus:ring-indigo-50 outline-none transition-all text-xl font-bold text-[#1E1B4B]" 
                        value={details.startDate} 
                        onChange={(e) => setDetails({ ...details, startDate: e.target.value })} 
                        onKeyDown={handleKeyDown}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="animate-in fade-in slide-in-from-right-8 duration-700 flex-1 space-y-10">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="bg-indigo-50 p-2.5 rounded-2xl">
                      <Target className="w-6 h-6 text-indigo-600" />
                    </div>
                    <span className="text-xs font-black uppercase tracking-[0.3em] text-indigo-400">Step 03</span>
                  </div>
                  <h2 className="text-4xl md:text-5xl font-editorial italic text-[#1E1B4B]">Set the mood.</h2>
                  <p className="text-gray-400 text-lg max-w-md font-medium">What is the primary energy of this trip?</p>
                </div>

                <div className="flex flex-wrap gap-4">
                  {objectives.map((obj) => (
                    <button key={obj} type="button" onClick={() => setDetails({ ...details, objective: obj })} className={`px-8 py-4 rounded-full text-sm font-bold transition-all border-2 ${details.objective === obj ? 'bg-[#1E1B4B] text-white border-[#1E1B4B] shadow-xl scale-105' : 'bg-white text-gray-400 border-gray-100 hover:border-indigo-100'}`}>
                      {obj}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-12 pt-8 border-t border-gray-50 flex items-center justify-between">
              {step > 1 ? (
                <button type="button" onClick={handleBack} className="px-8 py-4 rounded-full text-gray-400 font-bold hover:text-[#1E1B4B] transition-all flex items-center gap-2">
                  <ChevronLeft className="w-5 h-5" /> Back
                </button>
              ) : <div />}

              {step < totalSteps ? (
                <button 
                  type="button" 
                  disabled={!details.destination.trim() && step === 1} 
                  onClick={handleNext} 
                  className="px-10 py-5 bg-[#1E1B4B] text-white rounded-full font-bold flex items-center gap-3 shadow-2xl hover:shadow-indigo-900/30 transition-all disabled:opacity-20 active:scale-95"
                >
                  Next Step <ChevronRight className="w-5 h-5" />
                </button>
              ) : (
                <button 
                  type="submit" 
                  disabled={loading || !details.objective} 
                  className="px-12 py-5 bg-[#1E1B4B] text-white rounded-full font-bold flex items-center gap-4 shadow-2xl hover:scale-105 transition-all disabled:opacity-30 disabled:hover:scale-100 active:scale-95"
                >
                  {loading ? <Loader2 className="animate-spin h-6 w-6 border-white" /> : <>Curate Journey <Sparkles className="w-5 h-5" /></>}
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
      <p className="mt-8 text-center text-gray-300 text-xs font-black uppercase tracking-[0.3em]">
        Step {step} of {totalSteps} — Bespoke Planning
      </p>
    </div>
  );
};

export default TripForm;
