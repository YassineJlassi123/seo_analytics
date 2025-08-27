'use client';

import ScoreChart from './ScoreChart';

interface SeoReport {
  performance: number | null;
  accessibility: number | null;
  bestPractices: number | null;
  seo: number | null;
  pwa: number | null;
  metrics: Record<string, unknown> | null;
}

interface AnalysisData {
  report: SeoReport;
  insights: { message: string }[];
}

const SeoAnalysis = ({ analysisData }: { analysisData: AnalysisData }) => {
  const { report, insights } = analysisData;

  if (!report) {
    return <div>No report data available.</div>;
  }

  return (
    <div className="mt-6">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <ScoreChart score={report.performance || 0} label="Performance" />
        <ScoreChart score={report.accessibility || 0} label="Accessibility" />
        <ScoreChart score={report.bestPractices || 0} label="Best Practices" />
        <ScoreChart score={report.seo || 0} label="SEO" />
        <ScoreChart score={report.pwa || 0} label="PWA" />
      </div>

      <div className="mt-8">
        <h4 className="text-md font-medium text-gray-900">Metrics</h4>
        <div className="mt-2 grid grid-cols-1 md:grid-cols-3 gap-4">
          {report.metrics && Object.entries(report.metrics).map(([key, value]) => (
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
          {insights.map((insight: { message: string }, index: number) => (
            <li key={index} className="bg-yellow-50 p-4 rounded-lg">
              <p className="text-sm text-yellow-800">{insight.message}</p>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default SeoAnalysis;