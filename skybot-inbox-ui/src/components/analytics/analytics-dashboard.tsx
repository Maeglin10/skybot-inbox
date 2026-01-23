'use client';

import * as React from 'react';
import { 
  fetchMainChart, 
  fetchKpis, 
  fetchBreakdown 
} from '@/lib/adapters/analyticsAdapter';
import type { ChartPoint, KpiData, BreakdownData, TimeRange, MetricGroup } from '@/lib/types/analytics';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';
import { ArrowUp, ArrowDown, Minus, Filter, Calendar } from 'lucide-react';
import { CardSkeleton, ChartSkeleton } from '@/components/ui/loading-skeletons';
import { EmptyState } from '@/components/ui/empty-state';

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042'];

// --- Sub Components ---

function KpiCard({ data }: { data: KpiData }) {
  const isUp = data.trend === 'up';
  const isDown = data.trend === 'down';
  const isNeutral = data.trend === 'neutral';
  
  return (
    <div className="ui-card p-4 transition-all hover:bg-muted/10">
      <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{data.label}</div>
      <div className="text-2xl font-bold my-2">{data.value}</div>
      <div className="flex items-center text-xs gap-1.5 p-1.5 rounded-md bg-muted/20 w-max">
         {isUp && <ArrowUp size={12} className="text-green-500" />}
         {isDown && <ArrowDown size={12} className="text-red-500" />}
         {isNeutral && <Minus size={12} className="text-gray-500" />}
         <span className={`font-medium ${isUp ? 'text-green-500' : isDown ? 'text-red-500' : 'text-muted-foreground'}`}>
            {data.change}
         </span>
         <span className="text-muted-foreground/70">vs last period</span>
      </div>
    </div>
  );
}

function MainChart({ data }: { data: ChartPoint[] }) {
  if (data.length === 0) return <EmptyState heightClass="h-[350px]" title="No Data" description="Not enough data points for this range." />;

  return (
    <div className="ui-card h-[350px] flex flex-col">
      <div className="ui-card__header">
         <div className="ui-card__title">Performance Trends</div>
         <div className="text-xs text-muted-foreground bg-background px-2 py-1 rounded border border-border/30">Last updated recently</div>
      </div>
      <div className="ui-card__body min-h-0">
         <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
               <defs>
                  <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                     <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
                     <stop offset="95%" stopColor="#8884d8" stopOpacity={0}/>
                  </linearGradient>
               </defs>
               <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 10, fill: '#888' }} 
                  tickLine={false}
                  axisLine={false}
                  minTickGap={30}
               />
               <YAxis 
                  tick={{ fontSize: 10, fill: '#888' }} 
                  tickLine={false}
                  axisLine={false}
               />
               <Tooltip 
                  contentStyle={{ backgroundColor: '#1a1d21', borderRadius: '8px', border: '1px solid #333', fontSize: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.5)' }}
                  itemStyle={{ color: '#e5e7eb' }}
                  labelStyle={{ color: '#9ca3af', marginBottom: '8px' }}
               />
               <Area 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#8884d8" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#colorVal)" 
               />
            </AreaChart>
         </ResponsiveContainer>
      </div>
    </div>
  );
}

function BreakdownChart({ title, data, type = 'bar' }: { title: string, data: BreakdownData[], type?: 'bar' }) {
   if (data.length === 0) return <EmptyState heightClass="h-[250px]" title="No Breakdown" />;

   return (
      <div className="ui-card h-[250px] flex flex-col">
         <div className="ui-card__header">
            <div className="ui-card__title">{title}</div>
         </div>
         <div className="ui-card__body min-h-0">
            <ResponsiveContainer width="100%" height="100%">
               <BarChart data={data} layout="vertical" margin={{ left: 40, right: 20 }}>
                  <XAxis type="number" hide />
                  <YAxis dataKey="label" type="category" width={1} tick={false} />
                  <Tooltip 
                     cursor={{fill: 'transparent'}}
                     contentStyle={{ backgroundColor: '#1a1d21', borderRadius: '8px', border: '1px solid #333', fontSize: '12px' }}
                  />
                  <Bar dataKey="value" barSize={20} radius={[0, 4, 4, 0]} label={{ position: 'insideLeft', fill: '#fff', fontSize: 10, offset: 5 }}>
                     {data.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                     ))}
                  </Bar>
               </BarChart>
            </ResponsiveContainer>
         </div>
      </div>
   )
}

