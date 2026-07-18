import { useState } from 'react';
import type { FormEvent } from 'react';
import { Loader2, MessageCircle, Search } from 'lucide-react';
import { useAuth } from './AuthContext';
import { createApiClient } from './api';

interface QuerySource {
  [key: string]: unknown;
}

interface SupplierAssistantProps {
  className?: string;
}

export default function SupplierAssistant({ className = '' }: SupplierAssistantProps) {
  const { token } = useAuth();
  const [query, setQuery] = useState('');
  const [answer, setAnswer] = useState<string | null>(null);
  const [sources, setSources] = useState<QuerySource[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submitQuery = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedQuery = query.trim();
    if (!trimmedQuery || loading) return;

    setLoading(true);
    setError(null);
    try {
      const provider = localStorage.getItem('ai_provider');
      const response = await createApiClient(token).post('/query', {
        query: trimmedQuery,
        api_provider: provider,
        model_name: localStorage.getItem('model_name'),
        custom_api_key: localStorage.getItem(`api_key_${provider || 'gemini'}`),
      });
      setAnswer(response.data.answer);
      setSources(response.data.sources || []);
    } catch (requestError: any) {
      const detail = requestError?.response?.data?.detail;
      setError(detail || 'The supplier assistant could not answer. Check the API and try again.');
      setAnswer(null);
      setSources([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className={`glass-panel rounded-2xl p-6 ${className}`} aria-labelledby="supplier-assistant-title">
      <div className="flex items-start gap-3 mb-5">
        <div className="p-2 rounded-xl bg-violet-500/15 border border-violet-400/20">
          <MessageCircle className="w-5 h-5 text-violet-300" aria-hidden="true" />
        </div>
        <div>
          <h3 id="supplier-assistant-title" className="font-display font-semibold text-lg text-white">Supplier assistant</h3>
          <p className="text-xs text-gray-400 mt-1">Ask about suppliers, prices, lead times, or inventory coverage.</p>
        </div>
      </div>

      <form onSubmit={submitQuery} className="flex flex-col sm:flex-row gap-2">
        <label htmlFor="supplier-query" className="sr-only">Ask the supplier assistant</label>
        <input
          id="supplier-query"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Which supplier has the shortest lead time?"
          className="min-h-11 flex-1 rounded-xl bg-black/30 border border-white/15 px-4 text-sm text-white placeholder:text-gray-500 outline-none focus:border-violet-400/70 focus:ring-2 focus:ring-violet-400/20"
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading || !query.trim()}
          className="min-h-11 px-5 rounded-xl bg-violet-500/80 hover:bg-violet-500 text-white text-sm font-semibold inline-flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> : <Search className="w-4 h-4" aria-hidden="true" />}
          {loading ? 'Searching' : 'Ask'}
        </button>
      </form>

      {error && <p className="mt-4 text-sm text-red-300" role="alert">{error}</p>}
      {answer && (
        <div className="mt-5 rounded-xl bg-black/25 border border-white/10 p-4">
          <p className="text-sm leading-6 text-gray-200 whitespace-pre-wrap">{answer}</p>
          {sources.length > 0 && (
            <details className="mt-4 border-t border-white/10 pt-3">
              <summary className="cursor-pointer text-xs font-semibold text-violet-300">View {sources.length} source record{sources.length === 1 ? '' : 's'}</summary>
              <div className="mt-3 space-y-2">
                {sources.map((source, index) => (
                  <pre key={index} className="overflow-x-auto rounded-lg bg-black/30 p-3 text-[10px] leading-4 text-gray-400">{JSON.stringify(source, null, 2)}</pre>
                ))}
              </div>
            </details>
          )}
        </div>
      )}
    </section>
  );
}
