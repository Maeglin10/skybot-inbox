'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { loginSchema, LoginValues } from './login.schema';
import { useTranslations } from '@/lib/translations';

// We'll update the mock login to simulate the response structure you described
// In a real app, this would use the api.client which should be updated as well.
interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn?: number;
  user?: {
    id: string;
    username: string;
    email: string;
    accountId: string;
    role: string;
  };
}

export default function LoginForm() {
  const t = useTranslations('auth');
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: '',
      password: '',
      rememberMe: false, // Default false
    },
  });

  // Redirect to inbox after successful login
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        router.push('/es/inbox');
      }, 2000); // 2 second delay to show success message

      return () => clearTimeout(timer);
    }
  }, [success, router]);

  const onSubmit = async (data: LoginValues) => {
    try {
      // Use the proxy to call backend /auth/login
      const res = await fetch('/api/proxy/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        if (res.status === 401) {
           setError('root', { type: 'manual', message: t('invalidCredentials') });
           return;
        }
        throw new Error('Login failed');
      }

      const body: LoginResponse = await res.json();
      
      // Store tokens in cookies
      // Note: We use max-age as per the mock response or default to session
      const maxAge = data.rememberMe ? 259200 : undefined;
      const cookieOptions = maxAge 
         ? `; max-age=${maxAge}; path=/; secure; samesite=strict`
         : `; path=/; secure; samesite=strict`;

      document.cookie = `accessToken=${body.accessToken}${cookieOptions}`;
      document.cookie = `refreshToken=${body.refreshToken}${cookieOptions}`;
      
      // Also store user info if needed
      if (body.user) {
         localStorage.setItem('user', JSON.stringify(body.user));
      }

      setSuccess(true);
    } catch (err) {
      console.error(err);
      setError('root', {
        type: 'manual',
        message: 'An error occurred during login. Please try again.',
      });
    }
  };

  if (success) {
    return (
      <div className="ui-card w-full max-w-[400px] mx-auto">
        <div className="ui-card__body flex flex-col items-center justify-center p-8 text-center gap-4">
          <div className="w-16 h-16 bg-green-500/10 text-green-500 rounded-full flex items-center justify-center">
            <CheckCircle size={32} />
          </div>
          <h3 className="text-xl font-bold">{t('welcomeBack')}</h3>
          <p className="text-muted-foreground text-sm">{t('redirecting')}</p>
          <button
            type="button"
            className="ui-btn mt-4"
            onClick={() => {
              setSuccess(false);
              reset();
            }}
          >
            {t('resetDemo')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="ui-card w-full max-w-[400px] mx-auto overflow-hidden rounded-xl border border-border shadow-sm">
      <div className="ui-card__header flex-col items-start gap-2 bg-muted/30 border-b border-border/50 p-6">
        <div className="text-lg font-bold">{t('loginTitle')}</div>
        <div className="text-sm text-muted-foreground">{t('loginSubtitle')}</div>
      </div>
      
      <div className="ui-card__body p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          
          {errors.root && (
             <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-lg flex items-center gap-2">
               <AlertCircle size={16} />
               <span>{errors.root.message}</span>
             </div>
          )}

          <div className="space-y-2">
            <label htmlFor="username" className="text-sm font-medium text-muted-foreground">
              {t('usernameLabel')}
            </label>
            <div className="space-y-1">
              <input
                id="username"
                type="text"
                placeholder="tu_usuario"
                className="ui-input w-full bg-muted/50 text-foreground"
                disabled={isSubmitting}
                {...register('username')}
              />
              {errors.username && (
                <span className="text-xs text-destructive">{errors.username.message}</span>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium text-muted-foreground block">
              {t('passwordLabel')}
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                className="ui-input w-full pr-10 bg-muted/50 text-foreground"
                disabled={isSubmitting}
                {...register('password')}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground bg-transparent border-0 p-0"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.password && (
              <span className="text-xs text-destructive">{errors.password.message}</span>
            )}
            <div className="flex justify-end pt-1">
              <a href="#" className="text-xs text-muted-foreground hover:text-primary transition-colors underline underline-offset-4">
                {t('forgotPassword')}
              </a>
            </div>
          </div>

          {/* Remember Me Checkbox with requested design */}
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="rememberMe"
              className="ui-checkbox rounded border-muted-foreground/30 bg-muted/50 w-4 h-4 cursor-pointer accent-primary"
              disabled={isSubmitting}
              {...register('rememberMe')}
            />
            <label htmlFor="rememberMe" className="text-sm text-foreground cursor-pointer select-none">
              {t('rememberMe')}
              <span className="text-muted-foreground ml-1 text-xs">
                ({t('rememberMeDescription')})
              </span>
            </label>
          </div>

          <div className="space-y-3 pt-2">
            <button
              type="submit"
              className="ui-btn ui-btn--primary w-full flex justify-center items-center shadow-sm hover:brightness-110 transition-all font-medium py-2.5 h-auto text-sm"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className="animate-spin mr-2" />
                  {t('signingIn')}
                </>
              ) : (
                <>
                  {t('signin')}
                </>
              )}
            </button>
            
            <button
              type="button"
              className="ui-btn w-full flex justify-center items-center bg-transparent border border-border text-foreground hover:bg-muted/50 transition-all text-sm h-auto py-2.5"
              disabled={isSubmitting}
            >
              {t('continueWithGoogle')}
            </button>
            
            <div className="text-center text-sm mt-4 text-muted-foreground">
              {t('noAccount')}{' '}
              <a href="#" className="text-primary hover:underline underline-offset-4 font-medium transition-colors">
               {t('signUp')}
              </a>
            </div>
          </div>

        </form>
      </div>
    </div>
  );
}
