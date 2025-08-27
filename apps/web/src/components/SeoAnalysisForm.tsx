'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@clerk/nextjs';
import { createApiClient } from '@/lib/api';
import SeoAnalysis from './SeoAnalysis';
import Toast from './Toast';

interface AnalysisData {
  report: AnalysisResult;
  insights: { message: string }[];
  saved: boolean;
  reportId?: string;
}

interface AnalysisResult {
  id?: string;
  websiteId?: string;
  url?: string;
  performance: number | null;
  accessibility: number | null;
  bestPractices: number | null;
  seo: number | null;
  pwa: number | null;
  metrics: Record<string, unknown> | null;
  opportunities?: Array<Record<string, unknown>>;
  diagnostics?: Array<Record<string, unknown>>;
  createdAt?: string;
}

const SeoAnalysisForm = () => {
  const { getToken } = useAuth();
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisData | null>(null);
  const [toastInfo, setToastInfo] = useState<{ message: string; show: boolean }>({ message: '', show: false });

  const handleAnalyze = async () => {
    setLoading(true);
    setError(null);
    setAnalysis(null);
    setToastInfo({ message: 'Analysis is running, this may take a moment...', show: true });

    try {
      const token = await getToken();
      if (!token) {
        throw new Error('Authentication token not available');
      }

      const apiClient = createApiClient(token);
      const response = await apiClient.api.lighthouse.analyze.$post({ json: { url } });

      if (!response.ok) {
        let errorMessage = `Request failed with status ${response.status}`;
        try {
          const errorData = await response.json();
          if (errorData && errorData.message) {
            errorMessage = errorData.message;
          }
        } catch (e) {
          // Ignore JSON parsing errors
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      if (data.success) {
        const successData = data as { success: true; data: AnalysisData; message?: string; };
        setAnalysis(successData.data);
      } else {
        throw new Error(data.message || 'Failed to analyze website.');
      }
    } catch (err) {
      console.error('Analysis error:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white shadow sm:rounded-lg">
      <Toast message={toastInfo.message} show={toastInfo.show} onClose={() => setToastInfo({ ...toastInfo, show: false })} />
      <div className="px-4 py-5 sm:p-6">
        <h3 className="text-lg leading-6 font-medium text-gray-900">SEO Analysis</h3>
        <div className="mt-2 max-w-xl text-sm text-gray-500">
          <p>Enter a URL to get a quick Performance and SEO analysis.</p>
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
          <div>
            <SeoAnalysis analysisData={analysis} />
            <div className="mt-6 text-center">
              <Link href={`/dashboard/websites/add?url=${encodeURIComponent(url)}`}>
                <span className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500">
                  + Save Website for Full, Scheduled Reports
                </span>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SeoAnalysisForm;