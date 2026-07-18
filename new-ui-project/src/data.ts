/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export const mockMetrics = [
  {
    id: 'm1',
    title: 'Gross Global Assets',
    value: '₹1,42,48,590.00',
    change: '+14.2%',
    isPositive: true,
    trendData: [120, 128, 131, 135, 138, 141, 142.4]
  },
  {
    id: 'm2',
    title: 'Net Operational Revenue',
    value: '₹38,92,440.00',
    change: '+8.4%',
    isPositive: true,
    trendData: [320, 340, 350, 362, 370, 381, 389.2]
  },
  {
    id: 'm3',
    title: 'Automated Daily Clearance',
    value: '99.98%',
    change: '+0.03%',
    isPositive: true,
    trendData: [99.91, 99.93, 99.95, 99.94, 99.97, 99.96, 99.98]
  },
  {
    id: 'm4',
    title: 'Active Vault Reserves',
    value: '₹51,00,000.00',
    change: '-1.5%',
    isPositive: false,
    trendData: [520, 518, 515, 516, 512, 508, 510]
  }
];

export const chartRevenueData = [
  { name: 'Jan', revenue: 2.1, expenses: 1.5, volume: 150 },
  { name: 'Feb', revenue: 2.4, expenses: 1.6, volume: 180 },
  { name: 'Mar', revenue: 2.8, expenses: 1.8, volume: 210 },
  { name: 'Apr', revenue: 3.1, expenses: 1.7, volume: 220 },
  { name: 'May', revenue: 3.5, expenses: 2.0, volume: 270 },
  { name: 'Jun', revenue: 3.8, expenses: 2.1, volume: 310 },
  { name: 'Jul', revenue: 4.2, expenses: 2.2, volume: 340 }
];

export const chartCategoryData = [
  { name: 'ACH Transfers', value: 4500000, color: '#8b5cf6' },
  { name: 'Card Payments', value: 2100000, color: '#a78bfa' },
  { name: 'SWIFT Inflows', value: 6200000, color: '#ec4899' },
  { name: 'Voucher Clearances', value: 1448590, color: '#f472b6' }
];
