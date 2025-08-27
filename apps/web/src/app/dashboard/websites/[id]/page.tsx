'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import { getWebsiteById, WebsiteWithReportsType } from '@/services/website.service';
import ScoreChart from '@/components/ScoreChart';

// Define the Report type based on the actual structure from WebsiteWithReportsType
interface Report {
  metrics: Record<string, unknown>;
  opportunities: Array<Record<string, unknown>>;
  diagnostics: Array<Record<string, unknown>>;
  rawReport: null;
  id: string;
  websiteId: string;
  userId: string;
  url: string;
  performance: number | null;
  accessibility: number | null;
  bestPractices: number | null;
  seo: number | null;
  pwa: number | null;
  createdAt: string;
}

export default function WebsiteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const [data, setData] = useState<WebsiteWithReportsType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [websiteId, setWebsiteId] = useState<string | null>(null);
  const { getToken } = useAuth();

  useEffect(() => {
    const resolveParams = async () => {
      const resolvedParams = await params;
      setWebsiteId(resolvedParams.id);
    };
    resolveParams();
  }, [params]);

  useEffect(() => {
    const fetchWebsite = async () => {
      const token = await getToken();
      if (!token) {
        setError('Authentication token not found.');
        setLoading(false);
        return;
      }

      if (!websiteId) return;

      try {
        setLoading(true);
        const response = await getWebsiteById(token, websiteId);
        setData(response);
      } catch {
        setError('Failed to fetch website details.');
      } finally {
        setLoading(false);
      }
    };

    if (websiteId) {
      fetchWebsite();
    }
  }, [getToken, websiteId]);

  if (loading) {
    return <div>Loading website details...</div>;
  }

  if (error) {
    return <div className="text-red-500">{error}</div>;
  }

  if (!data) {
    return <div>Website not found.</div>;
  }

  const { website, recentReports } = data;
  const latestReport = recentReports && recentReports[0];

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-2">{website.name}</h1>
      <a href={website.url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">{website.url}</a>
      
      {latestReport && (
        <div className="mt-8 p-6 bg-white rounded-lg shadow-md">
          <h2 className="text-2xl font-bold mb-4">Latest Report</h2>
          <p className="text-sm text-gray-500 mb-6">Analyzed on: {new Date(latestReport.createdAt).toLocaleString()}</p>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 text-center">
            <ScoreChart score={latestReport.performance || 0} label="Performance" />
            <ScoreChart score={latestReport.accessibility || 0} label="Accessibility" />
            <ScoreChart score={latestReport.bestPractices || 0} label="Best Practices" />
            <ScoreChart score={latestReport.seo || 0} label="SEO" />
            <ScoreChart score={latestReport.pwa || 0} label="PWA" />
          </div>
        </div>
      )}

      <div className="mt-8">
        <h2 className="text-2xl font-bold mb-4">Report History</h2>
        <div className="relative overflow-x-auto shadow-md sm:rounded-lg">
          <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
              <tr>
                <th scope="col" className="px-6 py-3">Date</th>
                <th scope="col" className="px-6 py-3">Performance</th>
                <th scope="col" className="px-6 py-3">Accessibility</th>
                <th scope="col" className="px-6 py-3">Best Practices</th>
                <th scope="col" className="px-6 py-3">SEO</th>
              </tr>
            </thead>
            <tbody>
              {recentReports && recentReports.map((report: Report) => (
                <tr key={report.id} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
                  <th scope="row" className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white">
                    {new Date(report.createdAt).toLocaleString()}
                  </th>
                  <td className="px-6 py-4">{report.performance ?? 'N/A'}</td>
                  <td className="px-6 py-4">{report.accessibility ?? 'N/A'}</td>
                  <td className="px-6 py-4">{report.bestPractices ?? 'N/A'}</td>
                  <td className="px-6 py-4">{report.seo ?? 'N/A'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}