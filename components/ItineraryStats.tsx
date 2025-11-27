import React from 'react';
import { 
  Radar, 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  ResponsiveContainer 
} from 'recharts';
import { Itinerary } from '../types';

interface Props {
  itinerary: Itinerary;
}

export const ItineraryStats: React.FC<Props> = ({ itinerary }) => {
  const data = [
    { subject: 'Visuals', A: itinerary.totalInstagramScore, fullMark: 100 },
    { subject: 'Authentic', A: itinerary.totalAuthenticityScore, fullMark: 100 },
    { subject: 'Popularity', A: 100 - itinerary.totalAuthenticityScore, fullMark: 100 }, // Inverse auth
  ];

  return (
    <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5">
      <h3 className="text-sm font-medium text-zinc-400 mb-4 uppercase tracking-wider">Vibe Analysis</h3>
      <div className="h-48 w-full -ml-4">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
            <PolarGrid stroke="#3f3f46" />
            <PolarAngleAxis dataKey="subject" tick={{ fill: '#a1a1aa', fontSize: 10 }} />
            <Radar
              name="Vibe"
              dataKey="A"
              stroke="#8b5cf6"
              strokeWidth={2}
              fill="#8b5cf6"
              fillOpacity={0.3}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>
      <div className="space-y-2 mt-2">
         <div className="flex justify-between text-xs">
            <span className="text-zinc-500">Instagram Score</span>
            <span className="text-pink-400 font-mono">{itinerary.totalInstagramScore}/100</span>
         </div>
         <div className="flex justify-between text-xs">
            <span className="text-zinc-500">Authenticity Score</span>
            <span className="text-emerald-400 font-mono">{itinerary.totalAuthenticityScore}/100</span>
         </div>
      </div>
    </div>
  );
};