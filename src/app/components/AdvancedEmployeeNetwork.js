'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import ForceDirectedGraph from './ForceDirectedGraph';
import GraphControls from './GraphControls';
import NetworkGenerator from '../algorithms/NetworkGenerator';
import NetworkDefaults from '../config/defaults';

// Custom overlay component for node details
const NodeDetailsOverlay = ({ node, onClose }) => {
  if (!node) return null;

  const person = node.person;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50" onClick={onClose}>
      <div 
        className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-t-lg">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <div>
                  <h2 className="text-2xl font-bold">{person?.name || node.label}</h2>
                  <p className="text-blue-100 mt-1">{person?.headline || 'No headline available'}</p>
                </div>
                {/* LinkedIn Icon */}
                {person?.profileUrl && (
                  <a
                    href={person.profileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-auto p-2 bg-white bg-opacity-20 rounded-lg hover:bg-opacity-30 transition-all duration-200 group"
                    title="View LinkedIn Profile"
                  >
                    <div className="w-6 h-6 group-hover:scale-110 transition-transform">
                      <Image 
                        src="/linkedin.svg"
                        alt="LinkedIn"
                        width={24}
                        height={24}
                        className=""
                        onError={(e) => {
                          // Fallback to inline SVG if image fails to load
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'block';
                        }}
                      />
                      {/* Fallback inline SVG */}
                      <svg 
                        className="w-6 h-6 text-blue-600 hidden"
                        fill="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                      </svg>
                    </div>
                  </a>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 transition-colors ml-4"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {person ? (
            <div className="space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-2 flex items-center">
                    <span className="text-lg mr-2">🏢</span>
                    Current Company
                  </h3>
                  <p className="text-gray-700">{person.currentCompany?.name || 'Unknown'}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-2 flex items-center">
                    <span className="text-lg mr-2">📍</span>
                    Location
                  </h3>
                  <p className="text-gray-700">{person.location?.full || 'Not specified'}</p>
                </div>
              </div>

              {/* Statistics */}
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center bg-blue-50 rounded-lg p-4">
                  <div className="text-2xl font-bold text-blue-600">{person.companies.length}</div>
                  <div className="text-sm text-gray-600">Companies</div>
                </div>
                <div className="text-center bg-green-50 rounded-lg p-4">
                  <div className="text-2xl font-bold text-green-600">{person.education.length}</div>
                  <div className="text-sm text-gray-600">Schools</div>
                </div>
                <div className="text-center bg-purple-50 rounded-lg p-4">
                  <div className="text-2xl font-bold text-purple-600">{person.skills.length}</div>
                  <div className="text-sm text-gray-600">Skills</div>
                </div>
              </div>

              {/* Education */}
              {person.education.length > 0 && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                    <span className="text-lg mr-2">🎓</span>
                    Education
                  </h3>
                  <div className="space-y-2">
                    {person.education.slice(0, 3).map((edu, index) => (
                      <div key={index} className="bg-gray-50 rounded-lg p-3">
                        <div className="font-medium text-gray-900">{edu.school}</div>
                        {edu.degree && (
                          <div className="text-sm text-gray-600">{edu.degree}</div>
                        )}
                      </div>
                    ))}
                    {person.education.length > 3 && (
                      <div className="text-sm text-gray-500 text-center py-2">
                        ... and {person.education.length - 3} more schools
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Career History - Now Scrollable */}
              {person.companies.length > 0 && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                    <span className="text-lg mr-2">💼</span>
                    Career History ({person.companies.length} companies)
                  </h3>
                  <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-lg">
                    <div className="space-y-2 p-2">
                      {person.companies.map((company, index) => (
                        <div key={index} className="bg-gray-50 rounded-lg p-3">
                          <div className="font-medium text-gray-900">{company.name}</div>
                          {company.title && (
                            <div className="text-sm text-gray-600">{company.title}</div>
                          )}
                          {company.duration && (
                            <div className="text-xs text-gray-500">{company.duration}</div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Skills */}
              {person.skills.length > 0 && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                    <span className="text-lg mr-2">🛠️</span>
                    Skills
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {person.skills.slice(0, 12).map((skill, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                      >
                        {skill}
                      </span>
                    ))}
                    {person.skills.length > 12 && (
                      <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm">
                        +{person.skills.length - 12} more
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="text-4xl mb-4">🔍</div>
              <h3 className="font-semibold text-gray-900 mb-2">Basic Node Info</h3>
              <p className="text-gray-600">ID: {node.id}</p>
              <p className="text-gray-600">Label: {node.label}</p>
              <p className="text-gray-600">Group: {node.groupLabel || node.group}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 rounded-b-lg">
          <button
            onClick={onClose}
            className="w-full bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

const AdvancedEmployeeNetwork = ({ people: propPeople = [] }) => {
  const [networkData, setNetworkData] = useState({ 
    nodes: [], 
    links: [],
    legendData: [],
    metadata: null 
  });
  const [isLoading, setIsLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const [people, setPeople] = useState([]);
  const [error, setError] = useState(null);
  const [networkGenerator] = useState(() => new NetworkGenerator());
  
  // Node details overlay state
  const [selectedNode, setSelectedNode] = useState(null);

  // Default settings
  const [settings, setSettings] = useState({
    ...NetworkDefaults.network,
    ...NetworkDefaults.ui,
    physicsParams: NetworkDefaults.physics
  });

  // Load employee data on component mount
  useEffect(() => {
    const loadData = async () => {
      try {
        setDataLoading(true);
        setError(null);
        
        // Use prop data if provided
        if (propPeople.length > 0) {
          console.log(`Using ${propPeople.length} people from props`);
          setPeople(propPeople);
          setDataLoading(false);
          return;
        }
        
        // Otherwise, load from data processing
        console.log('Loading employee data from file...');
        
        // Dynamic import to avoid issues with assert syntax
        const DataProcessor = (await import('../data/dataProcessor.js')).default;
        const employeeData = (await import('../data/rilla-employees.json')).default;
        
        const processor = new DataProcessor();
        const processedPeople = await processor.processEmployeeData(employeeData);
        
        console.log(`Successfully loaded ${processedPeople.length} employees`);
        setPeople(processedPeople);
        setDataLoading(false);
        
      } catch (err) {
        console.error('Error loading employee data:', err);
        setError(`Failed to load employee data: ${err.message}`);
        setDataLoading(false);
      }
    };

    // Only load once
    if (dataLoading && people.length === 0) {
      loadData();
    }
  }, []); // Empty dependency array to run only once

  // Initialize network generator with data
  useEffect(() => {
    if (people.length > 0 && !dataLoading) {
      networkGenerator.setPeople(people);
      // Override the default click handler
      networkGenerator.handleNodeClick = (node) => {
        setSelectedNode(node);
      };
      generateNetwork();
    }
  }, [people, dataLoading]);

  const generateNetwork = async () => {
    if (people.length === 0) return;

    setIsLoading(true);
    try {
      // Add small delay to show loading state
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const result = networkGenerator.generateNetwork(settings);
      setNetworkData(result);
      
      console.log('Generated network:', {
        nodes: result.nodes.length,
        links: result.links.length,
        metadata: result.metadata
      });
    } catch (error) {
      console.error('Error generating network:', error);
      setError(`Failed to generate network: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSettingsChange = (newSettings) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  // Regenerate when settings change
  useEffect(() => {
    if (people.length > 0 && !dataLoading && !isLoading) {
      generateNetwork();
    }
  }, [settings]);

  // Show loading state while data is being loaded
  if (dataLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading employee data...</p>
          <p className="text-sm text-gray-500 mt-2">This may take a moment...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="text-center py-8">
        <div className="text-red-500 text-xl mb-4">❌ Error</div>
        <p className="text-gray-600 mb-4">{error}</p>
        <button 
          onClick={() => {
            setError(null);
            setDataLoading(true);
            setPeople([]);
          }}
          className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
        >
          Retry
        </button>
      </div>
    );
  }

  // Show no data state
  if (people.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No employee data available</p>
        <button 
          onClick={() => {
            setDataLoading(true);
            setPeople([]);
          }}
          className="mt-4 px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
        >
          Try Loading Data
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Controls */}
      <GraphControls
        settings={settings}
        onChange={handleSettingsChange}
        metadata={networkData.metadata}
        isLoading={isLoading}
      />

      {/* Network Visualization */}
      {isLoading ? (
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Generating network...</p>
          </div>
        </div>
      ) : (
        <ForceDirectedGraph
          nodes={networkData.nodes}
          links={networkData.links}
          colorLegend={networkData.legendData}
          description={`Network showing ${settings.connectionType} connections`}
          physicsParams={settings.physicsParams}
        />
      )}

      {/* Node Details Overlay */}
      <NodeDetailsOverlay 
        node={selectedNode} 
        onClose={() => setSelectedNode(null)} 
      />
    </div>
  );
};

export default AdvancedEmployeeNetwork; 