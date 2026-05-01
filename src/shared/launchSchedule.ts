import type { LaunchSchedulePhase } from './types.js';

export const launchScheduleUpdatedAt = '2026-05-01';

export const launchSchedule: LaunchSchedulePhase[] = [
  {
    id: 'phase-0-beta-safety',
    phase: 'Phase 0: Beta Safety',
    status: 'complete',
    targetWindow: 'May 1, 2026',
    objective: 'Preserve the current beta tester and keep operator access intact before commercial gates harden.',
    delivered: [
      'Grandfathered beta entitlement is seeded at runtime.',
      'Beta Tester and Admin scopes bypass paid checkout while keeping usage records.',
      'Admin-only beta fallback switcher remains available for controlled testing.',
    ],
    nextActions: [
      'Confirm the production beta tester email before removing fallback tier testing.',
      'Add audit notes when beta access is changed by an admin.',
    ],
    exitCriteria: 'Current beta user can sign in, reach every paid/admin workflow, and avoid checkout.',
  },
  {
    id: 'phase-1-public-shell',
    phase: 'Phase 1: Public Shell',
    status: 'complete',
    targetWindow: 'May 1, 2026',
    objective: 'Separate the commercial public website from the authenticated research workspace.',
    delivered: [
      'Homepage, pricing, login, and register routes are live.',
      'Research workspace is routed under /app.',
      'Membership cards explain Free, Researcher, Studio, and Enterprise tiers.',
    ],
    nextActions: [
      'Replace placeholder login behavior with durable session-backed authentication.',
      'Add public source previews that are safe for anonymous users.',
    ],
    exitCriteria: 'Anonymous visitors see the commercial shell while signed-in users enter /app.',
  },
  {
    id: 'phase-2-auth-foundation',
    phase: 'Phase 2: Auth Foundation',
    status: 'in-progress',
    targetWindow: 'May 2-8, 2026',
    objective: 'Move identity from browser state into server-owned sessions and persistent account records.',
    delivered: [
      'Account session API returns server-derived scopes from runtime entitlements.',
      'UI account context now reads account email, scopes, and entitlement state from the server.',
    ],
    nextActions: [
      'Add session records with expiry and signed cookies or token validation.',
      'Persist account users and entitlements in PostgreSQL once repository wiring is active.',
      'Add logout, expired-session handling, and account recovery flow.',
    ],
    exitCriteria: 'Protected APIs can trust a server session without relying on localStorage tier state.',
  },
  {
    id: 'phase-3-scopes-paywall',
    phase: 'Phase 3: Scopes & Paywall',
    status: 'in-progress',
    targetWindow: 'May 4-12, 2026',
    objective: 'Enforce paid feature scopes and quotas consistently across the UI and API.',
    delivered: [
      'UI gates are active for imports, assistant workflows, exports, and the addition builder.',
      'Server-side usage limits exist for discovery, imports, assistant generations, review submissions, and exports.',
      'Speculative addition drafts require Studio, Enterprise, Beta Tester, or Admin scope.',
    ],
    nextActions: [
      'Add shared requireScope middleware for every protected API route.',
      'Expose quota meters in account and operations views.',
      'Remove broad fallback access after beta sign-in has been verified in production.',
    ],
    exitCriteria: 'Direct API calls fail without the required scope, even when UI controls are bypassed.',
  },
  {
    id: 'phase-4-billing',
    phase: 'Phase 4: Billing',
    status: 'scheduled',
    targetWindow: 'May 8-15, 2026',
    objective: 'Connect Stripe subscription events to entitlements and customer self-service.',
    delivered: [
      'Checkout session creation is scaffolded for paid plans.',
      'Plan definitions and usage limits are centralized in monetization data.',
    ],
    nextActions: [
      'Add Stripe webhook verification and subscription status sync.',
      'Add customer portal entry point for active subscribers.',
      'Handle checkout success, cancellation, invoice failure, and downgrade events.',
    ],
    exitCriteria: 'Subscription lifecycle changes update account scopes without manual intervention.',
  },
  {
    id: 'phase-5-enterprise',
    phase: 'Phase 5: Enterprise',
    status: 'scheduled',
    targetWindow: 'May 15-22, 2026',
    objective: 'Support institution licenses, team access, and manual enterprise account management.',
    delivered: [
      'Institution License plan exists with custom pricing and elevated usage.',
      'Enterprise scope is separate from Admin and Beta Tester scopes.',
    ],
    nextActions: [
      'Add organization records, owner/member roles, and manual license status.',
      'Create admin tools for enterprise account and beta tester management.',
      'Define organization-level quota and shared review policy behavior.',
    ],
    exitCriteria: 'Enterprise users can be managed without granting system admin access.',
  },
  {
    id: 'phase-6-launch-hardening',
    phase: 'Phase 6: Launch Hardening',
    status: 'scheduled',
    targetWindow: 'May 22-29, 2026',
    objective: 'Prepare the commercial launch candidate for production traffic and support.',
    delivered: [
      'Rate limits, runtime backups, source-of-truth checks, and deployment docs are in place.',
      'Initial release corpus exceeds the 300-resource review floor.',
    ],
    nextActions: [
      'Add end-to-end tests for public, free, paid, beta, and admin journeys.',
      'Run production source-of-truth checks before each deploy.',
      'Complete security, observability, backup, and rollback checklist.',
    ],
    exitCriteria: 'Production deploy is safe to market and support as a paid research product.',
  },
];

export function getCurrentLaunchPhase(): LaunchSchedulePhase | undefined {
  return launchSchedule.find((phase) => phase.status === 'in-progress') ?? launchSchedule[0];
}

export function getNextLaunchPhase(): LaunchSchedulePhase | undefined {
  return launchSchedule.find((phase) => phase.status === 'scheduled');
}
