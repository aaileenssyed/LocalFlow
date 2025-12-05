import React, { useState, useEffect, useRef } from 'react';
import { 
  MapPin, 
  Navigation, 
  Clock, 
  AlertTriangle, 
  RefreshCw,
  Settings,
  ShieldCheck,
  Plus,
  Trash2,
  Sparkles,
  Wand2,
  Calendar,
  Wallet,
  Mic,
  MicOff
} from 'lucide-react';
import { VibeSlider } from './components/VibeSlider';
import { DietarySelector } from './components/DietarySelector';
import { ItineraryTimeline } from './components/ItineraryTimeline';
import { ItineraryStats } from './components/ItineraryStats';
import { ItineraryMap } from './components/ItineraryMap';
import { generateItinerary, recalculateItinerary, resolveLocation } from './services/geminiService';
import { Itinerary, UserPreferences, FixedCommitment } from './types';
import { INITIAL_PREFERENCES, MOCK_START_LOCATION, BUDGET_OPTIONS } from './constants';

export default function App() {
  // State
  const [preferences, setPreferences] = useState<UserPreferences>(INITIAL_PREFERENCES);
  const [itinerary, setItinerary] = useState<Itinerary | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  
  // New Commitment State
  const [newCommitment, setNewCommitment] = useState<Partial<FixedCommitment>>({ 
      startTime: '12:00', 
      endTime: '13:00', 
      location: '', 
      description: '' 
  });
  const [resolvingLoc, setResolvingLoc] = useState(false);

  // Voice State
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  // Simulated Location/Time State
  const [currentLocation, setCurrentLocation] = useState<{lat: number, lng: number}>(MOCK_START_LOCATION);
  const [currentTime, setCurrentTime] = useState<string>("09:00");
  const [isSimulating, setIsSimulating] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    setLoadingMessage("Scouting the best local spots, checking golden hour & crowd levels...");
    setError(null);
    try {
      const result = await generateItinerary(preferences, currentLocation, currentTime);
      setItinerary(result);
    } catch (err) {
      setError("Failed to generate itinerary. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRecalculate = async (reason: string) => {
    if (!itinerary) return;
    
    setLoading(true);
    setLoadingMessage(`Adjusting plan: ${reason}...`);
    try {
      const result = await recalculateItinerary(itinerary, currentLocation, currentTime, reason);
      setItinerary(result);
    } catch (err) {
      setError("Could not recalculate. Stick to the plan!");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSwap = (stopId: string, stopName: string) => {
      handleRecalculate(`Swap ${stopName}`);
  };

  const handleMagicLocation = async () => {
      if (!newCommitment.location) return;
      setResolvingLoc(true);
      try {
          const result = await resolveLocation(newCommitment.location, preferences.location);
          if (result) {
              setNewCommitment(prev => ({ ...prev, location: result.address }));
          }
      } catch (e) {
          console.error(e);
      } finally {
          setResolvingLoc(false);
      }
  };

  const startRecognition = () => {
    const win = window as any;
    const SpeechRecognition = win.SpeechRecognition || win.webkitSpeechRecognition;

    if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US';

        recognition.onstart = () => setIsListening(true);
        recognition.onend = () => setIsListening(false);
        recognition.onerror = (event: any) => {
            console.error(event.error);
            setIsListening(false);
        };
        recognition.onresult = (event: any) => {
            const transcript = event.results[0][0].transcript;
            setPreferences(prev => ({ 
                ...prev, 
                vibeDescription: (prev.vibeDescription + " " + transcript).trim() 
            }));
        };

        recognitionRef.current = recognition;
        recognition.start();
    } else {
        alert("Voice recognition not supported in this browser.");
    }
  };

  const stopRecognition = () => {
      if (recognitionRef.current) {
          recognitionRef.current.stop();
      }
  };

  const addCommitment = () => {
    if (newCommitment.startTime && newCommitment.location) {
        const commit: FixedCommitment = {
            id: Math.random().toString(),
            startTime: newCommitment.startTime!,
            endTime: newCommitment.endTime || newCommitment.startTime!, 
            location: newCommitment.location!,
            description: newCommitment.description || 'User Commitment'
        };
        setPreferences(prev => ({
            ...prev,
            fixedCommitments: [...prev.fixedCommitments, commit].sort((a,b) => a.startTime.localeCompare(b.startTime))
        }));
        setNewCommitment({ startTime: '12:00', endTime: '13:00', location: '', description: '' });
    }
  };

  const removeCommitment = (id: string) => {
      setPreferences(prev => ({
          ...prev,
          fixedCommitments: prev.fixedCommitments.filter(c => c.id !== id)
      }));
  };

  // Effect to simulate time passing if enabled
  useEffect(() => {
    let interval: any;
    if (isSimulating) {
      interval = setInterval(() => {
        // Advance time by 15 mins every 2 seconds
        setCurrentTime(prev => {
          const [h, m] = prev.split(':').map(Number);
          const date = new Date();
          date.setHours(h, m + 15);
          return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
        });
      }, 2000);
    }
    return () => clearInterval(interval);
  }, [isSimulating]);

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 selection:bg-amber-500/30 font-sans">
      
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-stone-950/80 border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-600 to-orange-500 flex items-center justify-center shadow-lg shadow-orange-500/20">
              <Navigation size={18} className="text-white" />
            </div>
            <span className="font-bold text-xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-stone-100 to-stone-400">
              LocalFlow
            </span>
          </div>
          <div className="flex items-center gap-4 text-xs font-mono text-stone-500">
             <span className="hidden sm:inline flex items-center gap-1">
               <Clock size={12} /> {currentTime}
             </span>
             <button 
                onClick={() => setIsSimulating(!isSimulating)}
                className={`flex items-center gap-1 px-2 py-1 rounded transition-colors ${isSimulating ? 'bg-emerald-900/30 text-emerald-500' : 'hover:text-stone-300'}`}
             >
               <ShieldCheck size={12} /> {isSimulating ? 'Simulating' : 'Live'}
             </button>
             {itinerary && (
                 <button 
                    onClick={() => { setItinerary(null); setPreferences(INITIAL_PREFERENCES); }}
                    className="flex items-center gap-1 hover:text-stone-300"
                 >
                     <RefreshCw size={12} /> Reset
                 </button>
             )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 pb-32">
        
        {/* Onboarding / Setup Section */}
        {!itinerary && !loading && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-4xl mx-auto">
            <div className="text-center space-y-4 py-8">
              <h1 className="text-4xl md:text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-b from-white via-stone-200 to-stone-600 tracking-tight">
                Curate Your Day.
              </h1>
              <p className="text-stone-400 max-w-md mx-auto text-lg font-light">
                Tell us where you need to be. We'll find the hidden gems, golden hours, and authentic moments in between.
              </p>
            </div>

            <div className="bg-stone-900/50 border border-white/5 rounded-2xl p-6 md:p-8 space-y-10 shadow-2xl shadow-black/50">
              
              {/* Trip Logistics */}
              <section className="space-y-4">
                 <h2 className="text-sm font-medium text-stone-400 uppercase tracking-widest flex items-center gap-2"><MapPin size={14} /> Logistics</h2>
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                     <div className="space-y-1 md:col-span-3">
                         <label className="text-[10px] text-stone-500 uppercase font-bold tracking-wider">Start Location</label>
                         <input 
                            type="text" 
                            placeholder="e.g. SoHo, New York"
                            className="w-full bg-black/40 border border-stone-800 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-amber-500/50 transition-all placeholder:text-stone-700"
                            onChange={(e) => setPreferences(prev => ({...prev, location: e.target.value}))}
                            value={preferences.location}
                         />
                     </div>
                     <div className="space-y-1">
                         <label className="text-[10px] text-stone-500 uppercase font-bold tracking-wider">Start Time</label>
                         <input 
                            type="time" 
                            className="w-full bg-black/40 border border-stone-800 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-amber-500/50 transition-all text-center"
                            onChange={(e) => setPreferences(prev => ({...prev, tripStartTime: e.target.value}))}
                            value={preferences.tripStartTime}
                         />
                     </div>
                     <div className="space-y-1">
                         <label className="text-[10px] text-stone-500 uppercase font-bold tracking-wider">End By</label>
                         <input 
                            type="time" 
                            className="w-full bg-black/40 border border-stone-800 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-amber-500/50 transition-all text-center"
                            onChange={(e) => setPreferences(prev => ({...prev, tripEndTime: e.target.value}))}
                            value={preferences.tripEndTime}
                         />
                     </div>
                     <div className="space-y-1">
                         <label className="text-[10px] text-stone-500 uppercase font-bold tracking-wider">Date</label>
                         <div className="w-full bg-black/40 border border-stone-800 rounded-lg px-4 py-3 text-sm text-stone-500 cursor-not-allowed flex items-center justify-between">
                            <span>Today</span>
                            <Calendar size={14} />
                         </div>
                     </div>
                 </div>
              </section>

              {/* Vibe Settings */}
              <section className="space-y-6">
                <div className="flex justify-between items-end border-b border-white/5 pb-2">
                  <h2 className="text-sm font-medium text-stone-400 uppercase tracking-widest flex items-center gap-2"><Sparkles size={14} /> The Vibe</h2>
                </div>
                
                <div className="space-y-2">
                    <label className="text-[10px] text-stone-500 uppercase font-bold tracking-wider">Mood Board</label>
                    <div className="relative">
                        <textarea 
                            className="w-full bg-black/40 border border-stone-800 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-amber-500/50 transition-all placeholder:text-stone-700 resize-none pr-12"
                            rows={3}
                            placeholder="Describe your ideal day... e.g. 'Cozy bookshops, rainy day jazz, brutalist architecture, warm coffee'"
                            value={preferences.vibeDescription || ''}
                            onChange={(e) => setPreferences(prev => ({...prev, vibeDescription: e.target.value}))}
                        />
                        <button 
                            onClick={isListening ? stopRecognition : startRecognition}
                            className={`absolute right-3 bottom-3 p-2 rounded-full transition-all ${isListening ? 'bg-red-500/20 text-red-400 animate-pulse' : 'bg-stone-800 text-stone-400 hover:text-amber-400'}`}
                        >
                            {isListening ? <MicOff size={16} /> : <Mic size={16} />}
                        </button>
                    </div>
                </div>

                <div className="space-y-4 pt-2">
                     <div className="flex justify-between items-center text-[10px] text-stone-500 uppercase font-bold tracking-wider">
                         <span>Classic/Tourist</span>
                         <span>Local/Authentic</span>
                     </div>
                    <VibeSlider 
                        value={preferences.vibeScore} 
                        onChange={(val) => setPreferences(prev => ({...prev, vibeScore: val}))} 
                    />
                </div>
              </section>

              {/* Budget */}
              <section className="space-y-3">
                  <h2 className="text-sm font-medium text-stone-400 uppercase tracking-widest flex items-center gap-2"><Wallet size={14} /> Budget</h2>
                  <div className="grid grid-cols-3 gap-3">
                      {BUDGET_OPTIONS.map((opt) => (
                          <button
                            key={opt.value}
                            onClick={() => setPreferences(prev => ({...prev, budget: opt.value as any}))}
                            className={`
                                py-3 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all
                                ${preferences.budget === opt.value 
                                    ? 'bg-stone-800 border-amber-600/50 text-amber-500' 
                                    : 'bg-black/20 border-stone-800 text-stone-600 hover:bg-stone-800/50'}
                            `}
                          >
                              <span className="font-mono text-lg">{opt.icon}</span>
                              <span className="text-[10px] uppercase font-bold tracking-wider">{opt.label}</span>
                          </button>
                      ))}
                  </div>
              </section>

              {/* Fixed Commitments */}
              <section className="space-y-4">
                  <h2 className="text-sm font-medium text-stone-400 uppercase tracking-widest flex items-center gap-2"><Calendar size={14} /> Locked Plans</h2>
                  
                  {/* List of existing commitments */}
                  {preferences.fixedCommitments.length > 0 && (
                      <div className="space-y-2 mb-4">
                          {preferences.fixedCommitments.map(c => (
                              <div key={c.id} className="flex items-center justify-between p-3 bg-amber-900/10 rounded-lg border border-amber-500/20">
                                  <div className="flex items-center gap-3">
                                      <div className="flex flex-col items-center justify-center bg-amber-500/10 text-amber-500 px-2 py-1 rounded text-xs font-mono border border-amber-500/20 w-16 text-center">
                                          <span>{c.startTime}</span>
                                          <div className="h-2 w-px bg-amber-500/30 my-0.5"></div>
                                          <span>{c.endTime}</span>
                                      </div>
                                      <div className="text-sm">
                                          <div className="font-medium text-stone-200">{c.location}</div>
                                          <div className="text-xs text-stone-500">{c.description}</div>
                                      </div>
                                  </div>
                                  <button onClick={() => removeCommitment(c.id)} className="text-stone-500 hover:text-red-400 transition-colors">
                                      <Trash2 size={16} />
                                  </button>
                              </div>
                          ))}
                      </div>
                  )}

                  {/* Input Row */}
                  <div className="bg-stone-900/80 rounded-xl p-4 border border-stone-800 space-y-3">
                      <div className="flex gap-2 items-center">
                          <input 
                              type="time" 
                              value={newCommitment.startTime}
                              onChange={e => setNewCommitment(prev => ({...prev, startTime: e.target.value}))}
                              className="bg-black/40 border border-stone-700 rounded px-2 py-2 text-sm w-20 text-center"
                              title="Arrive By"
                          />
                          <span className="text-stone-600">-</span>
                          <input 
                              type="time" 
                              value={newCommitment.endTime}
                              onChange={e => setNewCommitment(prev => ({...prev, endTime: e.target.value}))}
                              className="bg-black/40 border border-stone-700 rounded px-2 py-2 text-sm w-20 text-center"
                              title="Depart By"
                          />
                          <div className="flex-1 relative">
                            <input 
                                type="text"
                                placeholder="Location (e.g. 'MOMA')"
                                value={newCommitment.location}
                                onChange={e => setNewCommitment(prev => ({...prev, location: e.target.value}))}
                                className="w-full bg-black/40 border border-stone-700 rounded px-3 py-2 text-sm pr-8"
                            />
                            <button 
                                onClick={handleMagicLocation}
                                disabled={resolvingLoc}
                                className={`absolute right-1 top-1 p-1 hover:bg-stone-700 rounded ${resolvingLoc ? 'animate-spin text-amber-500' : 'text-stone-500'}`}
                                title="Magic Lookup"
                            >
                                <Wand2 size={14} />
                            </button>
                          </div>
                      </div>
                      <div className="flex gap-2">
                          <input 
                                type="text"
                                placeholder="Description (Optional)"
                                value={newCommitment.description}
                                onChange={e => setNewCommitment(prev => ({...prev, description: e.target.value}))}
                                className="flex-1 bg-black/40 border border-stone-700 rounded px-3 py-2 text-sm"
                          />
                          <button 
                            onClick={addCommitment}
                            disabled={!newCommitment.location}
                            className="bg-stone-800 hover:bg-stone-700 text-stone-200 px-4 rounded font-medium text-sm flex items-center gap-1 disabled:opacity-50"
                          >
                              <Plus size={16} /> Add
                          </button>
                      </div>
                  </div>
              </section>

              {/* Dietary */}
              <section className="space-y-3">
                  <h2 className="text-sm font-medium text-stone-400 uppercase tracking-widest flex items-center gap-2"><AlertTriangle size={14} /> Dietary Filters</h2>
                  <DietarySelector selected={preferences.dietary} onChange={(sel) => setPreferences(prev => ({...prev, dietary: sel}))} />
              </section>

              {/* CTA */}
              <button
                onClick={handleGenerate}
                disabled={loading}
                className="w-full bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-orange-900/20 transform transition-all active:scale-[0.99] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? <RefreshCw className="animate-spin" /> : <Sparkles />}
                {loading ? 'Consulting the Local Guides...' : 'Plan My Vibe'}
              </button>
            </div>
          </div>
        )}

        {/* Loading View */}
        {loading && !itinerary && (
            <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-6 animate-in fade-in duration-500">
                <div className="relative">
                    <div className="w-16 h-16 rounded-full border-4 border-stone-800 border-t-amber-500 animate-spin"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <MapPin size={24} className="text-stone-500 animate-bounce" />
                    </div>
                </div>
                <div className="text-center space-y-2">
                    <h3 className="text-xl font-medium text-stone-200">Building your itinerary...</h3>
                    <p className="text-stone-500 font-mono text-sm max-w-sm">{loadingMessage}</p>
                </div>
            </div>
        )}

        {/* Error View */}
        {error && (
            <div className="max-w-md mx-auto p-4 bg-red-900/20 border border-red-900/50 rounded-lg text-red-200 text-center">
                <AlertTriangle className="mx-auto mb-2" />
                {error}
                <button onClick={() => setError(null)} className="block mx-auto mt-4 text-sm underline hover:text-white">Dismiss</button>
            </div>
        )}

        {/* ITINERARY VIEW - GRID LAYOUT */}
        {itinerary && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start animate-in fade-in slide-in-from-bottom-8 duration-700">
            
            {/* LEFT COLUMN: Timeline & Stats */}
            <div className="lg:col-span-2 space-y-8">
                {/* Summary Card */}
                <div className="bg-stone-900/50 border border-stone-800 rounded-2xl p-6 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                    <h2 className="text-2xl font-bold text-stone-100 mb-2">{itinerary.title}</h2>
                    <p className="text-stone-400 italic font-light leading-relaxed">"{itinerary.summary}"</p>
                </div>

                <ItineraryStats itinerary={itinerary} />
                
                <div className="pt-4">
                    <ItineraryTimeline 
                        itinerary={itinerary} 
                        currentTime={currentTime}
                        onSwap={handleSwap}
                    />
                </div>
            </div>

            {/* RIGHT COLUMN: Sticky Map */}
            <div className="lg:col-span-1 hidden lg:block sticky top-24 h-[calc(100vh-8rem)] min-h-[600px]">
                <ItineraryMap itinerary={itinerary} currentLocation={currentLocation} />
            </div>

            {/* Mobile Only Map (Appears at bottom on small screens) */}
            <div className="lg:hidden h-[400px] w-full rounded-xl overflow-hidden border border-stone-800">
                 <ItineraryMap itinerary={itinerary} currentLocation={currentLocation} />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}