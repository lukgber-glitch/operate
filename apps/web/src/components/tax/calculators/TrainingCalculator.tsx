'use client';

import { useTranslations } from 'next-intl';

import { useState, useEffect } from 'react';
import { GraduationCap } from 'lucide-react';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CalculatorResult } from './CalculatorResult';
import { useTaxCalculators, Country } from '@/hooks/use-tax-calculators';

interface TrainingCalculatorProps {
  country: Country;
}

const trainingTypes = [
  { value: 'course', label: 'Professional Course', icon: '📚' },
  { value: 'conference', label: 'Conference / Seminar', icon: '🎤' },
  { value: 'certification', label: 'Certification Exam', icon: '🎓' },
  { value: 'workshop', label: 'Workshop / Training', icon: '🛠️' },
  { value: 'books', label: 'Professional Books', icon: '📖' },
  { value: 'software', label: 'Learning Software / Platform', icon: '💻' },
  { value: 'coaching', label: 'Professional Coaching', icon: '🎯' },
  { value: 'language', label: 'Language Course', icon: '🌍' },
];

export function TrainingCalculator({ country }: TrainingCalculatorProps) {
  const t = useTranslations('taxCalculators');
  const { calculateTraining, saveAsDeduction, isLoading } = useTaxCalculators(country);

  const [courseName, setCourseName] = useState('');
  const [provider, setProvider] = useState('');
  const [totalCost, setTotalCost] = useState(0);
  const [trainingType, setTrainingType] = useState('course');
  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    if (totalCost > 0) {
      const calculation = calculateTraining(courseName, provider, totalCost, trainingType);
      setResult(calculation);
    } else {
      setResult(null);
    }
  }, [courseName, provider, totalCost, trainingType, calculateTraining]);

  const handleSave = async () => {
    if (result) {
      await saveAsDeduction(result, 'training');
    }
  };

  const selectedTrainingType = trainingTypes.find((t) => t.value === trainingType);

  return (
    <div className="space-y-6">
      <Card className="rounded-[16px]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5" />
            Training & Education Calculator
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Course/Training Name */}
          <div className="space-y-2">
            <Label htmlFor="courseName">Course / Training Name</Label>
            <Input
              id="courseName"
              type="text"
              value={courseName}
              onChange={(e) => setCourseName(e.target.value)}
              placeholder="e.g., AWS Solutions Architect Certification"
            />
          </div>

          {/* Provider */}
          <div className="space-y-2">
            <Label htmlFor="provider">{t('training.provider')} / Institution</Label>
            <Input
              id="provider"
              type="text"
              value={provider}
              onChange={(e) => setProvider(e.target.value)}
              placeholder="e.g., AWS Training, Udemy, Coursera"
            />
          </div>

          {/* Training Type */}
          <div className="space-y-2">
            <Label htmlFor="trainingType">Training Type</Label>
            <Select value={trainingType} onValueChange={setTrainingType}>
              <SelectTrigger id="trainingType">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {trainingTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.icon} {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Total Cost */}
          <div className="space-y-2">
            <Label htmlFor="totalCost">Total Cost (€)</Label>
            <Input
              id="totalCost"
              type="number"
              value={totalCost}
              onChange={(e) => setTotalCost(Number(e.target.value))}
              min={0}
              step={0.01}
              placeholder="0.00"
            />
            <p className="text-xs text-white/70">
              Include all costs: tuition, materials, exam fees, etc.
            </p>
          </div>

          {/* Deduction Info */}
          <div className="p-4 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900 rounded-lg">
            <div className="flex items-start gap-2">
              <span className="text-2xl">{selectedTrainingType?.icon}</span>
              <div className="flex-1">
                <h4 className="text-sm font-medium text-green-900 dark:text-green-200">
                  {selectedTrainingType?.label}
                </h4>
                <p className="text-xs text-green-900/70 dark:text-green-200/70 mt-1">
                  100% deductible when directly related to your current profession or business
                </p>
              </div>
            </div>
          </div>

          {/* Examples by Type */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-white">What qualifies?</h4>
            <ul className="space-y-1 text-sm text-white/70">
              <li className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-white/40" />
                Courses and certifications in your field
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-white/40" />
                Professional development workshops
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-white/40" />
                Books and software for professional learning
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-white/40" />
                Industry conferences and seminars
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {result && (
        <CalculatorResult
          originalAmount={result.totalCost}
          deductibleAmount={result.deduction}
          taxSavings={result.taxSavings}
          legalReference={{
            title: 'Training & Education Deductions',
            description: `Professional development expenses are fully deductible when they maintain or improve skills required for your current profession. This includes courses, certifications, books, and related materials. The training must be directly related to your business activities.`,
          }}
          requiredDocuments={[
            'Course enrollment confirmation or receipt',
            'Payment proof (invoice, bank statement)',
            'Course syllabus or description',
            'Certificate of completion (if applicable)',
            'Explanation of relevance to your profession',
          ]}
          onSave={handleSave}
          isSaving={isLoading}
        />
      )}
    </div>
  );
}
