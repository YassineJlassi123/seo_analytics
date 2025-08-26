'use client';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import SeoAnalysis from '@/components/SeoAnalysis';

export default function DashboardPage() {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <main className="flex-grow p-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Dashboard</h1>
          <SeoAnalysis />
        </div>
      </main>
      <Footer />
    </div>
  );
}

