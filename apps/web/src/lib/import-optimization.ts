/**
 * Import Optimization Utilities
 *
 * Helpers for optimizing third-party library imports
 * to reduce bundle size through tree-shaking.
 */

/**
 * Optimized Lucide React icon imports
 *
 * Instead of: import { Icon1, Icon2 } from 'lucide-react'
 * Use: import Icon1 from 'lucide-react/dist/esm/icons/icon-1'
 *
 * However, Next.js 14's optimizePackageImports handles this automatically.
 * This is here for documentation and fallback.
 */

// Example of manual tree-shaking (not needed with optimizePackageImports)
// export { ChevronRight } from 'lucide-react/dist/esm/icons/chevron-right';

/**
 * Optimized Radix UI imports
 *
 * Radix UI is already tree-shakeable, but we can be explicit:
 */

// Dialog
export {
  Root as DialogRoot,
  Trigger as DialogTrigger,
  Portal as DialogPortal,
  Overlay as DialogOverlay,
  Content as DialogContent,
  Title as DialogTitle,
  Description as DialogDescription,
  Close as DialogClose,
} from '@radix-ui/react-dialog';

// Dropdown Menu
export {
  Root as DropdownRoot,
  Trigger as DropdownTrigger,
  Portal as DropdownPortal,
  Content as DropdownContent,
  Item as DropdownItem,
  Separator as DropdownSeparator,
} from '@radix-ui/react-dropdown-menu';

/**
 * Recharts optimization
 *
 * Import only the chart types you need
 */
export {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';

/**
 * Socket.IO optimization
 *
 * Use the slim build if you don't need all features
 */

// Example: If you only need basic functionality
// import { io } from 'socket.io-client/dist/socket.io.slim.js';

/**
 * Date formatting utilities
 *
 * Instead of importing entire date-fns, import specific functions
 */

// Example (if using date-fns):
// import format from 'date-fns/format';
// import parseISO from 'date-fns/parseISO';
// import addDays from 'date-fns/addDays';

/**
 * Lodash optimization
 *
 * Never import entire lodash:
 * ❌ import _ from 'lodash'
 * ✅ import debounce from 'lodash/debounce'
 *
 * Or use lodash-es for better tree-shaking:
 * ✅ import { debounce } from 'lodash-es'
 */

/**
 * Utility: Lazy load third-party libraries
 */
export async function loadLibrary<T>(
  libraryName: string,
  importFn: () => Promise<T>
): Promise<T> {
  try {
    return await importFn();
  } catch (error) {
    console.error(`Failed to load library: ${libraryName}`, error);
    throw error;
  }
}

/**
 * Example usage:
 *
 * const exportPDF = async () => {
 *   const htmlToImage = await loadLibrary(
 *     'html-to-image',
 *     () => import('html-to-image')
 *   );
 *   // Use htmlToImage
 * };
 */

/**
 * Preload critical libraries
 *
 * Use this for libraries that will definitely be needed soon
 */
export function preloadLibrary(path: string) {
  if (typeof window !== 'undefined') {
    const link = document.createElement('link');
    link.rel = 'modulepreload';
    link.href = path;
    document.head.appendChild(link);
  }
}

/**
 * Example usage in a component:
 *
 * useEffect(() => {
 *   // Preload chart library when user hovers over dashboard link
 *   preloadLibrary('/_next/static/chunks/recharts-vendor.js');
 * }, []);
 */

/**
 * Check if a library is already loaded
 */
export function isLibraryLoaded(libraryName: string): boolean {
  if (typeof window === 'undefined') return false;

  // Check if module is in cache
  return libraryName in (window as any).__NEXT_DATA__?.props?.pageProps || false;
}

/**
 * Bundle size analysis helper
 *
 * Use in development to log import sizes
 */
export function logImportSize(componentName: string, size?: number) {
  if (process.env.NODE_ENV === 'development') {
    console.log(`[Import] ${componentName}${size ? ` (~${size}KB)` : ''}`);
  }
}

/**
 * Example usage:
 *
 * const LazyChart = dynamic(
 *   async () => {
 *     logImportSize('CashFlowChart', 85);
 *     return import('./CashFlowChart');
 *   }
 * );
 */
