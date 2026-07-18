import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { useAuth } from './AuthContext';
import { createApiClient } from './api';
import { 
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer
} from 'recharts';
import { 
  mockMetrics, chartRevenueData
} from './data';
import { 
  TrendingUp, TrendingDown, DollarSign, 
  Activity, Wallet, Cpu, Percent,
  Play, CheckCircle, Package, LogOut
} from 'lucide-react';
import SupplierAssistant from './SupplierAssistant';

interface PendingPO {
  thread_id: string;
  item_name: string;
  draft_po: {
    supplier_name: string;
    item_name: string;
    quantity: number;
    unit_price: number;
    total_cost: number;
    justification: string;
  };
}

interface DashboardProps {
  ingestedMetrics?: any;
}

export default function Dashboard({ ingestedMetrics }: DashboardProps) {
  const { token, logout } = useAuth();
  const [pendingPOs, setPendingPOs] = useState<PendingPO[]>([]);
  const [loading, setLoading] = useState(false);
  const [triggering, setTriggering] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<HTMLDivElement>(null);

  // Set up axios instance with token
  const api = createApiClient(token);

  const fetchPendingPOs = async () => {
    try {
      const res = await api.get('/erp/pending');
      setPendingPOs(res.data.pending_pos);
    } catch (err) {
      console.error("Failed to fetch pending POs", err);
    }
  };

  useEffect(() => {
    fetchPendingPOs();
    const interval = setInterval(fetchPendingPOs, 5000);
    return () => clearInterval(interval);
  }, []);

  const triggerSimulation = async () => {
    setTriggering(true);
    try {
      const apiProvider = localStorage.getItem('ai_provider');
      const modelName = localStorage.getItem('model_name');
      const customApiKey = localStorage.getItem(`api_key_${apiProvider || 'gemini'}`);

      await api.post('/erp/run', {
        item_name: "Laptops",
        current_stock: 5,
        stock_threshold: 20,
        demand_level: "High",
        thread_id: `sim-${Date.now()}`,
        api_provider: apiProvider,
        model_name: modelName,
        custom_api_key: customApiKey
      });
      await fetchPendingPOs();
    } catch (err) {
      console.error("Simulation failed", err);
    }
    setTriggering(false);
  };

  const handleApprove = async (thread_id: string, approved: boolean) => {
    setLoading(true);
    try {
      await api.post('/erp/approve', {
        thread_id,
        approved
      });
      await fetchPendingPOs();
    } catch (err) {
      console.error("Approval failed", err);
    }
    setLoading(false);
  };

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Stagger animate metric cards
      if (cardsRef.current) {
        gsap.fromTo(
          cardsRef.current.children,
          { opacity: 0, y: 30, scale: 0.95 },
          { 
            opacity: 1, 
            y: 0, 
            scale: 1, 
            duration: 0.8, 
            stagger: 0.1, 
            ease: 'power3.out' 
          }
        );
      }

      // Animate charts container entry
      if (chartRef.current) {
        gsap.fromTo(
          chartRef.current.children,
          { opacity: 0, y: 40 },
          { 
            opacity: 1, 
            y: 0, 
            duration: 1, 
            delay: 0.3, 
            stagger: 0.2, 
            ease: 'power3.out' 
          }
        );
      }

      // GSAP Counter Animation for Metric values
      const counters = document.querySelectorAll('.metric-counter');
      counters.forEach((counter) => {
        const rawTarget = counter.getAttribute('data-target') || '0';
        const isPercentage = rawTarget.includes('%');
        const numericTarget = parseFloat(rawTarget.replace(/[^0-9.]/g, ''));
        
        const countObj = { value: 0 };
        gsap.to(countObj, {
          value: numericTarget,
          duration: 1.5,
          delay: 0.2,
          ease: 'power2.out',
          onUpdate: () => {
            const isCount = counter.getAttribute('data-is-count') === 'true';
            if (isPercentage) {
              counter.textContent = countObj.value.toFixed(2) + '%';
            } else if (isCount) {
              counter.textContent = Math.round(countObj.value).toString();
            } else {
              counter.textContent = '₹' + countObj.value.toLocaleString('en-IN', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              });
            }
          }
        });
      });

    }, containerRef);

    return () => ctx.revert();
  }, []);

  const getMetricIcon = (id: string) => {
    switch (id) {
      case 'm1': return <Wallet className="w-5 h-5 text-violet-400" />;
      case 'm2': return <DollarSign className="w-5 h-5 text-pink-400" />;
      case 'm3': return <Cpu className="w-5 h-5 text-fuchsia-400" />;
      case 'm4': return <Activity className="w-5 h-5 text-purple-400" />;
      default: return <Percent className="w-5 h-5 text-violet-400" />;
    }
  };

  return (
    <div 
      ref={containerRef} 
      id="dashboard-container"
      className="flex-1 flex flex-col gap-6 p-6 sm:p-8 max-w-7xl mx-auto w-full z-10 select-none overflow-y-auto"
    >
      {/* Overview Title Header */}
      <div className="flex justify-between items-center" id="dashboard-header">
        <div>
          <h2 className="text-2xl sm:text-3xl font-display font-bold text-white tracking-tight" id="dashboard-title">
            Performance Ledger
          </h2>
          <p className="text-xs sm:text-sm text-gray-400 mt-1" id="dashboard-subtitle">
            Automated clearing reserves & global physical assets tracker.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-3 py-1.5 rounded-full text-xs text-white" id="live-indicator-pill">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" id="dot" />
            <span>LIVE RESERVES SYSTEM</span>
          </div>
          <button onClick={logout} className="glass-button p-2 rounded-full text-gray-300 hover:text-white" title="Logout">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Bento Grid Metrics Row */}
      <div 
        ref={cardsRef} 
        id="metric-cards-grid"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {mockMetrics.map((metric, idx) => {
          let displayValue = metric.value;
          let displayTitle = metric.title;
          
          if (idx === 0 && ingestedMetrics?.suppliers_count) {
            displayValue = ingestedMetrics.suppliers_count.toString();
            displayTitle = 'Active Suppliers';
          }
          return (
          <div
            key={metric.id}
            id={`metric-card-${metric.id}`}
            className="glass-panel p-5 rounded-2xl flex flex-col justify-between hover:border-violet-500/30 transition-all duration-300 group cursor-pointer relative overflow-hidden"
          >
            {/* Ambient hover glowing dot */}
            <div className="absolute -right-12 -top-12 w-24 h-24 bg-violet-600/10 rounded-full blur-2xl group-hover:bg-violet-600/20 transition-all duration-300" />
            
            <div className="flex justify-between items-start mb-3" id="metric-header">
              <span className="text-xs font-semibold tracking-wider text-gray-400 uppercase">{displayTitle}</span>
              <div className="p-2 bg-white/5 border border-white/10 rounded-xl group-hover:scale-110 transition-transform duration-300">
                {getMetricIcon(metric.id)}
              </div>
            </div>

            <div className="mt-2" id="metric-body">
              <span 
                className="metric-counter text-xl sm:text-2xl font-bold font-display text-white tracking-tight"
                data-target={displayValue}
                data-is-count={displayTitle === 'Active Suppliers'}
              >
                {idx === 0 ? displayValue : "₹0.00"}
              </span>
              <div className="flex items-center gap-1.5 mt-2" id="metric-trend-info">
                <span className={`flex items-center text-xs font-semibold py-0.5 px-1.5 rounded-md ${
                  metric.isPositive ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                }`}>
                  {metric.isPositive ? <TrendingUp className="w-3.5 h-3.5 mr-0.5" /> : <TrendingDown className="w-3.5 h-3.5 mr-0.5" />}
                  {metric.change}
                </span>
                <span className="text-[10px] text-gray-500">vs yesterday</span>
              </div>
            </div>

            {/* Micro Sparkline SVG */}
            <div className="w-full h-10 mt-4 opacity-50 group-hover:opacity-100 transition-opacity duration-300" id="metric-sparkline">
              <svg className="w-full h-full" viewBox="0 0 100 30" preserveAspectRatio="none">
                <path
                  d={`M ${metric.trendData.map((val, idx) => `${(idx / (metric.trendData.length - 1)) * 100},${30 - ((val - Math.min(...metric.trendData)) / (Math.max(...metric.trendData) - Math.min(...metric.trendData))) * 26 - 2}`).join(' L ')}`}
                  fill="none"
                  stroke={metric.isPositive ? '#10b981' : '#f43f5e'}
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </div>
          );
        })}
      </div>

      {/* Main Layout Row */}
      <div 
        ref={chartRef} 
        id="charts-container"
        className="grid grid-cols-1 lg:grid-cols-3 gap-6"
      >
        {/* Main Area Chart Container */}
        <div 
          id="main-revenue-chart-card"
          className="lg:col-span-2 glass-panel p-6 rounded-2xl flex flex-col justify-between"
        >
          <div className="flex justify-between items-center mb-6" id="chart-header">
            <div>
              <h3 className="font-display font-semibold text-lg text-white" id="revenue-chart-title">Global Inflow & Operational Expenses</h3>
              <p className="text-xs text-gray-400" id="revenue-chart-subtitle">Historical clearance values indexed in millions of rupees.</p>
            </div>
            <div className="flex items-center gap-4 text-xs" id="chart-legends">
              <div className="flex items-center gap-1.5" id="legend-revenue">
                <span className="w-3 h-3 rounded-full bg-violet-500 inline-block" />
                <span className="text-gray-300">Revenue</span>
              </div>
              <div className="flex items-center gap-1.5" id="legend-expenses">
                <span className="w-3 h-3 rounded-full bg-pink-500 inline-block" />
                <span className="text-gray-300">Expenses</span>
              </div>
            </div>
          </div>

          <div className="h-[280px] w-full" id="revenue-chart-wrapper">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={chartRevenueData}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ec4899" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#ec4899" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis 
                  dataKey="name" 
                  stroke="#6b7280" 
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis 
                  stroke="#6b7280" 
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `₹${value}M`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(15, 12, 28, 0.9)',
                    borderColor: 'rgba(255, 255, 255, 0.1)',
                    borderRadius: '12px',
                    color: '#fff',
                    fontFamily: 'Inter, sans-serif',
                    fontSize: '12px'
                  }}
                  formatter={(value: any) => [`₹${value}M`]}
                />
                <Area 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#8b5cf6" 
                  strokeWidth={2.5}
                  fillOpacity={1} 
                  fill="url(#colorRevenue)" 
                />
                <Area 
                  type="monotone" 
                  dataKey="expenses" 
                  stroke="#ec4899" 
                  strokeWidth={2.5}
                  fillOpacity={1} 
                  fill="url(#colorExpenses)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Action Panel */}
        <div 
          id="action-panel-card"
          className="glass-panel p-0 rounded-2xl flex flex-col justify-between overflow-hidden relative"
        >
          {/* Header */}
          <div className="p-6 border-b border-white/5 bg-white/5">
            <h3 className="font-display font-semibold text-lg text-white mb-1 flex items-center gap-2">
              <Package className="w-5 h-5 text-purple-400" /> Pending Approvals
              <span className="bg-purple-500/20 text-purple-300 text-[10px] px-2 py-0.5 rounded-full font-medium border border-purple-500/30 ml-auto">
                {pendingPOs.length} REQ
              </span>
            </h3>
            <p className="text-xs text-gray-400">Autonomous ERP Agent pausing for human review.</p>
          </div>

          {/* Inbox List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 h-[180px]">
            {pendingPOs.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-gray-500">
                <CheckCircle className="w-8 h-8 mb-2 opacity-50" />
                <p className="text-xs">Queue is clear</p>
              </div>
            ) : (
              pendingPOs.map((po) => (
                <div key={po.thread_id} className="bg-black/20 border border-white/10 rounded-xl p-4 hover:bg-black/40 transition-colors">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-semibold text-sm text-white">{po.draft_po.supplier_name}</h4>
                      <p className="text-xs text-gray-400">{po.draft_po.item_name} x {po.draft_po.quantity}</p>
                    </div>
                    <p className="text-sm font-bold font-mono text-emerald-400">
                      ₹{po.draft_po.total_cost.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                  </div>
                  
                  <div className="flex gap-2 mt-3">
                    <button 
                      onClick={() => handleApprove(po.thread_id, true)}
                      disabled={loading}
                      className="flex-1 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/50 py-1.5 rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
                    >
                      Approve
                    </button>
                    <button 
                      onClick={() => handleApprove(po.thread_id, false)}
                      disabled={loading}
                      className="flex-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 py-1.5 rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Simulation Trigger (Sticky bottom) */}
          <div className="p-4 border-t border-white/5 bg-black/40">
            <button 
              onClick={triggerSimulation}
              disabled={triggering}
              className={`w-full py-2.5 px-4 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-all ${
                triggering 
                  ? 'bg-gray-800 text-gray-500 cursor-not-allowed' 
                  : 'bg-gradient-to-r from-brand-purple to-brand-pink text-white hover:scale-[1.02] shadow-[0_0_15px_rgba(139,92,246,0.3)]'
              }`}
            >
              {triggering ? (
                'Agents Working...'
              ) : (
                <>
                  <Play className="w-4 h-4" /> Trigger Simulation
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <SupplierAssistant />
    </div>
  );
}
