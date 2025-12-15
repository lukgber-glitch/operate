/**
 * EntityPreviewSidebar - Usage Examples
 *
 * This file demonstrates how to integrate the EntityPreviewSidebar
 * with chat messages and other parts of the application.
 */

import { useState } from 'react';
import { EntityPreviewSidebar, useEntityPreview, EntityPreviewData, EntityType } from './EntityPreviewSidebar';
import { Button } from '@/components/ui/button';
import { FileText, Download, Mail, Trash2 } from 'lucide-react';

/**
 * Example 1: Basic Usage with Manual Entity Data
 */
export function BasicEntityPreviewExample() {
  const preview = useEntityPreview();

  const handleShowInvoice = () => {
    const invoiceData: EntityPreviewData = {
      id: 'inv-123',
      type: 'invoice',
      title: 'Invoice #INV-2024-001',
      subtitle: 'Acme Corporation',
      status: 'Pending',
      metadata: {
        amount: 1250.00,
        dueDate: '2024-12-15',
        issueDate: '2024-11-15',
        currency: 'EUR',
        items: 3,
      },
      actions: [
        {
          label: 'Send Reminder',
          onClick: () => console.log('Send reminder'),
          icon: Mail,
          variant: 'outline',
        },
        {
          label: 'Download PDF',
          onClick: () => console.log('Download PDF'),
          icon: Download,
          variant: 'outline',
        },
        {
          label: 'Delete Invoice',
          onClick: () => console.log('Delete invoice'),
          icon: Trash2,
          variant: 'destructive',
        },
      ],
    };

    preview.showEntity(invoiceData);
  };

  return (
    <>
      <Button onClick={handleShowInvoice}>
        <FileText className="h-4 w-4 mr-2" />
        View Invoice
      </Button>

      <EntityPreviewSidebar {...preview.props} />
    </>
  );
}

/**
 * Example 2: Integration with API Fetching
 */
export function FetchingEntityPreviewExample() {
  const preview = useEntityPreview();

  const handleShowEntity = async (type: EntityType, id: string) => {
    // Define fetcher function
    const fetcher = async (type: EntityType, id: string): Promise<EntityPreviewData> => {
      // Fetch from API
      const response = await fetch(`/api/v1/${type}s/${id}`);
      if (!response.ok) throw new Error('Failed to fetch entity');

      const data = await response.json();

      // Transform API response to EntityPreviewData format
      return transformToEntityData(type, data);
    };

    // Use the hook's fetch function
    await preview.fetchAndShowEntity(type, id, fetcher);
  };

  return (
    <>
      <Button onClick={() => handleShowEntity('invoice', 'inv-123')}>
        View Invoice
      </Button>

      <EntityPreviewSidebar {...preview.props} />
    </>
  );
}

/**
 * Example 3: Integration with Chat Messages
 * Show entity preview when user mentions an entity in chat
 */
export function ChatIntegrationExample() {
  const preview = useEntityPreview();
  const [message, setMessage] = useState('');

  const handleSendMessage = async () => {
    // Parse message for entity references
    const entityRef = extractEntityReference(message);

    if (entityRef) {
      // Show preview of mentioned entity
      const entityData = await fetchEntityData(entityRef.type, entityRef.id);
      preview.showEntity(entityData);
    }

    // Send message to chat API
    // ...
  };

  return (
    <>
      <div className="chat-container">
        <input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type a message... (try: 'Show me invoice INV-001')"
        />
        <Button onClick={handleSendMessage}>Send</Button>
      </div>

      <EntityPreviewSidebar {...preview.props} />
    </>
  );
}

/**
 * Example 4: Multiple Entity Types
 */
export function MultipleEntityTypesExample() {
  const preview = useEntityPreview();

  const entityExamples = [
    {
      type: 'invoice' as EntityType,
      title: 'Invoice #INV-001',
      data: {
        id: 'inv-001',
        type: 'invoice' as EntityType,
        title: 'Invoice #INV-001',
        subtitle: 'Acme Corporation',
        status: 'Paid',
        metadata: {
          amount: 1250.00,
          dueDate: '2024-12-15',
          paidDate: '2024-12-10',
        },
      },
    },
    {
      type: 'expense' as EntityType,
      title: 'Office Supplies',
      data: {
        id: 'exp-001',
        type: 'expense' as EntityType,
        title: 'Office Supplies',
        subtitle: 'Staples',
        status: 'Approved',
        metadata: {
          amount: 125.50,
          date: '2024-11-20',
          category: 'Office',
          receipt: 'Available',
        },
      },
    },
    {
      type: 'client' as EntityType,
      title: 'Acme Corporation',
      data: {
        id: 'client-001',
        type: 'client' as EntityType,
        title: 'Acme Corporation',
        subtitle: 'Technology Company',
        status: 'Active',
        metadata: {
          contact: 'John Doe',
          email: 'john@acme.com',
          phone: '+1-555-0123',
          totalRevenue: 15000.00,
          openInvoices: 3,
        },
      },
    },
  ];

  return (
    <div className="space-y-2">
      {entityExamples.map((example) => (
        <Button
          key={example.data.id}
          variant="outline"
          onClick={() => preview.showEntity(example.data)}
          className="w-full justify-start"
        >
          {example.title}
        </Button>
      ))}

      <EntityPreviewSidebar {...preview.props} />
    </div>
  );
}

