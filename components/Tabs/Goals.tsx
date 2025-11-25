import React, { useMemo } from 'react';
import { AppState, CONSTANTS, UnitSystem } from '../../types';
import { getMetricValues, calculateBMR, formatNumber } from '../../utils/calculations';
import { Card } from '../ui/Card';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend } from 'recharts';

interface Props {
  state: AppState;
}

export const Goals: React.FC<Props> = ({ state }) => {
  const projectionData = useMemo(() => {
    const { weightKg, heightCm } = getMetricValues(state);
    const bmrData = calculateBMR(weightKg, heightCm, state.age, state.gender, state.bodyFatPercentage === '' ? undefined : state.bodyFatPercentage);
    const dailyTdee = bmrData.average * state.activityLevel;
    
    // Calculate weekly net calories
    const restCals = dailyTdee * (1 + state.restCaloriesSplit / 100);
    const workCals = dailyTdee * (1 + state.workoutCaloriesSplit / 100);
    
    const restDays = state.daysPerCycle - state.workoutsPerWeek;
    const weeklyIntake = (restCals * restDays) + (workCals * state.workoutsPerWeek);
    const weeklyExpenditure = dailyTdee * state.daysPerCycle;
    const weeklyDeficit = weeklyIntake - weeklyExpenditure; // Negative means weight loss
    
    // Projection Loop (12 weeks)
    const weeks = 12;
    const data = [];
    let currentWeight = weightKg;
    let currentFatMass = state.bodyFatPercentage !== '' ? weightKg * (state.bodyFatPercentage / 100) : null;
    let cumulativeChange = 0;

    for (let i = 0; i <= weeks; i++) {
        data.push({
            week: i,
            weightKg: currentWeight,
            weightLbs: currentWeight * CONSTANTS.KG_TO_LBS,
            bodyFatPercent: currentFatMass !== null ? (currentFatMass / currentWeight) * 100 : null,
            change: cumulativeChange
        });

        const kgChange = weeklyDeficit / CONSTANTS.CALORIES_PER_KG_FAT;
        currentWeight += kgChange;
        cumulativeChange += kgChange;
        if (currentFatMass !== null) {
            // Assuming 100% of weight change comes from fat for simplicity (or simplistic model)
            currentFatMass += kgChange; 
        }
    }

    return { weeklyDeficit, data };
  }, [state]);

  const isMetric = state.unitSystem === UnitSystem.METRIC;

  return (
    <div className="p-4 space-y-6">
      <Card title="12-Week Projection" className="bg-white">
        <div className="h-64 w-full mt-4">
             <ResponsiveContainer width="100%" height="100%">
               <LineChart data={projectionData.data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                 <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                 <XAxis dataKey="week" stroke="#64748b" label={{ value: 'Week', position: 'insideBottomRight', offset: -10 }} />
                 <YAxis stroke="#64748b" domain={['auto', 'auto']} label={{ value: isMetric ? 'kg' : 'lbs', angle: -90, position: 'insideLeft' }} />
                 <RechartsTooltip 
                    formatter={(val: number, name: string) => [formatNumber(val, 1), name === 'weightKg' ? 'Weight (kg)' : (name === 'weightLbs' ? 'Weight (lbs)' : name)]}
                    labelFormatter={(label) => `Week ${label}`}
                 />
                 <Legend />
                 <Line type="monotone" dataKey={isMetric ? "weightKg" : "weightLbs"} stroke="#6366f1" strokeWidth={2} name="Projected Weight" activeDot={{ r: 8 }} />
               </LineChart>
             </ResponsiveContainer>
        </div>
      </Card>

      <Card title="Detailed Weekly Breakdown">
        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm text-center">
                <thead className="bg-slate-50">
                    <tr>
                        <th className="px-4 py-3 font-semibold text-slate-700">Week</th>
                        <th className="px-4 py-3 font-semibold text-slate-700">Projected Weight</th>
                        <th className="px-4 py-3 font-semibold text-slate-700">Cumulative Change</th>
                        {projectionData.data[0].bodyFatPercent !== null && (
                            <th className="px-4 py-3 font-semibold text-slate-700">Est. Body Fat %</th>
                        )}
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                    {projectionData.data.map((row) => (
                        <tr key={row.week} className="hover:bg-slate-50 transition-colors">
                            <td className="px-4 py-2 font-medium text-slate-900">{row.week}</td>
                            <td className="px-4 py-2 text-slate-600">
                                {isMetric ? formatNumber(row.weightKg, 2) + ' kg' : formatNumber(row.weightLbs, 2) + ' lbs'}
                            </td>
                            <td className="px-4 py-2">
                                <span className={`inline-block px-2 py-1 rounded text-xs font-bold ${row.change < 0 ? 'bg-green-100 text-green-700' : (row.change > 0 ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-700')}`}>
                                    {row.change > 0 ? '+' : ''}
                                    {isMetric ? formatNumber(row.change, 2) + ' kg' : formatNumber(row.change * CONSTANTS.KG_TO_LBS, 2) + ' lbs'}
                                </span>
                            </td>
                             {row.bodyFatPercent !== null && (
                                <td className="px-4 py-2 text-slate-600">{formatNumber(row.bodyFatPercent, 1)}%</td>
                            )}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
      </Card>
      
      <div className="text-center text-sm text-slate-500 italic mt-4">
          * Projections assume a constant metabolic rate and linear weight loss, which is rarely the case in reality. Metabolic adaptation usually slows progress over time.
      </div>
    </div>
  );
};