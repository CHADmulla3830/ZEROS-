import { GoogleGenAI, Type } from "@google/genai";

export const AiService = {
  async fetchGameDetails(gameName: string) {
    try {
      // Use a safer way to access the API key that works in both dev and production
      const apiKey = (typeof process !== 'undefined' && process.env?.GEMINI_API_KEY) || 
                    (import.meta.env?.VITE_GEMINI_API_KEY);
      
      if (!apiKey) {
        throw new Error("GEMINI_API_KEY is not defined. Please ensure it is set in your environment variables.");
      }
      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Provide detailed information for the PC game: "${gameName}". 
        Include description, price (in BDT, estimated), genre, platform (should be PC), publisher, and release date.
        Return the data in JSON format.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              description: { type: Type.STRING },
              price: { type: Type.NUMBER },
              genre: { type: Type.STRING },
              platform: { type: Type.STRING },
              publisher: { type: Type.STRING },
              releaseDate: { type: Type.STRING },
              imageUrl: { type: Type.STRING, description: "A high quality placeholder image URL from picsum.photos related to this game" }
            },
            required: ["name", "description", "price", "genre", "platform", "publisher", "releaseDate"]
          }
        }
      });

      return JSON.parse(response.text);
    } catch (error) {
      console.error("AI Fetch Error:", error);
      return null;
    }
  }
};
