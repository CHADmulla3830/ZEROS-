import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export const AiService = {
  async fetchGameDetails(gameName: string) {
    try {
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
