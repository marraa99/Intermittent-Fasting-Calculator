import React from 'react';
import { Card } from '../ui/Card';

export const Disclaimer: React.FC = () => {
  return (
    <div className="max-w-2xl mx-auto mt-8">
      <Card title="Important Disclaimer" color="primary">
        <div className="prose prose-slate">
          <p className="mb-4">
            This calculator is intended for <strong>informational and educational purposes only</strong>. It is not a substitute for professional medical advice, diagnosis, or treatment.
          </p>
          <p className="mb-4">
            Always seek the advice of your physician or other qualified health provider with any questions you may have regarding a medical condition or before starting any new diet or exercise regimen.
          </p>
          <p className="mb-4">
            The calculations provided (BMR, TDEE, Body Fat) are estimates based on standard formulas and may not be 100% accurate for every individual. Athletic history, genetic factors, and specific medical conditions can significantly influence these values.
          </p>
          <p className="text-sm text-slate-500 italic">
            By using this tool, you acknowledge that you understand and agree to this disclaimer.
          </p>
        </div>
      </Card>
    </div>
  );
};