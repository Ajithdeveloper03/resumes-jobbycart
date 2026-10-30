import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  UploadCloud,
  FileText,
  CheckCircle2,
  AlertTriangle,
  X,
  Plus,
  ArrowRight,
  RefreshCw,
  Sparkles,
  Files,
  Eye,
  Check,
  Save,
  ChevronRight
} from 'lucide-react';
import api from '../api/client';
import CandidateDetailsModal from '../components/CandidateDetailsModal';

export default function UploadResume() {
  const [activeTab, setActiveTab] = useState('single');
  const navigate = useNavigate();

  // Single Upload State
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState(null);
  const [parsedPayload, setParsedPayload] = useState(null);
  const [isDragging, setIsDragging] = useState(false);

  // Bulk Upload State
  const [bulkFiles, setBulkFiles] = useState([]);
  const [bulkUploading, setBulkUploading] = useState(false);
  const [bulkResults, setBulkResults] = useState(null);
  const [savingAllBulk, setSavingAllBulk] = useState(false);

  // Review Modal State
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [isBatchReview, setIsBatchReview] = useState(false);
  const [reviewingBulkIndex, setReviewingBulkIndex] = useState(null);
  const [reviewForm, setReviewForm] = useState({
    full_name: '',
    email: '',
    phone: '',
    current_location: '',
    city: '',
    state: '',
    primary_role: '',
    total_experience_years: '',
    highest_qualification: '',
    degree: '',
    skills: [],
    candidate_status: 'new',
    resume_id: null,
  });
  const [newSkillText, setNewSkillText] = useState('');
  const [savingCandidate, setSavingCandidate] = useState(false);
  const [saveSuccessMessage, setSaveSuccessMessage] = useState(null);
  const [savedCandidateId, setSavedCandidateId] = useState(null);

  // Inspect Modal
  const [inspectCandidateId, setInspectCandidateId] = useState(null);

  const fileInputRef = useRef(null);
  const bulkFileInputRef = useRef(null);

  // Drag and Drop handlers
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleSingleUpload(e.dataTransfer.files[0]);
    }
  };

  // Single File Upload
  const handleSingleUpload = async (file) => {
    if (!file) return;

    const allowed = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/msword'];
    if (!allowed.includes(file.type) && !file.name.match(/\.(pdf|docx|doc)$/i)) {
      setUploadError('Invalid file format. Please upload PDF or Word documents (.pdf, .docx).');
      return;
    }

    setUploading(true);
    setUploadError(null);
    setSaveSuccessMessage(null);
    setUploadProgress(20);

    const formData = new FormData();
    formData.append('resume', file);

    try {
      const res = await api.post('/resumes/upload-parse', formData, {
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(Math.min(90, percentCompleted));
        },
      });

      setUploadProgress(100);

      if (res.data.success) {
        const data = res.data.data;
        const extData = data.extracted_data || {};

        setParsedPayload(data);
        setIsBatchReview(false);
        setReviewingBulkIndex(null);

        setReviewForm({
          full_name: extData.full_name || '',
          email: extData.email || '',
          phone: extData.phone || extData.mobile_number || '',
          current_location: extData.current_location || extData.location || '',
          city: extData.city || '',
          state: extData.state || '',
          primary_role: extData.primary_role || extData.role || '',
          total_experience_years: extData.total_experience_years !== null && extData.total_experience_years !== undefined ? extData.total_experience_years : '',
          highest_qualification: extData.highest_qualification || extData.degree || '',
          degree: extData.degree || extData.highest_qualification || '',
          skills: extData.key_skills || extData.skills?.map((s) => s.skill_name || s) || [],
          candidate_status: 'new',
          resume_id: data.resume_id,
        });

        setShowReviewModal(true);
      }
    } catch (err) {
      setUploadError(err.response?.data?.message || 'Resume text extraction failed. Please try a different resume file.');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  // Bulk Upload
  const handleBulkSelect = (files) => {
    setBulkFiles(files);
  };

  const handleBulkUploadSubmit = async () => {
    if (bulkFiles.length === 0) return;
    setBulkUploading(true);
    setUploadError(null);
    setSaveSuccessMessage(null);

    const formData = new FormData();
    for (let i = 0; i < bulkFiles.length; i++) {
      formData.append('resumes[]', bulkFiles[i]);
    }

    try {
      const res = await api.post('/resumes/bulk-upload-parse', formData);
      if (res.data.success) {
        setBulkResults(res.data);
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Bulk upload and text extraction failed.';
      setUploadError(msg);
      alert(msg);
    } finally {
      setBulkUploading(false);
    }
  };

  // Review Bulk Item
  const handleReviewBulkItem = (item, index) => {
    const extData = item.extracted_data || {};
    setIsBatchReview(true);
    setReviewingBulkIndex(index);

    setReviewForm({
      full_name: extData.full_name || '',
      email: extData.email || '',
      phone: extData.phone || extData.mobile_number || '',
      current_location: extData.current_location || extData.location || '',
      city: extData.city || '',
      state: extData.state || '',
      primary_role: extData.primary_role || extData.role || '',
      total_experience_years: extData.total_experience_years !== null && extData.total_experience_years !== undefined ? extData.total_experience_years : '',
      highest_qualification: extData.highest_qualification || extData.degree || '',
      degree: extData.degree || extData.highest_qualification || '',
      skills: extData.key_skills || extData.skills?.map((s) => s.skill_name || s) || [],
      candidate_status: 'new',
      resume_id: item.resume_id,
    });

    setShowReviewModal(true);
  };

  // Save Candidate from Review Modal
  const handleSaveReview = async (saveAndNext = false) => {
    if (!reviewForm.full_name.trim()) {
      alert('Candidate Full Name is required.');
      return;
    }

    setSavingCandidate(true);
    try {
      const expParsed = parseFloat(reviewForm.total_experience_years);
      const payload = {
        ...reviewForm,
        full_name: reviewForm.full_name.trim(),
        email: reviewForm.email.trim() || null,
        phone: reviewForm.phone.trim() || null,
        current_location: reviewForm.current_location.trim() || null,
        city: reviewForm.city.trim() || null,
        state: reviewForm.state.trim() || null,
        primary_role: reviewForm.primary_role.trim() || null,
        highest_qualification: reviewForm.highest_qualification.trim() || null,
        degree: reviewForm.degree.trim() || null,
        total_experience_years: (!isNaN(expParsed) && expParsed >= 0) ? expParsed : null,
        is_verified: true,
        extraction_status: 'verified',
      };

      const res = await api.post('/candidates', payload);
      if (res.data.success) {
        const savedCandidate = res.data.data;
        setSavedCandidateId(savedCandidate.id);

        // Update bulk item if in batch mode
        if (isBatchReview && bulkResults) {
          setBulkResults((prev) => {
            if (!prev) return prev;
            const updatedItems = [...prev.items];
            const targetIdx = reviewingBulkIndex !== null ? reviewingBulkIndex : updatedItems.findIndex((it) => it.resume_id === reviewForm.resume_id);
            if (targetIdx !== -1) {
              updatedItems[targetIdx] = {
                ...updatedItems[targetIdx],
                is_saved: true,
                candidate_id: savedCandidate.id,
                saved_name: savedCandidate.full_name,
              };
            }
            return { ...prev, items: updatedItems };
          });

          setSaveSuccessMessage(`Candidate "${reviewForm.full_name}" successfully saved!`);

          if (saveAndNext) {
            // Find next un-saved item
            const nextItemIdx = bulkResults.items.findIndex((it, idx) => idx > reviewingBulkIndex && !it.is_saved && it.status === 'success');
            if (nextItemIdx !== -1) {
              handleReviewBulkItem(bulkResults.items[nextItemIdx], nextItemIdx);
              return;
            }
          }

          setShowReviewModal(false);
        } else {
          // Single upload mode
          setShowReviewModal(false);
          setSaveSuccessMessage(`Candidate "${reviewForm.full_name}" successfully saved to database! Opening Dashboard...`);
          setTimeout(() => {
            navigate('/', {
              state: {
                savedSuccessMessage: `Candidate "${reviewForm.full_name}" successfully saved to database!`,
                highlightCandidateId: savedCandidate.id
              }
            });
          }, 600);
        }
      }
    } catch (err) {
      let msg = err.response?.data?.message || 'Failed to save candidate.';
      if (err.response?.data?.errors) {
        const errDetails = Object.values(err.response.data.errors).flat().join(' ');
        if (errDetails) msg = `${msg} (${errDetails})`;
      }
      alert(msg);
    } finally {
      setSavingCandidate(false);
    }
  };

  // Batch Save All Remaining Resumes
  const handleSaveAllBulk = async () => {
    if (!bulkResults || !bulkResults.items) return;
    const pendingItems = bulkResults.items.filter((it) => !it.is_saved && it.status === 'success');
    if (pendingItems.length === 0) {
      alert('All valid candidates in this batch have already been saved.');
      return;
    }

    if (!window.confirm(`Save all ${pendingItems.length} valid candidates into the database now?`)) {
      return;
    }

    setSavingAllBulk(true);
    let savedCount = 0;

    for (let i = 0; i < bulkResults.items.length; i++) {
      const item = bulkResults.items[i];
      if (!item.is_saved && item.status === 'success') {
        const extData = item.extracted_data || {};
        try {
          const rawExp = extData.total_experience_years;
          const expVal = rawExp !== null && rawExp !== undefined && !isNaN(parseFloat(rawExp)) ? parseFloat(rawExp) : null;
          const payload = {
            full_name: (extData.full_name || item.file_name.replace(/\.[^/.]+$/, '')).trim(),
            email: extData.email ? extData.email.trim() : null,
            phone: extData.phone || extData.mobile_number ? (extData.phone || extData.mobile_number).trim() : null,
            current_location: extData.current_location || extData.location ? (extData.current_location || extData.location).trim() : null,
            city: extData.city ? extData.city.trim() : null,
            state: extData.state ? extData.state.trim() : null,
            primary_role: extData.primary_role || extData.role ? (extData.primary_role || extData.role).trim() : null,
            total_experience_years: expVal,
            highest_qualification: extData.highest_qualification || extData.degree ? (extData.highest_qualification || extData.degree).trim() : null,
            degree: extData.degree || extData.highest_qualification ? (extData.degree || extData.highest_qualification).trim() : null,
            skills: extData.key_skills || extData.skills?.map((s) => s.skill_name || s) || [],
            candidate_status: 'new',
            resume_id: item.resume_id,
            is_verified: true,
            extraction_status: 'verified',
          };

          const res = await api.post('/candidates', payload);
          if (res.data.success) {
            item.is_saved = true;
            item.candidate_id = res.data.data.id;
            item.saved_name = res.data.data.full_name;
            savedCount++;
          }
        } catch (e) {
          console.error('Failed to save item:', item.file_name, e);
        }
      }
    }

    setBulkResults({ ...bulkResults });
    setSavingAllBulk(false);
    setSaveSuccessMessage(`Successfully saved ${savedCount} candidates to database!`);
  };

  const handleAddSkillToReview = (e) => {
    e.preventDefault();
    if (newSkillText.trim() && !reviewForm.skills.includes(newSkillText.trim())) {
      setReviewForm((prev) => ({
        ...prev,
        skills: [...prev.skills, newSkillText.trim()],
      }));
      setNewSkillText('');
    }
  };

  const handleRemoveSkillFromReview = (skillToRemove) => {
    setReviewForm((prev) => ({
      ...prev,
      skills: prev.skills.filter((s) => s !== skillToRemove),
    }));
  };

  return (
    <div>
      {/* Top Header */}
      <div className="page-header">
        <div className="page-title">
          <h1>Resume Ingestion & Extraction</h1>
          <p>
            Upload resumes for deterministic information extraction, review candidate data, and save to database
          </p>
        </div>
      </div>

      {/* Success Notification Banner */}
      {saveSuccessMessage && (
        <div
          style={{
            backgroundColor: '#ecfdf5',
            border: '1px solid #a7f3d0',
            color: '#065f46',
            padding: '14px 20px',
            borderRadius: '8px',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '10px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <CheckCircle2 size={18} color="#059669" />
            <span style={{ fontSize: '13.5px', fontWeight: '600' }}>{saveSuccessMessage}</span>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            {savedCandidateId && (
              <button
                onClick={() => setInspectCandidateId(savedCandidateId)}
                className="btn btn-secondary btn-sm"
                style={{ padding: '4px 12px' }}
              >
                <Eye size={13} />
                <span>View Profile</span>
              </button>
            )}
            <button
              onClick={() => navigate('/', {
                state: {
                  savedSuccessMessage: saveSuccessMessage || 'Candidate successfully saved to database!',
                  highlightCandidateId: savedCandidateId
                }
              })}
              className="btn btn-primary btn-sm"
              style={{ padding: '4px 12px' }}
            >
              <span>Go to Dashboard</span>
              <ArrowRight size={13} />
            </button>
          </div>
        </div>
      )}

      {/* Upload Navigation Tabs */}
      <div className="tabs-nav" style={{ marginBottom: '24px' }}>
        <button
          className={`tab-btn ${activeTab === 'single' ? 'active' : ''}`}
          onClick={() => setActiveTab('single')}
        >
          <FileText size={16} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'text-bottom' }} />
          Single Resume Upload
        </button>
        <button
          className={`tab-btn ${activeTab === 'bulk' ? 'active' : ''}`}
          onClick={() => setActiveTab('bulk')}
        >
          <Files size={16} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'text-bottom' }} />
          Bulk Batch Upload
        </button>
      </div>

      {/* TAB 1: Single Upload */}
      {activeTab === 'single' && (
        <div style={{ maxWidth: '820px', margin: '0 auto' }}>
          <div className="card-panel">
            <div className="panel-body" style={{ padding: '36px' }}>
              <div
                className={`dropzone ${isDragging ? 'active' : ''}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  style={{ display: 'none' }}
                  accept=".pdf,.docx,.doc"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleSingleUpload(e.target.files[0]);
                    }
                  }}
                />

                <UploadCloud className="dropzone-icon" />

                <h3 style={{ fontSize: '18px', color: 'var(--slate-800)', marginBottom: '8px' }}>
                  Click or drag and drop resume here
                </h3>
                <p style={{ fontSize: '13.5px', color: 'var(--slate-500)', marginBottom: '16px' }}>
                  Supports PDF and Word DOCX formats (Up to 15MB)
                </p>

                <button
                  type="button"
                  className="btn btn-primary"
                  disabled={uploading}
                >
                  <FileText size={16} />
                  <span>{uploading ? 'Extracting Resume Text...' : 'Select Resume File'}</span>
                </button>
              </div>

              {uploading && (
                <div style={{ marginTop: '24px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '8px' }}>
                    <span style={{ fontWeight: '600' }}>Extracting structured candidate fields...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div style={{ width: '100%', height: '8px', backgroundColor: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ width: `${uploadProgress}%`, height: '100%', backgroundColor: '#2563eb', transition: 'width 0.3s ease' }} />
                  </div>
                </div>
              )}

              {uploadError && (
                <div style={{ marginTop: '20px', padding: '12px 16px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', color: '#991b1b', display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <AlertTriangle size={18} />
                  <span>{uploadError}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Bulk Upload */}
      {activeTab === 'bulk' && (
        <div style={{ maxWidth: '960px', margin: '0 auto' }}>
          <div className="card-panel">
            <div className="panel-body" style={{ padding: '32px' }}>
              <div
                className="dropzone"
                onClick={() => bulkFileInputRef.current?.click()}
              >
                <input
                  type="file"
                  multiple
                  ref={bulkFileInputRef}
                  style={{ display: 'none' }}
                  accept=".pdf,.docx,.doc"
                  onChange={(e) => {
                    if (e.target.files) {
                      handleBulkSelect(Array.from(e.target.files));
                    }
                  }}
                />
                <Files className="dropzone-icon" />
                <h3 style={{ fontSize: '18px', color: 'var(--slate-800)', marginBottom: '6px' }}>
                  Select multiple resumes for batch processing
                </h3>
                <p style={{ fontSize: '13px', color: 'var(--slate-500)', marginBottom: '14px' }}>
                  Upload multiple resumes simultaneously. Review and save each candidate into the database.
                </p>
                <button type="button" className="btn btn-secondary">
                  <span>Browse Resumes</span>
                </button>
              </div>

              {bulkFiles.length > 0 && !bulkResults && (
                <div style={{ marginTop: '24px' }}>
                  <h4 style={{ fontSize: '14px', marginBottom: '12px' }}>
                    {bulkFiles.length} Resumes Selected Ready to Process
                  </h4>
                  <div style={{ maxHeight: '180px', overflowY: 'auto', border: '1px solid var(--slate-200)', borderRadius: '8px', padding: '10px' }}>
                    {bulkFiles.map((f, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', padding: '6px 8px', borderBottom: '1px solid var(--slate-100)' }}>
                        <span>{f.name}</span>
                        <span style={{ color: 'var(--slate-500)' }}>{(f.size / 1024).toFixed(1)} KB</span>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={handleBulkUploadSubmit}
                    disabled={bulkUploading}
                    className="btn btn-primary"
                    style={{ marginTop: '16px' }}
                  >
                    {bulkUploading ? 'Batch Parsing Resumes...' : 'Process All Resumes'}
                  </button>
                </div>
              )}

              {/* Bulk Results Table */}
              {bulkResults && (
                <div style={{ marginTop: '28px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
                    <div>
                      <h4 style={{ margin: 0, fontSize: '16px', fontWeight: '700' }}>Batch Ingestion Results</h4>
                      <p style={{ margin: '2px 0 0 0', fontSize: '12.5px', color: 'var(--slate-500)' }}>
                        {bulkResults.summary.successful} Successful • {bulkResults.summary.failed} Failed •{' '}
                        {bulkResults.items.filter((it) => it.is_saved).length} Saved to Database
                      </p>
                    </div>

                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={handleSaveAllBulk}
                        disabled={savingAllBulk || bulkResults.items.every((it) => it.is_saved || it.status !== 'success')}
                        className="btn btn-primary btn-sm"
                      >
                        <Save size={14} />
                        <span>{savingAllBulk ? 'Saving All...' : 'Save All Valid Resumes'}</span>
                      </button>

                      <button
                        onClick={() => {
                          setBulkFiles([]);
                          setBulkResults(null);
                        }}
                        className="btn btn-secondary btn-sm"
                      >
                        Upload New Batch
                      </button>
                    </div>
                  </div>

                  <div className="table-responsive">
                    <table className="custom-table">
                      <thead>
                        <tr>
                          <th>Filename</th>
                          <th>Status</th>
                          <th>Extracted Candidate</th>
                          <th>Role</th>
                          <th>Location</th>
                          <th style={{ textAlign: 'right' }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {bulkResults.items.map((item, idx) => (
                          <tr key={idx}>
                            <td>
                              <strong>{item.file_name}</strong>
                            </td>
                            <td>
                              {item.is_saved ? (
                                <span className="badge badge-verified" style={{ fontSize: '11.5px' }}>
                                  ✓ Saved
                                </span>
                              ) : item.status === 'success' ? (
                                <span className="badge badge-new" style={{ fontSize: '11.5px' }}>
                                  Awaiting Review
                                </span>
                              ) : (
                                <span className="badge badge-rejected" style={{ fontSize: '11.5px' }}>
                                  Failed
                                </span>
                              )}
                            </td>
                            <td>
                              <div style={{ fontWeight: '600', color: 'var(--slate-800)' }}>
                                {item.is_saved ? item.saved_name : (item.extracted_data?.full_name || '—')}
                              </div>
                              <div style={{ fontSize: '12px', color: 'var(--slate-500)' }}>
                                {item.extracted_data?.email || ''}
                              </div>
                            </td>
                            <td>
                              <span style={{ fontWeight: '500' }}>
                                {item.extracted_data?.primary_role || '—'}
                              </span>
                            </td>
                            <td>
                              <span>{item.extracted_data?.current_location || '—'}</span>
                            </td>
                            <td style={{ textAlign: 'right' }}>
                              {item.is_saved ? (
                                <button
                                  onClick={() => setInspectCandidateId(item.candidate_id)}
                                  className="btn btn-secondary btn-sm"
                                  style={{ padding: '4px 10px' }}
                                >
                                  <Eye size={13} />
                                  <span>View Profile</span>
                                </button>
                              ) : item.status === 'success' ? (
                                <button
                                  onClick={() => handleReviewBulkItem(item, idx)}
                                  className="btn btn-primary btn-sm"
                                  style={{ padding: '4px 12px' }}
                                >
                                  <span>Review & Save</span>
                                  <ChevronRight size={13} />
                                </button>
                              ) : (
                                <span style={{ color: '#dc2626', fontSize: '12px' }}>Extraction Error</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Review & Edit Modal (Strictly the 8 fields with perfect alignment) */}
      {showReviewModal && (
        <div className="modal-overlay" style={{ zIndex: 1100 }}>
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
          >
            {/* Modal Header */}
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
                  Review Extracted Candidate Data
                </h3>
                <p style={{ margin: '2px 0 0 0', fontSize: '12.5px', color: 'var(--slate-500)' }}>
                  Verify the extracted information before saving to the database
                </p>
              </div>
              <button
                onClick={() => setShowReviewModal(false)}
                className="btn btn-icon btn-secondary btn-sm"
                style={{ borderRadius: '50%', width: '32px', height: '32px' }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                {/* Row 1: Name, Email, Phone */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Full Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="Candidate's full name"
                      className="form-control"
                      value={reviewForm.full_name}
                      onChange={(e) => setReviewForm({ ...reviewForm, full_name: e.target.value })}
                    />
                  </div>

                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Email Address</label>
                    <input
                      type="email"
                      placeholder="e.g. candidate@example.com"
                      className="form-control"
                      value={reviewForm.email}
                      onChange={(e) => setReviewForm({ ...reviewForm, email: e.target.value })}
                    />
                  </div>

                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Mobile Number</label>
                    <input
                      type="text"
                      placeholder="e.g. +91 98765 43210"
                      className="form-control"
                      value={reviewForm.phone}
                      onChange={(e) => setReviewForm({ ...reviewForm, phone: e.target.value })}
                    />
                  </div>
                </div>

                {/* Row 2: Location, Role, Experience */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Location</label>
                    <input
                      type="text"
                      placeholder="e.g. Chennai, Tamil Nadu"
                      className="form-control"
                      value={reviewForm.current_location}
                      onChange={(e) => {
                        const val = e.target.value;
                        setReviewForm({
                          ...reviewForm,
                          current_location: val,
                          city: val.includes(',') ? val.split(',')[0].trim() : val,
                        });
                      }}
                    />
                  </div>

                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Role / Title</label>
                    <input
                      type="text"
                      placeholder="e.g. Full Stack Developer"
                      className="form-control"
                      value={reviewForm.primary_role}
                      onChange={(e) => setReviewForm({ ...reviewForm, primary_role: e.target.value })}
                    />
                  </div>

                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Total Experience (Years)</label>
                    <input
                      type="number"
                      step="0.1"
                      placeholder="e.g. 4.5"
                      className="form-control"
                      value={reviewForm.total_experience_years}
                      onChange={(e) => setReviewForm({ ...reviewForm, total_experience_years: e.target.value })}
                    />
                  </div>
                </div>

                {/* Row 3: Education & Status */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Education / Degree</label>
                    <input
                      type="text"
                      placeholder="e.g. B.Tech in Information Technology"
                      className="form-control"
                      value={reviewForm.highest_qualification}
                      onChange={(e) => setReviewForm({ ...reviewForm, highest_qualification: e.target.value, degree: e.target.value })}
                    />
                  </div>

                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Candidate Status</label>
                    <select
                      className="form-control"
                      value={reviewForm.candidate_status}
                      onChange={(e) => setReviewForm({ ...reviewForm, candidate_status: e.target.value })}
                    >
                      <option value="new">New Candidate</option>
                      <option value="screening">Screening</option>
                      <option value="shortlisted">Shortlisted</option>
                      <option value="interviewing">Interviewing</option>
                      <option value="offered">Offered</option>
                      <option value="hired">Hired</option>
                      <option value="rejected">Rejected</option>
                    </select>
                  </div>
                </div>

                {/* Row 4: Key Skills Editor */}
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">
                    Key Skills & Technologies ({reviewForm.skills.length})
                  </label>
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
                    <input
                      type="text"
                      placeholder="Add a key skill (e.g. React, PHP, MySQL)..."
                      className="form-control"
                      value={newSkillText}
                      onChange={(e) => setNewSkillText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddSkillToReview(e);
                        }
                      }}
                    />
                    <button type="button" onClick={handleAddSkillToReview} className="btn btn-secondary" style={{ whiteSpace: 'nowrap' }}>
                      <Plus size={16} />
                      <span>Add</span>
                    </button>
                  </div>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {reviewForm.skills.map((skill, idx) => (
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
                          onClick={() => handleRemoveSkillFromReview(skill)}
                        />
                      </span>
                    ))}
                    {reviewForm.skills.length === 0 && (
                      <span style={{ color: 'var(--slate-400)', fontSize: '13px' }}>
                        No skills listed. Type a skill name and click Add.
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
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
              <button
                type="button"
                onClick={() => setShowReviewModal(false)}
                className="btn btn-secondary btn-sm"
                style={{ padding: '7px 16px' }}
              >
                Cancel
              </button>

              {isBatchReview && (
                <button
                  type="button"
                  disabled={savingCandidate}
                  onClick={() => handleSaveReview(true)}
                  className="btn btn-secondary btn-sm"
                  style={{ padding: '7px 16px', borderColor: '#2563eb', color: '#2563eb' }}
                >
                  <span>Save & Review Next</span>
                  <ChevronRight size={14} />
                </button>
              )}

              <button
                type="button"
                disabled={savingCandidate}
                onClick={() => handleSaveReview(false)}
                className="btn btn-primary btn-sm"
                style={{ padding: '7px 18px' }}
              >
                <Save size={15} />
                <span>{savingCandidate ? 'Saving Candidate...' : 'Save & Verify Candidate'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Profile Details Modal (Inspection) */}
      {inspectCandidateId && (
        <CandidateDetailsModal
          candidateId={inspectCandidateId}
          onClose={() => setInspectCandidateId(null)}
          onUpdated={() => {}}
        />
      )}
    </div>
  );
}
