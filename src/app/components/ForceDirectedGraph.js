'use client';

import { useEffect, useRef } from 'react';
import * as d3 from 'd3';

const ForceDirectedGraph = ({ 
  nodes = [], 
  links = [], 
  description = "Interactive network graph",
  width = null, 
  height = null,
  colorLegend = null, // New prop for legend data
  physicsParams = null // New prop for physics parameters
}) => {
  const svgRef = useRef();
  const containerRef = useRef();

  useEffect(() => {
    // Only render if we have data
    if (!nodes.length) {
      console.log('No nodes provided to ForceDirectedGraph');
      return;
    }

    const container = containerRef.current;
    if (!container) return;

    // Get container dimensions or use defaults
    const containerRect = container.getBoundingClientRect();
    const svgWidth = width || Math.max(320, containerRect.width - 16); // Ensure minimum mobile width
    const svgHeight = height || Math.max(400, Math.min(600, svgWidth * 0.75)); // Better mobile aspect ratio

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove(); // Clear previous content

    svg.attr('width', svgWidth)
       .attr('height', svgHeight)
       .attr('viewBox', `0 0 ${svgWidth} ${svgHeight}`)
       .style('width', '100%')
       .style('height', 'auto')
       .style('max-width', '100%');

    // Create color scale
    const color = d3.scaleOrdinal(d3.schemeCategory10);

    // Clone data to avoid mutation
    const nodeData = nodes.map(d => ({ ...d }));
    const linkData = links.map(d => ({ ...d }));

    // Add padding to keep nodes within viewport
    const padding = 10;
    const innerWidth = svgWidth - (padding * 2);
    const innerHeight = svgHeight - (padding * 2);

    // Calculate cluster density for dynamic force adjustment
    const nodeCount = nodeData.length;
    const linkCount = linkData.length;
    const density = linkCount / (nodeCount * (nodeCount - 1) / 2); // Connection density ratio
    
    console.log(`Network density: ${density.toFixed(3)} (${linkCount} links, ${nodeCount} nodes)`);

    // Use custom physics parameters if provided, otherwise calculate based on density
    let linkStrength, chargeStrength, linkDistance, collisionRadius, velocityDecay, alphaDecay, centeringStrength;
    
    if (physicsParams) {
      // Use custom physics parameters
      linkStrength = physicsParams.linkStrength;
      chargeStrength = physicsParams.chargeStrength;
      linkDistance = physicsParams.linkDistance;
      collisionRadius = physicsParams.collisionRadius;
      velocityDecay = physicsParams.velocityDecay;
      alphaDecay = physicsParams.alphaDecay;
      centeringStrength = physicsParams.centeringStrength;
      
      console.log('Using custom physics parameters:', physicsParams);
    } else {
      // Auto-calculate based on network density (fallback behavior)
      linkStrength = Math.max(0.1, Math.min(0.4, 1 - density * 2)); // Reduced max from 0.8 to 0.4
      chargeStrength = Math.max(-150, -100 - (nodeCount * 0.5)); // Gentler charge
      linkDistance = Math.max(60, 80 - (density * 40)); // Shorter links in dense networks
      collisionRadius = 1.2;
      velocityDecay = 0.9;
      alphaDecay = 0.03;
      centeringStrength = 0.05;
      
      console.log(`Using auto-calculated physics: link strength: ${linkStrength.toFixed(2)}, charge: ${chargeStrength}, distance: ${linkDistance}`);
    }

    // Create force simulation with improved parameters for large clusters
    const simulation = d3
      .forceSimulation(nodeData)
      .force('link', d3.forceLink(linkData)
        .id(d => d.id)
        .distance(d => d.distance || linkDistance)
        .strength(linkStrength)
      )
      .force('charge', d3.forceManyBody()
        .strength(d => d.charge || chargeStrength)
        .distanceMin(8) // Increased minimum distance
        .distanceMax(400) // Increased maximum distance
      )
      .force('center', d3.forceCenter(svgWidth / 2, svgHeight / 2))
      .force('collision', d3.forceCollide()
        .radius(d => (d.size || 10) * collisionRadius)
        .strength(0.7) // Reduced collision strength
      )
      .force('x', d3.forceX(svgWidth / 2).strength(centeringStrength))
      .force('y', d3.forceY(svgHeight / 2).strength(centeringStrength))
      .alphaDecay(alphaDecay)
      .velocityDecay(velocityDecay);

    // Create container group with padding
    const containerGroup = svg.append('g')
      .attr('transform', `translate(${padding}, ${padding})`);

    // Create links
    const link = containerGroup
      .append('g')
      .attr('class', 'links')
      .selectAll('line')
      .data(linkData)
      .enter()
      .append('line')
      .attr('stroke', d => d.color || '#999')
      .attr('stroke-opacity', d => d.opacity || 0.6)
      .attr('stroke-width', d => d.width || 2);

    // Create nodes
    const node = containerGroup
      .append('g')
      .attr('class', 'nodes')
      .selectAll('g')
      .data(nodeData)
      .enter()
      .append('g')
      .call(
        d3
          .drag()
          .on('start', dragstarted)
          .on('drag', dragged)
          .on('end', dragended)
      );

    // Add circles to nodes
    node
      .append('circle')
      .attr('r', d => d.size || 10)
      .attr('fill', d => d.color || color(d.group || 1))
      .attr('stroke', '#fff')
      .attr('stroke-width', 2)
      .style('cursor', 'pointer');

    // Add labels to nodes
    node
      .append('text')
      .text(d => d.label || d.id)
      .attr('font-size', d => d.fontSize || '10px')
      .attr('font-family', 'Arial, sans-serif')
      .attr('text-anchor', 'middle')
      .attr('dy', '.35em')
      .attr('fill', d => d.textColor || '#333')
      .style('pointer-events', 'none');

    // Add hover and click effects
    node
      .on('mouseover', function(event, d) {
        d3.select(this).style('stroke-width', 3);
      })
      .on('mouseout', function (event, d) {
        d3.select(this)
          .select('circle')
          .transition()
          .duration(200)
          .attr('r', d.size || 10)
          .attr('stroke-width', 2);
      })
      .on('click', function (event, d) {
        // Prevent event from bubbling and ensure it's a real click (not drag end)
        event.stopPropagation();
        
        // Only trigger click if we're not in the middle of a drag
        if (event.defaultPrevented) return;
        
        // Handle node click events
        console.log('Node clicked:', d.id, d.label);
        
        if (d.onClick && typeof d.onClick === 'function') {
          d.onClick(d);
        } else {
          console.log('No onClick handler or handler not a function:', d.onClick);
          // Fallback click behavior
          if (d.person) {
            const details = [
              `👤 ${d.person.name}`,
              `💼 ${d.person.headline || 'No headline'}`,
              `🏢 ${d.person.currentCompany?.name || 'Unknown Company'}`,
              `📍 ${d.person.location?.full || 'Location not specified'}`
            ].join('\n');
            alert(details);
          } else {
            alert(`Node: ${d.label || d.id}\nGroup: ${d.groupLabel || d.group}`);
          }
        }
      });

    // Boundary function to keep nodes within viewport
    function keepNodesInBounds() {
      nodeData.forEach(d => {
        const radius = d.size || 10;
        d.x = Math.max(radius, Math.min(innerWidth - radius, d.x));
        d.y = Math.max(radius, Math.min(innerHeight - radius, d.y));
      });
    }

    // Update positions on tick
    simulation.on('tick', () => {
      // Keep nodes within bounds
      keepNodesInBounds();

      link
        .attr('x1', d => d.source.x)
        .attr('y1', d => d.source.y)
        .attr('x2', d => d.target.x)
        .attr('y2', d => d.target.y);

      node.attr('transform', d => `translate(${d.x},${d.y})`);
    });

    function dragstarted(event, d) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
      
      // Mark the start position to detect if this is a drag or click
      d._dragStart = { x: event.x, y: event.y };
    }

    function dragged(event, d) {
      const radius = d.size || 10;
      d.fx = Math.max(radius, Math.min(innerWidth - radius, event.x));
      d.fy = Math.max(radius, Math.min(innerHeight - radius, event.y));
      
      // If we've moved significantly, prevent click events
      if (d._dragStart) {
        const dx = event.x - d._dragStart.x;
        const dy = event.y - d._dragStart.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 5) { // 5 pixel threshold
          event.sourceEvent.preventDefault();
        }
      }
    }

    function dragended(event, d) {
      if (!event.active) simulation.alphaTarget(0);
      
      // Check if this was a drag or just a click
      let wasDrag = false;
      if (d._dragStart) {
        const dx = event.x - d._dragStart.x;
        const dy = event.y - d._dragStart.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        wasDrag = distance > 5; // 5 pixel threshold
      }
      
      // Clean up drag tracking
      delete d._dragStart;
      
      // Only release the node if it was actually dragged
      if (wasDrag) {
        d.fx = null;
        d.fy = null;
      } else {
        // If it wasn't a drag, still release but don't prevent click
        d.fx = null;
        d.fy = null;
      }
    }

    // Initial positioning - arrange nodes in a grid to start
    const cols = Math.ceil(Math.sqrt(nodeData.length));
    const cellWidth = innerWidth / cols;
    const cellHeight = innerHeight / cols;
    
    nodeData.forEach((d, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      d.x = (col * cellWidth) + (cellWidth / 2);
      d.y = (row * cellHeight) + (cellHeight / 2);
    });

    // Add zoom and pan functionality
    const zoom = d3.zoom()
      .scaleExtent([0.5, 3])
      .on('zoom', (event) => {
        containerGroup.attr('transform', 
          `translate(${padding + event.transform.x}, ${padding + event.transform.y}) scale(${event.transform.k})`
        );
      });

    svg.call(zoom);

    // Add reset zoom button - positioned relative to SVG viewport with better mobile support
    const buttonWidth = 60;
    const buttonHeight = 30;
    const margin = 10;
    
    // Ensure button fits within SVG bounds
    const buttonX = Math.max(margin, svgWidth - buttonWidth - margin);
    const buttonY = margin;
    
    const resetButton = svg.append('g')
      .attr('class', 'reset-zoom')
      .attr('transform', `translate(${buttonX}, ${buttonY})`)
      .style('cursor', 'pointer')
      .style('pointer-events', 'all') // Ensure it receives events
      .style('z-index', '1000'); // Ensure it's on top

    resetButton.append('rect')
      .attr('width', buttonWidth)
      .attr('height', buttonHeight)
      .attr('rx', 4)
      .attr('fill', 'rgba(255, 255, 255, 0.95)')
      .attr('stroke', '#d1d5db')
      .attr('stroke-width', 1)
      .style('filter', 'drop-shadow(0 1px 3px rgba(0, 0, 0, 0.1))');

    resetButton.append('text')
      .attr('x', buttonWidth / 2)
      .attr('y', buttonHeight / 2 + 1)
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'central')
      .attr('font-size', '11px')
      .attr('font-family', 'system-ui, -apple-system, sans-serif')
      .attr('font-weight', '500')
      .attr('fill', '#374151')
      .text('Reset');

    resetButton.on('click', (event) => {
      event.stopPropagation();
      svg.transition()
        .duration(750)
        .call(zoom.transform, d3.zoomIdentity);
    });

    // Cleanup function
    return () => {
      simulation.stop();
    };
  }, [nodes, links, width, height, physicsParams]);

  // Generate legend data from nodes if not provided
  const getLegendData = () => {
    if (colorLegend) return colorLegend;
    
    // Extract unique groups and their colors from nodes
    const groups = new Map();
    nodes.forEach(node => {
      if (!groups.has(node.group)) {
        groups.set(node.group, {
          color: node.color,
          label: node.groupLabel || node.group,
          count: 1
        });
      } else {
        groups.get(node.group).count++;
      }
    });
    
    return Array.from(groups.entries()).map(([key, value]) => ({
      key,
      ...value
    }));
  };

  const legendData = getLegendData();

  return (
    <div className="flex flex-col items-stretch w-full">
      
      <div className="flex flex-col lg:flex-row gap-6 items-start w-full">
        {/* Main Graph */}
        <div className="flex-1 rounded-lg relative min-w-0" ref={containerRef}>
          <svg
            ref={svgRef}
            className="border rounded w-full h-auto"
            style={{ maxWidth: '100%', height: 'auto' }}
          ></svg>
          <div className="absolute top-2 left-2 bg-white bg-opacity-90 rounded px-2 py-1 text-xs text-gray-600">
            💡 Drag to pan • Scroll to zoom • Click nodes for details
          </div>
        </div>

        {/* Color Legend */}
        {legendData.length > 0 && (
          <div className="bg-white rounded-lg shadow-lg p-4 border w-full lg:w-64 lg:flex-shrink-0">
            <h3 className="font-semibold text-sm text-gray-900 mb-3">Legend</h3>
            <div className="space-y-2">
              {legendData.map((item, index) => (
                <div key={item.key || index} className="flex items-center space-x-3">
                  <div 
                    className="w-4 h-4 rounded-full border border-gray-300"
                    style={{ backgroundColor: item.color }}
                  ></div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900 truncate">
                      {item.label}
                    </div>
                    <div className="text-xs text-gray-500">
                      {item.count} {item.count === 1 ? 'person' : 'people'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Legend footer */}
            <div className="mt-4 pt-3 border-t border-gray-200">
              <div className="text-xs text-gray-500">
                Total: {nodes.length} nodes
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="mt-4 text-sm max-w-2xl text-center mx-auto">
        <p>{description}</p>
        {nodes.length > 0 && (
          <p className="mt-2 text-gray-600">
            Showing {nodes.length} nodes and {links.length} connections. 
          </p>
        )}
      </div>
    </div>
  );
};

export default ForceDirectedGraph; 