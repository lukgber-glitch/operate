/**
 * QuickActionsGrid Test Suite
 *
 * @jest-environment jsdom
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { QuickActionsGrid } from '../QuickActionsGrid'
import { QuickActionCard } from '../QuickActionCard'
import { useQuickActions } from '@/hooks/useQuickActions'
import { FileText } from 'lucide-react'

// Mock the useQuickActions hook
jest.mock('@/hooks/useQuickActions')
const mockUseQuickActions = useQuickActions as jest.MockedFunction<typeof useQuickActions>

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}))

describe('QuickActionCard', () => {
  it('renders with basic props', () => {
    const handleClick = jest.fn()

    render(
      <QuickActionCard
        icon={FileText}
        title="Test Action"
        onClick={handleClick}
      />
    )

    expect(screen.getByText('Test Action')).toBeInTheDocument()
  })

  it('renders subtitle when provided', () => {
    const handleClick = jest.fn()

    render(
      <QuickActionCard
        icon={FileText}
        title="Test Action"
        subtitle="Test subtitle"
        onClick={handleClick}
      />
    )

    expect(screen.getByText('Test subtitle')).toBeInTheDocument()
  })

  it('renders count badge when count is provided', () => {
    const handleClick = jest.fn()

    render(
      <QuickActionCard
        icon={FileText}
        title="Test Action"
        count={5}
        onClick={handleClick}
      />
    )

    expect(screen.getByText('5')).toBeInTheDocument()
  })

  it('shows 99+ for counts over 99', () => {
    const handleClick = jest.fn()

    render(
      <QuickActionCard
        icon={FileText}
        title="Test Action"
        count={150}
        onClick={handleClick}
      />
    )

    expect(screen.getByText('99+')).toBeInTheDocument()
  })

  it('calls onClick when clicked', () => {
    const handleClick = jest.fn()

    render(
      <QuickActionCard
        icon={FileText}
        title="Test Action"
        onClick={handleClick}
      />
    )

    fireEvent.click(screen.getByText('Test Action').closest('div')!)
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('does not call onClick when disabled', () => {
    const handleClick = jest.fn()

    render(
      <QuickActionCard
        icon={FileText}
        title="Test Action"
        onClick={handleClick}
        disabled={true}
      />
    )

    fireEvent.click(screen.getByText('Test Action').closest('div')!)
    expect(handleClick).not.toHaveBeenCalled()
  })

  it('applies correct variant styles', () => {
    const handleClick = jest.fn()

    const { rerender } = render(
      <QuickActionCard
        icon={FileText}
        title="Test Action"
        onClick={handleClick}
        variant="primary"
      />
    )

    const card = screen.getByText('Test Action').closest('div')
    expect(card).toHaveClass('hover:border-blue-300')

    rerender(
      <QuickActionCard
        icon={FileText}
        title="Test Action"
        onClick={handleClick}
        variant="success"
      />
    )

    expect(card).toHaveClass('hover:border-green-300')
  })
})

describe('QuickActionsGrid', () => {
  const mockActions = [
    {
      id: 'action-1',
      icon: FileText,
      title: 'Action 1',
      subtitle: 'Subtitle 1',
      variant: 'primary' as const,
      action: jest.fn(),
      visible: true,
      order: 1,
      category: 'finance' as const,
    },
    {
      id: 'action-2',
      icon: FileText,
      title: 'Action 2',
      subtitle: 'Subtitle 2',
      variant: 'default' as const,
      action: jest.fn(),
      visible: true,
      order: 2,
      category: 'clients' as const,
    },
  ]

  beforeEach(() => {
    mockUseQuickActions.mockReturnValue({
      actions: mockActions,
      isLoading: false,
      executeAction: jest.fn(),
      toggleActionVisibility: jest.fn(),
      reorderActions: jest.fn(),
      refreshActions: jest.fn(),
    })

    // Mock localStorage
    Storage.prototype.getItem = jest.fn(() => null)
    Storage.prototype.setItem = jest.fn()
  })

  it('renders the grid with actions', () => {
    render(<QuickActionsGrid />)

    expect(screen.getByText('Action 1')).toBeInTheDocument()
    expect(screen.getByText('Action 2')).toBeInTheDocument()
  })

  it('shows loading state', () => {
    mockUseQuickActions.mockReturnValue({
      actions: [],
      isLoading: true,
      executeAction: jest.fn(),
      toggleActionVisibility: jest.fn(),
      reorderActions: jest.fn(),
      refreshActions: jest.fn(),
    })

    render(<QuickActionsGrid />)

    // Should show skeleton loaders
    const skeletons = document.querySelectorAll('.animate-pulse')
    expect(skeletons.length).toBeGreaterThan(0)
  })

  it('shows empty state when no actions', () => {
    mockUseQuickActions.mockReturnValue({
      actions: [],
      isLoading: false,
      executeAction: jest.fn(),
      toggleActionVisibility: jest.fn(),
      reorderActions: jest.fn(),
      refreshActions: jest.fn(),
    })

    render(<QuickActionsGrid />)

    expect(screen.getByText('No quick actions configured')).toBeInTheDocument()
  })

  it('respects maxVisible limit', () => {
    const manyActions = Array.from({ length: 10 }, (_, i) => ({
      ...mockActions[0],
      id: `action-${i}`,
      title: `Action ${i}`,
      order: i,
    }))

    mockUseQuickActions.mockReturnValue({
      actions: manyActions,
      isLoading: false,
      executeAction: jest.fn(),
      toggleActionVisibility: jest.fn(),
      reorderActions: jest.fn(),
      refreshActions: jest.fn(),
    })

    render(<QuickActionsGrid maxVisible={4} />)

    // Should only show 4 actions
    const cards = document.querySelectorAll('[class*="grid"] > div')
    expect(cards.length).toBe(4)
  })

  it('opens settings dialog when customize button clicked', async () => {
    render(<QuickActionsGrid />)

    const customizeButton = screen.getByText('Customize')
    fireEvent.click(customizeButton)

    await waitFor(() => {
      expect(screen.getByText('Customize Quick Actions')).toBeInTheDocument()
    })
  })

  it('hides settings button when showSettings is false', () => {
    render(<QuickActionsGrid showSettings={false} />)

    expect(screen.queryByText('Customize')).not.toBeInTheDocument()
  })

  it('displays custom title', () => {
    render(<QuickActionsGrid title="My Custom Actions" />)

    expect(screen.getByText('My Custom Actions')).toBeInTheDocument()
  })

  it('executes action when card clicked', () => {
    const mockExecuteAction = jest.fn()

    mockUseQuickActions.mockReturnValue({
      actions: mockActions,
      isLoading: false,
      executeAction: mockExecuteAction,
      toggleActionVisibility: jest.fn(),
      reorderActions: jest.fn(),
      refreshActions: jest.fn(),
    })

    render(<QuickActionsGrid />)

    fireEvent.click(screen.getByText('Action 1').closest('div')!)

    expect(mockExecuteAction).toHaveBeenCalledWith('action-1')
  })
})

describe('useQuickActions hook', () => {
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks()

    // Mock localStorage
    Storage.prototype.getItem = jest.fn(() => null)
    Storage.prototype.setItem = jest.fn()
  })

  it('returns default actions', () => {
    // Remove mock to test real implementation
    jest.unmock('@/hooks/useQuickActions')

    // Import real hook (this will re-import)
    const { useQuickActions: realUseQuickActions } = require('@/hooks/useQuickActions')

    const { result } = renderHook(() => realUseQuickActions())

    expect(result.current.actions).toBeDefined()
    expect(Array.isArray(result.current.actions)).toBe(true)
  })

  it('filters out hidden actions', () => {
    jest.unmock('@/hooks/useQuickActions')
    const { useQuickActions: realUseQuickActions } = require('@/hooks/useQuickActions')

    const { result } = renderHook(() => realUseQuickActions())

    // All returned actions should have visible: true
    result.current.actions.forEach((action: any) => {
      expect(action.visible).toBe(true)
    })
  })

  it('sorts actions by order', () => {
    jest.unmock('@/hooks/useQuickActions')
    const { useQuickActions: realUseQuickActions } = require('@/hooks/useQuickActions')

    const { result } = renderHook(() => realUseQuickActions())

    const orders = result.current.actions.map((a: any) => a.order)

    // Check if sorted
    for (let i = 1; i < orders.length; i++) {
      expect(orders[i]).toBeGreaterThanOrEqual(orders[i - 1])
    }
  })
})

// Helper function for hook testing
function renderHook<T>(hook: () => T) {
  const result = { current: null as T | null }

  function TestComponent() {
    result.current = hook()
    return null
  }

  render(<TestComponent />)

  return { result: result as { current: T } }
}
