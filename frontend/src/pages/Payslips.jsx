import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Download, FileText, Pencil, Plus, Search, Trash2, X } from 'lucide-react';
import api from '../api/client';

const COMPANY_ADDRESS = 'No.17, C3, 3rd Floor, Ayodhya Complex, Thennur High Road, Srinivasapuram, Tennur, Tiruchirappalli, Tamil Nadu 620017.';
const blank = () => ({
  employee_name: '', employee_id: '', designation: '', department: '', company_name: 'Jobbycart',
  company_address: COMPANY_ADDRESS, pay_period: new Date().toISOString().slice(0, 7) + '-01', payment_date: '',
  days_worked: '30', days_in_period: '30', currency: 'INR',
  earnings: [{ name: 'Basic salary', amount: '' }, { name: 'Allowances', amount: '0' }],
  deductions: [{ name: 'Other deductions', amount: '0' }], notes: '',
});
const total = (items = []) => items.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
const money = (value, currency = 'INR') => new Intl.NumberFormat('en-IN', { style: 'currency', currency, maximumFractionDigits: 2 }).format(Number(value) || 0);
const monthLabel = (date) => new Date(`${date.slice(0, 7)}-02T00:00:00`).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });

function printPayslip(slip) {
  const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const rows = (items) => (items || []).map((item) => `<tr><td>${esc(item.name)}</td><td>${money(item.amount, slip.currency)}</td></tr>`).join('');
  const gross = total(slip.earnings);
  const deductions = total(slip.deductions);
  const logoUrl = new URL(`${import.meta.env.BASE_URL}jobbycart-logo.png`, window.location.origin).href;
  const companyAddress = slip.company_address || COMPANY_ADDRESS;
  const win = window.open('', '_blank', 'width=850,height=900');
  if (!win) return;
  win.document.write(`<!doctype html><html><head><title>Payslip - ${esc(slip.employee_name)}</title><style>
    body{font:14px Arial,sans-serif;color:#172033;margin:40px auto;max-width:760px}h1{margin:0;color:#ea580c;font-size:26px}.muted{color:#64748b}.head{display:flex;justify-content:space-between;gap:20px;border-bottom:2px solid #ea580c;padding-bottom:20px}.company{display:flex;align-items:center;gap:14px}.company img{width:64px;height:64px;object-fit:contain}.grid{display:grid;grid-template-columns:1fr 1fr;gap:8px 30px;margin:24px 0}.box{border:1px solid #e2e8f0;border-radius:8px;padding:16px}h2{font-size:15px;margin:0 0 12px}table{width:100%;border-collapse:collapse}td{padding:9px 4px;border-bottom:1px solid #e2e8f0}td:last-child{text-align:right}.total{font-weight:bold;font-size:18px;background:#fff7ed;padding:14px;margin-top:20px;display:flex;justify-content:space-between}.note{white-space:pre-wrap;margin-top:20px}.print{margin:20px 0;padding:10px 16px;background:#ea580c;color:#fff;border:0;border-radius:6px}@media print{body{margin:0 auto}.print{display:none}}</style></head><body>
    <div class="head"><div class="company"><img src="${esc(logoUrl)}" alt="${esc(slip.company_name)} logo"><div><h1>${esc(slip.company_name)}</h1><div class="muted">${esc(companyAddress)}</div></div></div><div style="text-align:right"><h2>PAYSLIP</h2><div>${esc(monthLabel(slip.pay_period))}</div><div class="muted">Paid ${esc(slip.payment_date || '—')}</div></div></div>
    <div class="grid"><div><b>Employee</b><br>${esc(slip.employee_name)}</div><div><b>Employee ID</b><br>${esc(slip.employee_id || '—')}</div><div><b>Designation</b><br>${esc(slip.designation || '—')}</div><div><b>Department</b><br>${esc(slip.department || '—')}</div><div><b>Days worked</b><br>${esc(slip.days_worked)} / ${esc(slip.days_in_period)}</div></div>
    <div class="grid"><div class="box"><h2>Earnings</h2><table>${rows(slip.earnings)}<tr><td><b>Total earnings</b></td><td><b>${money(gross, slip.currency)}</b></td></tr></table></div><div class="box"><h2>Deductions</h2><table>${rows(slip.deductions)}<tr><td><b>Total deductions</b></td><td><b>${money(deductions, slip.currency)}</b></td></tr></table></div></div>
    <div class="total"><span>Net pay</span><span>${money(gross - deductions, slip.currency)}</span></div>${slip.notes ? `<div class="note"><b>Notes</b><br>${esc(slip.notes)}</div>` : ''}<button class="print" onclick="window.print()">Print / Save as PDF</button></body></html>`);
  win.document.close();
}

