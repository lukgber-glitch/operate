import { redirect } from 'next/navigation';

/**
 * /tax/returns redirects to tax filing
 */
export default function TaxReturnsRedirect() {
  redirect('/tax/filing');
}
