# Phase 3: UI Enhancement Specification

## Overview

Transform the dashboard UI to world-class standards with proper navigation, profile management, notifications, and search functionality.

---

## Design Principles

1. **5-Second Rule**: Users find what they need within 5 seconds
2. **Progressive Disclosure**: Show only what's needed at each level
3. **Consistency**: Same patterns everywhere
4. **Performance**: Instant interactions (<100ms feedback)
5. **Accessibility**: WCAG AA compliant

---

## Header Redesign

### Current State
- Basic header with title
- No global search
- No profile icon
- Notifications in sidebar only

### Target State

```typescript
// apps/web/src/components/dashboard/header.tsx

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b bg-white/95 backdrop-blur dark:bg-slate-900/95">
      <div className="flex h-16 items-center justify-between px-6">
        {/* Left: Page Title & Breadcrumbs */}
        <div className="flex items-center gap-4">
          <Breadcrumbs />
        </div>

        {/* Center: Global Search */}
        <div className="flex-1 max-w-xl mx-8">
          <GlobalSearch />
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-4">
          <QuickActionsButton />
          <NotificationBell />
          <UserProfileDropdown />
        </div>
      </div>
    </header>
  );
}
```

---

## Global Search (Cmd+K)

### Features
- Keyboard shortcut: Cmd+K (Mac) / Ctrl+K (Windows)
- Search across: Invoices, Expenses, Clients, Documents, Employees
- Recent searches
- Quick actions: "Create invoice", "New expense", etc.
- AI-powered: "Show me unpaid invoices from last month"

### Implementation

```typescript
// apps/web/src/components/search/global-search.tsx

export function GlobalSearch() {
  const [open, setOpen] = useState(false);

  // Keyboard shortcut
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen(true);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  return (
    <>
      {/* Trigger Button */}
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 w-full px-3 py-2 text-sm text-muted-foreground bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
      >
        <SearchIcon className="h-4 w-4" />
        <span className="flex-1 text-left">Search...</span>
        <kbd className="hidden sm:inline-flex h-5 items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
          <span className="text-xs">⌘</span>K
        </kbd>
      </button>

      {/* Search Dialog */}
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Search invoices, clients, documents..." />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>

          {/* Recent Searches */}
          <CommandGroup heading="Recent">
            {recentSearches.map(search => (
              <CommandItem key={search.id} onSelect={() => handleSelect(search)}>
                <ClockIcon className="mr-2 h-4 w-4" />
                {search.query}
              </CommandItem>
            ))}
          </CommandGroup>

          {/* Quick Actions */}
          <CommandGroup heading="Quick Actions">
            <CommandItem onSelect={() => router.push('/finance/invoices/new')}>
              <PlusIcon className="mr-2 h-4 w-4" />
              Create Invoice
            </CommandItem>
            <CommandItem onSelect={() => router.push('/finance/expenses/new')}>
              <PlusIcon className="mr-2 h-4 w-4" />
              New Expense
            </CommandItem>
            <CommandItem onSelect={() => router.push('/hr/employees/new')}>
              <PlusIcon className="mr-2 h-4 w-4" />
              Add Employee
            </CommandItem>
          </CommandGroup>

          {/* Search Results */}
          {searchResults && (
            <>
              {searchResults.invoices.length > 0 && (
                <CommandGroup heading="Invoices">
                  {searchResults.invoices.map(invoice => (
                    <CommandItem key={invoice.id}>
                      <FileTextIcon className="mr-2 h-4 w-4" />
                      <span>{invoice.number}</span>
                      <span className="ml-2 text-muted-foreground">
                        {invoice.customerName} - €{invoice.total}
                      </span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}

              {searchResults.clients.length > 0 && (
                <CommandGroup heading="Clients">
                  {searchResults.clients.map(client => (
                    <CommandItem key={client.id}>
                      <UserIcon className="mr-2 h-4 w-4" />
                      <span>{client.name}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
            </>
          )}
        </CommandList>
      </CommandDialog>
    </>
  );
}
```

