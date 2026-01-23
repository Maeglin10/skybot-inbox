'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff, Loader2, CheckCircle, AlertCircle, ArrowRight } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
      <div className="flex flex-col items-center justify-center p-6 space-y-4 text-center animate-in fade-in zoom-in duration-300">
        <div className="w-16 h-16 bg-green-500/10 text-green-500 rounded-full flex items-center justify-center">
          <CheckCircle size={32} />
        </div>
        <h3 className="text-xl font-semibold">Welcome back!</h3>
        <p className="text-muted-foreground">Redirecting you to dashboard...</p>
        <Button
          className="mt-4"
          variant="outline"
          onClick={() => {
            setSuccess(false);
            reset();
          }}
        >
          Reset (Demo)
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {errors.root && (
        <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md flex items-center gap-2">
          <AlertCircle size={16} />
          <span>{errors.root.message}</span>
        </div>
      )}

      <div className="space-y-2">
        <label
          className="text-sm font-medium text-muted-foreground leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          htmlFor="email"
        >
          Email
        </label>
        <Input
          id="email"
          type="email"
          placeholder="name@example.com"
          disabled={isSubmitting}
          {...register('email')}
        />
        {errors.email && (
          <p className="text-xs text-destructive">{errors.email.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label
            className="text-sm font-medium text-muted-foreground leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            htmlFor="password"
          >
            Password
          </label>
          <button
            type="button"
            className="text-xs text-muted-foreground hover:text-foreground hover:underline"
            onClick={() => alert('Reset password feature coming soon.')}
          >
            Forgot password?
          </button>
        </div>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? 'text' : 'password'}
            placeholder="Enter your password"
            className="pr-10"
            disabled={isSubmitting}
            {...register('password')}
          />
          <button
            type="button"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            onClick={() => setShowPassword(!showPassword)}
            tabIndex={-1}
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
        {errors.password && (
          <p className="text-xs text-destructive">{errors.password.message}</p>
        )}
      </div>

      <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground" disabled={isSubmitting}>
        {isSubmitting ? (
          <>
            <Loader2 size={16} className="animate-spin" />
            Signing in...
          </>
        ) : (
          <>
            Sign in
            <ArrowRight size={16} />
          </>
        )}
      </Button>

      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">
            Or continue with
          </span>
        </div>
      </div>

      <Button
        variant="outline"
        type="button"
        className="w-full border-muted-foreground/20 text-muted-foreground hover:text-foreground hover:border-muted-foreground/50"
        disabled={isSubmitting}
      >
        Google
      </Button>
    </form>
  );
}
