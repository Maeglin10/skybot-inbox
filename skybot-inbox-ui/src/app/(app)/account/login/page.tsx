import LoginForm from '@/components/account/login-form';

export const dynamic = "force-dynamic";

export default function LoginPage() {
  return (
    <div className="ui-page flex items-center justify-center p-6 bg-surface/50">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">Welcome back</h1>
            <p className="text-muted-foreground">
                Enter your credentials to access your account.
            </p>
        </div>

        <div className="ui-card p-6 border-border shadow-sm bg-surface">
            <LoginForm />
        </div>
        
        <p className="px-8 text-center text-sm text-muted-foreground">
            By clicking continue, you agree to our{" "}
            <a href="#" className="underline underline-offset-4 hover:text-primary">
                Terms of Service
            </a>{" "}
            and{" "}
            <a href="#" className="underline underline-offset-4 hover:text-primary">
                Privacy Policy
            </a>
            .
        </p>
      </div>
    </div>
  );
}
