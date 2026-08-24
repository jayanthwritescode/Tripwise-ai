
import React, { useState, useEffect, useRef } from 'react';
import { TripDetails, Itinerary, SavedTrip, FlightInfo, HotelInfo, Activity, HeroImage } from './types';
import { generateDestinationIllustration, generateItinerary } from './services/gemini';
import TripForm from './components/TripForm';
import ItineraryDisplay from './components/ItineraryDisplay';
import SearchWidget from './components/SearchWidget';
import LandingPage from './components/LandingPage';
import { Plane, Save, History, Trash2, ChevronRight, Sparkles, MoveLeft, Check, Loader2, Settings } from 'lucide-react';
import ApiKeyModal from './components/ApiKeyModal';

const STORAGE_KEY = 'tripwise_saved_trips';

const preloadImage = (url: string, timeoutMs: number = 8000): Promise<void> => {
  return new Promise((resolve) => {
    const img = new Image();
    const timeout = setTimeout(() => {
      console.warn("Preload timeout reached for:", url);
      resolve();
    }, timeoutMs);

    img.src = url;
    img.onload = () => {
      clearTimeout(timeout);
      resolve();
    };
    img.onerror = () => {
      clearTimeout(timeout);
      resolve();
    };
  });
};

// Time Utility Functions
const parseTime = (timeStr: string): number => {
  const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM|am|pm)?/);
  if (!match) return 540; 
  let hours = parseInt(match[1]);
  const minutes = parseInt(match[2]);
  const ampm = match[3]?.toUpperCase();
  if (ampm === 'PM' && hours < 12) hours += 12;
  if (ampm === 'AM' && hours === 12) hours = 0;
  return hours * 60 + minutes;
};

const formatTime = (minutes: number): string => {
  let hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12;
  return `${hours}:${mins.toString().padStart(2, '0')} ${ampm}`;
};

const parseDuration = (durStr: string): number => {
  const hMatch = durStr.match(/(\d+)\s*h/i);
  const mMatch = durStr.match(/(\d+)\s*m/i);
  let total = 0;
  if (hMatch) total += parseInt(hMatch[1]) * 60;
  if (mMatch) total += parseInt(mMatch[1]);
  return total || 60;
};

const recalculateDayTimings = (activities: Activity[]): Activity[] => {
  if (activities.length === 0) return [];
  const updated = [...activities];
  let currentTime = parseTime(updated[0].time);
  for (let i = 1; i < updated.length; i++) {
    const prevActivity = updated[i-1];
    const duration = parseDuration(prevActivity.duration);
    currentTime += duration + 15; // 15 min buffer
    updated[i].time = formatTime(currentTime);
  }
  return updated;
};

