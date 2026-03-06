import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import './gusuniversity.css';

/* ─── jsPDF lazy-loader (CDN, no npm needed) ──────────────────────────────── */
const loadJsPDF = () =>
    new Promise((resolve, reject) => {
        if (window.jspdf) { resolve(window.jspdf.jsPDF); return; }
        const s = document.createElement('script');
        s.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
        s.onload  = () => resolve(window.jspdf.jsPDF);
        s.onerror = reject;
        document.head.appendChild(s);
    });

const GusUniversity = () => {

    // ─── State ──────────────────────────────────────────────────────────────
    const [applications, setApplications] = useState([]);
    const [loading, setLoading]           = useState(true);
    const [error, setError]               = useState(null);
    const [searchQuery, setSearchQuery]   = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [selectedApp, setSelectedApp]   = useState(null);
    const [pdfLoading, setPdfLoading]     = useState(null);   // stores studentId while generating
    const [stats, setStats]               = useState({ total: 0, completed: 0, incomplete: 0, underReview: 0 });

    // ─── Stable API instance ────────────────────────────────────────────────
    const apiRef = useRef(null);
    if (!apiRef.current) {
        const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';
        const instance = axios.create({ baseURL: API_BASE_URL, timeout: 15000 });
        instance.interceptors.request.use((config) => {
            const token =
                localStorage.getItem('processAdminToken') ||
                localStorage.getItem('token')             ||
                localStorage.getItem('adminToken');
            if (token) config.headers.Authorization = `Bearer ${token}`;
            config.headers['Content-Type'] = 'application/json';
            return config;
        }, (err) => Promise.reject(err));
        instance.interceptors.response.use(
            (res) => res,
            (err) => {
                if (err.response?.status === 401) console.log('🔴 Auth failed');
                if (err.response?.status === 403) console.log('🔴 Forbidden');
                return Promise.reject(err);
            }
        );
        apiRef.current = instance;
    }
    const api = apiRef.current;

    // ─── Helpers ────────────────────────────────────────────────────────────
    const formatDate = (d) => {
        if (!d) return '—';
        try { return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }); }
        catch { return '—'; }
    };

    const val      = (v) => (v !== undefined && v !== null && v !== '') ? v : '—';
    const yesNo    = (v) => v === true ? 'Yes' : v === false ? 'No' : '—';
    const capFirst = (s) => s ? s.charAt(0).toUpperCase() + s.slice(1) : '—';

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
    const avatarColors   = ['#6C63FF', '#5B50E8', '#7B74FF', '#4A90D9', '#43B89C'];
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

    const fmt = (map, v) => map[v] || v || '—';

    // ─── Stats ──────────────────────────────────────────────────────────────
    const calculateStats = useCallback((apps) => {
        setStats({
            total:       apps.length,
            completed:   apps.filter(a => a.completionPercentage === 100).length,
            incomplete:  apps.filter(a => a.completionPercentage === 0).length,
            underReview: apps.filter(a => a.completionPercentage > 0 && a.completionPercentage < 100).length
        });
    }, []);

    // ─── Fetch ──────────────────────────────────────────────────────────────
    const fetchApplications = useCallback(async () => {
        setLoading(true);
        setError(null);
        const token =
            localStorage.getItem('processAdminToken') ||
            localStorage.getItem('token')             ||
            localStorage.getItem('adminToken');
        if (!token) { setError('No authentication token found. Please login again.'); setLoading(false); return; }
        try {
            const response = await api.get('/api/application/process-admin/gus-university/applications');
            if (response.data.success) {
                const apps = response.data.data || [];
                setApplications(apps);
                calculateStats(apps);
            } else {
                setError('Failed to load applications. Please try again.');
            }
        } catch (err) {
            if (err.response?.status === 401)      setError('Authentication failed. Please login again.');
            else if (err.response?.status === 403) setError('You do not have permission to view these applications.');
            else                                   setError('Failed to load applications. Please try again.');
        } finally {
            setLoading(false);
        }
    }, [api, calculateStats]);

    useEffect(() => { fetchApplications(); }, [fetchApplications]);

    // ─── Filter ─────────────────────────────────────────────────────────────
    const filtered = applications.filter(app => {
        const q = searchQuery.toLowerCase();
        const matchSearch =
            app.studentName?.toLowerCase().includes(q) ||
            app.email?.toLowerCase().includes(q)       ||
            String(app.studentId).includes(q)          ||
            app.applicationId?.toLowerCase().includes(q);
        const s = getStatusLabel(app);
        const matchFilter =
            filterStatus === 'all'                                 ||
            (filterStatus === 'completed'  && s === 'COMPLETED')  ||
            (filterStatus === 'incomplete' && s === 'INCOMPLETE') ||
            (filterStatus === 'inprogress' && s === 'IN PROGRESS');
        return matchSearch && matchFilter;
    });

    // ─── Modal ──────────────────────────────────────────────────────────────
    const openModal  = (app) => setSelectedApp({ ...app });
    const closeModal = ()    => setSelectedApp(null);

    // ─── PDF Generator ──────────────────────────────────────────────────────
    const handleDownloadPDF = async (app) => {
        setPdfLoading(app.studentId);
        try {
            const JsPDF = await loadJsPDF();
            const doc   = new JsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

            const PW  = 210;  // A4 width mm
            const PH  = 297;  // A4 height mm
            const ML  = 14;   // margin left
            const MR  = 14;   // margin right
            const CW  = PW - ML - MR;  // content width
            const COL = CW / 2 - 3;    // column width for 2-col grid

            // ── Colour palette ──────────────────────────────────────────────
            const C = {
                primary:   [108, 99, 255],
                accent:    [67, 184, 156],
                dark:      [30, 30, 47],
                mid:       [90, 90, 110],
                light:     [245, 245, 252],
                border:    [220, 220, 235],
                white:     [255, 255, 255],
                red:       [239, 68, 68],
                yellow:    [234, 179, 8],
                green:     [34, 197, 94],
            };

            // ── Helper draw functions ───────────────────────────────────────
            let y = 0;  // cursor

            const checkPageBreak = (needed = 20) => {
                if (y + needed > PH - 16) {
                    doc.addPage();
                    drawPageFooter();
                    y = 18;
                }
            };

            const drawPageFooter = () => {
                const pg = doc.internal.getCurrentPageInfo().pageNumber;
                doc.setFontSize(8).setTextColor(...C.mid);
                doc.text(`GUS University — ${app.applicationId || 'Application'}`, ML, PH - 8);
                doc.text(`Page ${pg}`, PW - ML, PH - 8, { align: 'right' });
                doc.setDrawColor(...C.border);
                doc.line(ML, PH - 12, PW - MR, PH - 12);
            };

            const drawSectionHeader = (title, colorDot = C.primary) => {
                checkPageBreak(18);
                // Dot + title
                doc.setFillColor(...colorDot);
                doc.circle(ML + 2, y + 3.5, 2, 'F');
                doc.setFontSize(11).setFont(undefined, 'bold').setTextColor(...C.dark);
                doc.text(title, ML + 6, y + 4.5);
                // Underline
                doc.setDrawColor(...colorDot);
                doc.setLineWidth(0.4);
                doc.line(ML, y + 7, PW - MR, y + 7);
                doc.setLineWidth(0.2);
                y += 12;
            };

            // Draws a 2-col key-value grid row. Pass pairs as [{k,v}, {k,v}]
            const drawRow = (pairs) => {
                checkPageBreak(12);
                pairs.forEach(({ k, v }, i) => {
                    const x = ML + i * (COL + 6);
                    doc.setFontSize(7.5).setFont(undefined, 'normal').setTextColor(...C.mid);
                    doc.text(k, x, y);
                    doc.setFontSize(9).setFont(undefined, 'bold').setTextColor(...C.dark);
                    const lines = doc.splitTextToSize(String(v || '—'), COL);
                    doc.text(lines, x, y + 4.5);
                });
                y += 13;
            };

            // Single full-width row
            const drawFullRow = (k, v) => {
                checkPageBreak(12);
                doc.setFontSize(7.5).setFont(undefined, 'normal').setTextColor(...C.mid);
                doc.text(k, ML, y);
                doc.setFontSize(9).setFont(undefined, 'bold').setTextColor(...C.dark);
                const lines = doc.splitTextToSize(String(v || '—'), CW);
                doc.text(lines, ML, y + 4.5);
                y += 6 + lines.length * 4.5;
            };

            const drawDocBadge = (label, uploaded, status) => {
                checkPageBreak(10);
                // Status pill
                let bg = uploaded
                    ? (status === 'approved' ? C.green : status === 'rejected' ? C.red : C.yellow)
                    : C.red;
                let txt = uploaded
                    ? (status === 'approved' ? 'Approved' : status === 'rejected' ? 'Rejected' : status === 'pending' ? 'Pending' : 'Uploaded')
                    : 'Missing';
                // pill bg
                doc.setFillColor(...bg);
                doc.roundedRect(ML, y, 22, 6, 1, 1, 'F');
                doc.setFontSize(6.5).setFont(undefined, 'bold').setTextColor(...C.white);
                doc.text(txt, ML + 11, y + 4, { align: 'center' });
                // label
                doc.setFontSize(8.5).setFont(undefined, 'normal').setTextColor(...C.dark);
                doc.text(label, ML + 25, y + 4);
                y += 9;
            };

            const drawProgressBar = (pct) => {
                checkPageBreak(14);
                const BAR_W = CW;
                const BAR_H = 6;
                // Background track
                doc.setFillColor(...C.border);
                doc.roundedRect(ML, y, BAR_W, BAR_H, 2, 2, 'F');
                // Fill
                const fillW = (pct / 100) * BAR_W;
                if (fillW > 0) {
                    doc.setFillColor(...C.primary);
                    doc.roundedRect(ML, y, fillW, BAR_H, 2, 2, 'F');
                }
                // Label
                doc.setFontSize(8).setFont(undefined, 'bold').setTextColor(...C.primary);
                doc.text(`${pct}% Complete`, ML + BAR_W + 3, y + 4.5);
                y += 14;
            };

            // ══════════════════════════════════════════════════════════════
            // PAGE 1 — HEADER BANNER
            // ══════════════════════════════════════════════════════════════

            // Banner bg
            doc.setFillColor(...C.primary);
            doc.rect(0, 0, PW, 42, 'F');

            // Accent stripe
            doc.setFillColor(...C.accent);
            doc.rect(0, 38, PW, 4, 'F');

            // University logo placeholder circle
            doc.setFillColor(...C.white);
            doc.circle(ML + 10, 20, 10, 'F');
            doc.setFontSize(9).setFont(undefined, 'bold').setTextColor(...C.primary);
            doc.text('GUS', ML + 10, 21.5, { align: 'center' });

            // Title
            doc.setFontSize(18).setFont(undefined, 'bold').setTextColor(...C.white);
            doc.text('GUS UNIVERSITY', ML + 26, 16);
            doc.setFontSize(10).setFont(undefined, 'normal').setTextColor(200, 195, 255);
            doc.text('Application Detail Report', ML + 26, 23);

            // App ID badge top right
            doc.setFillColor(255, 255, 255, 0.2);
            doc.setFillColor(80, 70, 200);
            doc.roundedRect(PW - ML - 48, 10, 48, 14, 3, 3, 'F');
            doc.setFontSize(7).setFont(undefined, 'normal').setTextColor(200, 195, 255);
            doc.text('APPLICATION ID', PW - ML - 24, 16, { align: 'center' });
            doc.setFontSize(9).setFont(undefined, 'bold').setTextColor(...C.white);
            doc.text(app.applicationId || 'N/A', PW - ML - 24, 21, { align: 'center' });

            y = 52;

            // ── Avatar + Name card ─────────────────────────────────────────
            // Card bg
            doc.setFillColor(...C.light);
            doc.roundedRect(ML, y - 4, CW, 28, 3, 3, 'F');

            // Avatar circle
            const hexToRgb = (hex) => {
                const color = getAvatarColor(app.studentName);
                // color is already rgb array format from avatarColors
                return [108, 99, 255]; // default purple
            };
            doc.setFillColor(...C.primary);
            doc.circle(ML + 12, y + 9, 10, 'F');
            doc.setFontSize(10).setFont(undefined, 'bold').setTextColor(...C.white);
            doc.text(getInitials(app.studentName), ML + 12, y + 12, { align: 'center' });

            // Name + meta
            doc.setFontSize(14).setFont(undefined, 'bold').setTextColor(...C.dark);
            doc.text(app.studentName || 'Unknown', ML + 26, y + 6);
            doc.setFontSize(8.5).setFont(undefined, 'normal').setTextColor(...C.mid);
            doc.text(app.email || '—', ML + 26, y + 11);
            doc.text(app.phone || '—', ML + 26, y + 16);

            // Status pill (top right of card)
            const statusColors = {
                'COMPLETED':   C.green,
                'IN PROGRESS': C.yellow,
                'INCOMPLETE':  C.red,
            };
            const statusLabel = getStatusLabel(app);
            doc.setFillColor(...(statusColors[statusLabel] || C.mid));
            doc.roundedRect(PW - MR - 38, y - 1, 38, 8, 2, 2, 'F');
            doc.setFontSize(8).setFont(undefined, 'bold').setTextColor(...C.white);
            doc.text(statusLabel, PW - MR - 19, y + 4.5, { align: 'center' });

            // Generated date
            doc.setFontSize(7.5).setFont(undefined, 'normal').setTextColor(...C.mid);
            doc.text(`Generated: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`, PW - MR - 38, y + 18, { align: 'left' });

            y += 34;
            drawPageFooter();

            // ══════════════════════════════════════════════════════════════
            // SECTION 1 — STUDENT INFORMATION
            // ══════════════════════════════════════════════════════════════
            drawSectionHeader('Student Information', C.primary);
            drawRow([{ k: 'Application ID', v: app.applicationId }, { k: 'Student ID', v: app.studentId?.slice(-12) }]);
            drawRow([{ k: 'Title', v: app.title }, { k: 'Full Name', v: app.studentName }]);
            drawRow([{ k: 'Gender', v: capFirst(app.gender) }, { k: 'Date of Birth', v: formatDate(app.dateOfBirth) }]);
            drawRow([{ k: 'Place of Birth', v: app.placeOfBirth }, { k: 'Country of Birth', v: app.countryOfBirth }]);

            // ══════════════════════════════════════════════════════════════
            // SECTION 2 — CONTACT INFORMATION
            // ══════════════════════════════════════════════════════════════
            drawSectionHeader('Contact Information', C.accent);
            drawRow([{ k: 'Email Address', v: app.email }, { k: 'Mobile', v: app.phone }]);
            drawRow([{ k: 'Landline', v: app.landline }, { k: 'Country of Residence', v: app.countryOfResidence }]);
            drawRow([{ k: 'Correspondence Language', v: capFirst(app.correspondenceLanguage) }, { k: 'Last Updated', v: formatDate(app.updatedAt) }]);

            // ══════════════════════════════════════════════════════════════
            // SECTION 3 — PASSPORT & TRAVEL
            // ══════════════════════════════════════════════════════════════
            drawSectionHeader('Passport & Travel Documents', [147, 51, 234]);
            drawRow([{ k: 'Citizenship', v: app.citizenship }, { k: 'Passport Number', v: app.passportNumber }]);
            drawRow([{ k: 'Issue Date', v: formatDate(app.passportIssueDate) }, { k: 'Expiry Date', v: formatDate(app.passportExpiryDate) }]);
            drawRow([{ k: 'Issuing Country', v: app.issuingCountry }, { k: 'Document Type', v: capFirst(app.documentType) }]);
            drawRow([{ k: 'EU Citizen', v: yesNo(app.isEUCitizen) }, { k: 'Needs Visa', v: capFirst(app.needVisa) }]);
            drawRow([{ k: 'Passport Uploaded', v: app.passportUploaded ? 'Yes' : 'No' }, { k: 'Photograph Uploaded', v: app.photographUploaded ? 'Yes' : 'No' }]);

            // ══════════════════════════════════════════════════════════════
            // SECTION 4 — PRIMARY EQHE
            // ══════════════════════════════════════════════════════════════
            drawSectionHeader('Primary EQHE Details', [147, 51, 234]);
            drawFullRow('Qualification Title', fmt(eqheTitleMap, app.eqheOriginalTitle));
            drawRow([{ k: 'Country', v: fmt(countryMap, app.eqheCountry) }, { k: 'City', v: app.eqheCity }]);
            drawRow([{ k: 'Date', v: formatDate(app.eqheDate) }, { k: 'Certificate Uploaded', v: app.eqheCertificateFileName ? 'Yes — ' + app.eqheCertificateFileName : 'No' }]);
            drawRow([{ k: 'Has Additional EQHE', v: yesNo(app.hasAnotherEQHE) }, { k: '', v: '' }]);

            // ── Additional EQHE ───────────────────────────────────────────
            if (app.hasAnotherEQHE) {
                drawSectionHeader('Additional EQHE Details', [236, 72, 153]);
                drawFullRow('Qualification Title', fmt(eqheTitleMap, app.anotherEqheOriginalTitle));
                drawRow([{ k: 'Country', v: fmt(countryMap, app.anotherEqheCountry) }, { k: 'City', v: app.anotherEqheCity }]);
                drawRow([{ k: 'Date', v: formatDate(app.anotherEqheDate) }, { k: 'Certificate Uploaded', v: app.anotherEqheCertificateFileName ? 'Yes' : 'No' }]);
            }

            // ══════════════════════════════════════════════════════════════
            // SECTION 5 — DOCUMENTS STATUS
            // ══════════════════════════════════════════════════════════════
            if (app.documents) {
                drawSectionHeader('Documents Status', [147, 51, 234]);

                // Docs completion bar
                const dPct = app.documents.docsCompletionPct || 0;
                doc.setFontSize(8).setFont(undefined, 'normal').setTextColor(...C.mid);
                doc.text('Documents Completion:', ML, y);
                y += 5;
                drawProgressBar(dPct);

                // Doc badges in 2-col layout
                const docList = [
                    { label: 'CV',                   up: app.documents.cvUploaded,         st: app.documents.cvStatus         },
                    { label: 'Photo',                 up: app.documents.photoUploaded,      st: app.documents.photoStatus       },
                    { label: 'Passport',              up: app.documents.passportUploaded,   st: app.documents.passportStatus    },
                    { label: 'Transcript',            up: app.documents.transcriptUploaded, st: app.documents.transcriptStatus  },
                    { label: 'Diploma',               up: app.documents.diplomaUploaded,    st: app.documents.diplomaStatus     },
                    { label: 'Certificate 9th',       up: app.documents.cert9thUploaded,    st: app.documents.cert9thStatus     },
                    { label: 'Certificate 10th',      up: app.documents.cert10thUploaded,   st: app.documents.cert10thStatus    },
                    { label: 'Certificate 11th',      up: app.documents.cert11thUploaded,   st: app.documents.cert11thStatus    },
                    { label: 'Certificate 12th',      up: app.documents.cert12thUploaded,   st: app.documents.cert12thStatus    },
                    { label: 'Test Scores',           up: app.documents.testScoresUploaded, st: null },
                    { label: 'Language Proficiency',  up: app.documents.langProfUploaded,   st: null },
                    { label: 'Recommendation Letter', up: app.documents.recLetterUploaded,  st: null },
                ];

                // Two columns of badges
                const half = Math.ceil(docList.length / 2);
                const col1 = docList.slice(0, half);
                const col2 = docList.slice(half);
                const startY = y;
                let y1 = startY;
                let y2 = startY;

                // col1
                col1.forEach(({ label, up, st }) => {
                    checkPageBreak(10);
                    const bg = up ? (st === 'approved' ? C.green : st === 'rejected' ? C.red : C.yellow) : C.red;
                    const txt = up ? (st === 'approved' ? 'Approved' : st === 'rejected' ? 'Rejected' : st === 'pending' ? 'Pending' : 'Uploaded') : 'Missing';
                    doc.setFillColor(...bg);
                    doc.roundedRect(ML, y1, 22, 6, 1, 1, 'F');
                    doc.setFontSize(6.5).setFont(undefined, 'bold').setTextColor(...C.white);
                    doc.text(txt, ML + 11, y1 + 4, { align: 'center' });
                    doc.setFontSize(8.5).setFont(undefined, 'normal').setTextColor(...C.dark);
                    doc.text(label, ML + 25, y1 + 4);
                    y1 += 9;
                });

                // col2
                const col2X = ML + COL + 6;
                col2.forEach(({ label, up, st }) => {
                    const bg = up ? (st === 'approved' ? C.green : st === 'rejected' ? C.red : C.yellow) : C.red;
                    const txt = up ? (st === 'approved' ? 'Approved' : st === 'rejected' ? 'Rejected' : st === 'pending' ? 'Pending' : 'Uploaded') : 'Missing';
                    doc.setFillColor(...bg);
                    doc.roundedRect(col2X, y2, 22, 6, 1, 1, 'F');
                    doc.setFontSize(6.5).setFont(undefined, 'bold').setTextColor(...C.white);
                    doc.text(txt, col2X + 11, y2 + 4, { align: 'center' });
                    doc.setFontSize(8.5).setFont(undefined, 'normal').setTextColor(...C.dark);
                    doc.text(label, col2X + 25, y2 + 4);
                    y2 += 9;
                });

                y = Math.max(y1, y2) + 4;

                if (app.documents.portfolioLink) {
                    drawFullRow('Portfolio Link', app.documents.portfolioLink);
                }
            }

            // ══════════════════════════════════════════════════════════════
            // SECTION 6 — EDUCATION BACKGROUND
            // ══════════════════════════════════════════════════════════════
            if (app.education) {
                drawSectionHeader('Education Background', C.primary);
                drawRow([{ k: 'Was Enrolled', v: yesNo(app.education.wasEnrolled) }, { k: 'Currently Enrolled', v: yesNo(app.education.isCurrentlyEnrolled) }]);
                if (app.education.institutionName) drawRow([{ k: 'Institution', v: app.education.institutionName }, { k: 'Degree', v: capFirst(app.education.degree) }]);
                if (app.education.specialisation)  drawRow([{ k: 'Specialisation', v: app.education.specialisation }, { k: 'Country of Study', v: app.education.country }]);
                if (app.education.entryType)        drawRow([{ k: 'Entry Type', v: capFirst(app.education.entryType) }, { k: 'Study Period', v: app.education.standardStudyPeriod }]);
                drawRow([{ k: 'Transcript Uploaded', v: app.education.transcriptUploaded ? 'Yes' : 'No' }, { k: 'Edu. Completion', v: `${app.education.eduCompletionPct || 0}%` }]);
            }

            // ══════════════════════════════════════════════════════════════
            // SECTION 7 — TEST SCORES
            // ══════════════════════════════════════════════════════════════
            if (app.scores && Object.values(app.scores).some(v => v && typeof v === 'string')) {
                drawSectionHeader('Test Scores', [236, 72, 153]);
                const scoreList = [
                    { k: 'SAT Total', v: app.scores.satTotal }, { k: 'SAT Math', v: app.scores.satMath },
                    { k: 'SAT Reading', v: app.scores.satReading }, { k: 'IELTS', v: app.scores.ielts },
                    { k: 'TOEFL', v: app.scores.toefl }, { k: 'PTE', v: app.scores.pte },
                    { k: 'Duolingo', v: app.scores.duolingo }, { k: 'ACT', v: app.scores.act },
                ].filter(s => s.v);
                for (let i = 0; i < scoreList.length; i += 2) {
                    drawRow([scoreList[i], scoreList[i + 1] || { k: '', v: '' }]);
                }
            }

            // ══════════════════════════════════════════════════════════════
            // SECTION 8 — SPECIAL NEEDS
            // ══════════════════════════════════════════════════════════════
            if (app.specialNeeds) {
                drawSectionHeader('Special Needs', [236, 72, 153]);
                drawRow([{ k: 'Has Special Needs', v: capFirst(app.specialNeeds.hasSpecialNeeds) }, { k: 'Status', v: capFirst(app.specialNeeds.snStatus) }]);
                if (app.specialNeeds.hasSpecialNeeds === 'yes') {
                    if (app.specialNeeds.specialNeeds?.length)
                        drawFullRow('Special Needs', app.specialNeeds.specialNeeds.join(', '));
                    if (app.specialNeeds.requiredArrangements?.length)
                        drawFullRow('Required Arrangements', app.specialNeeds.requiredArrangements.join(', '));
                }
            }

            // ══════════════════════════════════════════════════════════════
            // SECTION 9 — APPLICATION STATUS & PROGRESS
            // ══════════════════════════════════════════════════════════════
            drawSectionHeader('Application Status & Progress', C.accent);
            drawRow([{ k: 'Application Status', v: capFirst(app.applicationStatus) }, { k: 'Verified', v: app.isVerified ? 'Yes' : 'No' }]);
            drawRow([{ k: 'Account Status', v: capFirst(app.accountStatus) }, { k: 'Role', v: capFirst(app.role) }]);
            drawRow([{ k: 'Joined', v: formatDate(app.joinDate) }, { k: 'Last Login', v: formatDate(app.lastLogin) }]);
            drawRow([{ k: 'Created At', v: formatDate(app.createdAt) }, { k: 'Last Updated', v: formatDate(app.updatedAt) }]);

            checkPageBreak(20);
            doc.setFontSize(8).setFont(undefined, 'normal').setTextColor(...C.mid);
            doc.text('EQHE Application Completion:', ML, y);
            y += 5;
            drawProgressBar(app.completionPercentage || 0);

            // ── Last page footer ───────────────────────────────────────────
            drawPageFooter();

            // ── Save ────────────────────────────────────────────────────────
            doc.save(`${app.applicationId || app.studentId || 'application'}.pdf`);
        } catch (err) {
            console.error('PDF generation error:', err);
            alert('Failed to generate PDF. Please try again.');
        } finally {
            setPdfLoading(null);
        }
    };

    // ─── Loading ────────────────────────────────────────────────────────────
    if (loading) return (
        <div className="gus-loading">
            <div className="gus-spinner" />
            <p>Loading GUS University Applications...</p>
        </div>
    );

    // ─── Error ──────────────────────────────────────────────────────────────
    if (error) return (
        <div className="gus-loading">
            <div className="gus-error-icon">⚠️</div>
            <p className="gus-error-msg">{error}</p>
            <div className="gus-error-actions">
                <button className="gus-refresh-btn" onClick={fetchApplications}>↻ Retry</button>
                <button className="gus-refresh-btn" onClick={() => window.location.href = '/process-admin-login'}>Go to Login</button>
            </div>
        </div>
    );

    // ─── Main Render ────────────────────────────────────────────────────────
    return (
        <div className="gus-wrap">

            {/* ══ PAGE HEADER ══════════════════════════════════════════════ */}
            <div className="gus-page-header">
                <div className="gus-page-header-left">
                    <h1 className="gus-page-title">GUS University</h1>
                    <p className="gus-page-sub">Application Management Dashboard</p>
                </div>
                <button className="gus-refresh-btn" onClick={fetchApplications}>
                    <span>↻</span> Refresh
                </button>
            </div>

            {/* ══ STAT CARDS ═══════════════════════════════════════════════ */}
            <div className="gus-stats-row">
                <div className="gus-stat-card gus-stat-total">
                    <div className="gus-stat-icon-wrap">
                        <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='white'%3E%3Cpath d='M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01'/%3E%3C/svg%3E" alt="" className="gus-stat-svg" />
                    </div>
                    <div className="gus-stat-text">
                        <span className="gus-stat-label">TOTAL APPLICATIONS</span>
                        <span className="gus-stat-num">{stats.total}</span>
                    </div>
                </div>
                <div className="gus-stat-card gus-stat-incomplete">
                    <div className="gus-stat-icon-wrap">
                        <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='white'%3E%3Cpath d='M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z'/%3E%3C/svg%3E" alt="" className="gus-stat-svg" />
                    </div>
                    <div className="gus-stat-text">
                        <span className="gus-stat-label">INCOMPLETE</span>
                        <span className="gus-stat-num">{stats.incomplete}</span>
                    </div>
                </div>
                <div className="gus-stat-card gus-stat-completed">
                    <div className="gus-stat-icon-wrap">
                        <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='white'%3E%3Cpath d='M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z'/%3E%3C/svg%3E" alt="" className="gus-stat-svg" />
                    </div>
                    <div className="gus-stat-text">
                        <span className="gus-stat-label">COMPLETED</span>
                        <span className="gus-stat-num">{stats.completed}</span>
                    </div>
                </div>
                <div className="gus-stat-card gus-stat-review">
                    <div className="gus-stat-icon-wrap">
                        <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='white'%3E%3Cpath d='M15 12a3 3 0 11-6 0 3 3 0 016 0z'/%3E%3Cpath d='M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z'/%3E%3C/svg%3E" alt="" className="gus-stat-svg" />
                    </div>
                    <div className="gus-stat-text">
                        <span className="gus-stat-label">IN PROGRESS</span>
                        <span className="gus-stat-num">{stats.underReview}</span>
                    </div>
                </div>
            </div>

            {/* ══ CONTROLS ═════════════════════════════════════════════════ */}
            <div className="gus-controls">
                <div className="gus-search-box">
                    <svg className="gus-search-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
                    </svg>
                    <input
                        type="text" className="gus-search-input"
                        placeholder="Search by name, email or student ID..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                    />
                    {searchQuery && (
                        <button className="gus-search-clear" onClick={() => setSearchQuery('')}>✕</button>
                    )}
                </div>
                <div className="gus-filters">
                    {[
                        { key: 'all',        label: 'All'         },
                        { key: 'completed',  label: 'Completed'   },
                        { key: 'incomplete', label: 'Incomplete'  },
                        { key: 'inprogress', label: 'In Progress' }
                    ].map(f => (
                        <button key={f.key}
                            className={`gus-filter-btn ${filterStatus === f.key ? 'active' : ''}`}
                            onClick={() => setFilterStatus(f.key)}>
                            {f.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* ══ TABLE ════════════════════════════════════════════════════ */}
            <div className="gus-table-card">
                <table className="gus-table">
                    <thead>
                        <tr className="gus-thead-row">
                            <th>APPLICATION ID</th>
                            <th>STUDENT</th>
                            <th>STATUS</th>
                            <th>SUBMITTED</th>
                            <th>PROGRESS</th>
                            <th>ACTION</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.length === 0 ? (
                            <tr><td colSpan="6">
                                <div className="gus-empty-state">
                                    <div className="gus-empty-icon">📭</div>
                                    <p>{applications.length === 0
                                        ? 'No applications found in the database.'
                                        : 'No applications match your search or filter.'
                                    }</p>
                                </div>
                            </td></tr>
                        ) : (
                            filtered.map((app, idx) => (
                                <tr key={app._id || idx} className="gus-tbody-row"
                                    style={{ animationDelay: `${idx * 0.04}s` }}>
                                    <td>
                                        <div>
                                            <span className="gus-college-badge">{app.applicationId || '—'}</span>
                                            <div style={{ fontSize: '11px', color: '#888', marginTop: 2 }}>
                                                {app.studentId?.slice(-8)}
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <div className="gus-student-cell">
                                            <div className="gus-avatar" style={{ background: getAvatarColor(app.studentName) }}>
                                                {getInitials(app.studentName)}
                                            </div>
                                            <div className="gus-student-details">
                                                <span className="gus-student-name">{app.studentName || 'Unknown'}</span>
                                                <span className="gus-student-email">{app.email || '—'}</span>
                                                {app.phone && <span className="gus-student-phone">{app.phone}</span>}
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <span className={`gus-badge ${getStatusClass(app)}`}>
                                            {getStatusLabel(app)}
                                        </span>
                                    </td>
                                    <td>
                                        <span className="gus-date-text">
                                            {formatDate(app.updatedAt || app.createdAt)}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="gus-prog-cell">
                                            <div className="gus-prog-track">
                                                <div className="gus-prog-fill"
                                                    style={{ width: `${app.completionPercentage || 0}%` }} />
                                            </div>
                                            <span className="gus-prog-pct">{app.completionPercentage || 0}%</span>
                                        </div>
                                    </td>
                                    <td>
                                        <div className="gus-action-group">
                                            {/* View modal button */}
                                            <button className="gus-btn-view" onClick={() => openModal({ ...app })}>
                                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
                                                    strokeWidth="2" className="gus-btn-ico">
                                                    <circle cx="12" cy="12" r="3"/>
                                                    <path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                                                </svg>
                                                View
                                            </button>
                                            {/* PDF download button */}
                                            <button
                                                className="gus-btn-dl"
                                                onClick={() => handleDownloadPDF(app)}
                                                title="Download PDF"
                                                disabled={pdfLoading === app.studentId}
                                            >
                                                {pdfLoading === app.studentId ? (
                                                    <span className="gus-btn-spinner" />
                                                ) : (
                                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
                                                        strokeWidth="2" className="gus-btn-ico">
                                                        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                                                        <polyline points="14 2 14 8 20 8"/>
                                                        <line x1="12" y1="18" x2="12" y2="12"/>
                                                        <line x1="9" y1="15" x2="15" y2="15"/>
                                                    </svg>
                                                )}
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
                <div className="gus-table-footer">
                    Showing <strong>{filtered.length}</strong> of <strong>{applications.length}</strong> applications
                </div>
            </div>

            {/* ══ DETAIL MODAL ═════════════════════════════════════════════ */}
            {selectedApp && (
                <div className="gus-overlay" onClick={closeModal}>
                    <div className="gus-modal" onClick={e => e.stopPropagation()}>

                        {/* Modal Header */}
                        <div className="gus-modal-hdr">
                            <div className="gus-modal-hdr-left">
                                <div className="gus-modal-avatar"
                                    style={{ background: getAvatarColor(selectedApp.studentName) }}>
                                    {getInitials(selectedApp.studentName)}
                                </div>
                                <div>
                                    <h2 className="gus-modal-title">{selectedApp.studentName || '—'}</h2>
                                    <p className="gus-modal-appid">Application ID: {selectedApp.applicationId || '—'}</p>
                                </div>
                            </div>
                            <div className="gus-modal-hdr-right">
                                <span className={`gus-badge ${getStatusClass(selectedApp)}`}>
                                    {getStatusLabel(selectedApp)}
                                </span>
                                <button className="gus-modal-x" onClick={closeModal}>✕</button>
                            </div>
                        </div>

                        <div className="gus-modal-body">

                            {/* 1. Student Info */}
                            <div className="gus-modal-sec">
                                <div className="gus-modal-sec-title"><span className="gus-sec-dot gus-dot-blue" />Student Information</div>
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

                            {/* 2. Contact */}
                            <div className="gus-modal-sec">
                                <div className="gus-modal-sec-title"><span className="gus-sec-dot gus-dot-blue" />Contact Information</div>
                                <div className="gus-modal-grid">
                                    <div className="gus-modal-field"><span className="gus-field-lbl">Email</span><span className="gus-field-val">{val(selectedApp.email)}</span></div>
                                    <div className="gus-modal-field"><span className="gus-field-lbl">Mobile</span><span className="gus-field-val">{val(selectedApp.phone)}</span></div>
                                    <div className="gus-modal-field"><span className="gus-field-lbl">Landline</span><span className="gus-field-val">{val(selectedApp.landline)}</span></div>
                                    <div className="gus-modal-field"><span className="gus-field-lbl">Country of Residence</span><span className="gus-field-val">{val(selectedApp.countryOfResidence)}</span></div>
                                    <div className="gus-modal-field"><span className="gus-field-lbl">Correspondence Language</span><span className="gus-field-val">{capFirst(selectedApp.correspondenceLanguage)}</span></div>
                                    <div className="gus-modal-field"><span className="gus-field-lbl">Last Updated</span><span className="gus-field-val">{formatDate(selectedApp.updatedAt)}</span></div>
                                </div>
                            </div>

                            {/* 3. Passport */}
                            <div className="gus-modal-sec">
                                <div className="gus-modal-sec-title"><span className="gus-sec-dot gus-dot-purple" />Passport & Travel Documents</div>
                                <div className="gus-modal-grid">
                                    <div className="gus-modal-field"><span className="gus-field-lbl">Citizenship</span><span className="gus-field-val">{val(selectedApp.citizenship)}</span></div>
                                    <div className="gus-modal-field"><span className="gus-field-lbl">Passport Number</span><span className="gus-field-val">{val(selectedApp.passportNumber)}</span></div>
                                    <div className="gus-modal-field"><span className="gus-field-lbl">Issue Date</span><span className="gus-field-val">{formatDate(selectedApp.passportIssueDate)}</span></div>
                                    <div className="gus-modal-field"><span className="gus-field-lbl">Expiry Date</span><span className="gus-field-val">{formatDate(selectedApp.passportExpiryDate)}</span></div>
                                    <div className="gus-modal-field"><span className="gus-field-lbl">Issuing Country</span><span className="gus-field-val">{val(selectedApp.issuingCountry)}</span></div>
                                    <div className="gus-modal-field"><span className="gus-field-lbl">Document Type</span><span className="gus-field-val">{capFirst(selectedApp.documentType)}</span></div>
                                    <div className="gus-modal-field"><span className="gus-field-lbl">EU Citizen</span><span className="gus-field-val">{yesNo(selectedApp.isEUCitizen)}</span></div>
                                    <div className="gus-modal-field"><span className="gus-field-lbl">Needs Visa</span><span className="gus-field-val">{capFirst(selectedApp.needVisa)}</span></div>
                                    <div className="gus-modal-field"><span className="gus-field-lbl">Passport Uploaded</span><span className="gus-field-val">{selectedApp.passportUploaded ? '✅ Yes' : '❌ No'}</span></div>
                                    <div className="gus-modal-field"><span className="gus-field-lbl">Photograph Uploaded</span><span className="gus-field-val">{selectedApp.photographUploaded ? '✅ Yes' : '❌ No'}</span></div>
                                </div>
                            </div>

                            {/* 4. Primary EQHE */}
                            <div className="gus-modal-sec">
                                <div className="gus-modal-sec-title"><span className="gus-sec-dot gus-dot-purple" />Primary EQHE Details</div>
                                <div className="gus-modal-grid">
                                    <div className="gus-modal-field gus-field-full"><span className="gus-field-lbl">Qualification Title</span><span className="gus-field-val">{fmt(eqheTitleMap, selectedApp.eqheOriginalTitle)}</span></div>
                                    <div className="gus-modal-field"><span className="gus-field-lbl">Country</span><span className="gus-field-val">{fmt(countryMap, selectedApp.eqheCountry)}</span></div>
                                    <div className="gus-modal-field"><span className="gus-field-lbl">City</span><span className="gus-field-val">{val(selectedApp.eqheCity)}</span></div>
                                    <div className="gus-modal-field"><span className="gus-field-lbl">Date</span><span className="gus-field-val">{formatDate(selectedApp.eqheDate)}</span></div>
                                    <div className="gus-modal-field"><span className="gus-field-lbl">Certificate</span><span className="gus-field-val">{selectedApp.eqheCertificateFileName ? `✅ ${selectedApp.eqheCertificateFileName}` : '❌ No'}</span></div>
                                    <div className="gus-modal-field"><span className="gus-field-lbl">Has Additional EQHE</span><span className="gus-field-val">{yesNo(selectedApp.hasAnotherEQHE)}</span></div>
                                </div>
                            </div>

                            {/* 5. Additional EQHE */}
                            {selectedApp.hasAnotherEQHE && (
                                <div className="gus-modal-sec">
                                    <div className="gus-modal-sec-title"><span className="gus-sec-dot gus-dot-pink" />Additional EQHE Details</div>
                                    <div className="gus-modal-grid">
                                        <div className="gus-modal-field gus-field-full"><span className="gus-field-lbl">Qualification Title</span><span className="gus-field-val">{fmt(eqheTitleMap, selectedApp.anotherEqheOriginalTitle)}</span></div>
                                        <div className="gus-modal-field"><span className="gus-field-lbl">Country</span><span className="gus-field-val">{fmt(countryMap, selectedApp.anotherEqheCountry)}</span></div>
                                        <div className="gus-modal-field"><span className="gus-field-lbl">City</span><span className="gus-field-val">{val(selectedApp.anotherEqheCity)}</span></div>
                                        <div className="gus-modal-field"><span className="gus-field-lbl">Date</span><span className="gus-field-val">{formatDate(selectedApp.anotherEqheDate)}</span></div>
                                        <div className="gus-modal-field"><span className="gus-field-lbl">Certificate</span><span className="gus-field-val">{selectedApp.anotherEqheCertificateFileName ? `✅ ${selectedApp.anotherEqheCertificateFileName}` : '❌ No'}</span></div>
                                    </div>
                                </div>
                            )}

                            {/* 6. Documents */}
                            {selectedApp.documents && (
                                <div className="gus-modal-sec">
                                    <div className="gus-modal-sec-title"><span className="gus-sec-dot gus-dot-purple" />Documents Status</div>
                                    <div className="gus-modal-grid">
                                        {[
                                            { lbl: 'CV',           up: selectedApp.documents.cvUploaded,         st: selectedApp.documents.cvStatus         },
                                            { lbl: 'Photo',        up: selectedApp.documents.photoUploaded,      st: selectedApp.documents.photoStatus       },
                                            { lbl: 'Passport',     up: selectedApp.documents.passportUploaded,   st: selectedApp.documents.passportStatus    },
                                            { lbl: 'Transcript',   up: selectedApp.documents.transcriptUploaded, st: selectedApp.documents.transcriptStatus  },
                                            { lbl: 'Diploma',      up: selectedApp.documents.diplomaUploaded,    st: selectedApp.documents.diplomaStatus     },
                                            { lbl: 'Cert 9th',     up: selectedApp.documents.cert9thUploaded,    st: selectedApp.documents.cert9thStatus     },
                                            { lbl: 'Cert 10th',    up: selectedApp.documents.cert10thUploaded,   st: selectedApp.documents.cert10thStatus    },
                                            { lbl: 'Cert 11th',    up: selectedApp.documents.cert11thUploaded,   st: selectedApp.documents.cert11thStatus    },
                                            { lbl: 'Cert 12th',    up: selectedApp.documents.cert12thUploaded,   st: selectedApp.documents.cert12thStatus    },
                                            { lbl: 'Test Scores',  up: selectedApp.documents.testScoresUploaded, st: null },
                                            { lbl: 'Lang. Prof.',  up: selectedApp.documents.langProfUploaded,   st: null },
                                            { lbl: 'Rec. Letter',  up: selectedApp.documents.recLetterUploaded,  st: null },
                                        ].map(({ lbl, up, st }) => (
                                            <div className="gus-modal-field" key={lbl}>
                                                <span className="gus-field-lbl">{lbl}</span>
                                                <span className="gus-field-val">
                                                    {up
                                                        ? (st === 'approved' ? '✅' : st === 'rejected' ? '❌' : '⏳') + ' ' + (st && st !== 'not_uploaded' ? capFirst(st) : 'Uploaded')
                                                        : '❌ Not uploaded'
                                                    }
                                                </span>
                                            </div>
                                        ))}
                                        <div className="gus-modal-field"><span className="gus-field-lbl">Docs Completion</span><span className="gus-field-val">{selectedApp.documents.docsCompletionPct || 0}%</span></div>
                                    </div>
                                </div>
                            )}

                            {/* 7. Education */}
                            {selectedApp.education && (
                                <div className="gus-modal-sec">
                                    <div className="gus-modal-sec-title"><span className="gus-sec-dot gus-dot-blue" />Education Background</div>
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

                            {/* 8. Scores */}
                            {selectedApp.scores && Object.values(selectedApp.scores).some(v => v && typeof v === 'string') && (
                                <div className="gus-modal-sec">
                                    <div className="gus-modal-sec-title"><span className="gus-sec-dot gus-dot-pink" />Test Scores</div>
                                    <div className="gus-modal-grid">
                                        {[
                                            { lbl: 'SAT Total', v: selectedApp.scores.satTotal }, { lbl: 'SAT Math', v: selectedApp.scores.satMath },
                                            { lbl: 'SAT Reading', v: selectedApp.scores.satReading }, { lbl: 'IELTS', v: selectedApp.scores.ielts },
                                            { lbl: 'TOEFL', v: selectedApp.scores.toefl }, { lbl: 'PTE', v: selectedApp.scores.pte },
                                            { lbl: 'Duolingo', v: selectedApp.scores.duolingo }, { lbl: 'ACT', v: selectedApp.scores.act },
                                        ].filter(s => s.v).map(s => (
                                            <div className="gus-modal-field" key={s.lbl}><span className="gus-field-lbl">{s.lbl}</span><span className="gus-field-val">{s.v}</span></div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* 9. Special Needs */}
                            {selectedApp.specialNeeds && (
                                <div className="gus-modal-sec">
                                    <div className="gus-modal-sec-title"><span className="gus-sec-dot gus-dot-pink" />Special Needs</div>
                                    <div className="gus-modal-grid">
                                        <div className="gus-modal-field"><span className="gus-field-lbl">Has Special Needs</span><span className="gus-field-val">{selectedApp.specialNeeds.hasSpecialNeeds === 'yes' ? '✅ Yes' : '❌ No'}</span></div>
                                        {selectedApp.specialNeeds.hasSpecialNeeds === 'yes' && <>
                                            {selectedApp.specialNeeds.specialNeeds?.length > 0 && <div className="gus-modal-field gus-field-full"><span className="gus-field-lbl">Special Needs</span><span className="gus-field-val">{selectedApp.specialNeeds.specialNeeds.join(', ')}</span></div>}
                                            {selectedApp.specialNeeds.requiredArrangements?.length > 0 && <div className="gus-modal-field gus-field-full"><span className="gus-field-lbl">Required Arrangements</span><span className="gus-field-val">{selectedApp.specialNeeds.requiredArrangements.join(', ')}</span></div>}
                                        </>}
                                    </div>
                                </div>
                            )}

                            {/* 10. Status */}
                            <div className="gus-modal-sec">
                                <div className="gus-modal-sec-title"><span className="gus-sec-dot gus-dot-green" />Application Status</div>
                                <div className="gus-modal-grid">
                                    <div className="gus-modal-field"><span className="gus-field-lbl">Application Status</span><span className="gus-field-val">{capFirst(selectedApp.applicationStatus)}</span></div>
                                    <div className="gus-modal-field"><span className="gus-field-lbl">Verified</span><span className="gus-field-val">{selectedApp.isVerified ? '✅ Yes' : '❌ No'}</span></div>
                                    <div className="gus-modal-field"><span className="gus-field-lbl">Account Status</span><span className="gus-field-val">{capFirst(selectedApp.accountStatus)}</span></div>
                                    <div className="gus-modal-field"><span className="gus-field-lbl">Role</span><span className="gus-field-val">{capFirst(selectedApp.role)}</span></div>
                                    <div className="gus-modal-field"><span className="gus-field-lbl">Joined</span><span className="gus-field-val">{formatDate(selectedApp.joinDate)}</span></div>
                                    <div className="gus-modal-field"><span className="gus-field-lbl">Last Login</span><span className="gus-field-val">{formatDate(selectedApp.lastLogin)}</span></div>
                                    <div className="gus-modal-field"><span className="gus-field-lbl">Created At</span><span className="gus-field-val">{formatDate(selectedApp.createdAt)}</span></div>
                                    <div className="gus-modal-field"><span className="gus-field-lbl">Last Updated</span><span className="gus-field-val">{formatDate(selectedApp.updatedAt)}</span></div>
                                </div>
                            </div>

                            {/* 11. Progress */}
                            <div className="gus-modal-sec">
                                <div className="gus-modal-sec-title"><span className="gus-sec-dot gus-dot-green" />Application Progress</div>
                                <div className="gus-modal-prog-wrap">
                                    <div className="gus-modal-prog-track">
                                        <div className="gus-modal-prog-fill" style={{ width: `${selectedApp.completionPercentage || 0}%` }} />
                                    </div>
                                    <span className="gus-modal-prog-lbl">{selectedApp.completionPercentage || 0}% Complete</span>
                                </div>
                            </div>

                        </div>{/* end modal-body */}

                        <div className="gus-modal-ftr">
                            <button
                                className="gus-modal-dl-btn"
                                onClick={() => { closeModal(); handleDownloadPDF(selectedApp); }}
                                disabled={pdfLoading === selectedApp.studentId}
                            >
                                {pdfLoading === selectedApp.studentId ? (
                                    <><span className="gus-btn-spinner" style={{ marginRight: 6 }} /> Generating PDF...</>
                                ) : (
                                    <>
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                                            style={{ width: 16, height: 16, marginRight: 6 }}>
                                            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                                            <polyline points="14 2 14 8 20 8"/>
                                            <line x1="12" y1="18" x2="12" y2="12"/>
                                            <line x1="9" y1="15" x2="15" y2="15"/>
                                        </svg>
                                        Download PDF
                                    </>
                                )}
                            </button>
                            <button className="gus-modal-close-btn" onClick={closeModal}>Close</button>
                        </div>

                    </div>
                </div>
            )}

        </div>
    );
};

export default GusUniversity;