import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import {
  Users,
  FileText,
  Calendar,
  AlertCircle,
  Search,
  Plus,
  RefreshCw,
  Eye,
  Edit,
  Trash2,
  Download,
  Filter,
  CheckCircle2,
  Sparkles,
  MapPin,
  Briefcase,
  GraduationCap,
  Clock,
  ArrowUpDown,
  RotateCcw,
  X,
  SlidersHorizontal,
  ChevronDown
} from 'lucide-react';
import api, { getDownloadUrl, downloadResumeFile } from '../api/client';
import CandidateDetailsModal from '../components/CandidateDetailsModal';
import CandidateEditModal from '../components/CandidateEditModal';
import ResumePreviewModal from '../components/ResumePreviewModal';
import Payslips from './Payslips';

export default function Dashboard() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [adminSection, setAdminSection] = useState(searchParams.get('section') === 'payslips' ? 'payslips' : 'candidates');
  const navigate = useNavigate();
  const location = useLocation();

  // Metrics
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);

  // Candidates & Search/Filter
  const [candidates, setCandidates] = useState([]);
  const [candidatesLoading, setCandidatesLoading] = useState(true);
  const [candidatesError, setCandidatesError] = useState(null);
  const [pagination, setPagination] = useState({ current_page: 1, last_page: 1, total: 0, per_page: 15 });

  // Filter States
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [roleFilter, setRoleFilter] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [skillFilter, setSkillFilter] = useState('');
  const [expPreset, setExpPreset] = useState('all');
  const [minExp, setMinExp] = useState('');
  const [maxExp, setMaxExp] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');
  const [showFiltersPanel, setShowFiltersPanel] = useState(false);

  // Modals & Resume Preview
  const [viewCandidateId, setViewCandidateId] = useState(searchParams.get('view') || null);
  const [editCandidateId, setEditCandidateId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [previewResumeCandidate, setPreviewResumeCandidate] = useState(null);
  const [downloadingResumeId, setDownloadingResumeId] = useState(null);

  const handleDownloadResume = async (resumeId, filename) => {
    setDownloadingResumeId(resumeId);
    try {
      await downloadResumeFile(resumeId, filename);
    } catch (err) {
      alert(err.message || 'Failed to download resume file.');
    } finally {
      setDownloadingResumeId(null);
    }
  };

  const fetchStats = async () => {
    try {
      setStatsLoading(true);
      const res = await api.get('/dashboard/stats');
      if (res.data.success) {
        setStats(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load stats:', err);
    } finally {
      setStatsLoading(false);
    }
  };

  const fetchCandidates = async (page = 1, searchOverride = null) => {
    setCandidatesLoading(true);
    setCandidatesError(null);
    try {
      const activeSearch = searchOverride !== null ? searchOverride : search;
      const params = {
        page,
        per_page: 15,
        sort_by: sortBy,
        sort_order: sortOrder,
      };

      if (activeSearch && activeSearch.trim()) params.search = activeSearch.trim();
      if (roleFilter) params.roles = roleFilter;
      if (locationFilter) params.locations = locationFilter;
      if (skillFilter) params.skills = skillFilter;
      if (minExp !== '') params.min_experience = minExp;
      if (maxExp !== '') params.max_experience = maxExp;

      const res = await api.get('/candidates', { params });
      if (res.data.success) {
        setCandidates(res.data.data.data || []);
        setPagination({
          current_page: res.data.data.current_page || 1,
          last_page: res.data.data.last_page || 1,
          total: res.data.data.total ?? (res.data.data.data?.length || 0),
          per_page: res.data.data.per_page || 15,
        });
      } else {
        setCandidatesError(res.data.message || 'Unable to retrieve candidates.');
      }
    } catch (err) {
      console.error('Failed to load candidates:', err);
      setCandidatesError(err.response?.data?.message || 'Failed to load candidates from database.');
    } finally {
      setCandidatesLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    const urlSearch = searchParams.get('search') || '';
    setSearch(urlSearch);
    fetchCandidates(1, urlSearch);
  }, [searchParams, roleFilter, locationFilter, skillFilter, minExp, maxExp, sortBy, sortOrder]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchCandidates(1, search);
  };

  const handleExpPresetChange = (preset) => {
    setExpPreset(preset);
    if (preset === 'all') {
      setMinExp('');
      setMaxExp('');
    } else if (preset === '0-1') {
      setMinExp('0');
      setMaxExp('1');
    } else if (preset === '1-3') {
      setMinExp('1');
      setMaxExp('3');
    } else if (preset === '3-5') {
      setMinExp('3');
      setMaxExp('5');
    } else if (preset === '5-8') {
      setMinExp('5');
      setMaxExp('8');
    } else if (preset === '8+') {
      setMinExp('8');
      setMaxExp('');
    }
  };

  const handleResetFilters = () => {
    setSearch('');
    setRoleFilter('');
    setLocationFilter('');
    setSkillFilter('');
    setExpPreset('all');
    setMinExp('');
    setMaxExp('');
    setSortBy('created_at');
    setSortOrder('desc');
  };

  const hasActiveFilters = Boolean(
    search.trim() || roleFilter || locationFilter || skillFilter || minExp !== '' || maxExp !== '' || sortBy !== 'created_at' || sortOrder !== 'desc'
  );

  const handleDeleteCandidate = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete candidate "${name || 'Profile'}"? This cannot be undone.`)) {
      return;
    }
    setDeletingId(id);
    try {
      const res = await api.delete(`/candidates/${id}`);
      if (res.data.success) {
        fetchCandidates(pagination.current_page);
        fetchStats();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete candidate.');
    } finally {
      setDeletingId(null);
    }
  };

  const [cleaningData, setCleaningData] = useState(false);

  const handleCleanDatabase = async () => {
    const confirmed = window.confirm(
      "WARNING: This will permanently delete ALL candidate records, uploaded resume files, and extracted data so you can start completely fresh.\n\nAre you sure you want to clean up everything and start fresh?"
    );
    if (!confirmed) return;

    try {
      setCleaningData(true);
      const res = await api.post('/dashboard/clean-database');
      if (res.data.success) {
        alert(res.data.message || 'All candidate and resume data cleaned up successfully!');
        setCandidatesError(null);
        fetchStats();
        fetchCandidates(1, '');
      } else {
        alert(res.data.message || 'Failed to clean database.');
      }
    } catch (err) {
      console.error('Clean database failed:', err);
      alert(err.response?.data?.message || 'Failed to clean database. You can also run /clean-database.php directly.');
    } finally {
      setCleaningData(false);
    }
  };

  const totalCandidates = Math.max(
    Number(stats?.overview?.total_candidates) || 0,
    Number(pagination.total) || 0,
    candidates.length || 0
  );
  const totalResumes = stats?.overview?.total_resumes ?? 0;
  const candidatesThisMonth = stats?.overview?.candidates_this_month ?? 0;
  const awaitingReview = stats?.overview?.awaiting_review ?? 0;

  const selectAdminSection = (section) => {
    setAdminSection(section);
    const next = new URLSearchParams(searchParams);
    if (section === 'payslips') next.set('section', 'payslips');
    else next.delete('section');
    setSearchParams(next, { replace: true });
  };

  const adminSectionTabs = (
    <div role="tablist" aria-label="Admin Dashboard sections" style={{ display: 'flex', gap: 8, borderBottom: '1px solid var(--slate-200)', marginBottom: 22 }}>
      {[['candidates', 'Candidate Dashboard'], ['payslips', 'Payslips']].map(([section, label]) => (
        <button key={section} role="tab" aria-selected={adminSection === section} onClick={() => selectAdminSection(section)}
          style={{ border: 0, borderBottom: adminSection === section ? '2px solid var(--primary-600)' : '2px solid transparent', padding: '11px 14px', background: 'transparent', color: adminSection === section ? 'var(--primary-700)' : 'var(--slate-600)', fontWeight: 700, cursor: 'pointer' }}>
          {label}
        </button>
      ))}
    </div>
  );

  if (adminSection === 'payslips') {
    return <div>{adminSectionTabs}<Payslips embedded /></div>;
  }

  return (
    <div>
      {/* Flash Success Message when arriving from resume upload */}
      {location.state?.savedSuccessMessage && (
        <div
          className="alert alert-success"
          style={{
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: '#ecfdf5',
            border: '1px solid #a7f3d0',
            color: '#065f46',
            borderRadius: '8px',
            padding: '12px 18px',
            animation: 'fadeIn 0.3s ease'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <CheckCircle2 size={20} color="#059669" />
            <span style={{ fontSize: '14px', fontWeight: '600' }}>
              {location.state.savedSuccessMessage}
            </span>
          </div>
          <button
            onClick={() => navigate(location.pathname, { replace: true, state: {} })}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: '#059669',
              padding: '4px'
            }}
            title="Dismiss"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {adminSectionTabs}

      {/* Dashboard Top Header */}
      <div className="page-header">
        <div className="page-title">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h1>Admin Dashboard</h1>
            <span
              style={{
                fontSize: '11px',
                fontWeight: '700',
                padding: '2px 8px',
                borderRadius: '12px',
                backgroundColor: totalCandidates === 0 ? '#ecfdf5' : '#eff6ff',
                color: totalCandidates === 0 ? '#059669' : '#1d4ed8',
                border: totalCandidates === 0 ? '1px solid #a7f3d0' : '1px solid #bfdbfe'
              }}
            >
              {totalCandidates === 0 ? 'Fresh Database' : 'Talent Pool Active'}
            </span>
          </div>
          <p>Candidate filtering, resume intelligence, and talent profile management</p>
        </div>

        <div className="page-actions">
          <button
            onClick={() => {
              fetchStats();
              fetchCandidates(pagination.current_page);
            }}
            className="btn btn-secondary"
            title="Refresh Dashboard Data"
          >
            <RefreshCw size={15} />
            <span>Refresh</span>
          </button>

          <button
            onClick={handleCleanDatabase}
            disabled={cleaningData}
            className="btn btn-secondary"
            title="Clean all candidates & resumes to start fresh"
            style={{ color: '#dc2626', borderColor: '#fca5a5', backgroundColor: '#fff5f5' }}
          >
            <Trash2 size={15} />
            <span>{cleaningData ? 'Cleaning...' : 'Start Fresh'}</span>
          </button>

          <button onClick={() => navigate('/upload')} className="btn btn-primary">
            <Plus size={16} />
            <span>Upload Resumes</span>
          </button>
        </div>
      </div>

      {/* Primary KPI Metrics */}
      <div className="stats-grid">
        <div className="stat-card">
          <div>
            <div className="stat-label">Total Candidates</div>
            <div className="stat-value">{statsLoading ? '...' : totalCandidates}</div>
            <div className="stat-sub">Managed candidate profiles</div>
          </div>
          <div className="stat-icon icon-blue">
            <Users size={22} />
          </div>
        </div>

        <div className="stat-card">
          <div>
            <div className="stat-label">Resumes Stored</div>
            <div className="stat-value">{statsLoading ? '...' : totalResumes}</div>
            <div className="stat-sub">Uploaded PDF & DOCX files</div>
          </div>
          <div className="stat-icon icon-indigo">
            <FileText size={22} />
          </div>
        </div>

        <div className="stat-card">
          <div>
            <div className="stat-label">Added This Month</div>
            <div className="stat-value">{statsLoading ? '...' : candidatesThisMonth}</div>
            <div className="stat-sub">Fresh candidate additions</div>
          </div>
          <div className="stat-icon icon-emerald">
            <Calendar size={22} />
          </div>
        </div>

        <div className="stat-card">
          <div>
            <div className="stat-label">Awaiting Review</div>
            <div className="stat-value" style={{ color: awaitingReview > 0 ? '#b45309' : 'inherit' }}>
              {statsLoading ? '...' : awaitingReview}
            </div>
            <div className="stat-sub">Profiles pending verification</div>
          </div>
          <div className="stat-icon icon-amber">
            <AlertCircle size={22} />
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {candidates.length === 0 && pagination.total === 0 && !candidatesLoading && !hasActiveFilters && !candidatesError ? (
        /* Fresh Zero State */
        <div
          className="card-panel"
          style={{
            padding: '48px 32px',
            textAlign: 'center',
            backgroundColor: '#ffffff',
            border: '1px dashed var(--slate-300)',
            borderRadius: '12px'
          }}
        >
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              backgroundColor: '#eff6ff',
              color: '#2563eb',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px auto'
            }}
          >
            <Sparkles size={32} />
          </div>

          <h2 style={{ fontSize: '20px', fontWeight: '700', color: 'var(--slate-800)', marginBottom: '8px' }}>
            Your Talent Database is Clean & Ready
          </h2>
          <p style={{ color: 'var(--slate-500)', fontSize: '14px', maxWidth: '600px', margin: '0 auto 24px auto', lineHeight: '1.6' }}>
            No dummy candidate records exist. Upload your resumes to automatically parse and extract candidate profiles strictly containing: 
            <strong> Full Name, Email, Mobile Number, Location, Role, Experience, Education,</strong> and <strong>Key Skills</strong>.
            Any missing information is left blank to ensure complete accuracy.
          </p>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
            <button onClick={() => navigate('/upload')} className="btn btn-primary" style={{ padding: '10px 24px' }}>
              <Plus size={16} />
              <span>Upload Your First Resume</span>
            </button>
          </div>
        </div>
      ) : (
        /* Candidates Filter & Table */
        <div className="card-panel">
          {/* Main Search & Quick Controls Toolbar */}
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--slate-200)', backgroundColor: '#ffffff' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: '700', margin: 0, color: 'var(--slate-900)' }}>
                  Candidate Directory
                </h3>
                <p style={{ fontSize: '12.5px', color: 'var(--slate-500)', margin: '2px 0 0 0' }}>
                  Showing {candidates.length} of {pagination.total} candidate records
                </p>
              </div>

              {/* Search Bar + Filter Toggle */}
              <form onSubmit={handleSearchSubmit} style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', flex: '1 1 auto', justifyContent: 'flex-end' }}>
                <div style={{ position: 'relative', width: '100%', maxWidth: '320px' }}>
                  <Search size={15} style={{ position: 'absolute', left: '10px', top: '11px', color: 'var(--slate-400)' }} />
                  <input
                    type="text"
                    placeholder="Search name, email, phone, role, skill..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 30px 8px 32px',
                      fontSize: '13px',
                      borderRadius: '6px',
                      border: '1px solid var(--slate-300)',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                  {search && (
                    <button
                      type="button"
                      onClick={() => {
                        setSearch('');
                        fetchCandidates(1);
                      }}
                      style={{
                        position: 'absolute',
                        right: '8px',
                        top: '10px',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: 'var(--slate-400)',
                        padding: 0
                      }}
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>

                <button type="submit" className="btn btn-primary btn-sm" style={{ padding: '8px 14px' }}>
                  Search
                </button>

                <button
                  type="button"
                  onClick={() => setShowFiltersPanel(!showFiltersPanel)}
                  className={`btn btn-sm ${showFiltersPanel || hasActiveFilters ? 'btn-outline-primary' : 'btn-secondary'}`}
                  style={{ padding: '8px 14px', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <SlidersHorizontal size={14} />
                  <span>Filters</span>
                  {hasActiveFilters && (
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#2563eb' }} />
                  )}
                </button>

                {hasActiveFilters && (
                  <button
                    type="button"
                    onClick={handleResetFilters}
                    className="btn btn-secondary btn-sm"
                    style={{ padding: '8px 12px' }}
                    title="Reset All Filters"
                  >
                    <RotateCcw size={14} />
                    <span>Reset</span>
                  </button>
                )}
              </form>
            </div>

            {/* Expandable Advanced Filter Panel */}
            {showFiltersPanel && (
              <div
                style={{
                  marginTop: '16px',
                  padding: '16px',
                  backgroundColor: 'var(--slate-50)',
                  borderRadius: '8px',
                  border: '1px solid var(--slate-200)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px'
                }}
              >
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                  {/* 1. Role Filter */}
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--slate-700)', marginBottom: '4px' }}>
                      Designated Role
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Full Stack, PHP, React..."
                      value={roleFilter}
                      onChange={(e) => setRoleFilter(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '6px 10px',
                        fontSize: '13px',
                        borderRadius: '6px',
                        border: '1px solid var(--slate-300)',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>

                  {/* 2. Location Filter */}
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--slate-700)', marginBottom: '4px' }}>
                      Location
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Chennai, Bangalore, Hyderabad..."
                      value={locationFilter}
                      onChange={(e) => setLocationFilter(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '6px 10px',
                        fontSize: '13px',
                        borderRadius: '6px',
                        border: '1px solid var(--slate-300)',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>

                  {/* 3. Key Skills Filter */}
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--slate-700)', marginBottom: '4px' }}>
                      Key Skills
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. React, Laravel, Python..."
                      value={skillFilter}
                      onChange={(e) => setSkillFilter(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '6px 10px',
                        fontSize: '13px',
                        borderRadius: '6px',
                        border: '1px solid var(--slate-300)',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>

                  {/* 4. Experience Range */}
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--slate-700)', marginBottom: '4px' }}>
                      Experience Range (Years)
                    </label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <input
                        type="number"
                        placeholder="Min"
                        min="0"
                        step="0.5"
                        value={minExp}
                        onChange={(e) => {
                          setMinExp(e.target.value);
                          setExpPreset('custom');
                        }}
                        style={{
                          width: '50%',
                          padding: '6px 8px',
                          fontSize: '13px',
                          borderRadius: '6px',
                          border: '1px solid var(--slate-300)'
                        }}
                      />
                      <span style={{ color: 'var(--slate-400)', fontSize: '12px' }}>to</span>
                      <input
                        type="number"
                        placeholder="Max"
                        min="0"
                        step="0.5"
                        value={maxExp}
                        onChange={(e) => {
                          setMaxExp(e.target.value);
                          setExpPreset('custom');
                        }}
                        style={{
                          width: '50%',
                          padding: '6px 8px',
                          fontSize: '13px',
                          borderRadius: '6px',
                          border: '1px solid var(--slate-300)'
                        }}
                      />
                    </div>
                  </div>

                  {/* 5. Sort By */}
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--slate-700)', marginBottom: '4px' }}>
                      Sort Order
                    </label>
                    <select
                      value={`${sortBy}_${sortOrder}`}
                      onChange={(e) => {
                        const [f, o] = e.target.value.split('_');
                        setSortBy(f);
                        setSortOrder(o);
                      }}
                      style={{
                        width: '100%',
                        padding: '6px 10px',
                        fontSize: '13px',
                        borderRadius: '6px',
                        border: '1px solid var(--slate-300)',
                        backgroundColor: '#ffffff'
                      }}
                    >
                      <option value="created_at_desc">Newest First</option>
                      <option value="created_at_asc">Oldest First</option>
                      <option value="total_experience_years_desc">Experience: High to Low</option>
                      <option value="total_experience_years_asc">Experience: Low to High</option>
                      <option value="full_name_asc">Name: A to Z</option>
                    </select>
                  </div>
                </div>

                {/* Experience Quick Presets */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', paddingTop: '6px' }}>
                  <span style={{ fontSize: '12px', color: 'var(--slate-500)', fontWeight: '600' }}>Quick Experience:</span>
                  {[
                    { id: 'all', label: 'All' },
                    { id: '0-1', label: '0-1 Yr (Entry)' },
                    { id: '1-3', label: '1-3 Yrs' },
                    { id: '3-5', label: '3-5 Yrs' },
                    { id: '5-8', label: '5-8 Yrs' },
                    { id: '8+', label: '8+ Yrs' }
                  ].map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => handleExpPresetChange(p.id)}
                      style={{
                        padding: '3px 10px',
                        fontSize: '12px',
                        borderRadius: '12px',
                        border: expPreset === p.id ? '1px solid #2563eb' : '1px solid var(--slate-300)',
                        backgroundColor: expPreset === p.id ? '#eff6ff' : '#ffffff',
                        color: expPreset === p.id ? '#1d4ed8' : 'var(--slate-700)',
                        fontWeight: expPreset === p.id ? '600' : '400',
                        cursor: 'pointer'
                      }}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Active Filter Badges */}
            {hasActiveFilters && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginTop: '12px' }}>
                <span style={{ fontSize: '12px', color: 'var(--slate-500)', fontWeight: '600' }}>Active Filters:</span>
                {search.trim() && (
                  <span className="badge badge-info" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '12px' }}>
                    Search: "{search}"
                    <X size={12} style={{ cursor: 'pointer' }} onClick={() => setSearch('')} />
                  </span>
                )}
                {roleFilter && (
                  <span className="badge badge-info" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '12px' }}>
                    Role: {roleFilter}
                    <X size={12} style={{ cursor: 'pointer' }} onClick={() => setRoleFilter('')} />
                  </span>
                )}
                {locationFilter && (
                  <span className="badge badge-info" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '12px' }}>
                    Location: {locationFilter}
                    <X size={12} style={{ cursor: 'pointer' }} onClick={() => setLocationFilter('')} />
                  </span>
                )}
                {skillFilter && (
                  <span className="badge badge-info" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '12px' }}>
                    Skill: {skillFilter}
                    <X size={12} style={{ cursor: 'pointer' }} onClick={() => setSkillFilter('')} />
                  </span>
                )}
                {(minExp !== '' || maxExp !== '') && (
                  <span className="badge badge-info" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '12px' }}>
                    Exp: {minExp || '0'} - {maxExp || '30+'} Yrs
                    <X
                      size={12}
                      style={{ cursor: 'pointer' }}
                      onClick={() => {
                        setMinExp('');
                        setMaxExp('');
                        setExpPreset('all');
                      }}
                    />
                  </span>
                )}
                <button
                  onClick={handleResetFilters}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#dc2626',
                    fontSize: '12px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    padding: '2px 6px'
                  }}
                >
                  Clear All
                </button>
              </div>
            )}
          </div>

          {/* Table */}
          <div className="table-responsive">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Full Name</th>
                  <th>Role</th>
                  <th>Experience</th>
                  <th>Location</th>
                  <th>Education</th>
                  <th>Key Skills</th>
                  <th>Resume</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {candidatesLoading ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', padding: '40px', color: 'var(--slate-500)' }}>
                      Loading candidates from database...
                    </td>
                  </tr>
                ) : candidatesError ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', padding: '40px', color: '#dc2626' }}>
                      <div style={{ marginBottom: '8px', fontWeight: '600' }}>
                        {candidatesError}
                      </div>
                      <button onClick={() => fetchCandidates(pagination.current_page)} className="btn btn-secondary btn-sm">
                        Retry Loading Candidates
                      </button>
                    </td>
                  </tr>
                ) : candidates.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', padding: '40px', color: 'var(--slate-500)' }}>
                      <div style={{ marginBottom: '8px', fontWeight: '600', color: 'var(--slate-700)' }}>
                        No matching candidate records found.
                      </div>
                      {hasActiveFilters && (
                        <button onClick={handleResetFilters} className="btn btn-secondary btn-sm">
                          Clear active filters
                        </button>
                      )}
                    </td>
                  </tr>
                ) : (
                  candidates.map((candidate) => (
                    <tr
                      key={candidate.id}
                      style={
                        location.state?.highlightCandidateId === candidate.id
                          ? { backgroundColor: '#f0fdf4', transition: 'background-color 0.5s ease' }
                          : undefined
                      }
                    >
                      {/* 1. Full Name + Contact */}
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div className="user-avatar" style={{ width: '32px', height: '32px', fontSize: '12px' }}>
                            {candidate.full_name?.charAt(0) || 'C'}
                          </div>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span
                                style={{ fontWeight: '600', color: '#1e3a8a', cursor: 'pointer' }}
                                onClick={() => setViewCandidateId(candidate.id)}
                              >
                                {candidate.full_name || '—'}
                              </span>
                              {location.state?.highlightCandidateId === candidate.id && (
                                <span
                                  style={{
                                    fontSize: '10.5px',
                                    fontWeight: '700',
                                    padding: '1px 6px',
                                    borderRadius: '4px',
                                    backgroundColor: '#dcfce7',
                                    color: '#15803d',
                                    border: '1px solid #bbf7d0'
                                  }}
                                >
                                  Just Added
                                </span>
                              )}
                            </div>
                            <div style={{ fontSize: '12px', color: 'var(--slate-500)' }}>
                              {candidate.email || '—'}
                              {candidate.phone ? ` • ${candidate.phone}` : ''}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* 2. Role */}
                      <td>
                        <span style={{ fontWeight: '600', color: 'var(--slate-800)' }}>
                          {candidate.primary_role || candidate.current_title || '—'}
                        </span>
                      </td>

                      {/* 3. Experience */}
                      <td>
                        <span style={{ fontWeight: '600' }}>
                          {candidate.total_experience_years !== null && candidate.total_experience_years !== undefined
                            ? `${candidate.total_experience_years} Yrs`
                            : '—'}
                        </span>
                      </td>

                      {/* 4. Location */}
                      <td>
                        <span style={{ fontSize: '13px', color: 'var(--slate-700)' }}>
                          {candidate.current_location || candidate.city || '—'}
                        </span>
                      </td>

                      {/* 5. Education */}
                      <td>
                        <span style={{ fontSize: '12.5px', color: 'var(--slate-700)', fontWeight: '500' }}>
                          {candidate.highest_qualification || candidate.degree || candidate.education?.[0]?.degree || '—'}
                        </span>
                      </td>

                      {/* 6. Key Skills */}
                      <td style={{ maxWidth: '200px' }}>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3px' }}>
                          {candidate.skills?.slice(0, 3).map((s, idx) => (
                            <span key={idx} className="skill-tag" style={{ margin: 0 }}>
                              {s.skill_name}
                            </span>
                          ))}
                          {candidate.skills?.length > 3 && (
                            <span style={{ fontSize: '11px', color: 'var(--slate-500)', alignSelf: 'center' }}>
                              +{candidate.skills.length - 3}
                            </span>
                          )}
                          {(!candidate.skills || candidate.skills.length === 0) && (
                            <span style={{ color: 'var(--slate-400)', fontSize: '12px' }}>—</span>
                          )}
                        </div>
                      </td>

                      {/* 7. Resume View & Download */}
                      <td>
                        {(() => {
                          const resumeObj = candidate.latest_resume || (Array.isArray(candidate.resumes) && candidate.resumes.length > 0 ? candidate.resumes[0] : null);
                          return resumeObj ? (
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                              <button
                                onClick={() => setPreviewResumeCandidate({ ...candidate, latest_resume: resumeObj })}
                                title={`Display / View: ${resumeObj.original_filename || 'Resume'}`}
                                className="btn btn-icon btn-secondary btn-sm"
                                style={{ color: '#2563eb' }}
                              >
                                <Eye size={14} />
                              </button>

                              <button
                                onClick={() =>
                                  handleDownloadResume(
                                    resumeObj.id,
                                    resumeObj.original_filename
                                  )
                                }
                                disabled={downloadingResumeId === resumeObj.id}
                                title={`Download: ${resumeObj.original_filename || 'Resume'}`}
                                className="btn btn-icon btn-secondary btn-sm"
                                style={{ color: '#059669' }}
                              >
                                {downloadingResumeId === resumeObj.id ? (
                                  <RefreshCw size={13} className="spin-animation" />
                                ) : (
                                  <Download size={14} />
                                )}
                              </button>
                            </div>
                          ) : (
                            <span style={{ color: 'var(--slate-400)', fontSize: '12px' }}>—</span>
                          );
                        })()}
                      </td>

                      {/* 8. Actions */}
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '4px' }}>
                          <button
                            onClick={() => setViewCandidateId(candidate.id)}
                            className="btn btn-icon btn-secondary btn-sm"
                            title="View Full Profile"
                          >
                            <Eye size={14} />
                          </button>
                          <button
                            onClick={() => setEditCandidateId(candidate.id)}
                            className="btn btn-icon btn-secondary btn-sm"
                            title="Edit Candidate"
                          >
                            <Edit size={14} />
                          </button>
                          <button
                            onClick={() => handleDeleteCandidate(candidate.id, candidate.full_name)}
                            disabled={deletingId === candidate.id}
                            className="btn btn-icon btn-secondary btn-sm"
                            style={{ color: '#dc2626' }}
                            title="Delete Candidate"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.last_page > 1 && (
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '12px 16px',
                borderTop: '1px solid var(--slate-200)',
                fontSize: '13px'
              }}
            >
              <span style={{ color: 'var(--slate-500)' }}>
                Page {pagination.current_page} of {pagination.last_page} ({pagination.total} total)
              </span>

              <div style={{ display: 'flex', gap: '6px' }}>
                <button
                  disabled={pagination.current_page <= 1}
                  onClick={() => fetchCandidates(pagination.current_page - 1)}
                  className="btn btn-secondary btn-sm"
                >
                  Previous
                </button>
                <button
                  disabled={pagination.current_page >= pagination.last_page}
                  onClick={() => fetchCandidates(pagination.current_page + 1)}
                  className="btn btn-secondary btn-sm"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Candidate Modals */}
      {viewCandidateId && (
        <CandidateDetailsModal
          candidateId={viewCandidateId}
          onClose={() => setViewCandidateId(null)}
          onEdit={(id) => {
            setViewCandidateId(null);
            setEditCandidateId(id);
          }}
          onUpdated={() => {
            fetchCandidates(pagination.current_page);
            fetchStats();
          }}
        />
      )}

      {editCandidateId && (
        <CandidateEditModal
          candidateId={editCandidateId}
          onClose={() => setEditCandidateId(null)}
          onSaved={() => {
            fetchCandidates(pagination.current_page);
            fetchStats();
          }}
        />
      )}

      {/* Resume Document Display / Preview Modal */}
      {previewResumeCandidate?.latest_resume && (
        <ResumePreviewModal
          resumeId={previewResumeCandidate.latest_resume.id}
          candidate={previewResumeCandidate}
          initialResume={previewResumeCandidate.latest_resume}
          onClose={() => setPreviewResumeCandidate(null)}
        />
      )}
    </div>
  );
}
