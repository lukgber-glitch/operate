import { ReviewQueueList } from '@/components/intelligence/ReviewQueueList';

export default function EmailReviewsPage() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Email Review Queue</h1>
        <p className="text-muted-foreground">
          Review and approve emails that need manual verification before creating customers or vendors.
        </p>
      </div>

      <ReviewQueueList />
    </div>
  );
}
