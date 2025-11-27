import React, { useState, useEffect } from 'react';
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
  Wand2
} from 'lucide-react';
import { VibeSlider } from './components/VibeSlider';
import { DietarySelector } from './components/DietarySelector';
import { ItineraryTimeline } from './components/ItineraryTimeline';
import { ItineraryStats } from './components/ItineraryStats';
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

  // Simulated Location/Time State
  const [currentLocation, setCurrentLocation] = useState<{lat: number, lng: number}>(MOCK_START_LOCATION);
  const [currentTime, setCurrentTime] = useState<string>("09:00");
  const [isSimulating, setIsSimulating] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    setLoadingMessage("Calculating logistics, finding photo spots & matching vibe...");
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
    setLoadingMessage(`Adapting plan: ${reason}...`);
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

  const addCommitment = () => {
    if (newCommitment.startTime && newCommitment.location) {
        const commit: FixedCommitment = {
            id: Math.random().toString(),
            startTime: newCommitment.startTime!,
            endTime: newCommitment.endTime || newCommitment.startTime!, // Fallback equal if empty
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
    <div className="min-h-screen bg-zinc-950 text-zinc-100 selection:bg-indigo-500/30">
      
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-zinc-950/80 border-b border-white/5">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center">
              <Navigation size={18} className="text-white" />
            </div>
            <span className="font-bold text-xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-zinc-400">
              LocalFlow
            </span>
          </div>
          <div className="flex items-center gap-4 text-xs font-mono text-zinc-500">
             <span className="hidden sm:inline flex items-center gap-1">
               <Clock size={12} /> {currentTime}
             </span>
             <span className="flex items-center gap-1 text-emerald-500">
               <ShieldCheck size={12} /> Live
             </span>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 pb-32">
        
        {/* Onboarding / Setup Section */}
        {!itinerary && !loading && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="text-center space-y-4 py-8">
              <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-b from-white via-white to-zinc-500">
                Orchestrate your day.
              </h1>
              <p className="text-zinc-400 max-w-md mx-auto">
                Weave your fixed commitments into a vibe-based journey. 
                Optimized for best photo ops and logistics.
              </p>
            </div>

            <div className="bg-zinc-900/50 border border-white/5 rounded-2xl p-6 md:p-8 space-y-8 shadow-2xl shadow-indigo-500/5">
              
              {/* Start Location Input */}
              <section className="space-y-3">
                 <h2 className="text-lg font-medium text-zinc-200">Where are we headed?</h2>
                 <input 
                    type="text" 
                    placeholder="e.g. Shinjuku Station, Tokyo"
                    className="w-full bg-black/40 border border-zinc-800 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all placeholder:text-zinc-600"
                    onChange={(e) => setPreferences(prev => ({...prev, location: e.target.value}))}
                    value={preferences.location}
                 />
              </section>

              {/* Vibe Settings */}
              <section className="space-y-4">
                <div className="flex justify-between items-end">
                  <h2 className="text-lg font-medium text-zinc-200">The Vibe</h2>
                </div>
                
                <div className="space-y-2">
                    <label className="text-xs text-zinc-500 uppercase font-bold tracking-wider">Tone & Style</label>
                    <textarea 
                        className="w-full bg-black/40 border border-zinc-800 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all placeholder:text-zinc-600 resize-none"
                        rows={2}
                        placeholder="e.g. Cyberpunk neon photography, cozy vintage cafes, hidden gems only..."
                        value={preferences.vibeDescription || ''}
                        onChange={(e) => setPreferences(prev => ({...prev, vibeDescription: e.target.value}))}
                    />
                </div>

                <div className="space-y-2">
                     <div className="flex justify-between items-center text-xs text-zinc-500 uppercase font-bold tracking-wider">
                         <span>Tourist</span>
                         <span>Authentic</span>
                     </div>
                    <VibeSlider 
                        value={preferences.vibeScore} 
                        onChange={(val) => setPreferences(prev => ({...prev, vibeScore: val}))} 
                    />
                </div>
              </section>

              {/* Budget */}
              <section className="space-y-3">
                  <h2 className="text-lg font-medium text-zinc-200">Budget Level</h2>
                  <div className="grid grid-cols-3 gap-3">
                      {BUDGET_OPTIONS.map((opt) => (
                          <button
                            key={opt.value}
                            onClick={() => setPreferences(prev => ({...prev, budget: opt.value as any}))}
                            className={`
                                py-3 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all
                                ${preferences.budget === opt.value 
                                    ? 'bg-zinc-800 border-indigo-500/50 text-indigo-300' 
                                    : 'bg-black/20 border-zinc-800 text-zinc-500 hover:bg-zinc-800/50'}
                            `}
                          >
                              <span className="font-mono text-lg">{opt.icon}</span>
                              <span className="text-[10px] uppercase font-bold tracking-wider">{opt.label}</span>
                          </button>
                      ))}
                  </div>
              </section>

              {/* Dietary */}
              <section className="space-y-3">
                <h2 className="text-lg font-medium text-zinc-200">Dietary Guardrails</h2>
                <DietarySelector 
                  selected={preferences.dietary} 
                  onChange={(dietary) => setPreferences(prev => ({...prev, dietary}))} 
                />
              </section>

              {/* Fixed Commitments */}
              <section className="space-y-3">
                  <h2 className="text-lg font-medium text-zinc-200">Commitments & Must-Dos</h2>
                  <p className="text-xs text-zinc-500">Add reservations, meetings, or places you MUST see.</p>
                  
                  {/* List of existing commitments */}
                  <div className="space-y-2 mb-4">
                      {preferences.fixedCommitments.map(c => (
                          <div key={c.id} className="flex items-center justify-between p-3 bg-zinc-800/50 rounded-lg border border-zinc-700/50">
                              <div className="flex items-center gap-3">
                                  <div className="flex flex-col items-center justify-center bg-amber-500/10 text-amber-500 px-2 py-1 rounded text-xs font-mono border border-amber-500/20 w-16 text-center">
                                      <span>{c.startTime}</span>
                                      <span className="text-[10px] opacity-70">to</span>
                                      <span>{c.endTime}</span>
                                  </div>
                                  <div className="text-sm">
                                      <div className="font-medium text-zinc-200">{c.location}</div>
                                      <div className="text-xs text-zinc-500">{c.description}</div>
                                  </div>
                              </div>
                              <button onClick={() => removeCommitment(c.id)} className="text-zinc-500 hover:text-red-400 transition-colors">
                                  <Trash2 size={16} />
                              </button>
                          </div>
                      ))}
                  </div>

                  {/* Input Row */}
                  <div className="bg-zinc-900 rounded-xl p-4 border border-zinc-800 space-y-3">
                      <div className="flex gap-2 items-center">
                          <div className="flex-1 space-y-1">
                              <label className="text-[10px] uppercase text-zinc-500 font-bold">From</label>
                              <input 
                                  type="time" 
                                  className="w-full bg-black/40 border border-zinc-800 rounded-lg px-2 py-2 text-sm text-center focus:outline-none focus:border-indigo-500/50"
                                  value={newCommitment.startTime}
                                  onChange={e => setNewCommitment(prev => ({...prev, startTime: e.target.value}))}
                              />
                          </div>
                          <div className="flex-1 space-y-1">
                              <label className="text-[10px] uppercase text-zinc-500 font-bold">To</label>
                              <input 
                                  type="time" 
                                  className="w-full bg-black/40 border border-zinc-800 rounded-lg px-2 py-2 text-sm text-center focus:outline-none focus:border-indigo-500/50"
                                  value={newCommitment.endTime}
                                  onChange={e => setNewCommitment(prev => ({...prev, endTime: e.target.value}))}
                              />
                          </div>
                      </div>

                      <div className="relative">
                          <input 
                              type="text" 
                              placeholder="Location (e.g. Top of the Rock)"
                              className="w-full bg-black/40 border border-zinc-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500/50 pr-10"
                              value={newCommitment.location}
                              onChange={e => setNewCommitment(prev => ({...prev, location: e.target.value}))}
                          />
                          <button 
                            onClick={handleMagicLocation}
                            disabled={resolvingLoc || !newCommitment.location}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-indigo-400 hover:text-white disabled:opacity-30"
                            title="Auto-complete address with AI"
                          >
                            {resolvingLoc ? <RefreshCw size={14} className="animate-spin"/> : <Wand2 size={14} />}
                          </button>
                      </div>

                      <div className="flex gap-2">
                        <input 
                            type="text" 
                            placeholder="Note (e.g. Sunset viewing)"
                            className="flex-1 bg-black/40 border border-zinc-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500/50"
                            value={newCommitment.description}
                            onChange={e => setNewCommitment(prev => ({...prev, description: e.target.value}))}
                        />
                        <button 
                            onClick={addCommitment}
                            disabled={!newCommitment.location}
                            className="bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-lg px-4 flex items-center justify-center transition-colors disabled:opacity-50"
                        >
                            <Plus size={16} />
                        </button>
                      </div>
                  </div>
              </section>

              <button 
                onClick={handleGenerate}
                disabled={!preferences.location}
                className="w-full h-14 bg-white text-black font-semibold rounded-xl hover:bg-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.99] flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20"
              >
                {loading ? 'Thinking...' : "Let's Flow"} <Sparkles size={18} />
              </button>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-32 space-y-6 animate-pulse">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                 <RefreshCw size={20} className="text-indigo-400 animate-spin-slow" />
              </div>
            </div>
            <p className="text-zinc-400 font-mono text-sm">{loadingMessage}</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="p-4 border border-red-500/20 bg-red-500/10 rounded-xl text-red-200 flex items-center gap-3 my-8">
            <AlertTriangle size={20} />
            {error}
            <button onClick={() => setError(null)} className="ml-auto text-sm underline opacity-70 hover:opacity-100">Dismiss</button>
          </div>
        )}

        {/* Active Itinerary View */}
        {itinerary && !loading && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Main Timeline */}
            <div className="lg:col-span-2 space-y-6">
              <div className="flex items-center justify-between">
                 <div>
                    <h2 className="text-2xl font-bold text-white">Your Flow</h2>
                    <p className="text-xs text-zinc-500">{preferences.vibeDescription}</p>
                 </div>
                 <button 
                   onClick={() => setItinerary(null)}
                   className="text-xs text-zinc-500 hover:text-white transition-colors"
                 >
                   Reset Plan
                 </button>
              </div>
              
              <ItineraryTimeline itinerary={itinerary} currentTime={currentTime} />
            </div>

            {/* Sidebar / Controls */}
            <div className="lg:col-span-1 space-y-6">
              <ItineraryStats itinerary={itinerary} />
              
              {/* Simulation / Fluid Plan Controls */}
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5 space-y-4 sticky top-24">
                <div className="flex items-center gap-2 text-indigo-400 font-medium text-sm mb-2">
                  <Settings size={14} /> 
                  <span>Fluid Control</span>
                </div>
                
                <div className="space-y-2">
                   <p className="text-xs text-zinc-500">Current Time: <span className="text-zinc-300 font-mono">{currentTime}</span></p>
                   <button 
                     onClick={() => setIsSimulating(!isSimulating)}
                     className={`w-full text-xs py-2 px-3 rounded-lg border transition-colors ${isSimulating ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-300' : 'border-zinc-800 hover:bg-zinc-800 text-zinc-400'}`}
                   >
                     {isSimulating ? 'Pause Time' : 'Simulate Time Passing'}
                   </button>
                </div>

                <div className="h-px bg-zinc-800" />

                <div className="grid grid-cols-2 gap-2">
                  <button 
                    onClick={() => handleRecalculate("Running 30 mins late")}
                    className="p-3 bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500/20 rounded-lg flex flex-col items-center gap-2 text-amber-500 transition-colors"
                  >
                    <Clock size={16} />
                    <span className="text-[10px] font-bold uppercase tracking-wide">I'm Late</span>
                  </button>

                  <button 
                    onClick={() => handleRecalculate("Diverged from path")}
                    className="p-3 bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/20 rounded-lg flex flex-col items-center gap-2 text-emerald-500 transition-colors"
                  >
                    <MapPin size={16} />
                    <span className="text-[10px] font-bold uppercase tracking-wide">Diverged</span>
                  </button>
                </div>
              </div>
            </div>

          </div>
        )}
      </main>
    </div>
  );
}