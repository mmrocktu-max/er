import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from 'recharts';
import {
  TrendingUp, TrendingDown, Percent, IndianRupee, FileText
} from 'lucide-react';

interface Transaction {
  id: string;
  date: string;
  branch: string;
  category: 'Sales' | 'Rent' | 'Procurement' | 'Utilities' | 'Payroll';
  description: string;
  amount: number;
}

interface CashFlowPoint {
  name: string;
  balance: number;
}

const MOCK_TRANSACTIONS: Transaction[] = [
  { id: 'TXN-001', date: '14 Jul', branch: 'B2', category: 'Sales', description: 'Batch client fulfillment: Server Blades', amount: 14000 },
  { id: 'TXN-002', date: '14 Jul', branch: 'B1', category: 'Procurement', description: 'Restocked Enterprise AI Laptops (PO approved)', amount: -8500 },
  { id: 'TXN-003', date: '15 Jul', branch: 'B1', category: 'Rent', description: 'Corporate headquarters lease payment', amount: -5000 },
  { id: 'TXN-004', date: '15 Jul', branch: 'B3', category: 'Sales', description: 'Warehouse Robot Arm units sold to logistics partner', amount: 10200 },
  { id: 'TXN-005', date: '15 Jul', branch: 'B2', category: 'Utilities', description: 'Data center power & cooling invoice', amount: -2700 },
  { id: 'TXN-006', date: '16 Jul', branch: 'B3', category: 'Sales', description: 'Advanced Robotics consulting & drone setup', amount: 35000 },
  { id: 'TXN-007', date: '16 Jul', branch: 'B1', category: 'Payroll', description: 'Engineering team bi-weekly payroll', amount: -9000 },
];

const CASH_FLOW_DATA: CashFlowPoint[] = [
  { name: 'Start', balance: 50000 },
  { name: '14 Jul', balance: 55500 },
  { name: '15 Jul', balance: 58000 },
  { name: '16 Jul', balance: 94000 },
];

const getCategoryBadge = (category: string) => {
  switch (category) {
    case 'Sales': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
    case 'Rent': return 'bg-violet-500/20 text-violet-400 border-violet-500/30';
    case 'Procurement': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
    case 'Utilities': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
    case 'Payroll': return 'bg-pink-500/20 text-pink-400 border-pink-500/30';
    default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
  }
};