### Backend Search API

```typescript
// apps/api/src/search/search.controller.ts

@Controller('search')
export class SearchController {

  @Get()
  async search(
    @CurrentOrg() orgId: string,
    @Query('q') query: string,
    @Query('types') types?: string[], // ['invoices', 'clients', 'documents']
    @Query('limit') limit: number = 5
  ): Promise<SearchResults> {
    return this.searchService.search(orgId, query, types, limit);
  }

  @Get('suggestions')
  async getSuggestions(
    @CurrentOrg() orgId: string,
    @Query('q') query: string
  ): Promise<SearchSuggestion[]> {
    // AI-powered suggestions
    return this.searchService.getSuggestions(orgId, query);
  }
}
```

---

## Notification Bell & Center

### Features
- Bell icon with unread count badge
- Dropdown with scrollable notification list
- Mark as read/unread
- Filter by type
- "View All" link to full page
- Real-time updates via WebSocket

### Implementation

```typescript
// apps/web/src/components/notifications/notification-bell.tsx

export function NotificationBell() {
  const { data: notifications, unreadCount } = useNotifications();
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <BellIcon className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-[10px] font-bold text-white flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-[380px] p-0" align="end">
        <div className="flex items-center justify-between border-b p-4">
          <h4 className="font-semibold">Notifications</h4>
          <Button variant="ghost" size="sm" onClick={markAllAsRead}>
            Mark all as read
          </Button>
        </div>

        <ScrollArea className="h-[400px]">
          {notifications.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <BellOffIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No notifications</p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map(notification => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onRead={() => markAsRead(notification.id)}
                  onClick={() => {
                    setOpen(false);
                    handleNotificationClick(notification);
                  }}
                />
              ))}
            </div>
          )}
        </ScrollArea>

        <div className="border-t p-2">
          <Button variant="ghost" className="w-full" asChild>
            <Link href="/notifications">View all notifications</Link>
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
```

### Notification Item Component

```typescript
// apps/web/src/components/notifications/notification-item.tsx

export function NotificationItem({
  notification,
  onRead,
  onClick,
}: NotificationItemProps) {
  const iconMap = {
    DEADLINE: CalendarIcon,
    INVOICE: FileTextIcon,
    ANOMALY: AlertTriangleIcon,
    INSIGHT: LightbulbIcon,
    ACTION_NEEDED: CheckCircleIcon,
  };

  const Icon = iconMap[notification.type] || BellIcon;

  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full p-4 text-left hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors',
        !notification.readAt && 'bg-blue-50/50 dark:bg-blue-900/10'
      )}
    >
      <div className="flex gap-3">
        <div className={cn(
          'h-9 w-9 rounded-full flex items-center justify-center shrink-0',
          notification.priority >= 8
            ? 'bg-red-100 text-red-600'
            : 'bg-slate-100 text-slate-600'
        )}>
          <Icon className="h-4 w-4" />
        </div>

        <div className="flex-1 min-w-0">
          <p className={cn(
            'text-sm',
            !notification.readAt && 'font-medium'
          )}>
            {notification.title}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
            {notification.description}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {formatRelativeTime(notification.createdAt)}
          </p>
        </div>

        {!notification.readAt && (
          <div className="h-2 w-2 rounded-full bg-blue-500 shrink-0" />
        )}
      </div>
    </button>
  );
}
```

---

## User Profile Dropdown

### Features
- User avatar and name
- Quick links: Profile, Settings, Connected Accounts
- Theme toggle
- Language selector
- Sign out

### Implementation

