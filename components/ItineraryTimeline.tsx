import React from 'react';
import { Itinerary } from '../types';
import { MapPin, Camera, Star, AlertCircle, Lock, Navigation2, Footprints, Train, Car, Wallet, Clock } from 'lucide-react';

interface Props {
  itinerary: Itinerary;
  currentTime: string;
}

export const ItineraryTimeline: React.FC<Props> = ({ itinerary, currentTime }) => {
  
  const getMapsLink = (stop: any, prevStop: any) => {
    // If it's the first stop, just search the location
    if (!prevStop) {
      return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(stop.location.address)}`;
    }
    // Otherwise calculate directions
    return `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(prevStop.location.address)}&destination=${encodeURIComponent(stop.location.address)}&travelmode=transit`;
  };

  const getTravelIcon = (mode: string) => {
    const m = mode.toLowerCase();
    if (m.includes('walk')) return <Footprints size={12} />;
    if (m.includes('taxi') || m.includes('car')) return <Car size={12} />;
    return <Train size={12} />;
  };

  return (
    <div className="relative space-y-8 pl-8 border-l border-zinc-800 ml-4">
      {itinerary.stops.map((stop, index) => {
        const isPast = stop.startTime < currentTime;
        const isNext = !isPast && (index === 0 || itinerary.stops[index - 1].startTime < currentTime);
        const prevStop = index > 0 ? itinerary.stops[index - 1] : null;

        return (
          <div key={stop.id} className={`relative group ${isPast ? 'opacity-50 grayscale' : 'opacity-100'}`}>
            
            {/* Connector Line Logic for Travel Info */}
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
            <div className="flex items-center gap-3 mb-1">
              <span className="text-xs font-mono text-zinc-500 flex items-center gap-1">
                 <Clock size={10} />
                 {stop.startTime} - {stop.endTime || '?'}
              </span>
              <span className="text-xs font-mono text-zinc-600 flex items-center gap-1">
                 <Wallet size={10} /> {stop.estimatedCost}
              </span>
            </div>

            {/* Card */}
            <div className={`
              rounded-xl p-5 border transition-all duration-300 relative overflow-hidden
              ${stop.isFixed 
                ? 'bg-amber-950/10 border-amber-500/30' 
                : isNext 
                  ? 'bg-gradient-to-br from-zinc-800 to-zinc-900 border-indigo-500/30 shadow-lg' 
                  : 'bg-zinc-900/40 border-zinc-800 hover:border-zinc-700'}
            `}>
              {/* Fixed Stop Indicator */}
              {stop.isFixed && (
                <div className="absolute top-0 right-0 p-2 bg-amber-500/10 rounded-bl-xl text-amber-500">
                   <Lock size={14} />
                </div>
              )}

              <div className="flex justify-between items-start mb-2 pr-8">
                <h3 className="font-bold text-lg text-zinc-100 leading-tight">{stop.name}</h3>
                {!stop.isFixed && (
                  <div className="flex items-center gap-2">
                     {stop.instagramScore > 7 && (
                       <div className="bg-pink-500/20 text-pink-400 p-1 rounded-md" title={`Insta Score: ${stop.instagramScore}`}>
                         <Camera size={14} />
                       </div>
                     )}
                     {stop.authenticityScore > 7 && (
                       <div className="bg-emerald-500/20 text-emerald-400 p-1 rounded-md" title={`Auth Score: ${stop.authenticityScore}`}>
                         <Star size={14} />
                       </div>
                     )}
                  </div>
                )}
              </div>
              
              <p className="text-sm text-zinc-400 mb-3">{stop.description}</p>
              
              {/* Vibe Tags */}
              <div className="flex flex-wrap gap-2 mb-3">
                {stop.tags.map(tag => (
                  <span key={tag} className="text-[10px] uppercase tracking-wider px-2 py-1 bg-zinc-950 rounded border border-zinc-800 text-zinc-500">
                    {tag}
                  </span>
                ))}
              </div>

              {/* Photo Spot Tip */}
              {stop.bestPhotoSpot && (
                  <div className="mb-3 p-2 rounded bg-zinc-950/50 border border-zinc-800 flex gap-2 items-start">
                      <Camera size={14} className="text-indigo-400 mt-0.5 shrink-0" />
                      <p className="text-xs text-zinc-400"><span className="text-indigo-400 font-medium">Photo Op:</span> {stop.bestPhotoSpot}</p>
                  </div>
              )}

              {/* Safety/Dietary Note */}
              {stop.dietaryNotes && (
                <div className="flex items-start gap-2 mt-4 p-3 bg-red-900/10 border border-red-900/30 rounded-lg text-xs text-red-200/80">
                  <AlertCircle size={14} className="mt-0.5 shrink-0" />
                  <p>{stop.dietaryNotes}</p>
                </div>
              )}
              
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/5">
                <div className="flex items-center gap-1 text-xs text-zinc-500">
                  <MapPin size={12} /> {stop.location.address}
                </div>
                <a 
                  href={getMapsLink(stop, prevStop)} 
                  target="_blank" 
                  rel="noreferrer"
                  className="flex items-center gap-1.5 text-xs font-medium text-indigo-400 hover:text-indigo-300 transition-colors bg-indigo-500/10 px-3 py-1.5 rounded-full"
                >
                  <Navigation2 size={12} /> Navigate
                </a>
              </div>
            </div>
            
            {/* Connector Line (HTML/CSS hack for continuous line) */}
            {index !== itinerary.stops.length - 1 && (
               <div className="absolute left-[20px] top-5 bottom-0 w-px bg-zinc-800 -z-10" /> 
            )}
          </div>
        );
      })}
    </div>
  );
};