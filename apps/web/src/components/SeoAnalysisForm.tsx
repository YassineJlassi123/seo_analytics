'use client';

import { useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import { createApiClient } from '@/lib/api';
import SeoAnalysis from './SeoAnalysis';
import Toast from './Toast';

interface AnalysisResult {
  id?: string;
  websiteId?: string;
  url?: string;
  performance: number;
  accessibility: number;
  bestPractices: number;
  seo: number;
  pwa: number;
  metrics: Record<string, unknown>;
  opportunities?: Array<Record<string, unknown>>;
  diagnostics?: Array<Record<string, unknown>>;
  createdAt?: string;
  insights: { message: string }[];
  saved?: boolean;
  reportId?: string;
}

const SeoAnalysisForm = () => {
  const { getToken } = useAuth();
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
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
          const flattenedResult: AnalysisResult = {
            ...data.data.report,
            performance: data.data.report.performance ?? 0,
            accessibility: data.data.report.accessibility ?? 0,
            bestPractices: data.data.report.bestPractices ?? 0,
            seo: data.data.report.seo ?? 0,
            pwa: data.data.report.pwa ?? 0,
            metrics: data.data.report.metrics ?? {},
            insights: data.data.insights,
            saved: data.data.saved,
            reportId: data.data.reportId,
          };
          setAnalysis(flattenedResult);
        } else {
          setError(data.message ?? 'Failed to analyze website');
        }
      } else {
        const errorData = await response.json().catch(() => ({} as { message?: string }));
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
        {analysis && <SeoAnalysis report={analysis} />}
      </div>
    </div>
  );
};

export default SeoAnalysisForm;