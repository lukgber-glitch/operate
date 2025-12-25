/**
 * Chat Action Components
 * Exportable components for chat-triggered actions
 *
 * @example
 * import { InvoiceModal } from '@/components/chat/actions';
 *
 * function ChatInterface() {
 *   const [showInvoiceModal, setShowInvoiceModal] = useState(false);
 *   const [clients, setClients] = useState<Client[]>([]);
 *
 *   const handleCreateInvoice = async (data: CreateInvoiceRequest) => {
 *     await financeApi.createInvoice(data);
 *     setShowInvoiceModal(false);
 *   };
 *
 *   return (
 *     <InvoiceModal
 *       open={showInvoiceModal}
 *       onClose={() => setShowInvoiceModal(false)}
 *       onSubmit={handleCreateInvoice}
 *       clients={clients}
 *       prefillData={{ clientId: 'client-123' }}
 *     />
 *   );
 * }
 */

export { InvoiceModal } from './InvoiceModal';
export type { InvoiceModalProps } from './InvoiceModal';
