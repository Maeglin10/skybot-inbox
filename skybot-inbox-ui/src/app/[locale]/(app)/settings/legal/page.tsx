import Link from 'next/link';

export default function LegalPage() {
  return (
    <div className="space-y-6">
       <div>
          <h2 className="text-2xl font-bold mb-1">Legal</h2>
          <p className="text-sm text-muted-foreground">Terms and Privacy Policy.</p>
       </div>
       <div className="ui-card p-6 space-y-2">
          <Link href="#" className="block text-primary hover:underline">Terms of Service</Link>
          <Link href="#" className="block text-primary hover:underline">Privacy Policy</Link>
          <Link href="#" className="block text-primary hover:underline">Data Processing Agreement</Link>
       </div>
    </div>
  );
}
