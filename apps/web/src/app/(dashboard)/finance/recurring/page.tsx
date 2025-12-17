import { redirect } from 'next/navigation';

/**
 * /finance/recurring redirects to recurring invoices
 */
export default function FinanceRecurringRedirect() {
  redirect('/finance/invoices/recurring');
}
