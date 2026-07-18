/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { mockTransactions } from '../data';
import { Transaction } from '../types';
import { 
  Search, ShieldCheck, ArrowDownCircle, ArrowUpCircle, 
  Plus, CheckCircle2, AlertCircle, RefreshCw, X, DollarSign,
  TrendingUp, TrendingDown, ClipboardList
} from 'lucide-react';

export default function LedgerView() {
  const containerRef = useRef<HTMLDivElement>(null);
  const tableRef = useRef<HTMLTableSectionElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const summaryRef = useRef<HTMLDivElement>(null);

  const [transactions, setTransactions] = useState<Transaction[]>(mockTransactions);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  
  // Modal states for adding transaction
  const [isOpen, setIsOpen] = useState(false);
  const [descInput, setDescInput] = useState('');
  const [catInput, setCatInput] = useState<'Revenue' | 'Expense' | 'Transfer' | 'Audit'>('Revenue');
  const [amountInput, setAmountInput] = useState('');
  const [statusInput, setStatusInput] = useState<'Completed' | 'Pending' | 'Failed'>('Completed');

  // Filter transactions
  const filteredTransactions = transactions.filter(t => {
    const matchesSearch = t.description.toLowerCase().includes(search.toLowerCase()) ||
                          t.id.toLowerCase().includes(search.toLowerCase()) ||
                          t.reference.toLowerCase().includes(search.toLowerCase());
    
    const matchesCategory = selectedCategory === 'All' || t.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  // Totals calculations
  const totalInflow = filteredTransactions
    .filter(t => t.category === 'Revenue')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalOutflow = filteredTransactions
    .filter(t => t.category === 'Expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalPending = filteredTransactions
    .filter(t => t.status === 'Pending')
    .reduce((sum, t) => sum + t.amount, 0);

  useEffect(() => {
    // Stagger animate table rows on load and on filtering change
    const ctx = gsap.context(() => {
      if (tableRef.current && filteredTransactions.length > 0) {
        gsap.killTweensOf(tableRef.current.children);
        gsap.fromTo(
          tableRef.current.children,
          { opacity: 0, y: 15 },
          { 
            opacity: 1, 
            y: 0, 
            duration: 0.4, 
            stagger: 0.05, 
            ease: 'power2.out' 
          }
        );
      }

      // Live summary numbers counter ticks
      const summaries = document.querySelectorAll('.summary-counter');
      summaries.forEach((sum) => {
        const rawTarget = sum.getAttribute('data-target') || '0';
        const targetValue = parseFloat(rawTarget);
        const countObj = { value: 0 };
        gsap.to(countObj, {
          value: targetValue,
          duration: 1,
          ease: 'power2.out',
          onUpdate: () => {
            sum.textContent = '$' + countObj.value.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            });
          }
        });
      });
    }, containerRef);

    return () => ctx.revert();
  }, [selectedCategory, search, transactions]);

  // Handle Add Transaction Submit
  const handleAddTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!descInput || !amountInput) return;

    const numericAmount = parseFloat(amountInput);
    if (isNaN(numericAmount)) return;

    const randIdNum = Math.floor(1000 + Math.random() * 9000);
    const randRefNum = Math.floor(100000 + Math.random() * 900000);

    const newTx: Transaction = {
      id: `TX-${randIdNum}`,
      date: new Date().toISOString().split('T')[0],
      description: descInput,
      category: catInput,
      amount: numericAmount,
      status: statusInput,
      reference: `REF-${randRefNum}`
    };

    // Prepend to top of array
    setTransactions(prev => [newTx, ...prev]);

    // Close modal with animations
    closeModal();

    // Reset inputs
    setDescInput('');
    setAmountInput('');
    setCatInput('Revenue');
    setStatusInput('Completed');
  };

  const openModal = () => {
    setIsOpen(true);
    gsap.fromTo(
      modalRef.current,
      { opacity: 0, scale: 0.95, y: 50 },
      { opacity: 1, scale: 1, y: 0, duration: 0.4, ease: 'back.out(1.2)' }
    );
  };

  const closeModal = () => {
    gsap.to(modalRef.current, {
      opacity: 0,
      scale: 0.95,
      y: 50,
      duration: 0.3,
      ease: 'power2.in',
      onComplete: () => setIsOpen(false)
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Completed': return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />;
      case 'Pending': return <RefreshCw className="w-3.5 h-3.5 text-amber-400 animate-spin" />;
      case 'Failed': return <AlertCircle className="w-3.5 h-3.5 text-rose-400" />;
      default: return null;
    }
  };

  const getCategoryClass = (category: string) => {
    switch (category) {
      case 'Revenue': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'Expense': return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
      case 'Transfer': return 'bg-sky-500/10 text-sky-400 border-sky-500/20';
      case 'Audit': return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
      default: return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
    }
  };

  return (
    <div 
      ref={containerRef} 
      id="ledger-container"
      className="flex-1 flex flex-col gap-6 p-6 sm:p-8 max-w-7xl mx-auto w-full z-10 select-none overflow-y-auto"
    >
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4" id="ledger-header">
        <div>
          <h2 className="text-2xl sm:text-3xl font-display font-bold text-white tracking-tight" id="ledger-title">
            Financial Ledger
          </h2>
          <p className="text-xs sm:text-sm text-gray-400 mt-1" id="ledger-subtitle">
            Immutable double-entry book ledger checking global clearing values.
          </p>
        </div>

        <button
          onClick={openModal}
          id="add-transaction-button"
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-500 hover:to-pink-500 text-white font-semibold text-xs rounded-xl shadow-md transition-all self-start md:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add Transaction</span>
        </button>
      </div>

      {/* Numerical Summary Row */}
      <div 
        ref={summaryRef}
        id="summary-row-grid"
        className="grid grid-cols-1 sm:grid-cols-3 gap-4"
      >
        {/* Total Inflow Summary Card */}
        <div className="glass-panel p-4 rounded-xl flex items-center justify-between" id="summary-card-inflow">
          <div id="card-label">
            <span className="text-[10px] font-semibold text-gray-400 tracking-wider uppercase">Active Inflow</span>
            <h4 
              className="summary-counter text-xl font-bold text-emerald-400 font-mono mt-1"
              data-target={totalInflow}
            >
              $0.00
            </h4>
          </div>
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl" id="icon-wrapper">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>

        {/* Total Outflow Summary Card */}
        <div className="glass-panel p-4 rounded-xl flex items-center justify-between" id="summary-card-outflow">
          <div id="card-label">
            <span className="text-[10px] font-semibold text-gray-400 tracking-wider uppercase">Active Outflow</span>
            <h4 
              className="summary-counter text-xl font-bold text-rose-400 font-mono mt-1"
              data-target={totalOutflow}
            >
              $0.00
            </h4>
          </div>
          <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl" id="icon-wrapper">
            <TrendingDown className="w-5 h-5" />
          </div>
        </div>

        {/* Pending Clearance Summary Card */}
        <div className="glass-panel p-4 rounded-xl flex items-center justify-between" id="summary-card-pending">
          <div id="card-label">
            <span className="text-[10px] font-semibold text-gray-400 tracking-wider uppercase">Pending Verification</span>
            <h4 
              className="summary-counter text-xl font-bold text-amber-400 font-mono mt-1"
              data-target={totalPending}
            >
              $0.00
            </h4>
          </div>
          <div className="p-3 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-xl" id="icon-wrapper">
            <RefreshCw className="w-5 h-5 animate-spin" style={{ animationDuration: '4s' }} />
          </div>
        </div>
      </div>

      {/* Table Filters Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 glass-panel rounded-2xl" id="ledger-filters-panel">
        <div className="relative flex-1 max-w-sm" id="ledger-search-wrapper">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search transactions, reference ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            id="ledger-search-field"
            className="w-full bg-black/40 border border-white/10 hover:border-white/20 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-gray-500 outline-none transition-all"
          />
        </div>

        {/* Category Chip Selector */}
        <div className="flex items-center gap-1 bg-black/30 p-1 rounded-xl border border-white/5 overflow-x-auto self-start sm:self-auto" id="ledger-category-tabs">
          {['All', 'Revenue', 'Expense', 'Transfer', 'Audit'].map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              id={`ledger-cat-tab-${cat.toLowerCase()}`}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-all ${
                selectedCategory === cat 
                  ? 'bg-violet-600 text-white font-semibold' 
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Ledger Table Panel */}
      <div className="glass-panel rounded-2xl overflow-hidden border border-white/10" id="ledger-table-card">
        <div className="overflow-x-auto" id="ledger-scrollable-container">
          <table className="w-full border-collapse text-left text-xs sm:text-sm text-gray-300" id="transactions-table">
            <thead>
              <tr className="border-b border-white/10 bg-black/30 text-gray-400 text-[10px] tracking-wider font-bold uppercase" id="table-head-row">
                <th className="p-4 sm:p-5">TX_ID</th>
                <th className="p-4 sm:p-5">Date</th>
                <th className="p-4 sm:p-5">Description</th>
                <th className="p-4 sm:p-5">Category</th>
                <th className="p-4 sm:p-5">Amount</th>
                <th className="p-4 sm:p-5">Status</th>
                <th className="p-4 sm:p-5">Cryptographic Hash</th>
              </tr>
            </thead>
            <tbody ref={tableRef} className="divide-y divide-white/5 font-mono" id="table-body">
              {filteredTransactions.length > 0 ? (
                filteredTransactions.map((tx) => (
                  <tr 
                    key={tx.id} 
                    id={`transaction-row-${tx.id}`}
                    className="hover:bg-white/5 transition-colors group"
                  >
                    <td className="p-4 sm:p-5 font-semibold text-white">{tx.id}</td>
                    <td className="p-4 sm:p-5 text-gray-400">{tx.date}</td>
                    <td className="p-4 sm:p-5 text-gray-300 font-sans max-w-xs truncate group-hover:text-white transition-colors">{tx.description}</td>
                    <td className="p-4 sm:p-5">
                      <span className={`px-2 py-1 text-[10px] font-bold rounded-md border ${getCategoryClass(tx.category)}`}>
                        {tx.category}
                      </span>
                    </td>
                    <td className={`p-4 sm:p-5 font-bold ${
                      tx.category === 'Revenue' ? 'text-emerald-400' :
                      tx.category === 'Expense' ? 'text-rose-400' : 'text-gray-300'
                    }`}>
                      {tx.amount > 0 ? `$${tx.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : '—'}
                    </td>
                    <td className="p-4 sm:p-5">
                      <div className="flex items-center gap-1.5" id="tx-status">
                        {getStatusIcon(tx.status)}
                        <span className="text-[11px] font-medium font-sans">{tx.status}</span>
                      </div>
                    </td>
                    <td className="p-4 sm:p-5 text-gray-500 text-[10px] truncate max-w-[120px]" title={tx.reference}>
                      {tx.reference}
                    </td>
                  </tr>
                ))
              ) : (
                <tr id="empty-ledger-row">
                  <td colSpan={7} className="p-10 text-center text-gray-500 font-sans">
                    No transactions match current query.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Slide up Add Transaction Modal */}
      {isOpen && (
        <div 
          id="modal-overlay"
          className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 z-50 overflow-y-auto"
        >
          <div
            ref={modalRef}
            id="modal-box"
            className="w-full max-w-md bg-[#0c0a1a] border border-white/10 rounded-2xl p-6 shadow-2xl flex flex-col gap-5 relative"
          >
            <button
              onClick={closeModal}
              id="close-modal-button"
              className="absolute right-4 top-4 text-gray-400 hover:text-white p-1 rounded-full hover:bg-white/5 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="border-b border-white/5 pb-3" id="modal-header">
              <h3 className="text-lg font-display font-bold text-white flex items-center gap-2" id="modal-title">
                <ClipboardList className="w-5 h-5 text-violet-400" />
                <span>Register Ledger Inflow/Outflow</span>
              </h3>
              <p className="text-[11px] text-gray-400 mt-1">Submit new verified ledger balance transaction.</p>
            </div>

            <form onSubmit={handleAddTransaction} className="flex flex-col gap-4 text-xs" id="add-transaction-form">
              <div id="field-desc">
                <label className="text-gray-400 font-semibold mb-1 block">Description</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. EMEA Inter-vault Liquidity Settlement"
                  value={descInput}
                  onChange={(e) => setDescInput(e.target.value)}
                  id="desc-input-field"
                  className="w-full bg-black/40 border border-white/10 focus:border-violet-500 rounded-xl px-3.5 py-2.5 text-white outline-none transition-colors placeholder-gray-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-4" id="row-cat-amount">
                <div id="field-cat">
                  <label className="text-gray-400 font-semibold mb-1 block">Category</label>
                  <select
                    value={catInput}
                    onChange={(e) => setCatInput(e.target.value as any)}
                    id="category-select-field"
                    className="w-full bg-black/40 border border-white/10 focus:border-violet-500 rounded-xl px-3 py-2.5 text-white outline-none transition-colors cursor-pointer"
                  >
                    <option value="Revenue">Revenue</option>
                    <option value="Expense">Expense</option>
                    <option value="Transfer">Transfer</option>
                    <option value="Audit">Audit</option>
                  </select>
                </div>

                <div id="field-amount">
                  <label className="text-gray-400 font-semibold mb-1 block">Amount ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="e.g. 145000"
                    value={amountInput}
                    onChange={(e) => setAmountInput(e.target.value)}
                    id="amount-input-field"
                    className="w-full bg-black/40 border border-white/10 focus:border-violet-500 rounded-xl px-3.5 py-2.5 text-white outline-none transition-colors placeholder-gray-600"
                  />
                </div>
              </div>

              <div id="field-status">
                <label className="text-gray-400 font-semibold mb-1 block">Audit Status</label>
                <div className="flex gap-2" id="status-toggle-group">
                  {(['Completed', 'Pending', 'Failed'] as const).map((status) => (
                    <button
                      key={status}
                      type="button"
                      onClick={() => setStatusInput(status)}
                      id={`status-toggle-button-${status.toLowerCase()}`}
                      className={`flex-1 py-2 rounded-xl border font-semibold cursor-pointer transition-all ${
                        statusInput === status 
                          ? 'bg-violet-600 border-violet-500 text-white' 
                          : 'bg-black/30 border-white/5 text-gray-400 hover:text-white'
                      }`}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 pt-2" id="modal-actions">
                <button
                  type="button"
                  onClick={closeModal}
                  id="cancel-submit-button"
                  className="flex-1 py-2.5 bg-white/5 border border-white/10 text-gray-300 hover:text-white rounded-xl font-semibold hover:bg-white/10 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  id="confirm-submit-button"
                  className="flex-1 py-2.5 bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-500 hover:to-pink-500 text-white font-semibold rounded-xl transition-all cursor-pointer shadow-md"
                >
                  Commit Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
