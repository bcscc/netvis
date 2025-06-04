import AdvancedEmployeeNetwork from './components/AdvancedEmployeeNetwork';
import Image from 'next/image';

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-3">
          <div className="flex items-center justify-center gap-4">
            <Image 
              src="/NetVisLogo2.png" 
              alt="NetVis Logo" 
              width={64}
              height={64}
            />
            <h1 className="text-4xl font-bold text-gray-900">
              NetVis - Visualize your Professional Network
            </h1>
          </div>
        </div>

        {/* Info Section */}
        <div className="mb-6 text-center">
          <p className="text-gray-700 mb-2">
            Interactive network visualization that reveals hidden connections between people through their shared affiliations - schools, companies, skills, and locations.
          </p>
          <div className="inline-block bg-yellow-100 border border-yellow-300 rounded-lg px-4 py-2 shadow-lg">
            <p className="text-sm text-yellow-800">
              <strong>Note:</strong> Currently displaying sample employee profiles from <a href="https://www.linkedin.com/company/rilla-co/" target="_blank" rel="noopener noreferrer" className="text-blue-800 hover:underline transition-colors">Rilla</a>. Future versions will connect to your personal LinkedIn network.
            </p>
          </div>
        </div>

        {/* Advanced Employee Network Section */}
        <div className="rounded-lg shadow-lg p-6 bg-white border">
          <AdvancedEmployeeNetwork />
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>
            Built by{' '}
            <a 
              href="https://www.linkedin.com/in/berniechen/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 hover:underline transition-colors"
            >
              Bernie
            </a>
            {' '}with{' '}
            <a 
              href="https://nextjs.org" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 hover:underline transition-colors"
            >
              Next.js
            </a>
            {' '}and{' '}
            <a 
              href="https://d3js.org" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 hover:underline transition-colors"
            >
              D3.js
            </a>.
          </p>
        </div>
      </div>
    </div>
  );
}
