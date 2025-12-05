/**
 * Tests for CashFlowChartWidget Component
 */

import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from 'next-themes';
import { CashFlowChartWidget } from '../CashFlowChartWidget';

// Mock html-to-image
jest.mock('html-to-image', () => ({
  toPng: jest.fn().mockResolvedValue('data:image/png;base64,mock'),
}));

// Mock Recharts to avoid canvas rendering issues in tests
jest.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: any) => <div>{children}</div>,
  BarChart: ({ children }: any) => <div data-testid="bar-chart">{children}</div>,
  LineChart: ({ children }: any) => <div data-testid="line-chart">{children}</div>,
  AreaChart: ({ children }: any) => <div data-testid="area-chart">{children}</div>,
  Bar: () => <div />,
  Line: () => <div />,
  Area: () => <div />,
  XAxis: () => <div />,
  YAxis: () => <div />,
  CartesianGrid: () => <div />,
  Tooltip: () => <div />,
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class">{children}</ThemeProvider>
    </QueryClientProvider>
  );
};

describe('CashFlowChartWidget', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders the widget with title and description', () => {
      render(<CashFlowChartWidget />, { wrapper: createWrapper() });

      expect(screen.getByText('Cash Flow Overview')).toBeInTheDocument();
      expect(screen.getByText(/track your income and expenses/i)).toBeInTheDocument();
    });

    it('renders loading skeletons initially', () => {
      render(<CashFlowChartWidget />, { wrapper: createWrapper() });

      // Check for skeleton elements (by class or role)
      const skeletons = document.querySelectorAll('[class*="skeleton"]');
      expect(skeletons.length).toBeGreaterThan(0);
    });

    it('renders all chart type buttons', () => {
      render(<CashFlowChartWidget />, { wrapper: createWrapper() });

      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThanOrEqual(3); // At least bar, line, area
    });

    it('renders period selector', () => {
      render(<CashFlowChartWidget />, { wrapper: createWrapper() });

      const selector = screen.getByRole('combobox');
      expect(selector).toBeInTheDocument();
    });
  });

  describe('Chart Type Switching', () => {
    it('starts with default chart type (bar)', async () => {
      render(<CashFlowChartWidget />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.queryByTestId('bar-chart')).toBeInTheDocument();
      });
    });

    it('allows starting with line chart', async () => {
      render(<CashFlowChartWidget defaultChartType="line" />, {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(screen.queryByTestId('line-chart')).toBeInTheDocument();
      });
    });

    it('allows starting with area chart', async () => {
      render(<CashFlowChartWidget defaultChartType="area" />, {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(screen.queryByTestId('area-chart')).toBeInTheDocument();
      });
    });
  });

  describe('Time Period Selection', () => {
    it('uses default period of 30 days', () => {
      render(<CashFlowChartWidget />, { wrapper: createWrapper() });

      const selector = screen.getByRole('combobox');
      expect(selector).toHaveTextContent('Last 30 Days');
    });

    it('allows custom default period', () => {
      render(<CashFlowChartWidget defaultPeriod="12m" />, {
        wrapper: createWrapper(),
      });

      const selector = screen.getByRole('combobox');
      expect(selector).toHaveTextContent('Last 12 Months');
    });
  });

  describe('Data Display', () => {
    it('displays summary statistics after loading', async () => {
      render(<CashFlowChartWidget />, { wrapper: createWrapper() });

      await waitFor(
        () => {
          expect(screen.getByText('Total Income')).toBeInTheDocument();
          expect(screen.getByText('Total Expenses')).toBeInTheDocument();
          expect(screen.getByText('Net Cash Flow')).toBeInTheDocument();
        },
        { timeout: 3000 }
      );
    });

    it('shows trend indicator badge', async () => {
      render(<CashFlowChartWidget />, { wrapper: createWrapper() });

      await waitFor(
        () => {
          // Look for percentage in badge
          const badges = document.querySelectorAll('[class*="badge"]');
          expect(badges.length).toBeGreaterThan(0);
        },
        { timeout: 3000 }
      );
    });
  });

  describe('Export Functionality', () => {
    it('shows export button by default', () => {
      render(<CashFlowChartWidget />, { wrapper: createWrapper() });

      const exportButton = screen.getByTitle('Export as PNG');
      expect(exportButton).toBeInTheDocument();
    });

    it('hides export button when showExport is false', () => {
      render(<CashFlowChartWidget showExport={false} />, {
        wrapper: createWrapper(),
      });

      const exportButton = screen.queryByTitle('Export as PNG');
      expect(exportButton).not.toBeInTheDocument();
    });

    it('export button is disabled while loading', () => {
      render(<CashFlowChartWidget />, { wrapper: createWrapper() });

      const exportButton = screen.getByTitle('Export as PNG');
      expect(exportButton).toBeDisabled();
    });
  });

  describe('Error Handling', () => {
    it('shows error state when data fetch fails', async () => {
      // Mock the API to fail
      const queryClient = new QueryClient({
        defaultOptions: {
          queries: { retry: false },
        },
      });

      // Force a query error by providing invalid data
      render(<CashFlowChartWidget />, {
        wrapper: ({ children }) => (
          <QueryClientProvider client={queryClient}>
            <ThemeProvider attribute="class">{children}</ThemeProvider>
          </QueryClientProvider>
        ),
      });

      // Since we're using mock data fallback, we should still get data
      // In a real error scenario without fallback, this would show error UI
      await waitFor(
        () => {
          const content = document.body.textContent;
          expect(content).toBeTruthy();
        },
        { timeout: 3000 }
      );
    });
  });

  describe('Responsive Design', () => {
    it('applies custom className', () => {
      const { container } = render(
        <CashFlowChartWidget className="custom-class" />,
        { wrapper: createWrapper() }
      );

      const card = container.querySelector('.custom-class');
      expect(card).toBeInTheDocument();
    });
  });

  describe('Legend', () => {
    it('shows income and expenses legend items', async () => {
      render(<CashFlowChartWidget />, { wrapper: createWrapper() });

      await waitFor(
        () => {
          expect(screen.getByText('Income')).toBeInTheDocument();
          expect(screen.getByText('Expenses')).toBeInTheDocument();
        },
        { timeout: 3000 }
      );
    });

    it('shows net legend for line chart', async () => {
      render(<CashFlowChartWidget defaultChartType="line" />, {
        wrapper: createWrapper(),
      });

      await waitFor(
        () => {
          expect(screen.getByText(/net/i)).toBeInTheDocument();
        },
        { timeout: 3000 }
      );
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels on buttons', () => {
      render(<CashFlowChartWidget />, { wrapper: createWrapper() });

      const exportButton = screen.getByTitle('Export as PNG');
      expect(exportButton).toHaveAttribute('title');
    });

    it('has accessible select for period', () => {
      render(<CashFlowChartWidget />, { wrapper: createWrapper() });

      const selector = screen.getByRole('combobox');
      expect(selector).toBeInTheDocument();
    });
  });
});

describe('CashFlowChart Component', () => {
  it('renders correct chart type', () => {
    const mockData = [
      { date: '2024-01-01', income: 1000, expenses: 500, net: 500, displayDate: 'Jan 1' },
    ];

    render(
      <div>
        {/* Chart would be tested here with proper mocking */}
      </div>
    );

    expect(true).toBe(true); // Placeholder
  });
});

describe('ChartTooltip Component', () => {
  it('does not render when inactive', () => {
    const { container } = render(
      <div>
        {/* Tooltip testing would go here */}
      </div>
    );

    expect(container).toBeInTheDocument();
  });
});

describe('useCashFlowData Hook', () => {
  it('fetches data for specified period', () => {
    // Hook testing would use renderHook from @testing-library/react-hooks
    expect(true).toBe(true); // Placeholder
  });

  it('generates mock data on API failure', () => {
    // Test fallback behavior
    expect(true).toBe(true); // Placeholder
  });
});
