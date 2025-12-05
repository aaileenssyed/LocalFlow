import { GoogleGenAI, Type, Schema } from "@google/genai";
import { UserPreferences, Itinerary, Stop } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Helper to strip markdown code blocks if present
const cleanJsonString = (str: string) => {
  return str.replace(/```json\n?|```/g, '').trim();
};

// Phase 2: Resolve specific location details using Google Maps Tool
// We cannot use responseMimeType: "application/json" with googleMaps, so we parse manually.
export const resolveLocation = async (query: string, userLocationHint?: string) => {
  if (!query) return { lat: 0, lng: 0, address: query };
  
  const prompt = `
    Find the specific location: "${query}" near "${userLocationHint || ''}". 
    Return a JSON object with the keys: "lat" (number), "lng" (number), "address" (string), and "name" (official name string).
    Ensure the coordinates are accurate real-world values from Google Maps.
    Return ONLY the raw JSON. No Markdown.
  `;

  try {
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          tools: [{ googleMaps: {} }],
        }
      });

      const text = response.text;
      if (!text) return { lat: 0, lng: 0, address: query, name: query };

      try {
          const json = JSON.parse(cleanJsonString(text));
          return {
              name: json.name || query,
              address: json.address || query,
              lat: json.lat || 0,
              lng: json.lng || 0
          };
      } catch (e) {
          console.warn("Failed to parse location JSON", text);
          return { lat: 0, lng: 0, address: text.substring(0, 50), name: query };
      }

  } catch (e) {
      console.error("Location resolve failed", e);
      return { name: query, address: query, lat: 0, lng: 0 };
  }
};

// Schema for Phase 1 (Planning)
const stopSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    id: { type: Type.STRING },
    name: { type: Type.STRING },
    description: { type: Type.STRING },
    startTime: { type: Type.STRING, description: "HH:MM 24h format" },
    endTime: { type: Type.STRING, description: "HH:MM 24h format" },
    durationMinutes: { type: Type.INTEGER },
    type: { type: Type.STRING, enum: ["FOOD", "SIGHTSEEING", "ACTIVITY", "TRANSIT", "COMMITMENT"] },
    authenticityScore: { type: Type.INTEGER, description: "1-10" },
    instagramScore: { type: Type.INTEGER, description: "1-10" },
    isFixed: { type: Type.BOOLEAN, description: "True if this matches a user commitment" },
    estimatedCost: { type: Type.STRING, description: "Cost estimate e.g. '$$', 'Free', '$20'" },
    bestPhotoSpot: { type: Type.STRING, description: "Specific advice on where/what to photograph here" },
    localTip: { type: Type.STRING, description: "Insider advice regarding rush, best seats, or hidden details" },
    whyThisSpot: { type: Type.STRING, description: "Conversational reason why this specific spot fits the user's vibe/request." },
    crowdLevel: { type: Type.STRING, enum: ["Low", "Moderate", "Busy", "Crushed"] },
    travelToNext: {
        type: Type.OBJECT,
        description: "Travel to the NEXT stop in the list.",
        properties: {
            mode: { type: Type.STRING, enum: ["Walking", "Transit", "Taxi"] },
            duration: { type: Type.STRING, description: "e.g. '15 min'" }
        }
    },
    // We request structure here, but values will be placeholders until Phase 2
    location: {
      type: Type.OBJECT,
      properties: {
        lat: { type: Type.NUMBER },
        lng: { type: Type.NUMBER },
        address: { type: Type.STRING },
      }
    },
    dietaryNotes: { type: Type.STRING },
    tags: { type: Type.ARRAY, items: { type: Type.STRING } },
  },
  required: ["id", "name", "startTime", "endTime", "authenticityScore", "instagramScore", "tags", "estimatedCost"]
};

const itinerarySchema: Schema = {
  type: Type.OBJECT,
  properties: {
    id: { type: Type.STRING },
    title: { type: Type.STRING },
    stops: {
      type: Type.ARRAY,
      items: stopSchema
    },
    totalAuthenticityScore: { type: Type.INTEGER },
    totalInstagramScore: { type: Type.INTEGER },
    summary: { type: Type.STRING },
  },
  required: ["stops", "title", "totalAuthenticityScore", "totalInstagramScore"]
};

