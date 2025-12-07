# ProactiveSuggestions - Quick Start Guide

## 🚀 5-Minute Integration

### Step 1: Import the component
```tsx
import { ProactiveSuggestions } from '@/components/chat/ProactiveSuggestions';
```

### Step 2: Add to your page
```tsx
export function MyPage() {
  return (
    <div>
      <h1>My Page</h1>

      <ProactiveSuggestions
        context="dashboard"
        limit={5}
        onExecute={(id) => console.log('Execute:', id)}
        onDismiss={(id) => console.log('Dismiss:', id)}
      />
    </div>
  );
}
```

### Step 3: Done! 🎉

The component will:
- ✅ Fetch suggestions from the API automatically
- ✅ Display them with animations
- ✅ Handle loading, error, and empty states
- ✅ Update optimistically when actions are performed

---

## 📋 Common Use Cases

### Dashboard Widget
```tsx
<ProactiveSuggestions context="dashboard" limit={5} />
```

### Finance Page
```tsx
<ProactiveSuggestions context="finance.invoices" limit={3} />
```

### Tax Page
```tsx
<ProactiveSuggestions context="tax" limit={5} />
```

### Chat Sidebar
```tsx
<ProactiveSuggestions
  context="chat"
  limit={3}
  className="w-80"
/>
```

### With Custom Handlers
```tsx
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

export function MyPage() {
  const router = useRouter();

  return (
    <ProactiveSuggestions
      context="dashboard"
      limit={5}
      onExecute={(id) => {
        toast.success('Executing suggestion...');
        // Handle navigation or action
      }}
      onDismiss={(id) => {
        toast.info('Suggestion dismissed');
      }}
    />
  );
}
```

---

## 🎨 Styling

The component is fully styled and uses the design system. You can add custom classes:

```tsx
<ProactiveSuggestions
  context="dashboard"
  limit={5}
  className="max-w-2xl mx-auto space-y-4"
/>
```

---

## 🔄 Auto-Refresh

Auto-refresh is handled in the hook. To enable it, modify the hook call directly:

```tsx
// In the component file (ProactiveSuggestions.tsx)
// Change refreshInterval from 0 to desired milliseconds
const { suggestions, ... } = useSuggestions({
  context,
  limit,
  refreshInterval: 60000, // Refresh every minute
});
```

---

## 🧪 Testing

### 1. Test with the demo page:
```tsx
import { ProactiveSuggestionsDemo } from '@/components/chat/ProactiveSuggestions.demo';

export default function TestPage() {
  return <ProactiveSuggestionsDemo />;
}
```

### 2. Check the console:
- Network requests to `/api/v1/chatbot/suggestions`
- Execution logs when clicking action buttons
- Dismissal logs when clicking dismiss

### 3. Test states:
- **Loading**: Component shows on initial load
- **Error**: Disconnect backend to see error state
- **Empty**: No suggestions returns empty state
- **Data**: Suggestions display with animations

---

## 🆘 Troubleshooting

### No suggestions appear
1. Check backend is running
2. Verify `/api/v1/chatbot/suggestions` endpoint exists
3. Check browser console for errors
4. Verify you're authenticated

### Animations not working
1. Ensure GSAP is installed: `pnpm list gsap`
2. Check console for JavaScript errors
3. Try refreshing the page

### Styling looks wrong
1. Ensure Tailwind CSS is configured
2. Check design system CSS variables are loaded
3. Clear browser cache

---

## 📚 Full Documentation

For detailed documentation, see:
- **Full README**: `PROACTIVE_SUGGESTIONS_README.md`
- **Examples**: `ProactiveSuggestions.example.tsx`
- **Demo**: `ProactiveSuggestions.demo.tsx`
- **Design System**: `agents/DESIGN_SYSTEM.md`
- **GSAP Guide**: `agents/GSAP_ANIMATIONS.md`

---

## 🎯 Props Quick Reference

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `context` | `string` | No | `undefined` | Filter context (e.g., 'dashboard') |
| `limit` | `number` | No | `5` | Max suggestions to show |
| `className` | `string` | No | `undefined` | Custom CSS classes |
| `onExecute` | `function` | No | `undefined` | Called when suggestion executed |
| `onDismiss` | `function` | No | `undefined` | Called when suggestion dismissed |

---

## ✨ Quick Tips

1. **Start simple**: Use default props first
2. **Context matters**: Set appropriate context for better suggestions
3. **Handle actions**: Implement `onExecute` to provide user feedback
4. **Test thoroughly**: Use the demo page before production
5. **Read the docs**: Check the full README for advanced features

---

**Need help?** Check the full documentation or contact the frontend team.
