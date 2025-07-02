'use client';

import React, { useRef, useEffect } from 'react';
import * as d3 from 'd3';

const D3ScatterPlot = ({ data, width = 800, height = 500, onPointHover, onPointClick, showAnnotations = false }) => {
  const svgRef = useRef();

  useEffect(() => {
    if (!data || data.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    // Responsive dimensions
    const containerWidth = svgRef.current?.parentElement?.clientWidth || width;
    const actualWidth = Math.min(containerWidth, width);
    const actualHeight = (actualWidth / width) * height;

    const margin = { top: 40, right: 30, bottom: 50, left: 60 };
    const innerWidth = actualWidth - margin.left - margin.right;
    const innerHeight = actualHeight - margin.top - margin.bottom;

    // Set SVG dimensions
    svg.attr('width', actualWidth).attr('height', actualHeight);

    // Scales
    const xExtent = d3.extent(data, d => d.embedding.x);
    const yExtent = d3.extent(data, d => d.embedding.y);
    
    const xScale = d3.scaleLinear()
      .domain(xExtent)
      .range([0, innerWidth])
      .nice();

    const yScale = d3.scaleLinear()
      .domain(yExtent)
      .range([innerHeight, 0])
      .nice();

    // Diverse color palette for better point distinction
    const colorPalette = [
      '#e11d48', // Rose
      '#0ea5e9', // Sky blue
      '#22c55e', // Green
      '#f59e0b', // Amber
      '#8b5cf6', // Violet
      '#ef4444', // Red
      '#06b6d4', // Cyan
      '#84cc16', // Lime
      '#f97316', // Orange
      '#a855f7', // Purple
      '#ec4899', // Pink
      '#10b981', // Emerald
      '#3b82f6', // Blue
      '#eab308', // Yellow
      '#6366f1', // Indigo
      '#14b8a6', // Teal
      '#f43f5e', // Rose red
      '#8b5cf6', // Blue violet
      '#059669', // Emerald green
      '#dc2626'  // Red
    ];

    // Create color scale that cycles through the palette
    const colorScale = d3.scaleOrdinal()
      .domain(d3.range(data.length))
      .range(colorPalette);

    // Alternative: If you want a continuous rainbow-like effect, use this instead:
    // const colorScale = d3.scaleSequential(d3.interpolateRainbow)
    //   .domain([0, data.length - 1]);

    // Or for a more scientific look, use viridis:
    // const colorScale = d3.scaleSequential(d3.interpolateViridis)
    //   .domain([0, data.length - 1]);

    // Create main group
    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Add subtle grid lines
    g.append('g')
      .attr('class', 'grid')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(d3.axisBottom(xScale)
        .tickSize(-innerHeight)
        .tickFormat('')
      )
      .style('stroke-dasharray', '2,2')
      .style('opacity', 0.3);

    g.append('g')
      .attr('class', 'grid')
      .call(d3.axisLeft(yScale)
        .tickSize(-innerWidth)
        .tickFormat('')
      )
      .style('stroke-dasharray', '2,2')
      .style('opacity', 0.3);

    // Add axes
    const xAxis = g.append('g')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(d3.axisBottom(xScale).ticks(6));

    const yAxis = g.append('g')
      .call(d3.axisLeft(yScale).ticks(6));

    // Style axes
    [xAxis, yAxis].forEach(axis => {
      axis.selectAll('path, line')
        .style('stroke', '#e5e7eb')
        .style('stroke-width', 1);
      axis.selectAll('text')
        .style('fill', '#6b7280')
        .style('font-size', '12px')
        .style('font-family', 'system-ui, -apple-system, sans-serif');
    });

    // Add axis labels
    g.append('text')
      .attr('x', innerWidth / 2)
      .attr('y', innerHeight + 40)
      .style('text-anchor', 'middle')
      .style('fill', '#6b7280')
      .style('font-size', '14px')
      .style('font-family', 'system-ui, -apple-system, sans-serif')
      .text('Embedding Dimension 1');

    g.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('y', -40)
      .attr('x', -innerHeight / 2)
      .style('text-anchor', 'middle')
      .style('fill', '#6b7280')
      .style('font-size', '14px')
      .style('font-family', 'system-ui, -apple-system, sans-serif')
      .text('Embedding Dimension 2');

    // Create tooltip
    const tooltip = d3.select('body').selectAll('.d3-tooltip').data([0]);
    const tooltipEnter = tooltip.enter()
      .append('div')
      .attr('class', 'd3-tooltip');
    
    const tooltipMerged = tooltipEnter.merge(tooltip)
      .style('opacity', 0)
      .style('position', 'absolute')
      .style('background', 'rgba(17, 24, 39, 0.95)')
      .style('color', 'white')
      .style('padding', '8px 12px')
      .style('border-radius', '6px')
      .style('font-size', '13px')
      .style('font-family', 'system-ui, -apple-system, sans-serif')
      .style('pointer-events', 'none')
      .style('z-index', '1000')
      .style('box-shadow', '0 4px 6px -1px rgba(0, 0, 0, 0.1)')
      .style('backdrop-filter', 'blur(4px)');

    // Add points with smooth animation
    const points = g.selectAll('.point')
      .data(data)
      .enter().append('circle')
      .attr('class', 'point')
      .attr('cx', d => xScale(d.embedding.x))
      .attr('cy', d => yScale(d.embedding.y))
      .attr('r', 0)
      .attr('fill', (d, i) => colorScale(i))
      .attr('stroke', 'white')
      .attr('stroke-width', 2)
      .style('cursor', 'pointer')
      .style('filter', 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.1))')
      .on('mouseover', function(event, d) {
        d3.select(this)
          .transition()
          .duration(150)
          .attr('r', 8)
          .attr('stroke-width', 3)
          .style('filter', 'drop-shadow(0 4px 8px rgba(0, 0, 0, 0.15))');

        tooltipMerged.transition()
          .duration(150)
          .style('opacity', 1);

        tooltipMerged.html(`
          <div style="font-weight: 600; margin-bottom: 4px;">${d.text}</div>
          <div style="font-size: 11px; opacity: 0.8;">
            X: ${d.embedding.x.toFixed(2)} • Y: ${d.embedding.y.toFixed(2)}
          </div>
        `)
          .style('left', (event.pageX + 12) + 'px')
          .style('top', (event.pageY - 8) + 'px');

        if (onPointHover) onPointHover(d);
      })
      .on('mouseout', function() {
        d3.select(this)
          .transition()
          .duration(150)
          .attr('r', 6)
          .attr('stroke-width', 2)
          .style('filter', 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.1))');

        tooltipMerged.transition()
          .duration(200)
          .style('opacity', 0);
      })
      .on('click', function(event, d) {
        if (onPointClick) onPointClick(d);
      });

    // Animate points appearing
    points.transition()
      .duration(600)
      .delay((d, i) => i * 50)
      .ease(d3.easeBackOut.overshoot(1.2))
      .attr('r', 6);

    // Add persistent text labels (controlled by showAnnotations prop)
    const labels = g.selectAll('.label')
      .data(data)
      .enter().append('text')
      .attr('class', 'label')
      .attr('x', d => xScale(d.embedding.x))
      .attr('y', d => yScale(d.embedding.y) - 12)
      .attr('text-anchor', 'middle')
      .style('font-size', '11px')
      .style('font-family', 'system-ui, -apple-system, sans-serif')
      .style('fill', '#374151')
      .style('font-weight', '500')
      .style('opacity', showAnnotations ? 0.9 : 0)
      .style('pointer-events', 'none')
      .style('text-shadow', '0 1px 2px rgba(255, 255, 255, 0.8)')
      .text(d => d.text.length > 20 ? d.text.substring(0, 20) + '...' : d.text);

    // Add background rectangles for labels when annotations are shown
    if (showAnnotations) {
      const labelBgs = g.selectAll('.label-bg')
        .data(data)
        .enter().insert('rect', '.label')
        .attr('class', 'label-bg')
        .attr('x', d => {
          const textLength = (d.text.length > 20 ? d.text.substring(0, 20) + '...' : d.text).length;
          return xScale(d.embedding.x) - (textLength * 3.2);
        })
        .attr('y', d => yScale(d.embedding.y) - 24)
        .attr('width', d => {
          const textLength = (d.text.length > 20 ? d.text.substring(0, 20) + '...' : d.text).length;
          return textLength * 6.4;
        })
        .attr('height', 16)
        .attr('rx', 4)
        .style('fill', 'rgba(255, 255, 255, 0.9)')
        .style('stroke', 'rgba(226, 232, 240, 0.8)')
        .style('stroke-width', 1)
        .style('opacity', 0.9)
        .style('pointer-events', 'none');
    }

    // Update labels when showAnnotations changes
    labels.transition()
      .duration(300)
      .style('opacity', showAnnotations ? 0.9 : 0);

    // Update hover behavior - only show temporary labels when annotations are off
    if (!showAnnotations) {
      points.on('mouseover.label', function(event, d) {
        labels.filter(label => label.id === d.id)
          .transition()
          .duration(150)
          .style('opacity', 0.8);
      }).on('mouseout.label', function() {
        labels.transition()
          .duration(200)
          .style('opacity', 0);
      });
    } else {
      // Remove hover label behavior when annotations are always shown
      points.on('mouseover.label', null).on('mouseout.label', null);
    }

    // Cleanup function
    return () => {
      d3.select('body').selectAll('.d3-tooltip').remove();
    };

  }, [data, width, height, onPointHover, onPointClick, showAnnotations]);

  return (
    <div className="d3-plot-container">
      <svg
        ref={svgRef}
        style={{ 
          background: '#fafbff',
          borderRadius: '8px',
          width: '100%',
          height: 'auto',
          maxWidth: '100%'
        }}
      />
    </div>
  );
};

export default D3ScatterPlot;
