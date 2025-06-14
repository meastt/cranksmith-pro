// components/GearChart.js
import { useEffect, useRef } from 'react';
import * as d3 from 'd3';

export default function GearChart({ crankset, cassette, width = 600, height = 300 }) {
  const svgRef = useRef();

  useEffect(() => {
    if (!crankset || !cassette) return;

    // Clear previous chart
    d3.select(svgRef.current).selectAll("*").remove();

    // Calculate gear ratios
    const gearRatios = calculateGearRatios(crankset, cassette);
    
    // Set up D3 chart
    const svg = d3.select(svgRef.current)
      .attr('width', width)
      .attr('height', height);

    const margin = { top: 20, right: 30, bottom: 40, left: 50 };
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;

    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Scales
    const xScale = d3.scaleLinear()
      .domain([0, gearRatios.length - 1])
      .range([0, chartWidth]);

    const yScale = d3.scaleLinear()
      .domain(d3.extent(gearRatios, d => d.ratio))
      .nice()
      .range([chartHeight, 0]);

    // Color scale for chainrings
    const colorScale = d3.scaleOrdinal()
      .domain(crankset.teeth)
      .range(['#2563eb', '#dc2626', '#059669']); // Blue, Red, Green

    // Add grid lines
    g.append('g')
      .attr('class', 'grid')
      .attr('transform', `translate(0,${chartHeight})`)
      .call(d3.axisBottom(xScale)
        .tickSize(-chartHeight)
        .tickFormat('')
      )
      .style('stroke-dasharray', '3,3')
      .style('opacity', 0.3);

    g.append('g')
      .attr('class', 'grid')
      .call(d3.axisLeft(yScale)
        .tickSize(-chartWidth)
        .tickFormat('')
      )
      .style('stroke-dasharray', '3,3')
      .style('opacity', 0.3);

    // Add axes
    g.append('g')
      .attr('transform', `translate(0,${chartHeight})`)
      .call(d3.axisBottom(xScale).tickFormat(d => `${d + 1}`));

    g.append('g')
      .call(d3.axisLeft(yScale));

    // Add axis labels
    g.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('y', 0 - margin.left)
      .attr('x', 0 - (chartHeight / 2))
      .attr('dy', '1em')
      .style('text-anchor', 'middle')
      .style('font-size', '12px')
      .style('font-family', 'monospace')
      .text('Gear Ratio');

    g.append('text')
      .attr('transform', `translate(${chartWidth / 2}, ${chartHeight + margin.bottom})`)
      .style('text-anchor', 'middle')
      .style('font-size', '12px')
      .style('font-family', 'monospace')
      .text('Gear Number');

    // Line generator
    const line = d3.line()
      .x((d, i) => xScale(i))
      .y(d => yScale(d.ratio))
      .curve(d3.curveMonotoneX);

    // Group by chainring
    const groupedByChainring = d3.group(gearRatios, d => d.chainring);

    // Draw lines for each chainring
    groupedByChainring.forEach((ratios, chainring) => {
      g.append('path')
        .datum(ratios)
        .attr('fill', 'none')
        .attr('stroke', colorScale(chainring))
        .attr('stroke-width', 2)
        .attr('d', line);
    });

    // Add dots for each gear
    g.selectAll('.gear-dot')
      .data(gearRatios)
      .enter()
      .append('circle')
      .attr('class', 'gear-dot')
      .attr('cx', (d, i) => xScale(i))
      .attr('cy', d => yScale(d.ratio))
      .attr('r', 4)
      .attr('fill', d => colorScale(d.chainring))
      .attr('stroke', 'white')
      .attr('stroke-width', 1);

    // Add hover tooltips
    const tooltip = d3.select('body').append('div')
      .attr('class', 'tooltip')
      .style('position', 'absolute')
      .style('background', 'rgba(0, 0, 0, 0.8)')
      .style('color', 'white')
      .style('padding', '8px')
      .style('border-radius', '4px')
      .style('font-size', '12px')
      .style('font-family', 'monospace')
      .style('pointer-events', 'none')
      .style('opacity', 0);

    g.selectAll('.gear-dot')
      .on('mouseover', function(event, d) {
        tooltip.transition().duration(200).style('opacity', 1);
        tooltip.html(`
          <strong>${d.chainring}T × ${d.cog}T</strong><br/>
          Ratio: ${d.ratio.toFixed(2)}<br/>
          Speed @ 90rpm: ${d.speedAt90rpm.toFixed(1)} km/h
        `)
        .style('left', (event.pageX + 10) + 'px')
        .style('top', (event.pageY - 28) + 'px');
      })
      .on('mouseout', function() {
        tooltip.transition().duration(500).style('opacity', 0);
      });

    // Highlight overlapping gears
    const overlaps = findOverlappingGears(gearRatios);
    if (overlaps.length > 0) {
      overlaps.forEach(overlapGroup => {
        const avgRatio = d3.mean(overlapGroup, d => d.ratio);
        const avgIndex = d3.mean(overlapGroup, d => d.index);
        
        g.append('circle')
          .attr('cx', xScale(avgIndex))
          .attr('cy', yScale(avgRatio))
          .attr('r', 12)
          .attr('fill', 'none')
          .attr('stroke', '#f59e0b')
          .attr('stroke-width', 2)
          .attr('stroke-dasharray', '5,5')
          .style('opacity', 0.8);
      });
    }

    // Legend
    const legend = g.append('g')
      .attr('transform', `translate(${chartWidth - 120}, 20)`);

    crankset.teeth.forEach((chainring, i) => {
      const legendRow = legend.append('g')
        .attr('transform', `translate(0, ${i * 20})`);
      
      legendRow.append('line')
        .attr('x1', 0)
        .attr('x2', 15)
        .attr('stroke', colorScale(chainring))
        .attr('stroke-width', 2);
      
      legendRow.append('text')
        .attr('x', 20)
        .attr('y', 4)
        .style('font-size', '12px')
        .style('font-family', 'monospace')
        .text(`${chainring}T`);
    });

    // Cleanup tooltip on unmount
    return () => {
      d3.select('body').selectAll('.tooltip').remove();
    };

  }, [crankset, cassette, width, height]);

  return (
    <div className="gear-chart">
      <svg ref={svgRef}></svg>
    </div>
  );
}

