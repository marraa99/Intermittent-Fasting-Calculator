
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { GoogleGenAI } from "@google/genai";
import { TrackerProfile, DailyLog, FoodItem } from '../../types';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';
import { formatNumber } from '../../utils/calculations';

const MODEL_OPTIONS = [
  'gemini-2.0-flash',
  'gemini-2.5-flash',
  'gemini-2.5-pro',
  'gemini-3-pro-preview'
];

const getTodayDate = () => new Date().toISOString().split('T')[0];

interface Props {
  profile: TrackerProfile;
  setProfile: (updates: Partial<TrackerProfile>) => void;
}

export const Tracker: React.FC<Props> = ({ profile, setProfile }) => {
  // --- State ---
  const [log, setLog] = useState<DailyLog>({ date: getTodayDate(), foods: [] });
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  
  // Add Food State
  const [isAddingFood, setIsAddingFood] = useState(false);
  const [manualName, setManualName] = useState('');
  const [manualGrams, setManualGrams] = useState<number | ''>('');
  const [nutri100g, setNutri100g] = useState({ calories: 0, protein: 0, carbs: 0, fiber: 0, fat: 0 });
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- Effects (LocalStorage) ---

  // Load Log
  useEffect(() => {
    const today = getTodayDate();
    const savedLog = localStorage.getItem(`if-tracker-log-${today}`);
    if (savedLog) {
      setLog(JSON.parse(savedLog));
    } else {
      setLog({ date: today, foods: [] });
    }
  }, []);

  // Save Log on Change
  useEffect(() => {
    if (log.date) {
      localStorage.setItem(`if-tracker-log-${log.date}`, JSON.stringify(log));
    }
  }, [log]);

  // --- Computed Totals ---
  const totals = useMemo(() => {
    return log.foods.reduce((acc, food) => ({
      calories: acc.calories + food.calories,
      protein: acc.protein + food.protein,
      carbs: acc.carbs + food.carbs,
      fat: acc.fat + food.fat,
      fiber: acc.fiber + food.fiber,
    }), { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 });
  }, [log.foods]);

  const netCarbsEaten = Math.max(0, totals.carbs - totals.fiber);

  // --- Handlers ---

  const handleUpdateProfile = (updates: Partial<TrackerProfile>) => {
    setProfile(updates);
  };

  const handleUpdateTargets = (updates: Partial<TrackerProfile['targets']>) => {
    setProfile({ targets: { ...profile.targets, ...updates } });
  };

  const handleUpdateNutri100g = (key: keyof typeof nutri100g, value: string) => {
    setNutri100g(prev => ({ ...prev, [key]: Number(value) }));
  };

  const calculateActuals = () => {
    const g = Number(manualGrams) || 0;
    const ratio = g / 100;
    return {
      calories: nutri100g.calories * ratio,
      protein: nutri100g.protein * ratio,
      carbs: nutri100g.carbs * ratio,
      fat: nutri100g.fat * ratio,
      fiber: nutri100g.fiber * ratio,
    };
  };

  const handleAddFood = () => {
    if (!manualName || !manualGrams) return;

    const actuals = calculateActuals();
    const newFood: FoodItem = {
      id: Date.now().toString(),
      name: manualName,
      grams: Number(manualGrams),
      per100g: { ...nutri100g },
      ...actuals
    };

    setLog(prev => ({ ...prev, foods: [newFood, ...prev.foods] }));
    
    // Reset Form
    setManualName('');
    setManualGrams('');
    setNutri100g({ calories: 0, protein: 0, carbs: 0, fiber: 0, fat: 0 });
    setIsAddingFood(false);
  };

  const handleDeleteFood = (id: string) => {
    setLog(prev => ({ ...prev, foods: prev.foods.filter(f => f.id !== id) }));
  };

  const handleResetDay = () => {
    if (window.confirm("Are you sure you want to clear today's log?")) {
      setLog({ date: getTodayDate(), foods: [] });
    }
  };

  // --- AI Logic ---

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        // Remove data URL prefix (e.g., "data:image/jpeg;base64,")
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!profile.apiKey) {
      alert("Please enter your Gemini API Key in the Profile settings first.");
      return;
    }

    setIsAnalyzing(true);

    try {
      const base64Data = await fileToBase64(file);
      
      const ai = new GoogleGenAI({ apiKey: profile.apiKey });
      
      // Prompt
      const prompt = `Extract nutrition per 100g from this label. Return ONLY a JSON object with these keys: calories, protein, carbs, fiber, fat. All values should be numbers. If a value is missing, use 0. Do not use markdown code blocks.`;

      const response = await ai.models.generateContent({
        model: profile.model,
        contents: {
          parts: [
            { inlineData: { mimeType: file.type, data: base64Data } },
            { text: prompt }
          ]
        }
      });

      const text = response.text || "{}";
      // Clean up markdown if present despite prompt
      const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
      
      const data = JSON.parse(cleanText);

      setNutri100g({
        calories: Number(data.calories) || 0,
        protein: Number(data.protein) || 0,
        carbs: Number(data.carbs) || 0,
        fiber: Number(data.fiber) || 0,
        fat: Number(data.fat) || 0,
      });

      // Attempt to auto-guess name or just leave blank for user
      setManualName("Scanned Food"); 

    } catch (error) {
      console.error("AI Error:", error);
      alert("Failed to analyze image. Please try again or input manually.");
    } finally {
      setIsAnalyzing(false);
      // Clear input so same file can be selected again
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // --- Components ---

  const ProgressBar = ({ label, current, max, colorClass }: { label: string, current: number, max: number, colorClass: string }) => {
    const percent = Math.min(100, Math.max(0, (current / max) * 100));
    return (
      <div className="mb-2">
        <div className="flex justify-between text-xs mb-1 font-medium text-slate-700">
          <span>{label}</span>
          <span>{Math.round(current)} / {max}g</span>
        </div>
        <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
          <div className={`h-full ${colorClass} transition-all duration-500`} style={{ width: `${percent}%` }}></div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      
      {/* 1. Profile / Settings Section */}
      <Card className="border-slate-200">
        <div 
          className="flex justify-between items-center cursor-pointer select-none"
          onClick={() => setIsProfileOpen(!isProfileOpen)}
        >
          <div className="flex items-center gap-2">
             <span className="font-bold text-slate-800 text-lg">Daily Targets & Settings</span>
             {!profile.apiKey && <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">Key Missing</span>}
          </div>
          <button className="text-slate-400 hover:text-slate-600">
            {isProfileOpen ? '▼' : '▶'}
          </button>
        </div>

        {isProfileOpen && (
          <div className="mt-6 space-y-4 border-t border-slate-100 pt-4 animate-fade-in">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input 
                  label="Gemini API Key" 
                  type="password" 
                  value={profile.apiKey} 
                  onChange={(e) => handleUpdateProfile({ apiKey: e.target.value })}
                  placeholder="Paste your key here"
                />
                <div className="flex flex-col">
                  <label className="text-sm font-medium text-slate-700 mb-1">AI Model</label>
                  <select 
                    className="w-full rounded-lg border-slate-300 border px-3 py-2 bg-white text-black focus:border-primary outline-none"
                    value={profile.model}
                    onChange={(e) => handleUpdateProfile({ model: e.target.value })}
                  >
                    {MODEL_OPTIONS.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
             </div>

             <div className="flex items-center gap-2 mt-2 mb-2">
                <input 
                  type="checkbox" 
                  id="ketoMode" 
                  className="w-4 h-4 text-primary rounded border-slate-300 focus:ring-primary"
                  checked={profile.isKetoMode}
                  onChange={(e) => handleUpdateProfile({ isKetoMode: e.target.checked })}
                />
                <label htmlFor="ketoMode" className="text-sm font-medium text-slate-700">Keto Mode (Track Net Carbs)</label>
             </div>

             <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
               <Input label="Calories" type="number" value={profile.targets.calories} onChange={(e) => handleUpdateTargets({ calories: Number(e.target.value) })} />
               <Input label="Protein (g)" type="number" value={profile.targets.protein} onChange={(e) => handleUpdateTargets({ protein: Number(e.target.value) })} />
               <Input label="Fat (g)" type="number" value={profile.targets.fat} onChange={(e) => handleUpdateTargets({ fat: Number(e.target.value) })} />
               <Input label="Total Carbs (g)" type="number" value={profile.targets.carbs} onChange={(e) => handleUpdateTargets({ carbs: Number(e.target.value) })} />
               <Input label="Fiber (g)" type="number" value={profile.targets.fiber} onChange={(e) => handleUpdateTargets({ fiber: Number(e.target.value) })} />
               {profile.isKetoMode && (
                 <Input label="Net Carbs Target" type="number" className="bg-green-50" value={profile.targets.netCarbs} onChange={(e) => handleUpdateTargets({ netCarbs: Number(e.target.value) })} />
               )}
             </div>
          </div>
        )}
      </Card>

      {/* 2. Today's Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card title="Calorie Summary" className="md:col-span-1 h-full" color="primary">
            <div className="flex flex-col items-center justify-center h-full py-4">
               <div className="relative w-32 h-32 flex items-center justify-center rounded-full border-4 border-slate-100 mb-4">
                  <div className="text-center">
                    <span className="block text-2xl font-bold text-slate-800">{Math.round(profile.targets.calories - totals.calories)}</span>
                    <span className="text-xs text-slate-500 uppercase">Remaining</span>
                  </div>
               </div>
               <div className="w-full space-y-1 text-sm">
                  <div className="flex justify-between px-4">
                    <span className="text-slate-500">Goal</span>
                    <span className="font-semibold">{profile.targets.calories}</span>
                  </div>
                  <div className="flex justify-between px-4">
                    <span className="text-slate-500">Eaten</span>
                    <span className="font-semibold">{Math.round(totals.calories)}</span>
                  </div>
               </div>
            </div>
        </Card>

        <Card title="Macro Progress" className="md:col-span-2 h-full">
           <div className="space-y-4 pt-2">
              <ProgressBar label="Protein" current={totals.protein} max={profile.targets.protein} colorClass="bg-emerald-500" />
              <ProgressBar label="Fat" current={totals.fat} max={profile.targets.fat} colorClass="bg-amber-500" />
              
              {!profile.isKetoMode ? (
                 <ProgressBar label="Carbs" current={totals.carbs} max={profile.targets.carbs} colorClass="bg-blue-500" />
              ) : (
                 <div className="p-3 bg-indigo-50 rounded-lg border border-indigo-100">
                    <div className="flex justify-between items-end mb-2">
                       <span className="font-bold text-indigo-900 text-sm">Net Carbs</span>
                       <span className="text-2xl font-bold text-indigo-700">{Math.round(netCarbsEaten)} <span className="text-sm font-normal text-slate-500">/ {profile.targets.netCarbs}g</span></span>
                    </div>
                    <div className="h-2 bg-indigo-200 rounded-full overflow-hidden">
                       <div className="h-full bg-indigo-600 transition-all duration-500" style={{ width: `${Math.min(100, (netCarbsEaten / profile.targets.netCarbs) * 100)}%` }}></div>
                    </div>
                    <div className="mt-2 text-xs text-indigo-600 flex justify-between">
                       <span>Total Carbs: {Math.round(totals.carbs)}g</span>
                       <span>Fiber: {Math.round(totals.fiber)}g</span>
                    </div>
                 </div>
              )}
           </div>
        </Card>
      </div>

      {/* 3. Add Food Area */}
      <Card title="Add Food" className="bg-slate-50">
        {!isAddingFood ? (
           <button 
             onClick={() => setIsAddingFood(true)}
             className="w-full py-3 border-2 border-dashed border-slate-300 rounded-lg text-slate-500 hover:border-primary hover:text-primary transition-colors flex items-center justify-center gap-2 font-medium"
           >
             <span className="text-xl">+</span> Add Food Item
           </button>
        ) : (
           <div className="animate-fade-in space-y-4">
              {/* AI Section */}
              <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-100">
                 <h4 className="font-semibold text-indigo-900 mb-2 flex items-center gap-2">
                   ✨ AI Auto-Fill 
                   {isAnalyzing && <span className="text-xs font-normal text-indigo-600 animate-pulse">(Analyzing...)</span>}
                 </h4>
                 <div className="flex items-center gap-3">
                    <input 
                      type="file" 
                      accept="image/*" 
                      ref={fileInputRef}
                      onChange={handleImageUpload}
                      disabled={isAnalyzing}
                      className="block w-full text-sm text-slate-500
                        file:mr-4 file:py-2 file:px-4
                        file:rounded-full file:border-0
                        file:text-sm file:font-semibold
                        file:bg-indigo-100 file:text-indigo-700
                        hover:file:bg-indigo-200
                        cursor-pointer
                      "
                    />
                 </div>
                 <p className="text-xs text-indigo-400 mt-2">Upload a nutrition label photo to auto-extract values.</p>
              </div>

              {/* Manual Inputs */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <Input label="Food Name" value={manualName} onChange={(e) => setManualName(e.target.value)} placeholder="e.g. Chicken Breast" />
                 <Input label="Amount Eaten (g)" type="number" value={manualGrams} onChange={(e) => setManualGrams(Number(e.target.value))} />
              </div>

              <div className="bg-white p-3 rounded border border-slate-200">
                 <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Nutrition per 100g</p>
                 <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
                    <Input label="Cals" type="number" value={nutri100g.calories} onChange={(e) => handleUpdateNutri100g('calories', e.target.value)} />
                    <Input label="Prot" type="number" value={nutri100g.protein} onChange={(e) => handleUpdateNutri100g('protein', e.target.value)} />
                    <Input label="Carb" type="number" value={nutri100g.carbs} onChange={(e) => handleUpdateNutri100g('carbs', e.target.value)} />
                    <Input label="Fib" type="number" value={nutri100g.fiber} onChange={(e) => handleUpdateNutri100g('fiber', e.target.value)} />
                    <Input label="Fat" type="number" value={nutri100g.fat} onChange={(e) => handleUpdateNutri100g('fat', e.target.value)} />
                 </div>
              </div>

              <div className="flex gap-3 pt-2">
                 <button 
                   onClick={handleAddFood}
                   disabled={!manualName || !manualGrams}
                   className="flex-1 bg-primary text-white py-2 rounded-lg font-medium hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                 >
                   Add to Log
                 </button>
                 <button 
                   onClick={() => setIsAddingFood(false)}
                   className="px-6 py-2 bg-slate-200 text-slate-700 rounded-lg font-medium hover:bg-slate-300 transition-colors"
                 >
                   Cancel
                 </button>
              </div>
           </div>
        )}
      </Card>

      {/* 4. Log List */}
      <Card title={`Today's Log (${log.date})`} className="min-h-[200px]">
         {log.foods.length === 0 ? (
            <div className="text-center py-10 text-slate-400">
               No food logged yet today.
            </div>
         ) : (
            <div className="space-y-3">
               {log.foods.map((food) => (
                 <div key={food.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors group">
                    <div className="flex-1">
                       <div className="font-semibold text-slate-800">{food.name}</div>
                       <div className="text-sm text-slate-500">
                          {food.grams}g • {Math.round(food.calories)} kcal
                       </div>
                    </div>
                    <div className="text-xs text-slate-400 mr-4 hidden md:block">
                       P: {Math.round(food.protein)} C: {Math.round(food.carbs)} F: {Math.round(food.fat)}
                    </div>
                    <button 
                      onClick={() => handleDeleteFood(food.id)}
                      className="text-slate-300 hover:text-red-500 p-2 transition-colors"
                      title="Delete"
                    >
                      ✕
                    </button>
                 </div>
               ))}
               
               <div className="pt-4 flex justify-center">
                  <button onClick={handleResetDay} className="text-xs text-red-400 hover:text-red-600 underline">
                    Clear Day
                  </button>
               </div>
            </div>
         )}
      </Card>

    </div>
  );
};