// --- Main Dashboard ---

export default function AnalyticsDashboard() {
  const [range, setRange] = React.useState<TimeRange>('30d');
  const [metric, setMetric] = React.useState<MetricGroup>('LEADS');
  const [loading, setLoading] = React.useState(true);
  
  const [chartData, setChartData] = React.useState<ChartPoint[]>([]);
  const [kpis, setKpis] = React.useState<KpiData[]>([]);
  const [channelData, setChannelData] = React.useState<BreakdownData[]>([]);
  const [tempData, setTempData] = React.useState<BreakdownData[]>([]);

  React.useEffect(() => {
     let active = true;
     async function load() {
        setLoading(true);
        try {
           const [c, k, ch, te] = await Promise.all([
              fetchMainChart(range, metric),
              fetchKpis(metric),
              fetchBreakdown('CHANNEL'),
              fetchBreakdown('TEMPERATURE')
           ]);
           if (active) {
              setChartData(c);
              setKpis(k);
              setChannelData(ch);
              setTempData(te);
              setLoading(false);
           }
        } catch {
           if(active) setLoading(false);
        }
     }
     load();
     return () => { active = false; };
  }, [range, metric]);

  const FilterBtn = ({ active, label, onClick }: { active: boolean, label: string, onClick: () => void }) => (
     <button 
        onClick={onClick}
        className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all border ${active ? 'bg-primary text-primary-foreground border-primary shadow-sm' : 'bg-transparent text-muted-foreground border-transparent hover:bg-muted'}`}
     >
        {label}
     </button>
  );

  return (
    <div className="space-y-6 pb-8">
       {/* Filters */}
       <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-muted/10 p-2 rounded-xl border border-border/20 backdrop-blur-sm sticky top-0 z-10 transition-all">
          <div className="flex items-center gap-3 pl-2">
             <div className="p-2 bg-muted/20 rounded text-muted-foreground">
                <Filter size={16} />
             </div>
             <div className="flex flex-col">
               <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Metric Group</label>
               <select 
                 className="h-6 bg-transparent text-sm font-medium border-none focus:ring-0 p-0 text-foreground cursor-pointer"
                 value={metric}
                 onChange={(e) => setMetric(e.target.value as MetricGroup)}
               >
                  <option value="LEADS">Leads & Acquisition</option>
                  <option value="CONVERSIONS">Conversion & Sales</option>
                  <option value="FOLLOWUPS">Engagement & Follow-ups</option>
               </select>
             </div>
          </div>
          
          <div className="flex bg-muted/20 rounded-lg p-1 border border-border/10">
             <FilterBtn active={range === '7d'} label="7D" onClick={() => setRange('7d')} />
             <FilterBtn active={range === '30d'} label="30D" onClick={() => setRange('30d')} />
             <FilterBtn active={range === '90d'} label="3M" onClick={() => setRange('90d')} />
          </div>
       </div>

       {loading ? (
          <div className="space-y-6 animate-pulse">
             <CardSkeleton count={4} />
             <ChartSkeleton height="h-[350px]" />
             <div className="grid grid-cols-2 gap-4">
                <ChartSkeleton height="h-[250px]" />
                <ChartSkeleton height="h-[250px]" />
             </div>
          </div>
       ) : (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
             {/* KPIs */}
             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {kpis.map((k, i) => <KpiCard key={i} data={k} />)}
             </div>

             {/* Main Chart */}
             <MainChart data={chartData} />

             {/* Breakdowns */}
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <BreakdownChart title="Channels Distribution" data={channelData} />
                <BreakdownChart title="Lead Temperature" data={tempData} />
             </div>
          </div>
       )}
    </div>
  );
}
