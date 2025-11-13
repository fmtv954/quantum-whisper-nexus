/**
 * Metric Card Component
 * 
 * SpaceX Mission Control inspired metric display card.
 * Used for dashboard KPIs, analytics, and system health indicators.
 * 
 * Features:
 * - Holographic glow effect
 * - Trend indicators
 * - Optional status indicators (green/yellow/red)
 * - Responsive sizing
 * 
 * Usage:
 * ```tsx
 * <MetricCard
 *   label="Active Calls"
 *   value="12"
 *   trend={{ value: 23, isPositive: true }}
 *   status="success"
 *   icon={<Phone className="h-5 w-5" />}
 * />
 * ```
 */

import { ReactNode } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';

export interface MetricCardProps {
  label: string;
  value: string | number;
  icon?: ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  status?: 'success' | 'warning' | 'error';
  subtitle?: string;
  className?: string;
  onClick?: () => void;
}

export function MetricCard({
  label,
  value,
  icon,
  trend,
  status,
  subtitle,
  className,
  onClick,
}: MetricCardProps) {
  const statusColors = {
    success: 'border-secondary',
    warning: 'border-accent',
    error: 'border-destructive',
  };

  const statusGlows = {
    success: 'glow-green',
    warning: 'glow-purple',
    error: 'shadow-[0_0_20px_rgba(255,0,128,0.3)]',
  };

  return (
    <Card
      className={cn(
        'group relative overflow-hidden transition-all hover:scale-[1.02]',
        status && statusColors[status],
        status && statusGlows[status],
        onClick && 'cursor-pointer',
        className
      )}
      onClick={onClick}
    >
      {/* Cyber Grid Background */}
      <div className="absolute inset-0 cyber-grid opacity-5" />
      
      <CardContent className="p-6 relative">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              {label}
            </p>
            <div className="flex items-baseline gap-2">
              <p className="text-3xl font-bold tabular-nums tracking-tight">
                {value}
              </p>
              {trend && (
                <span
                  className={cn(
                    'inline-flex items-center gap-1 text-sm font-medium',
                    trend.isPositive ? 'text-secondary' : 'text-destructive'
                  )}
                >
                  {trend.isPositive ? (
                    <TrendingUp className="h-4 w-4" />
                  ) : (
                    <TrendingDown className="h-4 w-4" />
                  )}
                  {Math.abs(trend.value)}%
                </span>
              )}
            </div>
            {subtitle && (
              <p className="text-xs text-muted-foreground">{subtitle}</p>
            )}
          </div>

          {icon && (
            <div
              className={cn(
                'rounded-lg p-3 transition-colors',
                status === 'success' && 'bg-secondary/10 text-secondary',
                status === 'warning' && 'bg-accent/10 text-accent',
                status === 'error' && 'bg-destructive/10 text-destructive',
                !status && 'bg-primary/10 text-primary'
              )}
            >
              {icon}
            </div>
          )}
        </div>

        {/* Hover Effect */}
        <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      </CardContent>
    </Card>
  );
}
