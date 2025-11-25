import React, { useState } from 'react';
import { AppState, UnitSystem, Gender, ActivityLevel } from './types';
import { Disclaimer } from './components/Tabs/Disclaimer';
import { BasicInfo } from './components/Tabs/BasicInfo';
import { MacroCalculator } from './components/Tabs/MacroCalculator';
import { Goals } from './components/Tabs/Goals';

const App: React.FC = () => {
  // Initial State
  const [activeTab, setActiveTab] = useState(1);
  const [appState, setAppState] = useState<AppState>({
    unitSystem: UnitSystem.IMPERIAL,
    gender: Gender.MALE,
    age: 30,
    heightFt: 5,
    heightIn: 10,
    heightCm: 178,
    weightLbs: 180,
    weightKg: 81.6,
    activityLevel: ActivityLevel.MODERATELY_ACTIVE,
    bodyFatPercentage: '',
    waistSize: '',
    
    daysPerCycle: 7,
    workoutsPerWeek: 3,
    restCaloriesSplit: -20, // -20% deficit
    workoutCaloriesSplit: 10, // +10% surplus (recomp style)
    
    restProteinGrams: 160,
    workoutProteinGrams: 160,
    
    restFatSplitPercent: 75, // Higher fat on rest days
    workoutFatSplitPercent: 25, // Lower fat (Higher carb) on workout days
  });

  const updateState = (updates: Partial<AppState>) => {
    setAppState(prev => ({ ...prev, ...updates }));
  };

  const tabs = [
    { id: 0, label: 'Disclaimer' },
    { id: 1, label: 'Basic Info' },
    { id: 2, label: 'Macro Calculator' },
    { id: 3, label: 'Goals' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 font-sans pb-12">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-indigo-100">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-tr from-primary to-secondary rounded-lg flex items-center justify-center text-white font-bold">
              IF
            </div>
            <h1 className="text-xl font-bold text-slate-800 tracking-tight">Intermittent Fasting Calculator</h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 mt-8">
        
        {/* Tab Navigation */}
        <div className="flex flex-wrap gap-2 mb-6 bg-white/50 p-1 rounded-xl backdrop-blur-sm w-fit mx-auto lg:mx-0">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                activeTab === tab.id
                  ? 'bg-white text-primary shadow-md ring-1 ring-black/5 scale-105'
                  : 'text-slate-500 hover:text-slate-700 hover:bg-white/50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="animate-fade-in-up">
          {activeTab === 0 && <Disclaimer />}
          {activeTab === 1 && <BasicInfo state={appState} updateState={updateState} />}
          {activeTab === 2 && <MacroCalculator state={appState} updateState={updateState} />}
          {activeTab === 3 && <Goals state={appState} />}
        </div>
      </main>

      {/* Sticky footer for mobile if needed, or simple credits */}
      <footer className="mt-12 text-center text-slate-400 text-sm">
        <p>&copy; {new Date().getFullYear()} IF Calculator. Designed for Body Recomposition.</p>
      </footer>
    </div>
  );
};

export default App;