'use client';

import { useState, useEffect } from 'react';

interface AnalysisLoaderProps {
  url: string;
}

const loadingTexts = [
  'Warming up the engines...',
  'Connecting to the target URL...',
  'Running SEO audit...',
  'Checking for best practices...',
  'Analyzing performance metrics...',
  'Checking accessibility...',
  'Compiling the report...',
  'Almost there...',
];

const AnalysisLoader = ({ url }: AnalysisLoaderProps) => {
  const [currentText, setCurrentText] = useState(loadingTexts[0]);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Animate the loading text
    let textIndex = 0;
    const textInterval = setInterval(() => {
      textIndex = (textIndex + 1) % loadingTexts.length;
      setCurrentText(loadingTexts[textIndex]);
    }, 2500);

    // Animate the progress bar
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 95) {
          clearInterval(progressInterval);
          return 95;
        }
        // Animate quickly at the start, then slow down
        const increment = prev < 60 ? Math.random() * 5 : Math.random() * 2;
        return Math.min(prev + increment, 95);
      });
    }, 800);

    return () => {
      clearInterval(textInterval);
      clearInterval(progressInterval);
    };
  }, []);

  return (
    <div className="text-center p-8 my-6 bg-gray-50 rounded-lg border-dashed border-2 border-gray-300">
      <div className="flex justify-center items-center mb-4">
        <svg className="animate-spin -ml-1 mr-3 h-8 w-8 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <h3 className="text-xl font-medium text-gray-800">Analyzing your website...</h3>
      </div>
      <p className="text-sm text-gray-600 truncate mb-4">
        <span className="font-semibold">URL:</span> {url}
      </p>
      
      <div className="w-full bg-gray-200 rounded-full h-2.5 mb-2">
        <div 
          className="bg-indigo-600 h-2.5 rounded-full transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        ></div>
      </div>
      <p className="text-sm text-indigo-700 font-medium animate-pulse">
        {currentText}
      </p>
    </div>
  );
};

export default AnalysisLoader;