/**
 * Helper Functions
 */

// Extract entity reference from message text
function extractEntityReference(message: string): { type: EntityType; id: string } | null {
  const invoiceMatch = message.match(/invoice\s+#?([A-Z0-9-]+)/i);
  if (invoiceMatch && invoiceMatch[1]) {
    return { type: 'invoice', id: invoiceMatch[1] };
  }

  const expenseMatch = message.match(/expense\s+#?([A-Z0-9-]+)/i);
  if (expenseMatch && expenseMatch[1]) {
    return { type: 'expense', id: expenseMatch[1] };
  }

  const clientMatch = message.match(/client\s+([A-Z0-9-]+)/i);
  if (clientMatch && clientMatch[1]) {
    return { type: 'client', id: clientMatch[1] };
  }

  return null;
}

// Fetch entity data from API
async function fetchEntityData(type: EntityType, id: string): Promise<EntityPreviewData> {
  const response = await fetch(`/api/v1/${type}s/${id}`);
  if (!response.ok) throw new Error('Failed to fetch entity');

  const data = await response.json();
  return transformToEntityData(type, data);
}

// Transform API response to EntityPreviewData format
function transformToEntityData(type: EntityType, data: any): EntityPreviewData {
  switch (type) {
    case 'invoice':
      return {
        id: data.id,
        type: 'invoice',
        title: `Invoice #${data.number}`,
        subtitle: data.clientName,
        status: data.status,
        metadata: {
          amount: data.amount,
          dueDate: data.dueDate,
          issueDate: data.issueDate,
          currency: data.currency,
          items: data.items?.length || 0,
        },
        actions: [
          {
            label: 'Send Reminder',
            onClick: () => console.log('Send reminder'),
            icon: Mail,
          },
          {
            label: 'Download PDF',
            onClick: () => console.log('Download'),
            icon: Download,
          },
        ],
      };

    case 'expense':
      return {
        id: data.id,
        type: 'expense',
        title: data.description,
        subtitle: data.vendorName,
        status: data.status,
        metadata: {
          amount: data.amount,
          date: data.date,
          category: data.category,
          receipt: data.hasReceipt ? 'Available' : 'Missing',
        },
      };

    case 'client':
      return {
        id: data.id,
        type: 'client',
        title: data.name,
        subtitle: data.industry,
        status: data.status,
        metadata: {
          contact: data.contactName,
          email: data.email,
          phone: data.phone,
          totalRevenue: data.totalRevenue,
          openInvoices: data.openInvoiceCount,
        },
      };

    default:
      throw new Error(`Unsupported entity type: ${type}`);
  }
}

/**
 * Integration Instructions:
 *
 * 1. Add the EntityPreviewSidebar to your chat page:
 *    ```tsx
 *    const preview = useEntityPreview();
 *
 *    return (
 *      <>
 *        <ChatInterface onEntityMention={(type, id) => preview.fetchAndShowEntity(type, id, fetcher)} />
 *        <EntityPreviewSidebar {...preview.props} />
 *      </>
 *    );
 *    ```
 *
 * 2. Parse chat messages for entity mentions:
 *    - Use regex to detect patterns like "Invoice #INV-001" or "Show me expense EXP-123"
 *    - Extract entity type and ID
 *    - Call preview.fetchAndShowEntity() or preview.showEntity()
 *
 * 3. Add entity links in chat responses:
 *    - When AI mentions an entity in response, make it clickable
 *    - On click, show the entity preview sidebar
 *
 * 4. Customize actions based on entity state:
 *    - For unpaid invoices: "Send Reminder", "Mark as Paid"
 *    - For pending expenses: "Approve", "Reject"
 *    - For clients: "New Invoice", "View History"
 */
