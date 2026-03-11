import React, { useEffect, useMemo, useState } from 'react';
import { apiGet, apiPost } from '@/lib/api';
import { useUser } from '@/contexts/UserContext';
import { CheckCircle, Sparkles, Shield, CreditCard } from 'lucide-react';
import { toast } from '@/components/ui/sonner';

interface SubscriptionViewProps {
  userType?: 'patient' | 'provider';
  gateMessage?: string;
  onStatusRefresh?: () => void;
}

export const SubscriptionView: React.FC<SubscriptionViewProps> = ({ gateMessage, onStatusRefresh }) => {
  const { currentUser } = useUser();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [trialEndsAt, setTrialEndsAt] = useState<string | null>(null);
  const trialDaysRemaining = useMemo(() => {
    if (!trialEndsAt) return null;
    const diffMs = new Date(trialEndsAt).getTime() - Date.now();
    return Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
  }, [trialEndsAt]);
  const effectiveStatus =
    trialEndsAt && trialDaysRemaining && trialDaysRemaining > 0 ? 'trialing' : status;

  const checkoutStatus = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('checkout');
  }, []);
  const checkoutSessionId = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('session_id');
  }, []);
  const checkoutUserId = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('uid');
  }, []);

  useEffect(() => {
    if (!currentUser?.id) return;
    const loadStatus = async () => {
      try {
        const data = await apiGet(`/billing/status?userId=${currentUser.id}`);
        setStatus(data?.status || null);
        setTrialEndsAt(data?.trialEndsAt || null);
      } catch (err: any) {
        setError(err?.message || 'Unable to load subscription status.');
      }
    };
    loadStatus();
  }, [currentUser?.id]);

  const refreshStatus = async () => {
    if (!currentUser?.id) return;
    setError(null);
    try {
      const data = await apiGet(`/billing/status?userId=${currentUser.id}`);
      setStatus(data?.status || null);
      setTrialEndsAt(data?.trialEndsAt || null);
    } catch (err: any) {
      setError(err?.message || 'Unable to load subscription status.');
    }
  };

  useEffect(() => {
    if (
      checkoutStatus !== 'success' ||
      !checkoutSessionId ||
      !currentUser?.id ||
      checkoutUserId !== currentUser.id
    ) {
      return;
    }
    const processedKey = `pehd-checkout-${currentUser.id}`;
    if (localStorage.getItem(processedKey) === checkoutSessionId) return;
    const confirm = async () => {
      try {
        await apiPost('/billing/confirm-checkout', {
          sessionId: checkoutSessionId,
          userId: currentUser.id,
        });
        await apiPost('/billing/record-checkout', {
          sessionId: checkoutSessionId,
          userId: currentUser.id,
          status: 'success',
        });
        localStorage.setItem(processedKey, checkoutSessionId);
        const data = await apiGet(`/billing/status?userId=${currentUser.id}`);
        setStatus(data?.status || null);
        setTrialEndsAt(data?.trialEndsAt || null);
        onStatusRefresh?.();
      } catch (err: any) {
        setError(err?.message || 'Unable to confirm subscription.');
      }
    };
    confirm();
  }, [checkoutStatus, checkoutSessionId, checkoutUserId, currentUser?.id]);

  useEffect(() => {
    if (
      checkoutStatus !== 'cancel' ||
      !currentUser?.id ||
      checkoutUserId !== currentUser.id
    ) {
      return;
    }
    const recordCancel = async () => {
      try {
        const processedKey = `pehd-checkout-cancel-${currentUser.id}`;
        if (localStorage.getItem(processedKey) === '1') return;
        await apiPost('/billing/record-checkout', {
          userId: currentUser.id,
          status: 'cancel',
        });
        localStorage.setItem(processedKey, '1');
      } catch {
        // noop
      }
    };
    recordCancel();
  }, [checkoutStatus, checkoutUserId, currentUser?.id]);

  useEffect(() => {
    if (!currentUser?.id) return;
    if (checkoutUserId !== currentUser.id) return;

    if (checkoutStatus === 'cancel') {
      const key = `pehd-toast-checkout-cancel-${currentUser.id}`;
      if (localStorage.getItem(key) !== '1') {
        toast.info('Checkout canceled. You can start your trial anytime.');
        localStorage.setItem(key, '1');
      }
      return;
    }

    if (checkoutStatus === 'success' && checkoutSessionId) {
      const key = `pehd-toast-checkout-success-${currentUser.id}-${checkoutSessionId}`;
      if (localStorage.getItem(key) !== '1') {
        if (effectiveStatus === 'active') {
          toast.success('Subscription started successfully. Welcome aboard!');
        } else if (effectiveStatus === 'trialing') {
          toast.success('Trial activated. Enjoy full access during your free period.');
        }
        localStorage.setItem(key, '1');
      }
    }
  }, [checkoutStatus, checkoutSessionId, checkoutUserId, currentUser?.id, effectiveStatus]);

  useEffect(() => {
    if (!currentUser?.id) return;
    if (!trialEndsAt || trialDaysRemaining === null || trialDaysRemaining <= 0) return;
    const key = `pehd-toast-trial-warning-${currentUser.id}`;
    if (localStorage.getItem(key) === '1') return;
    toast.warn(
      `Your free trial ends in ${trialDaysRemaining} days. Subscribe now or features will be locked after the trial.`
    );
    localStorage.setItem(key, '1');
  }, [currentUser?.id, trialDaysRemaining, trialEndsAt]);

  useEffect(() => {
    if (!checkoutStatus) return;
    const params = new URLSearchParams(window.location.search);
    params.delete('checkout');
    params.delete('session_id');
    params.delete('uid');
    const next = params.toString();
    const nextUrl = `${window.location.pathname}${next ? `?${next}` : ''}`;
    window.history.replaceState({}, '', nextUrl);
  }, [checkoutStatus]);

  const handleStartTrial = async () => {
    if (!currentUser?.email) {
      setError('Please sign in to start a subscription.');
      return;
    }
    setError(null);
    setIsLoading(true);
    try {
      const response = await apiPost('/billing/create-checkout-session', {
        userId: currentUser?.id,
        email: currentUser?.email,
      });
      if (response?.url) {
        window.location.href = response.url;
        return;
      }
      setError('Unable to start checkout. Please try again.');
    } catch (err: any) {
      setError(err?.message || 'Unable to start checkout.');
    } finally {
      setIsLoading(false);
    }
  };

  const features = [
    'Unlimited telehealth sessions',
    'AI Scribe + automated visit notes',
    'Clinical tools and treatment planning',
    'Lab ordering + interpretation',
    'Priority support',
  ];
  const isSubscribed = effectiveStatus === 'active' || effectiveStatus === 'trialing';
  const planLabel =
    effectiveStatus === 'active'
      ? 'Pro Subscription (Active)'
      : effectiveStatus === 'trialing'
        ? 'Pro Subscription (Trial)'
        : 'Free Plan';

  return (
    <div className="space-y-8">
      {gateMessage && (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-amber-200">
          {gateMessage}
        </div>
      )}
      <div className="relative overflow-hidden rounded-3xl border border-slate-800/70 bg-gradient-to-br from-slate-900/90 via-slate-900/70 to-cyan-900/40 p-8">
        <div className="absolute -top-24 -right-12 h-48 w-48 rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="absolute -bottom-24 -left-10 h-48 w-48 rounded-full bg-blue-500/10 blur-3xl" />
        <div className="relative">
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-xs text-cyan-200">
            <Sparkles className="w-3.5 h-3.5" />
            Pro Plan • 7-day free trial (starts at signup)
          </div>
          <h1 className="mt-4 text-3xl font-bold text-white">Upgrade your clinical workflow</h1>
          <p className="mt-2 text-slate-300 max-w-2xl">
            Provider-only subscription with full access to telehealth, AI scribe, clinical tools, and
            premium support. Payment method required. Cancel anytime.
          </p>
        </div>
      </div>

      {error && (
        <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-rose-200">
          {error}
        </div>
      )}
      {!status && (
        <div className="rounded-2xl border border-slate-700/70 bg-slate-900/60 px-4 py-3 text-slate-300 flex items-center justify-between gap-3">
          <span>Subscription status not available. Refresh to load your trial details.</span>
          <button
            onClick={refreshStatus}
            className="px-3 py-1.5 rounded-lg border border-slate-700/70 bg-slate-950/50 text-slate-200 hover:bg-slate-800 transition-colors text-sm"
          >
            Refresh status
          </button>
        </div>
      )}
      {effectiveStatus === 'expired' && (
        <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-rose-200">
          Your free trial has ended. Subscribe to unlock all provider features.
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-3xl border border-slate-800/70 bg-slate-900/70 p-6">
          <h2 className="text-xl font-semibold text-white">
            {isSubscribed ? 'Your plan includes' : 'What you get'}
          </h2>
          <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-slate-700/70 bg-slate-950/40 px-3 py-1 text-xs text-slate-300">
            {planLabel}
          </div>
          {isSubscribed && (
            <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-200">
              {effectiveStatus === 'trialing' ? 'Trial active' : 'Subscription active'}
            </div>
          )}
          <div className="mt-4 grid gap-3">
            {features.map((feature) => (
              <div key={feature} className="flex items-start gap-3 text-slate-300">
                <CheckCircle className="w-4 h-4 text-emerald-400 mt-0.5" />
                <span>{feature}</span>
              </div>
            ))}
          </div>
          <div className="mt-6 flex flex-wrap items-center gap-3 text-sm text-slate-400">
            <div className="flex items-center gap-2 rounded-full border border-slate-700/70 bg-slate-950/40 px-3 py-1">
              <Shield className="w-4 h-4 text-cyan-300" />
              HIPAA-ready workflows
            </div>
            <div className="flex items-center gap-2 rounded-full border border-slate-700/70 bg-slate-950/40 px-3 py-1">
              <CreditCard className="w-4 h-4 text-cyan-300" />
              Secure Stripe billing
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-cyan-500/30 bg-gradient-to-br from-slate-900/80 to-slate-950/60 p-6 shadow-[0_20px_60px_-40px_rgba(14,165,233,0.6)]">
          <div className="text-slate-300 text-sm">Pro Subscription</div>
          <div className="mt-2 flex items-end gap-2">
            <span className="text-4xl font-bold text-white">$199</span>
            <span className="text-slate-400">/ month</span>
          </div>
          <div className="mt-2 text-sm text-cyan-200">7-day free trial starts at signup</div>
          {trialEndsAt && status === 'trialing' && (
            <div className="mt-2 text-xs text-slate-400">
              Trial ends {new Date(trialEndsAt).toLocaleDateString()} • {trialDaysRemaining} days left
            </div>
          )}
          <div className="mt-4 text-sm text-slate-400">
            {trialEndsAt && status === 'trialing'
              ? 'Payment method required today. You won’t be charged until the trial ends.'
              : 'Payment method required today. Billing starts immediately after checkout.'}
          </div>

          {(effectiveStatus !== 'active') && (
            <button
              onClick={handleStartTrial}
              disabled={isLoading}
              className="mt-6 w-full rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 py-3 text-white font-semibold hover:from-cyan-600 hover:to-blue-700 transition-all disabled:opacity-60"
            >
              {isLoading ? 'Redirecting to checkout…' : 'Subscribe now'}
            </button>
          )}
          {effectiveStatus === 'active' && (
            <div className="mt-6 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-emerald-200 text-sm">
              Your subscription is active. You have full access to all provider features.
            </div>
          )}
          {effectiveStatus === 'trialing' && (
            <div className="mt-6 rounded-2xl border border-cyan-500/30 bg-cyan-500/10 px-4 py-3 text-cyan-200 text-sm">
              Your trial is active. You have full access until the trial ends.
            </div>
          )}

          <div className="mt-4 text-xs text-slate-500">
            By starting the trial you agree to recurring monthly billing after the trial period.
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionView;
