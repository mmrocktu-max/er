import { useRef, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import Login from './Login';
import Dashboard from './Dashboard';
import Lobby from './Lobby';
import WorkflowGraph from './WorkflowGraph';
import BranchInventory from './BranchInventory';
import FinancialLedger from './FinancialLedger';
import SettingsPage from './SettingsPage';
import gsap from 'gsap';
import { Settings as SettingsIcon } from 'lucide-react';

interface ApprovalNotice {
  itemName: string;
  totalCost: number;
}

const navigationTabs = [
  'FINANCE',
  'DASHBOARD',
  'WORKFLOW GRAPH',
  'BRANCH INVENTORY',
  'FINANCIAL LEDGER'
];

function App() {
  const { token } = useAuth();
  const bgLayerRef = useRef<HTMLDivElement>(null);
  
  // Set default tab based on whether they are logged in or not
  const [activeTab, setActiveTab] = useState('FINANCE');
  const [dashboardMetrics, setDashboardMetrics] = useState<any>(null);
  const [approvalNotice, setApprovalNotice] = useState<ApprovalNotice | null>(null);

  const handleApprovalRequired = (itemName: string, totalCost: number) => {
    setApprovalNotice({ itemName, totalCost });
    setActiveTab('WORKFLOW GRAPH');
  };

  useEffect(() => {
    // When they log in, they land on FINANCE (the Lobby screen) first.
    if (token && activeTab !== 'FINANCE' && activeTab !== 'DASHBOARD') {
      setActiveTab('FINANCE');
    }
  }, [token]);

  useEffect(() => {
    const ctx = gsap.context(() => {
      if (!token || activeTab === 'FINANCE') {
        // Normal state for welcome/login screen or Lobby screen
        gsap.to(bgLayerRef.current, {
          scale: 1,
          y: 0,
          filter: 'blur(0px)',
          duration: 1.5,
          ease: 'power3.out'
        });
      } else {
        // "Dive/Zoom" camera focus for Dashboard / other views
        gsap.to(bgLayerRef.current, {
          scale: 1.15,
          y: 40,
          filter: 'blur(2px) saturate(120%)',
          duration: 1.8,
          ease: 'power3.out'
        });
      }
    });
    return () => ctx.revert();
  }, [token, activeTab]);

  return (
    <div className="min-h-screen flex flex-col bg-[#040209] text-[#f3f4f6] relative overflow-hidden font-sans">
      
      {/* Backdrop Layers */}
      <div 
        ref={bgLayerRef}
        className="absolute inset-0 z-0 select-none pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(to bottom, rgba(15, 12, 28, 0.5) 0%, rgba(30, 20, 60, 0.4) 50%, rgba(15, 12, 28, 0.85) 100%), url('https://images.unsplash.com/photo-1542224566-6e85f2e6772f?auto=format&fit=crop&w=1920&q=80')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center 30%',
          transformOrigin: 'center center'
        }}
      >
        {/* Floating animated clouds overlay layer */}
        <div 
          className="absolute inset-x-0 bottom-0 h-1/2 opacity-35 bg-gradient-to-t from-violet-950/20 to-transparent mix-blend-color-dodge pointer-events-none"
          style={{
            backgroundImage: "url('https://images.unsplash.com/photo-1465146344425-f00d5f5c8f07?auto=format&fit=crop&w=1920&q=80')",
            backgroundSize: 'cover',
            backgroundPosition: 'bottom center',
            animation: 'drift-clouds 60s infinite linear'
          }}
        />
      </div>

      {/* Show Top Header only when authenticated */}
      {token && (
        <header className="relative z-40 p-5 sm:p-6 flex justify-between items-center select-none">
          {/* Left: Capsule Navigation Container */}
          <div className="flex items-center gap-1 sm:gap-2 bg-black/80 backdrop-blur-xl px-2 py-1.5 rounded-full border border-white/10 shadow-2xl max-w-full overflow-x-auto scrollbar-none">
            {navigationTabs.map((tab) => {
              const isActive = activeTab === tab;
              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-3 sm:px-4 py-2 rounded-full text-[10px] sm:text-[11px] font-semibold tracking-wider transition-all duration-300 cursor-pointer whitespace-nowrap ${
                    isActive 
                      ? 'bg-[#1a1726] text-white border border-white/10 shadow-lg font-bold scale-102 glow-border-purple' 
                      : 'text-gray-400 hover:text-white hover:bg-white/5 opacity-70 hover:opacity-100'
                  }`}
                >
                  {tab}
                </button>
              );
            })}
          </div>

          {/* Right: Settings Gear Wheel */}
          <button 
            onClick={() => setActiveTab('SETTINGS')}
            className={`p-2.5 rounded-full bg-black/80 backdrop-blur-xl border transition-all shadow-xl hover:text-white hover:scale-105 cursor-pointer z-50 ${
              activeTab === 'SETTINGS' ? 'border-violet-500/50 text-white' : 'border-white/10 text-gray-400'
            }`}
          >
            <SettingsIcon className="w-5 h-5" />
          </button>
        </header>
      )}

      {/* Main View Area */}
      <div className="relative z-10 flex-1 flex flex-col overflow-y-auto">
        {!token ? (
          <Login />
        ) : activeTab === 'FINANCE' ? (
          <Lobby onGetStarted={(metrics) => {
            if (metrics) setDashboardMetrics(metrics);
            setActiveTab('DASHBOARD');
          }} />
        ) : activeTab === 'WORKFLOW GRAPH' ? (
          <WorkflowGraph approvalNotice={approvalNotice} />
        ) : activeTab === 'BRANCH INVENTORY' ? (
          <BranchInventory onApprovalRequired={handleApprovalRequired} />
        ) : activeTab === 'FINANCIAL LEDGER' ? (
          <FinancialLedger />
        ) : activeTab === 'SETTINGS' ? (
          <SettingsPage />
        ) : (
          <Dashboard ingestedMetrics={dashboardMetrics} />
        )}
      </div>

      <style>{`
        @keyframes drift-clouds {
          0% { backgroundPositionX: 0px; }
          100% { backgroundPositionX: 1920px; }
        }
        .scrollbar-none::-webkit-scrollbar { display: none; }
        .scrollbar-none { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}

export default App;
