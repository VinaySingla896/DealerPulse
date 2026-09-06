import React from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  BarChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell,
  LabelList,
} from 'recharts';
import { BranchForecast } from '../types';
import { MonthlyTrendPoint } from '../lib/metrics';
import { formatINR } from '../lib/data';

/* Palette aligned with the Tailwind tokens used across the app */
const C = {
  slate: '#475569',
  slateLight: '#cbd5e1',
  red: '#dc2626',
  emerald: '#059669',
  blue: '#2563eb',
  amber: '#f59e0b',
  grid: '#e2e8f0',
  axis: '#94a3b8',
};

const axisProps = {
  tick: { fontSize: 11, fill: C.axis },
  tickLine: false,
  axisLine: { stroke: C.grid },
};

const tooltipStyle = {
  contentStyle: {
    fontSize: 12,
    borderRadius: 8,
    border: '1px solid #e2e8f0',
    boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
  },
} as const;

/** Leads created (bars) vs vehicles delivered (line) by month, with the monthly unit target. */
export const MonthlyActivityChart: React.FC<{ data: MonthlyTrendPoint[] }> = ({ data }) => (
  <ResponsiveContainer width="100%" height={260}>
    <ComposedChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -12 }}>
      <CartesianGrid strokeDasharray="3 3" stroke={C.grid} vertical={false} />
      <XAxis dataKey="label" {...axisProps} />
      <YAxis {...axisProps} />
      <Tooltip {...tooltipStyle} />
      <Legend wrapperStyle={{ fontSize: 11 }} />
      <Bar dataKey="leadsCreated" name="Leads created" fill={C.slateLight} radius={[3, 3, 0, 0]} />
      <Line
        type="monotone"
        dataKey="delivered"
        name="Delivered"
        stroke={C.emerald}
        strokeWidth={2.5}
        dot={{ r: 3 }}
      />
      <Line
        type="monotone"
        dataKey="targetUnits"
        name="Monthly target"
        stroke={C.red}
        strokeWidth={1.5}
        strokeDasharray="4 4"
        dot={false}
      />
    </ComposedChart>
  </ResponsiveContainer>
);

/** Horizontal bar of lead-to-delivery conversion by branch, coloured by band. */
export const BranchConversionChart: React.FC<{
  data: { branchName: string; conversionRate: number }[];
  groupMean: number;
}> = ({ data, groupMean }) => {
  const rows = [...data]
    .sort((a, b) => b.conversionRate - a.conversionRate)
    .map((b) => ({ name: b.branchName.replace(' Toyota', ''), pct: +(b.conversionRate * 100).toFixed(1) }));

  return (
    <ResponsiveContainer width="100%" height={Math.max(160, rows.length * 44)}>
      <BarChart data={rows} layout="vertical" margin={{ top: 4, right: 40, bottom: 0, left: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={C.grid} horizontal={false} />
        <XAxis type="number" unit="%" {...axisProps} />
        <YAxis type="category" dataKey="name" width={78} {...axisProps} />
        <Tooltip {...tooltipStyle} formatter={(v: number) => [`${v}%`, 'Conversion']} />
        <Bar dataKey="pct" radius={[0, 4, 4, 0]} barSize={20}>
          <LabelList dataKey="pct" position="right" formatter={(v: number) => `${v}%`} style={{ fontSize: 11, fill: C.slate }} />
          {rows.map((r) => (
            <Cell
              key={r.name}
              fill={
                r.pct >= groupMean * 100 * 1.1
                  ? C.emerald
                  : r.pct >= groupMean * 100 * 0.6
                  ? C.blue
                  : C.red
              }
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
};

/** Delivered vs monthly target units, grouped bars by month. */
export const DeliveriesVsTargetChart: React.FC<{ data: MonthlyTrendPoint[] }> = ({ data }) => (
  <ResponsiveContainer width="100%" height={260}>
    <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -12 }}>
      <CartesianGrid strokeDasharray="3 3" stroke={C.grid} vertical={false} />
      <XAxis dataKey="label" {...axisProps} />
      <YAxis {...axisProps} />
      <Tooltip {...tooltipStyle} />
      <Legend wrapperStyle={{ fontSize: 11 }} />
      <Bar dataKey="targetUnits" name="Target" fill={C.slateLight} radius={[3, 3, 0, 0]} />
      <Bar dataKey="delivered" name="Delivered" fill={C.blue} radius={[3, 3, 0, 0]} />
    </BarChart>
  </ResponsiveContainer>
);

/** Per-branch projected attainment (delivered + expected pipeline) as % of target. */
export const ProjectedAttainmentChart: React.FC<{ data: BranchForecast[] }> = ({ data }) => {
  const rows = [...data]
    .sort((a, b) => a.projectedAttainmentPct - b.projectedAttainmentPct)
    .map((f) => ({
      name: f.branchName.replace(' Toyota', ''),
      delivered: +(f.attainmentUnitsPct * 100).toFixed(1),
      expected: +((f.projectedAttainmentPct - f.attainmentUnitsPct) * 100).toFixed(1),
      total: Math.round(f.projectedAttainmentPct * 100),
    }));

  return (
    <ResponsiveContainer width="100%" height={Math.max(160, rows.length * 44)}>
      <BarChart data={rows} layout="vertical" margin={{ top: 4, right: 44, bottom: 0, left: 8 }} stackOffset="none">
        <CartesianGrid strokeDasharray="3 3" stroke={C.grid} horizontal={false} />
        <XAxis type="number" unit="%" {...axisProps} />
        <YAxis type="category" dataKey="name" width={78} {...axisProps} />
        <Tooltip {...tooltipStyle} formatter={(v: number, n) => [`${v}%`, n === 'delivered' ? 'Delivered' : 'Expected pipeline']} />
        <Legend wrapperStyle={{ fontSize: 11 }} />
        <Bar dataKey="delivered" name="Delivered" stackId="a" fill={C.blue} barSize={20} />
        <Bar dataKey="expected" name="Expected pipeline" stackId="a" fill={C.amber} radius={[0, 4, 4, 0]}>
          <LabelList dataKey="total" position="right" formatter={(v: number) => `${v}%`} style={{ fontSize: 11, fill: C.slate }} />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
};

/** Revenue delivered by month — compact area/bar for KPI context. */
export const MonthlyRevenueChart: React.FC<{ data: MonthlyTrendPoint[] }> = ({ data }) => (
  <ResponsiveContainer width="100%" height={200}>
    <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 4 }}>
      <CartesianGrid strokeDasharray="3 3" stroke={C.grid} vertical={false} />
      <XAxis dataKey="label" {...axisProps} />
      <YAxis {...axisProps} tickFormatter={(v: number) => `${(v / 10000000).toFixed(0)}Cr`} width={40} />
      <Tooltip {...tooltipStyle} formatter={(v: number) => [formatINR(v), 'Revenue']} />
      <Bar dataKey="deliveredRevenue" name="Delivered revenue" fill={C.emerald} radius={[3, 3, 0, 0]} />
    </BarChart>
  </ResponsiveContainer>
);
