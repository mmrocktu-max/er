/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ActiveTab } from './types';
import { navigationTabs } from './data';
import LobbyView from './components/LobbyView';
import DashboardView from './components/DashboardView';
import WorkflowView from './components/WorkflowView';
import InventoryView from './components/InventoryView';
import LedgerView from './components/LedgerView';
import { 
  Settings as SettingsIcon, X, Sliders, Play, 
  Terminal, ShieldCheck, HelpCircle, Monitor 
} from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>(ActiveTab.Finance);
  const [showSettings, setShowSettings] = useState(false);
  const [consoleLogs, setConsoleLogs] = useState<string[]>([
    '[SYSTEM] Initializing SOC-2 encrypted ledger tunnels...',
    '[SWIFT] Connected to Global Clearing Gateway (Port 3000)...',
    '[AI-OCR] APEX extraction engine is active and idling.'
  ]);

  // Customizable state parameters
  const [networkSpeed, setNetworkSpeed] = useState<'Fiber' | '5G' | 'SWIFT'>('Fiber');
  const [ambientClouds, setAmbientClouds] = useState(true);
  const [clearanceRate, setClearanceRate] = useState(99.98);
  const [showLogsDrawer, setShowLogsDrawer] = useState(true);

  // Refs for animations
  const bgLayerRef = useRef<HTMLDivElement>(null);
  const contentWrapperRef = useRef<HTMLDivElement>(null);
  const settingsPanelRef = useRef<HTMLDivElement>(null);
  const logsDrawerRef = useRef<HTMLDivElement>(null);

  // Trigger continuous mock system logs
  useEffect(() => {
    const logsPool = [
      '[SWIFT] Inbound wire clearance from New York HQ settled.',
      '[COMPLIANCE] Counterparty check passed against sanction registers.',
      '[AI-OCR] Extracted $1,250,000.00 from EMEA branch invoice lines.',
      '[LEDGER] Double-entry sync committed to persistent node successfully.',
      '[SYSTEM] Daily auto-clearance rate re-verified under cryptograph seals.',
      '[SWIFT] Inter-vault liquidity placements balanced for active APAC depots.',
      '[COMPLIANCE] Risk score calculated at 0.01% - limit cleared automatically.'
    ];

    const interval = setInterval(() => {
      const randomLog = logsPool[Math.floor(Math.random() * logsPool.length)];
      const timestamp = new Date().toLocaleTimeString();
      setConsoleLogs(prev => [...prev.slice(-4), `[${timestamp}] ${randomLog}`]);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  // GSAP Background Camera Dive and Content Slide effect on tab change
  useEffect(() => {
    const ctx = gsap.context(() => {
      if (activeTab === ActiveTab.Finance) {
        // Normal state for welcome screen
        gsap.to(bgLayerRef.current, {
          scale: 1,
          y: 0,
          filter: 'blur(0px)',
          duration: 1.5,
          ease: 'power3.out'
        });
      } else {
        // "Dive/Zoom" camera focus on content screens
        gsap.to(bgLayerRef.current, {
          scale: 1.15,
          y: 40,
          filter: 'blur(2px) saturate(120%)',
          duration: 1.8,
          ease: 'power3.out'
        });
      }

      // Slide and fade incoming active content view
      if (contentWrapperRef.current) {
        gsap.fromTo(
          contentWrapperRef.current,
          { opacity: 0, y: 30, filter: 'blur(4px)' },
          { opacity: 1, y: 0, filter: 'blur(0px)', duration: 0.8, ease: 'power3.out' }
        );
      }
    });

    return () => ctx.revert();
  }, [activeTab]);

  // Settings Panel Side-slide animation
  const toggleSettings = () => {
    if (showSettings) {
      gsap.to(settingsPanelRef.current, {
        x: '100%',
        duration: 0.4,
        ease: 'power3.in',
        onComplete: () => setShowSettings(false)
      });
    } else {
      setShowSettings(true);
      // Wait for React to render the panel then slide it in
      setTimeout(() => {
        gsap.fromTo(
          settingsPanelRef.current,
          { x: '100%' },
          { x: '0%', duration: 0.5, ease: 'power3.out' }
        );
      }, 50);
    }
  };

  const renderActiveView = () => {
    switch (activeTab) {
      case ActiveTab.Finance:
        return <LobbyView onGetStarted={() => setActiveTab(ActiveTab.Dashboard)} bgRef={bgLayerRef} />;
      case ActiveTab.Dashboard:
        return <DashboardView />;
      case ActiveTab.Workflow:
        return <WorkflowView />;
      case ActiveTab.Inventory:
        return <InventoryView />;
      case ActiveTab.Ledger:
        return <LedgerView />;
      default:
        return <LobbyView onGetStarted={() => setActiveTab(ActiveTab.Dashboard)} bgRef={bgLayerRef} />;
    }
  };

  return (
    <div id="app-root" className="min-h-screen flex flex-col bg-[#040209] text-[#f3f4f6] relative overflow-hidden font-sans">
      
      {/* 1. Backdrop Layers (Roraima mountain illustration & sunset gradient background) */}
      <div 
        ref={bgLayerRef}
        id="parallax-bg-layer"
        className="absolute inset-0 z-0 select-none pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(to bottom, rgba(15, 12, 28, 0.5) 0%, rgba(30, 20, 60, 0.4) 50%, rgba(15, 12, 28, 0.85) 100%), url('https://images.unsplash.com/photo-1542224566-6e85f2e6772f?auto=format&fit=crop&w=1920&q=80')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center 30%',
          transformOrigin: 'center center'
        }}
      >
        {/* Floating animated clouds overlay layer */}
        {ambientClouds && (
          <div 
            id="ambient-drifting-clouds"
            className="absolute inset-x-0 bottom-0 h-1/2 opacity-35 bg-gradient-to-t from-violet-950/20 to-transparent mix-blend-color-dodge pointer-events-none"
            style={{
              backgroundImage: "url('https://images.unsplash.com/photo-1465146344425-f00d5f5c8f07?auto=format&fit=crop&w=1920&q=80')",
              backgroundSize: 'cover',
              backgroundPosition: 'bottom center',
              animation: 'drift-clouds 45s infinite linear'
            }}
          />
        )}
      </div>

      {/* 2. Top Header Navigation Bar (Matches provided screenshot exactly) */}
      <header id="global-header" className="relative z-40 p-5 sm:p-6 flex justify-between items-center select-none">
        
        {/* Left: Capsule Navigation Container */}
        <div 
          id="nav-capsule-container"
          className="flex items-center gap-1 sm:gap-2 bg-black/80 backdrop-blur-xl px-2 py-1.5 rounded-full border border-white/10 shadow-2xl max-w-full overflow-x-auto scrollbar-none"
        >
          {navigationTabs.map((tab) => {
            const isActive = activeTab === tab;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                id={`nav-button-${tab.replace(/\s+/g, '-').toLowerCase()}`}
                className={`px-3 sm:px-4 py-2 rounded-full text-[10px] sm:text-[11px] font-semibold tracking-wider transition-all duration-300 cursor-pointer whitespace-nowrap ${
                  isActive 
                    ? 'bg-[#1a1726] text-white border border-white/10 shadow-lg font-bold scale-102 glow-border-purple' 
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {tab}
              </button>
            );
          })}
        </div>

        {/* Right: Settings Gear Wheel */}
        <button
          onClick={toggleSettings}
          id="settings-gear-button"
          className={`p-2.5 rounded-full bg-black/80 backdrop-blur-xl border border-white/10 text-gray-400 hover:text-white transition-all shadow-xl hover:scale-105 active:scale-95 cursor-pointer z-50`}
        >
          <SettingsIcon className={`w-5 h-5 ${showSettings ? 'rotate-90 text-pink-400' : ''} transition-transform duration-500`} />
        </button>
      </header>

      {/* 3. Main View Slot Container */}
      <main 
        ref={contentWrapperRef} 
        id="view-viewport"
        className="flex-1 flex flex-col relative z-20 overflow-hidden pb-12"
      >
        {renderActiveView()}
      </main>

      {/* 4. Console Logs Drawer (Displays in-depth developer credentials status) */}
      {showLogsDrawer && activeTab !== ActiveTab.Finance && (
        <div 
          ref={logsDrawerRef}
          id="console-logs-drawer"
          className="absolute bottom-0 inset-x-0 h-10 bg-black/90 border-t border-white/10 px-4 flex items-center justify-between font-mono text-[9px] text-gray-500 z-30 select-none"
        >
          <div className="flex items-center gap-4 truncate" id="logs-feed-group">
            <span className="flex items-center gap-1 text-[10px] font-bold text-violet-400 uppercase">
              <Terminal className="w-3.5 h-3.5" /> Core_Sync:
            </span>
            <div className="text-gray-400 truncate animate-fade-in" key={consoleLogs.length}>
              {consoleLogs[consoleLogs.length - 1]}
            </div>
          </div>
          <div className="flex items-center gap-4 text-gray-500" id="logs-telemetry">
            <span>PING: <strong className="text-emerald-400 font-bold">12ms</strong></span>
            <span>AUTO_CLEAR: <strong className="text-violet-400 font-bold">{clearanceRate}%</strong></span>
            <span>TUNNEL: <strong className="text-pink-400 font-bold">{networkSpeed.toUpperCase()}</strong></span>
          </div>
        </div>
      )}

      {/* 5. Right Side Interactive Settings Drawer */}
      {showSettings && (
        <div 
          id="settings-overlay-backdrop"
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex justify-end"
          onClick={toggleSettings}
        >
          <div
            ref={settingsPanelRef}
            id="settings-side-panel"
            className="w-full max-w-sm h-full bg-[#0d0b1a] border-l border-white/10 p-6 flex flex-col justify-between shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex justify-between items-center border-b border-white/10 pb-4" id="settings-header">
              <div className="flex items-center gap-2" id="settings-title-group">
                <Sliders className="w-5 h-5 text-violet-400" />
                <h3 className="font-display font-bold text-lg text-white">Visual & System Controls</h3>
              </div>
              <button
                onClick={toggleSettings}
                className="p-1 text-gray-400 hover:text-white rounded-full hover:bg-white/5 transition-colors cursor-pointer"
                id="close-settings-button"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Controls */}
            <div className="flex-1 flex flex-col gap-5 py-6 text-xs" id="settings-controls-body">
              {/* Network Tunnel Selection */}
              <div id="control-network">
                <label className="text-gray-400 font-semibold uppercase block mb-2">Network Clearance Speed</label>
                <div className="grid grid-cols-3 gap-1.5 bg-black/40 p-1 rounded-xl border border-white/5" id="network-toggles">
                  {(['Fiber', '5G', 'SWIFT'] as const).map((speed) => (
                    <button
                      key={speed}
                      onClick={() => setNetworkSpeed(speed)}
                      id={`network-toggle-${speed.toLowerCase()}`}
                      className={`py-2 rounded-lg font-semibold text-center cursor-pointer transition-all ${
                        networkSpeed === speed 
                          ? 'bg-violet-600 text-white' 
                          : 'text-gray-500 hover:text-white'
                      }`}
                    >
                      {speed}
                    </button>
                  ))}
                </div>
              </div>

              {/* Clearance rate slider */}
              <div id="control-clearance">
                <div className="flex justify-between items-center mb-1.5" id="clearance-labels">
                  <label className="text-gray-400 font-semibold uppercase">Daily Clearance Target</label>
                  <span className="font-mono font-bold text-white text-sm">{clearanceRate.toFixed(2)}%</span>
                </div>
                <input
                  type="range"
                  min="95.00"
                  max="99.99"
                  step="0.01"
                  value={clearanceRate}
                  onChange={(e) => setClearanceRate(parseFloat(e.target.value))}
                  id="clearance-rate-slider"
                  className="w-full accent-pink-500 bg-black/50 h-2 rounded-lg appearance-none cursor-pointer border border-white/5"
                />
              </div>

              {/* Toggle ambient clouds */}
              <div className="flex items-center justify-between p-3.5 bg-black/30 border border-white/5 rounded-xl" id="control-clouds">
                <div id="clouds-label">
                  <h4 className="font-semibold text-white">Enable Ambient Clouds</h4>
                  <p className="text-[10px] text-gray-500">Drifts scenic low cloud decks passively.</p>
                </div>
                <input
                  type="checkbox"
                  checked={ambientClouds}
                  onChange={(e) => setAmbientClouds(e.target.checked)}
                  id="clouds-toggle-checkbox"
                  className="w-4 h-4 accent-violet-600 cursor-pointer"
                />
              </div>

              {/* Toggle Logs Drawer */}
              <div className="flex items-center justify-between p-3.5 bg-black/30 border border-white/5 rounded-xl" id="control-logs">
                <div id="logs-label">
                  <h4 className="font-semibold text-white">Show System Logs Drawer</h4>
                  <p className="text-[10px] text-gray-500">Displays a raw real-time event pipeline.</p>
                </div>
                <input
                  type="checkbox"
                  checked={showLogsDrawer}
                  onChange={(e) => setShowLogsDrawer(e.target.checked)}
                  id="logs-toggle-checkbox"
                  className="w-4 h-4 accent-violet-600 cursor-pointer"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-white/10 pt-4" id="settings-footer">
              <div className="flex items-center gap-2 p-3 bg-violet-950/20 border border-violet-500/10 rounded-xl" id="settings-compliance-info">
                <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
                <div id="seal-text">
                  <h4 className="font-semibold text-white text-[11px]">Secure Isolation Vault</h4>
                  <p className="text-[9px] text-gray-400 mt-0.5">Parameters are local sandbox states only.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cloud Drifting and keyframe animations */}
      <style>{`
        @keyframes drift-clouds {
          0% {
            backgroundPositionX: 0px;
          }
          100% {
            backgroundPositionX: 1920px;
          }
        }
        .scrollbar-none::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-none {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}