```typescript
// apps/web/src/components/user/user-profile-dropdown.tsx

export function UserProfileDropdown() {
  const { data: user } = useCurrentUser();
  const { theme, setTheme } = useTheme();
  const router = useRouter();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-10 gap-2 px-2">
          <Avatar className="h-8 w-8">
            <AvatarImage src={user?.avatarUrl} alt={user?.name} />
            <AvatarFallback>
              {getInitials(user?.name)}
            </AvatarFallback>
          </Avatar>
          <span className="hidden lg:inline-block text-sm font-medium">
            {user?.firstName}
          </span>
          <ChevronDownIcon className="h-4 w-4 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent className="w-56" align="end">
        {/* User Info */}
        <div className="px-2 py-3 border-b">
          <p className="text-sm font-medium">{user?.name}</p>
          <p className="text-xs text-muted-foreground">{user?.email}</p>
        </div>

        <DropdownMenuGroup>
          <DropdownMenuItem onClick={() => router.push('/settings/profile')}>
            <UserIcon className="mr-2 h-4 w-4" />
            My Profile
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => router.push('/settings')}>
            <SettingsIcon className="mr-2 h-4 w-4" />
            Settings
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => router.push('/settings/connections')}>
            <LinkIcon className="mr-2 h-4 w-4" />
            Connected Accounts
          </DropdownMenuItem>
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        {/* Theme */}
        <DropdownMenuGroup>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <SunMoonIcon className="mr-2 h-4 w-4" />
              Theme
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <DropdownMenuItem onClick={() => setTheme('light')}>
                <SunIcon className="mr-2 h-4 w-4" />
                Light
                {theme === 'light' && <CheckIcon className="ml-auto h-4 w-4" />}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme('dark')}>
                <MoonIcon className="mr-2 h-4 w-4" />
                Dark
                {theme === 'dark' && <CheckIcon className="ml-auto h-4 w-4" />}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme('system')}>
                <LaptopIcon className="mr-2 h-4 w-4" />
                System
                {theme === 'system' && <CheckIcon className="ml-auto h-4 w-4" />}
              </DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        {/* Sign Out */}
        <DropdownMenuItem
          onClick={handleSignOut}
          className="text-red-600 focus:text-red-600"
        >
          <LogOutIcon className="mr-2 h-4 w-4" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

---

## Dashboard Overview Redesign

### Layout Structure

```typescript
// apps/web/src/app/(dashboard)/page.tsx

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* AI Insights Card - Full Width */}
      <AIInsightsCard />

      {/* Key Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Revenue"
          value="€45,230"
          change="+12.5%"
          changeType="positive"
          icon={TrendingUpIcon}
          href="/finance/invoices"
        />
        <MetricCard
          title="Expenses"
          value="€18,450"
          change="-5.2%"
          changeType="positive"
          icon={TrendingDownIcon}
          href="/finance/expenses"
        />
        <MetricCard
          title="Profit"
          value="€26,780"
          change="+18.3%"
          changeType="positive"
          icon={DollarSignIcon}
          href="/reports"
        />
        <MetricCard
          title="Outstanding"
          value="€8,940"
          change="4 invoices"
          changeType="neutral"
          icon={ClockIcon}
          href="/finance/invoices?status=overdue"
        />
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Activity & Upcoming */}
        <div className="lg:col-span-2 space-y-6">
          <RecentActivityCard />
          <UpcomingDeadlinesCard />
        </div>

        {/* Right: Quick Actions & Cash Flow */}
        <div className="space-y-6">
          <QuickActionsCard />
          <CashFlowMiniChart />
        </div>
      </div>
    </div>
  );
}
```

### Metric Card Component

```typescript
// apps/web/src/components/dashboard/metric-card.tsx

interface MetricCardProps {
  title: string;
  value: string;
  change: string;
  changeType: 'positive' | 'negative' | 'neutral';
  icon: React.ComponentType<{ className?: string }>;
  href: string;
}

