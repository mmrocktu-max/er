import { useState } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from './AuthContext';
import { ShieldCheck, Zap } from 'lucide-react';
import { createApiClient } from './api';

function Login() {
  const { login } = useAuth();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 animate-in fade-in duration-1000 relative z-10 w-full h-full">
      
      {/* Decorative logo/icon */}
      <div className="mb-8 p-4 rounded-full bg-white/5 border border-white/10 shadow-[0_0_40px_rgba(139,92,246,0.3)]">
        <Zap className="w-12 h-12 text-pink-400" />
      </div>

      <div className="text-center mb-10 max-w-lg">
        <h1 className="text-4xl sm:text-5xl font-bold mb-4 tracking-tight glow-text-purple">
          Autonomous ERP
        </h1>
        <p className="text-gray-400 text-lg leading-relaxed">
          AI-driven procurement, automated stock management, and financial reconciliation connected directly to your ledger.
        </p>
      </div>

      {/* Login Card */}
      <div className="glass-panel w-full max-w-md flex flex-col items-center p-14 space-y-10 rounded-3xl relative overflow-hidden">
        {/* Glow effect inside card */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-32 bg-brand-purple/20 blur-[60px] pointer-events-none rounded-full" />
        
        <div className="text-center z-10 w-full space-y-2">
          <h2 className="text-2xl font-semibold text-white">Access Gateway</h2>
          <p className="text-sm text-gray-400 flex items-center justify-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" /> Secure SOC-2 Authentication
          </p>
        </div>

        {/* Glossy Capsule Wrapper for the Sign In Button */}
        <div className="z-10 group relative rounded-full overflow-hidden p-[2px] transition-all hover:scale-105 duration-300 shadow-xl bg-white/10 backdrop-blur-md border border-white/20 hover:border-white/40 cursor-pointer flex items-center justify-center">
          <GoogleLogin
            onSuccess={async (credentialResponse) => {
              if (credentialResponse.credential) {
                try {
                  setError(null);
                  const response = await createApiClient().post('/auth/login', {
                    credential: credentialResponse.credential,
                  });
                  login(response.data.token, response.data.name);
                } catch (requestError: any) {
                  const detail = requestError?.response?.data?.detail;
                  setError(detail || 'Sign-in could not be completed. Please try again.');
                }
              }
            }}
            onError={() => setError('Google sign-in was cancelled or failed. Please try again.')}
            useOneTap
            theme="filled_black"
            shape="pill"
            size="large"
            text="continue_with"
            width="250"
          />
        </div>
        
        {/* Bypass Login for local development */}
        <button
          onClick={async () => {
            try {
              setError(null);
              const response = await createApiClient().post('/auth/login', {
                credential: 'dev-bypass',
              });
              login(response.data.token, response.data.name);
            } catch (err: any) {
              setError('Bypass login failed.');
            }
          }}
          className="z-10 mt-4 text-xs text-gray-500 hover:text-white underline transition-colors"
        >
          Bypass Login (Dev Only)
        </button>

        {error && <p className="z-10 text-sm text-red-300" role="alert">{error}</p>}
      </div>
      
      <div className="mt-12 text-xs text-gray-600 font-mono text-center">
        <p>SYSTEM STATUS: ONLINE | APEX ENGINE: IDLE</p>
        <p className="mt-1">© 2026 Procurement Agent Architecture</p>
      </div>
    </div>
  );
}

export default Login;
