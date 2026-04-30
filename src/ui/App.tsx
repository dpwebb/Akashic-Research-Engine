import { NavLink, Route, Routes } from 'react-router-dom';
import { Archive, Bot, CreditCard, GitFork, Home, Import, Inbox, Library, Radar, Scale, ScrollText, Sparkles } from 'lucide-react';
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

const navItems = [
  { to: '/', label: 'Dashboard', icon: Home },
  { to: '/research-index', label: 'Index', icon: ScrollText },
  { to: '/sources', label: 'Sources', icon: Library },
  { to: '/claims', label: 'Claims', icon: Scale },
  { to: '/genealogy', label: 'Genealogy', icon: GitFork },
  { to: '/discovery', label: 'Discovery', icon: Radar },
  { to: '/source-import', label: 'Import', icon: Import },
  { to: '/seed-queue', label: 'Seed Queue', icon: Inbox },
  { to: '/assistant', label: 'Assistant', icon: Bot },
  { to: '/addition-builder', label: 'Builder', icon: Sparkles },
  { to: '/billing', label: 'Memberships', icon: CreditCard },
];

export function App() {
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
        <nav className="nav-list" aria-label="Primary navigation">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink key={item.to} to={item.to} end={item.to === '/'}>
                <Icon aria-hidden="true" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </aside>
      <main className="content">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/research-index" element={<ResearchIndexPage />} />
          <Route path="/sources" element={<SourcesPage />} />
          <Route path="/claims" element={<ClaimsPage />} />
          <Route path="/genealogy" element={<GenealogyPage />} />
          <Route path="/discovery" element={<DiscoveryPage />} />
          <Route path="/source-import" element={<SourceImportPage />} />
          <Route path="/seed-queue" element={<SeedQueuePage />} />
          <Route path="/assistant" element={<AssistantPage />} />
          <Route path="/addition-builder" element={<AdditionBuilderPage />} />
          <Route path="/billing" element={<BillingPage />} />
        </Routes>
      </main>
    </div>
  );
}
