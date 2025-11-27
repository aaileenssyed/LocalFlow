import { GoogleGenAI, Type, Schema } from "@google/genai";
import { UserPreferences, Itinerary } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Helper to find a location using Google Maps Tool
export const resolveLocation = async (query: string, userLocationHint?: string) => {
  if (!query) return null;
  
  const prompt = `Find the specific location: "${query}" near "${userLocationHint || ''}". Return the official name and formatted address.`;

  try {
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          tools: [{ googleMaps: {} }],
        }
      });

      // Extract grounding metadata if available
      const grounding = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
      let address = query;
      let name = query;
      let lat = 0;
      let lng = 0;

      // Logic to parse the text response or grounding chunks would go here
      // For this implementation, we will trust the text response to contain the address
      // or simply return the query if the tool fails. 
      // In a real implementation with the Maps tool, we'd parse the groundingChunks.maps.uri
      
      // Fallback: Just return the text which likely contains the address
      return {
          name: name,
          address: response.text || query,
          lat: 0, // Maps tool doesn't always return lat/lng directly in text, handled by generation later
          lng: 0
      };

  } catch (e) {
      console.error("Location resolve failed", e);
      return { name: query, address: query, lat: 0, lng: 0 };
  }
};

// Define the Schema for the response to ensure Type Safety
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
    estimatedCost: { type: Type.STRING, description: "Cost estimate in local currency or USD, e.g. '¥2000' or 'Free'" },
    bestPhotoSpot: { type: Type.STRING, description: "Specific advice on where/what to photograph here" },
    travelToNext: {
        type: Type.OBJECT,
        description: "Travel to the NEXT stop in the list.",
        properties: {
            mode: { type: Type.STRING, enum: ["Walking", "Transit", "Taxi"] },
            duration: { type: Type.STRING, description: "e.g. '15 min'" }
        }
    },
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

export const generateItinerary = async (
  prefs: UserPreferences, 
  currentLocation: {lat: number, lng: number},
  currentTime: string
): Promise<Itinerary> => {
  
  const prompt = `
    Create a travel itinerary for: ${prefs.location}.
    Current Time: ${currentTime}.
    
    USER PREFERENCES:
    - Vibe Score: ${prefs.vibeScore} (0 = Pure Aesthetic/Tourist, 100 = Deep Local/Authentic).
    - Vibe Description: "${prefs.vibeDescription}". (Use this to tailor the mood/style of places).
    - Dietary Restrictions: ${prefs.dietary.join(', ') || "None"}.
    - Budget Level: ${prefs.budget}.
    
    MANDATORY COMMITMENTS (Fixed Stops):
    The user has the following fixed plans with specific START and END times. 
    You MUST include these exactly as specified. 
    Do not double book.
    ${JSON.stringify(prefs.fixedCommitments)}

    ALGORITHM RULES:
    1. TIMING IS KEY: 
       - If a place is famous for night views (e.g., Times Square, Night Markets), schedule it in the evening.
       - If a place is a "Fixed Commitment", adhere strictly to the startTime and endTime provided.
       - Fill gaps between commitments with vibe-appropriate activities.
    2. VIBE MATCHING: 
       - If Vibe Score > 70, discard any location with Authenticity Score < 7, unless it's a fixed commitment.
       - Use the "Vibe Description" to filter recommendations (e.g. if "Neon", find bright signage; if "Quiet", find parks/libraries).
    3. LOGISTICS: 
       - Calculate realistic 'travelToNext' (mode and duration) between stops. 
       - Ensure there is enough travel time between a chosen activity and a fixed commitment.
    4. PHOTOS:
       - Provide a specific 'bestPhotoSpot' tip for every location (e.g. "From the bridge facing west").
    5. Output JSON only.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: itinerarySchema,
        thinkingConfig: { thinkingBudget: 1024 }, 
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from Gemini");
    
    return JSON.parse(text) as Itinerary;
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

    LOGIC:
    1. Respect 'isFixed' stops. Do NOT remove them unless impossible to reach (then warn in title).
    2. Adjust start times and travel durations.
    3. If running late, drop non-fixed stops.
    
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
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from Gemini");
    
    return JSON.parse(text) as Itinerary;
  } catch (error) {
    console.error("Gemini Recalc Error:", error);
    throw error;
  }
};