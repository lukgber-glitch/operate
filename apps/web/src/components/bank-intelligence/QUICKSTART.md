# Bank Intelligence Dashboard - Quick Start

## 🚀 5-Minute Setup

### Option 1: Test with Mock Data (Recommended for Development)

```tsx
// app/test/bank-intelligence/page.tsx
import { BankIntelligenceDashboardExample } from '@/components/bank-intelligence/BankIntelligenceDashboard.example';

export default function TestPage() {
  return (
    <div className="container mx-auto p-6">
      <BankIntelligenceDashboardExample />
    </div>
  );
}
```

Visit: `http://localhost:3000/test/bank-intelligence`

**Result**: Fully functional dashboard with realistic mock data

---

### Option 2: Production Integration

```tsx
// app/bank-intelligence/page.tsx
import { BankIntelligenceDashboard } from '@/components/bank-intelligence';

export default function BankIntelligencePage() {
  return (
    <div className="container mx-auto p-6">
      <BankIntelligenceDashboard />
    </div>
  );
}
```

**Requires**: Backend API endpoints (see INTEGRATION_GUIDE.md)

---

## 📦 Individual Component Usage

### Just the Cash Flow Chart

```tsx
import { CashFlowChart, useCashFlowForecast } from '@/components/bank-intelligence';

export function MyCashFlowPage() {
  const { data, isLoading } = useCashFlowForecast(30);

  if (isLoading) return <div>Loading...</div>;

  return <CashFlowChart data={data || []} currency="EUR" />;
}
```

### Just the Alerts Widget

```tsx
import { BankIntelligenceAlerts } from '@/components/bank-intelligence';

export function MyAlertsWidget() {
  return <BankIntelligenceAlerts maxAlerts={5} />;
}
```

### Just the Transaction Table

```tsx
import { TransactionClassificationTable } from '@/components/bank-intelligence';

export function MyTransactionsPage() {
  return <TransactionClassificationTable limit={50} />;
}
```

---

## 🎨 Customization Examples

### Custom Styling

```tsx
<BankIntelligenceDashboard className="max-w-7xl mx-auto" />
```

### Custom Currency

All components respect the currency from API data, but you can override:

```tsx
<CashFlowChart data={data} currency="USD" />
```

### Custom Time Range

```tsx
const [days, setDays] = useState(60);
const { data } = useCashFlowForecast(days);

return (
  <>
    <select onChange={(e) => setDays(Number(e.target.value))}>
      <option value={7}>7 days</option>
      <option value={30}>30 days</option>
      <option value={60}>60 days</option>
      <option value={90}>90 days</option>
    </select>
    <CashFlowChart data={data || []} />
  </>
);
```

---

## 🔧 Common Tasks

### Add to Navigation

```tsx
// In your sidebar/nav component
import { Sparkles } from 'lucide-react';

const navItems = [
  {
    title: 'Bank Intelligence',
    href: '/bank-intelligence',
    icon: Sparkles,
  },
];
```

### Protect with Authentication

```tsx
// app/bank-intelligence/page.tsx
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';

export default async function BankIntelligencePage() {
  const session = await getServerSession();

  if (!session) {
    redirect('/login');
  }

  return <BankIntelligenceDashboard />;
}
```

### Add to Dashboard Widget

```tsx
// On your main dashboard
import { BankIntelligenceAlerts } from '@/components/bank-intelligence';

export function Dashboard() {
  return (
    <div className="grid gap-6">
      {/* Other widgets */}
      <BankIntelligenceAlerts maxAlerts={3} />
    </div>
  );
}
```

---

## 🐛 Troubleshooting

### Components not rendering?

1. Check that React Query provider is set up:
```tsx
// app/providers.tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient();

export function Providers({ children }) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
```

2. Verify API base URL:
```bash
# .env.local
NEXT_PUBLIC_API_URL=http://localhost:4000/api/v1
```

### TypeScript errors?

All types are exported:
```tsx
import type {
  BankAlert,
  CashFlowDataPoint,
  RecurringExpense
} from '@/components/bank-intelligence';
```

### Styles not working?

Ensure Tailwind is configured to scan the components:
```js
// tailwind.config.js
module.exports = {
  content: [
    './src/components/**/*.{ts,tsx}',
    // ... other paths
  ],
};
```

---

## 📚 Learn More

- **Full Documentation**: See `README.md`
- **Backend Integration**: See `INTEGRATION_GUIDE.md`
- **API Specifications**: See example responses in `INTEGRATION_GUIDE.md`
- **Implementation Details**: See `IMPLEMENTATION_SUMMARY.md`

---

## 💡 Pro Tips

1. **Start with mock data** - Use the example component to see all features
2. **Test responsive design** - Resize browser to see mobile/tablet layouts
3. **Try dark mode** - Toggle system theme to see dark mode
4. **Customize gradually** - Start with default, then customize as needed
5. **Use TypeScript** - All types are exported for autocomplete

---

## 🎯 Next Steps

1. ✅ Test with mock data
2. ⏳ Implement backend API endpoints
3. ⏳ Connect real banking data
4. ⏳ Deploy to production
5. ⏳ Add user feedback
6. ⏳ Monitor usage analytics

---

**Need Help?**
- Check the documentation files
- Review the example component
- Test with mock data first
- Verify all dependencies are installed

Built with ❤️ by PRISM agent
