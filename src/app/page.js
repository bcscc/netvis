import AdvancedEmployeeNetwork from './components/AdvancedEmployeeNetwork';

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-3">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            NetVis - Professional Network Visualizator
          </h1>
        </div>

        {/* Advanced Employee Network Section */}
        <div className="rounded-lg shadow-lg p-6 bg-white border">
          <AdvancedEmployeeNetwork />
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>
            Built with Next.js, D3.js, and advanced network analysis algorithms
          </p>
        </div>
      </div>
    </div>
  );
}
