import { redirect } from 'next/navigation';

/**
 * /finance/reports redirects to the main reports page
 */
export default function FinanceReportsRedirect() {
  redirect('/reports/financial');
}
