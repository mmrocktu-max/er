import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { useAuth } from './AuthContext';
import { createApiClient } from './api';
import {
  Package, MapPin, ShoppingCart, AlertTriangle,
  TrendingUp, Minus, Plus, Zap
} from 'lucide-react';

interface InventoryItem {
  sku: string;
  name: string;
  currentStock: number;
  minStock: number;
  maxStock: number;
  unitCost: number;
  price: number;
  demandLevel: 'HIGH' | 'MEDIUM' | 'LOW';
}

interface Branch {
  id: string;
  name: string;
  location: string;
  dotColor: string;
  items: InventoryItem[];
}

interface BranchInventoryProps {
  onApprovalRequired: (itemName: string, totalCost: number) => void;
}

const BRANCHES: Branch[] = [
  {
    id: 'B1',
    name: 'Austin',
    location: 'Austin, TX',
    dotColor: 'bg-emerald-400',
    items: [
      {
        sku: 'AST-LAP-001',
        name: 'Enterprise AI Laptop',
        currentStock: 12,
        minStock: 5,
        maxStock: 60,
        unitCost: 900,
        price: 1500,
        demandLevel: 'HIGH',
      },
      {
        sku: 'AST-PHN-002',
        name: 'Secure Node Phone',
        currentStock: 3,
        minStock: 8,
        maxStock: 50,
        unitCost: 450,
        price: 800,
        demandLevel: 'MEDIUM',
      },
    ],
  },
  {
    id: 'B2',
    name: 'New York',
    location: 'New York, NY',
    dotColor: 'bg-blue-400',
    items: [
      {
        sku: 'NYC-SRV-001',
        name: 'Edge Server Blade',
        currentStock: 7,
        minStock: 10,
        maxStock: 40,
        unitCost: 2100,
        price: 3200,
        demandLevel: 'HIGH',
      },
      {
        sku: 'NYC-GPU-002',
        name: 'Local Tensor GPU',
        currentStock: 20,
        minStock: 5,
        maxStock: 30,
        unitCost: 1600,
        price: 2400,
        demandLevel: 'LOW',
      },
      {
        sku: 'NYC-CAB-003',
        name: 'Fiber Optic Cable Kit',
        currentStock: 45,
        minStock: 15,
        maxStock: 100,
        unitCost: 120,
        price: 220,
        demandLevel: 'MEDIUM',
      },
    ],
  },
  {
    id: 'B3',
    name: 'Silicon',
    location: 'San Jose, CA',
    dotColor: 'bg-violet-400',
    items: [
      {
        sku: 'SVH-DRN-001',
        name: 'Autonomous Forklift Drone',
        currentStock: 2,
        minStock: 6,
        maxStock: 20,
        unitCost: 4500,
        price: 6800,
        demandLevel: 'HIGH',
      },
      {
        sku: 'SVH-ROB-002',
        name: 'Warehouse Robot Arm',
        currentStock: 8,
        minStock: 3,
        maxStock: 15,
        unitCost: 3200,
        price: 5100,
        demandLevel: 'MEDIUM',
      },
    ],
  },
];

