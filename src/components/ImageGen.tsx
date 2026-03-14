import React, { useState } from 'react';
import { Sparkles, X, Loader2, Download, Image as ImageIcon, Maximize2 } from 'lucide-react';
import { getGeminiAI } from '../lib/gemini';

interface ImageGenProps {
  onClose: () => void;
}

export const ImageGen: React.FC<ImageGenProps> = ({ onClose }) => {
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [size, setSize] = useState<'1K' | '2K' | '4K'>('1K');
  const [aspectRatio, setAspectRatio] = useState<'1:1' | '3:4' | '4:3' | '9:16' | '16:9'>('1:1');

  const handleGenerate = async () => {
    if (!prompt.trim() || isLoading) return;

    setIsLoading(true);
    setGeneratedImage(null);

    try {
      const ai = getGeminiAI();
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-image-preview',
        contents: [{ parts: [{ text: prompt }] }],
        config: {
          imageConfig: {
            aspectRatio,
            imageSize: size
          }
        }
      });

      let imageUrl = null;
      for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
          imageUrl = `data:image/png;base64,${part.inlineData.data}`;
          break;
        }
      }

      if (imageUrl) {
        setGeneratedImage(imageUrl);
      } else {
        alert("Failed to generate image. Please try a different prompt.");
      }
    } catch (error) {
      console.error("Image gen error:", error);
      alert("Error generating image. Make sure you have selected a valid API key if required.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white w-full max-w-4xl rounded-[2rem] shadow-2xl overflow-hidden flex flex-col md:flex-row">
        <div className="p-8 md:w-1/2 flex flex-col bg-gray-50">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="bg-indigo-600 p-2 rounded-xl">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">AI Avatar Gen</h2>
            </div>
            <button onClick={onClose} className="md:hidden p-2 hover:bg-gray-200 rounded-lg">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-6 flex-grow">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wider">Describe your avatar</label>
              <textarea 
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="e.g. A futuristic cyber-gamer with neon armor, holding a glowing controller, digital art style..."
                className="w-full h-32 px-4 py-3 bg-white border-2 border-gray-100 rounded-2xl focus:border-indigo-500 focus:ring-0 transition-all resize-none text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">Resolution</label>
                <div className="flex gap-2">
                  {(['1K', '2K', '4K'] as const).map((s) => (
                    <button
                      key={s}
                      onClick={() => setSize(s)}
                      className={`flex-grow py-2 text-xs font-bold rounded-xl border-2 transition-all ${
                        size === s ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-gray-100 text-gray-600 hover:border-indigo-200'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">Aspect Ratio</label>
                <select 
                  value={aspectRatio}
                  onChange={(e) => setAspectRatio(e.target.value as any)}
                  className="w-full py-2 px-3 text-xs font-bold rounded-xl border-2 border-gray-100 bg-white focus:border-indigo-500 outline-none"
                >
                  <option value="1:1">1:1 Square</option>
                  <option value="3:4">3:4 Portrait</option>
                  <option value="4:3">4:3 Landscape</option>
                  <option value="9:16">9:16 Story</option>
                  <option value="16:9">16:9 Cinema</option>
                </select>
              </div>
            </div>
          </div>

          <button 
            onClick={handleGenerate}
            disabled={isLoading || !prompt.trim()}
            className="mt-8 w-full bg-indigo-600 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-indigo-700 disabled:opacity-50 transition-all shadow-xl shadow-indigo-200"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Generating Masterpiece...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                Generate Avatar
              </>
            )}
          </button>
        </div>

        <div className="md:w-1/2 h-[400px] md:h-auto bg-gray-900 relative flex items-center justify-center group">
          <button onClick={onClose} className="hidden md:block absolute top-6 right-6 p-2 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors z-10">
            <X className="w-5 h-5" />
          </button>

          {generatedImage ? (
            <div className="relative w-full h-full p-8">
              <img 
                src={generatedImage} 
                alt="Generated Avatar" 
                className="w-full h-full object-contain rounded-xl shadow-2xl"
              />
              <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                <a 
                  href={generatedImage} 
                  download="avatar.png"
                  className="bg-white text-gray-900 px-4 py-2 rounded-xl font-bold text-sm flex items-center gap-2 shadow-xl hover:scale-105 transition-transform"
                >
                  <Download className="w-4 h-4" />
                  Download
                </a>
              </div>
            </div>
          ) : (
            <div className="text-center p-8">
              <div className="w-20 h-20 bg-white/5 rounded-[2rem] flex items-center justify-center mx-auto mb-6">
                <ImageIcon className="w-10 h-10 text-white/20" />
              </div>
              <h3 className="text-white font-bold text-xl mb-2">Your AI Art Awaits</h3>
              <p className="text-gray-500 text-sm max-w-xs mx-auto">
                Describe your dream gaming avatar and let Gemini 3 Pro Image bring it to life.
              </p>
            </div>
          )}

          {isLoading && (
            <div className="absolute inset-0 bg-gray-900/80 backdrop-blur-sm flex flex-col items-center justify-center">
              <div className="relative">
                <div className="w-24 h-24 border-4 border-indigo-500/20 rounded-full animate-pulse"></div>
                <Loader2 className="absolute inset-0 w-24 h-24 text-indigo-500 animate-spin" />
              </div>
              <p className="mt-6 text-white font-bold tracking-widest uppercase text-xs">Processing Pixels...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
