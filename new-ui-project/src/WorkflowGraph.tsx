import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { useAuth } from './AuthContext';
import { createApiClient } from './api';
import { mvpInventoryRecords } from './mvpInventory';
import {
  Play, CheckCircle, XCircle, Package, Clock, RotateCcw,
  ShoppingCart, BarChart3, FileText, Activity, Zap
} from 'lucide-react';

interface PendingPO {
  thread_id: string;
  item_name: string;
  draft_po: {
    supplier_name: string;
    supplier_id: string;
    item_name: string;
    quantity: number;
    unit_price: number;
    total_cost: number;
    justification: string;
    reasoning: string;
  };
}

interface SystemLog {
  timestamp: string;
  node: string;
  message: string;
}

interface ResolvedPO {
  thread_id: string;
  item_name: string;
  approved: boolean;
  total_cost: number;
}

interface ApprovalNotice {
  itemName: string;
  totalCost: number;
}

interface WorkflowGraphProps {
  approvalNotice?: ApprovalNotice | null;
}

type ApprovalTab = 'all' | 'pending' | 'resolved';

const WORKFLOW_NODES = [
  { id: 'inventory', label: 'Inventory Check', icon: Package },
  { id: 'procurement', label: 'Procurement', icon: ShoppingCart },
  { id: 'humanApproval', label: 'Human Approval', icon: Clock },
  { id: 'pricing', label: 'Price Adjustment', icon: BarChart3 },
  { id: 'ledger', label: 'Ledger Update', icon: FileText },
] as const;

