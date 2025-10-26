import React from 'react';

function TestApp() {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-md text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">AI Dialer Test</h1>
        <p className="text-gray-600 mb-4">If you can see this, React is working!</p>
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
          ✅ Frontend is working correctly
        </div>
      </div>
    </div>
  );
}

export default TestApp;
