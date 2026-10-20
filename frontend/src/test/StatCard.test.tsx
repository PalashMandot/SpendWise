import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { StatCard } from '../components/dashboard/StatCard';
import { TrendingUp } from 'lucide-react';

describe('StatCard Component', () => {
  it('renders title, value, and subtitle accurately', () => {
    render(
      <StatCard
        title="Total Inflows"
        value="$5,450.00"
        subtitle="monthly earnings"
        icon={<TrendingUp data-testid="trend-icon" />}
        accentColor="emerald"
        trend={{ value: '25%', isPositive: true }}
      />
    );

    expect(screen.getByText('Total Inflows')).toBeInTheDocument();
    expect(screen.getByText('$5,450.00')).toBeInTheDocument();
    expect(screen.getByText('monthly earnings')).toBeInTheDocument();
    expect(screen.getByText('25%')).toBeInTheDocument();
  });
});
