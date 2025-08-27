'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import { createWebsite } from '@/services/website.service';

export default function AddWebsitePage() {
  const router = useRouter();
  const { getToken } = useAuth();
  const searchParams = useSearchParams();

  const [url, setUrl] = useState('');
  const [name, setName] = useState('');
  const [cron, setCron] = useState('* * * * *'); // Default to every minute
  const [predefinedSchedule, setPredefinedSchedule] = useState('every_minute'); // Default to every minute

  useEffect(() => {
    const urlFromQuery = searchParams.get('url');
    if (urlFromQuery) {
      setUrl(urlFromQuery);
    }
  }, [searchParams]);

  const handleScheduleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setPredefinedSchedule(value);
    switch (value) {
      case 'every_minute':
        setCron('* * * * *');
        break;
      case 'hourly':
        setCron('0 * * * *');
        break;
      case 'daily':
        setCron('0 0 * * *');
        break;
      case 'weekly':
        setCron('0 0 * * 0');
        break;
      case 'monthly':
        setCron('0 0 1 * *');
        break;
      default:
        setCron('');
        break;
    }
  };
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    const token = await getToken();
    if (!token) {
      setError('Authentication token not found.');
      setLoading(false);
      return;
    }

    try {
      const newWebsite = await createWebsite(token, {
        url,
        name: name || undefined,
        cron: cron || undefined,
      });
      setSuccessMessage(`Website '${newWebsite.name || newWebsite.url}' added successfully!`);
      setTimeout(() => {
        router.push('/dashboard/websites');
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center">
      <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-lg">
        <h1 className="text-3xl font-bold text-center text-gray-800 mb-6">Add a New Website</h1>
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded" role="alert">{error}</div>}
          {successMessage && <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 rounded" role="alert">{successMessage}</div>}

          <div>
            <label htmlFor="url" className="text-sm font-medium text-gray-700">Website URL</label>
            <input
              type="url"
              id="url"
              className="mt-1 block w-full px-4 py-2 bg-gray-100 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              required
              placeholder="https://example.com"
            />
          </div>

          <div>
            <label htmlFor="name" className="text-sm font-medium text-gray-700">Website Name (Optional)</label>
            <input
              type="text"
              id="name"
              className="mt-1 block w-full px-4 py-2 bg-gray-100 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My Awesome Site"
            />
          </div>

          <div>
            <label htmlFor="schedule" className="text-sm font-medium text-gray-700">Analysis Schedule</label>
            <select
              id="schedule"
              className="mt-1 block w-full px-4 py-2 bg-gray-100 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              value={predefinedSchedule}
              onChange={handleScheduleChange}
            >
              <option value="every_minute">Every Minute</option>
              <option value="hourly">Hourly</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>

          <button
            type="submit"
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            disabled={loading}
          >
            {loading ? 'Adding...' : 'Add Website'}
          </button>
        </form>
      </div>
    </div>
  );
}