export default function FinancialLedger() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [transactions] = useState<Transaction[]>(MOCK_TRANSACTIONS);

  const totalRevenue = transactions.filter(t => t.amount > 0).reduce((s, t) => s + t.amount, 0);
  const totalExpenses = Math.abs(transactions.filter(t => t.amount < 0).reduce((s, t) => s + t.amount, 0));
  const netProfit = totalRevenue - totalExpenses;
  const profitMargin = totalRevenue > 0 ? ((netProfit / totalRevenue) * 100) : 0;

  const metrics = [
    {
      label: 'GROSS REVENUE',
      value: `₹${totalRevenue.toLocaleString()}`,
      sub: '+12.4% vs prev week',
      subColor: 'text-emerald-400',
      icon: <TrendingUp className="w-5 h-5 text-emerald-400" />,
      highlight: false,
    },
    {
      label: 'OPERATING EXPENSE',
      value: `₹${totalExpenses.toLocaleString()}`,
      sub: 'Operating expenditures',
      subColor: 'text-gray-500',
      icon: <TrendingDown className="w-5 h-5 text-rose-400" />,
      highlight: false,
    },
    {
      label: 'NET PROFIT',
      value: `₹${netProfit.toLocaleString()}`,
      sub: 'Net income',
      subColor: 'text-gray-500',
      icon: <IndianRupee className="w-5 h-5 text-emerald-400" />,
      highlight: true,
    },
    {
      label: 'PROFIT MARGIN',
      value: `${profitMargin.toFixed(1)}%`,
      sub: 'Margin ratio',
      subColor: 'text-gray-500',
      icon: <Percent className="w-5 h-5 text-violet-400" />,
      highlight: false,
    },
  ];

  // Entry animations
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        containerRef.current?.querySelectorAll('.fl-animate') || [],
        { opacity: 0, y: 25 },
        { opacity: 1, y: 0, duration: 0.7, stagger: 0.1, ease: 'power3.out' }
      );
    }, containerRef);
    return () => ctx.revert();
  }, []);

  return (
    <div
      ref={containerRef}
      id="financial-ledger-container"
      className="flex-1 flex flex-col gap-6 p-6 sm:p-8 max-w-7xl mx-auto w-full z-10 select-none overflow-y-auto"
    >
      {/* Header */}
      <div className="fl-animate flex items-center gap-3">
        <IndianRupee className="w-6 h-6 text-emerald-400" />
        <div>
          <h2 className="text-2xl font-display font-bold text-white tracking-tight">
            FINANCIAL LEDGER
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Track and review transaction history across branches
          </p>
        </div>
      </div>

      {/* Metric Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((m, idx) => (
          <div
            key={idx}
            className={`fl-animate glass-panel rounded-2xl p-5 flex flex-col justify-between relative overflow-hidden transition-all duration-300 ${
              m.highlight
                ? 'border-emerald-500/30 shadow-[0_0_20px_rgba(16,185,129,0.15)]'
                : 'hover:border-violet-500/20'
            }`}
          >
            <div className="flex justify-between items-start mb-3">
              <span className="text-[10px] font-bold tracking-wider text-gray-400 uppercase">{m.label}</span>
              <div className="p-2 bg-white/5 border border-white/10 rounded-xl">
                {m.icon}
              </div>
            </div>
            <div>
              <span className={`text-2xl font-bold font-display tracking-tight ${m.highlight ? 'text-emerald-400' : 'text-white'}`}>
                {m.value}
              </span>
              <p className={`text-xs mt-1 ${m.subColor}`}>{m.sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Cash Flow Balance History Chart */}
      <div className="fl-animate glass-panel rounded-2xl p-6">
        <h3 className="font-display font-semibold text-base text-white mb-4">Cash Flow Balance History</h3>
        <div className="h-[220px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={CASH_FLOW_DATA} margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
              <defs>
                <linearGradient id="cashFlowGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.15} />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="4 4" stroke="rgba(255,255,255,0.04)" />
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
                tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(15, 12, 28, 0.95)',
                  borderColor: 'rgba(255, 255, 255, 0.1)',
                  borderRadius: '12px',
                  color: '#fff',
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '12px',
                }}
                formatter={(value: any) => [`₹${Number(value).toLocaleString()}`, 'Balance']}
              />
              <Line
                type="monotone"
                dataKey="balance"
                stroke="#3b82f6"
                strokeWidth={2.5}
                dot={{ r: 5, fill: '#3b82f6', stroke: '#040209', strokeWidth: 3 }}
                activeDot={{ r: 7, fill: '#60a5fa', stroke: '#040209', strokeWidth: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Transaction History Table */}
      <div className="fl-animate glass-panel rounded-2xl overflow-hidden">
        <div className="p-5 border-b border-white/5 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-gray-400" />
            <h3 className="font-display font-semibold text-base text-white uppercase tracking-wider">Transaction History</h3>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5">
                <th className="text-left text-[10px] font-bold tracking-wider text-gray-500 uppercase px-5 py-3">Date</th>
                <th className="text-left text-[10px] font-bold tracking-wider text-gray-500 uppercase px-5 py-3">Branch</th>
                <th className="text-left text-[10px] font-bold tracking-wider text-gray-500 uppercase px-5 py-3">Category</th>
                <th className="text-left text-[10px] font-bold tracking-wider text-gray-500 uppercase px-5 py-3">Description</th>
                <th className="text-right text-[10px] font-bold tracking-wider text-gray-500 uppercase px-5 py-3">Amount</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((txn) => (
                <tr
                  key={txn.id}
                  className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors"
                >
                  <td className="px-5 py-3.5 text-gray-400 font-mono text-xs">{txn.date}</td>
                  <td className="px-5 py-3.5 text-gray-300 font-semibold text-xs">{txn.branch}</td>
                  <td className="px-5 py-3.5">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-[10px] font-bold border ${getCategoryBadge(txn.category)}`}>
                      {txn.category}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-gray-300 text-xs">{txn.description}</td>
                  <td className={`px-5 py-3.5 text-right font-mono font-bold text-sm ${txn.amount >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {txn.amount >= 0 ? '+' : ''}₹{Math.abs(txn.amount).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
