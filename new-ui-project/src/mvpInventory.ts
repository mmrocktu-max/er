export interface MvpInventoryRecord {
  supplierId: string;
  supplierName: string;
  sku: string;
  category: string;
  itemName: string;
  unitCost: number;
  leadTimeDays: number;
  onTimeRate: number;
  inventoryLevel: number;
  reorderThreshold: number;
  reviewStatus: string;
}

// Representative records from Supplier_Inventory_RAG_Dataset.xlsx / Raw_Data.
// This keeps the MVP informative when an AI provider or the workflow API is unavailable.
export const mvpInventoryRecords: MvpInventoryRecord[] = [
  { supplierId: 'SUP-001', supplierName: 'Apex Racing Supply', sku: 'SEA-BK-15', category: 'Cockpit Essentials', itemName: 'Bucket Seat', unitCost: 1165.68, leadTimeDays: 16, onTimeRate: 0.84, inventoryLevel: 31, reorderThreshold: 21, reviewStatus: 'Pending Review' },
  { supplierId: 'SUP-003', supplierName: 'TrackDay Spares', sku: 'SRV-DD-46', category: 'Sim Racing Hardware', itemName: 'Direct Drive Wheel Base', unitCost: 155.91, leadTimeDays: 18, onTimeRate: 0.82, inventoryLevel: 3, reorderThreshold: 17, reviewStatus: 'Pending Review' },
  { supplierId: 'SUP-003', supplierName: 'TrackDay Spares', sku: 'ROT-CC-68', category: 'Vehicle Dynamics', itemName: 'Carbon Ceramic Rotor', unitCost: 486.13, leadTimeDays: 16, onTimeRate: 0.86, inventoryLevel: 12, reorderThreshold: 25, reviewStatus: 'Pending Review' },
  { supplierId: 'SUP-004', supplierName: 'SimRig Dynamics', sku: 'HAR-6P-95', category: 'Cockpit Essentials', itemName: '6-Point Harness', unitCost: 1534.86, leadTimeDays: 7, onTimeRate: 0.91, inventoryLevel: 6, reorderThreshold: 24, reviewStatus: 'Pending Review' },
  { supplierId: 'SUP-001', supplierName: 'Apex Racing Supply', sku: 'SRV-DD-83', category: 'Sim Racing Hardware', itemName: 'Direct Drive Wheel Base', unitCost: 1661.97, leadTimeDays: 11, onTimeRate: 0.78, inventoryLevel: 67, reorderThreshold: 31, reviewStatus: 'Pending Review' },
  { supplierId: 'SUP-001', supplierName: 'Apex Racing Supply', sku: 'PAD-TR-48', category: 'Vehicle Dynamics', itemName: 'Track Brake Pads', unitCost: 1600.26, leadTimeDays: 7, onTimeRate: 0.95, inventoryLevel: 90, reorderThreshold: 40, reviewStatus: 'Pending Review' },
  { supplierId: 'SUP-005', supplierName: 'Apex Braking Co.', sku: 'HAR-6P-94', category: 'Cockpit Essentials', itemName: '6-Point Harness', unitCost: 776.51, leadTimeDays: 10, onTimeRate: 0.8, inventoryLevel: 114, reorderThreshold: 36, reviewStatus: 'Pending Review' },
  { supplierId: 'SUP-004', supplierName: 'SimRig Dynamics', sku: 'SRV-DD-84', category: 'Sim Racing Hardware', itemName: 'Direct Drive Wheel Base', unitCost: 644.99, leadTimeDays: 16, onTimeRate: 0.82, inventoryLevel: 32, reorderThreshold: 18, reviewStatus: 'Pending Review' },
  { supplierId: 'SUP-004', supplierName: 'SimRig Dynamics', sku: 'SEA-BK-94', category: 'Cockpit Essentials', itemName: 'Bucket Seat', unitCost: 1014.01, leadTimeDays: 19, onTimeRate: 0.8, inventoryLevel: 60, reorderThreshold: 28, reviewStatus: 'Pending Review' },
  { supplierId: 'SUP-002', supplierName: 'Monza Direct Imports', sku: 'WHE-GT-30', category: 'Cockpit Essentials', itemName: 'GT3 Steering Wheel', unitCost: 611.54, leadTimeDays: 10, onTimeRate: 0.9, inventoryLevel: 55, reorderThreshold: 37, reviewStatus: 'Pending Review' },
];
