/**
 * Gets a color for a metric badge based on its value
 */
export function getColorForMetric(metric: string, value: number): string {
  switch (metric) {
    case 'tps':
      if (value >= 19.0) return 'brightgreen';
      if (value >= 15.0) return 'yellow';
      if (value >= 10.0) return 'orange';
      return 'red';

    case 'players':
      // Could be based on max_players ratio if needed
      return 'blue';

    default:
      return 'informational';
  }
}

/**
 * Color scheme definitions
 */
export const colors = {
  online: 'brightgreen',
  offline: 'red',
  maintenance: 'yellow',
  error: 'critical',
  info: 'informational',
} as const;
