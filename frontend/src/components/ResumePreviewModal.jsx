import React, { useState, useEffect } from 'react';
import {
  FileText,
  Download,
  ExternalLink,
  X,
  Eye,
  AlertCircle,
  Copy,
  Check,
  Search,
  Maximize2,
  Minimize2,
  Briefcase,
  GraduationCap,
  Sparkles,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Building,
  RefreshCw
} from 'lucide-react';
import api, { getDownloadUrl, downloadResumeFile, fetchResumeBlob } from '../api/client';

export default function ResumePreviewModal({ resumeId, candidate, initialResume, onClose }) {
  const [resume, setResume] = useState(initialResume || null);
  const [loading, setLoading] = useState(!initialResume?.text_content);
  const [blobUrl, setBlobUrl] = useState(null);
  const [blobLoading, setBlobLoading] = useState(true);
  const [blobError, setBlobError] = useState(null);
  const [activeTab, setActiveTab] = useState('document'); // 'document' | 'formatted' | 'text'
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState(null);
  const [textSearch, setTextSearch] = useState('');
  const [copied, setCopied] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Load resume details if not provided
  useEffect(() => {
    let isMounted = true;
    if (resumeId) {
      setLoading(true);
      api.get(`/resumes/${resumeId}`)
        .then((res) => {
          if (isMounted && res.data.success) {
            setResume(res.data.data);
          }
        })
        .catch((err) => {
          console.error('Failed to load resume details:', err);
        })
        .finally(() => {
          if (isMounted) setLoading(false);
        });
    }
    return () => {
      isMounted = false;
    };
  }, [resumeId]);

  // Load preview blob for PDF files
  useEffect(() => {
    let activeBlob = null;
    let isMounted = true;

    if (resumeId) {
      setBlobLoading(true);
      setBlobError(null);

      fetchResumeBlob(resumeId)
        .then((result) => {
          if (isMounted) {
            activeBlob = result;
            setBlobUrl(result.blobUrl);
            setBlobLoading(false);
          } else {
            result.revoke();
          }
        })
        .catch((err) => {
          console.warn('Inline blob fetch error, falling back to direct URL:', err);
          if (isMounted) {
            setBlobError(err.message || 'Could not load inline document stream');
            setBlobLoading(false);
          }
        });
    }

    return () => {
      isMounted = false;
      if (activeBlob) {
        activeBlob.revoke();
      }
    };
  }, [resumeId]);

  const filename = resume?.original_filename || 'resume.pdf';
  const extension = filename.split('.').pop().toLowerCase();
  const isPdf = extension === 'pdf';
  const isDocx = extension === 'docx' || extension === 'doc';

  // Automatically default to formatted view if file is docx and document preview isn't available
  useEffect(() => {
    if (isDocx && activeTab === 'document') {
      setActiveTab('formatted');
    }
  }, [isDocx]);

  const handleDownload = async () => {
    if (!resumeId) return;
    setDownloading(true);
    setDownloadError(null);
    try {
      await downloadResumeFile(resumeId, filename);
    } catch (err) {
      setDownloadError(err.message || 'Failed to download resume file.');
    } finally {
      setDownloading(false);
    }
  };

  const handleOpenInNewTab = () => {
    const url = getDownloadUrl(`resumes/${resumeId}/preview`);
    window.open(url, '_blank');
  };

  const handleCopyText = () => {
    const text = resume?.text_content || '';
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Structured extraction data
  const extracted = resume?.extracted_json || {};
  const cand = candidate || resume?.candidate;

  // Filtered raw text lines
  const rawText = resume?.text_content || '';
  const textMatches = textSearch.trim()
    ? (rawText.match(new RegExp(textSearch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi')) || []).length
    : 0;

  return (
    <div
      className="modal-overlay"
      onClick={onClose}
      style={{
        zIndex: 1100,
        backgroundColor: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: isFullscreen ? '0' : '16px'
      }}
    >
      <div
        className="modal-content"
        style={{
          width: isFullscreen ? '100vw' : '96%',
          maxWidth: isFullscreen ? '100vw' : '1080px',
          height: isFullscreen ? '100vh' : '92vh',
          maxHeight: isFullscreen ? '100vh' : '92vh',
          borderRadius: isFullscreen ? '0' : '14px',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#ffffff',
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.35)',
          overflow: 'hidden',
          transition: 'all 0.2s ease-in-out'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '14px 20px',
            borderBottom: '1px solid var(--slate-200)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: '#ffffff',
            gap: '12px',
            flexWrap: 'wrap'
          }}
        >
          {/* File & Candidate Info */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: '220px', flex: '1 1 auto' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '10px',
                backgroundColor: isPdf ? '#eff6ff' : isDocx ? '#f0fdf4' : '#f8fafc',
                color: isPdf ? '#2563eb' : isDocx ? '#16a34a' : 'var(--slate-700)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: `1px solid ${isPdf ? '#bfdbfe' : isDocx ? '#bbf7d0' : 'var(--slate-200)'}`,
                flexShrink: 0
              }}
            >
              <FileText size={22} />
            </div>

            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <h3
                  style={{
                    margin: 0,
                    fontSize: '16px',
                    fontWeight: '700',
                    color: 'var(--slate-900)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    maxWidth: '380px'
                  }}
                  title={filename}
                >
                  {filename}
                </h3>
                <span
                  style={{
                    fontSize: '10.5px',
                    fontWeight: '700',
                    textTransform: 'uppercase',
                    padding: '2px 7px',
                    borderRadius: '4px',
                    backgroundColor: isPdf ? '#dbeafe' : isDocx ? '#dcfce7' : '#f1f5f9',
                    color: isPdf ? '#1e40af' : isDocx ? '#166534' : 'var(--slate-700)'
                  }}
                >
                  {extension || 'FILE'}
                </span>
                {resume?.file_size && (
                  <span style={{ fontSize: '12px', color: 'var(--slate-500)' }}>
                    • {(resume.file_size / 1024).toFixed(1)} KB
                  </span>
                )}
              </div>

              <div style={{ fontSize: '12.5px', color: 'var(--slate-500)', marginTop: '2px' }}>
                {cand?.full_name ? (
                  <span>Candidate: <strong style={{ color: 'var(--slate-800)' }}>{cand.full_name}</strong> {cand.primary_role ? `(${cand.primary_role})` : ''}</span>
                ) : (
                  <span>Unlinked resume repository file</span>
                )}
              </div>
            </div>
          </div>

          {/* Action Toolbar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
            {downloadError && (
              <span style={{ fontSize: '12px', color: '#dc2626', marginRight: '6px' }}>
                {downloadError}
              </span>
            )}

            <button
              onClick={handleOpenInNewTab}
              className="btn btn-secondary btn-sm"
              style={{ padding: '6px 12px', fontSize: '12.5px', display: 'flex', alignItems: 'center', gap: '6px' }}
              title="Open document in a new browser tab"
            >
              <ExternalLink size={14} />
              <span>Open in New Tab</span>
            </button>

            <button
              onClick={handleDownload}
              disabled={downloading}
              className="btn btn-primary btn-sm"
              style={{ padding: '6px 14px', fontSize: '12.5px', display: 'flex', alignItems: 'center', gap: '6px' }}
              title="Download file directly to computer"
            >
              {downloading ? (
                <>
                  <RefreshCw size={14} className="spin-animation" />
                  <span>Downloading...</span>
                </>
              ) : (
                <>
                  <Download size={14} />
                  <span>Download Resume</span>
                </>
              )}
            </button>

            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="btn btn-icon btn-secondary btn-sm"
              title={isFullscreen ? 'Restore standard view' : 'Expand full window'}
              style={{ width: '32px', height: '32px' }}
            >
              {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            </button>

            <button
              onClick={onClose}
              className="btn btn-icon btn-secondary btn-sm"
              title="Close viewer"
              style={{ width: '32px', height: '32px', borderRadius: '50%' }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* View Switcher Tabs */}
        <div
          style={{
            padding: '0 20px',
            backgroundColor: '#ffffff',
            borderBottom: '1px solid var(--slate-200)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px'
          }}
        >
          <div style={{ display: 'flex', gap: '20px' }}>
            <button
              onClick={() => setActiveTab('document')}
              style={{
                padding: '11px 4px',
                border: 'none',
                background: 'none',
                fontSize: '13.5px',
                fontWeight: '600',
                color: activeTab === 'document' ? '#2563eb' : 'var(--slate-600)',
                borderBottom: activeTab === 'document' ? '2px solid #2563eb' : '2px solid transparent',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <FileText size={15} />
              <span>Original Document</span>
              {isDocx && (
                <span style={{ fontSize: '10px', backgroundColor: '#fef3c7', color: '#92400e', padding: '1px 5px', borderRadius: '4px' }}>
                  Word
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('formatted')}
              style={{
                padding: '11px 4px',
                border: 'none',
                background: 'none',
                fontSize: '13.5px',
                fontWeight: '600',
                color: activeTab === 'formatted' ? '#2563eb' : 'var(--slate-600)',
                borderBottom: activeTab === 'formatted' ? '2px solid #2563eb' : '2px solid transparent',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <Sparkles size={15} />
              <span>Formatted Resume View</span>
            </button>

            <button
              onClick={() => setActiveTab('text')}
              style={{
                padding: '11px 4px',
                border: 'none',
                background: 'none',
                fontSize: '13.5px',
                fontWeight: '600',
                color: activeTab === 'text' ? '#2563eb' : 'var(--slate-600)',
                borderBottom: activeTab === 'text' ? '2px solid #2563eb' : '2px solid transparent',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <Eye size={15} />
              <span>Extracted Text</span>
            </button>
          </div>

          {/* Quick Tab Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '6px 0' }}>
            {activeTab === 'text' && (
              <>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <Search size={14} style={{ position: 'absolute', left: '9px', color: 'var(--slate-400)' }} />
                  <input
                    type="text"
                    placeholder="Find in text..."
                    value={textSearch}
                    onChange={(e) => setTextSearch(e.target.value)}
                    style={{
                      padding: '5px 10px 5px 28px',
                      fontSize: '12px',
                      borderRadius: '6px',
                      border: '1px solid var(--slate-300)',
                      width: '160px',
                      outline: 'none'
                    }}
                  />
                  {textSearch && (
                    <span style={{ fontSize: '11px', color: 'var(--slate-500)', marginLeft: '6px', whiteSpace: 'nowrap' }}>
                      {textMatches} match{textMatches === 1 ? '' : 'es'}
                    </span>
                  )}
                </div>

                <button
                  onClick={handleCopyText}
                  className="btn btn-secondary btn-sm"
                  style={{ padding: '5px 10px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '5px' }}
                  title="Copy extracted text to clipboard"
                >
                  {copied ? <Check size={13} color="#16a34a" /> : <Copy size={13} />}
                  <span>{copied ? 'Copied' : 'Copy Text'}</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Modal Main Viewport */}
        <div style={{ flex: 1, overflowY: 'auto', backgroundColor: '#f1f5f9', position: 'relative' }}>
          {/* ================= 1. ORIGINAL DOCUMENT VIEW ================= */}
          {activeTab === 'document' && (
            <div style={{ width: '100%', height: '100%', minHeight: '450px', display: 'flex', flexDirection: 'column' }}>
              {isDocx ? (
                // DOCX notice banner with fallback to Formatted View
                <div style={{ padding: '24px', maxWidth: '760px', margin: '40px auto', textAlign: 'center' }}>
                  <div
                    style={{
                      backgroundColor: '#ffffff',
                      borderRadius: '12px',
                      padding: '36px 30px',
                      border: '1px solid var(--slate-200)',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)'
                    }}
                  >
                    <div
                      style={{
                        width: '56px',
                        height: '56px',
                        borderRadius: '50%',
                        backgroundColor: '#f0fdf4',
                        color: '#16a34a',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 16px',
                        border: '1px solid #bbf7d0'
                      }}
                    >
                      <FileText size={28} />
                    </div>
                    <h3 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--slate-900)', marginBottom: '8px' }}>
                      Microsoft Word Document ({extension.toUpperCase()})
                    </h3>
                    <p style={{ fontSize: '14px', color: 'var(--slate-600)', marginBottom: '22px', lineHeight: '1.5' }}>
                      Web browsers cannot render binary Microsoft Word files (.docx) inline natively. You can download the original file to view it in Microsoft Word / Office, or view the parsed structured resume right here.
                    </p>

                    <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
                      <button
                        onClick={handleDownload}
                        disabled={downloading}
                        className="btn btn-primary"
                        style={{ padding: '8px 20px', display: 'flex', alignItems: 'center', gap: '8px' }}
                      >
                        <Download size={16} />
                        <span>Download {filename}</span>
                      </button>

                      <button
                        onClick={() => setActiveTab('formatted')}
                        className="btn btn-secondary"
                        style={{ padding: '8px 20px', display: 'flex', alignItems: 'center', gap: '8px' }}
                      >
                        <Sparkles size={16} />
                        <span>View Formatted Resume</span>
                      </button>
                    </div>
                  </div>
                </div>
              ) : blobLoading ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '12px', color: 'var(--slate-500)' }}>
                  <RefreshCw size={28} className="spin-animation" color="#2563eb" />
                  <span style={{ fontSize: '14px' }}>Loading document stream...</span>
                </div>
              ) : (
                <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
                  {/* Native PDF Viewer via Blob URL or Authenticated Direct URL */}
                  <iframe
                    src={blobUrl || getDownloadUrl(`resumes/${resumeId}/preview`)}
                    title={filename}
                    style={{
                      width: '100%',
                      height: '100%',
                      border: 'none',
                      backgroundColor: '#525659',
                      flex: 1
                    }}
                  />
                </div>
              )}
            </div>
          )}

          {/* ================= 2. FORMATTED RESUME VIEW ================= */}
          {activeTab === 'formatted' && (
            <div style={{ padding: '24px 20px', display: 'flex', justifyContent: 'center' }}>
              <div
                style={{
                  width: '100%',
                  maxWidth: '850px',
                  backgroundColor: '#ffffff',
                  borderRadius: '12px',
                  border: '1px solid var(--slate-200)',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
                  overflow: 'hidden'
                }}
              >
                {/* Resume Header / Banner */}
                <div
                  style={{
                    padding: '28px 32px',
                    backgroundColor: 'var(--slate-900)',
                    color: '#ffffff'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
                    <div>
                      <h1 style={{ fontSize: '24px', fontWeight: '800', margin: '0 0 6px 0', color: '#ffffff' }}>
                        {cand?.full_name || extracted.full_name || extracted.candidate_name || 'Candidate Resume'}
                      </h1>
                      <div style={{ fontSize: '15px', color: '#93c5fd', fontWeight: '600' }}>
                        {cand?.primary_role || extracted.primary_role || extracted.role || extracted.target_role || cand?.current_title || extracted.current_title || 'Professional Profile'}
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px', color: '#cbd5e1' }}>
                      {(cand?.email || extracted.email) && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <Mail size={14} color="#60a5fa" />
                          <span>{cand?.email || extracted.email}</span>
                        </div>
                      )}
                      {(cand?.phone || extracted.phone || extracted.mobile_number) && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <Phone size={14} color="#60a5fa" />
                          <span>{cand?.phone || extracted.phone || extracted.mobile_number}</span>
                        </div>
                      )}
                      {(cand?.current_location || cand?.city || cand?.location || extracted.current_location || extracted.location || extracted.city) && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <MapPin size={14} color="#60a5fa" />
                          <span>{cand?.current_location || cand?.city || cand?.location || extracted.current_location || extracted.location || extracted.city}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div style={{ padding: '28px 32px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  {/* Summary */}
                  {(cand?.professional_summary || extracted.professional_summary || extracted.summary) && (
                    <div>
                      <h3
                        style={{
                          fontSize: '14px',
                          fontWeight: '700',
                          textTransform: 'uppercase',
                          color: '#2563eb',
                          letterSpacing: '0.05em',
                          borderBottom: '2px solid #eff6ff',
                          paddingBottom: '6px',
                          marginBottom: '10px'
                        }}
                      >
                        Professional Summary
                      </h3>
                      <p style={{ fontSize: '13.5px', color: 'var(--slate-700)', lineHeight: '1.6', margin: 0 }}>
                        {cand?.professional_summary || extracted.professional_summary || extracted.summary}
                      </p>
                    </div>
                  )}

                  {/* Skills Grid */}
                  {((cand?.skills && cand.skills.length > 0) || (extracted.key_skills && extracted.key_skills.length > 0) || (extracted.skills && extracted.skills.length > 0)) && (
                    <div>
                      <h3
                        style={{
                          fontSize: '14px',
                          fontWeight: '700',
                          textTransform: 'uppercase',
                          color: '#2563eb',
                          letterSpacing: '0.05em',
                          borderBottom: '2px solid #eff6ff',
                          paddingBottom: '6px',
                          marginBottom: '10px'
                        }}
                      >
                        Skills & Expertise
                      </h3>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        {((cand?.skills && cand.skills.length > 0 ? cand.skills : null) || (extracted.key_skills && extracted.key_skills.length > 0 ? extracted.key_skills : null) || extracted.skills || []).map((skill, idx) => {
                          const name = typeof skill === 'string' ? skill : skill.skill_name;
                          return (
                            <span
                              key={idx}
                              style={{
                                padding: '4px 10px',
                                fontSize: '12px',
                                fontWeight: '600',
                                backgroundColor: '#eff6ff',
                                color: '#1d4ed8',
                                border: '1px solid #bfdbfe',
                                borderRadius: '6px'
                              }}
                            >
                              {name}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Work Experience */}
                  {((cand?.employment_history && cand.employment_history.length > 0) || (extracted.employment_history && extracted.employment_history.length > 0) || (extracted.work_experience && extracted.work_experience.length > 0)) && (
                    <div>
                      <h3
                        style={{
                          fontSize: '14px',
                          fontWeight: '700',
                          textTransform: 'uppercase',
                          color: '#2563eb',
                          letterSpacing: '0.05em',
                          borderBottom: '2px solid #eff6ff',
                          paddingBottom: '6px',
                          marginBottom: '14px'
                        }}
                      >
                        Work Experience
                      </h3>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {((cand?.employment_history && cand.employment_history.length > 0 ? cand.employment_history : null) || (extracted.employment_history && extracted.employment_history.length > 0 ? extracted.employment_history : null) || extracted.work_experience || []).map((exp, idx) => (
                          <div
                            key={idx}
                            style={{
                              padding: '14px',
                              backgroundColor: '#f8fafc',
                              borderRadius: '8px',
                              border: '1px solid var(--slate-200)'
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '6px' }}>
                              <div>
                                <h4 style={{ margin: '0 0 2px 0', fontSize: '14px', fontWeight: '700', color: 'var(--slate-900)' }}>
                                  {exp.job_title || exp.role || 'Position'}
                                </h4>
                                <div style={{ fontSize: '13px', color: '#2563eb', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                  <Building size={13} />
                                  <span>{exp.company_name || exp.company || 'Company'}</span>
                                  {exp.location && <span>• {exp.location}</span>}
                                </div>
                              </div>

                              <div style={{ fontSize: '12px', color: 'var(--slate-500)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <Calendar size={12} />
                                <span>
                                  {exp.start_date || 'Start'} — {exp.is_current ? 'Present' : exp.end_date || 'End'}
                                </span>
                              </div>
                            </div>

                            {(exp.responsibilities || exp.description) && (
                              <p style={{ margin: '10px 0 0 0', fontSize: '13px', color: 'var(--slate-600)', lineHeight: '1.5', whiteSpace: 'pre-wrap' }}>
                                {exp.responsibilities || exp.description}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Education */}
                  {((cand?.education && cand.education.length > 0) || (cand?.educations && cand.educations.length > 0) || (extracted.education && extracted.education.length > 0) || cand?.highest_qualification || cand?.degree || extracted.highest_qualification || extracted.degree) && (
                    <div>
                      <h3
                        style={{
                          fontSize: '14px',
                          fontWeight: '700',
                          textTransform: 'uppercase',
                          color: '#2563eb',
                          letterSpacing: '0.05em',
                          borderBottom: '2px solid #eff6ff',
                          paddingBottom: '6px',
                          marginBottom: '14px'
                        }}
                      >
                        Education & Qualifications
                      </h3>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '12px' }}>
                        {(() => {
                          const eduItems = (cand?.education && cand.education.length > 0 ? cand.education : null)
                            || (cand?.educations && cand.educations.length > 0 ? cand.educations : null)
                            || (extracted.education && extracted.education.length > 0 ? extracted.education : null)
                            || (cand?.highest_qualification || cand?.degree || extracted.highest_qualification || extracted.degree
                              ? [{
                                  degree: cand?.highest_qualification || cand?.degree || extracted.highest_qualification || extracted.degree,
                                  specialization: cand?.specialization || extracted.specialization
                                }]
                              : []);
                          return eduItems.map((edu, idx) => (
                            <div
                              key={idx}
                              style={{
                                padding: '12px 14px',
                                backgroundColor: '#f8fafc',
                                borderRadius: '8px',
                                border: '1px solid var(--slate-200)'
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#2563eb', marginBottom: '4px' }}>
                                <GraduationCap size={15} />
                                <strong style={{ fontSize: '13.5px', color: 'var(--slate-900)' }}>
                                  {edu.degree_name || edu.degree || 'Degree / Diploma'}
                                  {edu.specialization ? ` (${edu.specialization})` : ''}
                                </strong>
                              </div>
                              {(edu.institution_name || edu.institution) && (
                                <div style={{ fontSize: '12.5px', color: 'var(--slate-600)' }}>
                                  {edu.institution_name || edu.institution}
                                </div>
                              )}
                              {(edu.year_of_passing || edu.graduation_year) && (
                                <div style={{ fontSize: '11.5px', color: 'var(--slate-500)', marginTop: '4px' }}>
                                  Class of {edu.year_of_passing || edu.graduation_year}
                                </div>
                              )}
                            </div>
                          ));
                        })()}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ================= 3. EXTRACTED PLAIN TEXT VIEW ================= */}
          {activeTab === 'text' && (
            <div style={{ padding: '20px', height: '100%', boxSizing: 'border-box' }}>
              <div
                style={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  backgroundColor: '#ffffff',
                  borderRadius: '10px',
                  border: '1px solid var(--slate-200)',
                  overflow: 'hidden'
                }}
              >
                <div
                  style={{
                    padding: '10px 16px',
                    backgroundColor: 'var(--slate-50)',
                    borderBottom: '1px solid var(--slate-200)',
                    fontSize: '12px',
                    color: 'var(--slate-600)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <span>Raw text extracted via parser • {rawText.length} characters</span>
                  <span>{rawText.split(/\r\n|\r|\n/).length} lines</span>
                </div>

                <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
                  <pre
                    style={{
                      margin: 0,
                      fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                      fontSize: '12.5px',
                      lineHeight: '1.6',
                      color: 'var(--slate-800)',
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word'
                    }}
                  >
                    {rawText || 'No text extracted for this resume.'}
                  </pre>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '12px 20px',
            borderTop: '1px solid var(--slate-200)',
            backgroundColor: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '10px'
          }}
        >
          <div style={{ fontSize: '12.5px', color: 'var(--slate-500)' }}>
            Showing resume preview for <strong style={{ color: 'var(--slate-800)' }}>{filename}</strong>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={handleDownload}
              disabled={downloading}
              className="btn btn-primary btn-sm"
              style={{ padding: '6px 16px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              {downloading ? (
                <>
                  <RefreshCw size={14} className="spin-animation" />
                  <span>Downloading...</span>
                </>
              ) : (
                <>
                  <Download size={14} />
                  <span>Download Original</span>
                </>
              )}
            </button>

            <button
              onClick={onClose}
              className="btn btn-secondary btn-sm"
              style={{ padding: '6px 16px', fontSize: '13px' }}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