export default function BranchInventory({ onApprovalRequired }: BranchInventoryProps) {
  const { token } = useAuth();
  const [activeBranch, setActiveBranch] = useState<string>('B1');
  const [items, setItems] = useState<InventoryItem[]>(BRANCHES[0].items);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [alerts, setAlerts] = useState<Record<string, string>>({});

  const containerRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<HTMLDivElement>(null);

  const api = createApiClient(token);

  const branch = BRANCHES.find(b => b.id === activeBranch)!;

  // Switch branch
  const switchBranch = (branchId: string) => {
    setActiveBranch(branchId);
    const b = BRANCHES.find(br => br.id === branchId)!;
    setItems([...b.items]);
    setQuantities({});
    setAlerts({});

    // Animate cards in
    setTimeout(() => {
      if (cardsRef.current) {
        gsap.fromTo(
          cardsRef.current.children,
          { opacity: 0, y: 20, scale: 0.97 },
          { opacity: 1, y: 0, scale: 1, duration: 0.5, stagger: 0.1, ease: 'power3.out' }
        );
      }
    }, 50);
  };

  // Entry animation
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        containerRef.current?.querySelectorAll('.bi-animate') || [],
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.8, stagger: 0.12, ease: 'power3.out' }
      );
    }, containerRef);
    return () => ctx.revert();
  }, []);

  const getQty = (sku: string) => quantities[sku] ?? 1;

  const runERPWorkflow = async (item: InventoryItem, currentStock: number, threadId: string) => {
    const apiProvider = localStorage.getItem('ai_provider');
    const modelName = localStorage.getItem('model_name');
    const customApiKey = localStorage.getItem(`api_key_${apiProvider || 'gemini'}`);

    try {
      const response = await api.post('/erp/run', {
        item_name: item.name,
        current_stock: currentStock,
        stock_threshold: item.minStock,
        demand_level: item.demandLevel === 'HIGH' ? 'High' : item.demandLevel === 'LOW' ? 'Low' : 'Normal',
        thread_id: threadId,
        api_provider: apiProvider,
        model_name: modelName,
        custom_api_key: customApiKey
      });

      if (response.data?.status === 'paused') {
        const totalCost = response.data.draft_po?.total_cost ?? 0;
        setAlerts(alerts => ({
          ...alerts,
          [item.sku]: `Approval required for ${item.name}. Opening the review queue.`,
        }));
        onApprovalRequired(item.name, totalCost);
      }
    } catch (error) {
      console.error('ERP trigger failed:', error);
      setAlerts(alerts => ({
        ...alerts,
        [item.sku]: `Could not start the procurement workflow for ${item.name}. Please retry.`,
      }));
    }
  };

  const setQty = (sku: string, val: number) => {
    setQuantities(prev => ({ ...prev, [sku]: Math.max(1, val) }));
  };

  const simulateSale = (sku: string) => {
    const qty = getQty(sku);
    setItems(prev =>
      prev.map(item => {
        if (item.sku === sku) {
          const newStock = Math.max(0, item.currentStock - qty);
          if (newStock <= item.minStock) {
            setAlerts(a => ({ ...a, [sku]: `⚠ LOW STOCK: ${item.name} dropped to ${newStock} units` }));

            void runERPWorkflow(item, newStock, `inv-${sku}-${Date.now()}`);
          }
          return { ...item, currentStock: newStock };
        }
        return item;
      })
    );
  };

  const forceLowStock = (sku: string) => {
    setItems(prev =>
      prev.map(item => {
        if (item.sku === sku) {
          const newStock = Math.max(0, item.minStock - 2);
          setAlerts(a => ({ ...a, [sku]: `⚡ FORCED LOW STOCK: ${item.name} set to ${newStock} units — ERP triggered` }));

          void runERPWorkflow(item, newStock, `inv-force-${sku}-${Date.now()}`);

          return { ...item, currentStock: newStock };
        }
        return item;
      })
    );
  };

  const getStockPercent = (item: InventoryItem) => {
    return Math.round((item.currentStock / item.maxStock) * 100);
  };

  const getStockBarColor = (item: InventoryItem) => {
    if (item.currentStock <= item.minStock) return 'bg-red-500';
    if (item.currentStock <= item.minStock * 2) return 'bg-amber-500';
    return 'bg-emerald-500';
  };

  const getDemandBadge = (level: string) => {
    switch (level) {
      case 'HIGH':
        return 'bg-red-500/15 text-red-400 border-red-500/30';
      case 'MEDIUM':
        return 'bg-amber-500/15 text-amber-400 border-amber-500/30';
      case 'LOW':
        return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
      default:
        return 'bg-gray-500/15 text-gray-400 border-gray-500/30';
    }
  };

  return (
    <div
      ref={containerRef}
      id="branch-inventory-container"
      className="flex-1 flex flex-col gap-6 p-6 sm:p-8 max-w-7xl mx-auto w-full z-10 select-none overflow-y-auto"
    >
      {/* Header */}
      <div className="bi-animate flex justify-between items-start">
        <div className="flex items-center gap-3">
          <Package className="w-6 h-6 text-amber-400" />
          <div>
            <h2 className="text-2xl font-display font-bold text-white tracking-tight">
              BRANCH INVENTORY
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Track and manage store inventory levels in real-time
            </p>
          </div>
        </div>

        {/* Branch Tabs */}
        <div className="flex items-center gap-2 bg-black/60 backdrop-blur-xl px-2 py-1.5 rounded-full border border-white/10">
          {BRANCHES.map(b => {
            const isActive = activeBranch === b.id;
            return (
              <button
                key={b.id}
                onClick={() => switchBranch(b.id)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold tracking-wider transition-all ${
                  isActive
                    ? 'bg-[#1a1726] text-white border border-white/10 shadow-lg'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${b.dotColor}`} />
                {b.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Location Bar */}
      <div className="bi-animate glass-panel rounded-xl px-5 py-3 flex justify-between items-center">
        <div className="flex items-center gap-2 text-sm text-gray-300">
          <MapPin className="w-4 h-4 text-gray-500" />
          <span className="text-gray-500">LOCATION:</span>
          <span className="font-semibold text-white">{branch.location}</span>
        </div>
        <div className="flex items-center gap-4 text-xs text-gray-400">
          <span>BRANCH ID: <span className="text-white font-bold">{branch.id}</span></span>
          <span>ITEMS: <span className="text-white font-bold">{items.length}</span></span>
        </div>
      </div>

      {/* Global Alerts */}
      {Object.entries(alerts).length > 0 && (
        <div className="space-y-2">
          {Object.entries(alerts).map(([sku, msg]) => (
            <div key={sku} className="bi-animate flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 animate-fade-in">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{msg}</span>
            </div>
          ))}
        </div>
      )}

      {/* Inventory Cards Grid */}
      <div
        ref={cardsRef}
        className="grid grid-cols-1 md:grid-cols-2 gap-5"
        id="inventory-cards-grid"
      >
        {items.map(item => {
          const pct = getStockPercent(item);
          const isLow = item.currentStock <= item.minStock;

          return (
            <div
              key={item.sku}
              className={`bi-animate glass-panel rounded-2xl p-5 flex flex-col gap-4 transition-all duration-300 ${
                isLow ? 'border-red-500/30' : ''
              }`}
            >
              {/* Card Top: SKU + Name + Demand Badge */}
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-[10px] text-gray-500 font-mono tracking-wider uppercase">{item.sku}</p>
                  <h3 className="text-base font-bold text-white mt-0.5 flex items-center gap-2">
                    {item.name}
                    {isLow && (
                      <span className="text-[9px] bg-red-500/20 text-red-400 border border-red-500/30 px-1.5 py-0.5 rounded-md font-semibold flex items-center gap-0.5">
                        <AlertTriangle className="w-2.5 h-2.5" /> LOW STOCK
                      </span>
                    )}
                  </h3>
                </div>
                <span className={`text-[10px] px-2.5 py-1 rounded-full border font-bold tracking-wider flex items-center gap-1 ${getDemandBadge(item.demandLevel)}`}>
                  <TrendingUp className="w-3 h-3" /> {item.demandLevel} DEMAND
                </span>
              </div>

              {/* Stock Level Bar */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-xs text-gray-400">
                    Stock Levels: <span className={`font-bold ${isLow ? 'text-red-400' : 'text-emerald-400'}`}>{item.currentStock}</span>
                    <span className="text-gray-600"> / {item.minStock} (min)</span>
                  </span>
                  <span className="text-xs text-gray-500">{pct}% Cap</span>
                </div>
                <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${getStockBarColor(item)}`}
                    style={{ width: `${Math.min(100, pct)}%` }}
                  />
                </div>
              </div>

              {/* Cost Info */}
              <div className="flex items-center gap-6 text-xs text-gray-400">
                <span className="flex items-center gap-1.5">
                  <span className="text-gray-600">◇</span> Unit Cost: <span className="text-white font-semibold">₹{item.unitCost.toLocaleString()}</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="text-gray-600">↗</span> Price: <span className="text-emerald-400 font-semibold">₹{item.price.toLocaleString()}</span>
                </span>
              </div>

              {/* Simulate Sale Row */}
              <div className="flex items-center gap-3">
                {/* Quantity Stepper */}
                <div className="flex items-center bg-black/30 border border-white/10 rounded-lg overflow-hidden">
                  <span className="text-[10px] text-gray-500 uppercase tracking-wider px-2">QTY:</span>
                  <button
                    onClick={() => setQty(item.sku, getQty(item.sku) - 1)}
                    className="p-1.5 text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="text-sm font-bold text-white w-8 text-center">{getQty(item.sku)}</span>
                  <button
                    onClick={() => setQty(item.sku, getQty(item.sku) + 1)}
                    className="p-1.5 text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>

                {/* Simulate Sale Button */}
                <button
                  onClick={() => simulateSale(item.sku)}
                  className="flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-xs font-semibold hover:shadow-[0_0_15px_rgba(16,185,129,0.3)] hover:scale-[1.02] transition-all"
                >
                  <ShoppingCart className="w-3.5 h-3.5" /> Simulate Sale
                </button>
              </div>

              {/* Force Low Stock */}
              <button
                onClick={() => forceLowStock(item.sku)}
                className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold hover:bg-amber-500/15 transition-all"
              >
                <Zap className="w-3.5 h-3.5" /> Force Low Stock Alert
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