export function MetricCard({
  title,
  value,
  change,
  changeType,
  icon: Icon,
  href,
}: MetricCardProps) {
  return (
    <Link href={href}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">{title}</p>
              <p className="text-2xl font-bold mt-1">{value}</p>
              <p className={cn(
                'text-xs mt-1',
                changeType === 'positive' && 'text-green-600',
                changeType === 'negative' && 'text-red-600',
                changeType === 'neutral' && 'text-muted-foreground'
              )}>
                {change}
              </p>
            </div>
            <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <Icon className="h-6 w-6 text-primary" />
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
```

---

## Mobile Considerations

### No Hamburger Menu Needed

Based on research, the current bottom navigation approach is correct for mobile:
- Bottom navigation for primary actions (Home, Finance, HR, Tax, More)
- "More" expands to full menu
- Profile accessible from header

### Enhancements

```typescript
// apps/web/src/components/dashboard/mobile-nav.tsx

export function MobileNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-slate-900 border-t lg:hidden">
      <div className="flex items-center justify-around h-16">
        <NavButton href="/" icon={HomeIcon} label="Home" />
        <NavButton href="/finance" icon={CreditCardIcon} label="Finance" />
        <NavButton href="/hr" icon={UsersIcon} label="HR" />
        <NavButton href="/tax" icon={CalculatorIcon} label="Tax" />
        <MoreMenu />
      </div>
    </nav>
  );
}

function MoreMenu() {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <button className="flex flex-col items-center gap-1 p-2">
          <MoreHorizontalIcon className="h-5 w-5" />
          <span className="text-xs">More</span>
        </button>
      </SheetTrigger>
      <SheetContent side="bottom" className="h-[70vh]">
        <nav className="grid grid-cols-3 gap-4 p-4">
          <NavTile href="/documents" icon={FileTextIcon} label="Documents" />
          <NavTile href="/reports" icon={BarChartIcon} label="Reports" />
          <NavTile href="/settings" icon={SettingsIcon} label="Settings" />
          <NavTile href="/help" icon={HelpCircleIcon} label="Help" />
        </nav>
      </SheetContent>
    </Sheet>
  );
}
```

---

## Color System

### Keep Current (Slate-based)

The current color system is professional and works well:

```css
/* Light Mode */
--background: slate-50
--foreground: slate-900
--card: white
--card-foreground: slate-900
--primary: slate-900
--primary-foreground: white
--muted: slate-100
--muted-foreground: slate-500

/* Dark Mode */
--background: slate-950
--foreground: white
--card: slate-900
--card-foreground: white
--primary: slate-50
--primary-foreground: slate-900
--muted: slate-800
--muted-foreground: slate-400
```

### Accent Colors for Status

```css
/* Success/Positive */
--success: emerald-500
--success-light: emerald-50

/* Warning */
--warning: amber-500
--warning-light: amber-50

/* Error/Negative */
--error: red-500
--error-light: red-50

/* Info */
--info: blue-500
--info-light: blue-50
```

---

## Animation Guidelines

### Micro-interactions

```typescript
// Consistent animation config
const animations = {
  // Quick feedback
  buttonPress: 'active:scale-95 transition-transform duration-75',

  // Hover states
  hoverLift: 'hover:shadow-md hover:-translate-y-0.5 transition-all duration-200',

  // Appearance
  fadeIn: 'animate-in fade-in duration-200',
  slideIn: 'animate-in slide-in-from-bottom-4 duration-300',

  // Loading
  pulse: 'animate-pulse',
  spin: 'animate-spin',
};
```

### Page Transitions

Keep it minimal - content should feel instant:

```typescript
// Layout wrapper for page transitions
export function PageTransition({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
    >
      {children}
    </motion.div>
  );
}
```

---

## Success Criteria

- [ ] Global search responds in < 100ms
- [ ] Notification badge updates in real-time
- [ ] Profile dropdown is accessible from every page
- [ ] Mobile navigation feels native
- [ ] Dashboard loads in < 1 second
- [ ] All interactions have immediate feedback
- [ ] Dark mode works consistently
- [ ] Keyboard navigation works throughout
