'use client';

import * as React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { apiPostClient } from '@/lib/api.client';
import { OnboardingStepper } from '@/components/onboarding/stepper';
import { Button } from '@/components/ui/button';
import { FileUp, FileText, Database } from 'lucide-react';

export default function Step4DataPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tenantId = searchParams.get('tenantId');
  const [files, setFiles] = React.useState<string[]>([]);
  const [loading, setLoading] = React.useState(false);

  const handleUpload = (type: string) => {
     // Mock upload
     const filename = `${type}_export_${new Date().toISOString().slice(0,10)}.csv`;
     setFiles(prev => [...prev, filename]);
  };

  const handleSubmit = async () => {
    if (!tenantId) return;
    setLoading(true);

    try {
      // Mock ingestion trigger
      await apiPostClient(`admin/tenants/${tenantId}/ingestions`, { files });
      router.push(`step5-health?tenantId=${tenantId}`);
    } catch {
       // Proceed anyway for demo
       router.push(`step5-health?tenantId=${tenantId}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-10">
      <OnboardingStepper currentStep={4} />
      
      <div className="ui-card p-6">
        <h1 className="text-xl font-bold mb-4">Data Ingestion</h1>
        <p className="text-sm text-muted-foreground mb-6">Upload initial data to jumpstart the account.</p>
        
        <div className="space-y-4 mb-8">
           <div className="border border-dashed border-border rounded-lg p-6 flex flex-col items-center justify-center gap-3 bg-muted/20 hover:bg-muted/40 transition-colors cursor-pointer" onClick={() => handleUpload('products')}>
              <Database size={32} className="text-muted-foreground opacity-50" />
              <div className="text-center">
                 <div className="text-sm font-medium">Upload Products CSV</div>
                 <div className="text-xs text-muted-foreground">Recommend &lt; 5MB</div>
              </div>
           </div>

           <div className="border border-dashed border-border rounded-lg p-6 flex flex-col items-center justify-center gap-3 bg-muted/20 hover:bg-muted/40 transition-colors cursor-pointer" onClick={() => handleUpload('policies')}>
              <FileText size={32} className="text-muted-foreground opacity-50" />
              <div className="text-center">
                 <div className="text-sm font-medium">Upload Policies PDF</div>
                 <div className="text-xs text-muted-foreground">Knowledge base</div>
              </div>
           </div>
        </div>

        {files.length > 0 && (
           <div className="mb-6 space-y-2">
              <h3 className="text-xs font-semibold uppercase text-muted-foreground">Ready to ingest</h3>
              {files.map((f, i) => (
                 <div key={i} className="flex items-center gap-2 text-sm bg-muted p-2 rounded">
                    <FileUp size={14} /> {f}
                 </div>
              ))}
           </div>
        )}

        <div className="flex justify-between pt-4 border-t">
           <Button variant="ghost" onClick={() => router.back()}>Back</Button>
           <Button onClick={handleSubmit} disabled={loading}>
             {loading ? 'Ingesting...' : 'Next: Verify Health'}
           </Button>
        </div>
      </div>
    </div>
  );
}
