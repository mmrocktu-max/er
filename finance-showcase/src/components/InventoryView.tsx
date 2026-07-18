/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { mockInventory } from '../data';
import { InventoryItem } from '../types';
import { 
  Search, ShieldAlert, Cpu, Award, Key, MapPin, 
  Settings, Layers, CheckCircle2, AlertCircle, Wrench 
} from 'lucide-react';

export default function InventoryView() {
  const containerRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');

  // Filter items
  const filteredInventory = mockInventory.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase()) ||
                          item.branch.toLowerCase().includes(search.toLowerCase()) ||
                          item.serialNumber.toLowerCase().includes(search.toLowerCase());
    
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
    const matchesStatus = selectedStatus === 'All' || item.status === selectedStatus;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  useEffect(() => {
    // Run stagger entry animation whenever filtering updates
    const ctx = gsap.context(() => {
      if (gridRef.current && filteredInventory.length > 0) {
        // Clear any prior inline styles
        gsap.killTweensOf(gridRef.current.children);
        
        gsap.fromTo(
          gridRef.current.children,
          { opacity: 0, scale: 0.9, y: 30 },
          { 
            opacity: 1, 
            scale: 1, 
            y: 0, 
            duration: 0.6, 
            stagger: 0.08, 
            ease: 'power3.out' 
          }
        );
      }
    }, containerRef);

    return () => ctx.revert();
  }, [selectedCategory, selectedStatus, search]);

  const getCategoryIcon = (category: string) => {
    const iconClass = "w-5 h-5 text-violet-400";
    switch (category) {
      case 'Hardware': return <Cpu className={iconClass} />;
      case 'License': return <Key className={iconClass} />;
      case 'Document': return <Award className={iconClass} />;
      default: return <Layers className={iconClass} />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Active':
        return (
          <span className="flex items-center gap-1 text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full font-medium">
            <CheckCircle2 className="w-3 h-3" /> Fully Operational
          </span>
        );
      case 'Under Maintenance':
        return (
          <span className="flex items-center gap-1 text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-full font-medium">
            <Wrench className="w-3 h-3 animate-pulse" /> Maintenance Mode
          </span>
        );
      case 'In Storage':
        return (
          <span className="flex items-center gap-1 text-[10px] bg-sky-500/10 text-sky-400 border border-sky-500/20 px-2 py-0.5 rounded-full font-medium">
            <AlertCircle className="w-3 h-3" /> Vault Secure Storage
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div 
      ref={containerRef} 
      id="inventory-container"
      className="flex-1 flex flex-col gap-6 p-6 sm:p-8 max-w-7xl mx-auto w-full z-10 select-none overflow-y-auto"
    >
      {/* Title Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4" id="inventory-header">
        <div>
          <h2 className="text-2xl sm:text-3xl font-display font-bold text-white tracking-tight" id="inventory-title">
            Asset & Branch Inventory
          </h2>
          <p className="text-xs sm:text-sm text-gray-400 mt-1" id="inventory-subtitle">
            Cryptographic HSM units, software routing nodes, and branch hardware records.
          </p>
        </div>

        {/* Global physical check seal */}
        <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-3.5 py-1.5 rounded-full text-xs text-gray-300 self-start md:self-auto" id="inventory-seal">
          <Settings className="w-4 h-4 text-violet-400 animate-spin" style={{ animationDuration: '6s' }} />
          <span>SOC-2 physical audit synced: Today</span>
        </div>
      </div>

      {/* Filtering Row */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-4 glass-panel rounded-2xl" id="filtering-panel">
        {/* Search Bar */}
        <div className="relative flex-1 max-w-md" id="search-input-wrapper">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by serial, asset name, office location..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            id="inventory-search-field"
            className="w-full bg-black/40 border border-white/10 hover:border-white/20 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-gray-500 outline-none transition-all"
          />
        </div>

        {/* Filter Selection Tabs */}
        <div className="flex flex-wrap items-center gap-4" id="filter-selection-tabs">
          {/* Category Filters */}
          <div className="flex items-center gap-1.5 bg-black/30 p-1 rounded-xl border border-white/5" id="category-chips">
            {['All', 'Hardware', 'License', 'Document'].map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                id={`category-chip-${cat.toLowerCase()}`}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-all ${
                  selectedCategory === cat 
                    ? 'bg-violet-600 text-white font-semibold shadow-md' 
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Status Filters */}
          <div className="flex items-center gap-1.5 bg-black/30 p-1 rounded-xl border border-white/5" id="status-chips">
            {['All', 'Active', 'Under Maintenance', 'In Storage'].map((stat) => (
              <button
                key={stat}
                onClick={() => setSelectedStatus(stat)}
                id={`status-chip-${stat.replace(/\s+/g, '-').toLowerCase()}`}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-all ${
                  selectedStatus === stat 
                    ? 'bg-pink-600 text-white font-semibold shadow-md' 
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {stat === 'All' ? 'All Status' : stat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Grid of Inventory cards */}
      {filteredInventory.length > 0 ? (
        <div 
          ref={gridRef} 
          id="inventory-cards-grid"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
        >
          {filteredInventory.map((item) => (
            <div
              key={item.id}
              id={`inventory-card-${item.id}`}
              className="glass-panel p-5 rounded-2xl flex flex-col justify-between border border-white/10 hover:border-violet-500/30 hover:scale-[1.02] hover:shadow-[0_0_20px_rgba(139,92,246,0.15)] cursor-pointer transition-all duration-300 relative overflow-hidden group"
            >
              {/* Top Row with Category icon and ID */}
              <div className="flex justify-between items-center mb-4" id="card-top-row">
                <div className="flex items-center gap-2.5" id="category-group">
                  <div className="p-2 bg-white/5 rounded-xl border border-white/10 group-hover:bg-violet-500/10 group-hover:border-violet-500/20 transition-colors" id="icon-container">
                    {getCategoryIcon(item.category)}
                  </div>
                  <span className="text-xs font-semibold text-gray-400 tracking-wider uppercase">{item.category}</span>
                </div>
                <span className="text-[10px] font-mono font-bold px-2 py-1 bg-black/50 rounded-md border border-white/5 text-gray-400" id="item-id-badge">
                  {item.id}
                </span>
              </div>

              {/* Main Info */}
              <div className="mb-5" id="card-main-info">
                <h3 className="text-base sm:text-lg font-display font-bold text-white tracking-tight group-hover:text-violet-400 transition-colors" id="item-name">
                  {item.name}
                </h3>
                
                {/* Office Location */}
                <div className="flex items-center gap-1.5 text-xs text-gray-400 mt-2" id="location-info">
                  <MapPin className="w-3.5 h-3.5 text-pink-400" />
                  <span>{item.branch}</span>
                </div>
              </div>

              {/* Details and Status */}
              <div className="pt-4 border-t border-white/10 flex items-center justify-between gap-4 mt-auto" id="card-footer-details">
                <div className="flex flex-col gap-1" id="serial-value-group">
                  <span className="text-[9px] font-mono tracking-wider text-gray-500 uppercase">Serial: {item.serialNumber}</span>
                  <span className="text-sm font-semibold text-white font-mono">
                    {item.value > 0 ? `$${item.value.toLocaleString()}` : 'Non-monetary asset'}
                  </span>
                </div>
                <div id="status-badge-wrapper">
                  {getStatusBadge(item.status)}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="flex-1 flex flex-col items-center justify-center py-20 glass-panel rounded-2xl gap-4 text-center p-6" id="empty-inventory-state">
          <ShieldAlert className="w-12 h-12 text-pink-500 animate-pulse" />
          <div id="empty-state-text">
            <h3 className="font-display font-bold text-lg text-white">No Assets Found</h3>
            <p className="text-xs text-gray-400 mt-1 max-w-sm">No branch hardware, licenses, or certification documents match your current filtering configuration.</p>
          </div>
          <button
            onClick={() => {
              setSearch('');
              setSelectedCategory('All');
              setSelectedStatus('All');
            }}
            id="clear-filters-button"
            className="px-4 py-2 bg-white/5 border border-white/10 hover:bg-white/10 text-xs font-semibold rounded-xl text-white transition-all cursor-pointer"
          >
            Clear Search & Filters
          </button>
        </div>
      )}
    </div>
  );
}
