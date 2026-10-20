import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';

describe('Common Components', () => {
  it('renders Badge with text and dot', () => {
    render(<Badge variant="emerald" dot>Healthy</Badge>);
    expect(screen.getByText('Healthy')).toBeInTheDocument();
  });

  it('renders Button and triggers click event', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Submit Transaction</Button>);

    const btn = screen.getByText('Submit Transaction');
    expect(btn).toBeInTheDocument();
    fireEvent.click(btn);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('disables Button when isLoading is true', () => {
    render(<Button isLoading>Processing</Button>);
    const btn = screen.getByRole('button');
    expect(btn).toBeDisabled();
  });
});
