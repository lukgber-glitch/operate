import { GuruLoader } from '@/components/ui/guru-loader';

export default function OnboardingLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center">
      <div className="text-center">
        <GuruLoader size={80} className="mx-auto mb-4" />
        <p className="text-slate-600 dark:text-slate-400 text-sm">
          Loading...
        </p>
      </div>
    </div>
  );
}