export default function WorkflowGraph({ approvalNotice }: WorkflowGraphProps) {
  const { token } = useAuth();
  const [pendingPOs, setPendingPOs] = useState<PendingPO[]>([]);
  const [resolvedPOs, setResolvedPOs] = useState<ResolvedPO[]>([]);
  const [loading, setLoading] = useState(false);
  const [triggering, setTriggering] = useState(false);
  const [activeTab, setActiveTab] = useState<ApprovalTab>('all');
  const [currentNode, setCurrentNode] = useState<string | null>(null);
  const [systemLogs, setSystemLogs] = useState<SystemLog[]>([]);
  const [completedNodes, setCompletedNodes] = useState<string[]>([]);
  const [workflowError, setWorkflowError] = useState<string | null>(null);
  const [mvpStatuses, setMvpStatuses] = useState<Record<string, 'pending' | 'approved' | 'rejected'>>({});

  const handleMvpAction = (sku: string, approved: boolean) => {
    setMvpStatuses(prev => ({
      ...prev,
      [sku]: approved ? 'approved' : 'rejected'
    }));
  };

  const containerRef = useRef<HTMLDivElement>(null);
  const logEndRef = useRef<HTMLDivElement>(null);

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

  // Auto-scroll activity log
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [systemLogs]);

  // Entry animations
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        containerRef.current?.querySelectorAll('.wf-animate') || [],
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.8, stagger: 0.15, ease: 'power3.out' }
      );
    }, containerRef);
    return () => ctx.revert();
  }, []);

  const addLog = (node: string, message: string) => {
    const now = new Date();
    const timestamp = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
    setSystemLogs(prev => [...prev, { timestamp, node, message }]);
  };

  useEffect(() => {
    if (!approvalNotice) return;

    setActiveTab('pending');
    setCompletedNodes(['inventory', 'procurement']);
    setCurrentNode('humanApproval');
    addLog('System', `Approval required for ${approvalNotice.itemName}: ₹${approvalNotice.totalCost.toLocaleString('en-IN')}.`);
  }, [approvalNotice]);

  const triggerSimulation = async () => {
    setWorkflowError(null);
    setTriggering(true);
    setCompletedNodes([]);
    setCurrentNode('inventory');
    addLog('System', 'Initiating ERP workflow simulation...');
    addLog('Inventory', 'Scanning stock levels against safety thresholds...');

    await new Promise(r => setTimeout(r, 800));
    setCompletedNodes(['inventory']);
    addLog('Inventory', 'Low stock detected. Routing to Procurement agent.');
    setCurrentNode('procurement');

    try {
      const threadId = `PO_${Math.random().toString(36).substring(2, 12)}`;
      const apiProvider = localStorage.getItem('ai_provider');
      const modelName = localStorage.getItem('model_name');
      const customApiKey = localStorage.getItem(`api_key_${apiProvider || 'gemini'}`);

      const res = await api.post('/erp/run', {
        item_name: "Autonomous Forklift Drone",
        current_stock: 2,
        stock_threshold: 10,
        demand_level: "High",
        thread_id: threadId,
        api_provider: apiProvider,
        model_name: modelName,
        custom_api_key: customApiKey
      });

      const data = res.data;

      if (data.messages) {
        data.messages.forEach((msg: string) => {
          addLog('Procure', msg);
        });
      }

      if (data.status === 'paused') {
        addLog('System', `Procurement phase complete. LangGraph state routing to ${data.next_node === 'human_approval_node' ? 'Human Approval' : 'Pricing Node'}.`);

        if (data.draft_po) {
          const cost = data.draft_po.total_cost || 0;
          addLog('Procure', `Agent drafted Purchase Order: ${data.draft_po.quantity || '?'}x ${data.draft_po.item_name || 'item'} (Total: ₹${cost.toLocaleString()})`);
          addLog('Procure', `Human-in-the-Loop checkpoint registered for PO ${threadId}. Governance approval required.`);
        }

        setCompletedNodes(['inventory', 'procurement']);
        setCurrentNode('humanApproval');
      } else if (data.status === 'completed') {
        setCompletedNodes(prev => [...prev, 'procurement', 'pricing', 'ledger']);
        setCurrentNode(null);
        addLog('System', 'Workflow completed successfully. All nodes executed.');
      }

      await fetchPendingPOs();
    } catch (err: any) {
      console.error("Simulation failed", err);
      setWorkflowError('The live agent is unavailable. Showing inventory data from the workbook instead.');
    }
    setTriggering(false);
  };

  const handleApprove = async (thread_id: string, approved: boolean) => {
    setLoading(true);
    const po = pendingPOs.find(p => p.thread_id === thread_id);

    try {
      addLog('System', `Human ${approved ? 'APPROVED' : 'DECLINED'} PO ${thread_id}.`);

      const res = await api.post('/erp/approve', { thread_id, approved });

      if (po) {
        setResolvedPOs(prev => [...prev, {
          thread_id,
          item_name: po.item_name,
          approved,
          total_cost: po.draft_po?.total_cost || 0,
        }]);
      }

      if (approved) {
        setCurrentNode('pricing');
        setCompletedNodes(['inventory', 'procurement', 'humanApproval']);
        addLog('Pricing', 'Running Price Adjustment agent based on demand analysis...');

        await new Promise(r => setTimeout(r, 600));

        if (res.data?.final_state?.messages) {
          res.data.final_state.messages.slice(-2).forEach((msg: string) => {
            const node = msg.includes('price') || msg.includes('Price') ? 'Pricing' : 'Finance';
            addLog(node, msg);
          });
        }

        setCompletedNodes(prev => [...prev, 'pricing']);
        setCurrentNode('ledger');
        addLog('Finance', 'Updating ledger with PO deductions...');

        await new Promise(r => setTimeout(r, 500));
        setCompletedNodes(prev => [...prev, 'ledger']);
        setCurrentNode(null);
        addLog('System', 'Workflow completed. All agents finished execution.');
      } else {
        setCurrentNode(null);
        addLog('System', 'PO rejected. Workflow halted.');
      }

      await fetchPendingPOs();
    } catch (err) {
      console.error("Approval failed", err);
    }
    setLoading(false);
  };

  const resetState = () => {
    setSystemLogs([]);
    setCurrentNode(null);
    setCompletedNodes([]);
    setResolvedPOs([]);
    setWorkflowError(null);
  };

  const getNodeStatus = (nodeId: string) => {
    if (currentNode === nodeId) return 'active';
    if (completedNodes.includes(nodeId)) return 'completed';
    return 'idle';
  };

  const getNodeColor = (status: string) => {
    switch (status) {
      case 'active': return 'border-amber-400 bg-amber-400/10 shadow-[0_0_20px_rgba(251,191,36,0.3)]';
      case 'completed': return 'border-emerald-400/50 bg-emerald-400/5';
      default: return 'border-white/10 bg-white/5';
    }
  };

  const getNodeIconColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-amber-400';
      case 'completed': return 'text-emerald-400';
      default: return 'text-gray-500';
    }
  };

  const getLogNodeColor = (node: string) => {
    switch (node) {
      case 'System': return 'bg-gray-600/30 text-gray-300';
      case 'Inventory': return 'bg-blue-500/20 text-blue-400';
      case 'Procure': return 'bg-amber-500/20 text-amber-400';
      case 'Pricing': return 'bg-purple-500/20 text-purple-400';
      case 'Finance': return 'bg-emerald-500/20 text-emerald-400';
      default: return 'bg-gray-600/30 text-gray-300';
    }
  };

  return (
    <div
      ref={containerRef}
      id="workflow-container"
      className="flex-1 flex flex-col gap-6 p-6 sm:p-8 max-w-7xl mx-auto w-full z-10 select-none overflow-y-auto"
    >
      {approvalNotice && (
        <div role="status" aria-live="polite" className="rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
          Approval required for <span className="font-semibold">{approvalNotice.itemName}</span>. The purchase order is waiting in the queue below.
        </div>
      )}

      {/* ===== MAIN 2-COLUMN LAYOUT ===== */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 flex-1">

        {/* ===== LEFT: WORKFLOW STATUS + ACTIVITY LOG (3 cols) ===== */}
        <div id="workflow-panel" className="lg:col-span-3 flex flex-col gap-6">
          {/* Workflow Status Card */}
          <div className="wf-animate glass-panel rounded-2xl p-6" id="workflow-status-card">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-3">
                <Zap className="w-5 h-5 text-amber-400" />
                <div>
                  <h3 className="font-display font-semibold text-lg text-white">WORKFLOW STATUS</h3>
                  <p className="text-[11px] text-gray-400">View real-time step transitions and pipeline state</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={resetState}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-gray-300 hover:bg-white/10 hover:text-white transition-all"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Reset State
                </button>
                <button
                  onClick={triggerSimulation}
                  disabled={triggering}
                  className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    triggering
                      ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                      : 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:shadow-[0_0_15px_rgba(16,185,129,0.4)] hover:scale-[1.03]'
                  }`}
                >
                  <Play className="w-3.5 h-3.5" />
                  {triggering ? 'Running...' : 'Execute Next Agent'}
                </button>
              </div>
            </div>

            {/* Current Node Indicator */}
            {currentNode && (
              <div className="mb-4 px-3 py-2 bg-amber-500/10 border border-amber-500/20 rounded-lg flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                <span className="text-xs text-amber-300 font-medium">
                  Current: {WORKFLOW_NODES.find(n => n.id === currentNode)?.label || currentNode}
                </span>
              </div>
            )}

            {/* Workflow Graph — Diamond Layout */}
            <div className="relative flex items-center justify-center py-6" id="workflow-graph">
              <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 500 220" preserveAspectRatio="xMidYMid meet">
                {/* Inventory → Procurement */}
                <line x1="130" y1="110" x2="220" y2="50" stroke={completedNodes.includes('inventory') ? '#10b981' : '#333'} strokeWidth="2" strokeDasharray={completedNodes.includes('inventory') ? '0' : '6 4'} />
                {/* Procurement → Pricing */}
                <line x1="250" y1="70" x2="250" y2="95" stroke={completedNodes.includes('procurement') ? '#10b981' : '#333'} strokeWidth="2" strokeDasharray={completedNodes.includes('procurement') ? '0' : '6 4'} />
                <line x1="285" y1="110" x2="370" y2="110" stroke={completedNodes.includes('humanApproval') ? '#10b981' : '#333'} strokeWidth="2" strokeDasharray={completedNodes.includes('humanApproval') ? '0' : '6 4'} />
                {/* Pricing → Ledger */}
                <line x1="370" y1="130" x2="280" y2="190" stroke={completedNodes.includes('pricing') ? '#10b981' : '#333'} strokeWidth="2" strokeDasharray={completedNodes.includes('pricing') ? '0' : '6 4'} />
              </svg>

              <div className="relative w-full flex flex-col items-center gap-2" style={{ height: '200px' }}>
                {/* Inventory Check — left middle */}
                <div className="absolute left-4 sm:left-8 top-1/2 -translate-y-1/2">
                  <div className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all duration-500 ${getNodeColor(getNodeStatus('inventory'))}`}>
                    <Package className={`w-6 h-6 ${getNodeIconColor(getNodeStatus('inventory'))}`} />
                    <span className="text-[10px] text-gray-300 font-medium whitespace-nowrap">Inventory Check</span>
                  </div>
                </div>

                {/* Procurement — top center */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2">
                  <div className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all duration-500 ${getNodeColor(getNodeStatus('procurement'))}`}>
                    <ShoppingCart className={`w-6 h-6 ${getNodeIconColor(getNodeStatus('procurement'))}`} />
                    <span className="text-[10px] text-gray-300 font-medium whitespace-nowrap">Procurement</span>
                  </div>
                </div>

                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                  <div className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all duration-500 ${getNodeColor(getNodeStatus('humanApproval'))}`}>
                    <Clock className={`w-6 h-6 ${getNodeIconColor(getNodeStatus('humanApproval'))}`} />
                    <span className="text-[10px] text-gray-300 font-medium whitespace-nowrap">Human Approval</span>
                  </div>
                </div>

                {/* Price Adjustment — right middle */}
                <div className="absolute right-4 sm:right-8 top-1/2 -translate-y-1/2">
                  <div className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all duration-500 ${getNodeColor(getNodeStatus('pricing'))}`}>
                    <BarChart3 className={`w-6 h-6 ${getNodeIconColor(getNodeStatus('pricing'))}`} />
                    <span className="text-[10px] text-gray-300 font-medium whitespace-nowrap">Price Adjustment</span>
                  </div>
                </div>

                {/* Ledger Update — bottom center */}
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2">
                  <div className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all duration-500 ${getNodeColor(getNodeStatus('ledger'))}`}>
                    <FileText className={`w-6 h-6 ${getNodeIconColor(getNodeStatus('ledger'))}`} />
                    <span className="text-[10px] text-gray-300 font-medium whitespace-nowrap">Ledger Update</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* System Activity Log */}
          <div className="wf-animate glass-panel rounded-2xl p-6" id="activity-log-card">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="w-4 h-4 text-gray-400" />
              <h3 className="font-display font-semibold text-sm text-white uppercase tracking-wider">System Activity Log</h3>
            </div>
            <div className="h-[220px] overflow-y-auto space-y-2 pr-2 scrollbar-thin" id="activity-log-scroll">
              {systemLogs.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-600">
                  <Activity className="w-6 h-6 mb-2 opacity-40" />
                  <p className="text-xs">No activity yet. Click "Execute Next Agent" to begin.</p>
                </div>
              ) : (
                systemLogs.map((log, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs animate-fade-in">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold shrink-0 mt-0.5 ${getLogNodeColor(log.node)}`}>
                      {log.node}
                    </span>
                    <span className="text-gray-300 flex-1 leading-relaxed">{log.message}</span>
                    <span className="text-gray-600 text-[10px] shrink-0 font-mono">{log.timestamp}</span>
                  </div>
                ))
              )}
              <div ref={logEndRef} />
            </div>
          </div>
        </div>

        {/* ===== RIGHT: APPROVAL QUEUE (2 cols) ===== */}
        <div id="approval-queue-panel" className="wf-animate lg:col-span-2 glass-panel rounded-2xl flex flex-col overflow-hidden">
          {/* Header */}
          <div className="p-5 border-b border-white/5 flex justify-between items-start">
            <div>
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5 text-amber-400" />
                <h3 className="font-display font-semibold text-lg text-white">APPROVAL QUEUE</h3>
              </div>
              <p className="text-[11px] text-gray-400 mt-1">Authorize pending supply orders and price updates</p>
            </div>
            <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
              pendingPOs.length > 0
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                : 'bg-white/5 text-gray-500 border border-white/10'
            }`}>
              {pendingPOs.length} pending
            </span>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-white/5">
            {(['all', 'pending', 'resolved'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-2.5 text-xs font-semibold uppercase tracking-wider transition-all ${
                  activeTab === tab
                    ? 'text-white border-b-2 border-violet-500 bg-white/5'
                    : 'text-gray-500 hover:text-gray-300 border-b-2 border-transparent'
                }`}
              >
                {tab} ({tab === 'resolved' ? resolvedPOs.length : pendingPOs.length})
              </button>
            ))}
          </div>

          {/* PO Cards */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin">
            {workflowError ? (
              mvpInventoryRecords.map((record) => {
                const needsReorder = record.inventoryLevel <= record.reorderThreshold;
                const status = mvpStatuses[record.sku] || 'pending';
                return (
                  <article key={record.sku} className={`rounded-xl border ${status === 'approved' ? 'border-emerald-500/30 bg-emerald-500/5' : status === 'rejected' ? 'border-red-500/30 bg-red-500/5' : 'border-white/10 bg-black/20'} p-3 flex flex-col justify-between`}>
                    <div>
                      <p className="text-[10px] font-mono text-gray-500">{record.sku} · {record.supplierId}</p>
                      <h3 className="text-sm font-semibold text-white mt-1 leading-snug">{record.itemName}</h3>
                      <p className="text-[11px] text-gray-400 mt-1 truncate" title={record.supplierName}>{record.supplierName}</p>
                      <div className="mt-3 flex items-end justify-between gap-2">
                        <span className="text-sm font-mono font-bold text-emerald-300">₹{record.unitCost.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                        <span className={`text-[10px] font-semibold ${needsReorder ? 'text-amber-300' : 'text-emerald-300'}`}>
                          {needsReorder ? 'REORDER' : 'IN STOCK'}
                        </span>
                      </div>
                      <p className="text-[10px] text-gray-500 mt-2 mb-3">Stock {record.inventoryLevel} / threshold {record.reorderThreshold} · {record.leadTimeDays}d lead</p>
                    </div>
                    {status === 'pending' ? (
                      <div className="mt-auto pt-3 border-t border-white/5 flex gap-2">
                        <button
                          onClick={() => handleMvpAction(record.sku, false)}
                          className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded bg-red-500/10 border border-red-500/30 text-red-400 text-[10px] font-semibold hover:bg-red-500/20 transition-all"
                        >
                          <XCircle className="w-3 h-3" /> Decline
                        </button>
                        <button
                          onClick={() => handleMvpAction(record.sku, true)}
                          className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-[10px] font-semibold hover:bg-emerald-500/30 transition-all"
                        >
                          <CheckCircle className="w-3 h-3" /> Approve
                        </button>
                      </div>
                    ) : (
                      <div className="mt-auto pt-3 border-t border-white/5">
                        <p className={`text-xs font-bold text-center ${status === 'approved' ? 'text-emerald-400' : 'text-red-400'}`}>
                          {status === 'approved' ? 'APPROVED' : 'DECLINED'}
                        </p>
                      </div>
                    )}
                  </article>
                );
              })
            ) : activeTab === 'resolved' ? (
              resolvedPOs.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-600 py-8">
                  <CheckCircle className="w-8 h-8 mb-2 opacity-30" />
                  <p className="text-xs">No resolved orders yet</p>
                </div>
              ) : (
                resolvedPOs.map((rpo, i) => (
                  <div key={i} className={`rounded-xl p-4 border ${rpo.approved ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-red-500/5 border-red-500/20'}`}>
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-xs text-gray-400 uppercase tracking-wider">
                          {rpo.approved ? 'APPROVED' : 'DECLINED'}
                        </p>
                        <h4 className="text-sm font-semibold text-white mt-0.5">{rpo.item_name}</h4>
                      </div>
                      <span className={`text-sm font-mono font-bold ${rpo.approved ? 'text-emerald-400' : 'text-red-400 line-through'}`}>
                        ₹{rpo.total_cost.toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))
              )
            ) : (
              pendingPOs.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-600 py-8">
                  <CheckCircle className="w-8 h-8 mb-2 opacity-30" />
                  <p className="text-xs">Queue is clear</p>
                </div>
              ) : (
                pendingPOs.map((po) => (
                  <div key={po.thread_id} className="rounded-xl border border-amber-500/20 bg-gradient-to-br from-amber-500/5 to-transparent overflow-hidden">
                    {/* Card Header */}
                    <div className="p-4 pb-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-[10px] text-amber-400/80 uppercase tracking-wider font-semibold flex items-center gap-1">
                            <FileText className="w-3 h-3" /> SUPPLY REORDER PO
                          </p>
                          <h4 className="text-sm font-bold text-white mt-1">
                            Approve Purchase Order ({po.draft_po?.supplier_id || po.draft_po?.supplier_name || 'Unknown'})
                          </h4>
                        </div>
                        <span className="text-base font-bold font-mono text-white">
                          ₹{(po.draft_po?.total_cost || 0).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 mt-2 leading-relaxed">
                        {po.draft_po?.reasoning || po.draft_po?.justification || `Stock for '${po.item_name}' fell below safety index. Replenishment order created.`}
                        {po.draft_po?.total_cost ? ` | Total: ₹${po.draft_po.total_cost.toLocaleString()}` : ''}
                      </p>
                    </div>

                    {/* Card Footer */}
                    <div className="flex items-center justify-between px-4 py-3 border-t border-white/5 bg-black/20">
                      <span className="text-[10px] text-gray-500 font-mono">
                        Created: {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }).toLowerCase()}
                      </span>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleApprove(po.thread_id, false)}
                          disabled={loading}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-medium hover:bg-red-500/20 transition-all disabled:opacity-50"
                        >
                          <XCircle className="w-3.5 h-3.5" /> Decline
                        </button>
                        <button
                          onClick={() => handleApprove(po.thread_id, true)}
                          disabled={loading}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-xs font-medium hover:bg-emerald-500/30 transition-all disabled:opacity-50"
                        >
                          <CheckCircle className="w-3.5 h-3.5" /> Approve Clear
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
