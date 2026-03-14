import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import type { PlanParams, UserSettings } from '../data/types';
import { costCurve } from '../lib/calculator';
import { formatCurrency } from '../lib/format';
import styles from './CostCurveChart.module.css';

const PLAN_COLORS: Record<string, string> = {
  'kaiser-hmo': '#ef4444',
  'aetna-epo': '#f97316',
  'aetna-ppo': '#eab308',
  'hdhp-premium': '#22c55e',
  'hdhp-standard': '#3b82f6',
};

function getPlanColor(planId: string, index: number): string {
  return PLAN_COLORS[planId] ?? d3.schemeTableau10[index % 10];
}

interface Props {
  plans: PlanParams[];
  settings: UserSettings;
  onMarkedSpendChange: (spend: number) => void;
}

export function CostCurveChart({ plans, settings, onMarkedSpendChange }: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return;

    const margin = { top: 20, right: 120, bottom: 50, left: 70 };
    const width = containerRef.current.clientWidth - margin.left - margin.right;
    const height = 420 - margin.top - margin.bottom;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const g = svg
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    const xScale = d3.scaleLinear().domain([0, 25000]).range([0, width]);
    const curves = plans.map(plan => ({ plan, points: costCurve(plan, settings) }));
    const allCosts = curves.flatMap(c => c.points.map(p => p.cost));
    const yMax = Math.max(...allCosts);
    const yScale = d3.scaleLinear().domain([0, yMax * 1.05]).range([height, 0]);

    // Axes
    g.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(xScale).tickFormat(d => `$${(+d / 1000).toFixed(0)}k`))
      .append('text')
      .attr('x', width / 2)
      .attr('y', 40)
      .attr('fill', '#64748b')
      .attr('text-anchor', 'middle')
      .text('Total Annual Healthcare Spend');

    g.append('g')
      .call(d3.axisLeft(yScale).tickFormat(d => `$${(+d / 1000).toFixed(0)}k`))
      .append('text')
      .attr('transform', 'rotate(-90)')
      .attr('x', -height / 2)
      .attr('y', -55)
      .attr('fill', '#64748b')
      .attr('text-anchor', 'middle')
      .text('Your Annual Cost');

    // Lines
    const line = d3.line<{ spend: number; cost: number }>()
      .x(d => xScale(d.spend))
      .y(d => yScale(d.cost));

    curves.forEach(({ plan, points }, i) => {
      const color = getPlanColor(plan.id, i);
      g.append('path')
        .datum(points)
        .attr('fill', 'none')
        .attr('stroke', color)
        .attr('stroke-width', 2.5)
        .attr('d', line);
    });

    // Legend
    const legend = svg.append('g').attr('transform', `translate(${width + margin.left + 8},${margin.top})`);
    curves.forEach(({ plan }, i) => {
      const color = getPlanColor(plan.id, i);
      const row = legend.append('g').attr('transform', `translate(0,${i * 22})`);
      row.append('line').attr('x1', 0).attr('x2', 18).attr('y1', 7).attr('y2', 7)
        .attr('stroke', color).attr('stroke-width', 2.5);
      row.append('text').attr('x', 22).attr('y', 12)
        .attr('font-size', '12px').attr('fill', '#374151').text(plan.name);
    });

    // Draggable marker
    const markerX = xScale(settings.markedSpend);
    const markerGroup = g.append('g').attr('transform', `translate(${markerX},0)`).style('cursor', 'ew-resize');

    markerGroup.append('line')
      .attr('y1', 0)
      .attr('y2', height)
      .attr('stroke', '#6366f1')
      .attr('stroke-width', 2)
      .attr('stroke-dasharray', '6,3');

    markerGroup.append('rect')
      .attr('x', -8)
      .attr('y', height / 2 - 14)
      .attr('width', 16)
      .attr('height', 28)
      .attr('rx', 4)
      .attr('fill', '#6366f1');

    markerGroup.append('text')
      .attr('text-anchor', 'middle')
      .attr('y', height / 2 + 5)
      .attr('fill', 'white')
      .attr('font-size', '9px')
      .text('|||');

    // Tooltip at marker
    const tooltipGroup = g.append('g').attr('transform', `translate(${markerX},0)`);
    const tooltipWidth = 150;
    const tooltipX = markerX + tooltipWidth + 10 > width ? -tooltipWidth - 10 : 10;
    const tooltipBox = tooltipGroup.append('rect')
      .attr('x', tooltipX)
      .attr('y', 4)
      .attr('rx', 4)
      .attr('fill', 'white')
      .attr('stroke', '#e2e8f0')
      .attr('stroke-width', 1);

    const tooltipItems = curves.map(({ plan, points }, i) => {
      const color = getPlanColor(plan.id, i);
      const cost = points.find(p => Math.abs(p.spend - settings.markedSpend) < 200)?.cost
        ?? costCurve(plan, settings, 2).find(p => p.spend >= settings.markedSpend)?.cost ?? 0;
      return { plan, color, cost };
    }).sort((a, b) => a.cost - b.cost);

    tooltipItems.forEach(({ plan, color, cost }, i) => {
      const row = tooltipGroup.append('g').attr('transform', `translate(${tooltipX + 6},${16 + i * 18})`);
      row.append('rect').attr('width', 10).attr('height', 10).attr('fill', color).attr('rx', 2);
      row.append('text').attr('x', 14).attr('y', 9).attr('font-size', '11px').attr('fill', '#374151')
        .text(`${plan.name}: ${formatCurrency(cost)}`);
    });

    tooltipBox
      .attr('width', tooltipWidth)
      .attr('height', tooltipItems.length * 18 + 12);

    // Drag behavior
    const drag = d3.drag<SVGGElement, unknown>()
      .on('drag', (event) => {
        const newX = Math.max(0, Math.min(width, event.x));
        const newSpend = Math.round(xScale.invert(newX));
        onMarkedSpendChange(newSpend);
      });

    markerGroup.call(drag as any);

  }, [plans, settings]);

  return (
    <div className={styles.wrapper} ref={containerRef}>
      <p className={styles.disclaimer}>
        * Copay-based plans (Kaiser HMO, Aetna EPO/PPO) use a blended effective coinsurance rate. Actual costs vary by service mix.
      </p>
      <svg ref={svgRef} style={{ display: 'block', width: '100%' }} />
    </div>
  );
}
