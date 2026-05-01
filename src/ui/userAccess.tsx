import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

export type UserTier = 'free' | 'researcher' | 'enterprise';

type TierPolicy = {
  label: string;
  canUseScrubber: boolean;
  canUseOnlineSignals: boolean;
  canAccessAdmin: boolean;
};

const tierPolicies: Record<UserTier, TierPolicy> = {
  free: { label: 'Free', canUseScrubber: false, canUseOnlineSignals: true, canAccessAdmin: false },
  researcher: { label: 'Researcher', canUseScrubber: true, canUseOnlineSignals: true, canAccessAdmin: false },
  enterprise: { label: 'Enterprise', canUseScrubber: true, canUseOnlineSignals: true, canAccessAdmin: true },
};

const storageKey = 'akashic-user-tier';

const UserAccessContext = createContext<{
  tier: UserTier;
  setTier: (tier: UserTier) => void;
  policy: TierPolicy;
}>({ tier: 'free', setTier: () => undefined, policy: tierPolicies.free });

export function UserAccessProvider({ children }: { children: ReactNode }) {
  const [tier, setTierState] = useState<UserTier>('free');

  useEffect(() => {
    const stored = window.localStorage.getItem(storageKey);
    if (stored === 'free' || stored === 'researcher' || stored === 'enterprise') {
      setTierState(stored);
    }
  }, []);

  function setTier(next: UserTier) {
    setTierState(next);
    window.localStorage.setItem(storageKey, next);
  }

  const value = useMemo(() => ({ tier, setTier, policy: tierPolicies[tier] }), [tier]);
  return <UserAccessContext.Provider value={value}>{children}</UserAccessContext.Provider>;
}

export function useUserAccess() {
  return useContext(UserAccessContext);
}
