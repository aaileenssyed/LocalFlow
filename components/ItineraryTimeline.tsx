import React from 'react';
import { Itinerary } from '../types';
import { MapPin, Camera, Star, AlertCircle, Lock, Navigation2, Footprints, Train, Car, Wallet, Clock, Users, Lightbulb, RefreshCcw } from 'lucide-react';

interface Props {
  itinerary: Itinerary;
  currentTime: string;
  onSwap?: (stopId: string, stopName: string) => void;
}

export const ItineraryTimeline: React.FC<Props> = ({ itinerary, currentTime, onSwap }) => {
  
  const getMapsLink = (stop: any, prevStop: any) => {
    if (!prevStop) {
      return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(stop.location.address)}`;
    }
    return `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(prevStop.location.address)}&destination=${encodeURIComponent(stop.location.address)}&travelmode=transit`;
  };

  const getTravelIcon = (mode: string) => {
    const m = mode.toLowerCase();
    if (m.includes('walk')) return <Footprints size={12} />;
    if (m.includes('taxi') || m.includes('car')) return <Car size={12} />;
    return <Train size={12} />;
  };

  const getCrowdColor = (level?: string) => {
      switch(level) {
          case 'Low': return 'text-emerald-400';
          case 'Moderate': return 'text-yellow-400';
          case 'Busy': return 'text-orange-400';
          case 'Crushed': return 'text-red-500';
          default: return 'text-zinc-500';
      }
  };

  return (
    <div className="relative space-y-8 pl-8 border-l border-zinc-800 ml-4">
      {itinerary.stops.map((stop, index) => {
        const isPast = stop.startTime < currentTime;
        const isNext = !isPast && (index === 0 || itinerary.stops[index - 1].startTime < currentTime);
        const prevStop = index > 0 ? itinerary.stops[index - 1] : null;

        return (
          <div key={stop.id} className={`relative group ${isPast ? 'opacity-50 grayscale' : 'opacity-100'}`}>
            
            {/* Travel Info */}
            {prevStop && prevStop.travelToNext && (
              <div className="absolute -left-[32px] -top-12 h-12 flex flex-col items-end justify-center w-24 pointer-events-none">
                 <div className="bg-zinc-950 border border-zinc-800 rounded px-2 py-0.5 text-[10px] text-zinc-500 flex items-center gap-1.5 shadow-sm">
                    {getTravelIcon(prevStop.travelToNext.mode)}
                    <span>{prevStop.travelToNext.duration}</span>
                 </div>
              </div>
            )}

            {/* Timeline Dot */}
            <div className={`
              absolute -left-[39px] top-0 w-5 h-5 rounded-full border-4 border-zinc-950 z-10
              ${stop.isFixed 
                ? 'bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.4)]' 
                : isNext ? 'bg-indigo-500 scale-125 shadow-[0_0_15px_rgba(99,102,241,0.5)]' : 'bg-zinc-700'}
            `} />

            {/* Time & Cost Header */}
            <div className="flex items-center gap-4 mb-1">
              <span className="text-xs font-mono text-zinc-500 flex items-center gap-1">
                 <Clock size={10} />
                 {stop.startTime} - {stop.endTime || '?'}
              </span>
              <span className="text-xs font-mono text-zinc-600 flex items-center gap-1">
                 <Wallet size={10} /> {stop.estimatedCost}
              </span>
              {stop.crowdLevel && (
                  <span className={`text-xs font-mono flex items-center gap-1 ${getCrowdColor(stop.crowdLevel)}`}>
                      <Users size={10} /> {stop.crowdLevel}
                  </span>
              )}
            </div>

            {/* Card */}
            <div className={`
              rounded-xl p-5 border transition-all duration-300 relative overflow-hidden group/card
              ${stop.isFixed 
                ? 'bg-amber-950/10 border-amber-500/30' 
                : isNext 
                  ? 'bg-gradient-to-br from-zinc-800 to-zinc-900 border-indigo-500/30 shadow-lg' 
                  : 'bg-zinc-900/40 border-zinc-800 hover:border-zinc-700'}
            `}>
              {/* Actions */}
              <div className="absolute top-3 right-3 flex gap-2">
                 {!stop.isFixed && onSwap && (
                     <button 
                        onClick={() => onSwap(stop.id, stop.name)}
                        className="p-1.5 text-zinc-600 hover:text-indigo-400 hover:bg-indigo-500/10 rounded transition-colors opacity-0 group-hover/card:opacity-100"
                        title="Swap for alternative"
                     >
                         <RefreshCcw size={14} />
                     </button>
                 )}
                 {stop.isFixed && (
                    <div className="p-1.5 bg-amber-500/10 rounded text-amber-500">
                        <Lock size={14} />
                    </div>
                 )}
              </div>

              <div className="flex justify-between items-start mb-2 pr-12">
                <h3 className="font-bold text-lg text-zinc-100 leading-tight">{stop.name}</h3>
              </div>
              
              <p className="text-sm text-zinc-400 mb-3">{stop.description}</p>
              
              {/* Tips Section */}
              <div className="space-y-2 mb-4">
                  {stop.localTip && (
                      <div className="text-xs flex gap-2 items-start text-emerald-200/80 bg-emerald-900/10 p-2 rounded border border-emerald-900/20">
                          <Lightbulb size={14} className="mt-0.5 shrink-0" />
                          <span><strong className="text-emerald-400">Local Tip:</strong> {stop.localTip}</span>
                      </div>
                  )}
                  {stop.bestPhotoSpot && (
                      <div className="text-xs flex gap-2 items-start text-indigo-200/80 bg-indigo-900/10 p-2 rounded border border-indigo-900/20">
                          <Camera size={14} className="mt-0.5 shrink-0" />
                          <span><strong className="text-indigo-400">Photo Op:</strong> {stop.bestPhotoSpot}</span>
                      </div>
                  )}
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-2 mb-3">
                {stop.tags.map(tag => (
                  <span key={tag} className="text-[10px] uppercase tracking-wider px-2 py-1 bg-zinc-950 rounded border border-zinc-800 text-zinc-500">
                    {tag}
                  </span>
                ))}
                {!stop.isFixed && (
                    <div className="flex items-center gap-1 ml-auto">
                        {stop.instagramScore > 7 && <Star size={10} className="text-pink-500" />}
                        {stop.authenticityScore > 7 && <Star size={10} className="text-emerald-500" />}
                    </div>
                )}
              </div>
              
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/5">
                <div className="flex items-center gap-1 text-xs text-zinc-500 truncate max-w-[200px]">
                  <MapPin size={12} /> {stop.location.address}
                </div>
                <a 
                  href={getMapsLink(stop, prevStop)} 
                  target="_blank" 
                  rel="noreferrer"
                  className="flex items-center gap-1.5 text-xs font-medium text-zinc-300 hover:text-white transition-colors bg-zinc-800 hover:bg-zinc-700 px-3 py-1.5 rounded-full border border-zinc-700"
                >
                  <Navigation2 size={12} /> Directions
                </a>
              </div>
            </div>
            
            {/* Connector Line */}
            {index !== itinerary.stops.length - 1 && (
               <div className="absolute left-[20px] top-5 bottom-0 w-px bg-zinc-800 -z-10" /> 
            )}
          </div>
        );
      })}
    </div>
  );
};