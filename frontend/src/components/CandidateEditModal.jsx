import React, { useState, useEffect } from 'react';
import { X, Save, Plus, Trash2 } from 'lucide-react';
import api from '../api/client';

export default function CandidateEditModal({ candidateId, onClose, onSaved }) {
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    current_title: '',
    primary_role: '',
    total_experience_years: '',
    current_location: '',
    city: '',
    state: '',
    highest_qualification: '',
    candidate_status: 'new',
    skills: [],
  });

  const [newSkill, setNewSkill] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadCandidate = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/candidates/${candidateId}`);
        if (res.data.success) {
          const c = res.data.data;
          setFormData({
            full_name: c.full_name || '',
            email: c.email || '',
            phone: c.phone || '',
            current_title: c.current_title || '',
            primary_role: c.primary_role || '',
            total_experience_years: c.total_experience_years !== null && c.total_experience_years !== undefined ? c.total_experience_years : '',
            current_location: c.current_location || '',
            city: c.city || '',
            state: c.state || '',
            highest_qualification: c.highest_qualification || '',
            candidate_status: c.candidate_status || 'new',
            skills: c.skills?.map((s) => s.skill_name) || [],
          });
        }
      } catch (err) {
        setError('Failed to fetch candidate details for editing.');
      } finally {
        setLoading(false);
      }
    };

    if (candidateId) {
      loadCandidate();
    }
  }, [candidateId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddSkill = (e) => {
    e.preventDefault();
    if (newSkill.trim() && !formData.skills.includes(newSkill.trim())) {
      setFormData((prev) => ({ ...prev, skills: [...prev.skills, newSkill.trim()] }));
      setNewSkill('');
    }
  };

  const handleRemoveSkill = (skillToRemove) => {
    setFormData((prev) => ({
      ...prev,
      skills: prev.skills.filter((s) => s !== skillToRemove),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      const payload = {
        ...formData,
        total_experience_years: formData.total_experience_years !== '' ? parseFloat(formData.total_experience_years) : null,
        skills: formData.skills,
      };

      const res = await api.put(`/candidates/${candidateId}`, payload);
      if (res.data.success) {
        if (onSaved) onSaved();
        onClose();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update candidate record.');
    } finally {
      setSaving(false);
    }
  };

  if (!candidateId) return null;

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 1050 }}>
      <div
        className="modal-content"
        style={{
          maxWidth: '820px',
          width: '95%',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          overflow: 'hidden'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '18px 24px',
            borderBottom: '1px solid var(--slate-200)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: 'var(--slate-900)' }}>
              Edit Candidate Profile
            </h3>
            <p style={{ margin: '2px 0 0 0', fontSize: '12.5px', color: 'var(--slate-500)' }}>
              Update verified candidate fields in database
            </p>
          </div>
          <button
            onClick={onClose}
            className="btn btn-icon btn-secondary btn-sm"
            style={{ borderRadius: '50%', width: '32px', height: '32px' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
          {error && (
            <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b', padding: '12px 16px', borderRadius: '8px', marginBottom: '16px', fontSize: '13.5px' }}>
              {error}
            </div>
          )}

          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--slate-500)' }}>
              Loading candidate details...
            </div>
          ) : (
            <form id="candidate-edit-form" onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Row 1: Name, Email, Phone */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Full Name *</label>
                  <input
                    type="text"
                    required
                    name="full_name"
                    className="form-control"
                    value={formData.full_name}
                    onChange={handleChange}
                  />
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Email Address</label>
                  <input
                    type="email"
                    name="email"
                    className="form-control"
                    value={formData.email}
                    onChange={handleChange}
                  />
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Mobile Number</label>
                  <input
                    type="text"
                    name="phone"
                    className="form-control"
                    value={formData.phone}
                    onChange={handleChange}
                  />
                </div>
              </div>

              {/* Row 2: Location, Role, Experience */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Location</label>
                  <input
                    type="text"
                    name="current_location"
                    placeholder="e.g. Chennai, Tamil Nadu"
                    className="form-control"
                    value={formData.current_location}
                    onChange={(e) => {
                      const val = e.target.value;
                      setFormData((prev) => ({
                        ...prev,
                        current_location: val,
                        city: val.includes(',') ? val.split(',')[0].trim() : val
                      }));
                    }}
                  />
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Role / Title</label>
                  <input
                    type="text"
                    name="primary_role"
                    placeholder="e.g. Full Stack Developer"
                    className="form-control"
                    value={formData.primary_role}
                    onChange={handleChange}
                  />
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Total Experience (Years)</label>
                  <input
                    type="number"
                    step="0.1"
                    name="total_experience_years"
                    placeholder="e.g. 4.5"
                    className="form-control"
                    value={formData.total_experience_years}
                    onChange={handleChange}
                  />
                </div>
              </div>

              {/* Row 3: Education & Status */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Education / Qualification</label>
                  <input
                    type="text"
                    name="highest_qualification"
                    placeholder="e.g. B.Tech in Information Technology"
                    className="form-control"
                    value={formData.highest_qualification}
                    onChange={handleChange}
                  />
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Candidate Status</label>
                  <select
                    name="candidate_status"
                    className="form-control"
                    value={formData.candidate_status}
                    onChange={handleChange}
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

              {/* Row 4: Key Skills Editor */}
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">
                  Key Skills & Technologies ({formData.skills.length})
                </label>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
                  <input
                    type="text"
                    placeholder="Type skill name (e.g. React, PHP, MySQL) and press Enter..."
                    className="form-control"
                    value={newSkill}
                    onChange={(e) => setNewSkill(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddSkill(e);
                      }
                    }}
                  />
                  <button type="button" onClick={handleAddSkill} className="btn btn-secondary" style={{ whiteSpace: 'nowrap' }}>
                    <Plus size={16} />
                    <span>Add Skill</span>
                  </button>
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {formData.skills.map((skill, idx) => (
                    <span
                      key={idx}
                      className="skill-tag"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '6px 12px',
                        backgroundColor: '#eff6ff',
                        color: '#1d4ed8',
                        border: '1px solid #bfdbfe',
                        borderRadius: '6px',
                        fontSize: '13px'
                      }}
                    >
                      <span>{skill}</span>
                      <X
                        size={13}
                        style={{ cursor: 'pointer', opacity: 0.8 }}
                        onClick={() => handleRemoveSkill(skill)}
                      />
                    </span>
                  ))}
                  {formData.skills.length === 0 && (
                    <span style={{ color: 'var(--slate-400)', fontSize: '13px' }}>
                      No skills added yet. Type a skill above to add.
                    </span>
                  )}
                </div>
              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '16px 24px',
            borderTop: '1px solid var(--slate-200)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: '12px',
            backgroundColor: 'var(--slate-50)'
          }}
        >
          <button type="button" onClick={onClose} className="btn btn-secondary btn-sm" style={{ padding: '7px 18px' }}>
            Cancel
          </button>
          <button
            type="submit"
            form="candidate-edit-form"
            disabled={saving}
            className="btn btn-primary btn-sm"
            style={{ padding: '7px 18px' }}
          >
            <Save size={15} />
            <span>{saving ? 'Saving...' : 'Save Changes'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
