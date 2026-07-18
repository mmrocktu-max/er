/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ActiveTab, MetricCardData, Transaction, InventoryItem, WorkflowNode, WorkflowEdge } from './types';

export const navigationTabs = [
  ActiveTab.Finance,
  ActiveTab.Dashboard,
  ActiveTab.Workflow,
  ActiveTab.Inventory,
  ActiveTab.Ledger
];

export const mockMetrics: MetricCardData[] = [
  {
    id: 'm1',
    title: 'Gross Global Assets',
    value: '$14,248,590.00',
    change: '+14.2%',
    isPositive: true,
    trendData: [120, 128, 131, 135, 138, 141, 142.4]
  },
  {
    id: 'm2',
    title: 'Net Operational Revenue',
    value: '$3,892,440.00',
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
    value: '$5,100,000.00',
    change: '-1.5%',
    isPositive: false,
    trendData: [520, 518, 515, 516, 512, 508, 510]
  }
];

export const mockTransactions: Transaction[] = [
  {
    id: 'TX-9021',
    date: '2026-07-13',
    description: 'Cloud Infrastructure Automatic Clearance',
    category: 'Expense',
    amount: 14850.00,
    status: 'Completed',
    reference: 'REF-883912'
  },
  {
    id: 'TX-9022',
    date: '2026-07-13',
    description: 'Inflow Clearance - EMEA Branch Accounts',
    category: 'Revenue',
    amount: 1250000.00,
    status: 'Completed',
    reference: 'REF-291039'
  },
  {
    id: 'TX-9023',
    date: '2026-07-12',
    description: 'Hardware Asset Lease Renewal - New York HQ',
    category: 'Expense',
    amount: 4500.00,
    status: 'Completed',
    reference: 'REF-492019'
  },
  {
    id: 'TX-9024',
    date: '2026-07-12',
    description: 'Global Licensing Fee Settlement',
    category: 'Transfer',
    amount: 89000.00,
    status: 'Pending',
    reference: 'REF-772910'
  },
  {
    id: 'TX-9025',
    date: '2026-07-11',
    description: 'Compliance Internal Ledger Sync',
    category: 'Audit',
    amount: 0.00,
    status: 'Completed',
    reference: 'REF-110293'
  },
  {
    id: 'TX-9026',
    date: '2026-07-11',
    description: 'Inter-vault Liquidity Placement',
    category: 'Transfer',
    amount: 500000.00,
    status: 'Completed',
    reference: 'REF-662910'
  },
  {
    id: 'TX-9027',
    date: '2026-07-10',
    description: 'Failed Client Deposit Retry - Asia Branch',
    category: 'Revenue',
    amount: 15400.00,
    status: 'Failed',
    reference: 'REF-881920'
  }
];

export const mockInventory: InventoryItem[] = [
  {
    id: 'SKU-99',
    name: 'Hardware HSM Vault Unit (Apex v4)',
    branch: 'London Branch (branch_123)',
    category: 'Hardware',
    serialNumber: 'SN-HSM-99120',
    value: 45000.00,
    status: 'Active',
    lastChecked: '2026-07-10'
  },
  {
    id: 'INV-002',
    name: 'Enterprise SWIFT Gateway License',
    branch: 'London Branch',
    category: 'License',
    serialNumber: 'LIC-SWFT-2026',
    value: 120000.00,
    status: 'Active',
    lastChecked: '2026-06-15'
  },
  {
    id: 'INV-003',
    name: 'Disaster Recovery Server Racks',
    branch: 'New Jersey Depot',
    category: 'Hardware',
    serialNumber: 'SN-SVR-33921',
    value: 85000.00,
    status: 'Under Maintenance',
    lastChecked: '2026-07-12'
  },
  {
    id: 'INV-004',
    name: 'Federal Audit Certification Documents',
    branch: 'Washington Office',
    category: 'Document',
    serialNumber: 'DOC-FED-AUD-25',
    value: 0.00,
    status: 'Active',
    lastChecked: '2026-07-01'
  },
  {
    id: 'INV-005',
    name: 'Secure Biometric Enclosure Terminal',
    branch: 'Tokyo Branch',
    category: 'Hardware',
    serialNumber: 'SN-BIO-88291',
    value: 28000.00,
    status: 'In Storage',
    lastChecked: '2026-05-18'
  },
  {
    id: 'INV-006',
    name: 'Cold Storage Ledger Vault (Hardware)',
    branch: 'London Branch',
    category: 'Hardware',
    serialNumber: 'SN-CLD-3001',
    value: 15000.00,
    status: 'Active',
    lastChecked: '2026-07-11'
  }
];

export const mockWorkflowNodes: WorkflowNode[] = [
  {
    id: 'procurement',
    label: 'Procurement Agent',
    type: 'action',
    status: 'idle',
    description: 'Evaluates inventory thresholds, uses RAG vector similarity to select suppliers, and drafts purchase orders.',
    iconName: 'Cpu'
  },
  {
    id: 'human_review',
    label: 'Human Review Breakpoint',
    type: 'approval',
    status: 'idle',
    description: 'Thread interrupted. Requires manual authorization when draft purchase order exceeds $500.',
    iconName: 'KeyRound'
  },
  {
    id: 'pricing',
    label: 'Pricing Agent',
    type: 'action',
    status: 'idle',
    description: 'Queries live demand data, analyzes historical margin trends, and recommends optimized retail pricing.',
    iconName: 'Cable'
  },
  {
    id: 'finance',
    label: 'Finance Agent (Deterministic)',
    type: 'action',
    status: 'idle',
    description: 'Executes secure database mutations to write double-entry ledger logs and update store inventory.',
    iconName: 'Database'
  }
];

export const mockWorkflowEdges: WorkflowEdge[] = [
  { id: 'edge-1', source: 'procurement', target: 'human_review', animated: true },
  { id: 'edge-2', source: 'human_review', target: 'pricing', animated: true },
  { id: 'edge-3', source: 'pricing', target: 'finance', animated: true }
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
