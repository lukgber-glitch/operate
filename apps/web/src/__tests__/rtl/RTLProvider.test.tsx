/**
 * RTL Provider Tests
 *
 * Tests for RTL detection and direction management
 */

import { render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { RTLProvider, useIsRTL, useDirection, ForceLTR, ForceRTL } from '@/components/providers/RTLProvider';

// Mock useLocale hook
jest.mock('next-intl', () => ({
  ...jest.requireActual('next-intl'),
  useLocale: jest.fn(),
}));

const { useLocale } = require('next-intl');

describe('RTLProvider', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should apply RTL direction for Arabic locale', () => {
    useLocale.mockReturnValue('ar');

    render(
      <RTLProvider>
        <div>Test Content</div>
      </RTLProvider>
    );

    expect(document.documentElement.dir).toBe('rtl');
    expect(document.documentElement.lang).toBe('ar');
    expect(document.body.classList.contains('rtl')).toBe(true);
  });

  it('should apply LTR direction for English locale', () => {
    useLocale.mockReturnValue('en');

    render(
      <RTLProvider>
        <div>Test Content</div>
      </RTLProvider>
    );

    expect(document.documentElement.dir).toBe('ltr');
    expect(document.documentElement.lang).toBe('en');
    expect(document.body.classList.contains('ltr')).toBe(true);
  });

  it('should update direction when locale changes', () => {
    useLocale.mockReturnValue('en');

    const { rerender } = render(
      <RTLProvider>
        <div>Test Content</div>
      </RTLProvider>
    );

    expect(document.documentElement.dir).toBe('ltr');

    useLocale.mockReturnValue('ar');

    rerender(
      <RTLProvider>
        <div>Test Content</div>
      </RTLProvider>
    );

    expect(document.documentElement.dir).toBe('rtl');
  });
});

describe('useIsRTL hook', () => {
  function TestComponent() {
    const isRTL = useIsRTL();
    return <div>{isRTL ? 'RTL' : 'LTR'}</div>;
  }

  it('should return true for Arabic locale', () => {
    useLocale.mockReturnValue('ar');

    render(<TestComponent />);

    expect(screen.getByText('RTL')).toBeInTheDocument();
  });

  it('should return false for English locale', () => {
    useLocale.mockReturnValue('en');

    render(<TestComponent />);

    expect(screen.getByText('LTR')).toBeInTheDocument();
  });

  it('should return true for Hebrew locale', () => {
    useLocale.mockReturnValue('he');

    render(<TestComponent />);

    expect(screen.getByText('RTL')).toBeInTheDocument();
  });
});

describe('useDirection hook', () => {
  function TestComponent() {
    const { isRTL, dir, start, end } = useDirection();
    return (
      <div>
        <div data-testid="isRTL">{isRTL.toString()}</div>
        <div data-testid="dir">{dir}</div>
        <div data-testid="start">{start}</div>
        <div data-testid="end">{end}</div>
      </div>
    );
  }

  it('should return correct values for RTL locale', () => {
    useLocale.mockReturnValue('ar');

    render(<TestComponent />);

    expect(screen.getByTestId('isRTL')).toHaveTextContent('true');
    expect(screen.getByTestId('dir')).toHaveTextContent('rtl');
    expect(screen.getByTestId('start')).toHaveTextContent('right');
    expect(screen.getByTestId('end')).toHaveTextContent('left');
  });

  it('should return correct values for LTR locale', () => {
    useLocale.mockReturnValue('en');

    render(<TestComponent />);

    expect(screen.getByTestId('isRTL')).toHaveTextContent('false');
    expect(screen.getByTestId('dir')).toHaveTextContent('ltr');
    expect(screen.getByTestId('start')).toHaveTextContent('left');
    expect(screen.getByTestId('end')).toHaveTextContent('right');
  });

  it('should provide getDirValue utility', () => {
    useLocale.mockReturnValue('ar');

    function TestWithGetDirValue() {
      const { getDirValue } = useDirection();
      const value = getDirValue('left', 'right');
      return <div data-testid="value">{value}</div>;
    }

    render(<TestWithGetDirValue />);

    expect(screen.getByTestId('value')).toHaveTextContent('right');
  });
});

describe('ForceLTR component', () => {
  it('should force LTR direction', () => {
    useLocale.mockReturnValue('ar');

    render(
      <ForceLTR>
        <span>test@example.com</span>
      </ForceLTR>
    );

    const element = screen.getByText('test@example.com').parentElement;
    expect(element).toHaveAttribute('dir', 'ltr');
    expect(element).toHaveClass('force-ltr');
  });

  it('should accept custom className', () => {
    useLocale.mockReturnValue('ar');

    render(
      <ForceLTR className="custom-class">
        <span>Content</span>
      </ForceLTR>
    );

    const element = screen.getByText('Content').parentElement;
    expect(element).toHaveClass('force-ltr', 'custom-class');
  });
});

describe('ForceRTL component', () => {
  it('should force RTL direction', () => {
    useLocale.mockReturnValue('en');

    render(
      <ForceRTL>
        <span>مرحباً</span>
      </ForceRTL>
    );

    const element = screen.getByText('مرحباً').parentElement;
    expect(element).toHaveAttribute('dir', 'rtl');
    expect(element).toHaveClass('force-rtl');
  });

  it('should accept custom className', () => {
    useLocale.mockReturnValue('en');

    render(
      <ForceRTL className="custom-class">
        <span>Content</span>
      </ForceRTL>
    );

    const element = screen.getByText('Content').parentElement;
    expect(element).toHaveClass('force-rtl', 'custom-class');
  });
});
