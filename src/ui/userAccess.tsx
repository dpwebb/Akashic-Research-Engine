import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { AccountSession, UserScope } from '../shared/types.js';

export type UserTier = 'free' | 'researcher' | 'studio' | 'enterprise' | 'beta';

type TierPolicy = {
  label: string;
  scopes: UserScope[];
  canUseScrubber: boolean;
  canUseOnlineSignals: boolean;
  canAccessAdmin: boolean;
  canUseDiscovery: boolean;
  canUseSourceImport: boolean;
  canUseAssistant: boolean;
  canUseAdditionBuilder: boolean;
  canUseExports: boolean;
};

const defaultBetaEmail = 'beta@akashicresearch.info';
const accountEmailStorageKey = 'akashic-account-email';
const fallbackTierStorageKey = 'akashic-user-tier';

const fallbackScopes: Record<UserTier, UserScope[]> = {
  free: ['public', 'free'],
  researcher: ['public', 'free', 'paid'],
  studio: ['public', 'free', 'paid', 'studio'],
  enterprise: ['public', 'free', 'paid', 'studio', 'enterprise'],
  beta: ['public', 'free', 'paid', 'studio', 'enterprise', 'betaTester', 'admin'],
};

const UserAccessContext = createContext<{
  tier: UserTier;
  setTier: (tier: UserTier) => void;
  policy: TierPolicy;
  account: AccountSession | null;
  accountEmail: string;
  setAccountEmail: (email: string) => void;
  accountHeaders: Record<string, string>;
  isLoadingAccount: boolean;
  refreshAccount: () => Promise<void>;
}>({
  tier: 'free',
  setTier: () => undefined,
  policy: buildPolicy(fallbackScopes.free, 'Free'),
  account: null,
  accountEmail: '',
  setAccountEmail: () => undefined,
  accountHeaders: {},
  isLoadingAccount: false,
  refreshAccount: async () => undefined,
});

export function UserAccessProvider({ children }: { children: ReactNode }) {
  const [tier, setTierState] = useState<UserTier>('free');
  const [accountEmail, setAccountEmailState] = useState('');
  const [account, setAccount] = useState<AccountSession | null>(null);
  const [isLoadingAccount, setIsLoadingAccount] = useState(false);

  useEffect(() => {
    const storedEmail = window.localStorage.getItem(accountEmailStorageKey);
    const storedTier = window.localStorage.getItem(fallbackTierStorageKey);
    if (isUserTier(storedTier)) {
      setTierState(storedTier);
    }

    if (storedEmail?.trim()) {
      setAccountEmailState(storedEmail.trim());
    } else if (storedTier === 'enterprise') {
      setAccountEmailState(defaultBetaEmail);
      window.localStorage.setItem(accountEmailStorageKey, defaultBetaEmail);
    }
  }, []);

  const refreshAccount = useCallback(async () => {
    const email = accountEmail.trim();
    setIsLoadingAccount(true);

    try {
      const response = await fetch(`/api/account/session${email ? `?email=${encodeURIComponent(email)}` : ''}`);
      if (!response.ok) {
        throw new Error('Account session could not be loaded.');
      }

      const session = (await response.json()) as AccountSession;
      setAccount(session);
      if (session.authenticated) {
        setTierState(tierFromSession(session));
      }
    } catch {
      setAccount(null);
    } finally {
      setIsLoadingAccount(false);
    }
  }, [accountEmail]);

  useEffect(() => {
    void refreshAccount();
  }, [refreshAccount]);

  function setTier(next: UserTier) {
    setTierState(next);
    window.localStorage.setItem(fallbackTierStorageKey, next);
  }

  function setAccountEmail(next: string) {
    const normalizedEmail = next.trim().toLocaleLowerCase();
    setAccountEmailState(normalizedEmail);
    if (normalizedEmail) {
      window.localStorage.setItem(accountEmailStorageKey, normalizedEmail);
    } else {
      window.localStorage.removeItem(accountEmailStorageKey);
    }
  }

  const scopes = account?.authenticated ? account.scopes : fallbackScopes[tier];
  const policy = useMemo(() => buildPolicy(scopes, account?.betaTester ? 'Beta Tester' : tierLabel(tier)), [account, scopes, tier]);
  const accountHeaders = useMemo<Record<string, string>>(
    () => {
      const email = accountEmail.trim();
      const headers: Record<string, string> = {};

      if (email) {
        headers['x-account-email'] = email;
      }

      return headers;
    },
    [accountEmail],
  );

  const value = useMemo(
    () => ({
      tier,
      setTier,
      policy,
      account,
      accountEmail,
      setAccountEmail,
      accountHeaders,
      isLoadingAccount,
      refreshAccount,
    }),
    [account, accountEmail, accountHeaders, isLoadingAccount, policy, refreshAccount, tier],
  );

  return <UserAccessContext.Provider value={value}>{children}</UserAccessContext.Provider>;
}

export function useUserAccess() {
  return useContext(UserAccessContext);
}

function buildPolicy(scopes: UserScope[], label: string): TierPolicy {
  const scopeSet = new Set(scopes);
  const hasAny = (...requiredScopes: UserScope[]) => requiredScopes.some((scope) => scopeSet.has(scope));

  return {
    label,
    scopes,
    canUseScrubber: hasAny('paid', 'studio', 'enterprise', 'betaTester'),
    canUseOnlineSignals: true,
    canAccessAdmin: hasAny('admin', 'betaTester'),
    canUseDiscovery: hasAny('free', 'paid', 'studio', 'enterprise', 'betaTester'),
    canUseSourceImport: hasAny('paid', 'studio', 'enterprise', 'betaTester'),
    canUseAssistant: hasAny('studio', 'enterprise', 'betaTester'),
    canUseAdditionBuilder: hasAny('studio', 'enterprise', 'betaTester'),
    canUseExports: hasAny('paid', 'studio', 'enterprise', 'betaTester'),
  };
}

function isUserTier(value: string | null): value is UserTier {
  return value === 'free' || value === 'researcher' || value === 'studio' || value === 'enterprise' || value === 'beta';
}

function tierFromSession(session: AccountSession): UserTier {
  if (session.betaTester || session.scopes.includes('admin')) {
    return 'beta';
  }

  if (session.scopes.includes('enterprise')) {
    return 'enterprise';
  }

  if (session.scopes.includes('studio')) {
    return 'studio';
  }

  if (session.scopes.includes('paid')) {
    return 'researcher';
  }

  return 'free';
}

function tierLabel(tier: UserTier): string {
  const labels: Record<UserTier, string> = {
    free: 'Free',
    researcher: 'Researcher',
    studio: 'Studio',
    enterprise: 'Enterprise',
    beta: 'Beta Tester',
  };

  return labels[tier];
}
