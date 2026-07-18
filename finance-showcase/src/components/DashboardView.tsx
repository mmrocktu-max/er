/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { 
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell
} from 'recharts';
import { 
  mockMetrics, chartRevenueData, chartCategoryData 
} from '../data';
import { 
  TrendingUp, TrendingDown, ArrowUpRight, DollarSign, 
  Activity, Wallet, Cpu, Percent 
} from 'lucide-react';

export default function DashboardView() {
  const containerRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<HTMLDivElement>(null);

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
        // Strip non-numerical parts for counting
        const isPercentage = rawTarget.includes('%');
        const numericTarget = parseFloat(rawTarget.replace(/[^0-9.]/g, ''));
        
        const countObj = { value: 0 };
        gsap.to(countObj, {
          value: numericTarget,
          duration: 1.5,
          delay: 0.2,
          ease: 'power2.out',
          onUpdate: () => {
            if (isPercentage) {
              counter.textContent = countObj.value.toFixed(2) + '%';
            } else {
              // Format as Currency
              counter.textContent = '$' + countObj.value.toLocaleString(undefined, {
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
        <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-3 py-1.5 rounded-full text-xs text-white" id="live-indicator-pill">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" id="dot" />
          <span>LIVE RESERVES SYSTEM</span>
        </div>
      </div>

      {/* Bento Grid Metrics Row */}
      <div 
        ref={cardsRef} 
        id="metric-cards-grid"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {mockMetrics.map((metric) => (
          <div
            key={metric.id}
            id={`metric-card-${metric.id}`}
            className="glass-panel p-5 rounded-2xl flex flex-col justify-between hover:border-violet-500/30 transition-all duration-300 group cursor-pointer relative overflow-hidden"
          >
            {/* Ambient hover glowing dot */}
            <div className="absolute -right-12 -top-12 w-24 h-24 bg-violet-600/10 rounded-full blur-2xl group-hover:bg-violet-600/20 transition-all duration-300" />
            
            <div className="flex justify-between items-start mb-3" id="metric-header">
              <span className="text-xs font-semibold tracking-wider text-gray-400 uppercase">{metric.title}</span>
              <div className="p-2 bg-white/5 border border-white/10 rounded-xl group-hover:scale-110 transition-transform duration-300">
                {getMetricIcon(metric.id)}
              </div>
            </div>

            <div className="mt-2" id="metric-body">
              <span 
                className="metric-counter text-xl sm:text-2xl font-bold font-display text-white tracking-tight"
                data-target={metric.value}
              >
                $0.00
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
        ))}
      </div>

      {/* Main Charts Row */}
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
              <p className="text-xs text-gray-400" id="revenue-chart-subtitle">Historical clearance values indexed in millions USD.</p>
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
                  tickFormatter={(value) => `$${value}M`}
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
                  formatter={(value: any) => [`$${value}M`]}
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

        {/* Asset Distribution BarChart Container */}
        <div 
          id="asset-distribution-card"
          className="glass-panel p-6 rounded-2xl flex flex-col justify-between"
        >
          <div className="mb-6" id="distribution-header">
            <h3 className="font-display font-semibold text-lg text-white" id="distribution-title">Clearance Channels</h3>
            <p className="text-xs text-gray-400" id="distribution-subtitle">Active routing channels by total value.</p>
          </div>

          <div className="h-[200px] w-full" id="distribution-chart-wrapper">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartCategoryData}
                layout="vertical"
                margin={{ top: 0, right: 10, left: 10, bottom: 0 }}
              >
                <XAxis type="number" hide />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  hide
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
                  formatter={(value: any) => [`$${(value / 1000000).toFixed(2)}M`]}
                />
                <Bar 
                  dataKey="value" 
                  radius={[0, 8, 8, 0]}
                  barSize={12}
                >
                  {chartCategoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* List Legends mapping colors */}
          <div className="flex flex-col gap-2.5 mt-4" id="distribution-legend-list">
            {chartCategoryData.map((item, idx) => (
              <div key={idx} className="flex justify-between items-center text-xs" id={`legend-item-${idx}`}>
                <div className="flex items-center gap-2" id="legend-label">
                  <span 
                    className="w-2.5 h-2.5 rounded-full inline-block" 
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-gray-300 font-medium">{item.name}</span>
                </div>
                <span className="text-white font-semibold font-mono">
                  ${(item.value / 1000000).toFixed(2)}M
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
