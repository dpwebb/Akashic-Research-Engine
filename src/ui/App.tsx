import { Link, NavLink, Navigate, Outlet, Route, Routes } from 'react-router-dom';
import {
  Archive,
  Bot,
  BriefcaseBusiness,
  CreditCard,
  Download,
  GitFork,
  Home,
  Import,
  Inbox,
  Library,
  LogIn,
  Radar,
  Scale,
  ScrollText,
  Settings,
  Sparkles,
} from 'lucide-react';
import { Dashboard } from './pages/Dashboard.js';
import { SourcesPage } from './pages/SourcesPage.js';
import { ClaimsPage } from './pages/ClaimsPage.js';
import { GenealogyPage } from './pages/GenealogyPage.js';
import { AssistantPage } from './pages/AssistantPage.js';
import { AdditionBuilderPage } from './pages/AdditionBuilderPage.js';
import { DiscoveryPage } from './pages/DiscoveryPage.js';
import { SeedQueuePage } from './pages/SeedQueuePage.js';
import { ResearchIndexPage } from './pages/ResearchIndexPage.js';
import { SourceImportPage } from './pages/SourceImportPage.js';
import { BillingPage } from './pages/BillingPage.js';
import { OperationsPage } from './pages/OperationsPage.js';
import { ExportsPage } from './pages/ExportsPage.js';
import { AdminConfigPage } from './pages/AdminConfigPage.js';
import { AuthPage, PricingPage, PublicHomePage } from './pages/CommercialPages.js';
import { UserAccessProvider, useUserAccess, type UserTier } from './userAccess.js';

const navItems = [
  { to: '/app', label: 'Dashboard', icon: Home, end: true },
  { to: '/app/operations', label: 'Operations', icon: BriefcaseBusiness },
  { to: '/app/admin/config', label: 'Admin Config', icon: Settings, adminOnly: true },
  { to: '/app/research-index', label: 'Index', icon: ScrollText },
  { to: '/app/sources', label: 'Sources', icon: Library },
  { to: '/app/claims', label: 'Claims', icon: Scale },
  { to: '/app/genealogy', label: 'Genealogy', icon: GitFork },
  { to: '/app/discovery', label: 'Discovery', icon: Radar },
  { to: '/app/source-import', label: 'Import', icon: Import },
  { to: '/app/seed-queue', label: 'Seed Queue', icon: Inbox },
  { to: '/app/assistant', label: 'Assistant', icon: Bot },
  { to: '/app/addition-builder', label: 'Builder', icon: Sparkles },
  { to: '/app/exports', label: 'Exports', icon: Download },
  { to: '/app/billing', label: 'Memberships', icon: CreditCard },
];

export function App() {
  return (
    <UserAccessProvider>
      <Routes>
        <Route path="/" element={<PublicHomePage />} />
        <Route path="/pricing" element={<PricingPage />} />
        <Route path="/login" element={<AuthPage mode="login" />} />
        <Route path="/register" element={<AuthPage mode="register" />} />
        <Route path="/app" element={<WorkspaceShell />}>
          <Route index element={<Dashboard />} />
          <Route path="operations" element={<OperationsPage />} />
          <Route path="admin/config" element={<AdminRoute />} />
          <Route path="research-index" element={<ResearchIndexPage />} />
          <Route path="sources" element={<SourcesPage />} />
          <Route path="claims" element={<ClaimsPage />} />
          <Route path="genealogy" element={<GenealogyPage />} />
          <Route path="discovery" element={<DiscoveryPage />} />
          <Route path="source-import" element={<SourceImportPage />} />
          <Route path="seed-queue" element={<SeedQueuePage />} />
          <Route path="assistant" element={<AssistantPage />} />
          <Route path="addition-builder" element={<AdditionBuilderPage />} />
          <Route path="exports" element={<ExportsPage />} />
          <Route path="billing" element={<BillingPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </UserAccessProvider>
  );
}

function WorkspaceShell() {
  const { tier, setTier, policy, account, accountEmail, isLoadingAccount } = useUserAccess();
  const visibleItems = navItems.filter((item) => !item.adminOnly || policy.canAccessAdmin);

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <Archive aria-hidden="true" />
          <div>
            <strong>Akashic Research Engine</strong>
            <span>Evidence-aware esoteric research</span>
          </div>
        </div>

        <section className="account-card">
          <span>{isLoadingAccount ? 'Loading access' : policy.label}</span>
          <strong>{account?.displayName ?? 'Public Visitor'}</strong>
          <small>{account?.email ?? (accountEmail || 'anonymous')}</small>
          {account?.betaTester && <em>Grandfathered beta access</em>}
        </section>

        {policy.canAccessAdmin && (
          <label className="user-tier-switcher">
            Beta fallback scope
            <select value={tier} onChange={(event) => setTier(event.target.value as UserTier)}>
              <option value="free">Free</option>
              <option value="researcher">Researcher</option>
              <option value="studio">Studio</option>
              <option value="enterprise">Enterprise</option>
              <option value="beta">Beta Tester</option>
            </select>
          </label>
        )}

        <nav className="nav-list" aria-label="Primary navigation">
          {visibleItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink key={item.to} to={item.to} end={item.end}>
                <Icon aria-hidden="true" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        <Link className="sidebar-login-link" to="/login">
          <LogIn aria-hidden="true" />
          Switch account
        </Link>
      </aside>
      <main className="content">
        <Outlet />
      </main>
    </div>
  );
}

function AdminRoute() {
  const { policy } = useUserAccess();
  return policy.canAccessAdmin ? <AdminConfigPage /> : <Navigate to="/app" replace />;
}
