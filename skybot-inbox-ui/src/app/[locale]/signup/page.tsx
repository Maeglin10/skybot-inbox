'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { OnboardingStepper } from '@/components/onboarding/stepper'; 
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { apiPostClient } from '@/lib/api.client';
import { CheckCircle2, ShoppingBag, MessageCircle, FileUp, CreditCard, ArrowRight, Loader2 } from 'lucide-react';

// Steps definition
const STEPS = [
  { id: 1, label: 'Account' },
  { id: 2, label: 'Channels' },
  { id: 3, label: 'Data' },
  { id: 4, label: 'Payment' },
  { id: 5, label: 'Done' }
];

export default function SignupPage() {
  const router = useRouter();
  const [step, setStep] = React.useState(1);
  const [loading, setLoading] = React.useState(false);
  
  // State
  const [formData, setFormData] = React.useState({
    companyName: '',
    email: '',
    phone: '',
    channels: [] as string[],
  });

  // --- Step 1: Info ---
  const handleInfoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStep(2);
  };

  // --- Step 2: Channels ---
  const handleChannelToggle = (ch: string) => {
     setFormData(prev => ({
        ...prev,
        channels: prev.channels.includes(ch) 
           ? prev.channels.filter(c => c !== ch)
           : [...prev.channels, ch]
     }));
  };

  // --- Step 4: Payment ---
  const handlePayment = async () => {
     setLoading(true);
     // Simulate Stripe Checkout creation
     setTimeout(() => {
        setLoading(false);
        setStep(5);
     }, 1500);
  };

  // --- Step 5: Activation ---
  const handleFinish = () => {
     router.push('/inbox'); // or /dashboard
  };

  return (
    <div className="min-h-screen bg-surface flex flex-col items-center py-12 px-4">
       <div className="w-full max-w-3xl mb-10 text-center">
          <h1 className="text-3xl font-bold mb-2">Create your Skybot Account</h1>
          <p className="text-muted-foreground">Setup your AI automation workspace in minutes.</p>
       </div>

       {/* Custom Stepper Visualization for Signup */}
       <div className="w-full max-w-2xl mb-8 flex justify-between relative px-4">
          <div className="absolute top-1/2 left-0 w-full h-0.5 bg-border -z-10" />
          {STEPS.map((s) => {
             const active = s.id === step;
             const done = s.id < step;
             return (
                <div key={s.id} className="flex flex-col items-center gap-2 bg-surface px-2">
                   <div className={`
                      w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all
                      ${active ? 'border-primary bg-primary text-primary-foreground' : ''}
                      ${done ? 'border-primary bg-primary text-primary-foreground' : 'border-muted-foreground/30 bg-surface text-muted-foreground'}
                   `}>
                      {done ? <CheckCircle2 size={16} /> : <span className="text-xs font-bold">{s.id}</span>}
                   </div>
                   <span className={`text-xs font-medium ${active ? 'text-primary' : 'text-muted-foreground'}`}>{s.label}</span>
                </div>
             );
          })}
       </div>

       <div className="w-full max-w-2xl ui-card p-8 animate-in slide-in-from-bottom-4 fade-in duration-500">
          
          {/* STEP 1: ACCOUNT INFO */}
          {step === 1 && (
             <form onSubmit={handleInfoSubmit} className="space-y-4">
                <h2 className="text-xl font-semibold mb-4">Company Details</h2>
                <div className="grid md:grid-cols-2 gap-4">
                   <div className="space-y-2">
                      <label className="text-sm font-medium">Company Name</label>
                      <Input required placeholder="Acme Inc." value={formData.companyName} onChange={e => setFormData({...formData, companyName: e.target.value})} />
                   </div>
                   <div className="space-y-2">
                      <label className="text-sm font-medium">Business Email</label>
                      <Input required type="email" placeholder="you@company.com" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                   </div>
                   <div className="space-y-2">
                      <label className="text-sm font-medium">Phone Number</label>
                      <Input placeholder="+1 234 567 8900" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                   </div>
                </div>
                <div className="flex justify-end pt-4">
                   <Button type="submit" className="gap-2">
                      Next Step <ArrowRight size={16} />
                   </Button>
                </div>
             </form>
          )}

          {/* STEP 2: CHANNELS */}
          {step === 2 && (
             <div className="space-y-6">
                <h2 className="text-xl font-semibold">Connect Channels</h2>
                <p className="text-sm text-muted-foreground">Select the platforms you want to integrate immediately.</p>
                
                <div className="grid sm:grid-cols-2 gap-4">
                   <div 
                      onClick={() => handleChannelToggle('whatsapp')}
                      className={`p-4 border rounded-xl flex items-center gap-4 cursor-pointer transition-all ${formData.channels.includes('whatsapp') ? 'border-green-500 bg-green-50 ring-1 ring-green-500' : 'hover:bg-muted'}`}
                   >
                      <MessageCircle size={24} className="text-green-600" />
                      <div className="flex-1">
                         <div className="font-semibold">WhatsApp</div>
                         <div className="text-xs text-muted-foreground">Business API</div>
                      </div>
                      {formData.channels.includes('whatsapp') && <CheckCircle2 size={20} className="text-green-600" />}
                   </div>

                   <div 
                      onClick={() => handleChannelToggle('shopify')}
                      className={`p-4 border rounded-xl flex items-center gap-4 cursor-pointer transition-all ${formData.channels.includes('shopify') ? 'border-green-800 bg-green-50 ring-1 ring-green-800' : 'hover:bg-muted'}`}
                   >
                      <ShoppingBag size={24} className="text-green-800" />
                      <div className="flex-1">
                         <div className="font-semibold">Shopify</div>
                         <div className="text-xs text-muted-foreground">Store Sync</div>
                      </div>
                      {formData.channels.includes('shopify') && <CheckCircle2 size={20} className="text-green-800" />}
                   </div>
                </div>

                <div className="flex justify-between pt-4">
                   <Button variant="ghost" onClick={() => setStep(1)}>Back</Button>
                   <Button onClick={() => setStep(3)} className="gap-2">
                      Continue <ArrowRight size={16} />
                   </Button>
                </div>
             </div>
          )}

          {/* STEP 3: DATA */}
          {step === 3 && (
             <div className="space-y-6">
                <h2 className="text-xl font-semibold">Import Data</h2>
                <div className="border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center gap-4 hover:bg-muted/50 transition-colors cursor-pointer">
                   <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center">
                      <FileUp size={24} className="text-muted-foreground" />
                   </div>
                   <div>
                      <h3 className="font-semibold">Upload Product CSV or PDF</h3>
                      <p className="text-sm text-muted-foreground mt-1">Drag and drop your catalog or policies here to train the AI.</p>
                   </div>
                   <Button variant="outline" size="sm">Select Files</Button>
                </div>
                
                <div className="flex justify-between pt-4">
                   <Button variant="ghost" onClick={() => setStep(2)}>Back</Button>
                   <Button onClick={() => setStep(4)} className="gap-2">
                      Skip for now <ArrowRight size={16} />
                   </Button>
                </div>
             </div>
          )}

          {/* STEP 4: PAYMENT */}
          {step === 4 && (
             <div className="space-y-6">
                <h2 className="text-xl font-semibold">Start Subscription</h2>
                
                <div className="bg-primary/5 border border-primary/20 rounded-xl p-6 mb-6">
                   <div className="flex justify-between items-start mb-4">
                      <div>
                         <h3 className="text-lg font-bold">Pro Plan</h3>
                         <p className="text-sm text-muted-foreground">Includes all channels and AI features</p>
                      </div>
                      <div className="text-xl font-bold">$49<span className="text-sm font-normal text-muted-foreground">/mo</span></div>
                   </div>
                   
                   <ul className="space-y-2 text-sm">
                      <li className="flex items-center gap-2"><CheckCircle2 size={14} className="text-primary" /> Unlimited Messages</li>
                      <li className="flex items-center gap-2"><CheckCircle2 size={14} className="text-primary" /> 5 Team Members</li>
                      <li className="flex items-center gap-2"><CheckCircle2 size={14} className="text-primary" /> Advanced Analytics</li>
                   </ul>
                </div>

                <div className="flex justify-between pt-4">
                   <Button variant="ghost" onClick={() => setStep(3)}>Back</Button>
                   <Button onClick={handlePayment} disabled={loading} className="w-full sm:w-auto gap-2">
                      {loading ? <Loader2 className="animate-spin" /> : <CreditCard size={16} />}
                      Proceed to Checkout
                   </Button>
                </div>
             </div>
          )}

          {/* STEP 5: DONE */}
          {step === 5 && (
             <div className="text-center py-10 space-y-6">
                <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6 animate-in zoom-in duration-300">
                   <CheckCircle2 size={40} />
                </div>
                <h2 className="text-2xl font-bold">You're all set!</h2>
                <p className="text-muted-foreground max-w-md mx-auto">
                   Your workspace <strong>{formData.companyName}</strong> has been created. 
                   We are provisioning your instances.
                </p>
                <div className="pt-6">
                   <Button size="lg" onClick={handleFinish} className="w-full sm:w-auto min-w-[200px]">
                      Go to Inbox
                   </Button>
                </div>
             </div>
          )}

       </div>
    </div>
  );
}
