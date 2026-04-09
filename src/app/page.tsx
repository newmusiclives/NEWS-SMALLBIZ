'use client';

import React, { useState, useEffect, useCallback, useRef, useMemo, Component, type ErrorInfo, type ReactNode } from 'react';
import dynamic from 'next/dynamic';
import { REGION_CATEGORIES, type RegionCategory, type Region } from '@/lib/regions';
import { BUSINESS_TYPES, BUSINESS_CATEGORIES, getBusinessTypesByCategory, type BusinessType } from '@/lib/business-types';

// ─── Error Boundary ────────────────────────────────────────────────────────────

class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean; error: string }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: '' };
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error: error.message };
  }
  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('React error boundary caught:', error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ minHeight: '100vh', background: '#181825', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 32 }}>
          <div style={{ background: '#1e1e2e', border: '1px solid #3a3a4e', borderRadius: 12, padding: 32, maxWidth: 400, textAlign: 'center' }}>
            <h2 style={{ color: '#ef4444', fontSize: 20, fontWeight: 'bold', marginBottom: 16 }}>Something went wrong</h2>
            <p style={{ color: '#a1a1aa', marginBottom: 16 }}>{this.state.error}</p>
            <button
              onClick={() => this.setState({ hasError: false, error: '' })}
              style={{ padding: '8px 16px', background: '#6c5ce7', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer' }}
            >
              Try Again
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// ─── Types ──────────────────────────────────────────────────────────────────────

interface Business {
  id: string;
  name: string;
  type: string;
  address: string;
  city: string;
  region: string;
  regionId: string;
  phone: string;
  email: string;
  website: string;
  rating: number | null;
  isNew?: boolean;
  createdAt?: string;
  hasNewsletter?: boolean;
  newsletterSignals?: string[];
  eventsUrl?: string;
}

interface SearchProgress {
  status: 'searching' | 'complete' | 'error' | 'stopped';
  currentRegion: string;
  currentType: string;
  regionsProcessed: number;
  totalRegions: number;
  newFound: number;
  totalInDb: number;
  errors: number;
  percentage: number;
  totalDiscovered?: number;
  duplicatesSkipped?: number;
  withNewsletter?: number;
}

interface BusinessTypeSummary {
  businessType: string;
  count: number;
}

interface DatabaseSummary {
  totalBusinesses: number;
  totalRegions: number;
  businessTypes: number;
  businessTypeSummaries: BusinessTypeSummary[];
  regions: RegionSummary[];
}

interface RegionSummary {
  id: string;
  name: string;
  country: string;
  countryCode: string;
  businessCount: number;
  lastUpdated: string;
  businessTypes: BusinessTypeSummary[];
}

interface Schedule {
  id: string;
  name: string;
  regions: string[];
  regionNames: string[];
  businessTypes: string[];
  frequency: 'weekly' | 'biweekly' | 'monthly';
  maxPerRegion: number;
  nextRun: string;
  lastRun: string | null;
  lastResult: string | null;
  active: boolean;
}

type TabKey = 'search' | 'database' | 'schedules';
type SortDir = 'asc' | 'desc';

// ─── Helper Components ──────────────────────────────────────────────────────────

function ChevronDown({ className = '' }: { className?: string }) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 6l4 4 4-4" />
    </svg>
  );
}

function ChevronRight({ className = '' }: { className?: string }) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 4l4 4-4 4" />
    </svg>
  );
}

function SearchIcon({ className = '' }: { className?: string }) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <path d="M21 21l-4.35-4.35" />
    </svg>
  );
}

function Spinner({ className = '' }: { className?: string }) {
  return (
    <svg className={`animate-spin ${className}`} width="20" height="20" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 6l3 3 5-5" />
    </svg>
  );
}

function countryFlag(countryCode: string): string {
  const flags: Record<string, string> = {
    US: '\u{1F1FA}\u{1F1F8}',
    CA: '\u{1F1E8}\u{1F1E6}',
    GB: '\u{1F1EC}\u{1F1E7}',
    AU: '\u{1F1E6}\u{1F1FA}',
    NZ: '\u{1F1F3}\u{1F1FF}',
  };
  return flags[countryCode] || '';
}

// ─── Expandable Section ─────────────────────────────────────────────────────────

function ExpandableSection({
  title,
  count,
  selectedCount,
  expanded,
  onToggle,
  onSelectAll,
  onDeselectAll,
  children,
}: {
  title: string;
  count: number;
  selectedCount: number;
  expanded: boolean;
  onToggle: () => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="border border-line rounded-lg overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-3 py-2.5 bg-surface-dark hover:bg-surface-hover transition-colors text-left"
        aria-expanded={expanded}
      >
        <div className="flex items-center gap-2">
          {expanded ? <ChevronDown className="text-text-secondary" /> : <ChevronRight className="text-text-secondary" />}
          <span className="text-sm font-medium text-text-primary">{title}</span>
        </div>
        <span className="text-xs text-text-muted">
          {selectedCount > 0 && (
            <span className="text-primary-light mr-1">{selectedCount}/</span>
          )}
          {count}
        </span>
      </button>
      {expanded && (
        <div className="border-t border-line bg-surface">
          <div className="flex items-center gap-2 px-3 py-1.5 border-b border-line">
            <button
              onClick={onSelectAll}
              className="text-xs text-primary-light hover:text-primary transition-colors"
            >
              Select All
            </button>
            <span className="text-text-muted text-xs">|</span>
            <button
              onClick={onDeselectAll}
              className="text-xs text-text-secondary hover:text-text-primary transition-colors"
            >
              Deselect All
            </button>
          </div>
          <div className="max-h-48 overflow-y-auto p-2 space-y-0.5">
            {children}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Checkbox Item ──────────────────────────────────────────────────────────────

function CheckboxItem({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <div
      role="checkbox"
      aria-checked={checked}
      tabIndex={0}
      onClick={() => onChange(!checked)}
      onKeyDown={(e) => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); onChange(!checked); } }}
      className="flex items-center gap-2 px-2 py-1 rounded hover:bg-surface-hover cursor-pointer transition-colors group"
    >
      <div
        className={`w-4 h-4 rounded border flex items-center justify-center ${
          checked
            ? 'bg-primary border-primary'
            : 'border-line group-hover:border-text-secondary'
        }`}
      >
        {checked && <CheckIcon />}
      </div>
      <span className="text-sm text-text-secondary group-hover:text-text-primary transition-colors truncate">
        {label}
      </span>
    </div>
  );
}

// ─── Pagination ─────────────────────────────────────────────────────────────────

function Pagination({
  currentPage,
  totalPages,
  onPageChange,
}: {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  if (totalPages <= 1) return null;

  const pages: (number | 'ellipsis')[] = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (currentPage > 3) pages.push('ellipsis');
    for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
      pages.push(i);
    }
    if (currentPage < totalPages - 2) pages.push('ellipsis');
    pages.push(totalPages);
  }

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="px-2 py-1 rounded text-sm text-text-secondary hover:text-text-primary hover:bg-surface-hover disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        aria-label="Previous page"
      >
        Prev
      </button>
      {pages.map((page, i) =>
        page === 'ellipsis' ? (
          <span key={`e${i}`} className="px-2 text-text-muted">...</span>
        ) : (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            className={`w-8 h-8 rounded text-sm transition-colors ${
              page === currentPage
                ? 'bg-primary text-white'
                : 'text-text-secondary hover:text-text-primary hover:bg-surface-hover'
            }`}
          >
            {page}
          </button>
        )
      )}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="px-2 py-1 rounded text-sm text-text-secondary hover:text-text-primary hover:bg-surface-hover disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        aria-label="Next page"
      >
        Next
      </button>
    </div>
  );
}

// ─── Confirm Dialog ─────────────────────────────────────────────────────────────

