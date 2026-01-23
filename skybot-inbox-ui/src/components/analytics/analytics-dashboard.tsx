'use client';

import * as React from 'react';
import { 
  fetchMainChart, 
  fetchKpis, 
  fetchBreakdown 
} from '@/lib/adapters/analyticsAdapter';
import type { ChartPoint, KpiData, BreakdownData, TimeRange, MetricGroup } from '@/lib/types/analytics';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';
import { ArrowUp, ArrowDown, Minus, Filter } from 'lucide-react';
import { CardSkeleton, ChartSkeleton } from '@/components/ui/loading-skeletons';
import { EmptyState } from '@/components/ui/empty-state';

// Using consistent palette
// Primary: #9E398D, Secondary: #521E49
const COLORS = ['#9E398D', '#521E49', '#939AA1', '#D4D4D8'];

// --- Sub Components ---

function KpiCard({ data }: { data: KpiData }) {
  const isUp = data.trend === 'up';
  const isDown = data.trend === 'down';
  const isNeutral = data.trend === 'neutral';
  
  return (
    <div className="ui-card p-5 bg-background border border-border flex flex-col justify-between hover:border-primary/50 transition-colors duration-300">
      <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{data.label}</div>
      <div className="mt-2 text-3xl font-extrabold text-foreground tracking-tight">{data.value}</div>
      <div className="mt-2 flex items-center gap-2">
         <span className={`flex items-center text-xs font-medium px-1.5 py-0.5 rounded ${
            isUp ? 'text-green-400 bg-green-400/10' : 
            isDown ? 'text-red-400 bg-red-400/10' : 
            'text-gray-400 bg-gray-400/10'
         }`}>
            {isUp && <ArrowUp size={10} className="mr-1" />}
            {isDown && <ArrowDown size={10} className="mr-1" />}
            {isNeutral && <Minus size={10} className="mr-1" />}
            {data.change}
         </span>
         <span className="text-[10px] text-muted-foreground uppercase">vs last period</span>
      </div>
    </div>
  );
}

function MainChart({ data }: { data: ChartPoint[] }) {
  if (data.length === 0) return <EmptyState heightClass="h-[350px]" title="No Data" description="Not enough data points for this range." />;

  return (
    <div className="ui-card h-[400px] flex flex-col border border-border bg-background">
      <div className="ui-card__header border-b border-white/5 py-4">
         <div className="ui-card__title text-lg font-medium">Performance Trends</div>
         
      </div>
      <div className="ui-card__body min-h-0 pt-4">
         <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
               <defs>
                  <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                     <stop offset="5%" stopColor="#9E398D" stopOpacity={0.3}/>
                     <stop offset="95%" stopColor="#000000" stopOpacity={0}/>
                  </linearGradient>
               </defs>
               <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 10, fill: '#666' }} 
                  tickLine={false}
                  axisLine={false}
                  minTickGap={30}
                  dy={10}
               />
               <YAxis 
                  tick={{ fontSize: 10, fill: '#666' }} 
                  tickLine={false}
                  axisLine={false}
                  dx={-10}
               />
               <Tooltip 
                  contentStyle={{ backgroundColor: '#000000', borderRadius: '8px', border: '1px solid #521E49', fontSize: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.5)' }}
                  itemStyle={{ color: '#fff' }}
                  labelStyle={{ color: '#999', marginBottom: '8px' }}
               />
               <Area 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#9E398D" 
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

function BreakdownChart({ title, data }: { title: string, data: BreakdownData[] }) {
   if (data.length === 0) return <EmptyState heightClass="h-[250px]" title="No Breakdown" />;

   return (
      <div className="ui-card h-[250px] flex flex-col border border-border bg-background">
         <div className="ui-card__header border-b border-white/5 py-3">
            <div className="ui-card__title text-sm">{title}</div>
         </div>
         <div className="ui-card__body min-h-0">
            <ResponsiveContainer width="100%" height="100%">
               <BarChart data={data} layout="vertical" margin={{ left: 20, right: 20, top: 20, bottom: 20 }}>
                  <XAxis type="number" hide />
                  <YAxis dataKey="label" type="category" width={1} tick={false} />
                  <Tooltip 
                     cursor={{fill: 'transparent'}}
                     contentStyle={{ backgroundColor: '#000000', borderRadius: '6px', border: '1px solid #333', fontSize: '12px' }}
                  />
                  <Bar dataKey="value" barSize={16} radius={[0, 4, 4, 0]} label={{ position: 'insideLeft', fill: '#fff', fontSize: 10, offset: 5 }}>
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
        className={`
            px-4 py-2 text-xs font-medium rounded-md transition-all border
            ${active 
                ? 'bg-primary text-primary-foreground border-primary' 
                : 'bg-transparent text-muted-foreground border-border/30 hover:border-border'
            }
        `}
     >
        {label}
     </button>
  );

  return (
    <div className="space-y-8 pb-8">
       {/* Filters */}
       <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
          <div className="flex items-center gap-3">
             <div className="p-2 bg-muted/20 rounded-md text-muted-foreground border border-border/20">
                <Filter size={16} />
             </div>
             <div className="flex flex-col">
               <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Metric Group</label>
               <select 
                 className="h-6 bg-transparent text-sm font-bold border-none focus:ring-0 p-0 text-foreground cursor-pointer outline-none"
                 value={metric}
                 onChange={(e) => setMetric(e.target.value as MetricGroup)}
               >
                  <option value="LEADS">Leads & Acquisition</option>
                  <option value="CONVERSIONS">Conversion & Sales</option>
                  <option value="FOLLOWUPS">Engagement & Follow-ups</option>
               </select>
             </div>
          </div>
          
          <div className="flex gap-3">
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