// Helper functions
function calculateGearRatios(crankset, cassette) {
  const ratios = [];
  let index = 0;
  
  // Get cassette range
  const [smallCog, largeCog] = [Math.min(...cassette.teeth), Math.max(...cassette.teeth)];
  const speeds = parseInt(cassette.speeds);
  
  // Generate cog sizes (approximate progression)
  const cogs = generateCogProgression(smallCog, largeCog, speeds);
  
  crankset.teeth.forEach(chainring => {
    cogs.forEach(cog => {
      const ratio = chainring / cog;
      const speedAt90rpm = (ratio * 2.1 * 90 * 60) / 1000; // Approximate speed in km/h
      
      ratios.push({
        chainring,
        cog,
        ratio,
        speedAt90rpm,
        index
      });
      index++;
    });
  });
  
  return ratios.sort((a, b) => a.ratio - b.ratio);
}

function generateCogProgression(smallest, largest, speeds) {
  const cogs = [];
  const ratio = Math.pow(largest / smallest, 1 / (speeds - 1));
  
  for (let i = 0; i < speeds; i++) {
    const cog = Math.round(smallest * Math.pow(ratio, i));
    cogs.push(cog);
  }
  
  return cogs;
}

function findOverlappingGears(ratios, threshold = 0.05) {
  const overlaps = [];
  const processed = new Set();
  
  for (let i = 0; i < ratios.length; i++) {
    if (processed.has(i)) continue;
    
    const current = ratios[i];
    const overlapGroup = [current];
    processed.add(i);
    
    for (let j = i + 1; j < ratios.length; j++) {
      if (processed.has(j)) continue;
      
      const other = ratios[j];
      const percentDiff = Math.abs(current.ratio - other.ratio) / current.ratio;
      
      if (percentDiff < threshold) {
        overlapGroup.push(other);
        processed.add(j);
      }
    }
    
    if (overlapGroup.length > 1) {
      overlaps.push(overlapGroup);
    }
  }
  
  return overlaps;
}