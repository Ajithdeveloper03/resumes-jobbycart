import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Search,
  Filter,
  Download,
  Trash2,
  Eye,
  Edit,
  CheckCircle2,
  FileText,
  X,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  RotateCcw,
  SlidersHorizontal,
  Plus,
  RefreshCw
} from 'lucide-react';
import api, { getDownloadUrl, downloadResumeFile } from '../api/client';
import CandidateDetailsModal from '../components/CandidateDetailsModal';
import CandidateEditModal from '../components/CandidateEditModal';
import ResumePreviewModal from '../components/ResumePreviewModal';

export default function Candidates() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [candidates, setCandidates] = useState([]);
  const [pagination, setPagination] = useState({ current_page: 1, last_page: 1, total: 0, per_page: 15 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modals & Resume Preview
  const [viewCandidateId, setViewCandidateId] = useState(searchParams.get('view') || null);
  const [editCandidateId, setEditCandidateId] = useState(null);
  const [previewResumeCandidate, setPreviewResumeCandidate] = useState(null);
  const [downloadingResumeId, setDownloadingResumeId] = useState(null);

  // Filter States
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [role, setRole] = useState(searchParams.get('role') || '');
  const [minExp, setMinExp] = useState(searchParams.get('min_exp') || '');
  const [maxExp, setMaxExp] = useState(searchParams.get('max_exp') || '');
  const [location, setLocation] = useState(searchParams.get('location') || '');
  const [skills, setSkills] = useState(searchParams.get('skills') || '');
  const [skillOperator, setSkillOperator] = useState(searchParams.get('skill_operator') || 'AND');
  const [qualification, setQualification] = useState(searchParams.get('qualification') || '');
  const [company, setCompany] = useState(searchParams.get('company') || '');
  const [maxNoticeDays, setMaxNoticeDays] = useState(searchParams.get('notice') || '');
  const [status, setStatus] = useState(searchParams.get('status') || '');
  const [hasResume, setHasResume] = useState(searchParams.get('has_resume') || '');

  // Sorting
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');

  // Bulk Selection
  const [selectedIds, setSelectedIds] = useState([]);
  const [bulkStatus, setBulkStatus] = useState('shortlisted');
  const [bulkUpdating, setBulkUpdating] = useState(false);

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

  const fetchCandidates = async (page = 1) => {
    setLoading(true);
    try {
      const params = {
        page,
        per_page: 15,
        sort_by: sortBy,
        sort_order: sortOrder,
      };

      if (search.trim()) params.search = search.trim();
      if (role) params.roles = role;
      if (minExp) params.min_experience = minExp;
      if (maxExp) params.max_experience = maxExp;
      if (location) params.locations = location;
      if (skills.trim()) {
        params.skills = skills.trim();
        params.skill_operator = skillOperator;
      }
      if (qualification) params.qualification = qualification;
      if (company) params.company = company;
      if (maxNoticeDays) params.max_notice_days = maxNoticeDays;
      if (status) params.statuses = status;
      if (hasResume) params.has_resume = hasResume;

      const res = await api.get('/candidates', { params });
      if (res.data.success) {
        setCandidates(res.data.data.data);
        setPagination({
          current_page: res.data.data.current_page,
          last_page: res.data.data.last_page,
          total: res.data.data.total,
          per_page: res.data.data.per_page,
        });
      }
    } catch (err) {
      setError('Failed to fetch candidate records from server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCandidates(1);
  }, [role, minExp, maxExp, location, qualification, company, maxNoticeDays, status, hasResume, sortBy, sortOrder]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchCandidates(1);
  };

  const handleClearFilters = () => {
    setSearch('');
    setRole('');
    setMinExp('');
    setMaxExp('');
    setLocation('');
    setSkills('');
    setSkillOperator('AND');
    setQualification('');
    setCompany('');
    setMaxNoticeDays('');
    setStatus('');
    setHasResume('');
    setSearchParams({});
    fetchCandidates(1);
  };

  // Bulk Selection Handlers
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(candidates.map((c) => c.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleBulkStatusUpdate = async () => {
    if (selectedIds.length === 0) return;
    setBulkUpdating(true);
    try {
      const res = await api.post('/candidates/bulk-status', {
        candidate_ids: selectedIds,
        status: bulkStatus,
      });
      if (res.data.success) {
        setSelectedIds([]);
        fetchCandidates(pagination.current_page);
      }
    } catch (e) {
      alert('Bulk status update failed.');
    } finally {
      setBulkUpdating(false);
    }
  };

  const handleDelete = async (candidate) => {
    if (window.confirm(`Are you sure you want to delete ${candidate.full_name}?`)) {
      try {
        const res = await api.delete(`/candidates/${candidate.id}`);
        if (res.data.success) {
          fetchCandidates(pagination.current_page);
        }
      } catch (e) {
        alert('Failed to delete candidate.');
      }
    }
  };

  const handleExportCsv = () => {
    const params = new URLSearchParams();
    if (search.trim()) params.append('search', search.trim());
    if (role) params.append('roles', role);
    if (minExp) params.append('min_experience', minExp);
    if (maxExp) params.append('max_experience', maxExp);
    if (location) params.append('locations', location);
    if (skills.trim()) {
      params.append('skills', skills.trim());
      params.append('skill_operator', skillOperator);
    }
    if (qualification) params.append('qualification', qualification);
    if (company) params.append('company', company);
    if (maxNoticeDays) params.append('max_notice_days', maxNoticeDays);
    if (status) params.append('statuses', status);

    window.open(getDownloadUrl(`candidates/export?${params.toString()}`), '_blank');
  };

  // Active filter count
  const activeFilters = [];
  if (search) activeFilters.push({ label: `Search: ${search}`, remove: () => setSearch('') });
  if (role) activeFilters.push({ label: `Role: ${role}`, remove: () => setRole('') });
  if (minExp || maxExp) activeFilters.push({ label: `Exp: ${minExp || 0} - ${maxExp || '30+'} yrs`, remove: () => { setMinExp(''); setMaxExp(''); } });
  if (location) activeFilters.push({ label: `City: ${location}`, remove: () => setLocation('') });
  if (skills) activeFilters.push({ label: `Skills (${skillOperator}): ${skills}`, remove: () => setSkills('') });
  if (qualification) activeFilters.push({ label: `Degree: ${qualification}`, remove: () => setQualification('') });
  if (company) activeFilters.push({ label: `Company: ${company}`, remove: () => setCompany('') });
  if (maxNoticeDays) activeFilters.push({ label: `Max Notice: ${maxNoticeDays}d`, remove: () => setMaxNoticeDays('') });
  if (status) activeFilters.push({ label: `Status: ${status}`, remove: () => setStatus('') });
  if (hasResume) activeFilters.push({ label: hasResume === 'true' ? 'With Resume' : 'Without Resume', remove: () => setHasResume('') });

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div className="page-title">
          <h1>Candidates Management</h1>
          <p>
            Showing <strong>{pagination.total}</strong> candidate records matching active criteria
          </p>
        </div>
        <div className="page-actions">
          <button onClick={handleExportCsv} className="btn btn-secondary btn-sm">
            <Download size={15} />
            <span>Export CSV</span>
          </button>
          <button onClick={() => navigate('/upload')} className="btn btn-primary btn-sm">
            <Plus size={15} />
            <span>Add Candidate</span>
          </button>
        </div>
      </div>

      {/* Primary & Advanced Filters Toolbar */}
      <div className="filters-toolbar">
        <form onSubmit={handleSearchSubmit} className="filter-row">
          {/* Quick Search */}
          <div style={{ flex: '1 1 240px', position: 'relative' }}>
            <Search size={16} className="search-icon" />
            <input
              type="text"
              placeholder="Search by candidate name, email, phone, company..."
              className="topbar-search-input"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Role Filter */}
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="filter-select"
            style={{ flex: '0 1 180px' }}
          >
            <option value="">All Job Roles</option>
            <option value="Laravel Developer">Laravel Developer</option>
            <option value="React Developer">React Developer</option>
            <option value="PHP Developer">PHP Developer</option>
            <option value="Full Stack Developer">Full Stack Developer</option>
            <option value="DevOps Engineer">DevOps Engineer</option>
            <option value="UI/UX Designer">UI/UX Designer</option>
            <option value="QA Engineer">QA Engineer</option>
          </select>

          {/* Location Filter */}
          <select
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="filter-select"
            style={{ flex: '0 1 150px' }}
          >
            <option value="">All Locations</option>
            <option value="Chennai">Chennai</option>
            <option value="Coimbatore">Coimbatore</option>
            <option value="Bangalore">Bangalore</option>
            <option value="Hyderabad">Hyderabad</option>
            <option value="Pune">Pune</option>
            <option value="Mumbai">Mumbai</option>
          </select>

          {/* Status Filter */}
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="filter-select"
            style={{ flex: '0 1 140px' }}
          >
            <option value="">All Statuses</option>
            <option value="new">New</option>
            <option value="screening">Screening</option>
            <option value="shortlisted">Shortlisted</option>
            <option value="interviewing">Interviewing</option>
            <option value="offered">Offered</option>
            <option value="hired">Hired</option>
            <option value="rejected">Rejected</option>
          </select>

          <button
            type="button"
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            className={`btn ${showAdvancedFilters ? 'btn-primary' : 'btn-secondary'} btn-sm`}
          >
            <SlidersHorizontal size={15} />
            <span>More Filters</span>
          </button>

          <button type="submit" className="btn btn-primary btn-sm">
            <span>Filter</span>
          </button>
        </form>

        {/* Advanced Filters Expandable Drawer */}
        {showAdvancedFilters && (
          <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--slate-200)' }}>
            <div className="form-grid-3">
              {/* Skills with AND/OR logic */}
              <div>
                <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Required Skills (comma separated)</span>
                  <span style={{ fontSize: '11px', color: '#2563eb', cursor: 'pointer' }} onClick={() => setSkillOperator(skillOperator === 'AND' ? 'OR' : 'AND')}>
                    Matching: <strong>{skillOperator}</strong> (Click to toggle)
                  </span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Laravel, MySQL, Redis"
                  className="filter-input"
                  style={{ width: '100%' }}
                  value={skills}
                  onChange={(e) => setSkills(e.target.value)}
                />
              </div>

              {/* Min & Max Experience */}
              <div>
                <label className="form-label">Total Experience (Years)</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="number"
                    step="0.5"
                    placeholder="Min yrs"
                    className="filter-input"
                    style={{ width: '50%' }}
                    value={minExp}
                    onChange={(e) => setMinExp(e.target.value)}
                  />
                  <input
                    type="number"
                    step="0.5"
                    placeholder="Max yrs"
                    className="filter-input"
                    style={{ width: '50%' }}
                    value={maxExp}
                    onChange={(e) => setMaxExp(e.target.value)}
                  />
                </div>
              </div>

              {/* Max Notice Period */}
              <div>
                <label className="form-label">Availability / Notice Period</label>
                <select
                  value={maxNoticeDays}
                  onChange={(e) => setMaxNoticeDays(e.target.value)}
                  className="filter-select"
                  style={{ width: '100%' }}
                >
                  <option value="">Any Notice Period</option>
                  <option value="0">Immediate Joiners Only (0 days)</option>
                  <option value="15">Max 15 Days Notice</option>
                  <option value="30">Max 30 Days Notice (1 month)</option>
                  <option value="60">Max 60 Days Notice (2 months)</option>
                  <option value="90">Max 90 Days Notice</option>
                </select>
              </div>

              {/* Qualification / Degree */}
              <div>
                <label className="form-label">Degree / Qualification</label>
                <input
                  type="text"
                  placeholder="e.g. B.Tech, MCA, B.E."
                  className="filter-input"
                  style={{ width: '100%' }}
                  value={qualification}
                  onChange={(e) => setQualification(e.target.value)}
                />
              </div>

              {/* Current Company */}
              <div>
                <label className="form-label">Current / Previous Company</label>
                <input
                  type="text"
                  placeholder="e.g. Infotech, Technologies"
                  className="filter-input"
                  style={{ width: '100%' }}
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                />
              </div>

              {/* Resume Attached */}
              <div>
                <label className="form-label">Resume Attachment</label>
                <select
                  value={hasResume}
                  onChange={(e) => setHasResume(e.target.value)}
                  className="filter-select"
                  style={{ width: '100%' }}
                >
                  <option value="">All Candidates</option>
                  <option value="true">Resume Attached Only</option>
                  <option value="false">Missing Resume Only</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Active Filter Chips */}
        {activeFilters.length > 0 && (
          <div className="filter-chips-container">
            <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--slate-500)' }}>
              Applied Filters:
            </span>
            {activeFilters.map((af, idx) => (
              <span key={idx} className="filter-chip">
                <span>{af.label}</span>
                <span className="filter-chip-remove" onClick={af.remove}>×</span>
              </span>
            ))}
            <button
              onClick={handleClearFilters}
              className="btn btn-secondary btn-sm"
              style={{ padding: '2px 8px', fontSize: '11px', height: '24px' }}
            >
              <RotateCcw size={12} />
              <span>Clear All</span>
            </button>
          </div>
        )}
      </div>

      {/* Bulk Action Strip */}
      {selectedIds.length > 0 && (
        <div style={{
          backgroundColor: '#eff6ff',
          border: '1px solid #bfdbfe',
          borderRadius: '8px',
          padding: '12px 18px',
          marginBottom: '16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ fontSize: '13.5px', color: '#1e40af', fontWeight: '600' }}>
            {selectedIds.length} candidate{selectedIds.length > 1 ? 's' : ''} selected
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '13px', color: '#1e40af' }}>Update Status to:</span>
            <select
              value={bulkStatus}
              onChange={(e) => setBulkStatus(e.target.value)}
              className="filter-select"
              style={{ height: '32px', fontSize: '12.5px' }}
            >
              <option value="new">New</option>
              <option value="screening">Screening</option>
              <option value="shortlisted">Shortlisted</option>
              <option value="interviewing">Interviewing</option>
              <option value="offered">Offered</option>
              <option value="hired">Hired</option>
              <option value="rejected">Rejected</option>
            </select>
            <button
              onClick={handleBulkStatusUpdate}
              disabled={bulkUpdating}
              className="btn btn-primary btn-sm"
            >
              {bulkUpdating ? 'Applying...' : 'Apply Status'}
            </button>
            <button
              onClick={() => setSelectedIds([])}
              className="btn btn-secondary btn-sm"
            >
              Deselect All
            </button>
          </div>
        </div>
      )}

      {/* Candidates Table */}
      <div className="card-panel">
        <div className="table-responsive">
          <table className="custom-table">
            <thead>
              <tr>
                <th style={{ width: '40px' }}>
                  <input
                    type="checkbox"
                    checked={candidates.length > 0 && selectedIds.length === candidates.length}
                    onChange={handleSelectAll}
                  />
                </th>
                <th>Candidate</th>
                <th>Role</th>
                <th>Experience</th>
                <th>Location</th>
                <th>Education</th>
                <th>Key Skills</th>
                <th>Resume</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={10} style={{ textAlign: 'center', padding: '50px', color: 'var(--slate-500)' }}>
                    Loading matching candidates from MySQL database...
                  </td>
                </tr>
              ) : candidates.length === 0 ? (
                <tr>
                  <td colSpan={10} style={{ textAlign: 'center', padding: '60px', color: 'var(--slate-500)' }}>
                    <div style={{ fontSize: '16px', fontWeight: '600', marginBottom: '6px' }}>No candidates found</div>
                    <p style={{ fontSize: '13px' }}>Try adjusting your search criteria or clear the filters.</p>
                    <button onClick={handleClearFilters} className="btn btn-secondary btn-sm" style={{ marginTop: '12px' }}>
                      Reset Filters
                    </button>
                  </td>
                </tr>
              ) : (
                candidates.map((candidate) => (
                  <tr key={candidate.id}>
                    <td>
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(candidate.id)}
                        onChange={() => handleSelectOne(candidate.id)}
                      />
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div className="user-avatar" style={{ width: '34px', height: '34px', fontSize: '13px' }}>
                          {candidate.full_name?.charAt(0) || 'C'}
                        </div>
                        <div>
                          <div
                            style={{ fontWeight: '600', color: '#1e3a8a', cursor: 'pointer' }}
                            onClick={() => setViewCandidateId(candidate.id)}
                          >
                            {candidate.full_name}
                          </div>
                          <div style={{ fontSize: '12px', color: 'var(--slate-500)' }}>
                            {candidate.email || 'No email'}
                            {candidate.phone && ` • ${candidate.phone}`}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span style={{ fontWeight: '600', color: 'var(--slate-800)' }}>
                        {candidate.primary_role || '—'}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontWeight: '600' }}>
                        {candidate.total_experience_years !== null && candidate.total_experience_years !== undefined ? `${candidate.total_experience_years} Yrs` : '—'}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontSize: '13px', color: 'var(--slate-700)' }}>
                        {candidate.current_location || candidate.city || '—'}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontSize: '12.5px', color: 'var(--slate-700)', fontWeight: '500' }}>
                        {candidate.highest_qualification || candidate.degree || candidate.education?.[0]?.degree || '—'}
                      </span>
                    </td>
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
                      </div>
                    </td>
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
                              <Eye size={15} />
                            </button>

                            <button
                              onClick={() => handleDownloadResume(resumeObj.id, resumeObj.original_filename)}
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
                          <span style={{ color: 'var(--slate-400)', fontSize: '12px' }}>None</span>
                        );
                      })()}
                    </td>
                    <td>
                      <span className={`badge badge-${candidate.candidate_status}`}>
                        {candidate.candidate_status}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '4px' }}>
                        <button
                          onClick={() => setViewCandidateId(candidate.id)}
                          className="btn btn-icon btn-secondary btn-sm"
                          title="View Profile Details"
                        >
                          <Eye size={15} />
                        </button>
                        <button
                          onClick={() => setEditCandidateId(candidate.id)}
                          className="btn btn-icon btn-secondary btn-sm"
                          title="Edit Profile"
                        >
                          <Edit size={15} />
                        </button>
                        <button
                          onClick={() => handleDelete(candidate)}
                          className="btn btn-icon btn-secondary btn-sm"
                          style={{ color: '#e11d48' }}
                          title="Delete Candidate"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Strip */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 20px',
          borderTop: '1px solid var(--slate-200)',
          fontSize: '13px',
          color: 'var(--slate-600)'
        }}>
          <div>
            Showing Page <strong>{pagination.current_page}</strong> of <strong>{pagination.last_page}</strong> ({pagination.total} total profiles)
          </div>

          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              disabled={pagination.current_page <= 1}
              onClick={() => fetchCandidates(pagination.current_page - 1)}
              className="btn btn-secondary btn-sm"
            >
              <ChevronLeft size={16} />
              <span>Previous</span>
            </button>
            <button
              disabled={pagination.current_page >= pagination.last_page}
              onClick={() => fetchCandidates(pagination.current_page + 1)}
              className="btn btn-secondary btn-sm"
            >
              <span>Next</span>
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Profile Details Modal */}
      {viewCandidateId && (
        <CandidateDetailsModal
          candidateId={viewCandidateId}
          onClose={() => setViewCandidateId(null)}
          onUpdated={() => fetchCandidates(pagination.current_page)}
        />
      )}

      {/* Edit Candidate Modal */}
      {editCandidateId && (
        <CandidateEditModal
          candidateId={editCandidateId}
          onClose={() => setEditCandidateId(null)}
          onSaved={() => fetchCandidates(pagination.current_page)}
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
