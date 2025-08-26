'use client';

import { useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import { createApiClient } from '@/lib/api';
import ScoreChart from './ScoreChart';
import Toast from './Toast';

export default function SeoAnalysis() {
  const { getToken } = useAuth();
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<any | null>(null);
  const [showToast, setShowToast] = useState(false);

  const handleAnalyze = async () => {
    setLoading(true);
    setError(null);
    setAnalysis(null);
    setShowToast(true);

    try {
      const token = await getToken();
      if (!token) {
        setError('Authentication token not available');
        setLoading(false);
        return;
      }

      const apiClient = createApiClient(token);
      const response = await apiClient.api.lighthouse.analyze.$post({ json: { url } });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setAnalysis(data.data);
        } else {
          setError(data.message ?? 'Failed to analyze website');
        }
      } else {
        const errorData = await response.json().catch(() => ({} as any));
        setError(errorData?.message ?? `Request failed with status ${response.status}`);
      }
    } catch (err) {
      console.error('Analysis error:', err);
      setError('Failed to analyze website. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white shadow sm:rounded-lg">
      <Toast message="Analysis may take some time..." show={showToast} onClose={() => setShowToast(false)} />
      <div className="px-4 py-5 sm:p-6">
        <h3 className="text-lg leading-6 font-medium text-gray-900">SEO Analysis</h3>
        <div className="mt-2 max-w-xl text-sm text-gray-500">
          <p>Enter a URL to analyze its SEO performance.</p>
        </div>
        <div className="mt-5 sm:flex sm:items-center">
          <div className="w-full sm:max-w-xs">
            <label htmlFor="url" className="sr-only">
              URL
            </label>
            <input
              type="text"
              name="url"
              id="url"
              className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
              placeholder="https://example.com"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
          </div>
          <button
            type="button"
            className="mt-3 w-full inline-flex items-center justify-center px-4 py-2 border border-transparent shadow-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
            onClick={handleAnalyze}
            disabled={loading}
          >
            {loading ? 'Analyzing...' : 'Analyze'}
          </button>
        </div>
        {error && (
          <div className="mt-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}
        {analysis && (
          <div className="mt-6">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <ScoreChart score={analysis.report.performance} label="Performance" />
              <ScoreChart score={analysis.report.accessibility} label="Accessibility" />
              <ScoreChart score={analysis.report.bestPractices} label="Best Practices" />
              <ScoreChart score={analysis.report.seo} label="SEO" />
              <ScoreChart score={analysis.report.pwa} label="PWA" />
            </div>

            <div className="mt-8">
              <h4 className="text-md font-medium text-gray-900">Metrics</h4>
              <div className="mt-2 grid grid-cols-1 md:grid-cols-3 gap-4">
                {Object.entries(analysis.report.metrics).map(([key, value]) => (
                  <div key={key} className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm font-medium text-gray-600">{key}</p>
                    <p className="text-lg font-bold text-gray-900">{value ? (value as number).toFixed(2) : 'N/A'}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-8">
              <h4 className="text-md font-medium text-gray-900">Insights</h4>
              <ul className="mt-2 space-y-2">
                {analysis.insights.map((insight: any, index: number) => (
                  <li key={index} className="bg-yellow-50 p-4 rounded-lg">
                    <p className="text-sm text-yellow-800">{insight.message}</p>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
