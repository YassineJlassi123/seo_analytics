
'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import { getUserWebsites, WebsiteType } from '@/services/website.service';
import Link from 'next/link';

export default function WebsitesPage() {
  const [websites, setWebsites] = useState<WebsiteType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { getToken } = useAuth();

  useEffect(() => {
    const fetchWebsites = async () => {
      const token = await getToken();
      if (!token) {
        setError('Authentication token not found.');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await getUserWebsites(token);
        setWebsites(response);
      } catch (err) {
        setError('Failed to fetch websites.');
      } finally {
        setLoading(false);
      }
    };

    fetchWebsites();
  }, [getToken]);

  if (loading) {
    return <div className="text-center py-10">Loading websites...</div>;
  }

  if (error) {
    return <div className="text-red-500 text-center py-10">{error}</div>;
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="container mx-auto p-4 sm:p-6 lg:p-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Your Websites</h1>
          
        </div>
        
        {websites.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {websites.map((website) => (
              <Link href={`/dashboard/websites/${website.id}`} key={website.id}>
                <div className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300 ease-in-out transform hover:-translate-y-1">
                  <div className="p-6">
                    <h2 className="text-xl font-semibold text-gray-900 truncate">{website.name || 'Unnamed Website'}</h2>
                    <p className="text-gray-600 mt-1 truncate">{website.url}</p>
                    <div className="mt-4 flex items-center justify-between">
                      <span className={`inline-block px-3 py-1 text-xs font-semibold rounded-full ${website.cron ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                        {website.cron ? `Scheduled` : 'Manual Scan'}
                      </span>
                      <span className="text-sm text-gray-500">
                        Last analyzed: {website.lastAnalyzedAt ? new Date(website.lastAnalyzedAt).toLocaleDateString() : 'Never'}
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-white rounded-lg shadow-md">
            <h2 className="text-xl font-semibold text-gray-700">No websites yet!</h2>
            <p className="text-gray-500 mt-2">Get started by adding your first website for analysis.</p>
            <Link href="/dashboard/websites/add" className="mt-4 inline-block bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg shadow-md transition duration-300">
              Add Your First Website
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
