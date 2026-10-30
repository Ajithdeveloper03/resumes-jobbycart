import React, { useState, useEffect } from 'react';
import {
  X,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  Clock,
  GraduationCap,
  Download,
  CheckCircle2,
  FileText,
  Edit,
  Copy,
  Check,
  Send,
  Save,
  Plus,
  Trash2,
  Sparkles,
  ArrowLeft,
  Eye,
  RefreshCw
} from 'lucide-react';
import api, { getDownloadUrl, downloadResumeFile } from '../api/client';
import ResumePreviewModal from './ResumePreviewModal';

export default function CandidateDetailsModal({ candidateId, onClose, onUpdated, onEdit }) {
  const [candidate, setCandidate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('profile');
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [previewResumeId, setPreviewResumeId] = useState(null);
  const [downloadingResume, setDownloadingResume] = useState(false);

  // In-modal Edit State
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    full_name: '',
    email: '',
    phone: '',
    current_location: '',
    primary_role: '',
    total_experience_years: '',
    highest_qualification: '',
    candidate_status: 'new',
    skills: [],
  });
  const [newSkillText, setNewSkillText] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);
  const [editError, setEditError] = useState('');

  // Notes State
  const [newNote, setNewNote] = useState('');
  const [addingNote, setAddingNote] = useState(false);

  // Status updating
  const [statusUpdating, setStatusUpdating] = useState(false);

  const fetchCandidate = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get(`/candidates/${candidateId}`);
      if (res.data.success) {
        const c = res.data.data;
        setCandidate(c);
        setEditForm({
          full_name: c.full_name || '',
          email: c.email || '',
          phone: c.phone || '',
          current_location: c.current_location || c.city || '',
          primary_role: c.primary_role || c.current_title || '',
          total_experience_years: c.total_experience_years !== null && c.total_experience_years !== undefined ? c.total_experience_years : '',
          highest_qualification: c.highest_qualification || c.degree || (c.education?.[0]?.degree || ''),
          candidate_status: c.candidate_status || 'new',
          skills: c.skills?.map((s) => s.skill_name) || [],
        });
      }
    } catch (err) {
      setError('Unable to load candidate details from server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (candidateId) {
      fetchCandidate();
      setIsEditing(false);
    }
  }, [candidateId]);

  const handleStatusChange = async (newStatus) => {
    setStatusUpdating(true);
    try {
      const res = await api.put(`/candidates/${candidateId}`, { candidate_status: newStatus });
      if (res.data.success) {
        setCandidate((prev) => ({ ...prev, candidate_status: newStatus }));
        setEditForm((prev) => ({ ...prev, candidate_status: newStatus }));
        if (onUpdated) onUpdated();
      }
    } catch (e) {
      alert('Failed to update status.');
    } finally {
      setStatusUpdating(false);
    }
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editForm.full_name.trim()) {
      setEditError('Candidate full name is required.');
      return;
    }
    setSavingEdit(true);
    setEditError('');

    try {
      const payload = {
        full_name: editForm.full_name.trim(),
        email: editForm.email.trim() || null,
        phone: editForm.phone.trim() || null,
        current_location: editForm.current_location.trim() || null,
        city: editForm.current_location.includes(',') ? editForm.current_location.split(',')[0].trim() : (editForm.current_location.trim() || null),
        primary_role: editForm.primary_role.trim() || null,
        current_title: editForm.primary_role.trim() || null,
        total_experience_years: editForm.total_experience_years !== '' ? parseFloat(editForm.total_experience_years) : null,
        highest_qualification: editForm.highest_qualification.trim() || null,
        degree: editForm.highest_qualification.trim() || null,
        candidate_status: editForm.candidate_status,
        skills: editForm.skills,
      };

      const res = await api.put(`/candidates/${candidateId}`, payload);
      if (res.data.success) {
        setIsEditing(false);
        fetchCandidate();
        if (onUpdated) onUpdated();
      }
    } catch (err) {
      setEditError(err.response?.data?.message || 'Failed to update candidate record.');
    } finally {
      setSavingEdit(false);
    }
  };

  const handleAddSkill = (e) => {
    e.preventDefault();
    const skillTrimmed = newSkillText.trim();
    if (skillTrimmed && !editForm.skills.includes(skillTrimmed)) {
      setEditForm((prev) => ({ ...prev, skills: [...prev.skills, skillTrimmed] }));
      setNewSkillText('');
    }
  };

  const handleRemoveSkill = (skillToRemove) => {
    setEditForm((prev) => ({
      ...prev,
      skills: prev.skills.filter((s) => s !== skillToRemove),
    }));
  };

  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!newNote.trim()) return;
    setAddingNote(true);
    try {
      const res = await api.post(`/candidates/${candidateId}/notes`, { note: newNote.trim() });
      if (res.data.success) {
        setNewNote('');
        fetchCandidate();
      }
    } catch (e) {
      alert('Failed to add note.');
    } finally {
      setAddingNote(false);
    }
  };

  const handleCopyEmail = (email) => {
    if (!email) return;
    navigator.clipboard.writeText(email);
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2000);
  };

  const handleDownloadResume = async (resumeId, filename) => {
    setDownloadingResume(true);
    try {
      await downloadResumeFile(resumeId, filename || candidate?.latest_resume?.original_filename);
    } catch (err) {
      alert(err.message || 'Failed to download resume file.');
    } finally {
      setDownloadingResume(false);
    }
  };

  if (!candidateId) return null;

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 1050 }}>
      <div
        className="modal-content"
        style={{
          maxWidth: '880px',
          width: '96%',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          overflow: 'hidden'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '16px 22px',
            borderBottom: '1px solid var(--slate-200)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: '#ffffff',
            flexWrap: 'wrap',
            gap: '12px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: '220px', flex: '1 1 auto' }}>
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '50%',
                backgroundColor: '#eff6ff',
                color: '#2563eb',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '18px',
                fontWeight: '700',
                border: '2px solid #bfdbfe',
                flexShrink: 0
              }}
            >
              {candidate?.full_name?.charAt(0) || 'C'}
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <h2
                  className="break-anywhere"
                  style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: 'var(--slate-900)' }}
                >
                  {candidate?.full_name || (loading ? 'Loading...' : 'Candidate Details')}
                </h2>
                {candidate?.candidate_status && (
                  <span className={`badge badge-${candidate.candidate_status}`}>
                    {candidate.candidate_status}
                  </span>
                )}
                {candidate?.is_verified && (
                  <span className="badge badge-verified" style={{ fontSize: '11px', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                    <CheckCircle2 size={12} />
                    Verified
                  </span>
                )}
              </div>
              <div className="break-anywhere" style={{ fontSize: '13px', color: 'var(--slate-500)', marginTop: '2px' }}>
                {candidate?.primary_role || candidate?.current_title || 'Candidate Profile'}
              </div>
            </div>
          </div>

          {/* Header Action Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
            {candidate?.latest_resume && (
              <>
                <button
                  onClick={() => setPreviewResumeId(candidate.latest_resume.id)}
                  className="btn btn-primary btn-sm"
                  title="Display / View Candidate's Resume Document"
                  style={{ padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '5px' }}
                >
                  <Eye size={14} />
                  <span>View Resume</span>
                </button>

                <button
                  onClick={() => handleDownloadResume(candidate.latest_resume.id, candidate.latest_resume.original_filename)}
                  disabled={downloadingResume}
                  className="btn btn-outline-primary btn-sm"
                  title="Download Candidate's Resume"
                  style={{ padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '5px' }}
                >
                  {downloadingResume ? <RefreshCw size={14} className="spin-animation" /> : <Download size={14} />}
                  <span>Download</span>
                </button>
              </>
            )}

            {!isEditing ? (
              <button
                onClick={() => {
                  if (onEdit) {
                    onClose();
                    onEdit(candidate.id);
                  } else {
                    setIsEditing(true);
                  }
                }}
                className="btn btn-secondary btn-sm"
                style={{ padding: '6px 12px' }}
                title="Edit Candidate Details"
              >
                <Edit size={14} />
                <span>Edit Profile</span>
              </button>
            ) : (
              <button
                onClick={() => setIsEditing(false)}
                className="btn btn-secondary btn-sm"
                style={{ padding: '6px 12px' }}
              >
                <ArrowLeft size={14} />
                <span>Back to View</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="btn btn-icon btn-secondary btn-sm"
              style={{ borderRadius: '50%', width: '32px', height: '32px' }}
              title="Close modal"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Quick Status Bar */}
        {!isEditing && candidate && (
          <div
            style={{
              padding: '8px 22px',
              backgroundColor: 'var(--slate-50)',
              borderBottom: '1px solid var(--slate-200)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '10px',
              fontSize: '13px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontWeight: '600', color: 'var(--slate-700)' }}>Status:</span>
              <select
                value={candidate.candidate_status || 'new'}
                disabled={statusUpdating}
                onChange={(e) => handleStatusChange(e.target.value)}
                style={{
                  padding: '4px 10px',
                  borderRadius: '6px',
                  border: '1px solid var(--slate-300)',
                  fontSize: '12.5px',
                  fontWeight: '600',
                  backgroundColor: '#ffffff',
                  outline: 'none',
                  cursor: 'pointer'
                }}
              >
                <option value="new">New Candidate</option>
                <option value="screening">Screening</option>
                <option value="shortlisted">Shortlisted</option>
                <option value="interviewing">Interviewing</option>
                <option value="offered">Offered</option>
                <option value="hired">Hired</option>
                <option value="rejected">Rejected</option>
                <option value="archived">Archived</option>
              </select>
            </div>

            <span style={{ fontSize: '12px', color: 'var(--slate-500)' }}>
              Added: {new Date(candidate.created_at).toLocaleDateString()}
            </span>
          </div>
        )}

        {/* Modal Navigation Tabs (Hidden in edit mode) */}
        {!isEditing && (
          <div style={{ padding: '0 22px', borderBottom: '1px solid var(--slate-200)', backgroundColor: '#ffffff' }}>
            <div className="modal-tabs-scroll">
              <button
                onClick={() => setActiveTab('profile')}
                style={{
                  padding: '11px 4px',
                  border: 'none',
                  background: 'none',
                  fontSize: '13.5px',
                  fontWeight: '600',
                  color: activeTab === 'profile' ? '#2563eb' : 'var(--slate-600)',
                  borderBottom: activeTab === 'profile' ? '2px solid #2563eb' : '2px solid transparent',
                  cursor: 'pointer'
                }}
              >
                Candidate Profile
              </button>

              <button
                onClick={() => setActiveTab('resume')}
                style={{
                  padding: '11px 4px',
                  border: 'none',
                  background: 'none',
                  fontSize: '13.5px',
                  fontWeight: '600',
                  color: activeTab === 'resume' ? '#2563eb' : 'var(--slate-600)',
                  borderBottom: activeTab === 'resume' ? '2px solid #2563eb' : '2px solid transparent',
                  cursor: 'pointer'
                }}
              >
                Resume File & Text
              </button>

              <button
                onClick={() => setActiveTab('notes')}
                style={{
                  padding: '11px 4px',
                  border: 'none',
                  background: 'none',
                  fontSize: '13.5px',
                  fontWeight: '600',
                  color: activeTab === 'notes' ? '#2563eb' : 'var(--slate-600)',
                  borderBottom: activeTab === 'notes' ? '2px solid #2563eb' : '2px solid transparent',
                  cursor: 'pointer'
                }}
              >
                Recruiter Notes ({candidate?.notes?.length || 0})
              </button>
            </div>
          </div>
        )}

        {/* Modal Content Body */}
        <div style={{ padding: '20px 22px', overflowY: 'auto', flex: 1, backgroundColor: '#f8fafc' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--slate-500)' }}>
              Loading candidate profile...
            </div>
          ) : error || !candidate ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: '#dc2626' }}>
              {error}
            </div>
          ) : isEditing ? (
            /* ================= EDIT MODE FORM ================= */
            <form onSubmit={handleSaveEdit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              {editError && (
                <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b', padding: '10px 14px', borderRadius: '8px', fontSize: '13px' }}>
                  {editError}
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="Candidate's full name"
                    className="form-control"
                    value={editForm.full_name}
                    onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                  />
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Email Address</label>
                  <input
                    type="email"
                    placeholder="candidate@example.com"
                    className="form-control"
                    value={editForm.email}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  />
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Mobile Number</label>
                  <input
                    type="text"
                    placeholder="+91 98765 43210"
                    className="form-control"
                    value={editForm.phone}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Location</label>
                  <input
                    type="text"
                    placeholder="e.g. Chennai, Tamil Nadu"
                    className="form-control"
                    value={editForm.current_location}
                    onChange={(e) => setEditForm({ ...editForm, current_location: e.target.value })}
                  />
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Designated Role</label>
                  <input
                    type="text"
                    placeholder="e.g. Full Stack Developer"
                    className="form-control"
                    value={editForm.primary_role}
                    onChange={(e) => setEditForm({ ...editForm, primary_role: e.target.value })}
                  />
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Total Experience (Years)</label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="e.g. 4.5"
                    className="form-control"
                    value={editForm.total_experience_years}
                    onChange={(e) => setEditForm({ ...editForm, total_experience_years: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Education / Qualification</label>
                  <input
                    type="text"
                    placeholder="e.g. B.Tech in Information Technology"
                    className="form-control"
                    value={editForm.highest_qualification}
                    onChange={(e) => setEditForm({ ...editForm, highest_qualification: e.target.value })}
                  />
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Candidate Status</label>
                  <select
                    className="form-control"
                    value={editForm.candidate_status}
                    onChange={(e) => setEditForm({ ...editForm, candidate_status: e.target.value })}
                  >
                    <option value="new">New Candidate</option>
                    <option value="screening">Screening</option>
                    <option value="shortlisted">Shortlisted</option>
                    <option value="interviewing">Interviewing</option>
                    <option value="offered">Offered</option>
                    <option value="hired">Hired</option>
                    <option value="rejected">Rejected</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
              </div>

              {/* Skills Editor */}
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">
                  Key Skills & Technologies ({editForm.skills.length})
                </label>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                  <input
                    type="text"
                    placeholder="Add a key skill (e.g. React, PHP, MySQL) and press Add..."
                    className="form-control"
                    value={newSkillText}
                    onChange={(e) => setNewSkillText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddSkill(e);
                      }
                    }}
                  />
                  <button type="button" onClick={handleAddSkill} className="btn btn-secondary" style={{ whiteSpace: 'nowrap' }}>
                    <Plus size={15} />
                    <span>Add</span>
                  </button>
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {editForm.skills.map((skill, idx) => (
                    <span
                      key={idx}
                      className="skill-tag"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '5px 10px',
                        backgroundColor: '#eff6ff',
                        color: '#1d4ed8',
                        border: '1px solid #bfdbfe',
                        borderRadius: '6px',
                        fontSize: '12.5px'
                      }}
                    >
                      <span>{skill}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveSkill(skill)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: '#93c5fd', display: 'flex' }}
                      >
                        <X size={13} />
                      </button>
                    </span>
                  ))}
                  {editForm.skills.length === 0 && (
                    <span style={{ fontSize: '12px', color: 'var(--slate-400)' }}>No skills added.</span>
                  )}
                </div>
              </div>

              {/* Edit Actions */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px', paddingTop: '14px', borderTop: '1px solid var(--slate-200)' }}>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="btn btn-secondary btn-sm"
                  style={{ padding: '7px 16px' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="btn btn-primary btn-sm"
                  style={{ padding: '7px 20px' }}
                >
                  <Save size={15} />
                  <span>{savingEdit ? 'Saving...' : 'Save Candidate Changes'}</span>
                </button>
              </div>
            </form>
          ) : (
            /* ================= VIEW MODE ================= */
            <>
              {/* TAB 1: Profile Details (Strictly the 8 fields) */}
              {activeTab === 'profile' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {/* Top 2 Cards Grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
                    {/* Card 1: Contact Details */}
                    <div
                      style={{
                        backgroundColor: '#ffffff',
                        border: '1px solid var(--slate-200)',
                        borderRadius: '10px',
                        padding: '16px 18px'
                      }}
                    >
                      <h4 style={{ fontSize: '13.5px', fontWeight: '700', color: 'var(--slate-800)', marginBottom: '12px', borderBottom: '1px solid var(--slate-100)', paddingBottom: '8px' }}>
                        Contact Details
                      </h4>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13px' }}>
                        <div>
                          <div style={{ color: 'var(--slate-500)', fontSize: '12px', marginBottom: '2px' }}>Full Name</div>
                          <div className="break-anywhere" style={{ fontWeight: '600', color: 'var(--slate-900)', fontSize: '14px' }}>
                            {candidate.full_name || '—'}
                          </div>
                        </div>

                        <div>
                          <div style={{ color: 'var(--slate-500)', fontSize: '12px', marginBottom: '2px' }}>Email Address</div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                            <Mail size={14} color="#2563eb" style={{ flexShrink: 0 }} />
                            <span className="break-anywhere" style={{ fontWeight: '600', color: 'var(--slate-800)' }}>
                              {candidate.email || '—'}
                            </span>
                            {candidate.email && (
                              <button
                                onClick={() => handleCopyEmail(candidate.email)}
                                title="Copy Email"
                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--slate-400)', padding: 0 }}
                              >
                                {copiedEmail ? <Check size={13} color="#059669" /> : <Copy size={13} />}
                              </button>
                            )}
                          </div>
                        </div>

                        <div>
                          <div style={{ color: 'var(--slate-500)', fontSize: '12px', marginBottom: '2px' }}>Mobile Phone</div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Phone size={14} color="#2563eb" style={{ flexShrink: 0 }} />
                            <span className="break-anywhere" style={{ fontWeight: '600', color: 'var(--slate-800)' }}>
                              {candidate.phone || '—'}
                            </span>
                          </div>
                        </div>

                        <div>
                          <div style={{ color: 'var(--slate-500)', fontSize: '12px', marginBottom: '2px' }}>Location</div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <MapPin size={14} color="#2563eb" style={{ flexShrink: 0 }} />
                            <span className="break-anywhere" style={{ fontWeight: '600', color: 'var(--slate-800)' }}>
                              {candidate.current_location || candidate.city || '—'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Card 2: Professional Background */}
                    <div
                      style={{
                        backgroundColor: '#ffffff',
                        border: '1px solid var(--slate-200)',
                        borderRadius: '10px',
                        padding: '16px 18px'
                      }}
                    >
                      <h4 style={{ fontSize: '13.5px', fontWeight: '700', color: 'var(--slate-800)', marginBottom: '12px', borderBottom: '1px solid var(--slate-100)', paddingBottom: '8px' }}>
                        Professional Background
                      </h4>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13px' }}>
                        <div>
                          <div style={{ color: 'var(--slate-500)', fontSize: '12px', marginBottom: '2px' }}>Designated Role</div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Briefcase size={14} color="#2563eb" style={{ flexShrink: 0 }} />
                            <span className="break-anywhere" style={{ fontWeight: '700', color: '#1e3a8a', fontSize: '14px' }}>
                              {candidate.primary_role || candidate.current_title || '—'}
                            </span>
                          </div>
                        </div>

                        <div>
                          <div style={{ color: 'var(--slate-500)', fontSize: '12px', marginBottom: '2px' }}>Total Experience</div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Clock size={14} color="#2563eb" style={{ flexShrink: 0 }} />
                            <span style={{ fontWeight: '600', color: 'var(--slate-800)' }}>
                              {candidate.total_experience_years !== null && candidate.total_experience_years !== undefined
                                ? `${candidate.total_experience_years} Years`
                                : '—'}
                            </span>
                          </div>
                        </div>

                        <div>
                          <div style={{ color: 'var(--slate-500)', fontSize: '12px', marginBottom: '2px' }}>Highest Qualification</div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <GraduationCap size={14} color="#2563eb" style={{ flexShrink: 0 }} />
                            <span className="break-anywhere" style={{ fontWeight: '600', color: 'var(--slate-800)' }}>
                              {candidate.highest_qualification || candidate.degree || candidate.education?.[0]?.degree || '—'}
                              {candidate.specialization ? ` (${candidate.specialization})` : ''}
                            </span>
                          </div>
                        </div>

                        <div>
                          <div style={{ color: 'var(--slate-500)', fontSize: '12px', marginBottom: '2px' }}>Added to Database</div>
                          <div style={{ color: 'var(--slate-700)', fontSize: '12.5px' }}>
                            {new Date(candidate.created_at).toLocaleDateString(undefined, {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Card 3: Key Skills */}
                  <div
                    style={{
                      backgroundColor: '#ffffff',
                      border: '1px solid var(--slate-200)',
                      borderRadius: '10px',
                      padding: '16px 18px'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                      <h4 style={{ fontSize: '13.5px', fontWeight: '700', color: 'var(--slate-800)', margin: 0 }}>
                        Key Skills & Technologies
                      </h4>
                      <span style={{ fontSize: '12px', color: 'var(--slate-500)' }}>
                        {candidate.skills?.length || 0} skills detected
                      </span>
                    </div>

                    {candidate.skills && candidate.skills.length > 0 ? (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        {candidate.skills.map((s, idx) => (
                          <span
                            key={idx}
                            className="skill-tag"
                            style={{
                              padding: '5px 12px',
                              fontSize: '12.5px',
                              backgroundColor: '#eff6ff',
                              color: '#1d4ed8',
                              border: '1px solid #bfdbfe',
                              borderRadius: '6px',
                              margin: 0
                            }}
                          >
                            <strong>{s.skill_name}</strong>
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p style={{ color: 'var(--slate-400)', fontSize: '13px', margin: 0 }}>
                        No key skills detected in the resume text.
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 2: Resume File & Text */}
              {activeTab === 'resume' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {candidate.latest_resume ? (
                    <div
                      style={{
                        backgroundColor: '#ffffff',
                        border: '1px solid var(--slate-200)',
                        borderRadius: '10px',
                        padding: '18px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: '14px'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: '200px' }}>
                        <div
                          style={{
                            width: '42px',
                            height: '42px',
                            borderRadius: '8px',
                            backgroundColor: '#eff6ff',
                            color: '#2563eb',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0
                          }}
                        >
                          <FileText size={22} />
                        </div>
                        <div>
                          <div className="break-anywhere" style={{ fontWeight: '700', color: 'var(--slate-900)', fontSize: '14px' }}>
                            {candidate.latest_resume.original_filename}
                          </div>
                          <div style={{ fontSize: '12px', color: 'var(--slate-500)', marginTop: '2px' }}>
                            Size: {(((candidate.latest_resume.file_size || candidate.latest_resume.file_size_bytes || 0)) / 1024).toFixed(1)} KB • Uploaded on{' '}
                            {new Date(candidate.latest_resume.created_at).toLocaleDateString()}
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        <button
                          onClick={() => setPreviewResumeId(candidate.latest_resume.id)}
                          className="btn btn-primary btn-sm"
                          style={{ padding: '7px 16px', display: 'flex', alignItems: 'center', gap: '6px' }}
                        >
                          <Eye size={14} />
                          <span>Display / Preview Resume</span>
                        </button>

                        <button
                          onClick={() => handleDownloadResume(candidate.latest_resume.id, candidate.latest_resume.original_filename)}
                          disabled={downloadingResume}
                          className="btn btn-secondary btn-sm"
                          style={{ padding: '7px 16px', display: 'flex', alignItems: 'center', gap: '6px' }}
                        >
                          {downloadingResume ? <RefreshCw size={14} className="spin-animation" /> : <Download size={14} />}
                          <span>Download Original</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div
                      style={{
                        backgroundColor: '#ffffff',
                        border: '1px solid var(--slate-200)',
                        borderRadius: '10px',
                        padding: '30px',
                        textAlign: 'center',
                        color: 'var(--slate-500)'
                      }}
                    >
                      No resume file is attached to this candidate record.
                    </div>
                  )}

                  {(candidate.raw_extracted_text || candidate.latest_resume?.text_content) && (
                    <div
                      style={{
                        backgroundColor: '#ffffff',
                        border: '1px solid var(--slate-200)',
                        borderRadius: '10px',
                        padding: '16px 18px'
                      }}
                    >
                      <h4 style={{ fontSize: '13px', fontWeight: '700', color: 'var(--slate-800)', marginBottom: '8px' }}>
                        Extracted Resume Text Preview
                      </h4>
                      <pre
                        style={{
                          backgroundColor: 'var(--slate-50)',
                          border: '1px solid var(--slate-200)',
                          padding: '12px',
                          borderRadius: '8px',
                          fontSize: '12px',
                          color: 'var(--slate-700)',
                          maxHeight: '280px',
                          overflowY: 'auto',
                          whiteSpace: 'pre-wrap',
                          fontFamily: 'monospace'
                        }}
                      >
                        {candidate.raw_extracted_text || candidate.latest_resume?.text_content}
                      </pre>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: Recruiter Notes */}
              {activeTab === 'notes' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <form
                    onSubmit={handleAddNote}
                    style={{
                      backgroundColor: '#ffffff',
                      border: '1px solid var(--slate-200)',
                      borderRadius: '10px',
                      padding: '16px 18px'
                    }}
                  >
                    <h4 style={{ fontSize: '13px', fontWeight: '700', color: 'var(--slate-800)', marginBottom: '8px' }}>
                      Add Recruiter Assessment Note
                    </h4>
                    <textarea
                      placeholder="Add interview notes, candidate feedback, or observations..."
                      value={newNote}
                      onChange={(e) => setNewNote(e.target.value)}
                      rows={3}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        fontSize: '13px',
                        borderRadius: '8px',
                        border: '1px solid var(--slate-300)',
                        outline: 'none',
                        resize: 'vertical',
                        marginBottom: '10px',
                        boxSizing: 'border-box'
                      }}
                    />
                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <button
                        type="submit"
                        disabled={addingNote || !newNote.trim()}
                        className="btn btn-primary btn-sm"
                        style={{ padding: '6px 14px' }}
                      >
                        <Send size={14} />
                        <span>{addingNote ? 'Saving...' : 'Add Note'}</span>
                      </button>
                    </div>
                  </form>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {candidate.notes && candidate.notes.length > 0 ? (
                      candidate.notes.map((note) => (
                        <div
                          key={note.id}
                          style={{
                            backgroundColor: '#ffffff',
                            border: '1px solid var(--slate-200)',
                            borderRadius: '8px',
                            padding: '12px 14px'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--slate-500)', marginBottom: '4px' }}>
                            <span style={{ fontWeight: '600', color: 'var(--slate-700)' }}>
                              {note.user?.name || note.recruiter?.name || 'Recruiter'}
                            </span>
                            <span>{new Date(note.created_at).toLocaleString()}</span>
                          </div>
                          <p style={{ margin: 0, fontSize: '13px', color: 'var(--slate-800)', lineHeight: '1.5' }}>
                            {note.note}
                          </p>
                        </div>
                      ))
                    ) : (
                      <div style={{ textAlign: 'center', padding: '24px', color: 'var(--slate-400)', fontSize: '13px' }}>
                        No recruiter notes recorded yet.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div
          style={{
            padding: '12px 22px',
            borderTop: '1px solid var(--slate-200)',
            display: 'flex',
            justifyContent: 'flex-end',
            backgroundColor: '#ffffff'
          }}
        >
          <button onClick={onClose} className="btn btn-secondary btn-sm" style={{ padding: '7px 18px' }}>
            Close
          </button>
        </div>
      </div>

      {/* Embedded Resume Preview Modal */}
      {previewResumeId && (
        <ResumePreviewModal
          resumeId={previewResumeId}
          candidate={candidate}
          initialResume={candidate?.latest_resume}
          onClose={() => setPreviewResumeId(null)}
        />
      )}
    </div>
  );
}
