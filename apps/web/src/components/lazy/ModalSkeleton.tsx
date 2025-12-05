/**
 * Loading skeleton for modal/dialog components
 */

import { LoadingSkeleton, TextSkeleton } from './LoadingSkeleton';

export function ModalSkeleton() {
  return (
    <div className="space-y-6 p-6">
      {/* Modal header */}
      <div className="space-y-2">
        <LoadingSkeleton variant="text" className="w-1/3" height={24} />
        <LoadingSkeleton variant="text" className="w-2/3" height={14} />
      </div>

      {/* Form fields */}
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="space-y-2">
            <LoadingSkeleton variant="text" className="w-24" height={14} />
            <LoadingSkeleton variant="rectangle" className="w-full h-10" />
          </div>
        ))}
      </div>

      {/* Footer buttons */}
      <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
        <LoadingSkeleton variant="rectangle" className="w-24 h-10" />
        <LoadingSkeleton variant="rectangle" className="w-24 h-10" />
      </div>
    </div>
  );
}