function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onCancel}>
      <div
        className="bg-surface border border-line rounded-xl p-6 max-w-sm w-full mx-4 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-semibold text-text-primary mb-2">{title}</h3>
        <p className="text-sm text-text-secondary mb-6">{message}</p>
        <div className="flex items-center justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-lg text-sm text-text-secondary hover:text-text-primary hover:bg-surface-hover transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 rounded-lg text-sm bg-danger hover:bg-red-600 text-white transition-colors"
          >
            {confirmLabel || 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page Component ────────────────────────────────────────────────────────

function HomePageWithBoundary() {
  return (
    <ErrorBoundary>
      <HomePage />
    </ErrorBoundary>
  );
}

const DynamicHomePage = dynamic(() => Promise.resolve(HomePageWithBoundary), {
  ssr: false,
  loading: () => (
    <div style={{ minHeight: '100vh', background: '#181825', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center', color: '#a1a1aa' }}>
        <h1 style={{ fontSize: 24, marginBottom: 12, color: '#e4e4e7' }}>
          <span style={{ color: '#6c5ce7' }}>TrueFans</span> SMALLBIZ
        </h1>
        <p>Loading...</p>
      </div>
    </div>
  ),
});

export default function Page() {
  return <DynamicHomePage />;
}

function HomePage() {
  // ── Sidebar State ──
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [maxPerRegion, setMaxPerRegion] = useState(25);
  const [useCache, setUseCache] = useState(true);

  // ── Region State ──
  const [selectedRegions, setSelectedRegions] = useState<Set<string>>(new Set());
  const [expandedRegionCategories, setExpandedRegionCategories] = useState<Set<string>>(new Set());
  const [cityFilter, setCityFilter] = useState('');

  // ── Business Type State ──
  const [selectedBusinessTypes, setSelectedBusinessTypes] = useState<Set<string>>(new Set());
  const [expandedBusinessCategories, setExpandedBusinessCategories] = useState<Set<string>>(new Set());

  // ── Tab State ──
  const [activeTab, setActiveTab] = useState<TabKey>('search');

  // ── Search State ──
  const [isSearching, setIsSearching] = useState(false);
  const [searchProgress, setSearchProgress] = useState<SearchProgress | null>(null);
  const [searchResults, setSearchResults] = useState<Business[]>([]);
  const [searchStartTime, setSearchStartTime] = useState<number | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const abortControllerRef = useRef<AbortController | null>(null);

  // ── Results Table State ──
  const [searchFilter, setSearchFilter] = useState('');
  const [regionFilter, setRegionFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [sortColumn, setSortColumn] = useState<keyof Business>('name');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const ITEMS_PER_PAGE = 100;

  // ── Database State ──
  const [dbSummary, setDbSummary] = useState<DatabaseSummary | null>(null);
  const [dbLoading, setDbLoading] = useState(false);

  // ── Schedule State ──
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [schedulesLoading, setSchedulesLoading] = useState(false);
  const [showScheduleForm, setShowScheduleForm] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null);
  const [scheduleForm, setScheduleForm] = useState({
    name: '',
    regions: [] as string[],
    businessTypes: [] as string[],
    frequency: 'weekly' as 'weekly' | 'biweekly' | 'monthly',
    maxPerRegion: 200,
  });

  // ── Confirm Dialog State ──
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    message: string;
    confirmLabel?: string;
    onConfirm: () => void;
  }>({ open: false, title: '', message: '', onConfirm: () => {} });

  // ── Elapsed time ticker ──
  useEffect(() => {
    if (!isSearching || !searchStartTime) return;
    const interval = setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - searchStartTime) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [isSearching, searchStartTime]);

  // ── Load data on tab change ──
  useEffect(() => {
    if (activeTab === 'database') loadDatabaseSummary();
    if (activeTab === 'schedules') loadSchedules();
  }, [activeTab]);

  // ── Region selection helpers ──
  const toggleRegionCategory = useCallback((categoryKey: string) => {
    setExpandedRegionCategories((prev) => {
      const next = new Set(prev);
      if (next.has(categoryKey)) next.delete(categoryKey);
      else next.add(categoryKey);
      return next;
    });
  }, []);

  const toggleRegion = useCallback((regionId: string, checked: boolean) => {
    setSelectedRegions((prev) => {
      const next = new Set(prev);
      if (checked) next.add(regionId);
      else next.delete(regionId);
      return next;
    });
  }, []);

  const selectAllRegionsInCategory = useCallback((regions: Region[]) => {
    setSelectedRegions((prev) => {
      const next = new Set(prev);
      regions.forEach((r) => next.add(r.id));
      return next;
    });
  }, []);

  const deselectAllRegionsInCategory = useCallback((regions: Region[]) => {
    setSelectedRegions((prev) => {
      const next = new Set(prev);
      regions.forEach((r) => next.delete(r.id));
      return next;
    });
  }, []);

  // ── Business type selection helpers ──
  const toggleBusinessCategory = useCallback((categoryKey: string) => {
    setExpandedBusinessCategories((prev) => {
      const next = new Set(prev);
      if (next.has(categoryKey)) next.delete(categoryKey);
      else next.add(categoryKey);
      return next;
    });
  }, []);

  const toggleBusinessType = useCallback((typeId: string, checked: boolean) => {
    setSelectedBusinessTypes((prev) => {
      const next = new Set(prev);
      if (checked) next.add(typeId);
      else next.delete(typeId);
      return next;
    });
  }, []);

  const selectAllTypesInCategory = useCallback((types: BusinessType[]) => {
    setSelectedBusinessTypes((prev) => {
      const next = new Set(prev);
      types.forEach((t) => next.add(t.id));
      return next;
    });
  }, []);

  const deselectAllTypesInCategory = useCallback((types: BusinessType[]) => {
    setSelectedBusinessTypes((prev) => {
      const next = new Set(prev);
      types.forEach((t) => next.delete(t.id));
      return next;
    });
  }, []);

  // ── Estimate ──
  const estimatedBusinesses = selectedRegions.size * selectedBusinessTypes.size * maxPerRegion;

  // ── Search ──
  const startSearch = useCallback(async () => {
    if (selectedRegions.size === 0 || selectedBusinessTypes.size === 0) return;

    const controller = new AbortController();
    abortControllerRef.current = controller;

    setIsSearching(true);
    setSearchResults([]);
    setSearchProgress({
      status: 'searching',
      currentRegion: '',
      currentType: '',
      regionsProcessed: 0,
      totalRegions: selectedRegions.size,
      newFound: 0,
      totalInDb: 0,
      errors: 0,
      percentage: 0,
    });
    setSearchStartTime(Date.now());
    setElapsedTime(0);
    setCurrentPage(1);

    try {
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          regions: Array.from(selectedRegions),
          businessTypes: Array.from(selectedBusinessTypes),
          maxPerRegion,
          useCache,
          city: cityFilter.trim() || undefined,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`Search failed: ${response.statusText}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response body');

      const decoder = new TextDecoder();
      let buffer = '';

      const processLine = (line: string) => {
        if (!line.trim()) return;
        try {
          const data = JSON.parse(line);
          if (!data || !data.type) return;

          if (data.type === 'progress' && data.data) {
            setSearchProgress((prev) => ({
              status: 'searching' as const,
              currentRegion: data.data.currentRegion ?? prev?.currentRegion ?? '',
              currentType: data.data.currentType ?? prev?.currentType ?? '',
              regionsProcessed: data.data.regionsProcessed ?? prev?.regionsProcessed ?? 0,
              totalRegions: data.data.totalRegions ?? prev?.totalRegions ?? 0,
              newFound: data.data.newFound ?? prev?.newFound ?? 0,
              totalInDb: data.data.totalInDb ?? prev?.totalInDb ?? 0,
              errors: data.data.errors ?? prev?.errors ?? 0,
              percentage: data.data.percentage ?? prev?.percentage ?? 0,
              totalDiscovered: data.data.totalDiscovered ?? prev?.totalDiscovered,
              duplicatesSkipped: data.data.duplicatesSkipped ?? prev?.duplicatesSkipped,
              withNewsletter: data.data.withNewsletter ?? prev?.withNewsletter,
            }));
          } else if (data.type === 'results' && Array.isArray(data.data)) {
            // Sanitize business objects to prevent render crashes from null fields
            const safeBiz = data.data.map((b: Record<string, unknown>) => ({
              id: b.id || `${b.name}-${b.address}-${b.regionId}`,
              name: String(b.name || 'Unknown'),
              type: String(b.type || ''),
              address: String(b.address || ''),
              city: String(b.city || ''),
              region: String(b.region || ''),
              regionId: String(b.regionId || ''),
              phone: String(b.phone || ''),
              email: String(b.email || ''),
              website: String(b.website || ''),
              rating: typeof b.rating === 'number' ? b.rating : null,
              isNew: b.isNew ?? true,
              hasNewsletter: b.hasNewsletter ?? false,
              newsletterSignals: Array.isArray(b.newsletterSignals) ? b.newsletterSignals : [],
              eventsUrl: String(b.eventsUrl || ''),
            }));
            setSearchResults((prev) => [...prev, ...safeBiz]);
          } else if (data.type === 'complete' && data.data) {
            setSearchProgress((prev) => ({
              ...prev!,
              ...data.data,
              status: 'complete' as const,
              percentage: 100,
            }));
          } else if (data.type === 'error') {
            setSearchProgress((prev) => prev ? {
              ...prev,
              errors: (prev.errors || 0) + 1,
              status: 'error' as const,
            } : null);
          }
          // Ignore 'heartbeat' and unknown types
        } catch {
          // Skip unparseable lines
        }
      };

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            processLine(line);
          }
        }
        // Process any remaining buffer
        if (buffer.trim()) {
          processLine(buffer);
        }
      } catch (readErr) {
        console.error('Stream read error:', readErr);
        // Stream died — show error but don't crash
        setSearchProgress((prev) => prev ? { ...prev, status: 'error' as const } : null);
      }
    } catch (err: unknown) {
      console.error('Search error:', err);
      if (err instanceof Error && err.name === 'AbortError') {
        setSearchProgress((prev) =>
          prev ? { ...prev, status: 'stopped' } : null
        );
      } else {
        setSearchProgress((prev) =>
          prev ? { ...prev, status: 'error' } : null
        );
      }
    } finally {
      setIsSearching(false);
      abortControllerRef.current = null;
    }
  }, [selectedRegions, selectedBusinessTypes, maxPerRegion, useCache, cityFilter]);

  const stopSearch = useCallback(() => {
    abortControllerRef.current?.abort();
  }, []);

  // ── Filtered & Sorted Results ──
  const filteredResults = useMemo(() => {
    let results = [...searchResults];

    if (searchFilter) {
      const q = searchFilter.toLowerCase();
      results = results.filter(
        (b) =>
          (b.name || '').toLowerCase().includes(q) ||
          (b.city || '').toLowerCase().includes(q) ||
          (b.email || '').toLowerCase().includes(q) ||
          (b.phone || '').includes(q)
      );
    }
    if (regionFilter) {
      results = results.filter((b) => b.regionId === regionFilter);
    }
    if (typeFilter) {
      results = results.filter((b) => b.type === typeFilter);
    }

    results.sort((a, b) => {
      const aVal = (a[sortColumn] as string | number | null) ?? '';
      const bVal = (b[sortColumn] as string | number | null) ?? '';
      if (aVal < bVal) return sortDir === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });

    return results;
  }, [searchResults, searchFilter, regionFilter, typeFilter, sortColumn, sortDir]);

  const totalPages = Math.ceil(filteredResults.length / ITEMS_PER_PAGE);
  const paginatedResults = filteredResults.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handleSort = useCallback(
    (col: keyof Business) => {
      if (sortColumn === col) {
        setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'));
      } else {
        setSortColumn(col);
        setSortDir('asc');
      }
      setCurrentPage(1);
    },
    [sortColumn]
  );

  // ── Unique regions/types from results for filter dropdowns ──
  const resultRegions = useMemo(() => {
    const map = new Map<string, string>();
    searchResults.forEach((b) => map.set(b.regionId, b.region));
    return Array.from(map.entries()).sort((a, b) => a[1].localeCompare(b[1]));
  }, [searchResults]);

  const resultTypes = useMemo(() => {
    const set = new Set<string>();
    searchResults.forEach((b) => set.add(b.type));
    return Array.from(set).sort();
  }, [searchResults]);

  // ── Export ──
  const handleExport = useCallback(
    (format: 'xlsx' | 'csv', newOnly: boolean) => {
      const params = new URLSearchParams({ format, newOnly: String(newOnly) });
      if (regionFilter) params.set('regionId', regionFilter);
      if (typeFilter) params.set('businessType', typeFilter);
      window.open(`/api/export?${params.toString()}`);
    },
    [regionFilter, typeFilter]
  );

  // ── View Region Businesses ──
  const viewRegionBusinesses = useCallback(async (regionId: string) => {
    try {
      const res = await fetch(`/api/businesses?regionId=${regionId}&limit=1000`);
      if (res.ok) {
        const data = await res.json();
        setSearchResults(data.businesses || []);
        setSearchProgress({
          status: 'complete',
          currentRegion: '',
          currentType: '',
          regionsProcessed: 1,
          totalRegions: 1,
          newFound: data.businesses?.length || 0,
          totalInDb: data.total || 0,
          errors: 0,
          percentage: 100,
        });
        setRegionFilter('');
        setTypeFilter('');
        setSearchFilter('');
        setCurrentPage(1);
        setActiveTab('search');
      }
    } catch {
      // ignore
    }
  }, []);

  // ── Database ──
  const loadDatabaseSummary = useCallback(async () => {
    setDbLoading(true);
    try {
      const res = await fetch('/api/database');
      if (res.ok) {
        const data = await res.json();
        setDbSummary(data);
      }
    } catch {
      // ignore
    } finally {
      setDbLoading(false);
    }
  }, []);

  const clearRegionData = useCallback(async (regionId: string) => {
    try {
      await fetch(`/api/database?regionId=${regionId}`, { method: 'DELETE' });
      loadDatabaseSummary();
    } catch {
      // ignore
    }
  }, [loadDatabaseSummary]);

  const clearAllData = useCallback(async () => {
    try {
      await fetch('/api/database', { method: 'DELETE' });
      loadDatabaseSummary();
    } catch {
      // ignore
    }
  }, [loadDatabaseSummary]);

  // ── Schedules ──
  const loadSchedules = useCallback(async () => {
    setSchedulesLoading(true);
    try {
      const res = await fetch('/api/schedules');
      if (res.ok) {
        const data = await res.json();
        setSchedules(data);
      }
    } catch {
      // ignore
    } finally {
      setSchedulesLoading(false);
    }
  }, []);

  const saveSchedule = useCallback(async () => {
    try {
      if (editingSchedule) {
        await fetch(`/api/schedules`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editingSchedule.id, ...scheduleForm }),
        });
      } else {
        await fetch('/api/schedules', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(scheduleForm),
        });
      }
      setShowScheduleForm(false);
      setEditingSchedule(null);
      setScheduleForm({
        name: '',
        regions: [],
        businessTypes: [],
        frequency: 'weekly',
        maxPerRegion: 200,
      });
      loadSchedules();
    } catch {
      // ignore
    }
  }, [editingSchedule, scheduleForm, loadSchedules]);

  const deleteSchedule = useCallback(
    async (id: string) => {
      try {
        await fetch(`/api/schedules?id=${id}`, { method: 'DELETE' });
        loadSchedules();
      } catch {
        // ignore
      }
    },
    [loadSchedules]
  );

  const toggleScheduleActive = useCallback(
    async (schedule: Schedule) => {
      try {
        await fetch('/api/schedules', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: schedule.id, active: !schedule.active }),
        });
        loadSchedules();
      } catch {
        // ignore
      }
    },
    [loadSchedules]
  );

  const runScheduleNow = useCallback(
    async (id: string) => {
      try {
        await fetch(`/api/schedules?id=${id}&action=run`, { method: 'POST' });
        loadSchedules();
      } catch {
        // ignore
      }
    },
    [loadSchedules]
  );

  const openEditSchedule = useCallback((schedule: Schedule) => {
    setEditingSchedule(schedule);
    setScheduleForm({
      name: schedule.name,
      regions: schedule.regions,
      businessTypes: schedule.businessTypes,
      frequency: schedule.frequency,
      maxPerRegion: schedule.maxPerRegion,
    });
    setShowScheduleForm(true);
  }, []);

  // ── Format helpers ──
  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return m > 0 ? `${m}m ${s}s` : `${s}s`;
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  // ── Sort indicator ──
  const SortIndicator = ({ column }: { column: keyof Business }) => {
    if (sortColumn !== column) return <span className="text-text-muted/30 ml-1">&#8597;</span>;
    return <span className="text-primary-light ml-1">{sortDir === 'asc' ? '\u2191' : '\u2193'}</span>;
  };

  // ─── RENDER ───────────────────────────────────────────────────────────────────

  return (
    <div className="flex h-screen bg-surface-dark text-text-primary" style={{ overflow: 'hidden' }}>
      {/* ── Sidebar ── */}
      <aside
        className={`flex-shrink-0 bg-surface border-r border-line flex flex-col ${
          sidebarOpen ? 'w-[360px]' : 'w-0'
        }`}
        style={{ overflow: 'hidden', transition: 'width 0.3s ease-in-out' }}
        aria-label="Sidebar"
      >
        <div className="w-[360px] flex flex-col h-full">
          {/* Sidebar Header */}
          <div className="px-5 py-4 border-b border-line">
            <h1 className="text-xl font-bold text-text-primary">
              <span className="text-primary">TrueFans</span> SMALLBIZ
            </h1>
            <p className="text-xs text-text-muted mt-0.5">Service Business Discovery</p>
          </div>

          {/* Sidebar Content */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5">
            {/* Settings */}
            <div>
              <h3 className="text-xs uppercase tracking-wider text-text-muted font-semibold mb-3">Settings</h3>
              <div className="space-y-3">
                <div>
                  <label htmlFor="maxPerRegion" className="block text-sm text-text-secondary mb-1">
                    Results per region
                  </label>
                  <select
                    id="maxPerRegion"
                    value={maxPerRegion}
                    onChange={(e) => setMaxPerRegion(parseInt(e.target.value))}
                    className="w-full bg-surface-dark border border-line rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                  >
                    {[25, 50, 75, 100, 150, 200, 300, 500, 750, 1000].map((n) => (
                      <option key={n} value={n}>{n}</option>
                    ))}
                  </select>
                </div>
                <label className="flex items-center gap-2 cursor-pointer group">
                  <div
                    className={`relative w-9 h-5 rounded-full transition-colors ${
                      useCache ? 'bg-primary' : 'bg-surface-dark border border-line'
                    }`}
                    onClick={() => setUseCache(!useCache)}
                    role="switch"
                    aria-checked={useCache}
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === ' ' || e.key === 'Enter') {
                        e.preventDefault();
                        setUseCache(!useCache);
                      }
                    }}
                  >
                    <div
                      className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                        useCache ? 'translate-x-[18px]' : 'translate-x-0.5'
                      }`}
                    />
                  </div>
                  <span className="text-sm text-text-secondary group-hover:text-text-primary transition-colors">
                    Use cache
                  </span>
                </label>
              </div>
            </div>

            {/* Region Selection */}
            <div>
              <h3 className="text-xs uppercase tracking-wider text-text-muted font-semibold mb-3">
                Regions
                {selectedRegions.size > 0 && (
                  <span className="ml-2 text-primary-light normal-case">
                    ({selectedRegions.size} selected)
                  </span>
                )}
              </h3>
              <div className="space-y-2">
                {REGION_CATEGORIES.map((category: RegionCategory) => {
                  const catKey = category.name;
                  const catRegions = category.regions;
                  const selectedInCat = catRegions.filter((r: Region) => selectedRegions.has(r.id)).length;
                  return (
                    <ExpandableSection
                      key={catKey}
                      title={category.name}
                      count={catRegions.length}
                      selectedCount={selectedInCat}
                      expanded={expandedRegionCategories.has(catKey)}
                      onToggle={() => toggleRegionCategory(catKey)}
                      onSelectAll={() => selectAllRegionsInCategory(catRegions)}
                      onDeselectAll={() => deselectAllRegionsInCategory(catRegions)}
                    >
                      {catRegions.map((region: Region) => (
                        <CheckboxItem
                          key={region.id}
                          label={region.name}
                          checked={selectedRegions.has(region.id)}
                          onChange={(checked) => toggleRegion(region.id, checked)}
                        />
                      ))}
                    </ExpandableSection>
                  );
                })}
              </div>
            </div>

            {/* City Filter */}
            {selectedRegions.size > 0 && (
              <div>
                <h3 className="text-xs uppercase tracking-wider text-text-muted font-semibold mb-3">
                  City / Town
                  {cityFilter && (
                    <span className="ml-2 text-primary-light normal-case">
                      ({cityFilter})
                    </span>
                  )}
                </h3>
                <div className="relative">
                  <input
                    type="text"
                    value={cityFilter}
                    onChange={(e) => setCityFilter(e.target.value)}
                    placeholder="Optional: e.g. Austin, Manchester..."
                    className="w-full px-3 py-2 rounded-lg bg-surface-hover border border-line text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary transition-colors"
                  />
                  {cityFilter && (
                    <button
                      onClick={() => setCityFilter('')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary transition-colors"
                      title="Clear city"
                    >
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M3 3l8 8M11 3l-8 8" />
                      </svg>
                    </button>
                  )}
                </div>
                <p className="text-xs text-text-muted mt-1.5">
                  Narrow search to a specific city within the selected region(s)
                </p>
              </div>
            )}

            {/* Business Type Selection */}
            <div>
              <h3 className="text-xs uppercase tracking-wider text-text-muted font-semibold mb-3">
                Business Types
                {selectedBusinessTypes.size > 0 && (
                  <span className="ml-2 text-primary-light normal-case">
                    ({selectedBusinessTypes.size} selected)
                  </span>
                )}
              </h3>
              <div className="space-y-2">
                {BUSINESS_CATEGORIES.map((category: string) => {
                  const types = getBusinessTypesByCategory()[category] || [];
                  const selectedInCat = types.filter((t: BusinessType) => selectedBusinessTypes.has(t.id)).length;
                  return (
                    <ExpandableSection
                      key={category}
                      title={category}
                      count={types.length}
                      selectedCount={selectedInCat}
                      expanded={expandedBusinessCategories.has(category)}
                      onToggle={() => toggleBusinessCategory(category)}
                      onSelectAll={() => selectAllTypesInCategory(types)}
                      onDeselectAll={() => deselectAllTypesInCategory(types)}
                    >
                      {types.map((type: BusinessType) => (
                        <CheckboxItem
                          key={type.id}
                          label={type.name}
                          checked={selectedBusinessTypes.has(type.id)}
                          onChange={(checked) => toggleBusinessType(type.id, checked)}
                        />
                      ))}
                    </ExpandableSection>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Sidebar Footer - Action Buttons */}
          <div className="px-4 py-4 border-t border-line space-y-3">
            {selectedRegions.size > 0 && selectedBusinessTypes.size > 0 && (
              <p className="text-xs text-text-muted text-center">
                Up to{' '}
                <span className="text-text-secondary font-medium">
                  {estimatedBusinesses.toLocaleString()}
                </span>{' '}
                businesses
              </p>
            )}
            {isSearching ? (
              <button
                onClick={stopSearch}
                className="w-full py-2.5 rounded-lg bg-danger hover:bg-red-600 text-white font-medium text-sm transition-colors flex items-center justify-center gap-2"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                  <rect x="3" y="3" width="10" height="10" rx="1" />
                </svg>
                Stop Search
              </button>
            ) : (
              <button
                onClick={startSearch}
                disabled={selectedRegions.size === 0 || selectedBusinessTypes.size === 0}
                className="w-full py-2.5 rounded-lg bg-primary hover:bg-primary-dark text-white font-medium text-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <SearchIcon />
                Search Selected
              </button>
            )}
            {selectedRegions.size === 0 && selectedBusinessTypes.size === 0 && (
              <p className="text-xs text-text-muted text-center">
                Select regions and business types to search
              </p>
            )}
          </div>
        </div>
      </aside>

      {/* ── Sidebar Toggle ── */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="absolute top-1/2 -translate-y-1/2 z-20 bg-surface border border-line border-l-0 rounded-r-lg px-1 py-3 text-text-secondary hover:text-text-primary hover:bg-surface-hover"
        style={{ left: sidebarOpen ? 360 : 0, transition: 'left 0.3s ease-in-out' }}
        aria-label={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
      >
        {sidebarOpen ? (
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 3L5 7l4 4" />
          </svg>
        ) : (
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M5 3l4 4-4 4" />
          </svg>
        )}
      </button>

      {/* ── Main Content ── */}
      <main className="flex-1 flex flex-col" style={{ overflow: 'hidden' }}>
        {/* Tab Bar */}
        <div className="flex items-center border-b border-line bg-surface px-6">
          {(['search', 'database', 'schedules'] as TabKey[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-3.5 text-sm font-medium transition-colors relative ${
                activeTab === tab
                  ? 'text-primary-light'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
              {activeTab === tab && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-t" />
              )}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto">
          {/* ────── SEARCH TAB ────── */}
          {activeTab === 'search' && (
            <div className="p-6">
              {/* No search yet - Welcome */}
              {!isSearching && !searchProgress && searchResults.length === 0 && (
                <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
                  <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
                    <SearchIcon className="w-10 h-10 text-primary" />
                  </div>
                  <h2 className="text-2xl font-bold text-text-primary mb-3">
                    Welcome to TrueFans SMALLBIZ
                  </h2>
                  <p className="text-text-secondary max-w-md mb-8 leading-relaxed">
                    Discover service businesses across multiple regions. Select your target
                    regions and business types from the sidebar, then click{' '}
                    <span className="text-primary-light font-medium">Search Selected</span> to begin.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-lg w-full">
                    <div className="bg-surface rounded-xl p-4 border border-line">
                      <div className="text-2xl mb-2">1</div>
                      <p className="text-sm text-text-secondary">Select regions</p>
                    </div>
                    <div className="bg-surface rounded-xl p-4 border border-line">
                      <div className="text-2xl mb-2">2</div>
                      <p className="text-sm text-text-secondary">Choose business types</p>
                    </div>
                    <div className="bg-surface rounded-xl p-4 border border-line">
                      <div className="text-2xl mb-2">3</div>
                      <p className="text-sm text-text-secondary">Search & export</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Search Progress */}
              {(isSearching || (searchProgress && searchProgress.status !== 'complete' && searchResults.length === 0)) && searchProgress && (
                <div className="max-w-2xl mx-auto">
                  <div className="bg-surface rounded-xl border border-line p-6 mb-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-text-primary flex items-center gap-2">
                        {isSearching && <Spinner className="text-primary" />}
                        {searchProgress.status === 'searching' && 'Searching...'}
                        {searchProgress.status === 'stopped' && 'Search Stopped'}
                        {searchProgress.status === 'error' && 'Search Error'}
                      </h3>
                      <span className="text-sm text-text-muted">{formatDuration(elapsedTime)}</span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-surface-dark rounded-full h-3 mb-4 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-primary to-primary-light h-full rounded-full transition-all duration-500 ease-out"
                        style={{ width: `${searchProgress.percentage ?? 0}%` }}
                      />
                    </div>
                    <p className="text-sm text-text-secondary mb-4">
                      {(searchProgress.percentage ?? 0).toFixed(0)}% complete
                    </p>

                    {/* Current Task */}
                    {searchProgress.currentRegion && (
                      <p className="text-sm text-text-muted mb-4">
                        Searching{' '}
                        <span className="text-text-secondary">{searchProgress.currentType}</span> in{' '}
                        <span className="text-text-secondary">{searchProgress.currentRegion}</span>
                      </p>
                    )}

                    {/* Stats */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="bg-surface-dark rounded-lg p-3 text-center">
                        <p className="text-lg font-bold text-text-primary">
                          {searchProgress.regionsProcessed}/{searchProgress.totalRegions}
                        </p>
                        <p className="text-xs text-text-muted">Regions</p>
                      </div>
                      <div className="bg-surface-dark rounded-lg p-3 text-center">
                        <p className="text-lg font-bold text-success">{searchProgress.newFound}</p>
                        <p className="text-xs text-text-muted">New Found</p>
                      </div>
                      <div className="bg-surface-dark rounded-lg p-3 text-center">
                        <p className="text-lg font-bold text-text-primary">{searchProgress.totalInDb}</p>
                        <p className="text-xs text-text-muted">Total in DB</p>
                      </div>
                      {searchProgress.errors > 0 && (
                        <div className="bg-surface-dark rounded-lg p-3 text-center">
                          <p className="text-lg font-bold text-danger">{searchProgress.errors}</p>
                          <p className="text-xs text-text-muted">Errors</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Search Summary Card */}
              {!isSearching && searchProgress?.status === 'complete' && searchResults.length > 0 && (
                <div className="bg-surface rounded-xl border border-line p-5 mb-6">
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-text-primary">
                        {(searchProgress.totalDiscovered ?? searchProgress.newFound ?? 0).toLocaleString()}
                      </p>
                      <p className="text-xs text-text-muted mt-1">Total Found</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-success">
                        {(searchProgress.newFound ?? 0).toLocaleString()}
                      </p>
                      <p className="text-xs text-text-muted mt-1">New Leads Added</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-warning">
                        {(searchProgress.duplicatesSkipped ?? 0).toLocaleString()}
                      </p>
                      <p className="text-xs text-text-muted mt-1">Already in Database</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-primary-light">
                        {(searchProgress.withNewsletter ?? 0).toLocaleString()}
                      </p>
                      <p className="text-xs text-text-muted mt-1">Have Newsletter</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-info">
                        {(searchProgress.totalInDb ?? 0).toLocaleString()}
                      </p>
                      <p className="text-xs text-text-muted mt-1">Total in Database</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Results Table */}
              {searchResults.length > 0 && (
                <div>
                  {/* Results Header */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-text-primary">
                        Search Results
                        <span className="ml-2 text-sm font-normal text-text-muted">
                          ({filteredResults.length.toLocaleString()} businesses)
                        </span>
                      </h3>
                      {searchProgress?.status === 'complete' && (
                        <div className="mt-1">
                          <p className="text-sm text-success font-medium">Search Complete</p>
                          <p className="text-sm text-text-secondary mt-0.5">
                            Found {(searchProgress.totalDiscovered ?? searchProgress.newFound ?? 0).toLocaleString()} businesses
                            {' \u2014 '}
                            <span className="text-success font-medium">
                              {(searchProgress.newFound ?? 0).toLocaleString()} new leads added
                            </span>
                            {(searchProgress.duplicatesSkipped ?? 0) > 0 && (
                              <span className="text-text-muted">
                                , {searchProgress.duplicatesSkipped!.toLocaleString()} already in database
                              </span>
                            )}
                          </p>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleExport('xlsx', false)}
                        className="px-3 py-1.5 rounded-lg bg-surface border border-line text-sm text-text-secondary hover:text-text-primary hover:bg-surface-hover transition-colors"
                      >
                        Export All (Excel)
                      </button>
                      <button
                        onClick={() => handleExport('csv', true)}
                        className="px-3 py-1.5 rounded-lg bg-surface border border-line text-sm text-text-secondary hover:text-text-primary hover:bg-surface-hover transition-colors"
                      >
                        Export New Only (CSV)
                      </button>
                    </div>
                  </div>

                  {/* Filters */}
                  <div className="flex flex-col sm:flex-row gap-3 mb-4">
                    <div className="relative flex-1">
                      <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                      <input
                        type="text"
                        value={searchFilter}
                        onChange={(e) => {
                          setSearchFilter(e.target.value);
                          setCurrentPage(1);
                        }}
                        placeholder="Filter results..."
                        className="w-full bg-surface border border-line rounded-lg pl-9 pr-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                      />
                    </div>
                    <select
                      value={regionFilter}
                      onChange={(e) => {
                        setRegionFilter(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="bg-surface border border-line rounded-lg px-3 py-2 text-sm text-text-secondary focus:outline-none focus:border-primary transition-colors"
                      aria-label="Filter by region"
                    >
                      <option value="">All Regions</option>
                      {resultRegions.map(([id, name]) => (
                        <option key={id} value={id}>
                          {name}
                        </option>
                      ))}
                    </select>
                    <select
                      value={typeFilter}
                      onChange={(e) => {
                        setTypeFilter(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="bg-surface border border-line rounded-lg px-3 py-2 text-sm text-text-secondary focus:outline-none focus:border-primary transition-colors"
                      aria-label="Filter by business type"
                    >
                      <option value="">All Types</option>
                      {resultTypes.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Table */}
                  <div className="bg-surface rounded-xl border border-line overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-line bg-surface-dark">
                            <th className="w-8 px-3 py-3" />
                            {[
                              { key: 'name' as keyof Business, label: 'Name' },
                              { key: 'type' as keyof Business, label: 'Type' },
                              { key: 'address' as keyof Business, label: 'Address' },
                              { key: 'city' as keyof Business, label: 'City' },
                              { key: 'region' as keyof Business, label: 'Region' },
                              { key: 'phone' as keyof Business, label: 'Phone' },
                              { key: 'email' as keyof Business, label: 'Email' },
                              { key: 'website' as keyof Business, label: 'Website' },
                              { key: 'hasNewsletter' as keyof Business, label: 'Newsletter' },
                              { key: 'eventsUrl' as keyof Business, label: 'Events Page' },
                              { key: 'rating' as keyof Business, label: 'Rating' },
                            ].map(({ key, label }) => (
                              <th
                                key={key}
                                onClick={() => handleSort(key)}
                                className="px-3 py-3 text-left text-xs font-semibold text-text-muted uppercase tracking-wider cursor-pointer hover:text-text-secondary transition-colors whitespace-nowrap"
                              >
                                {label}
                                <SortIndicator column={key} />
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-line">
                          {paginatedResults.map((business) => (
                            <React.Fragment key={business.id}>
                              <tr
                                onClick={() =>
                                  setExpandedRow(expandedRow === business.id ? null : business.id)
                                }
                                className="hover:bg-surface-hover transition-colors cursor-pointer"
                              >
                                <td className="px-3 py-2.5 text-center">
                                  {business.isNew && (
                                    <span
                                      className="inline-block w-2 h-2 rounded-full bg-success"
                                      title="New business"
                                    />
                                  )}
                                </td>
                                <td className="px-3 py-2.5 text-text-primary font-medium whitespace-nowrap max-w-[200px] truncate">
                                  {business.name}
                                </td>
                                <td className="px-3 py-2.5 text-text-secondary whitespace-nowrap">
                                  {business.type}
                                </td>
                                <td className="px-3 py-2.5 text-text-secondary max-w-[180px] truncate">
                                  {business.address}
                                </td>
                                <td className="px-3 py-2.5 text-text-secondary whitespace-nowrap">
                                  {business.city}
                                </td>
                                <td className="px-3 py-2.5 text-text-secondary whitespace-nowrap">
                                  {business.region}
                                </td>
                                <td className="px-3 py-2.5 text-text-secondary whitespace-nowrap">
                                  {business.phone}
                                </td>
                                <td className="px-3 py-2.5 text-text-secondary max-w-[160px] truncate">
                                  {business.email ? (
                                    <a
                                      href={`mailto:${business.email}`}
                                      onClick={(e) => e.stopPropagation()}
                                      className="text-info hover:underline"
                                    >
                                      {business.email}
                                    </a>
                                  ) : (
                                    <span className="text-text-muted">-</span>
                                  )}
                                </td>
                                <td className="px-3 py-2.5 text-text-secondary max-w-[140px] truncate">
                                  {business.website ? (
                                    <a
                                      href={business.website.startsWith('http') ? business.website : `https://${business.website}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      onClick={(e) => e.stopPropagation()}
                                      className="text-info hover:underline"
                                    >
                                      {business.website.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                                    </a>
                                  ) : (
                                    <span className="text-text-muted">-</span>
                                  )}
                                </td>
                                <td className="px-3 py-2.5 text-center whitespace-nowrap">
                                  {business.hasNewsletter ? (
                                    <span
                                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-success/15 text-success text-xs font-medium"
                                      title={business.newsletterSignals?.join(', ') || 'Newsletter found'}
                                    >
                                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 6l3 3 5-5" /></svg>
                                      Yes
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-surface-dark text-text-muted text-xs">
                                      No
                                    </span>
                                  )}
                                </td>
                                <td className="px-3 py-2.5 text-text-secondary whitespace-nowrap">
                                  {business.eventsUrl ? (
                                    <a
                                      href={business.eventsUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      onClick={(e) => e.stopPropagation()}
                                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/15 text-primary-light text-xs font-medium hover:bg-primary/25 transition-colors"
                                    >
                                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="1.5" y="2.5" width="9" height="8" rx="1" /><path d="M1.5 5.5h9M4 1v3M8 1v3" /></svg>
                                      Events
                                    </a>
                                  ) : (
                                    <span className="text-text-muted text-xs">-</span>
                                  )}
                                </td>
                                <td className="px-3 py-2.5 text-text-secondary whitespace-nowrap">
                                  {business.rating != null ? (
                                    <span className="flex items-center gap-1">
                                      <span className="text-warning">&#9733;</span>
                                      {business.rating.toFixed(1)}
                                    </span>
                                  ) : (
                                    <span className="text-text-muted">-</span>
                                  )}
                                </td>
                              </tr>
                              {expandedRow === business.id && (
                                <tr>
                                  <td colSpan={12} className="bg-surface-dark px-6 py-4">
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                                      <div>
                                        <p className="text-text-muted text-xs mb-1">Full Name</p>
                                        <p className="text-text-primary">{business.name}</p>
                                      </div>
                                      <div>
                                        <p className="text-text-muted text-xs mb-1">Full Address</p>
                                        <p className="text-text-primary">
                                          {business.address}, {business.city}, {business.region}
                                        </p>
                                      </div>
                                      <div>
                                        <p className="text-text-muted text-xs mb-1">Phone</p>
                                        <p className="text-text-primary">
                                          {business.phone || 'Not available'}
                                        </p>
                                      </div>
                                      <div>
                                        <p className="text-text-muted text-xs mb-1">Email</p>
                                        <p className="text-text-primary">
                                          {business.email ? (
                                            <a href={`mailto:${business.email}`} className="text-info hover:underline">
                                              {business.email}
                                            </a>
                                          ) : (
                                            'Not available'
                                          )}
                                        </p>
                                      </div>
                                      <div>
                                        <p className="text-text-muted text-xs mb-1">Website</p>
                                        <p className="text-text-primary">
                                          {business.website ? (
                                            <a
                                              href={business.website.startsWith('http') ? business.website : `https://${business.website}`}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              className="text-info hover:underline"
                                            >
                                              {business.website}
                                            </a>
                                          ) : (
                                            'Not available'
                                          )}
                                        </p>
                                      </div>
                                      <div>
                                        <p className="text-text-muted text-xs mb-1">Business Type</p>
                                        <p className="text-text-primary">{business.type}</p>
                                      </div>
                                      <div>
                                        <p className="text-text-muted text-xs mb-1">Rating</p>
                                        <p className="text-text-primary">
                                          {business.rating != null
                                            ? `${business.rating.toFixed(1)} / 5.0`
                                            : 'No rating'}
                                        </p>
                                      </div>
                                      <div>
                                        <p className="text-text-muted text-xs mb-1">Newsletter Signup</p>
                                        <p className="text-text-primary">
                                          {business.hasNewsletter ? (
                                            <span className="inline-flex items-center gap-1 text-success">
                                              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 6l3 3 5-5" /></svg>
                                              Found
                                            </span>
                                          ) : (
                                            <span className="text-text-muted">Not detected</span>
                                          )}
                                        </p>
                                        {business.newsletterSignals && business.newsletterSignals.length > 0 && (
                                          <div className="mt-1 space-y-0.5">
                                            {business.newsletterSignals.map((sig, i) => (
                                              <p key={i} className="text-xs text-text-muted truncate max-w-[250px]">
                                                {sig}
                                              </p>
                                            ))}
                                          </div>
                                        )}
                                      </div>
                                      {business.eventsUrl && (
                                        <div>
                                          <p className="text-text-muted text-xs mb-1">Events / Calendar</p>
                                          <p className="text-text-primary">
                                            <a
                                              href={business.eventsUrl}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              className="text-info hover:underline"
                                            >
                                              {business.eventsUrl.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                                            </a>
                                          </p>
                                        </div>
                                      )}
                                      <div>
                                        <p className="text-text-muted text-xs mb-1">Status</p>
                                        <p className="text-text-primary">
                                          {business.isNew ? (
                                            <span className="inline-flex items-center gap-1 text-success">
                                              <span className="w-2 h-2 rounded-full bg-success" />
                                              New
                                            </span>
                                          ) : (
                                            'Existing'
                                          )}
                                        </p>
                                      </div>
                                    </div>
                                  </td>
                                </tr>
                              )}
                            </React.Fragment>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Empty filter state */}
                    {paginatedResults.length === 0 && filteredResults.length === 0 && (
                      <div className="py-12 text-center">
                        <p className="text-text-muted">No results match your filters</p>
                      </div>
                    )}
                  </div>

                  {/* Pagination */}
                  <div className="flex items-center justify-between mt-4">
                    <p className="text-sm text-text-muted">
                      Showing {((currentPage - 1) * ITEMS_PER_PAGE + 1).toLocaleString()}-
                      {Math.min(currentPage * ITEMS_PER_PAGE, filteredResults.length).toLocaleString()}{' '}
                      of {filteredResults.length.toLocaleString()}
                    </p>
                    <Pagination
                      currentPage={currentPage}
                      totalPages={totalPages}
                      onPageChange={setCurrentPage}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ────── DATABASE TAB ────── */}
          {activeTab === 'database' && (
            <div className="p-6">
              {dbLoading && (
                <div className="flex items-center justify-center py-20">
                  <Spinner className="text-primary" />
                  <span className="ml-3 text-text-secondary">Loading database summary...</span>
                </div>
              )}

              {!dbLoading && !dbSummary && (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <p className="text-text-muted text-lg mb-2">No data available</p>
                  <p className="text-text-muted text-sm">Run a search to populate the database</p>
                </div>
              )}

              {!dbLoading && dbSummary && (
                <>
                  {/* Summary Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                    <div className="bg-surface rounded-xl border border-line p-5">
                      <p className="text-sm text-text-muted mb-1">Total Businesses</p>
                      <p className="text-3xl font-bold text-text-primary">
                        {dbSummary.totalBusinesses.toLocaleString()}
                      </p>
                    </div>
                    <div className="bg-surface rounded-xl border border-line p-5">
                      <p className="text-sm text-text-muted mb-1">Total Regions</p>
                      <p className="text-3xl font-bold text-text-primary">
                        {dbSummary.totalRegions}
                      </p>
                    </div>
                    <div className="bg-surface rounded-xl border border-line p-5">
                      <p className="text-sm text-text-muted mb-1">Business Types</p>
                      <p className="text-3xl font-bold text-text-primary">
                        {dbSummary.businessTypes}
                      </p>
                    </div>
                  </div>

                  {/* Business Types Summary */}
                  {dbSummary.businessTypeSummaries && dbSummary.businessTypeSummaries.length > 0 && (
                    <div className="mb-8">
                      <h3 className="text-lg font-semibold text-text-primary mb-4">Business Types</h3>
                      <div className="flex flex-wrap gap-2">
                        {dbSummary.businessTypeSummaries.map((bt) => (
                          <span
                            key={bt.businessType}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface border border-line text-sm"
                          >
                            <span className="text-text-primary font-medium">{bt.businessType}</span>
                            <span className="text-text-muted">({bt.count})</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Region Grid */}
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-text-primary">Regions</h3>
                    <button
                      onClick={() =>
                        setConfirmDialog({
                          open: true,
                          title: 'Clear All Data',
                          message:
                            'This will permanently delete all business data from the database. This action cannot be undone.',
                          confirmLabel: 'Clear All',
                          onConfirm: () => {
                            clearAllData();
                            setConfirmDialog((prev) => ({ ...prev, open: false }));
                          },
                        })
                      }
                      className="px-3 py-1.5 rounded-lg text-sm text-danger border border-danger/30 hover:bg-danger/10 transition-colors"
                    >
                      Clear All Data
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {dbSummary.regions.map((region) => (
                      <div
                        key={region.id}
                        className="bg-surface rounded-xl border border-line p-4 hover:border-primary/30 transition-colors"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{countryFlag(region.countryCode)}</span>
                            <h4 className="text-sm font-medium text-text-primary truncate">
                              {region.name}
                            </h4>
                          </div>
                        </div>
                        <p className="text-2xl font-bold text-text-primary mb-1">
                          {region.businessCount.toLocaleString()}
                        </p>
                        {region.businessTypes && region.businessTypes.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-2">
                            {region.businessTypes.slice(0, 5).map((bt) => (
                              <span
                                key={bt.businessType}
                                className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary-light"
                              >
                                {bt.businessType} ({bt.count})
                              </span>
                            ))}
                            {region.businessTypes.length > 5 && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-surface-hover text-text-muted">
                                +{region.businessTypes.length - 5} more
                              </span>
                            )}
                          </div>
                        )}
                        <p className="text-xs text-text-muted mb-3">
                          Updated {formatDate(region.lastUpdated)}
                        </p>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => viewRegionBusinesses(region.id)}
                            className="flex-1 px-2 py-1 rounded text-xs text-primary-light border border-primary/30 hover:bg-primary/10 transition-colors"
                          >
                            View
                          </button>
                          <button
                            onClick={() => {
                              const params = new URLSearchParams({
                                format: 'xlsx',
                                regionId: region.id,
                                newOnly: 'false',
                              });
                              window.open(`/api/export?${params.toString()}`);
                            }}
                            className="flex-1 px-2 py-1 rounded text-xs text-text-secondary border border-line hover:bg-surface-hover transition-colors"
                          >
                            Export
                          </button>
                          <button
                            onClick={() =>
                              setConfirmDialog({
                                open: true,
                                title: 'Clear Region Data',
                                message: `Delete all business data for ${region.name}? This cannot be undone.`,
                                confirmLabel: 'Clear',
                                onConfirm: () => {
                                  clearRegionData(region.id);
                                  setConfirmDialog((prev) => ({ ...prev, open: false }));
                                },
                              })
                            }
                            className="px-2 py-1 rounded text-xs text-danger border border-danger/30 hover:bg-danger/10 transition-colors"
                          >
                            Clear
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {dbSummary.regions.length === 0 && (
                    <div className="text-center py-12">
                      <p className="text-text-muted">No region data yet. Run a search to get started.</p>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* ────── SCHEDULES TAB ────── */}
          {activeTab === 'schedules' && (
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-text-primary">Scheduled Searches</h3>
                <button
                  onClick={() => {
                    setEditingSchedule(null);
                    setScheduleForm({
                      name: '',
                      regions: Array.from(selectedRegions),
                      businessTypes: Array.from(selectedBusinessTypes),
                      frequency: 'weekly',
                      maxPerRegion,
                    });
                    setShowScheduleForm(true);
                  }}
                  className="px-4 py-2 rounded-lg bg-primary hover:bg-primary-dark text-white text-sm font-medium transition-colors"
                >
                  + Add Schedule
                </button>
              </div>

              {schedulesLoading && (
                <div className="flex items-center justify-center py-20">
                  <Spinner className="text-primary" />
                  <span className="ml-3 text-text-secondary">Loading schedules...</span>
                </div>
              )}

              {/* Schedule Form */}
              {showScheduleForm && (
                <div className="bg-surface rounded-xl border border-line p-6 mb-6">
                  <h4 className="text-base font-semibold text-text-primary mb-4">
                    {editingSchedule ? 'Edit Schedule' : 'New Schedule'}
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label htmlFor="scheduleName" className="block text-sm text-text-secondary mb-1">
                        Schedule Name
                      </label>
                      <input
                        id="scheduleName"
                        type="text"
                        value={scheduleForm.name}
                        onChange={(e) =>
                          setScheduleForm((prev) => ({ ...prev, name: e.target.value }))
                        }
                        placeholder="e.g. Weekly US Plumbers"
                        className="w-full bg-surface-dark border border-line rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                      />
                    </div>
                    <div>
                      <label htmlFor="scheduleFrequency" className="block text-sm text-text-secondary mb-1">
                        Frequency
                      </label>
                      <select
                        id="scheduleFrequency"
                        value={scheduleForm.frequency}
                        onChange={(e) =>
                          setScheduleForm((prev) => ({
                            ...prev,
                            frequency: e.target.value as 'weekly' | 'biweekly' | 'monthly',
                          }))
                        }
                        className="w-full bg-surface-dark border border-line rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-primary transition-colors"
                      >
                        <option value="weekly">Weekly</option>
                        <option value="biweekly">Biweekly</option>
                        <option value="monthly">Monthly</option>
                      </select>
                    </div>
                    <div>
                      <label htmlFor="scheduleMaxPerRegion" className="block text-sm text-text-secondary mb-1">
                        Max per Region
                      </label>
                      <input
                        id="scheduleMaxPerRegion"
                        type="number"
                        min={1}
                        max={1000}
                        value={scheduleForm.maxPerRegion}
                        onChange={(e) =>
                          setScheduleForm((prev) => ({
                            ...prev,
                            maxPerRegion: Math.max(1, parseInt(e.target.value) || 1),
                          }))
                        }
                        className="w-full bg-surface-dark border border-line rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                      />
                    </div>
                  </div>

                  {/* Regions & Types Summary */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-text-secondary mb-1">
                        Regions ({scheduleForm.regions.length} selected)
                      </p>
                      <div className="bg-surface-dark border border-line rounded-lg p-2 max-h-32 overflow-y-auto">
                        {scheduleForm.regions.length === 0 ? (
                          <p className="text-xs text-text-muted p-1">
                            No regions selected. Use the sidebar to select regions first.
                          </p>
                        ) : (
                          <div className="flex flex-wrap gap-1">
                            {scheduleForm.regions.map((rId) => (
                              <span
                                key={rId}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-surface text-xs text-text-secondary border border-line"
                              >
                                {rId}
                                <button
                                  onClick={() =>
                                    setScheduleForm((prev) => ({
                                      ...prev,
                                      regions: prev.regions.filter((r) => r !== rId),
                                    }))
                                  }
                                  className="text-text-muted hover:text-danger transition-colors ml-0.5"
                                  aria-label={`Remove ${rId}`}
                                >
                                  x
                                </button>
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-text-secondary mb-1">
                        Business Types ({scheduleForm.businessTypes.length} selected)
                      </p>
                      <div className="bg-surface-dark border border-line rounded-lg p-2 max-h-32 overflow-y-auto">
                        {scheduleForm.businessTypes.length === 0 ? (
                          <p className="text-xs text-text-muted p-1">
                            No types selected. Use the sidebar to select business types first.
                          </p>
                        ) : (
                          <div className="flex flex-wrap gap-1">
                            {scheduleForm.businessTypes.map((tId) => (
                              <span
                                key={tId}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-surface text-xs text-text-secondary border border-line"
                              >
                                {tId}
                                <button
                                  onClick={() =>
                                    setScheduleForm((prev) => ({
                                      ...prev,
                                      businessTypes: prev.businessTypes.filter((t) => t !== tId),
                                    }))
                                  }
                                  className="text-text-muted hover:text-danger transition-colors ml-0.5"
                                  aria-label={`Remove ${tId}`}
                                >
                                  x
                                </button>
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-3">
                    <button
                      onClick={() => {
                        setShowScheduleForm(false);
                        setEditingSchedule(null);
                      }}
                      className="px-4 py-2 rounded-lg text-sm text-text-secondary hover:text-text-primary hover:bg-surface-hover transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={saveSchedule}
                      disabled={!scheduleForm.name.trim()}
                      className="px-4 py-2 rounded-lg bg-primary hover:bg-primary-dark text-white text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {editingSchedule ? 'Update Schedule' : 'Create Schedule'}
                    </button>
                  </div>
                </div>
              )}

              {/* Schedules List */}
              {!schedulesLoading && schedules.length === 0 && !showScheduleForm && (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-surface flex items-center justify-center mb-4 border border-line">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-text-muted">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                      <line x1="16" y1="2" x2="16" y2="6" />
                      <line x1="8" y1="2" x2="8" y2="6" />
                      <line x1="3" y1="10" x2="21" y2="10" />
                    </svg>
                  </div>
                  <p className="text-text-muted text-lg mb-2">No schedules configured</p>
                  <p className="text-text-muted text-sm">
                    Create a schedule to automatically search for businesses on a regular basis.
                  </p>
                </div>
              )}

              {!schedulesLoading && schedules.length > 0 && (
                <div className="space-y-3">
                  {schedules.map((schedule) => (
                    <div
                      key={schedule.id}
                      className={`bg-surface rounded-xl border p-5 transition-colors ${
                        schedule.active ? 'border-line hover:border-primary/30' : 'border-line/50 opacity-60'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-2">
                            <h4 className="text-base font-semibold text-text-primary">
                              {schedule.name}
                            </h4>
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs ${
                                schedule.active
                                  ? 'bg-success/10 text-success'
                                  : 'bg-surface-dark text-text-muted'
                              }`}
                            >
                              {schedule.active ? 'Active' : 'Inactive'}
                            </span>
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-surface-dark text-text-secondary border border-line">
                              {schedule.frequency}
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm">
                            <p className="text-text-muted">
                              <span className="text-text-secondary">{schedule.regionNames.length}</span> regions
                              {schedule.regionNames.length > 0 && (
                                <span className="ml-1 text-text-muted">
                                  ({schedule.regionNames.slice(0, 3).join(', ')}
                                  {schedule.regionNames.length > 3 && ` +${schedule.regionNames.length - 3} more`})
                                </span>
                              )}
                            </p>
                            <p className="text-text-muted">
                              <span className="text-text-secondary">{schedule.businessTypes.length}</span> business types
                            </p>
                            <p className="text-text-muted">
                              Max: <span className="text-text-secondary">{schedule.maxPerRegion}</span>/region
                            </p>
                          </div>
                          <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm mt-1">
                            <p className="text-text-muted">
                              Next run:{' '}
                              <span className="text-text-secondary">{formatDate(schedule.nextRun)}</span>
                            </p>
                            {schedule.lastRun && (
                              <p className="text-text-muted">
                                Last run: <span className="text-text-secondary">{formatDate(schedule.lastRun)}</span>
                                {schedule.lastResult && (
                                  <span
                                    className={`ml-1 ${
                                      schedule.lastResult === 'success' ? 'text-success' : 'text-danger'
                                    }`}
                                  >
                                    ({schedule.lastResult})
                                  </span>
                                )}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 flex-shrink-0">
                          {/* Toggle */}
                          <button
                            onClick={() => toggleScheduleActive(schedule)}
                            className={`relative w-9 h-5 rounded-full transition-colors ${
                              schedule.active ? 'bg-primary' : 'bg-surface-dark border border-line'
                            }`}
                            role="switch"
                            aria-checked={schedule.active}
                            aria-label={`Toggle ${schedule.name}`}
                          >
                            <div
                              className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                                schedule.active ? 'translate-x-[18px]' : 'translate-x-0.5'
                              }`}
                            />
                          </button>
                          <button
                            onClick={() => runScheduleNow(schedule.id)}
                            className="px-3 py-1.5 rounded-lg text-xs text-primary-light border border-primary/30 hover:bg-primary/10 transition-colors"
                          >
                            Run Now
                          </button>
                          <button
                            onClick={() => openEditSchedule(schedule)}
                            className="px-3 py-1.5 rounded-lg text-xs text-text-secondary border border-line hover:bg-surface-hover transition-colors"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() =>
                              setConfirmDialog({
                                open: true,
                                title: 'Delete Schedule',
                                message: `Delete "${schedule.name}"? This cannot be undone.`,
                                confirmLabel: 'Delete',
                                onConfirm: () => {
                                  deleteSchedule(schedule.id);
                                  setConfirmDialog((prev) => ({ ...prev, open: false }));
                                },
                              })
                            }
                            className="px-3 py-1.5 rounded-lg text-xs text-danger border border-danger/30 hover:bg-danger/10 transition-colors"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* ── Confirm Dialog ── */}
      <ConfirmDialog
        open={confirmDialog.open}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmLabel={confirmDialog.confirmLabel}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog((prev) => ({ ...prev, open: false }))}
      />
    </div>
  );
}