function PayItems({ title, items, onChange, allowEmpty = false }) {
  return <section style={{ border: '1px solid var(--slate-200)', borderRadius: 10, padding: 16 }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}><strong>{title}</strong><button type="button" className="btn btn-secondary btn-sm" onClick={() => onChange([...items, { name: '', amount: '0' }])}><Plus size={14} /> Add row</button></div>
    {items.map((item, i) => <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 150px 34px', gap: 8, marginBottom: 8 }}><input className="form-control" placeholder="Item name" required value={item.name} onChange={(e) => onChange(items.map((row, n) => n === i ? { ...row, name: e.target.value } : row))} /><input className="form-control" type="number" min="0" step="0.01" placeholder="Amount" required value={item.amount} onChange={(e) => onChange(items.map((row, n) => n === i ? { ...row, amount: e.target.value } : row))} /><button type="button" className="btn btn-icon btn-secondary" aria-label={`Remove ${title.toLowerCase()} row`} disabled={!allowEmpty && items.length === 1} onClick={() => onChange(items.filter((_, n) => n !== i))}><X size={15} /></button></div>)}
  </section>;
}

export default function Payslips({ embedded = false }) {
  const [slips, setSlips] = useState([]);
  const [pagination, setPagination] = useState({ current_page: 1, last_page: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [period, setPeriod] = useState('');
  const [editor, setEditor] = useState(null);
  const [form, setForm] = useState(blank());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/payslips', { params: { page, search: search.trim() || undefined, period: period || undefined } });
      setSlips(data.data.data);
      setPagination({ current_page: data.data.current_page, last_page: data.data.last_page, total: data.data.total });
    } catch (e) { setError(e.response?.data?.message || 'Could not load payslips.'); }
    finally { setLoading(false); }
  }, [page, period, search]);

  useEffect(() => { load(); }, [load]);

  const netPay = useMemo(() => total(form.earnings) - total(form.deductions), [form]);
  const setField = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  const openNew = () => { setForm(blank()); setEditor('new'); setError(''); };
  const openEdit = (slip) => { setForm({ ...blank(), ...slip, company_address: slip.company_address || COMPANY_ADDRESS, pay_period: slip.pay_period.slice(0, 10), payment_date: slip.payment_date?.slice(0, 10) || '', earnings: slip.earnings || [], deductions: slip.deductions || [] }); setEditor(slip.id); setError(''); };
  const save = async (e) => {
    e.preventDefault(); setSaving(true); setError('');
    try {
      if (editor === 'new') await api.post('/payslips', form);
      else await api.put(`/payslips/${editor}`, form);
      setEditor(null); await load();
    } catch (e) { const errors = e.response?.data?.errors; setError(errors ? Object.values(errors).flat().join(' ') : e.response?.data?.message || 'Could not save payslip.'); }
    finally { setSaving(false); }
  };
  const remove = async (slip) => {
    if (!window.confirm(`Delete the payslip for ${slip.employee_name} (${monthLabel(slip.pay_period)})?`)) return;
    try { await api.delete(`/payslips/${slip.id}`); await load(); }
    catch (e) { setError(e.response?.data?.message || 'Could not delete payslip.'); }
  };

  return <div>
    <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, marginBottom: 24 }}><div><h1 style={{ fontSize: 26 }}>{embedded ? 'Payslips' : 'Admin Dashboard'}</h1><p style={{ color: 'var(--slate-500)' }}>Manage employee payslips and monthly pay records.</p></div><button className="btn btn-primary" onClick={openNew}><Plus size={17} /> Create payslip</button></div>
    <div className="card" style={{ padding: 18, marginBottom: 18 }}><div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}><form onSubmit={(e) => { e.preventDefault(); setPage(1); load(); }} style={{ display: 'flex', gap: 8, flex: '1 1 280px' }}><div className="search-input-wrapper" style={{ flex: 1 }}><Search size={16} className="search-icon" /><input className="topbar-search-input" placeholder="Search employee, ID or designation" value={search} onChange={(e) => setSearch(e.target.value)} /></div><button className="btn btn-secondary">Search</button></form><label style={{ color: 'var(--slate-600)', fontSize: 13 }}>Pay month <input className="form-control" type="month" value={period} onChange={(e) => { setPeriod(e.target.value); setPage(1); }} /></label><span style={{ color: 'var(--slate-500)', fontSize: 13 }}>{pagination.total} payslip{pagination.total === 1 ? '' : 's'}</span></div></div>
    {error && !editor && <div style={{ color: '#b91c1c', marginBottom: 14 }}>{error}</div>}
    <div className="card" style={{ overflowX: 'auto' }}><table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 720 }}><thead><tr style={{ textAlign: 'left', color: 'var(--slate-500)', fontSize: 12, textTransform: 'uppercase' }}>{['Employee', 'Pay period', 'Designation', 'Gross pay', 'Deductions', 'Net pay', 'Actions'].map((h) => <th key={h} style={{ padding: 14, borderBottom: '1px solid var(--slate-200)' }}>{h}</th>)}</tr></thead><tbody>{loading ? <tr><td colSpan="7" style={{ padding: 32, textAlign: 'center' }}>Loading payslips…</td></tr> : slips.length === 0 ? <tr><td colSpan="7" style={{ padding: 44, textAlign: 'center', color: 'var(--slate-500)' }}><FileText size={28} style={{ marginBottom: 8 }} /><div>No payslips yet. Create one to get started.</div></td></tr> : slips.map((s) => { const gross = total(s.earnings); const deductions = total(s.deductions); return <tr key={s.id} style={{ borderBottom: '1px solid var(--slate-100)' }}><td style={{ padding: 14 }}><strong>{s.employee_name}</strong><div style={{ fontSize: 12, color: 'var(--slate-500)' }}>{s.employee_id || 'No employee ID'}</div></td><td style={{ padding: 14 }}>{monthLabel(s.pay_period)}</td><td style={{ padding: 14 }}>{s.designation || '—'}</td><td style={{ padding: 14 }}>{money(gross, s.currency)}</td><td style={{ padding: 14 }}>{money(deductions, s.currency)}</td><td style={{ padding: 14, fontWeight: 700, color: 'var(--emerald-700)' }}>{money(gross - deductions, s.currency)}</td><td style={{ padding: 14, whiteSpace: 'nowrap' }}><button title="Print or save PDF" className="btn btn-icon btn-secondary" onClick={() => printPayslip(s)}><Download size={16} /></button><button title="Edit" className="btn btn-icon btn-secondary" onClick={() => openEdit(s)}><Pencil size={16} /></button><button title="Delete" className="btn btn-icon btn-secondary" onClick={() => remove(s)}><Trash2 size={16} /></button></td></tr>; })}</tbody></table>
      {!loading && pagination.last_page > 1 && <div style={{ display: 'flex', justifyContent: 'space-between', padding: 14 }}><button className="btn btn-secondary btn-sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</button><span>Page {pagination.current_page} of {pagination.last_page}</span><button className="btn btn-secondary btn-sm" disabled={page >= pagination.last_page} onClick={() => setPage(page + 1)}>Next</button></div>}</div>
    {editor && <div role="presentation" onMouseDown={(e) => { if (e.target === e.currentTarget) setEditor(null); }} style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(15,23,42,.55)', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: 16 }}><div role="dialog" aria-modal="true" aria-labelledby="payslip-title" style={{ background: '#fff', borderRadius: 14, width: 'min(860px, 100%)', maxHeight: '94vh', overflow: 'auto', padding: 24 }}><div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 18 }}><div><h2 id="payslip-title">{editor === 'new' ? 'Create payslip' : 'Edit payslip'}</h2><p style={{ color: 'var(--slate-500)', fontSize: 13 }}>Enter employee details and pay components.</p></div><button className="btn btn-icon btn-secondary" onClick={() => setEditor(null)}><X size={18} /></button></div>
      {error && <div role="alert" style={{ color: '#b91c1c', background: '#fef2f2', padding: 10, borderRadius: 6, marginBottom: 14 }}>{error}</div>}
      <form onSubmit={save}><div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(210px,1fr))', gap: 14, marginBottom: 18 }}>{[['employee_name','Employee name',true],['employee_id','Employee ID'],['designation','Designation'],['department','Department'],['company_name','Company name',true],['company_address','Company address'],['pay_period','Pay month',true,'month'],['payment_date','Payment date',false,'date'],['days_worked','Days worked',true,'number'],['days_in_period','Days in period',true,'number']].map(([key,label,required,type]) => <label key={key} style={{ display: 'grid', gap: 5, fontSize: 13, fontWeight: 600 }}>{label}<input required={required} className="form-control" type={type || 'text'} min={type === 'number' ? '0' : undefined} step={type === 'number' ? '0.01' : undefined} value={key === 'pay_period' ? form.pay_period.slice(0,7) : form[key]} onChange={(e) => setField(key, key === 'pay_period' ? `${e.target.value}-01` : e.target.value)} /></label>)}</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: 14, marginBottom: 16 }}><PayItems title="Earnings" items={form.earnings} onChange={(v) => setField('earnings', v)} /><PayItems title="Deductions" items={form.deductions} onChange={(v) => setField('deductions', v)} allowEmpty /></div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff7ed', borderRadius: 8, padding: 14, marginBottom: 16 }}><label style={{ fontSize: 13 }}>Currency <select className="form-control" value={form.currency} onChange={(e) => setField('currency', e.target.value)}><option value="INR">INR — Indian rupee</option><option value="USD">USD — US dollar</option><option value="EUR">EUR — Euro</option><option value="GBP">GBP — Pound sterling</option></select></label><strong>Net pay&nbsp; {money(netPay, form.currency)}</strong></div>
        <label style={{ display: 'grid', gap: 5, fontSize: 13, fontWeight: 600, marginBottom: 18 }}>Notes<textarea className="form-control" rows="2" value={form.notes} onChange={(e) => setField('notes', e.target.value)} /></label><div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}><button type="button" className="btn btn-secondary" onClick={() => setEditor(null)}>Cancel</button><button disabled={saving} className="btn btn-primary">{saving ? 'Saving…' : 'Save payslip'}</button></div>
      </form></div></div>}
  </div>;
}
