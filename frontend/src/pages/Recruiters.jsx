import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  UserPlus,
  Mail,
  Phone,
  CheckCircle2,
  XCircle,
  X,
  UserCheck
} from 'lucide-react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function Recruiters() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // New Recruiter Modal
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: 'password123',
    role: 'recruiter',
    phone: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/recruiters');
      if (res.data.success) {
        setUsers(res.data.data);
      }
    } catch (e) {
      alert('Failed to load team members.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleToggleActive = async (user) => {
    if (user.id === currentUser?.id) {
      alert('You cannot deactivate your own account.');
      return;
    }

    try {
      const res = await api.patch(`/recruiters/${user.id}/toggle-active`);
      if (res.data.success) {
        fetchUsers();
      }
    } catch (e) {
      alert('Failed to update status.');
    }
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const res = await api.post('/recruiters', form);
      if (res.data.success) {
        setShowModal(false);
        setForm({
          name: '',
          email: '',
          password: 'password123',
          role: 'recruiter',
          phone: '',
        });
        fetchUsers();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create user account.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-title">
          <h1>Team & Recruiter Management</h1>
          <p>Manage recruiters, administrators, and candidate assignment permissions</p>
        </div>
        <div className="page-actions">
          <button onClick={() => setShowModal(true)} className="btn btn-primary">
            <UserPlus size={16} />
            <span>Create New User</span>
          </button>
        </div>
      </div>

      <div className="card-panel">
        <div className="table-responsive">
          <table className="custom-table">
            <thead>
              <tr>
                <th>User Details</th>
                <th>Role</th>
                <th>Contact</th>
                <th>Assigned Profiles</th>
                <th>Account Status</th>
                <th>Created At</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: 'var(--slate-500)' }}>
                    Loading staff members...
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div className="user-avatar" style={{ width: '36px', height: '36px' }}>
                          {u.name?.charAt(0) || 'U'}
                        </div>
                        <div>
                          <div style={{ fontWeight: '600', color: 'var(--slate-900)' }}>
                            {u.name} {u.id === currentUser?.id && '(You)'}
                          </div>
                          <div style={{ fontSize: '12px', color: 'var(--slate-500)' }}>{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${u.role === 'admin' ? 'badge-new' : 'badge-shortlisted'}`} style={{ textTransform: 'uppercase' }}>
                        {u.role}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontSize: '13px' }}>{u.phone || '—'}</span>
                    </td>
                    <td>
                      <span style={{ fontWeight: '600', color: 'var(--slate-800)' }}>
                        {u.assigned_candidates_count || 0} Candidates
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${u.is_active ? 'badge-verified' : 'badge-rejected'}`}>
                        {u.is_active ? 'Active' : 'Deactivated'}
                      </span>
                    </td>
                    <td style={{ fontSize: '12.5px', color: 'var(--slate-500)' }}>
                      {new Date(u.created_at).toLocaleDateString()}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      {u.id !== currentUser?.id && (
                        <button
                          onClick={() => handleToggleActive(u)}
                          className={`btn ${u.is_active ? 'btn-secondary' : 'btn-primary'} btn-sm`}
                        >
                          {u.is_active ? 'Deactivate' : 'Activate'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create User Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Create Recruiter / Admin Account</h3>
              <button onClick={() => setShowModal(false)} className="btn btn-icon btn-secondary btn-sm">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
              <div className="modal-body">
                {error && (
                  <div style={{ backgroundColor: '#fff1f2', color: '#be123c', padding: '12px', borderRadius: '8px', marginBottom: '14px', fontSize: '13px' }}>
                    {error}
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label">Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Rahul Sharma"
                    className="form-control"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Email Address *</label>
                  <input
                    type="email"
                    required
                    placeholder="rahul@inymart.com"
                    className="form-control"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                  />
                </div>

                <div className="form-grid-2">
                  <div className="form-group">
                    <label className="form-label">Role *</label>
                    <select
                      className="form-control"
                      value={form.role}
                      onChange={(e) => setForm({ ...form, role: e.target.value })}
                    >
                      <option value="recruiter">Recruiter</option>
                      <option value="admin">Administrator</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Phone Number</label>
                    <input
                      type="text"
                      placeholder="+91 98765 00000"
                      className="form-control"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Temporary Password *</label>
                  <input
                    type="password"
                    required
                    className="form-control"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" disabled={submitting} className="btn btn-primary">
                  {submitting ? 'Creating User...' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
