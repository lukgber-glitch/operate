/**
 * CustomerCard Component - Usage Example
 * 
 * This example demonstrates how to use the CustomerCard component
 * in chat messages to display rich customer information.
 */

import { CustomerCard } from './CustomerCard';

export function CustomerCardExample() {
  // Example customer data
  const customer = {
    id: 'cust_123',
    name: 'John Smith',
    company: 'Acme Corporation',
    email: 'john.smith@acme.com',
    status: 'ACTIVE' as const,
    totalRevenue: 125000,
    invoiceCount: 24,
    currency: 'USD',
  };

  // Handler for viewing customer profile
  const handleViewProfile = (customerId: string) => {
    console.log('Viewing profile for customer:', customerId);
    // Navigate to customer profile page
    // window.location.href = `/customers/${customerId}`;
  };

  // Handler for sending email
  const handleSendEmail = (email: string) => {
    console.log('Opening email client for:', email);
    // Open email client
    // window.location.href = `mailto:${email}`;
  };

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-2xl font-bold">CustomerCard Examples</h2>

      {/* Active customer with all data */}
      <div>
        <h3 className="text-lg font-semibold mb-2">Active Customer (Full Data)</h3>
        <CustomerCard
          customer={customer}
          onViewProfile={handleViewProfile}
          onSendEmail={handleSendEmail}
        />
      </div>

      {/* Inactive customer */}
      <div>
        <h3 className="text-lg font-semibold mb-2">Inactive Customer</h3>
        <CustomerCard
          customer={{
            id: 'cust_456',
            name: 'Jane Doe',
            email: 'jane@example.com',
            status: 'INACTIVE',
            totalRevenue: 5000,
            invoiceCount: 3,
          }}
          onViewProfile={handleViewProfile}
        />
      </div>

      {/* Minimal customer data */}
      <div>
        <h3 className="text-lg font-semibold mb-2">Minimal Customer Data</h3>
        <CustomerCard
          customer={{
            id: 'cust_789',
            name: 'Bob Johnson',
            status: 'ACTIVE',
          }}
        />
      </div>

      {/* Customer with company but no email */}
      <div>
        <h3 className="text-lg font-semibold mb-2">Customer with Company</h3>
        <CustomerCard
          customer={{
            id: 'cust_101',
            name: 'Alice Williams',
            company: 'Tech Innovations Ltd',
            status: 'ACTIVE',
            totalRevenue: 350000,
            invoiceCount: 45,
            currency: 'EUR',
          }}
          onViewProfile={handleViewProfile}
        />
      </div>
    </div>
  );
}

/**
 * Usage in Chat Message:
 * 
 * <ChatMessage>
 *   <p>Here's the customer information you requested:</p>
 *   <CustomerCard
 *     customer={customerData}
 *     onViewProfile={(id) => router.push(`/customers/${id}`)}
 *     onSendEmail={(email) => window.location.href = `mailto:${email}`}
 *   />
 * </ChatMessage>
 */