const App: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [itinerary, setItinerary] = useState<Itinerary | null>(null);
  const [tripDetails, setTripDetails] = useState<TripDetails | null>(null);
  const [view, setView] = useState<'itinerary' | 'booking'>('itinerary');
  const [appState, setAppState] = useState<'landing' | 'planner'>('landing');
  const [savedTrips, setSavedTrips] = useState<SavedTrip[]>([]);
  const [isSaved, setIsSaved] = useState(false);
  const [activeTripId, setActiveTripId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);
  
  const plannerRef = useRef<HTMLDivElement>(null);

  // LocalStorage Saved Trips Listener
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setSavedTrips(JSON.parse(stored));
      } catch (e) {
        console.error("Failed to parse saved trips", e);
      }
    } else {
      setSavedTrips([]);
    }
  }, []);

  const startNewPlanner = () => {
    setAppState('planner');
    setItinerary(null);
    setTripDetails(null);
    setIsSaved(false);
    setActiveTripId(null);
    setTimeout(() => {
      plannerRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleTripSubmit = async (details: TripDetails) => {
    setLoading(true);
    setItinerary(null);
    setTripDetails(details);
    setIsSaved(false);
    setActiveTripId(null);
    setView('itinerary');
    
    try {
      const itineraryPromise = generateItinerary(details);
      const illustrationPromise = generateDestinationIllustration(details.destination);
      
      const [itineraryResult, initialHeroImage] = await Promise.all([
        itineraryPromise,
        illustrationPromise
      ]);

      let finalHeroImage = initialHeroImage;
      if (finalHeroImage) {
        await preloadImage(finalHeroImage.url);
      }

      itineraryResult.heroImage = finalHeroImage;
      setItinerary(itineraryResult);
    } catch (error: any) {
      console.error("Failed to generate itinerary:", error);
      if (error?.message?.includes("Missing Gemini API Key")) {
        setIsApiKeyModalOpen(true);
      } else {
        alert(error?.message || "An unexpected error occurred. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateActivity = (dayIndex: number, activityIndex: number, action: 'up' | 'down' | 'delete') => {
    if (!itinerary) return;
    const newItinerary = { ...itinerary };
    const day = { ...newItinerary.days[dayIndex] };
    let activities = [...day.activities];

    if (action === 'delete') {
      activities.splice(activityIndex, 1);
    } else if (action === 'up' && activityIndex > 0) {
      [activities[activityIndex - 1], activities[activityIndex]] = [activities[activityIndex], activities[activityIndex - 1]];
    } else if (action === 'down' && activityIndex < activities.length - 1) {
      [activities[activityIndex + 1], activities[activityIndex]] = [activities[activityIndex], activities[activityIndex + 1]];
    }

    day.activities = recalculateDayTimings(activities);
    newItinerary.days[dayIndex] = day;
    setItinerary(newItinerary);
    setIsSaved(false);
  };

  const handleReorderActivity = (fromDayIdx: number, fromActIdx: number, toDayIdx: number, toActIdx: number) => {
    if (!itinerary) return;
    const newItinerary = { ...itinerary };
    
    // Clone days
    const fromDay = { ...newItinerary.days[fromDayIdx] };
    const toDay = fromDayIdx === toDayIdx ? fromDay : { ...newItinerary.days[toDayIdx] };
    
    // Remove from source
    const [movedActivity] = fromDay.activities.splice(fromActIdx, 1);
    
    // Add to destination
    toDay.activities.splice(toActIdx, 0, movedActivity);
    
    // Recalculate source day
    fromDay.activities = recalculateDayTimings(fromDay.activities);
    newItinerary.days[fromDayIdx] = fromDay;
    
    // Recalculate target day if different
    if (fromDayIdx !== toDayIdx) {
      toDay.activities = recalculateDayTimings(toDay.activities);
      newItinerary.days[toDayIdx] = toDay;
    }
    
    setItinerary(newItinerary);
    setIsSaved(false);
  };

  const handleSelectFlight = (flight: FlightInfo) => {
    if (!itinerary) return;
    setItinerary({ ...itinerary, selectedFlight: flight });
    setIsSaved(false);
    setTimeout(() => setView('itinerary'), 400);
  };

  const handleSelectHotel = (hotel: HotelInfo) => {
    if (!itinerary) return;
    setItinerary({ ...itinerary, selectedHotel: hotel });
    setIsSaved(false);
    setTimeout(() => setView('itinerary'), 400);
  };

  const handleSaveTrip = async () => {
    if (!itinerary || !tripDetails) return;
    setIsSaving(true);
    
    try {
      const tripId = activeTripId || crypto.randomUUID();
      const tripData = {
        id: tripId,
        userId: 'anonymous',
        details: tripDetails,
        itinerary: itinerary,
        savedAt: new Date().toISOString()
      };

      // Save to localStorage
      let updatedTrips: SavedTrip[];
      if (activeTripId) {
        updatedTrips = savedTrips.map(t => 
          t.id === activeTripId 
            ? { ...t, itinerary, details: tripDetails, savedAt: new Date().toISOString() } 
            : t
        );
      } else {
        const newSavedTrip: SavedTrip = {
          ...tripData,
          savedAt: new Date().toISOString()
        } as SavedTrip;
        updatedTrips = [newSavedTrip, ...savedTrips];
      }
      setSavedTrips(updatedTrips);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedTrips));

      setActiveTripId(tripId);
      setIsSaved(true);
    } catch (error) {
      console.error("Failed to save trip locally", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteSavedTrip = async (id: string) => {
    try {
      const updated = savedTrips.filter(t => t.id !== id);
      setSavedTrips(updated);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

      if (activeTripId === id) {
        setActiveTripId(null);
        setIsSaved(false);
      }
    } catch (error) {
      console.error("Failed to delete trip locally", error);
    }
  };

  const handleLoadSavedTrip = (trip: SavedTrip) => {
    setTripDetails(trip.details);
    setItinerary(trip.itinerary);
    setActiveTripId(trip.id);
    setIsSaved(true);
    setView('itinerary');
    setAppState('planner');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleReset = () => {
    setItinerary(null);
    setTripDetails(null);
    setActiveTripId(null);
    setView('itinerary');
    setIsSaved(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(() => setAppState('landing'), 300);
  };

  return (
    <div className="min-h-screen flex flex-col relative bg-[#FBFCFE]">
      {appState === 'landing' ? (
        <LandingPage 
          onStart={startNewPlanner} 
          savedTrips={savedTrips} 
          onLoadTrip={handleLoadSavedTrip} 
          onDeleteTrip={handleDeleteSavedTrip}
        />
      ) : (
        <div ref={plannerRef} className="flex-1 flex flex-col animate-in fade-in duration-700">
          <header className="bg-white/90 backdrop-blur-xl border-b border-gray-100 sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
              <div className="flex items-center gap-3 group cursor-pointer" onClick={handleReset}>
                <div className="bg-[#1E1B4B] p-2 rounded-xl group-hover:scale-110 transition-all flex items-center justify-center">
                  <Plane className="w-6 h-6 text-white animate-flight" />
                </div>
                <span className="text-xl font-bold text-[#1E1B4B] tracking-tight">TripWise</span>
              </div>
              
              <div className="flex items-center gap-4">
                {itinerary && (
                  <>
                    {!isSaved ? (
                      <button 
                        onClick={handleSaveTrip}
                        disabled={isSaving}
                        className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-[#1E1B4B] transition-all flex items-center gap-2 font-bold text-sm shadow-lg shadow-indigo-200 disabled:opacity-50"
                      >
                        {isSaving ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Save className="w-4 h-4" />
                        )}
                        <span className="hidden md:inline">{activeTripId ? 'Update Archive' : 'Store Journey'}</span>
                      </button>
                    ) : (
                      <div className="px-5 py-2.5 text-green-600 flex items-center gap-2 font-bold text-sm bg-green-50 rounded-xl border border-green-100 animate-in zoom-in-95 duration-300">
                        <Check className="w-4 h-4" /> <span>Archived</span>
                      </div>
                    )}
                  </>
                )}
                
                <div className="h-8 w-[1px] bg-gray-100 mx-2 hidden md:block"></div>

                <button 
                  onClick={() => setIsApiKeyModalOpen(true)}
                  className="p-2.5 text-gray-500 hover:text-indigo-600 hover:bg-gray-100 rounded-xl transition-all flex items-center gap-2 font-medium text-sm"
                >
                  <Settings className="w-5 h-5" /> 
                </button>

                <div className="h-8 w-[1px] bg-gray-100 mx-2 hidden md:block"></div>

                <button 
                  onClick={handleReset}
                  className="p-2.5 text-gray-400 hover:text-indigo-600 hover:bg-gray-100 rounded-xl transition-all flex items-center gap-2 font-medium text-sm"
                >
                  <MoveLeft className="w-4 h-4" /> <span className="hidden md:inline">Return</span>
                </button>
              </div>
            </div>
          </header>

          <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-10">
            {!itinerary ? (
              <div className="py-12 animate-in fade-in slide-in-from-bottom-8 duration-1000">
                <TripForm onSubmit={handleTripSubmit} loading={loading} />
              </div>
            ) : (
              <div className="space-y-10 pb-20">
                <div className="flex justify-center">
                  <div className="bg-white p-1.5 rounded-[1.5rem] shadow-xl shadow-indigo-900/5 border border-gray-100 flex gap-1">
                    <button onClick={() => setView('itinerary')} className={`px-10 py-3 rounded-2xl font-bold transition-all text-sm ${view === 'itinerary' ? 'bg-[#1E1B4B] text-white shadow-lg' : 'text-gray-400 hover:bg-gray-50'}`}>Itinerary Journal</button>
                    <button onClick={() => setView('booking')} className={`px-10 py-3 rounded-2xl font-bold transition-all text-sm ${view === 'booking' ? 'bg-[#1E1B4B] text-white shadow-lg' : 'text-gray-400 hover:bg-gray-50'}`}>Logistics Discovery</button>
                  </div>
                </div>

                <div className="animate-in fade-in slide-in-from-bottom-6 duration-700">
                  {view === 'itinerary' ? (
                    <ItineraryDisplay itinerary={itinerary} onUpdateActivity={handleUpdateActivity} onReorderActivity={handleReorderActivity} />
                  ) : (
                    <div className="max-w-7xl mx-auto space-y-16">
                      <div className="text-center space-y-4 pt-10">
                        <h2 className="text-5xl font-editorial italic text-[#1E1B4B] tracking-tight">Refine Logistics</h2>
                        <p className="text-gray-400 text-lg max-w-lg mx-auto font-medium leading-relaxed italic">Finding live options for {tripDetails?.destination}.</p>
                      </div>
                      {tripDetails && <SearchWidget destination={tripDetails.destination} startDate={tripDetails.startDate} onSelectFlight={handleSelectFlight} selectedFlight={itinerary.selectedFlight} onSelectHotel={handleSelectHotel} selectedHotel={itinerary.selectedHotel} />}
                    </div>
                  )}
                </div>
              </div>
            )}
          </main>

          <footer className="bg-white border-t border-gray-50 py-20 mt-20">
            <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-12">
              <div className="flex items-center gap-3">
                 <div className="bg-[#1E1B4B] p-2 rounded-lg flex items-center justify-center">
                    <Plane className="w-5 h-5 text-white animate-flight" />
                 </div>
                 <span className="text-xl font-bold text-[#1E1B4B]">TripWise</span>
              </div>
              <p className="text-gray-300 text-sm font-medium tracking-wide">© 2026 TripWise. Bespoke architecture for the modern traveller.</p>
            </div>
          </footer>
        </div>
      )}
      
      {/* API Key Modal */}
      <ApiKeyModal isOpen={isApiKeyModalOpen} onClose={() => setIsApiKeyModalOpen(false)} />
    </div>
  );
};

export default App;
