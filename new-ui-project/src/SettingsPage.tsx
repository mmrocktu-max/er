import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import {
  Settings2, Sparkles,
  Key, ChevronDown, Check, AlertTriangle, Eye, EyeOff
} from 'lucide-react';

type TrafficLevel = 'LOW' | 'MEDIUM' | 'HIGH';
type AIProvider = 'gemini' | 'openai' | 'anthropic';
type KeySource = 'system' | 'custom';

const AI_PROVIDERS = [
  { id: 'gemini' as const, name: 'Google Gemini', sub: 'Native Integration', subColor: 'text-emerald-400' },
  { id: 'openai' as const, name: 'OpenAI ChatGPT', sub: 'GPT Engine', subColor: 'text-gray-500' },
  { id: 'anthropic' as const, name: 'Anthropic Claude', sub: 'Claude Engine', subColor: 'text-gray-500' },
];

const MODEL_OPTIONS: Record<AIProvider, string[]> = {
  gemini: ['gemini-3.5-flash (Standard / Recommended)', 'gemini-3.5-pro (Advanced)', 'gemini-3.0-pro (Legacy)'],
  openai: ['gpt-4o (Recommended)', 'gpt-4o-mini (Fast)', 'gpt-4-turbo (Legacy)'],
  anthropic: ['claude-sonnet-4 (Recommended)', 'claude-opus-4 (Advanced)', 'claude-3.5-haiku (Fast)'],
};