// Enrich the stops with real coordinates
const enrichItineraryWithLocations = async (itinerary: Itinerary, cityContext: string): Promise<Itinerary> => {
    const enrichedStops = await Promise.all(itinerary.stops.map(async (stop) => {
        // If it's a user commitment with coords already, skip
        if (stop.location && stop.location.lat !== 0) return stop;
        
        // Otherwise resolve
        const loc = await resolveLocation(stop.name, cityContext);
        return {
            ...stop,
            location: {
                ...stop.location,
                lat: loc.lat,
                lng: loc.lng,
                address: loc.address
            }
        };
    }));

    return {
        ...itinerary,
        stops: enrichedStops
    };
};

export const generateItinerary = async (
  prefs: UserPreferences, 
  currentLocation: {lat: number, lng: number},
  currentTime: string
): Promise<Itinerary> => {
  
  // Phase 1: Generate the plan structure (JSON Mode, No Tools)
  const prompt = `
    You are a savvy, aesthetic-obsessed LOCAL FRIEND acting as a travel guide for ${prefs.location}.
    Current Time: ${currentTime}.
    Trip Start Time: ${prefs.tripStartTime}.
    Trip End Time: ${prefs.tripEndTime}.
    
    USER PREFERENCES:
    - Vibe Score: ${prefs.vibeScore} (0 = High Gloss/Tourist, 100 = Gritty/Local).
    - Vibe Description: "${prefs.vibeDescription}".
    - Dietary Restrictions: ${prefs.dietary.join(', ') || "None"}.
    - Budget Level: ${prefs.budget}.
    
    FIXED COMMITMENTS (User Must Be Here):
    ${JSON.stringify(prefs.fixedCommitments)}

    INSTRUCTIONS:
    1. **Persona**: Be the friend who knows the hidden rooftop bars in Dumbo, the best time to ride the Roosevelt Tram (sunset), and where to get the best bagel without the line.
    2. **Timing**: 
       - Schedule strictly between ${prefs.tripStartTime} and ${prefs.tripEndTime}.
       - Prioritize "Golden Hour" (sunrise/sunset) for scenic spots.
       - Avoid "Crushed" crowd levels if possible, or warn the user.
    3. **Logistics**:
       - Fill gaps between commitments.
       - Account for realistic travel times in a busy city.
       - Leave lat/lng as 0 for now; we will resolve them later.
    4. **Output**:
       - Provide a 'localTip' for every stop (e.g. "Sit on the front car", "Ask for the secret menu").
       - 'whyThisSpot' should explain the connection to the user's vibe description.
       - 'bestPhotoSpot' is mandatory.

    Return JSON only.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: itinerarySchema,
        thinkingConfig: { thinkingBudget: 2048 },
        // NOTE: No googleMaps tool here to allow proper JSON schema generation
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from Gemini");
    
    const initialItinerary = JSON.parse(text) as Itinerary;

    // Phase 2: Grounding (Resolve Locations)
    return await enrichItineraryWithLocations(initialItinerary, prefs.location);

  } catch (error) {
    console.error("Gemini Gen Error:", error);
    throw error;
  }
};

export const recalculateItinerary = async (
  currentItinerary: Itinerary,
  currentLocation: {lat: number, lng: number},
  currentTime: string,
  reason: string
): Promise<Itinerary> => {

  const prompt = `
    RECALCULATE ITINERARY.
    Reason: ${reason}.
    Current Time: ${currentTime}.
    Current Plan: ${JSON.stringify(currentItinerary.stops.map(s => s.name))}.

    INSTRUCTIONS:
    1. If the reason is "Swap [Location Name]", replace that specific stop with a relevant alternative that fits the time slot and vibe.
    2. Keep fixed commitments locked.
    3. Re-optimize travel times.
    
    Return the full updated JSON structure.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: itinerarySchema,
        thinkingConfig: { thinkingBudget: 0 },
        // NOTE: No googleMaps tool here
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from Gemini");
    
    const updatedItinerary = JSON.parse(text) as Itinerary;

    // Phase 2: Grounding (Resolve Locations for new stops)
    // We pass the start location address from the first stop as a hint if available
    const locationHint = currentItinerary.stops[0]?.location?.address || "New York";
    return await enrichItineraryWithLocations(updatedItinerary, locationHint);

  } catch (error) {
    console.error("Gemini Recalc Error:", error);
    throw error;
  }
};
