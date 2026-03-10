import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import './gusuniversity.css';

/* ─── jsPDF lazy-loader ───────────────────────────────────────────────────── */
const loadJsPDF = () =>
    new Promise((resolve, reject) => {
        if (window.jspdf) { resolve(window.jspdf.jsPDF); return; }
        const s = document.createElement('script');
        s.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
        s.onload  = () => resolve(window.jspdf.jsPDF);
        s.onerror = reject;
        document.head.appendChild(s);
    });

/* ─── SVG Icons ───────────────────────────────────────────────────────────── */
const Ico = ({ d, size = 20, color = 'currentColor', viewBox = '0 0 24 24', fill = 'none', strokeWidth = 1.8 }) => (
    <svg width={size} height={size} viewBox={viewBox} fill={fill} stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
        {Array.isArray(d) ? d.map((p, i) => <path key={i} d={p} />) : <path d={d} />}
    </svg>
);

const IcoClipboard = (p) => <Ico {...p} d={['M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2','M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2']} />;
const IcoClock     = (p) => <Ico {...p} d={['M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z','M12 6v6l4 2']} />;
const IcoCheck2    = (p) => <Ico {...p} d="M22 11.08V12a10 10 0 11-5.93-9.14M22 4L12 14.01l-3-3" />;
const IcoEye       = (p) => <Ico {...p} d={['M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z','M12 9a3 3 0 100 6 3 3 0 000-6z']} />;
const IcoFile      = (p) => <Ico {...p} d={['M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z','M14 2v6h6','M9 13h6M9 17h4']} />;
const IcoFilePdf   = (p) => <Ico {...p} d={['M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z','M14 2v6h6']} />;
const IcoImage     = (p) => <svg width={p.size||16} height={p.size||16} viewBox="0 0 24 24" fill="none" stroke={p.color||'currentColor'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>;
const IcoFileDoc   = (p) => <Ico {...p} d={['M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z','M14 2v6h6','M16 13H8M16 17H8M10 9H8']} />;
const IcoCalendar  = (p) => <svg width={p.size||16} height={p.size||16} viewBox="0 0 24 24" fill="none" stroke={p.color||'currentColor'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>;
const IcoFileX     = (p) => <Ico {...p} d={['M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z','M14 2v6h6','M9 15l6 0']} />;
const IcoCheckMini = (p) => <svg width={p.size||14} height={p.size||14} viewBox="0 0 24 24" fill="none" stroke={p.color||'white'} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>;
const IcoXMini     = (p) => <svg width={p.size||14} height={p.size||14} viewBox="0 0 24 24" fill="none" stroke={p.color||'white'} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>;
const IcoInbox     = (p) => <svg width={p.size||40} height={p.size||40} viewBox="0 0 24 24" fill="none" stroke={p.color||'currentColor'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11L2 12v6a2 2 0 002 2h16a2 2 0 002-2v-6l-3.45-6.89A2 2 0 0016.76 4H7.24a2 2 0 00-1.79 1.11z"/></svg>;
const IcoAlert     = (p) => <svg width={p.size||40} height={p.size||40} viewBox="0 0 24 24" fill="none" stroke={p.color||'#ef4444'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>;
const IcoExternal  = (p) => <svg width={p.size||14} height={p.size||14} viewBox="0 0 24 24" fill="none" stroke={p.color||'currentColor'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>;
const IcoDownload  = (p) => <svg width={p.size||14} height={p.size||14} viewBox="0 0 24 24" fill="none" stroke={p.color||'currentColor'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>;
const IcoRefresh   = (p) => <svg width={p.size||14} height={p.size||14} viewBox="0 0 24 24" fill="none" stroke={p.color||'currentColor'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 102.13-9.36L1 10"/></svg>;
const IcoSearch    = () => <svg className="gus-search-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>;
const IcoViewBtn   = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="gus-btn-ico" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>;
const IcoDlBtn     = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="gus-btn-ico" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/></svg>;

const getFileIconComponent = (fileType) => {
    if (!fileType) return <IcoFile size={16} color="#8B8FA8" />;
    const t = fileType.toLowerCase();
    if (t === 'pdf') return <IcoFilePdf size={16} color="#FF6B8A" />;
    if (['jpg', 'jpeg', 'png', 'webp'].includes(t)) return <IcoImage size={16} color="#7B61FF" />;
    if (['doc', 'docx'].includes(t)) return <IcoFileDoc size={16} color="#00C9A7" />;
    return <IcoFile size={16} color="#8B8FA8" />;
};

/* ─── YesNo helper component ────────────────────────────────────────────────── */
const YesNoVal = ({ value }) => (
    <span className="gus-field-yesno">
        <span className={`gus-yn-dot ${value ? 'gus-yn-yes' : 'gus-yn-no'}`}>
            {value ? <IcoCheckMini size={10} /> : <IcoXMini size={10} />}
        </span>
        {value ? 'Yes' : 'No'}
    </span>
);

/* ─── Main Component ──────────────────────────────────────────────────────── */
const GusUniversity = () => {
    const [applications, setApplications] = useState([]);
    const [loading, setLoading]           = useState(true);
    const [error, setError]               = useState(null);
    const [searchQuery, setSearchQuery]   = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [selectedApp, setSelectedApp]   = useState(null);
    const [pdfLoading, setPdfLoading]     = useState(null);
    const [stats, setStats]               = useState({ total: 0, completed: 0, incomplete: 0, underReview: 0 });
    const [docViewer, setDocViewer]       = useState(null);

    const apiRef = useRef(null);
    if (!apiRef.current) {
        const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';
        const instance = axios.create({ baseURL: API_BASE_URL, timeout: 15000 });
        instance.interceptors.request.use((config) => {
            const token = localStorage.getItem('processAdminToken') || localStorage.getItem('token') || localStorage.getItem('adminToken');
            if (token) config.headers.Authorization = `Bearer ${token}`;
            config.headers['Content-Type'] = 'application/json';
            return config;
        }, (err) => Promise.reject(err));
        instance.interceptors.response.use(res => res, err => {
            if (err.response?.status === 401) console.log('Auth failed');
            if (err.response?.status === 403) console.log('Forbidden');
            return Promise.reject(err);
        });
        apiRef.current = instance;
    }
    const api = apiRef.current;

    const formatDate = (d) => {
        if (!d) return '—';
        try { return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }); }
        catch { return '—'; }
    };
    const val      = (v) => (v !== undefined && v !== null && v !== '') ? v : '—';
    const yesNo    = (v) => v === true ? 'Yes' : v === false ? 'No' : '—';
    const capFirst = (s) => s ? s.charAt(0).toUpperCase() + s.slice(1) : '—';
    const fmt      = (map, v) => map[v] || v || '—';

    const formatFileSize = (bytes) => {
        if (!bytes) return '';
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };
    const formatExpectedDate = (ym) => {
        if (!ym) return null;
        try { const [y, m] = ym.split('-'); return new Date(y, m - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }); }
        catch { return ym; }
    };

    const getStatusLabel = (app) => {
        if (app.completionPercentage === 100) return 'COMPLETED';
        if (app.completionPercentage > 0)     return 'IN PROGRESS';
        return 'INCOMPLETE';
    };
    const getStatusClass = (app) => {
        const s = getStatusLabel(app);
        if (s === 'COMPLETED')   return 'status-completed';
        if (s === 'IN PROGRESS') return 'status-inprogress';
        return 'status-incomplete';
    };
    const getInitials    = (name) => (name || '?').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
    const avatarColors   = ['#7B61FF', '#00C9A7', '#FF8C42', '#FF6B8A', '#5B4FD4'];
    const getAvatarColor = (name) => avatarColors[(name?.charCodeAt(0) || 0) % avatarColors.length];

    const eqheTitleMap = {
        'senior_secondary_india':  'Senior Secondary School Certificate (India)',
        'high_school_diploma_usa': 'American High School Diploma (USA)',
        'mathayom_thailand':       'Mathayom VI (Thailand)',
        'attestat_russia':         'Attestat (Russia)',
        'bachillerato_mexico':     'Bachillerato General (Mexico)',
        'west_african_nigeria':    'West African Senior School Certificate (Nigeria)',
        'diploma_italy':           'Diploma (Italy)',
        'high_school_china':       'Secondary School Certificate + Gaokao (China)',
        'bachiller_colombia':      'Titulo di Bachiller + Examen de Estado (Colombia)',
        'high_school_skorea':      'High School Certificate + CSAT (South Korea)'
    };
    const countryMap = {
        'india': 'India', 'usa': 'United States', 'uk': 'United Kingdom',
        'canada': 'Canada', 'australia': 'Australia', 'china': 'China',
        'germany': 'Germany', 'france': 'France', 'japan': 'Japan',
        'skorea': 'South Korea', 'russia': 'Russia', 'mexico': 'Mexico',
        'colombia': 'Colombia', 'italy': 'Italy', 'spain': 'Spain',
        'brazil': 'Brazil', 'nigeria': 'Nigeria', 'thailand': 'Thailand'
    };

    const calculateStats = useCallback((apps) => {
        setStats({
            total:       apps.length,
            completed:   apps.filter(a => a.completionPercentage === 100).length,
            incomplete:  apps.filter(a => a.completionPercentage === 0).length,
            underReview: apps.filter(a => a.completionPercentage > 0 && a.completionPercentage < 100).length
        });
    }, []);

    const fetchApplications = useCallback(async () => {
        setLoading(true); setError(null);
        const token = localStorage.getItem('processAdminToken') || localStorage.getItem('token') || localStorage.getItem('adminToken');
        if (!token) { setError('No authentication token found. Please login again.'); setLoading(false); return; }
        try {
            const response = await api.get('/api/application/process-admin/gus-university/applications');
            if (response.data.success) {
                const apps = response.data.data || [];
                setApplications(apps); calculateStats(apps);
            } else { setError('Failed to load applications. Please try again.'); }
        } catch (err) {
            if (err.response?.status === 401)      setError('Authentication failed. Please login again.');
            else if (err.response?.status === 403) setError('You do not have permission to view these applications.');
            else                                   setError('Failed to load applications. Please try again.');
        } finally { setLoading(false); }
    }, [api, calculateStats]);

    useEffect(() => { fetchApplications(); }, [fetchApplications]);

    const filtered = applications.filter(app => {
        const q = searchQuery.toLowerCase();
        const matchSearch = app.studentName?.toLowerCase().includes(q) || app.email?.toLowerCase().includes(q) || String(app.studentId).includes(q) || app.applicationId?.toLowerCase().includes(q);
        const s = getStatusLabel(app);
        const matchFilter = filterStatus === 'all' || (filterStatus === 'completed' && s === 'COMPLETED') || (filterStatus === 'incomplete' && s === 'INCOMPLETE') || (filterStatus === 'inprogress' && s === 'IN PROGRESS');
        return matchSearch && matchFilter;
    });

    const openModal  = (app) => setSelectedApp({ ...app });
    const closeModal = ()    => setSelectedApp(null);

    const API_BASE_URL_VIEW = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';
    const DOC_FOLDER_MAP_VIEW = {
        'CV': 'documents/cv', 'Photo': 'documents/photo', 'Passport': 'documents/personal',
        'Transcript': 'documents/academic', 'Diploma': 'documents/academic',
        'Certificate 9th': 'documents/certificates', 'Certificate 10th': 'documents/certificates',
        'Certificate 11th': 'documents/certificates', 'Certificate 12th': 'documents/certificates',
        'Test Scores': 'documents/optional', 'Language Proficiency': 'documents/optional',
        'Recommendation Letter': 'documents/optional',
    };

    const openDocViewer = (meta, label) => {
        if (!meta?.fileName) return;
        let url;
        if (meta.fileUrl) {
            if (meta.fileUrl.startsWith('/api/files/')) url = `${API_BASE_URL_VIEW}${meta.fileUrl}`;
            else if (meta.fileUrl.startsWith('https://')) {
                try { const parsed = new URL(meta.fileUrl); url = `${API_BASE_URL_VIEW}/api/files/${parsed.pathname.replace(/^\//, '')}`; }
                catch { url = meta.fileUrl; }
            } else url = `${API_BASE_URL_VIEW}${meta.fileUrl}`;
        } else {
            url = `${API_BASE_URL_VIEW}/api/files/${DOC_FOLDER_MAP_VIEW[label] || 'documents/other'}/${meta.fileName}`;
        }
        setDocViewer({ url, label, fileType: meta.fileType, originalName: meta.originalName || meta.fileName });
    };

    const closeDocViewer = () => setDocViewer(null);
    const isImageType = (ft) => ['jpg', 'jpeg', 'png', 'webp', 'gif'].includes((ft || '').toLowerCase());

    /* ─── PDF ───────────────────────────────────────────────────────────────── */
    const handleDownloadPDF = async (app) => {
        setPdfLoading(app.studentId);
        try {
            const JsPDF = await loadJsPDF();
            const doc = new JsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
            const PW = 210, PH = 297, ML = 14, MR = 14, CW = PW - ML - MR, COL = CW / 2 - 3;
            const C = {
                primary: [123, 97, 255], teal: [0, 201, 167], orange: [255, 140, 66],
                dark: [26, 29, 46], mid: [139, 143, 168], light: [245, 247, 255],
                border: [232, 234, 242], white: [255, 255, 255],
                red: [255, 107, 138], yellow: [255, 196, 66], green: [0, 201, 167],
            };
            let y = 0;
            const checkPageBreak = (n = 20) => { if (y + n > PH - 16) { doc.addPage(); drawFooter(); y = 18; } };
            const drawFooter = () => {
                const pg = doc.internal.getCurrentPageInfo().pageNumber;
                doc.setFontSize(8).setTextColor(...C.mid);
                doc.text(`GUS University — ${app.applicationId || 'Application'}`, ML, PH - 8);
                doc.text(`Page ${pg}`, PW - ML, PH - 8, { align: 'right' });
                doc.setDrawColor(...C.border); doc.line(ML, PH - 12, PW - MR, PH - 12);
            };
            const drawSec = (title, color = C.primary) => {
                checkPageBreak(18);
                doc.setFillColor(...color); doc.circle(ML + 2, y + 3.5, 2, 'F');
                doc.setFontSize(11).setFont(undefined, 'bold').setTextColor(...C.dark); doc.text(title, ML + 6, y + 4.5);
                doc.setDrawColor(...color); doc.setLineWidth(0.4); doc.line(ML, y + 7, PW - MR, y + 7); doc.setLineWidth(0.2); y += 12;
            };
            const drawRow = (pairs) => {
                checkPageBreak(12);
                pairs.forEach(({ k, v }, i) => {
                    const x = ML + i * (COL + 6);
                    doc.setFontSize(7.5).setFont(undefined, 'normal').setTextColor(...C.mid); doc.text(k, x, y);
                    doc.setFontSize(9).setFont(undefined, 'bold').setTextColor(...C.dark);
                    doc.text(doc.splitTextToSize(String(v || '—'), COL), x, y + 4.5);
                }); y += 13;
            };
            const drawFull = (k, v) => {
                checkPageBreak(12);
                doc.setFontSize(7.5).setFont(undefined, 'normal').setTextColor(...C.mid); doc.text(k, ML, y);
                doc.setFontSize(9).setFont(undefined, 'bold').setTextColor(...C.dark);
                const lines = doc.splitTextToSize(String(v || '—'), CW); doc.text(lines, ML, y + 4.5);
                y += 6 + lines.length * 4.5;
            };
            const drawBar = (pct) => {
                checkPageBreak(14);
                doc.setFillColor(...C.border); doc.roundedRect(ML, y, CW, 6, 2, 2, 'F');
                if (pct > 0) { doc.setFillColor(...C.primary); doc.roundedRect(ML, y, (pct / 100) * CW, 6, 2, 2, 'F'); }
                doc.setFontSize(8).setFont(undefined, 'bold').setTextColor(...C.primary); doc.text(`${pct}% Complete`, ML + CW + 3, y + 4.5); y += 14;
            };
            // Header
            doc.setFillColor(...C.primary); doc.rect(0, 0, PW, 42, 'F');
            doc.setFillColor(...C.teal); doc.rect(0, 38, PW, 4, 'F');
            doc.setFillColor(...C.white); doc.circle(ML + 10, 20, 10, 'F');
            doc.setFontSize(9).setFont(undefined, 'bold').setTextColor(...C.primary); doc.text('GUS', ML + 10, 21.5, { align: 'center' });
            doc.setFontSize(18).setFont(undefined, 'bold').setTextColor(...C.white); doc.text('GUS UNIVERSITY', ML + 26, 16);
            doc.setFontSize(10).setFont(undefined, 'normal').setTextColor(200, 195, 255); doc.text('Application Detail Report', ML + 26, 23);
            doc.setFillColor(91, 79, 212); doc.roundedRect(PW - ML - 48, 10, 48, 14, 3, 3, 'F');
            doc.setFontSize(7).setFont(undefined, 'normal').setTextColor(200, 195, 255); doc.text('APPLICATION ID', PW - ML - 24, 16, { align: 'center' });
            doc.setFontSize(9).setFont(undefined, 'bold').setTextColor(...C.white); doc.text(app.applicationId || 'N/A', PW - ML - 24, 21, { align: 'center' });
            y = 52;
            doc.setFillColor(...C.light); doc.roundedRect(ML, y - 4, CW, 28, 3, 3, 'F');
            doc.setFillColor(...C.primary); doc.circle(ML + 12, y + 9, 10, 'F');
            doc.setFontSize(10).setFont(undefined, 'bold').setTextColor(...C.white); doc.text(getInitials(app.studentName), ML + 12, y + 12, { align: 'center' });
            doc.setFontSize(14).setFont(undefined, 'bold').setTextColor(...C.dark); doc.text(app.studentName || 'Unknown', ML + 26, y + 6);
            doc.setFontSize(8.5).setFont(undefined, 'normal').setTextColor(...C.mid);
            doc.text(app.email || '—', ML + 26, y + 11); doc.text(app.phone || '—', ML + 26, y + 16);
            const sColors = { 'COMPLETED': C.teal, 'IN PROGRESS': C.yellow, 'INCOMPLETE': C.red };
            const sLabel = getStatusLabel(app);
            doc.setFillColor(...(sColors[sLabel] || C.mid)); doc.roundedRect(PW - MR - 38, y - 1, 38, 8, 2, 2, 'F');
            doc.setFontSize(8).setFont(undefined, 'bold').setTextColor(...C.white); doc.text(sLabel, PW - MR - 19, y + 4.5, { align: 'center' });
            doc.setFontSize(7.5).setFont(undefined, 'normal').setTextColor(...C.mid);
            doc.text(`Generated: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`, PW - MR - 38, y + 18);
            y += 34; drawFooter();

            drawSec('Student Information', C.primary);
            drawRow([{ k: 'Application ID', v: app.applicationId }, { k: 'Student ID', v: app.studentId?.slice(-12) }]);
            drawRow([{ k: 'Title', v: app.title }, { k: 'Full Name', v: app.studentName }]);
            drawRow([{ k: 'Gender', v: capFirst(app.gender) }, { k: 'Date of Birth', v: formatDate(app.dateOfBirth) }]);
            drawRow([{ k: 'Place of Birth', v: app.placeOfBirth }, { k: 'Country of Birth', v: app.countryOfBirth }]);
            drawSec('Contact Information', C.teal);
            drawRow([{ k: 'Email Address', v: app.email }, { k: 'Mobile', v: app.phone }]);
            drawRow([{ k: 'Landline', v: app.landline }, { k: 'Country of Residence', v: app.countryOfResidence }]);
            drawRow([{ k: 'Correspondence Language', v: capFirst(app.correspondenceLanguage) }, { k: 'Last Updated', v: formatDate(app.updatedAt) }]);
            drawSec('Passport & Travel Documents', C.orange);
            drawRow([{ k: 'Citizenship', v: app.citizenship }, { k: 'Passport Number', v: app.passportNumber }]);
            drawRow([{ k: 'Issue Date', v: formatDate(app.passportIssueDate) }, { k: 'Expiry Date', v: formatDate(app.passportExpiryDate) }]);
            drawRow([{ k: 'Issuing Country', v: app.issuingCountry }, { k: 'Document Type', v: capFirst(app.documentType) }]);
            drawRow([{ k: 'EU Citizen', v: yesNo(app.isEUCitizen) }, { k: 'Needs Visa', v: capFirst(app.needVisa) }]);
            drawSec('Primary EQHE Details', C.primary);
            drawFull('Qualification Title', fmt(eqheTitleMap, app.eqheOriginalTitle));
            drawRow([{ k: 'Country', v: fmt(countryMap, app.eqheCountry) }, { k: 'City', v: app.eqheCity }]);
            drawRow([{ k: 'Date', v: formatDate(app.eqheDate) }, { k: 'Certificate Uploaded', v: app.eqheCertificateFileName ? 'Yes' : 'No' }]);
            drawRow([{ k: 'Has Additional EQHE', v: yesNo(app.hasAnotherEQHE) }, { k: '', v: '' }]);
            if (app.hasAnotherEQHE) {
                drawSec('Additional EQHE Details', C.orange);
                drawFull('Qualification Title', fmt(eqheTitleMap, app.anotherEqheOriginalTitle));
                drawRow([{ k: 'Country', v: fmt(countryMap, app.anotherEqheCountry) }, { k: 'City', v: app.anotherEqheCity }]);
                drawRow([{ k: 'Date', v: formatDate(app.anotherEqheDate) }, { k: 'Certificate Uploaded', v: app.anotherEqheCertificateFileName ? 'Yes' : 'No' }]);
            }
            if (app.documents) {
                drawSec('Documents Status', C.primary);
                doc.setFontSize(8).setFont(undefined, 'normal').setTextColor(...C.mid); doc.text('Documents Completion:', ML, y); y += 5;
                drawBar(app.documents.docsCompletionPct || 0);
                const docList = [
                    { label: 'CV', up: app.documents.cvUploaded, st: app.documents.cvStatus, exp: null },
                    { label: 'Photo', up: app.documents.photoUploaded, st: app.documents.photoStatus, exp: null },
                    { label: 'Passport', up: app.documents.passportUploaded, st: app.documents.passportStatus, exp: null },
                    { label: 'Transcript', up: app.documents.transcriptUploaded, st: app.documents.transcriptStatus, exp: null },
                    { label: 'Diploma', up: app.documents.diplomaUploaded, st: app.documents.diplomaStatus, exp: null },
                    { label: 'Cert 9th', up: app.documents.cert9thUploaded, st: app.documents.cert9thStatus, exp: app.documents.cert9thExpectedDate },
                    { label: 'Cert 10th', up: app.documents.cert10thUploaded, st: app.documents.cert10thStatus, exp: app.documents.cert10thExpectedDate },
                    { label: 'Cert 11th', up: app.documents.cert11thUploaded, st: app.documents.cert11thStatus, exp: app.documents.cert11thExpectedDate },
                    { label: 'Cert 12th', up: app.documents.cert12thUploaded, st: app.documents.cert12thStatus, exp: app.documents.cert12thExpectedDate },
                    { label: 'Test Scores', up: app.documents.testScoresUploaded, st: null, exp: null },
                    { label: 'Language Proficiency', up: app.documents.langProfUploaded, st: null, exp: null },
                    { label: 'Recommendation Letter', up: app.documents.recLetterUploaded, st: null, exp: null },
                ];
                const half = Math.ceil(docList.length / 2), col2X = ML + COL + 6;
                let y1 = y, y2 = y;
                docList.slice(0, half).forEach(({ label, up, st, exp }) => {
                    checkPageBreak(10); const hasExp = !up && !!exp;
                    const bg = up ? (st === 'approved' ? C.teal : st === 'rejected' ? C.red : C.yellow) : hasExp ? [255, 196, 66] : C.red;
                    const txt = up ? (st === 'approved' ? 'Approved' : st === 'rejected' ? 'Rejected' : 'Pending') : hasExp ? 'Expected' : 'Missing';
                    doc.setFillColor(...bg); doc.roundedRect(ML, y1, 22, 6, 1, 1, 'F');
                    doc.setFontSize(6.5).setFont(undefined, 'bold').setTextColor(...C.white); doc.text(txt, ML + 11, y1 + 4, { align: 'center' });
                    doc.setFontSize(8.5).setFont(undefined, 'normal').setTextColor(...C.dark); doc.text(label, ML + 25, y1 + 4);
                    if (hasExp) { doc.setFontSize(7).setTextColor(...C.mid); doc.text(`Expected: ${formatExpectedDate(exp)}`, ML + 25, y1 + 8.5); y1 += 4; }
                    y1 += 9;
                });
                docList.slice(half).forEach(({ label, up, st, exp }) => {
                    const hasExp = !up && !!exp;
                    const bg = up ? (st === 'approved' ? C.teal : st === 'rejected' ? C.red : C.yellow) : hasExp ? [255, 196, 66] : C.red;
                    const txt = up ? (st === 'approved' ? 'Approved' : st === 'rejected' ? 'Rejected' : 'Pending') : hasExp ? 'Expected' : 'Missing';
                    doc.setFillColor(...bg); doc.roundedRect(col2X, y2, 22, 6, 1, 1, 'F');
                    doc.setFontSize(6.5).setFont(undefined, 'bold').setTextColor(...C.white); doc.text(txt, col2X + 11, y2 + 4, { align: 'center' });
                    doc.setFontSize(8.5).setFont(undefined, 'normal').setTextColor(...C.dark); doc.text(label, col2X + 25, y2 + 4);
                    if (hasExp) { doc.setFontSize(7).setTextColor(...C.mid); doc.text(`Expected: ${formatExpectedDate(exp)}`, col2X + 25, y2 + 8.5); y2 += 4; }
                    y2 += 9;
                });
                y = Math.max(y1, y2) + 4;
                if (app.documents.portfolioLink) drawFull('Portfolio Link', app.documents.portfolioLink);
            }
            if (app.education) {
                drawSec('Education Background', C.teal);
                drawRow([{ k: 'Was Enrolled', v: yesNo(app.education.wasEnrolled) }, { k: 'Currently Enrolled', v: yesNo(app.education.isCurrentlyEnrolled) }]);
                if (app.education.institutionName) drawRow([{ k: 'Institution', v: app.education.institutionName }, { k: 'Degree', v: capFirst(app.education.degree) }]);
                if (app.education.specialisation) drawRow([{ k: 'Specialisation', v: app.education.specialisation }, { k: 'Country of Study', v: app.education.country }]);
                drawRow([{ k: 'Transcript Uploaded', v: app.education.transcriptUploaded ? 'Yes' : 'No' }, { k: 'Edu. Completion', v: `${app.education.eduCompletionPct || 0}%` }]);
            }
            if (app.scores && Object.values(app.scores).some(v => v && typeof v === 'string')) {
                drawSec('Test Scores', C.orange);
                const sl = [{ k: 'SAT Total', v: app.scores.satTotal }, { k: 'SAT Math', v: app.scores.satMath }, { k: 'SAT Reading', v: app.scores.satReading }, { k: 'IELTS', v: app.scores.ielts }, { k: 'TOEFL', v: app.scores.toefl }, { k: 'PTE', v: app.scores.pte }, { k: 'Duolingo', v: app.scores.duolingo }, { k: 'ACT', v: app.scores.act }].filter(s => s.v);
                for (let i = 0; i < sl.length; i += 2) drawRow([sl[i], sl[i + 1] || { k: '', v: '' }]);
            }
            if (app.specialNeeds) {
                drawSec('Special Needs', C.orange);
                drawRow([{ k: 'Has Special Needs', v: capFirst(app.specialNeeds.hasSpecialNeeds) }, { k: 'Status', v: capFirst(app.specialNeeds.snStatus) }]);
                if (app.specialNeeds.hasSpecialNeeds === 'yes') {
                    if (app.specialNeeds.specialNeeds?.length) drawFull('Special Needs', app.specialNeeds.specialNeeds.join(', '));
                    if (app.specialNeeds.requiredArrangements?.length) drawFull('Required Arrangements', app.specialNeeds.requiredArrangements.join(', '));
                }
            }
            drawSec('Application Status & Progress', C.teal);
            drawRow([{ k: 'Application Status', v: capFirst(app.applicationStatus) }, { k: 'Verified', v: app.isVerified ? 'Yes' : 'No' }]);
            drawRow([{ k: 'Account Status', v: capFirst(app.accountStatus) }, { k: 'Role', v: capFirst(app.role) }]);
            drawRow([{ k: 'Joined', v: formatDate(app.joinDate) }, { k: 'Last Login', v: formatDate(app.lastLogin) }]);
            drawRow([{ k: 'Created At', v: formatDate(app.createdAt) }, { k: 'Last Updated', v: formatDate(app.updatedAt) }]);
            checkPageBreak(20);
            doc.setFontSize(8).setFont(undefined, 'normal').setTextColor(...C.mid); doc.text('EQHE Application Completion:', ML, y); y += 5;
            drawBar(app.completionPercentage || 0); drawFooter();
            doc.save(`${app.applicationId || app.studentId || 'application'}.pdf`);
        } catch (err) {
            console.error('PDF error:', err); alert('Failed to generate PDF. Please try again.');
        } finally { setPdfLoading(null); }
    };

    /* ─── Loading / Error ────────────────────────────────────────────────── */
    if (loading) return (
        <div className="gus-loading"><div className="gus-spinner" /><p>Loading GUS University Applications...</p></div>
    );
    if (error) return (
        <div className="gus-loading">
            <div className="gus-error-icon"><IcoAlert size={44} /></div>
            <p className="gus-error-msg">{error}</p>
            <div className="gus-error-actions">
                <button className="gus-refresh-btn" onClick={fetchApplications}>Retry</button>
                <button className="gus-refresh-btn" onClick={() => window.location.href = '/process-admin-login'}>Go to Login</button>
            </div>
        </div>
    );

    /* ─── RENDER ─────────────────────────────────────────────────────────── */
    return (
        <div className="gus-wrap">

            {/* Header */}
            <div className="gus-page-header">
                <div className="gus-page-header-left">
                    <div className="gus-page-logo">
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="#7B61FF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        GUS University
                    </div>
                    <p className="gus-page-sub">Application Management Dashboard</p>
                </div>
                <button className="gus-refresh-btn" onClick={fetchApplications}><IcoRefresh size={13} color="#7B61FF" /> Refresh</button>
            </div>

            {/* Stats */}
            <div className="gus-stats-row">
                <div className="gus-stat-card gus-stat-total">
                    <div className="gus-stat-icon-wrap"><IcoClipboard size={22} color="white" /></div>
                    <div className="gus-stat-text"><span className="gus-stat-label">Total Applications</span><span className="gus-stat-num">{stats.total}</span></div>
                </div>
                <div className="gus-stat-card gus-stat-incomplete">
                    <div className="gus-stat-icon-wrap"><IcoClock size={22} color="white" /></div>
                    <div className="gus-stat-text"><span className="gus-stat-label">Incomplete</span><span className="gus-stat-num">{stats.incomplete}</span></div>
                </div>
                <div className="gus-stat-card gus-stat-completed">
                    <div className="gus-stat-icon-wrap"><IcoCheck2 size={22} color="white" /></div>
                    <div className="gus-stat-text"><span className="gus-stat-label">Completed</span><span className="gus-stat-num">{stats.completed}</span></div>
                </div>
                <div className="gus-stat-card gus-stat-review">
                    <div className="gus-stat-icon-wrap"><IcoEye size={22} color="white" /></div>
                    <div className="gus-stat-text"><span className="gus-stat-label">In Progress</span><span className="gus-stat-num">{stats.underReview}</span></div>
                </div>
            </div>

            {/* Controls */}
            <div className="gus-controls">
                <div className="gus-search-box">
                    <IcoSearch />
                    <input type="text" className="gus-search-input" placeholder="Search by name, email or student ID..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
                    {searchQuery && <button className="gus-search-clear" onClick={() => setSearchQuery('')}><IcoXMini size={11} color="#8B8FA8" /></button>}
                </div>
                <div className="gus-filters">
                    {[{ key: 'all', label: 'All' }, { key: 'completed', label: 'Completed' }, { key: 'incomplete', label: 'Incomplete' }, { key: 'inprogress', label: 'In Progress' }].map(f => (
                        <button key={f.key} className={`gus-filter-btn ${filterStatus === f.key ? 'active' : ''}`} onClick={() => setFilterStatus(f.key)}>{f.label}</button>
                    ))}
                </div>
            </div>

            {/* Table */}
            <div className="gus-table-card">
                <table className="gus-table">
                    <thead><tr className="gus-thead-row"><th>Application ID</th><th>Student</th><th>Status</th><th>Submitted</th><th>Progress</th><th>Action</th></tr></thead>
                    <tbody>
                        {filtered.length === 0 ? (
                            <tr><td colSpan="6"><div className="gus-empty-state"><div className="gus-empty-icon"><IcoInbox size={40} color="#C8CADC" /></div><p>{applications.length === 0 ? 'No applications found in the database.' : 'No applications match your search or filter.'}</p></div></td></tr>
                        ) : (
                            filtered.map((app, idx) => (
                                <tr key={app._id || idx} className="gus-tbody-row" style={{ animationDelay: `${idx * 0.04}s` }}>
                                    <td>
                                        <span className="gus-college-badge">{app.applicationId || '—'}</span>
                                        <div className="gus-sub-id">{app.studentId?.slice(-8)}</div>
                                    </td>
                                    <td>
                                        <div className="gus-student-cell">
                                            <div className="gus-avatar" style={{ background: getAvatarColor(app.studentName) }}>{getInitials(app.studentName)}</div>
                                            <div className="gus-student-details">
                                                <span className="gus-student-name">{app.studentName || 'Unknown'}</span>
                                                <span className="gus-student-email">{app.email || '—'}</span>
                                                {app.phone && <span className="gus-student-phone">{app.phone}</span>}
                                            </div>
                                        </div>
                                    </td>
                                    <td><span className={`gus-badge ${getStatusClass(app)}`}>{getStatusLabel(app)}</span></td>
                                    <td><span className="gus-date-text">{formatDate(app.updatedAt || app.createdAt)}</span></td>
                                    <td>
                                        <div className="gus-prog-cell">
                                            <div className="gus-prog-track"><div className="gus-prog-fill" style={{ width: `${app.completionPercentage || 0}%` }} /></div>
                                            <span className="gus-prog-pct">{app.completionPercentage || 0}%</span>
                                        </div>
                                    </td>
                                    <td>
                                        <div className="gus-action-group">
                                            <button className="gus-btn-view" onClick={() => openModal({ ...app })}><IcoViewBtn /> View</button>
                                            <button className="gus-btn-dl" onClick={() => handleDownloadPDF(app)} disabled={pdfLoading === app.studentId}>
                                                {pdfLoading === app.studentId ? <span className="gus-btn-spinner" /> : <IcoDlBtn />}
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
                <div className="gus-table-footer">Showing <strong>{filtered.length}</strong> of <strong>{applications.length}</strong> applications</div>
            </div>

            {/* ══ MODAL ══════════════════════════════════════════════════════ */}
            {selectedApp && (
                <div className="gus-overlay" onClick={closeModal}>
                    <div className="gus-modal" onClick={e => e.stopPropagation()}>
                        <div className="gus-modal-hdr">
                            <div className="gus-modal-hdr-left">
                                <div className="gus-modal-avatar" style={{ background: getAvatarColor(selectedApp.studentName) }}>{getInitials(selectedApp.studentName)}</div>
                                <div><h2 className="gus-modal-title">{selectedApp.studentName || '—'}</h2><p className="gus-modal-appid">{selectedApp.applicationId || '—'}</p></div>
                            </div>
                            <div className="gus-modal-hdr-right">
                                <span className={`gus-badge ${getStatusClass(selectedApp)}`}>{getStatusLabel(selectedApp)}</span>
                                <button className="gus-modal-x" onClick={closeModal}><IcoXMini size={13} color="#8B8FA8" /></button>
                            </div>
                        </div>

                        <div className="gus-modal-body">
                            {/* Student Info */}
                            <div className="gus-modal-sec">
                                <div className="gus-modal-sec-title"><span className="gus-sec-dot gus-dot-purple" />Student Information</div>
                                <div className="gus-modal-grid">
                                    <div className="gus-modal-field"><span className="gus-field-lbl">Application ID</span><span className="gus-field-val">{val(selectedApp.applicationId)}</span></div>
                                    <div className="gus-modal-field"><span className="gus-field-lbl">Student ID</span><span className="gus-field-val" style={{ fontSize: '11px', wordBreak: 'break-all' }}>{val(selectedApp.studentId)}</span></div>
                                    <div className="gus-modal-field"><span className="gus-field-lbl">Title</span><span className="gus-field-val">{val(selectedApp.title)}</span></div>
                                    <div className="gus-modal-field"><span className="gus-field-lbl">Full Name</span><span className="gus-field-val">{val(selectedApp.studentName)}</span></div>
                                    <div className="gus-modal-field"><span className="gus-field-lbl">Gender</span><span className="gus-field-val">{capFirst(selectedApp.gender)}</span></div>
                                    <div className="gus-modal-field"><span className="gus-field-lbl">Date of Birth</span><span className="gus-field-val">{formatDate(selectedApp.dateOfBirth)}</span></div>
                                    <div className="gus-modal-field"><span className="gus-field-lbl">Place of Birth</span><span className="gus-field-val">{val(selectedApp.placeOfBirth)}</span></div>
                                    <div className="gus-modal-field"><span className="gus-field-lbl">Country of Birth</span><span className="gus-field-val">{val(selectedApp.countryOfBirth)}</span></div>
                                </div>
                            </div>
                            {/* Contact */}
                            <div className="gus-modal-sec">
                                <div className="gus-modal-sec-title"><span className="gus-sec-dot gus-dot-teal" />Contact Information</div>
                                <div className="gus-modal-grid">
                                    <div className="gus-modal-field"><span className="gus-field-lbl">Email</span><span className="gus-field-val">{val(selectedApp.email)}</span></div>
                                    <div className="gus-modal-field"><span className="gus-field-lbl">Mobile</span><span className="gus-field-val">{val(selectedApp.phone)}</span></div>
                                    <div className="gus-modal-field"><span className="gus-field-lbl">Landline</span><span className="gus-field-val">{val(selectedApp.landline)}</span></div>
                                    <div className="gus-modal-field"><span className="gus-field-lbl">Country of Residence</span><span className="gus-field-val">{val(selectedApp.countryOfResidence)}</span></div>
                                    <div className="gus-modal-field"><span className="gus-field-lbl">Correspondence Language</span><span className="gus-field-val">{capFirst(selectedApp.correspondenceLanguage)}</span></div>
                                    <div className="gus-modal-field"><span className="gus-field-lbl">Last Updated</span><span className="gus-field-val">{formatDate(selectedApp.updatedAt)}</span></div>
                                </div>
                            </div>
                            {/* Passport */}
                            <div className="gus-modal-sec">
                                <div className="gus-modal-sec-title"><span className="gus-sec-dot gus-dot-orange" />Passport & Travel Documents</div>
                                <div className="gus-modal-grid">
                                    <div className="gus-modal-field"><span className="gus-field-lbl">Citizenship</span><span className="gus-field-val">{val(selectedApp.citizenship)}</span></div>
                                    <div className="gus-modal-field"><span className="gus-field-lbl">Passport Number</span><span className="gus-field-val">{val(selectedApp.passportNumber)}</span></div>
                                    <div className="gus-modal-field"><span className="gus-field-lbl">Issue Date</span><span className="gus-field-val">{formatDate(selectedApp.passportIssueDate)}</span></div>
                                    <div className="gus-modal-field"><span className="gus-field-lbl">Expiry Date</span><span className="gus-field-val">{formatDate(selectedApp.passportExpiryDate)}</span></div>
                                    <div className="gus-modal-field"><span className="gus-field-lbl">Issuing Country</span><span className="gus-field-val">{val(selectedApp.issuingCountry)}</span></div>
                                    <div className="gus-modal-field"><span className="gus-field-lbl">Document Type</span><span className="gus-field-val">{capFirst(selectedApp.documentType)}</span></div>
                                    <div className="gus-modal-field"><span className="gus-field-lbl">EU Citizen</span><span className="gus-field-val">{yesNo(selectedApp.isEUCitizen)}</span></div>
                                    <div className="gus-modal-field"><span className="gus-field-lbl">Needs Visa</span><span className="gus-field-val">{capFirst(selectedApp.needVisa)}</span></div>
                                    <div className="gus-modal-field"><span className="gus-field-lbl">Passport Uploaded</span><YesNoVal value={selectedApp.passportUploaded} /></div>
                                    <div className="gus-modal-field"><span className="gus-field-lbl">Photograph Uploaded</span><YesNoVal value={selectedApp.photographUploaded} /></div>
                                </div>
                            </div>
                            {/* EQHE */}
                            <div className="gus-modal-sec">
                                <div className="gus-modal-sec-title"><span className="gus-sec-dot gus-dot-purple" />Primary EQHE Details</div>
                                <div className="gus-modal-grid">
                                    <div className="gus-modal-field gus-field-full"><span className="gus-field-lbl">Qualification Title</span><span className="gus-field-val">{fmt(eqheTitleMap, selectedApp.eqheOriginalTitle)}</span></div>
                                    <div className="gus-modal-field"><span className="gus-field-lbl">Country</span><span className="gus-field-val">{fmt(countryMap, selectedApp.eqheCountry)}</span></div>
                                    <div className="gus-modal-field"><span className="gus-field-lbl">City</span><span className="gus-field-val">{val(selectedApp.eqheCity)}</span></div>
                                    <div className="gus-modal-field"><span className="gus-field-lbl">Date</span><span className="gus-field-val">{formatDate(selectedApp.eqheDate)}</span></div>
                                    <div className="gus-modal-field"><span className="gus-field-lbl">Certificate</span><YesNoVal value={!!selectedApp.eqheCertificateFileName} /></div>
                                    <div className="gus-modal-field"><span className="gus-field-lbl">Has Additional EQHE</span><span className="gus-field-val">{yesNo(selectedApp.hasAnotherEQHE)}</span></div>
                                </div>
                            </div>
                            {selectedApp.hasAnotherEQHE && (
                                <div className="gus-modal-sec">
                                    <div className="gus-modal-sec-title"><span className="gus-sec-dot gus-dot-orange" />Additional EQHE Details</div>
                                    <div className="gus-modal-grid">
                                        <div className="gus-modal-field gus-field-full"><span className="gus-field-lbl">Qualification Title</span><span className="gus-field-val">{fmt(eqheTitleMap, selectedApp.anotherEqheOriginalTitle)}</span></div>
                                        <div className="gus-modal-field"><span className="gus-field-lbl">Country</span><span className="gus-field-val">{fmt(countryMap, selectedApp.anotherEqheCountry)}</span></div>
                                        <div className="gus-modal-field"><span className="gus-field-lbl">City</span><span className="gus-field-val">{val(selectedApp.anotherEqheCity)}</span></div>
                                        <div className="gus-modal-field"><span className="gus-field-lbl">Date</span><span className="gus-field-val">{formatDate(selectedApp.anotherEqheDate)}</span></div>
                                        <div className="gus-modal-field"><span className="gus-field-lbl">Certificate</span><YesNoVal value={!!selectedApp.anotherEqheCertificateFileName} /></div>
                                    </div>
                                </div>
                            )}
                            {/* Documents */}
                            {selectedApp.documents && (
                                <div className="gus-modal-sec">
                                    <div className="gus-modal-sec-title"><span className="gus-sec-dot gus-dot-purple" />Documents Status</div>
                                    <div className="gus-doc-progress-wrap">
                                        <div className="gus-doc-progress-track"><div className="gus-doc-progress-fill" style={{ width: `${selectedApp.documents.docsCompletionPct || 0}%` }} /></div>
                                        <span className="gus-doc-progress-label">{selectedApp.documents.docsCompletionPct || 0}% Complete</span>
                                    </div>
                                    <div className="gus-doc-cards">
                                        {[
                                            { lbl: 'CV', required: true, up: selectedApp.documents.cvUploaded, st: selectedApp.documents.cvStatus, meta: selectedApp.documents.cvMeta, exp: null },
                                            { lbl: 'Photo', required: true, up: selectedApp.documents.photoUploaded, st: selectedApp.documents.photoStatus, meta: selectedApp.documents.photoMeta, exp: null },
                                            { lbl: 'Passport', required: true, up: selectedApp.documents.passportUploaded, st: selectedApp.documents.passportStatus, meta: selectedApp.documents.passportMeta, exp: null },
                                            { lbl: 'Transcript', required: true, up: selectedApp.documents.transcriptUploaded, st: selectedApp.documents.transcriptStatus, meta: selectedApp.documents.transcriptMeta, exp: null },
                                            { lbl: 'Diploma', required: true, up: selectedApp.documents.diplomaUploaded, st: selectedApp.documents.diplomaStatus, meta: selectedApp.documents.diplomaMeta, exp: null },
                                            { lbl: 'Certificate 9th', required: true, up: selectedApp.documents.cert9thUploaded, st: selectedApp.documents.cert9thStatus, meta: selectedApp.documents.cert9thMeta, exp: selectedApp.documents.cert9thExpectedDate },
                                            { lbl: 'Certificate 10th', required: true, up: selectedApp.documents.cert10thUploaded, st: selectedApp.documents.cert10thStatus, meta: selectedApp.documents.cert10thMeta, exp: selectedApp.documents.cert10thExpectedDate },
                                            { lbl: 'Certificate 11th', required: true, up: selectedApp.documents.cert11thUploaded, st: selectedApp.documents.cert11thStatus, meta: selectedApp.documents.cert11thMeta, exp: selectedApp.documents.cert11thExpectedDate },
                                            { lbl: 'Certificate 12th', required: true, up: selectedApp.documents.cert12thUploaded, st: selectedApp.documents.cert12thStatus, meta: selectedApp.documents.cert12thMeta, exp: selectedApp.documents.cert12thExpectedDate },
                                            { lbl: 'Test Scores', required: false, up: selectedApp.documents.testScoresUploaded, st: null, meta: selectedApp.documents.testScoresMeta, exp: null },
                                            { lbl: 'Language Proficiency', required: false, up: selectedApp.documents.langProfUploaded, st: null, meta: selectedApp.documents.langProfMeta, exp: null },
                                            { lbl: 'Recommendation Letter', required: false, up: selectedApp.documents.recLetterUploaded, st: null, meta: selectedApp.documents.recLetterMeta, exp: null },
                                        ].map(({ lbl, required, up, st, meta, exp }) => {
                                            const hasExpected = !up && !!exp;
                                            const statusLabel = up ? (st === 'approved' ? 'Approved' : st === 'rejected' ? 'Rejected' : 'Pending') : hasExpected ? 'Expected' : 'Not Uploaded';
                                            const statusClass = up ? (st === 'approved' ? 'doc-status-approved' : st === 'rejected' ? 'doc-status-rejected' : 'doc-status-pending') : hasExpected ? 'doc-status-expected' : 'doc-status-missing';
                                            const cardClass = up ? 'doc-card-uploaded' : hasExpected ? 'doc-card-expected' : 'doc-card-missing';
                                            return (
                                                <div key={lbl} className={`gus-doc-card ${cardClass}`}>
                                                    <div className="gus-doc-card-icon">
                                                        {up ? getFileIconComponent(meta?.fileType) : hasExpected ? <IcoCalendar size={15} color="#FF8C42" /> : <IcoFileX size={15} color="#FF6B8A" />}
                                                    </div>
                                                    <div className="gus-doc-card-body">
                                                        <div className="gus-doc-card-top">
                                                            <span className="gus-doc-card-label">{lbl}</span>
                                                            {required && <span className="gus-doc-required-badge">Required</span>}
                                                        </div>
                                                        <span className={`gus-doc-status-pill ${statusClass}`}>{statusLabel}</span>
                                                        {up && meta && (
                                                            <div className="gus-doc-file-info">
                                                                <span className="gus-doc-filename" title={meta.originalName}>{meta.originalName?.length > 28 ? meta.originalName.slice(0, 25) + '…' : meta.originalName}</span>
                                                                <span className="gus-doc-filesize">{meta.fileType?.toUpperCase()} · {formatFileSize(meta.fileSize)}</span>
                                                                {meta.uploadedAt && <span className="gus-doc-uploaddate">Uploaded {new Date(meta.uploadedAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}</span>}
                                                                <button className="gus-doc-view-btn" onClick={() => openDocViewer(meta, lbl)}><IcoEye size={11} color="currentColor" /> View Document</button>
                                                            </div>
                                                        )}
                                                        {hasExpected && <div className="gus-doc-expected-info"><span className="gus-doc-expected-label">Expected by {formatExpectedDate(exp)}</span></div>}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                    {selectedApp.documents.portfolioLink && (
                                        <div className="gus-doc-portfolio">
                                            <span className="gus-field-lbl">Portfolio Link</span>
                                            <a href={selectedApp.documents.portfolioLink} target="_blank" rel="noopener noreferrer" className="gus-doc-portfolio-link">{selectedApp.documents.portfolioLink}</a>
                                        </div>
                                    )}
                                </div>
                            )}
                            {/* Education */}
                            {selectedApp.education && (
                                <div className="gus-modal-sec">
                                    <div className="gus-modal-sec-title"><span className="gus-sec-dot gus-dot-teal" />Education Background</div>
                                    <div className="gus-modal-grid">
                                        <div className="gus-modal-field"><span className="gus-field-lbl">Was Enrolled</span><span className="gus-field-val">{yesNo(selectedApp.education.wasEnrolled)}</span></div>
                                        <div className="gus-modal-field"><span className="gus-field-lbl">Currently Enrolled</span><span className="gus-field-val">{yesNo(selectedApp.education.isCurrentlyEnrolled)}</span></div>
                                        {selectedApp.education.institutionName && <div className="gus-modal-field"><span className="gus-field-lbl">Institution</span><span className="gus-field-val">{val(selectedApp.education.institutionName)}</span></div>}
                                        {selectedApp.education.degree && <div className="gus-modal-field"><span className="gus-field-lbl">Degree</span><span className="gus-field-val">{capFirst(selectedApp.education.degree)}</span></div>}
                                        {selectedApp.education.specialisation && <div className="gus-modal-field"><span className="gus-field-lbl">Specialisation</span><span className="gus-field-val">{val(selectedApp.education.specialisation)}</span></div>}
                                        <div className="gus-modal-field"><span className="gus-field-lbl">Edu. Completion</span><span className="gus-field-val">{selectedApp.education.eduCompletionPct || 0}%</span></div>
                                    </div>
                                </div>
                            )}
                            {/* Scores */}
                            {selectedApp.scores && Object.values(selectedApp.scores).some(v => v && typeof v === 'string') && (
                                <div className="gus-modal-sec">
                                    <div className="gus-modal-sec-title"><span className="gus-sec-dot gus-dot-orange" />Test Scores</div>
                                    <div className="gus-modal-grid">
                                        {[{ lbl: 'SAT Total', v: selectedApp.scores.satTotal }, { lbl: 'SAT Math', v: selectedApp.scores.satMath }, { lbl: 'SAT Reading', v: selectedApp.scores.satReading }, { lbl: 'IELTS', v: selectedApp.scores.ielts }, { lbl: 'TOEFL', v: selectedApp.scores.toefl }, { lbl: 'PTE', v: selectedApp.scores.pte }, { lbl: 'Duolingo', v: selectedApp.scores.duolingo }, { lbl: 'ACT', v: selectedApp.scores.act }].filter(s => s.v).map(s => (
                                            <div className="gus-modal-field" key={s.lbl}><span className="gus-field-lbl">{s.lbl}</span><span className="gus-field-val">{s.v}</span></div>
                                        ))}
                                    </div>
                                </div>
                            )}
                            {/* Special Needs */}
                            {selectedApp.specialNeeds && (
                                <div className="gus-modal-sec">
                                    <div className="gus-modal-sec-title"><span className="gus-sec-dot gus-dot-orange" />Special Needs</div>
                                    <div className="gus-modal-grid">
                                        <div className="gus-modal-field"><span className="gus-field-lbl">Has Special Needs</span><YesNoVal value={selectedApp.specialNeeds.hasSpecialNeeds === 'yes'} /></div>
                                        {selectedApp.specialNeeds.hasSpecialNeeds === 'yes' && <>
                                            {selectedApp.specialNeeds.specialNeeds?.length > 0 && <div className="gus-modal-field gus-field-full"><span className="gus-field-lbl">Special Needs</span><span className="gus-field-val">{selectedApp.specialNeeds.specialNeeds.join(', ')}</span></div>}
                                            {selectedApp.specialNeeds.requiredArrangements?.length > 0 && <div className="gus-modal-field gus-field-full"><span className="gus-field-lbl">Required Arrangements</span><span className="gus-field-val">{selectedApp.specialNeeds.requiredArrangements.join(', ')}</span></div>}
                                        </>}
                                    </div>
                                </div>
                            )}
                            {/* App Status */}
                            <div className="gus-modal-sec">
                                <div className="gus-modal-sec-title"><span className="gus-sec-dot gus-dot-teal" />Application Status</div>
                                <div className="gus-modal-grid">
                                    <div className="gus-modal-field"><span className="gus-field-lbl">Application Status</span><span className="gus-field-val">{capFirst(selectedApp.applicationStatus)}</span></div>
                                    <div className="gus-modal-field"><span className="gus-field-lbl">Verified</span><YesNoVal value={selectedApp.isVerified} /></div>
                                    <div className="gus-modal-field"><span className="gus-field-lbl">Account Status</span><span className="gus-field-val">{capFirst(selectedApp.accountStatus)}</span></div>
                                    <div className="gus-modal-field"><span className="gus-field-lbl">Role</span><span className="gus-field-val">{capFirst(selectedApp.role)}</span></div>
                                    <div className="gus-modal-field"><span className="gus-field-lbl">Joined</span><span className="gus-field-val">{formatDate(selectedApp.joinDate)}</span></div>
                                    <div className="gus-modal-field"><span className="gus-field-lbl">Last Login</span><span className="gus-field-val">{formatDate(selectedApp.lastLogin)}</span></div>
                                    <div className="gus-modal-field"><span className="gus-field-lbl">Created At</span><span className="gus-field-val">{formatDate(selectedApp.createdAt)}</span></div>
                                    <div className="gus-modal-field"><span className="gus-field-lbl">Last Updated</span><span className="gus-field-val">{formatDate(selectedApp.updatedAt)}</span></div>
                                </div>
                            </div>
                            {/* Progress */}
                            <div className="gus-modal-sec">
                                <div className="gus-modal-sec-title"><span className="gus-sec-dot gus-dot-purple" />Application Progress</div>
                                <div className="gus-modal-prog-wrap">
                                    <div className="gus-modal-prog-track"><div className="gus-modal-prog-fill" style={{ width: `${selectedApp.completionPercentage || 0}%` }} /></div>
                                    <span className="gus-modal-prog-lbl">{selectedApp.completionPercentage || 0}% Complete</span>
                                </div>
                            </div>
                        </div>

                        <div className="gus-modal-ftr">
                            <button className="gus-modal-dl-btn" onClick={() => { closeModal(); handleDownloadPDF(selectedApp); }} disabled={pdfLoading === selectedApp.studentId}>
                                {pdfLoading === selectedApp.studentId
                                    ? <><span className="gus-btn-spinner" style={{ marginRight: 6 }} /> Generating...</>
                                    : <><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 15, height: 15, marginRight: 6 }} strokeLinecap="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/></svg>Download PDF</>
                                }
                            </button>
                            <button className="gus-modal-close-btn" onClick={closeModal}>Close</button>
                        </div>
                    </div>
                </div>
            )}

            {/* ══ DOC VIEWER ══════════════════════════════════════════════ */}
            {docViewer && (
                <div className="gus-docviewer-overlay" onClick={closeDocViewer}>
                    <div className="gus-docviewer-box" onClick={e => e.stopPropagation()}>
                        <div className="gus-docviewer-hdr">
                            <div className="gus-docviewer-hdr-left">
                                <span className="gus-docviewer-icon">
                                    {isImageType(docViewer.fileType) ? <IcoImage size={20} color="#7B61FF" /> : docViewer.fileType === 'pdf' ? <IcoFilePdf size={20} color="#FF6B8A" /> : <IcoFile size={20} color="#8B8FA8" />}
                                </span>
                                <div><div className="gus-docviewer-title">{docViewer.label}</div><div className="gus-docviewer-filename">{docViewer.originalName}</div></div>
                            </div>
                            <div className="gus-docviewer-hdr-right">
                                <a href={docViewer.url} target="_blank" rel="noopener noreferrer" className="gus-docviewer-open-btn"><IcoExternal size={12} /> Open in New Tab</a>
                                <button className="gus-docviewer-close" onClick={closeDocViewer}><IcoXMini size={13} color="#8B8FA8" /></button>
                            </div>
                        </div>
                        <div className="gus-docviewer-body">
                            {isImageType(docViewer.fileType) ? (
                                <div className="gus-docviewer-img-wrap">
                                    <img src={docViewer.url} alt={docViewer.originalName} className="gus-docviewer-img" onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }} />
                                    <div className="gus-docviewer-fallback" style={{ display: 'none' }}>
                                        <IcoImage size={56} color="#C8CADC" /><p>Could not load image preview.</p>
                                        <a href={docViewer.url} target="_blank" rel="noopener noreferrer" className="gus-docviewer-open-btn">Open File Directly</a>
                                    </div>
                                </div>
                            ) : docViewer.fileType === 'pdf' ? (
                                <object data={docViewer.url} type="application/pdf" style={{ width: '100%', height: '100%', border: 'none' }}><embed src={docViewer.url} type="application/pdf" style={{ width: '100%', height: '100%' }} /></object>
                            ) : (
                                <div className="gus-docviewer-fallback">
                                    <IcoFile size={56} color="#C8CADC" />
                                    <p style={{ fontWeight: 600, color: '#1A1D2E' }}>{docViewer.originalName}</p>
                                    <p style={{ color: '#8B8FA8', fontSize: 13 }}>Preview not available for <strong>.{docViewer.fileType}</strong> files.</p>
                                    <a href={docViewer.url} target="_blank" rel="noopener noreferrer" className="gus-docviewer-open-btn" style={{ marginTop: 8 }}><IcoDownload size={12} /> Download File</a>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default GusUniversity;