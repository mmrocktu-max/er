/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { mockWorkflowNodes } from '../data';
import { WorkflowNode } from '../types';
import { 
  Play, RotateCcw, Cable, Cpu, KeyRound, 
  Database, CheckCircle2, AlertCircle, RefreshCw,
  Clock, ArrowRight, ShieldCheck, Sliders, Info, Search, Send
} from 'lucide-react';

export default function WorkflowView() {
  const containerRef = useRef<HTMLDivElement>(null);
  const nodesRef = useRef<HTMLDivElement>(null);
  
  // Pipeline nodes and interactive states
  const [nodes, setNodes] = useState<WorkflowNode[]>(mockWorkflowNodes);
  const [selectedNodeId, setSelectedNodeId] = useState<string>('procurement');

  // Interactive parameter state
  const [currentStock, setCurrentStock] = useState<number>(5);
  const [reorderThreshold, setReorderThreshold] = useState<number>(20);
  const [reorderQty, setReorderQty] = useState<number>(25);
  const unitCost = 24.00; // Fixed unit cost for SKU-99
  const totalCost = reorderQty * unitCost;
  const requiresApproval = totalCost > 500;

  // Active LangGraph AgentState simulation representation
  const [agentState, setAgentState] = useState({
    branch_id: 'branch_123',
    item_id: 'SKU-99',
    current_stock: 5,
    reorder_threshold: 20,
    proposed_po: null as any,
    requires_approval: false,
    approval_status: null as 'APPROVED' | 'REJECTED' | null,
    recommended_price: null as number | null,
    pricing_reason: null as string | null,
    ledger_updated: false
  });

  // Flow simulation controls
  const [simStatus, setSimStatus] = useState<'idle' | 'running_procurement' | 'paused_hitl' | 'running_pricing' | 'running_finance' | 'completed' | 'rejected'>('idle');
  const lineRefs = useRef<{ [key: string]: SVGPathElement | null }>({});
  const activeTimeline = useRef<gsap.core.Timeline | null>(null);

  // Sync state values with parameters when idle
  useEffect(() => {
    if (simStatus === 'idle') {
      setAgentState(prev => ({
        ...prev,
        current_stock: currentStock,
        reorder_threshold: reorderThreshold,
        requires_approval: reorderQty * unitCost > 500,
        proposed_po: null,
        approval_status: null,
        recommended_price: null,
        pricing_reason: null,
        ledger_updated: false
      }));
    }
  }, [currentStock, reorderThreshold, reorderQty, simStatus]);

  // Entrance animations
  useEffect(() => {
    const ctx = gsap.context(() => {
      if (nodesRef.current) {
        gsap.fromTo(
          nodesRef.current.children,
          { opacity: 0, scale: 0.95, y: 15 },
          { 
            opacity: 1, 
            scale: 1, 
            y: 0, 
            duration: 0.5, 
            stagger: 0.1, 
            ease: 'power3.out' 
          }
        );
      }
    }, containerRef);

    animateFlowLines();
    return () => ctx.revert();
  }, []);

  const animateFlowLines = () => {
    for (const key in lineRefs.current) {
      if (Object.prototype.hasOwnProperty.call(lineRefs.current, key)) {
        const line = lineRefs.current[key];
        if (line) {
          gsap.killTweensOf(line);
          gsap.fromTo(
            line,
            { strokeDashoffset: 40 },
            {
              strokeDashoffset: 0,
              duration: 1.4,
              repeat: -1,
              ease: 'none'
            }
          );
        }
      }
    }
  };

  const updateNodeStatus = (id: string, status: 'idle' | 'running' | 'completed' | 'error') => {
    setNodes(prev => prev.map(node => node.id === id ? { ...node, status } : node));
  };

  const pulseLine = (edgeId: string) => {
    const line = lineRefs.current[edgeId];
    if (line) {
      gsap.timeline()
        .to(line, { stroke: '#ec4899', strokeWidth: 4, duration: 0.25 })
        .to(line, { stroke: '#8b5cf6', strokeWidth: 2, duration: 0.45 });
    }
  };

  // Run the LangGraph Multi-Agent simulation flow
  const runSimulation = () => {
    if (simStatus !== 'idle') return;

    // Reset all nodes to idle
    setNodes(prev => prev.map(n => ({ ...n, status: 'idle' as const })));
    
    // Check if reorder is even needed
    if (currentStock >= reorderThreshold) {
      setSimStatus('running_procurement');
      updateNodeStatus('procurement', 'running');
      setSelectedNodeId('procurement');

      const tl = gsap.timeline({
        onComplete: () => {
          setSimStatus('completed');
          updateNodeStatus('procurement', 'completed');
          setAgentState(prev => ({
            ...prev,
            proposed_po: { status: 'NO_REORDER_REQUIRED', reason: 'Current stock is above the reorder threshold. Loop ends gracefully.' }
          }));
        }
      });
      tl.to({}, { duration: 1.5 });
      activeTimeline.current = tl;
      return;
    }

    // Otherwise, start the low stock reorder pipeline
    setSimStatus('running_procurement');
    updateNodeStatus('procurement', 'running');
    setSelectedNodeId('procurement');

    const tl = gsap.timeline();
    activeTimeline.current = tl;

    // Phase 1: Procurement Agent evaluates
    tl.to({}, { duration: 1.6 });
    tl.add(() => {
      updateNodeStatus('procurement', 'completed');
      pulseLine('edge-1');
      
      const draftPo = {
        qty: reorderQty,
        supplier_id: 'SUP-01',
        supplier_name: 'Apex Secure Devices',
        unit_cost: unitCost,
        total_cost: totalCost,
        reason: 'Selected via vector search/RAG on historical vendor logs. Supplier A has a 2-day lead time with 98% quality index.'
      };

      setAgentState(prev => ({
        ...prev,
        proposed_po: draftPo,
        requires_approval: requiresApproval
      }));

      // Move selector and node status to human_review
      setSelectedNodeId('human_review');
      updateNodeStatus('human_review', 'running');

      if (requiresApproval) {
        // Halt at Human Review Breakpoint
        setSimStatus('paused_hitl');
      } else {
        // Auto-approve and jump straight to pricing
        setAgentState(prev => ({ ...prev, approval_status: 'APPROVED' }));
        setSimStatus('running_pricing');
        resumeToPricing();
      }
    });
  };

  // User click - Human Approved PO
  const handleHITLApprove = () => {
    if (simStatus !== 'paused_hitl') return;
    setAgentState(prev => ({ ...prev, approval_status: 'APPROVED' }));
    setSimStatus('running_pricing');
    resumeToPricing();
  };

  // User click - Human Rejected PO
  const handleHITLReject = () => {
    if (simStatus !== 'paused_hitl') return;
    setAgentState(prev => ({ ...prev, approval_status: 'REJECTED' }));
    setSimStatus('rejected');
    updateNodeStatus('human_review', 'error');
  };

  // Resume state machine path towards pricing & finance nodes
  const resumeToPricing = () => {
    updateNodeStatus('human_review', 'completed');
    setSelectedNodeId('pricing');
    updateNodeStatus('pricing', 'running');
    pulseLine('edge-2');

    const tl = gsap.timeline();
    activeTimeline.current = tl;

    // Phase 3: Pricing Agent Node
    tl.to({}, { duration: 1.8 });
    tl.add(() => {
      updateNodeStatus('pricing', 'completed');
      pulseLine('edge-3');
      setSelectedNodeId('finance');
      updateNodeStatus('finance', 'running');

      const recommendedPrice = 45.00;
      const pricingReason = 'Live occupancy/demand metrics at 85% capacity triggers a premium margin factor on top of the $24.00 unit cost.';

      setAgentState(prev => ({
        ...prev,
        recommended_price: recommendedPrice,
        pricing_reason: pricingReason
      }));
    });

    // Phase 4: Finance Agent Node (Deterministic)
    tl.to({}, { duration: 1.5 });
    tl.add(() => {
      updateNodeStatus('finance', 'completed');
      setSimStatus('completed');
      setAgentState(prev => ({
        ...prev,
        ledger_updated: true
      }));
    });
  };

  const resetWorkflow = () => {
    if (activeTimeline.current) {
      activeTimeline.current.kill();
    }
    setNodes(mockWorkflowNodes.map(n => ({ ...n, status: 'idle' as const })));
    setSelectedNodeId('procurement');
    setSimStatus('idle');
    setAgentState({
      branch_id: 'branch_123',
      item_id: 'SKU-99',
      current_stock: currentStock,
      reorder_threshold: reorderThreshold,
      proposed_po: null,
      requires_approval: reorderQty * unitCost > 500,
      approval_status: null,
      recommended_price: null,
      pricing_reason: null,
      ledger_updated: false
    });
    animateFlowLines();
  };

  const getNodeIcon = (iconName: string, status: string) => {
    let iconClass = 'w-6 h-6 ';
    if (status === 'running') {
      iconClass += 'animate-spin text-pink-400';
    } else if (status === 'completed') {
      iconClass += 'text-emerald-400';
    } else if (status === 'error') {
      iconClass += 'text-rose-500';
    } else {
      iconClass += 'text-gray-400';
    }

    switch (iconName) {
      case 'Cpu': return <Cpu className={iconClass} />;
      case 'KeyRound': return <KeyRound className={iconClass} />;
      case 'Cable': return <Cable className={iconClass} />;
      case 'Database': return <Database className={iconClass} />;
      default: return <Cpu className={iconClass} />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return (
          <span className="flex items-center gap-1 text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full font-mono">
            COMPLETED
          </span>
        );
      case 'running':
        return (
          <span className="flex items-center gap-1 text-[10px] bg-pink-500/10 text-pink-400 border border-pink-500/20 px-2 py-0.5 rounded-full font-mono animate-pulse">
            EXECUTING
          </span>
        );
      case 'error':
        return (
          <span className="flex items-center gap-1 text-[10px] bg-rose-500/10 text-rose-400 border border-rose-500/20 px-2 py-0.5 rounded-full font-mono">
            REJECTED
          </span>
        );
      case 'idle':
        return (
          <span className="flex items-center gap-1 text-[10px] bg-gray-500/10 text-gray-400 border border-gray-500/10 px-2 py-0.5 rounded-full font-mono">
            IDLE_QUEUE
          </span>
        );
      default:
        return null;
    }
  };

  // Helper to fetch details to show in the detailed sidebar depending on which node is selected
  const getSelectedNodeInfo = () => {
    const node = nodes.find(n => n.id === selectedNodeId) || nodes[0];
    return {
      label: node.label,
      description: node.description,
      status: node.status,
      id: node.id
    };
  };

  const activeNodeInfo = getSelectedNodeInfo();

  return (
    <div 
      ref={containerRef} 
      id="workflow-container"
      className="flex-1 flex flex-col xl:flex-row gap-6 p-4 sm:p-6 max-w-7xl mx-auto w-full z-10 select-none overflow-y-auto"
    >
      {/* Left panel: Pipeline Graph & Simulation Inputs */}
      <div className="flex-1 flex flex-col gap-5" id="pipeline-panel">
        
        {/* Header Block */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-black/60 border border-white/5 p-5 rounded-2xl backdrop-blur-md" id="pipeline-header">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] bg-violet-500/15 text-violet-400 border border-violet-500/35 px-2.5 py-0.5 rounded-full font-mono font-bold uppercase tracking-wider">
                LangGraph State Machine
              </span>
              <span className="text-[10px] bg-pink-500/15 text-pink-400 border border-pink-500/35 px-2.5 py-0.5 rounded-full font-mono font-bold uppercase tracking-wider">
                Postgres Checkpointer
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-display font-bold text-white tracking-tight mt-2" id="pipeline-title">
              Clearance Orchestration Graph
            </h2>
            <p className="text-xs text-gray-400 mt-1" id="pipeline-subtitle">
              Interactive visualization of Procurement, Human review interrupt boundaries, Pricing models, and Ledger updates.
            </p>
          </div>
          
          <div className="flex items-center gap-2" id="pipeline-controls">
            <button
              onClick={runSimulation}
              disabled={simStatus !== 'idle'}
              id="run-simulation-button"
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-violet-600 to-pink-600 disabled:from-gray-800 disabled:to-gray-800 disabled:text-gray-500 hover:from-violet-500 hover:to-pink-500 text-white font-semibold text-xs rounded-xl transition-all shadow-md cursor-pointer shrink-0"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>{simStatus === 'idle' ? 'Run Simulation' : 'Active Run'}</span>
            </button>
            <button
              onClick={resetWorkflow}
              id="reset-workflow-button"
              className="flex items-center justify-center p-2.5 bg-white/5 border border-white/10 text-gray-300 hover:text-white rounded-xl hover:bg-white/10 transition-colors cursor-pointer shrink-0"
              title="Reset Graph States"
            >
              <RotateCcw className="w-4.5 h-4.5" />
            </button>
          </div>
        </div>

        {/* Real-time Configurator Box */}
        <div className="bg-black/40 border border-white/5 p-4 rounded-2xl flex flex-col gap-4" id="sim-parameter-configurator">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-300 uppercase tracking-wider border-b border-white/5 pb-2">
            <Sliders className="w-4 h-4 text-violet-400" />
            <span>Interactive Parameter Inputs (Pre-Run config)</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs" id="configurator-controls">
            {/* Input 1: Current Stock Level */}
            <div className="bg-white/5 border border-white/5 p-3 rounded-xl" id="input-stock-box">
              <div className="flex justify-between items-center mb-2" id="stock-value-group">
                <span className="text-gray-400 font-medium flex items-center gap-1">
                  Current Stock Level (<span className="font-mono text-white">SKU-99</span>)
                </span>
                <span className={`font-mono font-bold px-2 py-0.5 rounded-md text-xs ${currentStock < reorderThreshold ? 'bg-amber-500/10 text-amber-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
                  {currentStock} units
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="40"
                value={currentStock}
                onChange={(e) => setCurrentStock(parseInt(e.target.value))}
                disabled={simStatus !== 'idle'}
                id="current-stock-slider"
                className="w-full accent-violet-500 bg-black/45 h-1.5 rounded-lg cursor-pointer disabled:opacity-40"
              />
              <div className="flex justify-between text-[10px] text-gray-500 mt-1.5" id="stock-bounds-labels">
                <span>0 (Empty)</span>
                <span>Threshold: <strong className="text-violet-400">{reorderThreshold} units</strong></span>
                <span>40 (Max)</span>
              </div>
            </div>

            {/* Input 2: Reorder Quantity */}
            <div className="bg-white/5 border border-white/5 p-3 rounded-xl" id="input-qty-box">
              <div className="flex justify-between items-center mb-2" id="qty-value-group">
                <span className="text-gray-400 font-medium">Reorder Quantity (Target PO)</span>
                <span className="font-mono text-white font-bold">{reorderQty} units</span>
              </div>
              <input
                type="range"
                min="5"
                max="50"
                step="5"
                value={reorderQty}
                onChange={(e) => setReorderQty(parseInt(e.target.value))}
                disabled={simStatus !== 'idle'}
                id="reorder-qty-slider"
                className="w-full accent-pink-500 bg-black/45 h-1.5 rounded-lg cursor-pointer disabled:opacity-40"
              />
              <div className="flex justify-between text-[10px] text-gray-500 mt-1.5" id="qty-bounds-labels">
                <span>5 units</span>
                <span className="font-mono">
                  Draft Cost:{' '}
                  <strong className={totalCost > 500 ? 'text-amber-400' : 'text-emerald-400'}>
                    ${totalCost.toFixed(2)}
                  </strong>
                </span>
                <span>50 units</span>
              </div>
            </div>
          </div>

          {/* Helper Rule Info Banner */}
          <div className="flex items-start gap-2 bg-violet-950/20 border border-violet-500/10 p-2.5 rounded-xl text-[11px] text-gray-400" id="parameter-rule-banner">
            <Info className="w-4 h-4 text-violet-400 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <strong className="text-white">HITL Rules:</strong> If Stock &lt; 20, Procurement compiles a proposed PO. If proposed total cost exceeds <strong className="text-pink-400 font-bold">$500.00</strong> (Draft Cost: ${totalCost.toFixed(2)}), the system triggers a <strong className="text-violet-400">LangGraph interrupt breakpoint</strong> at the human_review node. Otherwise, it auto-approves!
            </p>
          </div>
        </div>

        {/* The Pipeline Node Tree Graph */}
        <div 
          ref={nodesRef} 
          id="pipeline-nodes-wrapper"
          className="flex-1 flex flex-col justify-center gap-7 relative p-5 bg-black/40 border border-white/5 rounded-2xl min-h-[430px]"
        >
          {nodes.map((node, index) => {
            const isSelected = selectedNodeId === node.id;
            return (
              <div key={node.id} className="relative flex flex-col items-center" id={`workflow-node-row-${node.id}`}>
                {/* Node Container Box */}
                <div
                  onClick={() => setSelectedNodeId(node.id)}
                  className={`w-full max-w-lg p-3.5 rounded-xl flex items-center justify-between gap-4 cursor-pointer border transition-all duration-300 relative z-20 ${
                    isSelected 
                      ? 'bg-[#151126] border-violet-500 shadow-[0_0_15px_rgba(139,92,246,0.12)] scale-[1.01]' 
                      : 'bg-black/35 border-white/5 hover:border-white/15'
                  }`}
                  id={`workflow-node-${node.id}`}
                >
                  {/* Left Status Glow Ribbon */}
                  <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-xl ${
                    node.status === 'completed' ? 'bg-emerald-500' :
                    node.status === 'running' ? (simStatus === 'paused_hitl' ? 'bg-amber-500' : 'bg-pink-500 animate-pulse') : 
                    node.status === 'error' ? 'bg-rose-500' : 'bg-gray-800'
                  }`} id="status-glow-strip" />

                  <div className="flex items-center gap-3 pl-2" id="node-info-group">
                    <div className={`p-2 rounded-lg border ${
                      node.status === 'completed' ? 'bg-emerald-500/10 border-emerald-500/20' :
                      node.status === 'running' ? (simStatus === 'paused_hitl' ? 'bg-amber-500/15 border-amber-500/20' : 'bg-pink-500/10 border-pink-500/20') : 
                      node.status === 'error' ? 'bg-rose-500/10 border-rose-500/20' : 'bg-white/5 border-white/5'
                    }`} id="node-icon-box">
                      {getNodeIcon(node.iconName, node.status)}
                    </div>
                    <div id="node-text">
                      <div className="flex items-center gap-1.5">
                        <h4 className="font-semibold text-xs sm:text-sm text-white tracking-tight">{node.label}</h4>
                        <span className="font-mono text-[9px] text-gray-500">[{node.id}]</span>
                      </div>
                      <p className="text-[10px] sm:text-xs text-gray-400 mt-0.5 line-clamp-1">{node.description}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pr-1" id="node-status-group">
                    {getStatusBadge(node.status)}
                  </div>
                </div>

                {/* SVG Connection Arrow down to next node */}
                {index < nodes.length - 1 && (
                  <div className="w-full max-w-lg h-7 relative flex justify-center items-center" id={`edge-connector-${index}`}>
                    <svg className="absolute w-6 h-full overflow-visible" id="connector-svg">
                      <path
                        ref={(el) => { lineRefs.current[`edge-${index + 1}`] = el; }}
                        d="M 12 0 L 12 28"
                        fill="none"
                        stroke={
                          node.status === 'completed' ? '#10b981' : 
                          node.status === 'running' ? '#ec4899' : '#1f2937'
                        }
                        strokeWidth="1.5"
                        strokeDasharray="4,4"
                      />
                      {/* Interactive flowing light particle */}
                      {node.status === 'completed' && (
                        <circle
                          r="2.5"
                          fill="#10b981"
                          style={{
                            offsetPath: "path('M 12 0 L 12 28')",
                            animation: "flow-particle 1.1s infinite linear"
                          }}
                        />
                      )}
                    </svg>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Right panel: LangGraph Living State Inspector & Interactive Overrides */}
      <div 
        id="node-details-panel"
        className="w-full xl:w-[420px] flex flex-col gap-4 bg-black/45 border border-white/5 p-5 rounded-2xl"
      >
        <div className="border-b border-white/5 pb-3" id="details-header">
          <span className="text-[10px] font-bold tracking-widest text-violet-400 uppercase font-mono">
            Active Thread Memory
          </span>
          <h3 className="text-lg font-display font-bold text-white mt-1" id="details-title">
            State Inspector: <span className="text-pink-400 font-mono text-sm">AgentState</span>
          </h3>
          <p className="text-xs text-gray-400 mt-0.5" id="details-desc">
            Represents Python-defined thread state inside PostgreSQL.
          </p>
        </div>

        {/* 1. If paused in Human in the Loop, display the high-priority Decision Card */}
        {simStatus === 'paused_hitl' && (
          <div className="bg-[#1f1610] border border-amber-500/30 p-4 rounded-xl flex flex-col gap-3.5 shadow-2xl animate-fade-in animate-pulse-subtle" id="hitl-action-gate">
            <div className="flex items-center gap-2 text-xs font-bold text-amber-400" id="hitl-alert-label">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
              </span>
              <span className="uppercase tracking-wide font-mono">LANGGRAPH INTERRUPT: human_review</span>
            </div>

            <div className="text-xs text-gray-300" id="hitl-prompt-text">
              <p className="leading-relaxed">
                The transaction graph has halted safely. The <strong className="text-white">Procurement Agent</strong> drafted a purchase order of <strong className="text-pink-400 font-mono">${totalCost.toFixed(2)}</strong> which exceeds the $500 threshold limit.
              </p>
            </div>

            {/* Pydantic Schema Sub-Card */}
            <div className="bg-black/45 border border-white/5 p-3 rounded-lg text-[11px] font-mono flex flex-col gap-1.5 text-gray-300" id="draft-po-detail-fields">
              <div className="flex justify-between text-gray-500 border-b border-white/5 pb-1 mb-1 font-sans text-[10px] uppercase font-bold" id="draft-title">
                <span>Pydantic ProposedPO Schema</span>
                <span className="text-amber-400 font-mono font-normal uppercase">Pending Overrides</span>
              </div>
              <div className="flex justify-between" id="draft-item">
                <span>item_id:</span>
                <span className="text-white font-semibold">SKU-99</span>
              </div>
              <div className="flex justify-between" id="draft-qty">
                <span>quantity:</span>
                <span className="text-white font-semibold">{reorderQty} units</span>
              </div>
              <div className="flex justify-between" id="draft-unit-cost">
                <span>unit_cost:</span>
                <span className="text-white font-semibold">${unitCost.toFixed(2)}</span>
              </div>
              <div className="flex justify-between border-t border-white/5 pt-1.5 mt-0.5 text-xs" id="draft-total">
                <span className="font-semibold text-gray-400">total_cost:</span>
                <span className="text-pink-400 font-bold font-mono">${totalCost.toFixed(2)}</span>
              </div>
              <div className="text-[10px] text-gray-400 leading-relaxed italic border-t border-white/5 pt-1.5 mt-1 font-sans" id="draft-rag">
                <strong>RAG Citation:</strong> Supplier A matches constraints; historical shipping log performance rated 98%.
              </div>
            </div>

            {/* Decision Actions Button Group */}
            <div className="grid grid-cols-2 gap-2 mt-1" id="decision-button-group">
              <button
                onClick={handleHITLApprove}
                id="hitl-approve-button"
                className="py-2 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs cursor-pointer shadow-lg transition-transform active:scale-98"
              >
                Approve PO (Resume)
              </button>
              <button
                onClick={handleHITLReject}
                id="hitl-reject-button"
                className="py-2 rounded-lg border border-rose-500/30 bg-rose-950/15 hover:bg-rose-900/20 text-rose-300 font-semibold text-xs cursor-pointer transition-colors active:scale-98"
              >
                Reject PO
              </button>
            </div>
          </div>
        )}

        {/* 2. live AgentState JSON visualizer */}
        <div className="flex-1 flex flex-col gap-3" id="state-json-visualizer-card">
          <div className="flex items-center justify-between text-[11px] font-semibold text-gray-400 uppercase tracking-wider" id="inspect-title-row">
            <span>Graph Thread Stack State</span>
            <span className="font-mono text-violet-400">thread_id: branch_123_tx_001</span>
          </div>

          <div 
            id="json-output-screen"
            className="flex-1 bg-[#06040a] border border-white/5 p-4 rounded-xl font-mono text-[11px] text-gray-300 overflow-y-auto max-h-[360px]"
          >
            {/* Custom Interactive JSON Viewer layout */}
            <div className="flex flex-col gap-1.5" id="json-block">
              <div><span className="text-gray-500">{'{'}</span></div>
              <div className="pl-4"><span className="text-pink-400">"branch_id"</span><span className="text-gray-400">:</span> <span className="text-emerald-400">"{agentState.branch_id}"</span>,</div>
              <div className="pl-4"><span className="text-pink-400">"item_id"</span><span className="text-gray-400">:</span> <span className="text-emerald-400">"{agentState.item_id}"</span>,</div>
              <div className="pl-4"><span className="text-pink-400">"current_stock"</span><span className="text-gray-400">:</span> <span className="text-amber-400">{agentState.current_stock}</span>,</div>
              <div className="pl-4"><span className="text-pink-400">"reorder_threshold"</span><span className="text-gray-400">:</span> <span className="text-amber-400">{agentState.reorder_threshold}</span>,</div>
              
              {/* proposed_po nested block */}
              <div className="pl-4">
                <span className="text-pink-400">"proposed_po"</span><span className="text-gray-400">:</span> {agentState.proposed_po ? (
                  <span className="text-gray-500">
                    {'{'}
                    <span className="text-gray-400 block pl-4">"qty": <span className="text-amber-400">{agentState.proposed_po.qty}</span>,</span>
                    <span className="text-gray-400 block pl-4">"supplier_id": <span className="text-emerald-400">"{agentState.proposed_po.supplier_id}"</span>,</span>
                    <span className="text-gray-400 block pl-4">"total_cost": <span className="text-pink-400">${agentState.proposed_po.total_cost?.toFixed(2)}</span>,</span>
                    <span className="text-gray-400 block pl-4">"reason": <span className="text-emerald-400">"RAG Match: SUP-01 has 2-day lead..."</span></span>
                    <span className="text-gray-500 pl-4 block">{'}'}</span>
                  </span>
                ) : (
                  <span className="text-gray-500">null</span>
                )},
              </div>

              <div className="pl-4"><span className="text-pink-400">"requires_approval"</span><span className="text-gray-400">:</span> <span className="text-indigo-400">{agentState.requires_approval ? 'true' : 'false'}</span>,</div>
              
              <div className="pl-4">
                <span className="text-pink-400">"approval_status"</span><span className="text-gray-400">:</span> {agentState.approval_status ? (
                  <span className={agentState.approval_status === 'APPROVED' ? 'text-emerald-400 font-bold' : 'text-rose-500 font-bold'}>
                    "{agentState.approval_status}"
                  </span>
                ) : (
                  <span className="text-gray-500">null</span>
                )},
              </div>

              <div className="pl-4">
                <span className="text-pink-400">"recommended_price"</span><span className="text-gray-400">:</span> {agentState.recommended_price ? (
                  <span className="text-emerald-400">${agentState.recommended_price.toFixed(2)}</span>
                ) : (
                  <span className="text-gray-500">null</span>
                )},
              </div>

              <div className="pl-4">
                <span className="text-pink-400">"pricing_reason"</span><span className="text-gray-400">:</span> {agentState.pricing_reason ? (
                  <span className="text-indigo-400">"Premium markup due to 85% bookings"</span>
                ) : (
                  <span className="text-gray-500">null</span>
                )},
              </div>

              <div className="pl-4">
                <span className="text-pink-400">"ledger_updated"</span><span className="text-gray-400">:</span> <span className="text-indigo-400">{agentState.ledger_updated ? 'true' : 'false'}</span></div>
              <div><span className="text-gray-500">{'}'}</span></div>
            </div>
          </div>
        </div>

        {/* 3. Static metadata showing details of selected node */}
        <div className="bg-white/5 border border-white/5 p-4 rounded-xl flex flex-col gap-2 text-xs" id="active-node-details">
          <div className="flex items-center gap-2 border-b border-white/5 pb-2 mb-1" id="active-title-row">
            <span className="text-[10px] font-bold px-2 py-0.5 bg-violet-500/10 text-violet-400 border border-violet-500/20 rounded font-mono">
              ACTIVE_CONTEXT
            </span>
            <span className="text-white font-semibold font-display">{activeNodeInfo.label}</span>
          </div>
          <p className="text-gray-400 text-[11px] leading-relaxed">{activeNodeInfo.description}</p>
          <div className="grid grid-cols-2 gap-2 mt-2 font-mono text-[10px] text-gray-500 bg-black/30 p-2.5 rounded-lg border border-white/5" id="active-meta-rows">
            <div id="meta-executor">
              <span>EXECUTOR:</span>
              <span className="text-white block font-semibold mt-0.5">agent_{activeNodeInfo.id}_v1</span>
            </div>
            <div id="meta-db-mode">
              <span>CHECKPOINTER:</span>
              <span className="text-white block font-semibold mt-0.5">PostgresStore</span>
            </div>
          </div>
        </div>

        {/* Footer Seal */}
        <div className="pt-2" id="details-footer">
          <div className="flex items-center gap-2 text-[10px] text-gray-500" id="integrity-seal">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Cryptographically signed with LangGraph checkpoint certificates.</span>
          </div>
        </div>
      </div>

      {/* CSS for flowing light connection lines */}
      <style>{`
        @keyframes flow-particle {
          0% {
            offsetDistance: 0%;
          }
          100% {
            offsetDistance: 100%;
          }
        }
        .animate-pulse-subtle {
          animation: pulse-subtle 3s infinite alternate;
        }
        @keyframes pulse-subtle {
          0% {
            box-shadow: 0 0 5px rgba(245,158,11,0.05);
          }
          100% {
            box-shadow: 0 0 25px rgba(245,158,11,0.18);
          }
        }
      `}</style>
    </div>
  );
}
