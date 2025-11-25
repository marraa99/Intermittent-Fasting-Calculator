import React, { useMemo } from 'react';
import { AppState, CONSTANTS, UnitSystem } from '../../types';
import { getMetricValues, calculateBMR, calculateMacroDetails, formatNumber } from '../../utils/calculations';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface Props {
  state: AppState;
  updateState: (updates: Partial<AppState>) => void;
}

export const MacroCalculator: React.FC<Props> = ({ state, updateState }) => {

  const data = useMemo(() => {
    // 1. Recalculate TDEE (Need a centralized way or prop, but easy to re-compute)
    const { weightKg, heightCm } = getMetricValues(state);
    const bmrData = calculateBMR(weightKg, heightCm, state.age, state.gender, state.bodyFatPercentage === '' ? undefined : state.bodyFatPercentage);
    const tdee = bmrData.average * state.activityLevel;

    // 2. Calories per day type
    const restCalories = tdee * (1 + state.restCaloriesSplit / 100);
    const workoutCalories = tdee * (1 + state.workoutCaloriesSplit / 100);

    // 3. Macros
    const restMacros = calculateMacroDetails(restCalories, state.restProteinGrams, state.restFatSplitPercent);
    const workoutMacros = calculateMacroDetails(workoutCalories, state.workoutProteinGrams, state.workoutFatSplitPercent);

    // 4. Weekly Summary
    const restDays = state.daysPerCycle - state.workoutsPerWeek; // Assuming cycle = 7 days for weekly approximation usually
    const weeklyRestCals = restCalories * restDays;
    const weeklyWorkoutCals = workoutCalories * state.workoutsPerWeek;
    const totalWeeklyCals = weeklyRestCals + weeklyWorkoutCals;
    const totalWeeklyTDEE = tdee * state.daysPerCycle;
    
    const weeklyDeficit = totalWeeklyCals - totalWeeklyTDEE;
    
    // Weight change
    const kgChange = weeklyDeficit / CONSTANTS.CALORIES_PER_KG_FAT;
    const lbChange = weeklyDeficit / CONSTANTS.CALORIES_PER_LB_FAT;

    return {
      tdee,
      rest: { ...restMacros, count: restDays },
      workout: { ...workoutMacros, count: state.workoutsPerWeek },
      summary: {
        totalWeeklyCals,
        totalWeeklyTDEE,
        weeklyDeficit,
        kgChange,
        lbChange
      }
    };
  }, [state]);

  const COLORS = ['#10B981', '#3B82F6', '#F59E0B']; // Protein (Green), Carbs (Blue), Fat (Orange)
  
  const createChartData = (macros: typeof data.rest) => [
    { name: 'Protein', value: macros.protein.cals },
    { name: 'Carbs', value: macros.carbs.cals },
    { name: 'Fat', value: macros.fat.cals },
  ];

  const renderMacroCard = (title: string, macros: typeof data.rest, isRest: boolean) => (
    <Card title={title} color={isRest ? 'secondary' : 'primary'} className="h-full">
      <div className="flex flex-col h-full">
        <div className="flex justify-between items-center mb-4">
           <span className="text-sm font-medium text-slate-500">Total Calories</span>
           <span className="text-2xl font-bold">{formatNumber(macros.calories)}</span>
        </div>

        <div className="h-48 w-full mb-4">
           <ResponsiveContainer width="100%" height="100%">
             <PieChart>
               <Pie
                 data={createChartData(macros)}
                 cx="50%"
                 cy="50%"
                 innerRadius={40}
                 outerRadius={70}
                 fill="#8884d8"
                 paddingAngle={5}
                 dataKey="value"
               >
                 {createChartData(macros).map((entry, index) => (
                   <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                 ))}
               </Pie>
               <Tooltip formatter={(value: number) => `${formatNumber(value)} kcal`} />
               <Legend verticalAlign="bottom" height={36} iconType="circle" />
             </PieChart>
           </ResponsiveContainer>
        </div>

        <div className="space-y-2 text-sm mt-auto">
          <div className="flex justify-between items-center p-2 bg-emerald-50 rounded text-emerald-900">
             <span>Protein ({formatNumber((macros.protein.cals/macros.calories)*100)}%)</span>
             <span className="font-bold">{formatNumber(macros.protein.grams)}g</span>
          </div>
          <div className="flex justify-between items-center p-2 bg-blue-50 rounded text-blue-900">
             <span>Carbs ({formatNumber((macros.carbs.cals/macros.calories)*100)}%)</span>
             <span className="font-bold">{formatNumber(macros.carbs.grams)}g</span>
          </div>
          <div className="flex justify-between items-center p-2 bg-amber-50 rounded text-amber-900">
             <span>Fat ({formatNumber((macros.fat.cals/macros.calories)*100)}%)</span>
             <span className="font-bold">{formatNumber(macros.fat.grams)}g</span>
          </div>
        </div>
      </div>
    </Card>
  );

  return (
    <div className="p-4 space-y-6">
      <Card title="Configuration" className="bg-slate-50 border-slate-200">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
           <Input 
             label="Days per Cycle" 
             type="number" 
             value={state.daysPerCycle} 
             onChange={(e) => updateState({ daysPerCycle: Number(e.target.value) })}
           />
           <Input 
             label="Workouts / Week" 
             type="number" 
             value={state.workoutsPerWeek} 
             onChange={(e) => updateState({ workoutsPerWeek: Number(e.target.value) })}
           />
        </div>
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-8">
           {/* Rest Settings */}
           <div className="space-y-3 border-r border-slate-200 pr-4 md:border-r-0 md:pr-0 lg:border-r lg:pr-8">
              <h4 className="font-semibold text-slate-700">Rest Days</h4>
              <div className="grid grid-cols-2 gap-2">
                <Input label="Calorie Adj (%)" type="number" value={state.restCaloriesSplit} onChange={(e) => updateState({ restCaloriesSplit: Number(e.target.value) })} />
                <Input label="Protein (g)" type="number" value={state.restProteinGrams} onChange={(e) => updateState({ restProteinGrams: Number(e.target.value) })} />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 block mb-1">
                  Fat / Carb Split (Remaining Cals)
                </label>
                <div className="flex items-center space-x-2">
                   <span className="text-xs text-blue-600 font-bold">Carbs</span>
                   <input 
                     type="range" 
                     min="0" 
                     max="100" 
                     value={state.restFatSplitPercent} 
                     onChange={(e) => updateState({ restFatSplitPercent: Number(e.target.value) })}
                     className="flex-1 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-amber-500"
                   />
                   <span className="text-xs text-amber-600 font-bold">Fat</span>
                </div>
                <div className="flex justify-between text-xs text-slate-400 mt-1">
                   <span>{100 - state.restFatSplitPercent}%</span>
                   <span>{state.restFatSplitPercent}%</span>
                </div>
              </div>
           </div>

           {/* Workout Settings */}
           <div className="space-y-3">
              <h4 className="font-semibold text-slate-700">Workout Days</h4>
              <div className="grid grid-cols-2 gap-2">
                <Input label="Calorie Adj (%)" type="number" value={state.workoutCaloriesSplit} onChange={(e) => updateState({ workoutCaloriesSplit: Number(e.target.value) })} />
                <Input label="Protein (g)" type="number" value={state.workoutProteinGrams} onChange={(e) => updateState({ workoutProteinGrams: Number(e.target.value) })} />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 block mb-1">
                  Fat / Carb Split (Remaining Cals)
                </label>
                <div className="flex items-center space-x-2">
                   <span className="text-xs text-blue-600 font-bold">Carbs</span>
                   <input 
                     type="range" 
                     min="0" 
                     max="100" 
                     value={state.workoutFatSplitPercent} 
                     onChange={(e) => updateState({ workoutFatSplitPercent: Number(e.target.value) })}
                     className="flex-1 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-amber-500"
                   />
                   <span className="text-xs text-amber-600 font-bold">Fat</span>
                </div>
                <div className="flex justify-between text-xs text-slate-400 mt-1">
                   <span>{100 - state.workoutFatSplitPercent}%</span>
                   <span>{state.workoutFatSplitPercent}%</span>
                </div>
              </div>
           </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
         {renderMacroCard(`Rest Day (${data.rest.count}/wk)`, data.rest, true)}
         {renderMacroCard(`Workout Day (${data.workout.count}/wk)`, data.workout, false)}
         
         <Card title="Weekly Summary" className="bg-slate-800 text-white border-slate-700" color="default">
           <div className="space-y-4 h-full flex flex-col justify-center">
             <div className="flex justify-between items-center border-b border-slate-700 pb-3">
               <span className="text-slate-300">TDEE (Week)</span>
               <span className="text-xl font-mono">{formatNumber(data.summary.totalWeeklyTDEE)}</span>
             </div>
             <div className="flex justify-between items-center border-b border-slate-700 pb-3">
               <span className="text-slate-300">Intake (Week)</span>
               <span className="text-xl font-mono">{formatNumber(data.summary.totalWeeklyCals)}</span>
             </div>
             <div className="flex justify-between items-center border-b border-slate-700 pb-3">
               <span className="text-slate-300">Net Calories</span>
               <span className={`text-xl font-bold font-mono ${data.summary.weeklyDeficit > 0 ? 'text-green-400' : 'text-red-400'}`}>
                 {data.summary.weeklyDeficit > 0 ? '+' : ''}{formatNumber(data.summary.weeklyDeficit)}
               </span>
             </div>
             <div className="bg-slate-700/50 p-3 rounded-lg text-center mt-2">
               <span className="block text-slate-400 text-xs uppercase tracking-wider mb-1">Projected Weekly Change</span>
               <span className="block text-2xl font-bold text-white">
                 {data.summary.kgChange > 0 ? '+' : ''}{formatNumber(data.summary.kgChange, 2)} kg
               </span>
               <span className="block text-sm text-slate-400">
                 ({data.summary.lbChange > 0 ? '+' : ''}{formatNumber(data.summary.lbChange, 2)} lbs)
               </span>
             </div>
           </div>
         </Card>
      </div>
    </div>
  );
};