/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export enum ActiveTab {
  Finance = 'FINANCE',
  Dashboard = 'DASHBOARD',
  Workflow = 'WORKFLOW GRAPH',
  Inventory = 'BRANCH INVENTORY',
  Ledger = 'FINANCIAL LEDGER'
}

export interface MetricCardData {
  id: string;
  title: string;
  value: string;
  change: string;
  isPositive: boolean;
  trendData: number[];
}

export interface Transaction {
  id: string;
  date: string;
  description: string;
  category: 'Revenue' | 'Expense' | 'Transfer' | 'Audit';
  amount: number;
  status: 'Completed' | 'Pending' | 'Failed';
  reference: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  branch: string;
  category: 'Hardware' | 'License' | 'Document' | 'Safety';
  serialNumber: string;
  value: number;
  status: 'Active' | 'Under Maintenance' | 'In Storage';
  lastChecked: string;
}

export interface WorkflowNode {
  id: string;
  label: string;
  type: 'trigger' | 'action' | 'condition' | 'approval';
  status: 'idle' | 'running' | 'completed' | 'error';
  description: string;
  iconName: string;
}

export interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  animated?: boolean;
}
