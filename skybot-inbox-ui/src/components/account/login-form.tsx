'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff, Loader2, ArrowRight, AlertCircle, CheckCircle } from 'lucide-react';
import { loginSchema, LoginValues } from './login.schema';

export default function LoginForm() {
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
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginValues) => {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Mock validation logic
    if (data.password === 'fail') {
      setError('root', {
        type: 'manual',
        message: 'Invalid credentials',
      });
      return;
    }

    setSuccess(true);
  };

  if (success) {
    return (
      <div className="ui-card" style={{ maxWidth: '400px', width: '100%', margin: '0 auto' }}>
        <div className="ui-card__body" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem', textAlign: 'center', gap: '1rem' }}>
          <div style={{ width: '4rem', height: '4rem', background: 'rgba(34, 197, 94, 0.1)', color: '#22c55e', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CheckCircle size={32} />
          </div>
          <h3 className="ui-card__title" style={{ fontSize: '1.25rem' }}>Welcome back!</h3>
          <p style={{ color: '#939aa1', fontSize: '0.875rem' }}>Redirecting you to dashboard...</p>
          <button
            type="button"
            className="ui-btn"
            style={{ marginTop: '1rem' }}
            onClick={() => {
              setSuccess(false);
              reset();
            }}
          >
            Reset (Demo)
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="ui-card" style={{ maxWidth: '400px', width: '100%', margin: '0 auto' }}>
      <div className="ui-card__header" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '0.5rem' }}>
        <div className="ui-card__title" style={{ fontSize: '1.1rem' }}>Login to your account</div>
        <div style={{ fontSize: '0.875rem', color: '#939aa1' }}>Enter your email below to login to your account</div>
      </div>
      
      <div className="ui-card__body">
        <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {errors.root && (
             <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', fontSize: '0.875rem', padding: '0.75rem', borderRadius: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
               <AlertCircle size={16} />
               <span>{errors.root.message}</span>
             </div>
          )}

          <div style={{ display: 'grid', gap: '0.5rem' }}>
            <label htmlFor="email" style={{ fontSize: '0.875rem', fontWeight: 500, color: '#939aa1' }}>
              Email
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <input
                id="email"
                type="email"
                placeholder="m@example.com"
                className="ui-input"
                disabled={isSubmitting}
                {...register('email')}
              />
              {errors.email && (
                <span style={{ fontSize: '0.75rem', color: '#ef4444' }}>{errors.email.message}</span>
              )}
            </div>
          </div>

          <div style={{ display: 'grid', gap: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <label htmlFor="password" style={{ fontSize: '0.875rem', fontWeight: 500, color: '#939aa1' }}>
                Password
              </label>
              <a href="#" style={{ fontSize: '0.875rem', color: '#ffffff', textDecoration: 'underline', textUnderlineOffset: '4px' }}>
                Forgot your password?
              </a>
            </div>
            <div style={{ position: 'relative' }}>
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                className="ui-input"
                style={{ paddingRight: '2.5rem' }}
                disabled={isSubmitting}
                {...register('password')}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', color: '#939aa1', cursor: 'pointer', display: 'flex' }}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.password && (
              <span style={{ fontSize: '0.75rem', color: '#ef4444' }}>{errors.password.message}</span>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.5rem' }}>
            <button
              type="submit"
              className="ui-btn ui-btn--primary"
              style={{ width: '100%', justifyContent: 'center' }}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" style={{ marginRight: '0.5rem' }} />
                  Signing in...
                </>
              ) : (
                <>
                  Login
                </>
              )}
            </button>
            
            <button
              type="button"
              className="ui-btn"
              style={{ width: '100%', justifyContent: 'center' }}
              disabled={isSubmitting}
            >
              Continue with Google
            </button>
            
            <div style={{ textAlign: 'center', fontSize: '0.875rem', marginTop: '1rem', color: '#939aa1' }}>
              Don&apos;t have an account?{' '}
              <a href="#" style={{ color: '#ffffff', textDecoration: 'underline', textUnderlineOffset: '4px' }}>
               Sign up
              </a>
            </div>
          </div>

        </form>
      </div>
    </div>
  );
}
