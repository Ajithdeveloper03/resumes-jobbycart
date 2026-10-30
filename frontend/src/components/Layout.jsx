import React, { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import {
  LayoutDashboard,
  FileUp,
  FileText,
  ReceiptText,
  LogOut,
  Menu,
  X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Layout() {
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="app-container">
      {/* Sidebar */}
      <aside className={`sidebar ${mobileMenuOpen ? 'open' : ''}`}>
        <div className="sidebar-header" style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <img
            src={`${import.meta.env.BASE_URL}jobbycart-logo.png`}
            alt="Jobbycart"
            style={{ height: '38px', objectFit: 'contain' }}
          />
          <div className="brand-text">
            <h2 style={{ fontSize: '16px', fontWeight: '800', letterSpacing: '-0.3px', color: '#fff', margin: 0 }}>
              Jobbycart
            </h2>
            <span style={{ fontSize: '10.5px', color: '#fb923c', textTransform: 'uppercase', letterSpacing: '0.6px', fontWeight: '700' }}>
              Admin Portal
            </span>
          </div>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-section-title">Menu</div>

          <NavLink
            to="/"
            end
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            onClick={() => setMobileMenuOpen(false)}
          >
            <LayoutDashboard size={18} />
            <span>Admin Dashboard</span>
          </NavLink>

          <NavLink
            to="/upload"
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            onClick={() => setMobileMenuOpen(false)}
          >
            <FileUp size={18} />
            <span>Upload Resumes</span>
          </NavLink>

          <NavLink
            to="/resumes"
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            onClick={() => setMobileMenuOpen(false)}
          >
            <FileText size={18} />
            <span>Resume Files</span>
          </NavLink>

          <NavLink
            to="/payslips"
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            onClick={() => setMobileMenuOpen(false)}
          >
            <ReceiptText size={18} />
            <span>Payslips</span>
          </NavLink>

        </nav>

        <div className="sidebar-footer">
          <div className="user-card">
            <div
              className="user-avatar"
              style={{
                width: '34px',
                height: '34px',
                background: 'linear-gradient(135deg, #f97316, #ea580c)',
                color: '#fff',
                fontSize: '13px'
              }}
            >
              {user?.name?.charAt(0) || 'U'}
            </div>
            <div className="user-info">
              <div className="user-name">{user?.name || 'Recruiter'}</div>
              <div className="user-role" style={{ color: '#fb923c' }}>{user?.email || 'Active User'}</div>
            </div>
            <button
              onClick={logout}
              title="Logout"
              className="btn btn-icon btn-secondary btn-sm"
              style={{ background: 'transparent', border: 'none', color: '#94a3b8' }}
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="main-wrapper">
        <header className="topbar">
          <div className="topbar-left">
            <button
              className="btn btn-icon btn-secondary d-md-none"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              style={{ display: window.innerWidth <= 900 ? 'flex' : 'none' }}
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>

            <div style={{ fontWeight: '700', color: 'var(--slate-800)' }}>Admin Dashboard</div>
          </div>

          <div className="topbar-right">
            <div style={{ borderLeft: '1px solid var(--slate-200)', height: '24px', margin: '0 6px' }} />

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div
                className="user-avatar"
                style={{
                  width: '32px',
                  height: '32px',
                  fontSize: '13px',
                  background: 'linear-gradient(135deg, #f97316, #ea580c)',
                  color: '#fff'
                }}
              >
                {user?.name?.charAt(0) || 'U'}
              </div>
              <span style={{ fontSize: '13.5px', fontWeight: '600', color: 'var(--slate-800)' }}>
                {user?.name || 'Recruiter'}
              </span>
            </div>
          </div>
        </header>

        <main className="content-area">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