export default function SettingsPage() {
  const containerRef = useRef<HTMLDivElement>(null);

  // Loop tuning
  const [autopilotDelay, setAutopilotDelay] = useState(3.0);
  const [trafficLevel, setTrafficLevel] = useState<TrafficLevel>('MEDIUM');

  // AI / Model / API
  const [aiProvider, setAIProvider] = useState<AIProvider>(
    (localStorage.getItem('ai_provider') as AIProvider) || 'gemini'
  );
  const [selectedModel, setSelectedModel] = useState(
    localStorage.getItem('model_name') || MODEL_OPTIONS.gemini[0]
  );
  const [modelDropdownOpen, setModelDropdownOpen] = useState(false);
  const [keySource, setKeySource] = useState<KeySource>('system');
  const [customApiKey, setCustomApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [keySaved, setKeySaved] = useState(false);

  // Entry animations
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        containerRef.current?.querySelectorAll('.st-animate') || [],
        { opacity: 0, y: 25 },
        { opacity: 1, y: 0, duration: 0.7, stagger: 0.08, ease: 'power3.out' }
      );
    }, containerRef);
    return () => ctx.revert();
  }, []);

  // When provider changes, reset model to first option and save provider
  useEffect(() => {
    // Only reset model if the current selected model is not from this provider's options
    if (!MODEL_OPTIONS[aiProvider].includes(selectedModel)) {
      const defaultModel = MODEL_OPTIONS[aiProvider][0];
      setSelectedModel(defaultModel);
      localStorage.setItem('model_name', defaultModel);
    }
    localStorage.setItem('ai_provider', aiProvider);
  }, [aiProvider, selectedModel]);

  // Save selected model when it changes directly
  useEffect(() => {
    localStorage.setItem('model_name', selectedModel);
  }, [selectedModel]);

  const handleSaveKey = () => {
    if (customApiKey.trim()) {
      localStorage.setItem(`api_key_${aiProvider}`, customApiKey.trim());
      setKeySaved(true);
      setTimeout(() => setKeySaved(false), 2000);
    }
  };

  // Load saved key on provider change
  useEffect(() => {
    const saved = localStorage.getItem(`api_key_${aiProvider}`);
    if (saved) {
      setCustomApiKey(saved);
      setKeySource('custom');
    } else {
      setCustomApiKey('');
      setKeySource('system');
    }
  }, [aiProvider]);

  return (
    <div
      ref={containerRef}
      id="settings-container"
      className="flex-1 flex flex-col gap-8 p-6 sm:p-8 max-w-5xl mx-auto w-full z-10 select-none overflow-y-auto relative"
    >
      {/* Dark backdrop to ensure readability */}
      <div className="fixed inset-0 bg-[#040209]/85 z-0 pointer-events-none" />
      <div className="relative z-10 flex flex-col gap-8">
      {/* Header */}
      <div className="st-animate flex items-center gap-3">
        <Settings2 className="w-6 h-6 text-violet-400" />
        <div>
          <h2 className="text-2xl font-display font-bold text-white tracking-tight uppercase">
            Autonomous Orchestrator Parameters
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Fine-tune simulation variables, speed thresholds, and execute macro triggers below
          </p>
        </div>
      </div>

      {/* ===== TOP ROW: LOOP TUNING + MACRO COMMANDS ===== */}
      <div className="st-animate grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Left: Loop Tuning */}
        <div className="flex flex-col gap-6">
          <h3 className="text-xs font-bold tracking-[0.2em] text-gray-400 uppercase">Loop Tuning</h3>

          {/* Autopilot Delay Slider */}
          <div>
            <div className="flex items-baseline gap-2 mb-3">
              <span className="text-sm text-gray-300">Autopilot Advance Delay:</span>
              <span className="text-sm font-bold text-emerald-400 font-mono">{autopilotDelay.toFixed(1)}s</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="10"
              step="0.5"
              value={autopilotDelay}
              onChange={(e) => setAutopilotDelay(parseFloat(e.target.value))}
              className="w-full h-1.5 rounded-full appearance-none cursor-pointer bg-white/10 accent-emerald-500"
              style={{ accentColor: '#10b981' }}
            />
            <p className="text-[11px] text-gray-600 mt-2">
              Controls the frequency of automated background agent steps when autopilot is on.
            </p>
          </div>

          {/* Traffic Level Toggle */}
          <div>
            <p className="text-sm text-gray-300 mb-3">Simulated Customer Store Traffic</p>
            <div className="flex rounded-xl overflow-hidden border border-white/10">
              {(['LOW', 'MEDIUM', 'HIGH'] as TrafficLevel[]).map(level => (
                <button
                  key={level}
                  onClick={() => setTrafficLevel(level)}
                  className={`flex-1 py-2.5 text-xs font-bold tracking-wider transition-all ${
                    trafficLevel === level
                      ? 'bg-white/10 text-white border-x border-white/10'
                      : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
                  }`}
                >
                  {level}
                </button>
              ))}
            </div>
            <p className="text-[11px] text-gray-600 mt-2">
              Higher traffic generates larger quantities on simulated bulk rush sales.
            </p>
          </div>
        </div>

        {/* Right: Macro Commands */}
        <div className="flex flex-col gap-6">
          <h3 className="text-xs font-bold tracking-[0.2em] text-gray-400 uppercase">Macro Commands</h3>

          {/* Simulate Global Store Rush */}
          <div className="glass-panel rounded-xl p-4 flex items-center justify-between">
            <div>
              <h4 className="text-sm font-semibold text-white">Simulate Global Store Rush</h4>
              <p className="text-[11px] text-gray-500 mt-0.5">Deducts multiple random item stocks</p>
            </div>
            <button className="px-4 py-2 rounded-lg bg-teal-500/20 border border-teal-500/30 text-teal-400 text-xs font-bold hover:bg-teal-500/30 transition-all">
              Simulate
            </button>
          </div>

          {/* Hard Reset */}
          <div className="glass-panel rounded-xl p-4 flex items-center justify-between">
            <div>
              <h4 className="text-sm font-semibold text-white">Full Node Database Hard Reset</h4>
              <p className="text-[11px] text-gray-500 mt-0.5">Restores initial branch stock balances</p>
            </div>
            <button className="px-4 py-2 rounded-lg bg-red-500/15 border border-red-500/30 text-red-400 text-xs font-bold hover:bg-red-500/25 transition-all">
              Hard Reset
            </button>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="st-animate border-t border-white/5" />

      {/* ===== MODEL & API CREDENTIALS ===== */}
      <div className="st-animate">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-5 h-5 text-violet-400" />
          <h3 className="text-base font-display font-bold text-white uppercase tracking-wider">
            Model & API Credentials Setup
          </h3>
        </div>
        <p className="text-xs text-gray-500 mb-6 max-w-3xl">
          Select your preferred LLM provider, active model, and manage your custom API credentials safely. Custom keys are preserved in your browser's local context and processed securely on server routes.
        </p>

        {/* AI Provider Selection */}
        <div className="mb-6">
          <h4 className="text-[10px] font-bold tracking-[0.2em] text-gray-500 uppercase mb-3">Select AI Provider</h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {AI_PROVIDERS.map(p => {
              const isActive = aiProvider === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => setAIProvider(p.id)}
                  className={`p-4 rounded-xl border-2 text-left transition-all duration-300 ${
                    isActive
                      ? 'border-emerald-500/50 bg-emerald-500/5 shadow-[0_0_15px_rgba(16,185,129,0.1)]'
                      : 'border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/5'
                  }`}
                >
                  <span className="text-sm font-bold text-white">{p.name}</span>
                  <p className={`text-[11px] mt-0.5 ${isActive ? p.subColor : 'text-gray-600'}`}>{p.sub}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Model + API Key Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Select Model */}
          <div>
            <h4 className="text-[10px] font-bold tracking-[0.2em] text-gray-500 uppercase mb-3">Select Model</h4>
            <div className="relative">
              <button
                onClick={() => setModelDropdownOpen(!modelDropdownOpen)}
                className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-black/40 border border-white/10 text-sm text-white font-semibold hover:border-white/20 transition-all"
              >
                <span>{selectedModel}</span>
                <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${modelDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              {modelDropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-[#0d0a1a] border border-white/10 rounded-xl overflow-hidden z-50 shadow-2xl">
                  {MODEL_OPTIONS[aiProvider].map(model => (
                    <button
                      key={model}
                      onClick={() => { setSelectedModel(model); setModelDropdownOpen(false); }}
                      className={`w-full text-left px-4 py-2.5 text-xs hover:bg-white/5 transition-colors flex items-center gap-2 ${
                        selectedModel === model ? 'text-emerald-400' : 'text-gray-300'
                      }`}
                    >
                      {selectedModel === model && <Check className="w-3.5 h-3.5" />}
                      {model}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <p className="text-[11px] text-gray-600 mt-2">Active loop orchestrator execution engine model.</p>
          </div>

          {/* API Key Source */}
          <div>
            <h4 className="text-[10px] font-bold tracking-[0.2em] text-gray-500 uppercase mb-3">API Key Source</h4>
            <div className="flex flex-col gap-2.5">
              {/* System Default */}
              <label className="flex items-center gap-3 cursor-pointer group">
                <div
                  onClick={() => setKeySource('system')}
                  className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all ${
                    keySource === 'system' ? 'border-violet-500 bg-violet-500' : 'border-gray-600 group-hover:border-gray-400'
                  }`}
                >
                  {keySource === 'system' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                </div>
                <span className="text-xs text-gray-300">System Default Key</span>
                <span className="text-[9px] px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-400 border border-amber-500/30 font-semibold">
                  Unavailable (Fallback Mode)
                </span>
              </label>

              {/* Custom Key */}
              <label className="flex items-center gap-3 cursor-pointer group">
                <div
                  onClick={() => setKeySource('custom')}
                  className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all ${
                    keySource === 'custom' ? 'border-violet-500 bg-violet-500' : 'border-gray-600 group-hover:border-gray-400'
                  }`}
                >
                  {keySource === 'custom' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                </div>
                <span className="text-xs text-gray-300">
                  My Personal {AI_PROVIDERS.find(p => p.id === aiProvider)?.name} API Key
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* Custom API Key Input (shown when custom is selected) */}
        {keySource === 'custom' && (
          <div className="st-animate mt-6 glass-panel rounded-xl p-5 animate-fade-in">
            <div className="flex items-center gap-2 mb-3">
              <Key className="w-4 h-4 text-amber-400" />
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                Enter Your {AI_PROVIDERS.find(p => p.id === aiProvider)?.name} API Key
              </h4>
            </div>
            <div className="flex gap-3">
              <div className="flex-1 relative">
                <input
                  type={showKey ? 'text' : 'password'}
                  value={customApiKey}
                  onChange={(e) => setCustomApiKey(e.target.value)}
                  placeholder={aiProvider === 'gemini' ? 'AIzaSy...' : aiProvider === 'openai' ? 'sk-...' : 'sk-ant-...'}
                  className="w-full px-4 py-3 pr-10 rounded-xl bg-black/40 border border-white/10 text-sm text-white font-mono placeholder-gray-600 focus:outline-none focus:border-violet-500/50 focus:shadow-[0_0_15px_rgba(139,92,246,0.15)] transition-all"
                />
                <button
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                >
                  {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <button
                onClick={handleSaveKey}
                className={`px-5 py-3 rounded-xl text-xs font-bold transition-all ${
                  keySaved
                    ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-400'
                    : 'bg-gradient-to-r from-brand-purple to-brand-pink text-white hover:scale-[1.03] shadow-[0_0_15px_rgba(139,92,246,0.2)]'
                }`}
              >
                {keySaved ? '✓ Saved' : 'Save Key'}
              </button>
            </div>
            <p className="text-[11px] text-gray-600 mt-2 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              Key is stored locally in your browser. It is sent to the backend only during active API calls.
            </p>
          </div>
        )}
      </div>
      </div>
    </div>
  );
}
