import React, { useState, useEffect } from 'react';
import { Settings, Key, X, ExternalLink, Check } from 'lucide-react';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ isOpen, onClose }) => {
  const [apiKey, setApiKey] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const storedKey = localStorage.getItem('tripwise_gemini_key') || '';
    setApiKey(storedKey);
  }, [isOpen]);

  const handleSave = () => {
    if (apiKey.trim()) {
      localStorage.setItem('tripwise_gemini_key', apiKey.trim());
    } else {
      localStorage.removeItem('tripwise_gemini_key');
    }
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      onClose();
    }, 1500);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#1E1B4B]/20 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl p-8 max-w-lg w-full shadow-2xl border border-indigo-50 relative animate-in zoom-in-95 duration-300">
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 p-2 text-gray-400 hover:text-gray-900 bg-gray-50 hover:bg-gray-100 rounded-full transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-4 mb-6">
          <div className="bg-indigo-50 p-3 rounded-2xl text-indigo-600">
            <Key className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-editorial font-bold text-[#1E1B4B]">API Key Settings</h2>
        </div>

        <p className="text-gray-500 text-sm mb-6 leading-relaxed">
          TripWise is free, but requires a Gemini Developer API key to generate bespoke itineraries. Your key is stored locally in your browser and never sent to our servers.
        </p>

        <div className="bg-indigo-50/50 rounded-2xl p-5 border border-indigo-100/50 mb-8">
          <h3 className="text-xs font-black uppercase tracking-widest text-[#1E1B4B] mb-3">How to get your key</h3>
          <ol className="text-sm text-gray-600 space-y-2 list-decimal list-inside">
            <li>Visit <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-indigo-600 font-semibold hover:underline inline-flex items-center gap-1">Google AI Studio <ExternalLink className="w-3 h-3"/></a></li>
            <li>Sign in with your Google account</li>
            <li>Click the "Create API key" button</li>
            <li>Copy the generated key and paste it below</li>
          </ol>
        </div>

        <div className="space-y-4">
           <label className="block text-xs font-bold uppercase tracking-widest text-gray-400">
             Your Gemini API Key
           </label>
           <input 
             type="password"
             value={apiKey}
             onChange={(e) => setApiKey(e.target.value)}
             placeholder="AIzaSy..."
             className="w-full bg-gray-50 border border-gray-200 focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100 px-5 py-4 rounded-xl text-gray-900 outline-none transition-all font-mono"
           />
        </div>

        <div className="mt-8 flex justify-end gap-3">
          <button 
            onClick={onClose}
            className="px-6 py-3 rounded-xl text-gray-500 font-bold hover:bg-gray-50 transition-all"
          >
            Cancel
          </button>
          <button 
            onClick={handleSave}
            className="px-8 py-3 bg-[#1E1B4B] hover:bg-indigo-600 text-white rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
          >
            {saved ? (
              <><Check className="w-5 h-5" /> Saved</>
            ) : (
              'Save Key'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ApiKeyModal;
