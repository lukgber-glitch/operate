import { DocumentsPageSkeleton } from '@/components/loading';

/**
 * Loading state for the documents page
 * This component is automatically used by Next.js when the page is loading
 */
export default function DocumentsLoading() {
  return <DocumentsPageSkeleton />;
}
