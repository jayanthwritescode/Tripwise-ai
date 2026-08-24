import { GoogleGenAI, Type } from "@google/genai";
import { TripDetails, Itinerary, SearchResult, HeroImage, GroundingChunk } from "../types";

let ai: GoogleGenAI | null = null;
let lastUsedKey: string | null = null;

const getAI = () => {
  const customKey = localStorage.getItem('tripwise_gemini_key');
  if (!customKey || customKey.trim() === '') {
    throw new Error("Missing Gemini API Key. Please configure your API key in the settings.");
  }

  if (ai && lastUsedKey === customKey) {
    return ai;
  }
  
  ai = new GoogleGenAI({
    apiKey: customKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });
  lastUsedKey = customKey;
  return ai;
};

/**
 * Robust JSON extractor to handle Markdown blocks and conversational filler
 */
const extractJson = (text: string): string => {
  const match = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (match) return match[1].trim();
  // Fallback: carefully search for the first [ or { and last ] or }
  const firstBrace = text.indexOf('{');
  const firstBracket = text.indexOf('[');
  const startIdx = (firstBrace !== -1 && firstBracket !== -1) 
    ? Math.min(firstBrace, firstBracket) 
    : Math.max(firstBrace, firstBracket);
  
  const lastBrace = text.lastIndexOf('}');
  const lastBracket = text.lastIndexOf(']');
  const endIdx = Math.max(lastBrace, lastBracket);

  if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
    return text.substring(startIdx, endIdx + 1);
  }
  return text.trim();
};

/**
 * Autocomplete: Uses gemini-3.1-flash-lite for extremely fast location suggestions.
 */
export const getDestinationSuggestions = async (input: string): Promise<string[]> => {
  if (!input || input.trim().length < 2) return [];
  
  const prompt = `List 5 popular travel destinations (City, Country) starting with or matching: "${input}". Return ONLY a JSON array of strings. Example: ["Paris, France", "Prague, Czech Republic"]`;

  try {
    const aiClient = getAI();
    const response = await aiClient.models.generateContent({
      model: "gemini-3.1-flash-lite",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: { type: Type.STRING }
        },
        temperature: 0.2
      }
    });

    const text = response.text;
    if (!text) return [];
    
    const cleanJson = extractJson(text);
    const parsed = JSON.parse(cleanJson);
    
    if (Array.isArray(parsed)) {
      return parsed
        .map(item => typeof item === 'string' ? item : (item.name || item.city || Object.values(item)[0] || ''))
        .filter(item => typeof item === 'string' && item.trim().length > 0)
        .slice(0, 5);
    }
    return [];
  } catch (error: any) {
    console.warn("Location autocomplete fallback:", error?.message || error);
    return [];
  }
};

// Fast curated destination imagery lookup with keyword matching
const CURATED_DESTINATIONS: Record<string, string> = {
  paris: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=1600&q=80",
  tokyo: "https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=1600&q=80",
  rome: "https://images.unsplash.com/photo-1552832230-c0197dd311b5?auto=format&fit=crop&w=1600&q=80",
  london: "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=1600&q=80",
  "new york": "https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?auto=format&fit=crop&w=1600&q=80",
  bali: "https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=1600&q=80",
  dubai: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=1600&q=80",
  barcelona: "https://images.unsplash.com/photo-1539037116277-4db20889f2d4?auto=format&fit=crop&w=1600&q=80",
  amsterdam: "https://images.unsplash.com/photo-1534351590666-13e3e96b5017?auto=format&fit=crop&w=1600&q=80",
  kyoto: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=1600&q=80",
  singapore: "https://images.unsplash.com/photo-1525625293386-3f8f99389edd?auto=format&fit=crop&w=1600&q=80",
  sydney: "https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?auto=format&fit=crop&w=1600&q=80",
  santorini: "https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?auto=format&fit=crop&w=1600&q=80",
  venice: "https://images.unsplash.com/photo-1514890547357-a9ee288728e0?auto=format&fit=crop&w=1600&q=80",
  prague: "https://images.unsplash.com/photo-1541849546-216549ae216d?auto=format&fit=crop&w=1600&q=80",
  switzerland: "https://images.unsplash.com/photo-1530122037265-a5f1f91d3b99?auto=format&fit=crop&w=1600&q=80",
  hawaii: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1600&q=80",
  maldives: "https://images.unsplash.com/photo-1514282401047-d79a71a590e8?auto=format&fit=crop&w=1600&q=80",
  thailand: "https://images.unsplash.com/photo-1528181304800-259b08848526?auto=format&fit=crop&w=1600&q=80",
  iceland: "https://images.unsplash.com/photo-1504893524553-b855bce32c67?auto=format&fit=crop&w=1600&q=80"
};

/**
 * Instant Hero Image: Synchronously delivers a beautiful destination photo in < 1ms
 */
export const getInstantDestinationHero = (destination: string): HeroImage => {
  const normalized = (destination || '').toLowerCase();
  const destKey = Object.keys(CURATED_DESTINATIONS).find(k => normalized.includes(k));
  
  const url = destKey
    ? CURATED_DESTINATIONS[destKey]
    : `https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=1600&q=80`;

  return {
    url,
    photographerName: `${destination} Travel Photography`,
    photographerUrl: "https://unsplash.com"
  };
};

/**
 * Background / Async Illustration Generation (non-blocking)
 */
