import React, { useMemo } from 'react';
import { AppState, UnitSystem, Gender, ActivityLevel, CONSTANTS } from '../../types';
import { Input } from '../ui/Input';
import { Card } from '../ui/Card';
import { getMetricValues, calculateBMR, formatNumber } from '../../utils/calculations';

interface Props {
  state: AppState;
  updateState: (updates: Partial<AppState>) => void;
}

export const BasicInfo: React.FC<Props> = ({ state, updateState }) => {
  
  // Derived Calculations
  const calculations = useMemo(() => {
    const { weightKg, heightCm, waistCm } = getMetricValues(state);
    const bmr = calculateBMR(weightKg, heightCm, state.age, state.gender, state.bodyFatPercentage === '' ? undefined : state.bodyFatPercentage);
    
    // TDEE
    const tdee = bmr.average * state.activityLevel;

    // BMI
    // Formula: weight(kg) / height(m)^2
    const heightM = heightCm / 100;
    const bmi = weightKg / (heightM * heightM);

    // LBM & Fat Mass
    let lbm = 0;
    let fatMass = 0;
    if (state.bodyFatPercentage !== '') {
      fatMass = weightKg * (state.bodyFatPercentage / 100);
      lbm = weightKg - fatMass;
    }

    // Perfect Weight (BMI 22)
    // 22 = w / h^2  => w = 22 * h^2
    const perfectWeightKg = 22 * (heightM * heightM);
    
    // Waist Ratio
    const waistToHeight = waistCm > 0 ? waistCm / heightCm : 0;

    return {
      bmr,
      tdee,
      bmi,
      lbm,
      fatMass,
      perfectWeightKg,
      waistToHeight
    };
  }, [state]);

  const displayWeight = (kg: number) => {
    if (state.unitSystem === UnitSystem.METRIC) return `${formatNumber(kg, 1)} kg`;
    return `${formatNumber(kg * CONSTANTS.KG_TO_LBS, 1)} lbs`;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 p-4">
      {/* Input Section */}
      <div className="lg:col-span-5 space-y-4">
        <Card title="Your Stats" className="h-full">
          <div className="flex justify-center mb-6">
            <div className="bg-slate-100 p-1 rounded-lg inline-flex">
              <button
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${state.unitSystem === UnitSystem.IMPERIAL ? 'bg-white shadow text-primary' : 'text-slate-500'}`}
                onClick={() => updateState({ unitSystem: UnitSystem.IMPERIAL })}
              >
                Imperial
              </button>
              <button
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${state.unitSystem === UnitSystem.METRIC ? 'bg-white shadow text-primary' : 'text-slate-500'}`}
                onClick={() => updateState({ unitSystem: UnitSystem.METRIC })}
              >
                Metric
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="flex flex-col">
              <label className="text-sm font-medium text-slate-700 mb-1">Gender</label>
              <div className="flex rounded-lg bg-slate-100 p-1">
                 <button
                  className={`flex-1 py-1.5 rounded-md text-sm font-medium transition-all ${state.gender === Gender.MALE ? 'bg-blue-500 text-white shadow' : 'text-slate-500'}`}
                  onClick={() => updateState({ gender: Gender.MALE })}
                >
                  Male
                </button>
                <button
                  className={`flex-1 py-1.5 rounded-md text-sm font-medium transition-all ${state.gender === Gender.FEMALE ? 'bg-pink-500 text-white shadow' : 'text-slate-500'}`}
                  onClick={() => updateState({ gender: Gender.FEMALE })}
                >
                  Female
                </button>
              </div>
            </div>
            <Input
              label="Age"
              type="number"
              value={state.age}
              onChange={(e) => updateState({ age: Number(e.target.value) })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            {state.unitSystem === UnitSystem.IMPERIAL ? (
              <>
                 <Input label="Height (ft)" type="number" value={state.heightFt} onChange={(e) => updateState({ heightFt: Number(e.target.value) })} />
                 <Input label="Height (in)" type="number" value={state.heightIn} onChange={(e) => updateState({ heightIn: Number(e.target.value) })} />
              </>
            ) : (
              <div className="col-span-2">
                 <Input label="Height (cm)" type="number" value={state.heightCm} onChange={(e) => updateState({ heightCm: Number(e.target.value) })} />
              </div>
            )}
          </div>

          <div className="mb-4">
             {state.unitSystem === UnitSystem.IMPERIAL ? (
               <Input label="Weight (lbs)" type="number" value={state.weightLbs} onChange={(e) => updateState({ weightLbs: Number(e.target.value) })} />
             ) : (
               <Input label="Weight (kg)" type="number" value={state.weightKg} onChange={(e) => updateState({ weightKg: Number(e.target.value) })} />
             )}
          </div>

          <div className="mb-4">
            <label className="text-sm font-medium text-slate-700 mb-1">Activity Level</label>
            <select
              className="w-full rounded-lg border-slate-300 border px-3 py-2 bg-white text-black focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
              value={state.activityLevel}
              onChange={(e) => updateState({ activityLevel: Number(e.target.value) as ActivityLevel })}
            >
              <option value={ActivityLevel.SEDENTARY}>Sedentary (Office Job)</option>
              <option value={ActivityLevel.LIGHTLY_ACTIVE}>Lightly Active (1-2 days/week)</option>
              <option value={ActivityLevel.MODERATELY_ACTIVE}>Moderately Active (3-5 days/week)</option>
              <option value={ActivityLevel.VERY_ACTIVE}>Very Active (6-7 days/week)</option>
              <option value={ActivityLevel.EXTREMELY_ACTIVE}>Extremely Active (Physical Job + Training)</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <Input label="Body Fat %" subLabel="Optional" type="number" value={state.bodyFatPercentage} onChange={(e) => updateState({ bodyFatPercentage: e.target.value === '' ? '' : Number(e.target.value) })} />
            <Input label="Waist" subLabel="Optional" suffix={state.unitSystem === UnitSystem.IMPERIAL ? '"' : 'cm'} type="number" value={state.waistSize} onChange={(e) => updateState({ waistSize: e.target.value === '' ? '' : Number(e.target.value) })} />
          </div>
        </Card>
      </div>

      {/* Results Section */}
      <div className="lg:col-span-7 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card title="Metabolic Rates" color="secondary">
            <div className="space-y-3">
              <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                 <span className="text-slate-600 text-sm">Mifflin-St Jeor</span>
                 <span className="font-mono font-bold text-slate-800">{formatNumber(calculations.bmr.mifflin)} kcal</span>
              </div>
              <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                 <span className="text-slate-600 text-sm">Harris-Benedict</span>
                 <span className="font-mono font-bold text-slate-800">{formatNumber(calculations.bmr.harris)} kcal</span>
              </div>
              {calculations.bmr.katch > 0 && (
                <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                  <span className="text-slate-600 text-sm">Katch-McArdle</span>
                  <span className="font-mono font-bold text-slate-800">{formatNumber(calculations.bmr.katch)} kcal</span>
                </div>
              )}
              <div className="flex justify-between items-center bg-purple-50 p-2 rounded">
                 <span className="font-semibold text-purple-900">Average BMR</span>
                 <span className="font-mono font-bold text-purple-900">{formatNumber(calculations.bmr.average)} kcal</span>
              </div>
            </div>
          </Card>

           <Card title="Body Composition" color="accent">
             <div className="space-y-3">
                <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                   <span className="text-slate-600 text-sm">TDEE</span>
                   <span className="font-mono font-bold text-teal-700 text-lg">{formatNumber(calculations.tdee)} kcal</span>
                </div>
                <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                   <span className="text-slate-600 text-sm">BMI</span>
                   <span className="font-mono font-bold text-slate-800">{formatNumber(calculations.bmi, 1)}</span>
                </div>
                {calculations.lbm > 0 && (
                  <>
                    <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                      <span className="text-slate-600 text-sm">Lean Body Mass</span>
                      <span className="font-mono font-bold text-slate-800">{displayWeight(calculations.lbm)}</span>
                    </div>
                    <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                      <span className="text-slate-600 text-sm">Fat Mass</span>
                      <span className="font-mono font-bold text-slate-800">{displayWeight(calculations.fatMass)}</span>
                    </div>
                  </>
                )}
                 <div className="flex justify-between items-center">
                   <span className="text-slate-600 text-sm">"Ideal" Weight (BMI 22)</span>
                   <span className="font-mono font-bold text-slate-800">{displayWeight(calculations.perfectWeightKg)}</span>
                 </div>
             </div>
           </Card>
        </div>

        {calculations.waistToHeight > 0 && (
          <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-100">
             <div className="flex items-center justify-between">
                <div>
                   <h3 className="font-semibold text-slate-800">Waist-to-Height Ratio</h3>
                   <p className="text-sm text-slate-500">
                     {calculations.waistToHeight < 0.5 ? 'Healthy Range' : 'Elevated Risk'}
                   </p>
                </div>
                <div className="text-2xl font-bold text-primary">
                  {formatNumber(calculations.waistToHeight, 2)}
                </div>
             </div>
          </Card>
        )}
      </div>
    </div>
  );
};