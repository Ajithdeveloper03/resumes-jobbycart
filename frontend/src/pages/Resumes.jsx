import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  FileUp,
  Search,
  RefreshCw,
  Download,
  Eye,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Clock,
  User,
  ExternalLink,
  X,
  FileCode,
  Filter,
  RotateCcw,
  Sparkles,
  ChevronRight
} from 'lucide-react';
import api, { getDownloadUrl, downloadResumeFile } from '../api/client';
import CandidateDetailsModal from '../components/CandidateDetailsModal';
import ResumePreviewModal from '../components/ResumePreviewModal';

export default function Resumes() {
  const navigate = useNavigate();

  const [resumes, setResumes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState(null);
  const [pagination, setPagination] = useState({ current_page: 1, last_page: 1, total: 0, per_page: 15 });

  // Filters
  const [search, setSearch] = useState('');
  const [formatFilter, setFormatFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [linkageFilter, setLinkageFilter] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');

  // Modals & Preview
  const [inspectResume, setInspectResume] = useState(null);
  const [inspectTab, setInspectTab] = useState('extracted');
  const [inspectCandidateId, setInspectCandidateId] = useState(null);
  const [previewResume, setPreviewResume] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [downloadingId, setDownloadingId] = useState(null);

  const fetchResumes = async (page = 1) => {
    try {
      setLoading(true);
      const params = {
        page,
        per_page: 15,
        sort_by: sortBy,
        sort_order: sortOrder,
      };

      if (search.trim()) params.search = search.trim();
      if (formatFilter) params.format = formatFilter;
      if (statusFilter) params.status = statusFilter;
      if (linkageFilter) params.linkage = linkageFilter;

      const res = await api.get('/resumes', { params });
      if (res.data.success) {
        setResumes(res.data.data.data);
        setPagination({
          current_page: res.data.data.current_page,
          last_page: res.data.data.last_page,
          total: res.data.data.total,
          per_page: res.data.data.per_page,
        });
        if (res.data.summary) {
          setSummary(res.data.summary);
        }
      }
    } catch (err) {
      console.error('Failed to load resumes:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResumes(1);
  }, [formatFilter, statusFilter, linkageFilter, sortBy, sortOrder]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchResumes(1);
  };

  const handleResetFilters = () => {
    setSearch('');
    setFormatFilter('');
    setStatusFilter('');
    setLinkageFilter('');
    setSortBy('created_at');
    setSortOrder('desc');
  };

  const handleDeleteResume = async (id, filename) => {
    if (!window.confirm(`Are you sure you want to delete "${filename}"? This will remove the file from storage.`)) {
      return;
    }

    setDeletingId(id);
    try {
      const res = await api.delete(`/resumes/${id}`);
      if (res.data.success) {
        fetchResumes(pagination.current_page);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete resume file.');
    } finally {
      setDeletingId(null);
    }
  };

  const handleDownload = async (id, filename) => {
    setDownloadingId(id);
    try {
      await downloadResumeFile(id, filename);
    } catch (err) {
      alert(err.message || 'Failed to download resume file.');
    } finally {
      setDownloadingId(null);
    }
  };

  const hasActiveFilters = Boolean(search.trim() || formatFilter || statusFilter || linkageFilter);

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div className="page-title">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h1>Resume Files Repository</h1>
            <span
              style={{
                fontSize: '11px',
                fontWeight: '700',
                padding: '2px 8px',
                borderRadius: '12px',
                backgroundColor: '#eff6ff',
                color: '#1d4ed8',
                border: '1px solid #bfdbfe'
              }}
            >
              Central Storage
            </span>
          </div>
          <p>Organized archive of all uploaded resume documents, extraction logs, and candidate linkages</p>
        </div>

        <div className="page-actions">
          <button
            onClick={() => fetchResumes(pagination.current_page)}
            className="btn btn-secondary"
            title="Refresh repository"
          >
            <RefreshCw size={15} />
            <span>Refresh</span>
          </button>

          <button onClick={() => navigate('/upload')} className="btn btn-primary">
            <FileUp size={16} />
            <span>Upload New Resumes</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card">
          <div>
            <div className="stat-label">Total Resumes</div>
            <div className="stat-value">{summary?.total_resumes ?? pagination.total}</div>
            <div className="stat-sub">Uploaded resume documents</div>
          </div>
          <div className="stat-icon icon-blue">
            <FileText size={22} />
          </div>
        </div>

        <div className="stat-card">
          <div>
            <div className="stat-label">Linked to Candidates</div>
            <div className="stat-value" style={{ color: '#059669' }}>
              {summary?.linked_resumes ?? 0}
            </div>
            <div className="stat-sub">Verified candidate records</div>
          </div>
          <div className="stat-icon icon-emerald">
            <CheckCircle2 size={22} />
          </div>
        </div>

        <div className="stat-card">
          <div>
            <div className="stat-label">Unlinked / Pending</div>
            <div className="stat-value" style={{ color: summary?.unlinked_resumes > 0 ? '#b45309' : 'inherit' }}>
              {summary?.unlinked_resumes ?? 0}
            </div>
            <div className="stat-sub">Awaiting candidate review</div>
          </div>
          <div className="stat-icon icon-amber">
            <AlertCircle size={22} />
          </div>
        </div>

        <div className="stat-card">
          <div>
            <div className="stat-label">PDF vs DOCX</div>
            <div className="stat-value" style={{ fontSize: '18px', paddingTop: '4px' }}>
              {summary?.pdf_count ?? 0} <span style={{ fontSize: '13px', color: 'var(--slate-500)', fontWeight: '400' }}>PDF</span> •{' '}
              {summary?.docx_count ?? 0} <span style={{ fontSize: '13px', color: 'var(--slate-500)', fontWeight: '400' }}>DOCX</span>
            </div>
            <div className="stat-sub">Supported document formats</div>
          </div>
          <div className="stat-icon icon-indigo">
            <FileCode size={22} />
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {pagination.total === 0 && !loading && !hasActiveFilters ? (
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
            <FileText size={32} />
          </div>

          <h2 style={{ fontSize: '20px', fontWeight: '700', color: 'var(--slate-800)', marginBottom: '8px' }}>
            No Resumes Uploaded Yet
          </h2>
          <p style={{ color: 'var(--slate-500)', fontSize: '14px', maxWidth: '540px', margin: '0 auto 24px auto', lineHeight: '1.6' }}>
            All resumes uploaded through Single or Bulk Upload will be neatly cataloged here with their raw files,
            parsing statuses, and candidate associations.
          </p>

          <button onClick={() => navigate('/upload')} className="btn btn-primary" style={{ padding: '10px 24px' }}>
            <FileUp size={16} />
            <span>Upload Your First Resume</span>
          </button>
        </div>
      ) : (
        <div className="card-panel">
          {/* Search & Filters Bar */}
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--slate-200)', backgroundColor: '#ffffff' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: '700', margin: 0, color: 'var(--slate-900)' }}>
                  Stored Resume Documents
                </h3>
                <p style={{ fontSize: '12.5px', color: 'var(--slate-500)', margin: '2px 0 0 0' }}>
                  Showing {resumes.length} of {pagination.total} files
                </p>
              </div>

              {/* Filter Controls Form */}
              <form onSubmit={handleSearchSubmit} style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', flex: '1 1 auto', justifyContent: 'flex-end' }}>
                <div style={{ position: 'relative', width: '260px' }}>
                  <Search size={15} style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--slate-400)' }} />
                  <input
                    type="text"
                    placeholder="Search filename, candidate..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '7px 28px 7px 32px',
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
                        fetchResumes(1);
                      }}
                      style={{ position: 'absolute', right: '8px', top: '9px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--slate-400)', padding: 0 }}
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>

                {/* Format Filter */}
                <select
                  value={formatFilter}
                  onChange={(e) => setFormatFilter(e.target.value)}
                  style={{
                    padding: '7px 10px',
                    fontSize: '13px',
                    borderRadius: '6px',
                    border: '1px solid var(--slate-300)',
                    backgroundColor: '#ffffff'
                  }}
                >
                  <option value="">All Formats</option>
                  <option value="pdf">PDF (.pdf)</option>
                  <option value="docx">Word (.docx)</option>
                  <option value="doc">Legacy (.doc)</option>
                </select>

                {/* Status Filter */}
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  style={{
                    padding: '7px 10px',
                    fontSize: '13px',
                    borderRadius: '6px',
                    border: '1px solid var(--slate-300)',
                    backgroundColor: '#ffffff'
                  }}
                >
                  <option value="">All Statuses</option>
                  <option value="success">Parsed Successfully</option>
                  <option value="partial">Needs Review / Partial</option>
                  <option value="failed">Failed Extraction</option>
                </select>

                {/* Linkage Filter */}
                <select
                  value={linkageFilter}
                  onChange={(e) => setLinkageFilter(e.target.value)}
                  style={{
                    padding: '7px 10px',
                    fontSize: '13px',
                    borderRadius: '6px',
                    border: '1px solid var(--slate-300)',
                    backgroundColor: '#ffffff'
                  }}
                >
                  <option value="">All Linkages</option>
                  <option value="linked">Linked to Candidate</option>
                  <option value="unlinked">Unlinked</option>
                </select>

                <button type="submit" className="btn btn-primary btn-sm" style={{ padding: '7px 14px' }}>
                  Filter
                </button>

                {hasActiveFilters && (
                  <button
                    type="button"
                    onClick={handleResetFilters}
                    className="btn btn-secondary btn-sm"
                    style={{ padding: '7px 10px' }}
                    title="Reset Filters"
                  >
                    <RotateCcw size={14} />
                  </button>
                )}
              </form>
            </div>
          </div>

          {/* Table */}
          <div className="table-responsive">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>File Name</th>
                  <th>Format</th>
                  <th>Parsing Status</th>
                  <th>Associated Candidate</th>
                  <th>Upload Details</th>
                  <th>Uploaded By</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: 'var(--slate-500)' }}>
                      Loading resumes repository...
                    </td>
                  </tr>
                ) : resumes.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: 'var(--slate-500)' }}>
                      No matching resume documents found.
                    </td>
                  </tr>
                ) : (
                  resumes.map((resume) => {
                    const ext = resume.original_filename.split('.').pop().toLowerCase();
                    const isPdf = ext === 'pdf';

                    return (
                      <tr key={resume.id}>
                        {/* 1. File Name */}
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div
                              style={{
                                width: '34px',
                                height: '34px',
                                borderRadius: '6px',
                                backgroundColor: isPdf ? '#fef2f2' : '#eff6ff',
                                color: isPdf ? '#dc2626' : '#2563eb',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0,
                                fontWeight: '700',
                                fontSize: '11px'
                              }}
                            >
                              {isPdf ? 'PDF' : 'DOC'}
                            </div>
                            <div>
                              <div
                                className="break-anywhere"
                                style={{ fontWeight: '600', color: 'var(--slate-900)', fontSize: '13.5px', cursor: 'pointer' }}
                                onClick={() => setInspectResume(resume)}
                              >
                                {resume.original_filename}
                              </div>
                              <div style={{ fontSize: '12px', color: 'var(--slate-500)' }}>
                                {(resume.file_size / 1024).toFixed(1)} KB
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* 2. Format Badge */}
                        <td>
                          <span
                            style={{
                              fontSize: '11px',
                              fontWeight: '700',
                              padding: '2px 8px',
                              borderRadius: '4px',
                              backgroundColor: isPdf ? '#fef2f2' : '#eff6ff',
                              color: isPdf ? '#991b1b' : '#1e40af',
                              border: isPdf ? '1px solid #fecaca' : '1px solid #bfdbfe'
                            }}
                          >
                            .{ext.toUpperCase()}
                          </span>
                        </td>

                        {/* 3. Parsing Status */}
                        <td>
                          {resume.parsing_status === 'success' ? (
                            <span className="badge badge-verified" style={{ fontSize: '11.5px', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                              <CheckCircle2 size={12} />
                              Parsed
                            </span>
                          ) : resume.parsing_status === 'partial' ? (
                            <span className="badge badge-shortlisted" style={{ fontSize: '11.5px', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                              <AlertCircle size={12} />
                              Needs Review
                            </span>
                          ) : (
                            <span className="badge badge-rejected" style={{ fontSize: '11.5px' }}>
                              Failed
                            </span>
                          )}
                        </td>

                        {/* 4. Associated Candidate */}
                        <td>
                          {resume.candidate ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <div className="user-avatar" style={{ width: '28px', height: '28px', fontSize: '11px' }}>
                                {resume.candidate.full_name?.charAt(0) || 'C'}
                              </div>
                              <div>
                                <div
                                  style={{ fontWeight: '600', color: '#1e3a8a', cursor: 'pointer', fontSize: '13px' }}
                                  onClick={() => setInspectCandidateId(resume.candidate.id)}
                                >
                                  {resume.candidate.full_name}
                                </div>
                                <div style={{ fontSize: '11.5px', color: 'var(--slate-500)' }}>
                                  {resume.candidate.primary_role || resume.candidate.email || 'Candidate'}
                                </div>
                              </div>
                            </div>
                          ) : (
                            <span style={{ color: 'var(--slate-400)', fontSize: '12.5px', fontStyle: 'italic' }}>
                              Unlinked
                            </span>
                          )}
                        </td>

                        {/* 5. Upload Date */}
                        <td>
                          <div style={{ fontSize: '12.5px', color: 'var(--slate-700)' }}>
                            {new Date(resume.created_at).toLocaleDateString()}
                          </div>
                          <div style={{ fontSize: '11px', color: 'var(--slate-400)' }}>
                            {new Date(resume.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </td>

                        {/* 6. Uploaded By */}
                        <td>
                          <span style={{ fontSize: '12.5px', color: 'var(--slate-600)' }}>
                            {resume.uploader?.name || 'Recruiter'}
                          </span>
                        </td>

                        {/* 7. Actions */}
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', gap: '4px' }}>
                            <button
                              onClick={() => setPreviewResume(resume)}
                              className="btn btn-icon btn-secondary btn-sm"
                              style={{ color: '#2563eb' }}
                              title="Display / Preview Resume Document"
                            >
                              <Eye size={14} />
                            </button>

                            <button
                              onClick={() => setInspectResume(resume)}
                              className="btn btn-icon btn-secondary btn-sm"
                              title="Inspect Parsed JSON Details"
                            >
                              <FileCode size={14} />
                            </button>

                            <button
                              onClick={() => handleDownload(resume.id, resume.original_filename)}
                              disabled={downloadingId === resume.id}
                              className="btn btn-icon btn-secondary btn-sm"
                              style={{ color: '#059669' }}
                              title="Download Original Resume File"
                            >
                              {downloadingId === resume.id ? (
                                <RefreshCw size={14} className="spin-animation" />
                              ) : (
                                <Download size={14} />
                              )}
                            </button>

                            {resume.candidate && (
                              <button
                                onClick={() => setInspectCandidateId(resume.candidate.id)}
                                className="btn btn-icon btn-secondary btn-sm"
                                title="View Candidate Profile"
                              >
                                <User size={14} />
                              </button>
                            )}

                            <button
                              onClick={() => handleDeleteResume(resume.id, resume.original_filename)}
                              disabled={deletingId === resume.id}
                              className="btn btn-icon btn-secondary btn-sm"
                              style={{ color: '#dc2626' }}
                              title="Delete Resume File"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
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
                Page {pagination.current_page} of {pagination.last_page} ({pagination.total} total files)
              </span>

              <div style={{ display: 'flex', gap: '6px' }}>
                <button
                  disabled={pagination.current_page <= 1}
                  onClick={() => fetchResumes(pagination.current_page - 1)}
                  className="btn btn-secondary btn-sm"
                >
                  Previous
                </button>
                <button
                  disabled={pagination.current_page >= pagination.last_page}
                  onClick={() => fetchResumes(pagination.current_page + 1)}
                  className="btn btn-secondary btn-sm"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Resume Quick Inspection Modal */}
      {inspectResume && (
        <div className="modal-overlay" onClick={() => setInspectResume(null)}>
          <div
            className="modal-content"
            style={{ maxWidth: '820px', width: '95%', maxHeight: '90vh' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="modal-header">
              <div>
                <h3 className="break-anywhere" style={{ fontSize: '17px', fontWeight: '700' }}>
                  {inspectResume.original_filename}
                </h3>
                <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: 'var(--slate-500)' }}>
                  Size: {(inspectResume.file_size / 1024).toFixed(1)} KB • Uploaded on{' '}
                  {new Date(inspectResume.created_at).toLocaleString()}
                </p>
              </div>
              <button
                onClick={() => setInspectResume(null)}
                className="btn btn-icon btn-secondary btn-sm"
                style={{ borderRadius: '50%', width: '32px', height: '32px' }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Tabs */}
            <div style={{ padding: '0 20px', borderBottom: '1px solid var(--slate-200)', backgroundColor: '#ffffff' }}>
              <div style={{ display: 'flex', gap: '16px' }}>
                <button
                  onClick={() => setInspectTab('extracted')}
                  style={{
                    padding: '10px 4px',
                    border: 'none',
                    background: 'none',
                    fontSize: '13.5px',
                    fontWeight: '600',
                    color: inspectTab === 'extracted' ? '#2563eb' : 'var(--slate-600)',
                    borderBottom: inspectTab === 'extracted' ? '2px solid #2563eb' : '2px solid transparent',
                    cursor: 'pointer'
                  }}
                >
                  Extracted Entities
                </button>
                <button
                  onClick={() => setInspectTab('raw')}
                  style={{
                    padding: '10px 4px',
                    border: 'none',
                    background: 'none',
                    fontSize: '13.5px',
                    fontWeight: '600',
                    color: inspectTab === 'raw' ? '#2563eb' : 'var(--slate-600)',
                    borderBottom: inspectTab === 'raw' ? '2px solid #2563eb' : '2px solid transparent',
                    cursor: 'pointer'
                  }}
                >
                  Raw Extracted Text
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="modal-body" style={{ backgroundColor: '#f8fafc' }}>
              {inspectTab === 'extracted' ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div
                    style={{
                      backgroundColor: '#ffffff',
                      border: '1px solid var(--slate-200)',
                      borderRadius: '10px',
                      padding: '16px'
                    }}
                  >
                    <h4 style={{ fontSize: '13.5px', fontWeight: '700', marginBottom: '12px' }}>
                      Candidate Information Extracted
                    </h4>

                    {inspectResume.extracted_json ? (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', fontSize: '13px' }}>
                        <div>
                          <div style={{ color: 'var(--slate-500)', fontSize: '11.5px' }}>Full Name</div>
                          <div style={{ fontWeight: '600', color: 'var(--slate-900)' }}>
                            {inspectResume.extracted_json.full_name || '—'}
                          </div>
                        </div>

                        <div>
                          <div style={{ color: 'var(--slate-500)', fontSize: '11.5px' }}>Email Address</div>
                          <div className="break-anywhere" style={{ fontWeight: '600', color: 'var(--slate-800)' }}>
                            {inspectResume.extracted_json.email || '—'}
                          </div>
                        </div>

                        <div>
                          <div style={{ color: 'var(--slate-500)', fontSize: '11.5px' }}>Mobile Phone</div>
                          <div style={{ fontWeight: '600', color: 'var(--slate-800)' }}>
                            {inspectResume.extracted_json.phone || '—'}
                          </div>
                        </div>

                        <div>
                          <div style={{ color: 'var(--slate-500)', fontSize: '11.5px' }}>Location</div>
                          <div style={{ fontWeight: '600', color: 'var(--slate-800)' }}>
                            {inspectResume.extracted_json.current_location || inspectResume.extracted_json.city || '—'}
                          </div>
                        </div>

                        <div>
                          <div style={{ color: 'var(--slate-500)', fontSize: '11.5px' }}>Role / Title</div>
                          <div style={{ fontWeight: '600', color: 'var(--slate-800)' }}>
                            {inspectResume.extracted_json.primary_role || inspectResume.extracted_json.current_title || '—'}
                          </div>
                        </div>

                        <div>
                          <div style={{ color: 'var(--slate-500)', fontSize: '11.5px' }}>Experience</div>
                          <div style={{ fontWeight: '600', color: 'var(--slate-800)' }}>
                            {inspectResume.extracted_json.total_experience_years !== null && inspectResume.extracted_json.total_experience_years !== undefined
                              ? `${inspectResume.extracted_json.total_experience_years} Years`
                              : '—'}
                          </div>
                        </div>

                        <div>
                          <div style={{ color: 'var(--slate-500)', fontSize: '11.5px' }}>Highest Qualification</div>
                          <div style={{ fontWeight: '600', color: 'var(--slate-800)' }}>
                            {inspectResume.extracted_json.highest_qualification || inspectResume.extracted_json.degree || '—'}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <p style={{ color: 'var(--slate-400)', fontSize: '13px' }}>No extracted entity data available.</p>
                    )}
                  </div>

                  {/* Skills */}
                  {inspectResume.extracted_json?.key_skills && inspectResume.extracted_json.key_skills.length > 0 && (
                    <div
                      style={{
                        backgroundColor: '#ffffff',
                        border: '1px solid var(--slate-200)',
                        borderRadius: '10px',
                        padding: '16px'
                      }}
                    >
                      <h4 style={{ fontSize: '13px', fontWeight: '700', marginBottom: '8px' }}>
                        Key Skills ({inspectResume.extracted_json.key_skills.length})
                      </h4>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        {inspectResume.extracted_json.key_skills.map((skill, idx) => (
                          <span
                            key={idx}
                            className="skill-tag"
                            style={{
                              padding: '4px 10px',
                              fontSize: '12px',
                              backgroundColor: '#eff6ff',
                              color: '#1d4ed8',
                              border: '1px solid #bfdbfe',
                              borderRadius: '4px',
                              margin: 0
                            }}
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <pre
                  style={{
                    backgroundColor: '#ffffff',
                    border: '1px solid var(--slate-200)',
                    padding: '16px',
                    borderRadius: '8px',
                    fontSize: '12px',
                    color: 'var(--slate-800)',
                    maxHeight: '400px',
                    overflowY: 'auto',
                    whiteSpace: 'pre-wrap',
                    fontFamily: 'monospace'
                  }}
                >
                  {inspectResume.text_content || 'No text content available.'}
                </pre>
              )}
            </div>

            {/* Footer */}
            <div className="modal-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => {
                    const current = inspectResume;
                    setInspectResume(null);
                    setPreviewResume(current);
                  }}
                  className="btn btn-primary btn-sm"
                  style={{ padding: '7px 16px', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <Eye size={14} />
                  <span>Display / View Document</span>
                </button>

                <button
                  onClick={() => handleDownload(inspectResume.id, inspectResume.original_filename)}
                  disabled={downloadingId === inspectResume.id}
                  className="btn btn-secondary btn-sm"
                  style={{ padding: '7px 16px', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  {downloadingId === inspectResume.id ? (
                    <RefreshCw size={14} className="spin-animation" />
                  ) : (
                    <Download size={14} />
                  )}
                  <span>Download Resume File</span>
                </button>
              </div>

              <button
                onClick={() => setInspectResume(null)}
                className="btn btn-secondary btn-sm"
                style={{ padding: '7px 16px' }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Full Resume Document Display / Preview Modal */}
      {previewResume && (
        <ResumePreviewModal
          resumeId={previewResume.id}
          initialResume={previewResume}
          candidate={previewResume.candidate}
          onClose={() => setPreviewResume(null)}
        />
      )}

      {/* Candidate Details Modal if opened from candidate association */}
      {inspectCandidateId && (
        <CandidateDetailsModal
          candidateId={inspectCandidateId}
          onClose={() => setInspectCandidateId(null)}
          onUpdated={() => fetchResumes(pagination.current_page)}
        />
      )}
    </div>
  );
}