export const generateDestinationIllustration = async (destination: string, heroSearchTerm?: string): Promise<HeroImage | undefined> => {
  const prompt = `Professional scenic travel photography of ${destination}. ${heroSearchTerm ? `Featuring ${heroSearchTerm}.` : ''} Stunning panoramic landmark view, golden hour sunlight, luxury travel magazine editorial, ultra-high resolution, vibrant atmosphere. No text, no logos.`;

  const imageModels = ["gemini-2.5-flash-image", "imagen-3.0-generate-002"];
  
  for (const modelName of imageModels) {
    try {
      const aiClient = getAI();
      const response = await aiClient.models.generateContent({
        model: modelName,
        contents: {
          parts: [{ text: prompt }]
        },
        config: {
          imageConfig: {
            aspectRatio: "16:9"
          }
        }
      });

      const candidates = response.candidates;
      if (candidates && candidates.length > 0) {
        const parts = candidates[0].content?.parts;
        if (parts) {
          for (const part of parts) {
            if (part.inlineData && part.inlineData.data) {
              const mimeType = part.inlineData.mimeType || 'image/png';
              return {
                url: `data:${mimeType};base64,${part.inlineData.data}`,
                photographerName: `${destination} AI Capture`,
                photographerUrl: "#"
              };
            }
          }
        }
      }
    } catch (err: any) {
      // Continue to instant curated imagery
    }
  }

  return getInstantDestinationHero(destination);
};

/**
 * Itinerary Generation: Uses high-speed zero-thinking Flash models for instant response
 */
export const generateItinerary = async (details: TripDetails): Promise<Itinerary> => {  
  const prompt = `Create a crisp travel itinerary for ${details.days} days in ${details.destination} starting ${details.startDate}. Objective: ${details.objective}. 
  Provide title, summary, 3-4 comma-separated heroSearchTerm tags, and daily Morning/Afternoon/Evening activities with realistic weather. Keep descriptions engaging, vibrant, and concise.`;

  // Use fastest models with thinking budget = 0 for instant token output
  const models = ["gemini-2.5-flash", "gemini-3.7-flash", "gemini-3.1-flash-lite"];
  let lastError: any = null;

  for (const modelName of models) {
    try {
      const aiClient = getAI();
      const response = await aiClient.models.generateContent({
        model: modelName,
        contents: prompt,
        config: {
          temperature: 0.3,
          thinkingConfig: {
            thinkingBudget: 0
          },
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              summary: { type: Type.STRING },
              heroSearchTerm: { type: Type.STRING },
              days: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    day: { type: Type.NUMBER },
                    theme: { type: Type.STRING },
                    weather: {
                      type: Type.OBJECT,
                      properties: {
                        condition: { type: Type.STRING },
                        tempHigh: { type: Type.NUMBER },
                        tempLow: { type: Type.NUMBER }
                      },
                      required: ["condition", "tempHigh", "tempLow"]
                    },
                    activities: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          time: { type: Type.STRING },
                          duration: { type: Type.STRING },
                          title: { type: Type.STRING },
                          description: { type: Type.STRING },
                          location: { type: Type.STRING }
                        },
                        required: ["time", "duration", "title", "description"]
                      }
                    }
                  },
                  required: ["day", "theme", "activities", "weather"]
                }
              }
            },
            required: ["title", "summary", "heroSearchTerm", "days"]
          }
        }
      });

      const json = response.text;
      if (!json) continue;
      
      const cleanJson = extractJson(json);
      return JSON.parse(cleanJson) as Itinerary;
    } catch (e: any) {
      lastError = e;
      if (e.message?.includes('429') || e.message?.includes('quota')) {
        console.warn(`Model ${modelName} hit quota, trying next model...`);
        continue;
      }
      console.error(`Error with model ${modelName}:`, e);
    }
  }

  throw new Error(lastError?.message || "All AI models are currently overwhelmed. Please wait a moment and try again.");
};

export const searchTravelData = async (query: string, isFlight: boolean = false): Promise<SearchResult> => {  
  const prompt = isFlight 
    ? `Find 3 flight options for: ${query}. 
       Be strict and format exactly like this for each option (do not write any introduction or conclusion):
       NAME: [Airline]
       DURATION: [h/m]
       STOPS: [Number]
       TIMES: [Dep-Arr]
       LAYOVERS: [Cities/None]
       AMENITIES: [Features]
       PRICE: [Cost]
       TAG: [Label like 'Cheapest', 'Fastest']
       REASONING: [Why you picked this]
       ---`
    : `Find 3 hotels for: ${query}.
       Be strict and format exactly like this for each option (do not write any introduction or conclusion):
       NAME: [Name]
       RATING: [X/5]
       PRICE: [Rate per night]
       TAG: [Label like 'Most Popular', 'Best Value']
       REASONING: [Why you picked this]
       CONTEXT: [Location details]
       ---`;

  const models = ["gemini-3.7-flash", "gemini-3.1-flash-lite"];
  
  for (const modelName of models) {
    try {
      const aiClient = getAI();
      const response = await aiClient.models.generateContent({
        model: modelName,
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }]
        }
      });
      
      // Extract search grounding metadata
      const candidates = response.candidates;
      const sources: GroundingChunk[] = [];
      
      if (candidates && candidates.length > 0) {
        const metadata = candidates[0].groundingMetadata;
        if (metadata && metadata.groundingChunks) {
          metadata.groundingChunks.forEach((chunk: any) => {
            if (chunk.web && chunk.web.uri) {
              sources.push({
                web: {
                  uri: chunk.web.uri,
                  title: chunk.web.title || "Travel Source"
                }
              });
            }
          });
        }
      }

      return {
        text: response.text || "No options found.",
        sources
      };
    } catch (error: any) {
      if (error.message?.includes('429') || error.message?.includes('404')) {
        continue;
      }
      console.error(`Search failed with ${modelName}:`, error);
    }
  }

  return {
    text: "Travel search is currently at capacity or unavailable. Please try again later.",
    sources: []
  };
};
