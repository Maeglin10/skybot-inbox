'use client';

import { useEffect, useState } from 'react';
import { templatesApi } from '@/lib/api/agents';
import { AgentTemplate } from '@/types/agents';
import { TemplateCard } from '@/components/agents/template-card';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

export default function MarketplacePage() {
  const [templates, setTemplates] = useState<AgentTemplate[]>([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadTemplates();
  }, []);

  async function loadTemplates() {
    try {
       const { data } = await templatesApi.getAll();
       if(Array.isArray(data)) {
          setTemplates(data);
       } else {
          setTemplates([]);
       }
    } catch (e) {
       console.error("Error loading templates", e);
       // Mock fallback
       setTemplates([
          { id: 't1', slug: 'support-genius', name: 'Support Genius', description: 'Advanced L1 Support Agent trained on generic data.', category: 'SUPPORT', version: '1.0', screenshots: [], useCases: ['Support'], isPremium: false, installCount: 1540, avgRating: 4.8 },
          { id: 't2', slug: 'sales-shark', name: 'Sales Shark', description: 'Aggressive outbound sales agent for cold leads.', category: 'SALES', version: '1.2', screenshots: [], useCases: ['Sales'], isPremium: true, installCount: 890, avgRating: 4.5 },
          { id: 't3', slug: 'data-cruncher', name: 'Data Cruncher', description: 'Analyzes CSV uploads and generates reports.', category: 'ANALYTICS', version: '0.9', screenshots: [], useCases: ['Data'], isPremium: false, installCount: 320, avgRating: 4.2 }
       ]);
    }
  }

  const filteredTemplates = templates.filter((t) =>
    t.name.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Agent Marketplace</h1>
        <p className="text-muted-foreground">
          Browse and install 50+ ready-to-use AI agents
        </p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search agents..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTemplates.map((template) => (
          <TemplateCard key={template.id} template={template} />
        ))}
      </div>
    </div>
  );
}
