import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import './gusuniversity.css';

/* ─── jsPDF lazy-loader ──────────────────────────────────── */
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

    const [applications, setApplications] = useState([]);
    const [loading, setLoading]           = useState(true);
    const [error, setError]               = useState(null);
    const [searchQuery, setSearchQuery]   = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [selectedApp, setSelectedApp]   = useState(null);
    const [pdfLoading, setPdfLoading]     = useState(null);
    const [stats, setStats]               = useState({ total: 0, completed: 0, incomplete: 0, underReview: 0 });
    const [docViewer, setDocViewer]       = useState(null);
    const [downloadingDoc, setDownloadingDoc] = useState(false);

    const apiRef = useRef(null);
    if (!apiRef.current) {
        const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
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
                if (err.response?.status === 401) console.log('Auth failed');
                if (err.response?.status === 403) console.log('Forbidden');
                return Promise.reject(err);
            }
        );
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

    const getFileIcon = (fileType) => {
        if (!fileType) return '📄';
        const t = fileType.toLowerCase();
        if (t === 'pdf') return '📕';
        if (['jpg','jpeg','png','webp'].includes(t)) return '🖼️';
        if (['doc','docx'].includes(t)) return '📝';
        return '📄';
    };

    const formatFileSize = (bytes) => {
        if (!bytes) return '';
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    const formatExpectedDate = (ym) => {
        if (!ym) return null;
        try {
            const [year, month] = ym.split('-');
            return new Date(year, month - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
        } catch { return ym; }
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
    const avatarColors   = ['#0891b2','#0e7490','#6366f1','#8b5cf6','#10b981'];
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
        'india':'India','usa':'United States','uk':'United Kingdom',
        'canada':'Canada','australia':'Australia','china':'China',
        'germany':'Germany','france':'France','japan':'Japan',
        'skorea':'South Korea','russia':'Russia','mexico':'Mexico',
        'colombia':'Colombia','italy':'Italy','spain':'Spain',
        'brazil':'Brazil','nigeria':'Nigeria','thailand':'Thailand'
    };

    const fmt = (map, v) => map[v] || v || '—';

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

    const openModal  = (app) => setSelectedApp({ ...app });
    const closeModal = ()    => setSelectedApp(null);

    const API_BASE_URL_VIEW = process.env.REACT_APP_API_URL || 'http://localhost:5000';

    const DOC_FOLDER_MAP_VIEW = {
        'CV':'documents/cv','Photo':'documents/photo','Passport':'documents/personal',
        'Transcript':'documents/academic','Diploma':'documents/academic',
        'Certificate 9th':'documents/certificates','Certificate 10th':'documents/certificates',
        'Certificate 11th':'documents/certificates','Certificate 12th':'documents/certificates',
        'Test Scores':'documents/optional','Language Proficiency':'documents/optional',
        'Recommendation Letter':'documents/optional',
    };

    const openDocViewer = (meta, label) => {
        if (!meta?.fileName) return;
        let url;
        if (meta.fileUrl) {
            if (meta.fileUrl.startsWith('/api/files/')) {
                url = `${API_BASE_URL_VIEW}${meta.fileUrl}`;
            } else if (meta.fileUrl.startsWith('https://')) {
                try {
                    const parsed = new URL(meta.fileUrl);
                    const key = parsed.pathname.replace(/^\//, '');
                    url = `${API_BASE_URL_VIEW}/api/files/${key}`;
                } catch { url = meta.fileUrl; }
            } else {
                url = `${API_BASE_URL_VIEW}${meta.fileUrl}`;
            }
        } else {
            const folder = DOC_FOLDER_MAP_VIEW[label] || 'documents/other';
            url = `${API_BASE_URL_VIEW}/api/files/${folder}/${meta.fileName}`;
        }
        setDocViewer({ url, label, fileType: meta.fileType, originalName: meta.originalName || meta.fileName });
    };

    const closeDocViewer = () => setDocViewer(null);
    const isImageType    = (ft) => ['jpg','jpeg','png','webp','gif'].includes((ft || '').toLowerCase());

    const handleDownloadDoc = async () => {
        if (!docViewer?.url) return;
        setDownloadingDoc(true);
        try {
            const token =
                localStorage.getItem('processAdminToken') ||
                localStorage.getItem('token')             ||
                localStorage.getItem('adminToken');
            const response = await fetch(docViewer.url, {
                headers: token ? { Authorization: `Bearer ${token}` } : {},
            });
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const blob    = await response.blob();
            const blobUrl = URL.createObjectURL(blob);
            const a       = document.createElement('a');
            a.href        = blobUrl;
            a.download    = docViewer.originalName || docViewer.label || 'document';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(blobUrl);
        } catch (err) {
            alert('Download failed. Try "Open in New Tab" and save from there.');
        } finally {
            setDownloadingDoc(false);
        }
    };

    /* ── SVG Icons ── */
    const IcoView = () => (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="gus-btn-ico">
            <circle cx="12" cy="12" r="3"/>
            <path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
        </svg>
    );
    const IcoPdf = () => (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="gus-btn-ico">
            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
            <line x1="12" y1="18" x2="12" y2="12"/>
            <line x1="9" y1="15" x2="15" y2="15"/>
        </svg>
    );

    /* ── PDF Generator (unchanged from original) ── */
    const handleDownloadPDF = async (app) => {
        setPdfLoading(app.studentId);
        try {
            const JsPDF = await loadJsPDF();
            const doc   = new JsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
            const PW=210,PH=297,ML=14,MR=14,CW=PW-ML-MR,COL=CW/2-3;
            const C={primary:[108,99,255],accent:[67,184,156],dark:[30,30,47],mid:[90,90,110],light:[245,245,252],border:[220,220,235],white:[255,255,255],red:[239,68,68],yellow:[234,179,8],green:[34,197,94]};
            let y=0;
            const checkPageBreak=(needed=20)=>{if(y+needed>PH-16){doc.addPage();drawPageFooter();y=18;}};
            const drawPageFooter=()=>{const pg=doc.internal.getCurrentPageInfo().pageNumber;doc.setFontSize(8).setTextColor(...C.mid);doc.text(`GUS University — ${app.applicationId||'Application'}`,ML,PH-8);doc.text(`Page ${pg}`,PW-ML,PH-8,{align:'right'});doc.setDrawColor(...C.border);doc.line(ML,PH-12,PW-MR,PH-12);};
            const drawSectionHeader=(title,colorDot=C.primary)=>{checkPageBreak(18);doc.setFillColor(...colorDot);doc.circle(ML+2,y+3.5,2,'F');doc.setFontSize(11).setFont(undefined,'bold').setTextColor(...C.dark);doc.text(title,ML+6,y+4.5);doc.setDrawColor(...colorDot);doc.setLineWidth(0.4);doc.line(ML,y+7,PW-MR,y+7);doc.setLineWidth(0.2);y+=12;};
            const drawRow=(pairs)=>{checkPageBreak(12);pairs.forEach(({k,v},i)=>{const x=ML+i*(COL+6);doc.setFontSize(7.5).setFont(undefined,'normal').setTextColor(...C.mid);doc.text(k,x,y);doc.setFontSize(9).setFont(undefined,'bold').setTextColor(...C.dark);const lines=doc.splitTextToSize(String(v||'—'),COL);doc.text(lines,x,y+4.5);});y+=13;};
            const drawFullRow=(k,v)=>{checkPageBreak(12);doc.setFontSize(7.5).setFont(undefined,'normal').setTextColor(...C.mid);doc.text(k,ML,y);doc.setFontSize(9).setFont(undefined,'bold').setTextColor(...C.dark);const lines=doc.splitTextToSize(String(v||'—'),CW);doc.text(lines,ML,y+4.5);y+=6+lines.length*4.5;};
            const drawProgressBar=(pct)=>{checkPageBreak(14);const BAR_W=CW,BAR_H=6;doc.setFillColor(...C.border);doc.roundedRect(ML,y,BAR_W,BAR_H,2,2,'F');const fillW=(pct/100)*BAR_W;if(fillW>0){doc.setFillColor(...C.primary);doc.roundedRect(ML,y,fillW,BAR_H,2,2,'F');}doc.setFontSize(8).setFont(undefined,'bold').setTextColor(...C.primary);doc.text(`${pct}% Complete`,ML+BAR_W+3,y+4.5);y+=14;};
            doc.setFillColor(...C.primary);doc.rect(0,0,PW,42,'F');doc.setFillColor(...C.accent);doc.rect(0,38,PW,4,'F');doc.setFillColor(...C.white);doc.circle(ML+10,20,10,'F');doc.setFontSize(9).setFont(undefined,'bold').setTextColor(...C.primary);doc.text('GUS',ML+10,21.5,{align:'center'});doc.setFontSize(18).setFont(undefined,'bold').setTextColor(...C.white);doc.text('GUS UNIVERSITY',ML+26,16);doc.setFontSize(10).setFont(undefined,'normal').setTextColor(200,195,255);doc.text('Application Detail Report',ML+26,23);doc.setFillColor(80,70,200);doc.roundedRect(PW-ML-48,10,48,14,3,3,'F');doc.setFontSize(7).setFont(undefined,'normal').setTextColor(200,195,255);doc.text('APPLICATION ID',PW-ML-24,16,{align:'center'});doc.setFontSize(9).setFont(undefined,'bold').setTextColor(...C.white);doc.text(app.applicationId||'N/A',PW-ML-24,21,{align:'center'});
            y=52;
            doc.setFillColor(...C.light);doc.roundedRect(ML,y-4,CW,28,3,3,'F');doc.setFillColor(...C.primary);doc.circle(ML+12,y+9,10,'F');doc.setFontSize(10).setFont(undefined,'bold').setTextColor(...C.white);doc.text(getInitials(app.studentName),ML+12,y+12,{align:'center'});doc.setFontSize(14).setFont(undefined,'bold').setTextColor(...C.dark);doc.text(app.studentName||'Unknown',ML+26,y+6);doc.setFontSize(8.5).setFont(undefined,'normal').setTextColor(...C.mid);doc.text(app.email||'—',ML+26,y+11);doc.text(app.phone||'—',ML+26,y+16);
            const statusColors={'COMPLETED':C.green,'IN PROGRESS':C.yellow,'INCOMPLETE':C.red};const statusLabel=getStatusLabel(app);doc.setFillColor(...(statusColors[statusLabel]||C.mid));doc.roundedRect(PW-MR-38,y-1,38,8,2,2,'F');doc.setFontSize(8).setFont(undefined,'bold').setTextColor(...C.white);doc.text(statusLabel,PW-MR-19,y+4.5,{align:'center'});doc.setFontSize(7.5).setFont(undefined,'normal').setTextColor(...C.mid);doc.text(`Generated: ${new Date().toLocaleDateString('en-US',{year:'numeric',month:'long',day:'numeric'})}`,PW-MR-38,y+18,{align:'left'});y+=34;drawPageFooter();
            drawSectionHeader('Student Information',C.primary);
            drawRow([{k:'Application ID',v:app.applicationId},{k:'Student ID',v:app.studentId?.slice(-12)}]);
            drawRow([{k:'Title',v:app.title},{k:'Full Name',v:app.studentName}]);
            drawRow([{k:'Gender',v:capFirst(app.gender)},{k:'Date of Birth',v:formatDate(app.dateOfBirth)}]);
            drawRow([{k:'Place of Birth',v:app.placeOfBirth},{k:'Country of Birth',v:app.countryOfBirth}]);
            drawSectionHeader('Contact Information',C.accent);
            drawRow([{k:'Email Address',v:app.email},{k:'Mobile',v:app.phone}]);
            drawRow([{k:'Landline',v:app.landline},{k:'Country of Residence',v:app.countryOfResidence}]);
            drawRow([{k:'Correspondence Language',v:capFirst(app.correspondenceLanguage)},{k:'Last Updated',v:formatDate(app.updatedAt)}]);
            drawSectionHeader('Passport & Travel Documents',[147,51,234]);
            drawRow([{k:'Citizenship',v:app.citizenship},{k:'Passport Number',v:app.passportNumber}]);
            drawRow([{k:'Issue Date',v:formatDate(app.passportIssueDate)},{k:'Expiry Date',v:formatDate(app.passportExpiryDate)}]);
            drawRow([{k:'Issuing Country',v:app.issuingCountry},{k:'Document Type',v:capFirst(app.documentType)}]);
            drawRow([{k:'EU Citizen',v:yesNo(app.isEUCitizen)},{k:'Needs Visa',v:capFirst(app.needVisa)}]);
            drawSectionHeader('Primary EQHE Details',[147,51,234]);
            drawFullRow('Qualification Title',fmt(eqheTitleMap,app.eqheOriginalTitle));
            drawRow([{k:'Country',v:fmt(countryMap,app.eqheCountry)},{k:'City',v:app.eqheCity}]);
            drawRow([{k:'Date',v:formatDate(app.eqheDate)},{k:'Certificate Uploaded',v:app.eqheCertificateFileName?'Yes':'No'}]);
            drawRow([{k:'Has Additional EQHE',v:yesNo(app.hasAnotherEQHE)},{k:'',v:''}]);
            if(app.hasAnotherEQHE){drawSectionHeader('Additional EQHE Details',[236,72,153]);drawFullRow('Qualification Title',fmt(eqheTitleMap,app.anotherEqheOriginalTitle));drawRow([{k:'Country',v:fmt(countryMap,app.anotherEqheCountry)},{k:'City',v:app.anotherEqheCity}]);drawRow([{k:'Date',v:formatDate(app.anotherEqheDate)},{k:'Certificate Uploaded',v:app.anotherEqheCertificateFileName?'Yes':'No'}]);}
            if(app.documents){
                drawSectionHeader('Documents Status',[147,51,234]);
                const dPct=app.documents.docsCompletionPct||0;doc.setFontSize(8).setFont(undefined,'normal').setTextColor(...C.mid);doc.text('Documents Completion:',ML,y);y+=5;drawProgressBar(dPct);
                const docList=[{label:'CV',up:app.documents.cvUploaded,st:app.documents.cvStatus,meta:app.documents.cvMeta,exp:null},{label:'Photo',up:app.documents.photoUploaded,st:app.documents.photoStatus,meta:app.documents.photoMeta,exp:null},{label:'Passport',up:app.documents.passportUploaded,st:app.documents.passportStatus,meta:app.documents.passportMeta,exp:null},{label:'Transcript',up:app.documents.transcriptUploaded,st:app.documents.transcriptStatus,meta:app.documents.transcriptMeta,exp:null},{label:'Diploma',up:app.documents.diplomaUploaded,st:app.documents.diplomaStatus,meta:app.documents.diplomaMeta,exp:null},{label:'Cert 9th',up:app.documents.cert9thUploaded,st:app.documents.cert9thStatus,meta:app.documents.cert9thMeta,exp:app.documents.cert9thExpectedDate},{label:'Cert 10th',up:app.documents.cert10thUploaded,st:app.documents.cert10thStatus,meta:app.documents.cert10thMeta,exp:app.documents.cert10thExpectedDate},{label:'Cert 11th',up:app.documents.cert11thUploaded,st:app.documents.cert11thStatus,meta:app.documents.cert11thMeta,exp:app.documents.cert11thExpectedDate},{label:'Cert 12th',up:app.documents.cert12thUploaded,st:app.documents.cert12thStatus,meta:app.documents.cert12thMeta,exp:app.documents.cert12thExpectedDate},{label:'Test Scores',up:app.documents.testScoresUploaded,st:null,meta:app.documents.testScoresMeta,exp:null},{label:'Language Proficiency',up:app.documents.langProfUploaded,st:null,meta:app.documents.langProfMeta,exp:null},{label:'Recommendation Letter',up:app.documents.recLetterUploaded,st:null,meta:app.documents.recLetterMeta,exp:null}];
                const half=Math.ceil(docList.length/2),col1=docList.slice(0,half),col2=docList.slice(half),startY=y,col2X=ML+COL+6;let y1=startY,y2=startY;
                col1.forEach(({label,up,st,exp})=>{checkPageBreak(10);const hasExp=!up&&!!exp;const bg=up?(st==='approved'?C.green:st==='rejected'?C.red:C.yellow):hasExp?[251,191,36]:C.red;const txt=up?(st==='approved'?'Approved':st==='rejected'?'Rejected':'Pending'):hasExp?'Expected':'Missing';doc.setFillColor(...bg);doc.roundedRect(ML,y1,22,6,1,1,'F');doc.setFontSize(6.5).setFont(undefined,'bold').setTextColor(...C.white);doc.text(txt,ML+11,y1+4,{align:'center'});doc.setFontSize(8.5).setFont(undefined,'normal').setTextColor(...C.dark);doc.text(label,ML+25,y1+4);if(hasExp){doc.setFontSize(7).setTextColor(...C.mid);doc.text(`Expected: ${formatExpectedDate(exp)}`,ML+25,y1+8.5);y1+=4;}y1+=9;});
                col2.forEach(({label,up,st,exp})=>{const hasExp=!up&&!!exp;const bg=up?(st==='approved'?C.green:st==='rejected'?C.red:C.yellow):hasExp?[251,191,36]:C.red;const txt=up?(st==='approved'?'Approved':st==='rejected'?'Rejected':'Pending'):hasExp?'Expected':'Missing';doc.setFillColor(...bg);doc.roundedRect(col2X,y2,22,6,1,1,'F');doc.setFontSize(6.5).setFont(undefined,'bold').setTextColor(...C.white);doc.text(txt,col2X+11,y2+4,{align:'center'});doc.setFontSize(8.5).setFont(undefined,'normal').setTextColor(...C.dark);doc.text(label,col2X+25,y2+4);if(hasExp){doc.setFontSize(7).setTextColor(...C.mid);doc.text(`Expected: ${formatExpectedDate(exp)}`,col2X+25,y2+8.5);y2+=4;}y2+=9;});
                y=Math.max(y1,y2)+4;if(app.documents.portfolioLink)drawFullRow('Portfolio Link',app.documents.portfolioLink);
            }
            if(app.education){drawSectionHeader('Education Background',C.primary);drawRow([{k:'Was Enrolled',v:yesNo(app.education.wasEnrolled)},{k:'Currently Enrolled',v:yesNo(app.education.isCurrentlyEnrolled)}]);if(app.education.institutionName)drawRow([{k:'Institution',v:app.education.institutionName},{k:'Degree',v:capFirst(app.education.degree)}]);if(app.education.specialisation)drawRow([{k:'Specialisation',v:app.education.specialisation},{k:'Country of Study',v:app.education.country}]);drawRow([{k:'Transcript Uploaded',v:app.education.transcriptUploaded?'Yes':'No'},{k:'Edu. Completion',v:`${app.education.eduCompletionPct||0}%`}]);}
            if(app.scores&&Object.values(app.scores).some(v=>v&&typeof v==='string')){drawSectionHeader('Test Scores',[236,72,153]);const scoreList=[{k:'SAT Total',v:app.scores.satTotal},{k:'SAT Math',v:app.scores.satMath},{k:'SAT Reading',v:app.scores.satReading},{k:'IELTS',v:app.scores.ielts},{k:'TOEFL',v:app.scores.toefl},{k:'PTE',v:app.scores.pte},{k:'Duolingo',v:app.scores.duolingo},{k:'ACT',v:app.scores.act}].filter(s=>s.v);for(let i=0;i<scoreList.length;i+=2)drawRow([scoreList[i],scoreList[i+1]||{k:'',v:''}]);}
            if(app.specialNeeds){drawSectionHeader('Special Needs',[236,72,153]);drawRow([{k:'Has Special Needs',v:capFirst(app.specialNeeds.hasSpecialNeeds)},{k:'Status',v:capFirst(app.specialNeeds.snStatus)}]);if(app.specialNeeds.hasSpecialNeeds==='yes'){if(app.specialNeeds.specialNeeds?.length)drawFullRow('Special Needs',app.specialNeeds.specialNeeds.join(', '));if(app.specialNeeds.requiredArrangements?.length)drawFullRow('Required Arrangements',app.specialNeeds.requiredArrangements.join(', '));}}
            drawSectionHeader('Application Status & Progress',C.accent);
            drawRow([{k:'Application Status',v:capFirst(app.applicationStatus)},{k:'Verified',v:app.isVerified?'Yes':'No'}]);
            drawRow([{k:'Account Status',v:capFirst(app.accountStatus)},{k:'Role',v:capFirst(app.role)}]);
            drawRow([{k:'Joined',v:formatDate(app.joinDate)},{k:'Last Login',v:formatDate(app.lastLogin)}]);
            drawRow([{k:'Created At',v:formatDate(app.createdAt)},{k:'Last Updated',v:formatDate(app.updatedAt)}]);
            checkPageBreak(20);doc.setFontSize(8).setFont(undefined,'normal').setTextColor(...C.mid);doc.text('EQHE Application Completion:',ML,y);y+=5;drawProgressBar(app.completionPercentage||0);drawPageFooter();
            doc.save(`${app.applicationId||app.studentId||'application'}.pdf`);
        } catch(err) {
            console.error('PDF generation error:', err);
            alert('Failed to generate PDF. Please try again.');
        } finally {
            setPdfLoading(null);
        }
    };

    /* ── Doc cards list (reusable for modal) ── */
    const DOC_LIST_DEF = (d) => [
        { lbl:'CV',                    required:true,  up:d.cvUploaded,         st:d.cvStatus,         meta:d.cvMeta,         exp:null },
        { lbl:'Photo',                 required:true,  up:d.photoUploaded,      st:d.photoStatus,      meta:d.photoMeta,      exp:null },
        { lbl:'Passport',              required:true,  up:d.passportUploaded,   st:d.passportStatus,   meta:d.passportMeta,   exp:null },
        { lbl:'Transcript',            required:true,  up:d.transcriptUploaded, st:d.transcriptStatus, meta:d.transcriptMeta, exp:null },
        { lbl:'Diploma',               required:true,  up:d.diplomaUploaded,    st:d.diplomaStatus,    meta:d.diplomaMeta,    exp:null },
        { lbl:'Certificate 9th',       required:true,  up:d.cert9thUploaded,    st:d.cert9thStatus,    meta:d.cert9thMeta,    exp:d.cert9thExpectedDate },
        { lbl:'Certificate 10th',      required:true,  up:d.cert10thUploaded,   st:d.cert10thStatus,   meta:d.cert10thMeta,   exp:d.cert10thExpectedDate },
        { lbl:'Certificate 11th',      required:true,  up:d.cert11thUploaded,   st:d.cert11thStatus,   meta:d.cert11thMeta,   exp:d.cert11thExpectedDate },
        { lbl:'Certificate 12th',      required:true,  up:d.cert12thUploaded,   st:d.cert12thStatus,   meta:d.cert12thMeta,   exp:d.cert12thExpectedDate },
        { lbl:'Test Scores',           required:false, up:d.testScoresUploaded, st:null,               meta:d.testScoresMeta, exp:null },
        { lbl:'Language Proficiency',  required:false, up:d.langProfUploaded,   st:null,               meta:d.langProfMeta,   exp:null },
        { lbl:'Recommendation Letter', required:false, up:d.recLetterUploaded,  st:null,               meta:d.recLetterMeta,  exp:null },
    ];

    const renderDocCard = ({ lbl, required, up, st, meta, exp }) => {
        const hasExpected = !up && !!exp;
        const statusLabel = up ? (st==='approved'?'Approved':st==='rejected'?'Rejected':'Pending') : hasExpected?'Expected':'Not Uploaded';
        const statusClass = up ? (st==='approved'?'doc-status-approved':st==='rejected'?'doc-status-rejected':'doc-status-pending') : hasExpected?'doc-status-expected':'doc-status-missing';
        const cardClass   = up ? 'doc-card-uploaded' : hasExpected ? 'doc-card-expected' : 'doc-card-missing';
        const icon        = up ? getFileIcon(meta?.fileType) : hasExpected ? '🗓️' : '📭';
        return (
            <div key={lbl} className={`gus-doc-card ${cardClass}`}>
                <div className="gus-doc-card-icon">{icon}</div>
                <div className="gus-doc-card-body">
                    <div className="gus-doc-card-top">
                        <span className="gus-doc-card-label">{lbl}</span>
                        {required && <span className="gus-doc-required-badge">Required</span>}
                    </div>
                    <span className={`gus-doc-status-pill ${statusClass}`}>{statusLabel}</span>
                    {up && meta && (
                        <div className="gus-doc-file-info">
                            <span className="gus-doc-filename" title={meta.originalName}>
                                {meta.originalName?.length > 28 ? meta.originalName.slice(0,25)+'…' : meta.originalName}
                            </span>
                            <span className="gus-doc-filesize">{meta.fileType?.toUpperCase()} · {formatFileSize(meta.fileSize)}</span>
                            {meta.uploadedAt && (
                                <span className="gus-doc-uploaddate">
                                    Uploaded {new Date(meta.uploadedAt).toLocaleDateString('en-US',{day:'numeric',month:'short',year:'numeric'})}
                                </span>
                            )}
                            <button className="gus-doc-view-btn" onClick={() => openDocViewer(meta, lbl)}>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{width:11,height:11}}>
                                    <circle cx="12" cy="12" r="3"/>
                                    <path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                                </svg>
                                View Document
                            </button>
                        </div>
                    )}
                    {hasExpected && (
                        <div className="gus-doc-expected-info">
                            <span className="gus-doc-expected-label">Expected by {formatExpectedDate(exp)}</span>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    if (loading) return (
        <div className="gus-loading">
            <div className="gus-spinner" />
            <p>Loading GUS University Applications...</p>
        </div>
    );

    if (error) return (
        <div className="gus-loading">
            <div className="gus-error-icon">⚠️</div>
            <p className="gus-error-msg">{error}</p>
            <div className="gus-error-actions">
                <button className="gus-refresh-btn" onClick={fetchApplications}>↻ Retry</button>
                <button className="gus-refresh-btn" onClick={() => window.location.href='/process-admin-login'}>Go to Login</button>
            </div>
        </div>
    );

    return (
        <div className="gus-wrap">

            {/* ── Page Header ── */}
            <div className="gus-page-header">
                <div className="gus-page-header-accent" />
                <div className="gus-page-header-left">
                    <h1 className="gus-page-title">GUS University</h1>
                    <p className="gus-page-sub">Application Management Dashboard</p>
                </div>
                <div className="gus-page-header-right">
                    <div className="gus-hero-badge">
                        <div className="gus-hero-badge-num">{stats.total}</div>
                        <div className="gus-hero-badge-lbl">Applications</div>
                    </div>
                    <button className="gus-refresh-btn" onClick={fetchApplications}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/>
                            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
                        </svg>
                        Refresh
                    </button>
                </div>
            </div>

            {/* ── Stat Cards ── */}
            <div className="gus-stats-row">
                {[
                    { cls:'gus-stat-total',      label:'TOTAL APPLICATIONS', val:stats.total,       icon:'📋' },
                    { cls:'gus-stat-incomplete',  label:'INCOMPLETE',         val:stats.incomplete,  icon:'⏱' },
                    { cls:'gus-stat-completed',   label:'COMPLETED',          val:stats.completed,   icon:'✅' },
                    { cls:'gus-stat-review',      label:'IN PROGRESS',        val:stats.underReview, icon:'👁' },
                ].map(({ cls, label, val: v, icon }) => (
                    <div key={cls} className={`gus-stat-card ${cls}`}>
                        <div className="gus-stat-icon-wrap">
                            <span className="gus-stat-emoji">{icon}</span>
                        </div>
                        <div className="gus-stat-text">
                            <span className="gus-stat-label">{label}</span>
                            <span className="gus-stat-num">{v}</span>
                        </div>
                    </div>
                ))}
            </div>

            {/* ── Controls ── */}
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
                    {searchQuery && <button className="gus-search-clear" onClick={() => setSearchQuery('')}>✕</button>}
                </div>
                <div className="gus-filters">
                    {[
                        { key:'all',        label:'All'         },
                        { key:'completed',  label:'Completed'   },
                        { key:'incomplete', label:'Incomplete'  },
                        { key:'inprogress', label:'In Progress' },
                    ].map(f => (
                        <button key={f.key}
                            className={`gus-filter-btn ${filterStatus===f.key?'active':''}`}
                            onClick={() => setFilterStatus(f.key)}>
                            {f.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* ── Desktop Table ── */}
            <div className="gus-table-card gus-desktop-table">
                <div className="gus-table-wrap-scroll">
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
                                        <p>{applications.length===0?'No applications found.':'No applications match your search.'}</p>
                                    </div>
                                </td></tr>
                            ) : (
                                filtered.map((app, idx) => (
                                    <tr key={app._id||idx} className="gus-tbody-row" style={{animationDelay:`${idx*0.04}s`}}>
                                        <td>
                                            <div>
                                                <span className="gus-college-badge">{app.applicationId||'—'}</span>
                                                <div style={{fontSize:'11px',color:'#94a3b8',marginTop:2}}>{app.studentId?.slice(-8)}</div>
                                            </div>
                                        </td>
                                        <td>
                                            <div className="gus-student-cell">
                                                <div className="gus-avatar" style={{background:getAvatarColor(app.studentName)}}>
                                                    {getInitials(app.studentName)}
                                                </div>
                                                <div className="gus-student-details">
                                                    <span className="gus-student-name">{app.studentName||'Unknown'}</span>
                                                    <span className="gus-student-email">{app.email||'—'}</span>
                                                    {app.phone && <span className="gus-student-phone">{app.phone}</span>}
                                                </div>
                                            </div>
                                        </td>
                                        <td><span className={`gus-badge ${getStatusClass(app)}`}>{getStatusLabel(app)}</span></td>
                                        <td><span className="gus-date-text">{formatDate(app.updatedAt||app.createdAt)}</span></td>
                                        <td>
                                            <div className="gus-prog-cell">
                                                <div className="gus-prog-track">
                                                    <div className="gus-prog-fill" style={{width:`${app.completionPercentage||0}%`}}/>
                                                </div>
                                                <span className="gus-prog-pct">{app.completionPercentage||0}%</span>
                                            </div>
                                        </td>
                                        <td>
                                            <div className="gus-action-group">
                                                <button className="gus-btn-view" onClick={() => openModal({...app})}>
                                                    <IcoView/> View
                                                </button>
                                                <button className="gus-btn-dl" onClick={() => handleDownloadPDF(app)} disabled={pdfLoading===app.studentId} title="Download PDF">
                                                    {pdfLoading===app.studentId ? <span className="gus-btn-spinner"/> : <IcoPdf/>}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
                <div className="gus-table-footer">
                    Showing <strong>{filtered.length}</strong> of <strong>{applications.length}</strong> applications
                </div>
            </div>

            {/* ── Mobile Card List ── */}
            <div className="gus-mobile-cards">
                {filtered.length === 0 ? (
                    <div className="gus-empty-state" style={{background:'#fff',borderRadius:14,padding:'2rem'}}>
                        <div className="gus-empty-icon">📭</div>
                        <p>{applications.length===0?'No applications found.':'No applications match your search.'}</p>
                    </div>
                ) : (
                    <>
                        {filtered.map((app, idx) => (
                            <div key={app._id||idx} className="gus-mob-card" style={{animationDelay:`${idx*0.05}s`}}>
                                {/* Card top bar */}
                                <div className="gus-mob-card-top">
                                    <span className="gus-college-badge">{app.applicationId||'—'}</span>
                                    <span className={`gus-badge ${getStatusClass(app)}`}>{getStatusLabel(app)}</span>
                                </div>

                                {/* Student info */}
                                <div className="gus-mob-card-body">
                                    <div className="gus-mob-student">
                                        <div className="gus-avatar gus-avatar-md" style={{background:getAvatarColor(app.studentName)}}>
                                            {getInitials(app.studentName)}
                                        </div>
                                        <div className="gus-mob-student-info">
                                            <div className="gus-mob-name">{app.studentName||'Unknown'}</div>
                                            <div className="gus-mob-email">{app.email||'—'}</div>
                                            {app.phone && <div className="gus-mob-phone">{app.phone}</div>}
                                        </div>
                                    </div>

                                    {/* Meta grid */}
                                    <div className="gus-mob-meta-grid">
                                        <div className="gus-mob-meta-item">
                                            <span className="gus-mob-meta-lbl">Submitted</span>
                                            <span className="gus-mob-meta-val">{formatDate(app.updatedAt||app.createdAt)}</span>
                                        </div>
                                        <div className="gus-mob-meta-item">
                                            <span className="gus-mob-meta-lbl">Student ID</span>
                                            <span className="gus-mob-meta-val">{app.studentId?.slice(-8)||'—'}</span>
                                        </div>
                                        <div className="gus-mob-meta-item gus-mob-full">
                                            <span className="gus-mob-meta-lbl">Progress</span>
                                            <div className="gus-mob-prog-row">
                                                <div className="gus-prog-track">
                                                    <div className="gus-prog-fill" style={{width:`${app.completionPercentage||0}%`}}/>
                                                </div>
                                                <span className="gus-prog-pct">{app.completionPercentage||0}%</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Card footer actions */}
                                <div className="gus-mob-card-footer">
                                    <button className="gus-btn-view gus-mob-btn-full" onClick={() => openModal({...app})}>
                                        <IcoView/> View Details
                                    </button>
                                    <button className="gus-btn-dl" onClick={() => handleDownloadPDF(app)} disabled={pdfLoading===app.studentId} title="Download PDF">
                                        {pdfLoading===app.studentId ? <span className="gus-btn-spinner"/> : <IcoPdf/>}
                                    </button>
                                </div>
                            </div>
                        ))}
                        <div className="gus-mob-list-footer">
                            <span>Showing <strong>{filtered.length}</strong> of <strong>{applications.length}</strong></span>
                            <button className="gus-refresh-btn" onClick={fetchApplications}>↻ Refresh</button>
                        </div>
                    </>
                )}
            </div>

            {/* ══ DETAIL MODAL ══ */}
            {selectedApp && (
                <div className="gus-overlay" onClick={closeModal}>
                    <div className="gus-modal" onClick={e => e.stopPropagation()}>

                        <div className="gus-modal-hdr">
                            <div className="gus-modal-hdr-left">
                                <div className="gus-modal-avatar" style={{background:getAvatarColor(selectedApp.studentName)}}>
                                    {getInitials(selectedApp.studentName)}
                                </div>
                                <div>
                                    <h2 className="gus-modal-title">{selectedApp.studentName||'—'}</h2>
                                    <p className="gus-modal-appid">ID: {selectedApp.applicationId||'—'}</p>
                                </div>
                            </div>
                            <div className="gus-modal-hdr-right">
                                <span className={`gus-badge ${getStatusClass(selectedApp)}`}>{getStatusLabel(selectedApp)}</span>
                                <button className="gus-modal-x" onClick={closeModal}>✕</button>
                            </div>
                        </div>

                        <div className="gus-modal-body">

                            <div className="gus-modal-sec">
                                <div className="gus-modal-sec-title"><span className="gus-sec-dot gus-dot-blue"/>Student Information</div>
                                <div className="gus-modal-grid">
                                    <div className="gus-modal-field"><span className="gus-field-lbl">Application ID</span><span className="gus-field-val">{val(selectedApp.applicationId)}</span></div>
                                    <div className="gus-modal-field"><span className="gus-field-lbl">Student ID</span><span className="gus-field-val" style={{fontSize:'11px',wordBreak:'break-all'}}>{val(selectedApp.studentId)}</span></div>
                                    <div className="gus-modal-field"><span className="gus-field-lbl">Title</span><span className="gus-field-val">{val(selectedApp.title)}</span></div>
                                    <div className="gus-modal-field"><span className="gus-field-lbl">Full Name</span><span className="gus-field-val">{val(selectedApp.studentName)}</span></div>
                                    <div className="gus-modal-field"><span className="gus-field-lbl">Gender</span><span className="gus-field-val">{capFirst(selectedApp.gender)}</span></div>
                                    <div className="gus-modal-field"><span className="gus-field-lbl">Date of Birth</span><span className="gus-field-val">{formatDate(selectedApp.dateOfBirth)}</span></div>
                                    <div className="gus-modal-field"><span className="gus-field-lbl">Place of Birth</span><span className="gus-field-val">{val(selectedApp.placeOfBirth)}</span></div>
                                    <div className="gus-modal-field"><span className="gus-field-lbl">Country of Birth</span><span className="gus-field-val">{val(selectedApp.countryOfBirth)}</span></div>
                                </div>
                            </div>

                            <div className="gus-modal-sec">
                                <div className="gus-modal-sec-title"><span className="gus-sec-dot gus-dot-blue"/>Contact Information</div>
                                <div className="gus-modal-grid">
                                    <div className="gus-modal-field"><span className="gus-field-lbl">Email</span><span className="gus-field-val">{val(selectedApp.email)}</span></div>
                                    <div className="gus-modal-field"><span className="gus-field-lbl">Mobile</span><span className="gus-field-val">{val(selectedApp.phone)}</span></div>
                                    <div className="gus-modal-field"><span className="gus-field-lbl">Landline</span><span className="gus-field-val">{val(selectedApp.landline)}</span></div>
                                    <div className="gus-modal-field"><span className="gus-field-lbl">Country of Residence</span><span className="gus-field-val">{val(selectedApp.countryOfResidence)}</span></div>
                                    <div className="gus-modal-field"><span className="gus-field-lbl">Correspondence Language</span><span className="gus-field-val">{capFirst(selectedApp.correspondenceLanguage)}</span></div>
                                    <div className="gus-modal-field"><span className="gus-field-lbl">Last Updated</span><span className="gus-field-val">{formatDate(selectedApp.updatedAt)}</span></div>
                                </div>
                            </div>

                            <div className="gus-modal-sec">
                                <div className="gus-modal-sec-title"><span className="gus-sec-dot gus-dot-purple"/>Passport & Travel</div>
                                <div className="gus-modal-grid">
                                    <div className="gus-modal-field"><span className="gus-field-lbl">Citizenship</span><span className="gus-field-val">{val(selectedApp.citizenship)}</span></div>
                                    <div className="gus-modal-field"><span className="gus-field-lbl">Passport Number</span><span className="gus-field-val">{val(selectedApp.passportNumber)}</span></div>
                                    <div className="gus-modal-field"><span className="gus-field-lbl">Issue Date</span><span className="gus-field-val">{formatDate(selectedApp.passportIssueDate)}</span></div>
                                    <div className="gus-modal-field"><span className="gus-field-lbl">Expiry Date</span><span className="gus-field-val">{formatDate(selectedApp.passportExpiryDate)}</span></div>
                                    <div className="gus-modal-field"><span className="gus-field-lbl">Issuing Country</span><span className="gus-field-val">{val(selectedApp.issuingCountry)}</span></div>
                                    <div className="gus-modal-field"><span className="gus-field-lbl">Document Type</span><span className="gus-field-val">{capFirst(selectedApp.documentType)}</span></div>
                                    <div className="gus-modal-field"><span className="gus-field-lbl">EU Citizen</span><span className="gus-field-val">{yesNo(selectedApp.isEUCitizen)}</span></div>
                                    <div className="gus-modal-field"><span className="gus-field-lbl">Needs Visa</span><span className="gus-field-val">{capFirst(selectedApp.needVisa)}</span></div>
                                    <div className="gus-modal-field"><span className="gus-field-lbl">Passport Uploaded</span><span className="gus-field-val">{selectedApp.passportUploaded?'✅ Yes':'❌ No'}</span></div>
                                    <div className="gus-modal-field"><span className="gus-field-lbl">Photo Uploaded</span><span className="gus-field-val">{selectedApp.photographUploaded?'✅ Yes':'❌ No'}</span></div>
                                </div>
                            </div>

                            <div className="gus-modal-sec">
                                <div className="gus-modal-sec-title"><span className="gus-sec-dot gus-dot-purple"/>Primary EQHE</div>
                                <div className="gus-modal-grid">
                                    <div className="gus-modal-field gus-field-full"><span className="gus-field-lbl">Qualification Title</span><span className="gus-field-val">{fmt(eqheTitleMap,selectedApp.eqheOriginalTitle)}</span></div>
                                    <div className="gus-modal-field"><span className="gus-field-lbl">Country</span><span className="gus-field-val">{fmt(countryMap,selectedApp.eqheCountry)}</span></div>
                                    <div className="gus-modal-field"><span className="gus-field-lbl">City</span><span className="gus-field-val">{val(selectedApp.eqheCity)}</span></div>
                                    <div className="gus-modal-field"><span className="gus-field-lbl">Date</span><span className="gus-field-val">{formatDate(selectedApp.eqheDate)}</span></div>
                                    <div className="gus-modal-field"><span className="gus-field-lbl">Certificate</span><span className="gus-field-val">{selectedApp.eqheCertificateFileName?`✅ ${selectedApp.eqheCertificateFileName}`:'❌ No'}</span></div>
                                    <div className="gus-modal-field"><span className="gus-field-lbl">Has Additional EQHE</span><span className="gus-field-val">{yesNo(selectedApp.hasAnotherEQHE)}</span></div>
                                </div>
                            </div>

                            {selectedApp.hasAnotherEQHE && (
                                <div className="gus-modal-sec">
                                    <div className="gus-modal-sec-title"><span className="gus-sec-dot gus-dot-pink"/>Additional EQHE</div>
                                    <div className="gus-modal-grid">
                                        <div className="gus-modal-field gus-field-full"><span className="gus-field-lbl">Qualification Title</span><span className="gus-field-val">{fmt(eqheTitleMap,selectedApp.anotherEqheOriginalTitle)}</span></div>
                                        <div className="gus-modal-field"><span className="gus-field-lbl">Country</span><span className="gus-field-val">{fmt(countryMap,selectedApp.anotherEqheCountry)}</span></div>
                                        <div className="gus-modal-field"><span className="gus-field-lbl">City</span><span className="gus-field-val">{val(selectedApp.anotherEqheCity)}</span></div>
                                        <div className="gus-modal-field"><span className="gus-field-lbl">Date</span><span className="gus-field-val">{formatDate(selectedApp.anotherEqheDate)}</span></div>
                                        <div className="gus-modal-field"><span className="gus-field-lbl">Certificate</span><span className="gus-field-val">{selectedApp.anotherEqheCertificateFileName?`✅ ${selectedApp.anotherEqheCertificateFileName}`:'❌ No'}</span></div>
                                    </div>
                                </div>
                            )}

                            {selectedApp.documents && (
                                <div className="gus-modal-sec">
                                    <div className="gus-modal-sec-title"><span className="gus-sec-dot gus-dot-purple"/>Documents Status</div>
                                    <div className="gus-doc-progress-wrap">
                                        <div className="gus-doc-progress-track">
                                            <div className="gus-doc-progress-fill" style={{width:`${selectedApp.documents.docsCompletionPct||0}%`}}/>
                                        </div>
                                        <span className="gus-doc-progress-label">{selectedApp.documents.docsCompletionPct||0}% Complete</span>
                                    </div>
                                    <div className="gus-doc-cards">
                                        {DOC_LIST_DEF(selectedApp.documents).map(renderDocCard)}
                                    </div>
                                    {selectedApp.documents.portfolioLink && (
                                        <div className="gus-doc-portfolio">
                                            <span className="gus-field-lbl">Portfolio Link</span>
                                            <a href={selectedApp.documents.portfolioLink} target="_blank" rel="noopener noreferrer" className="gus-doc-portfolio-link">
                                                {selectedApp.documents.portfolioLink}
                                            </a>
                                        </div>
                                    )}
                                </div>
                            )}

                            {selectedApp.education && (
                                <div className="gus-modal-sec">
                                    <div className="gus-modal-sec-title"><span className="gus-sec-dot gus-dot-blue"/>Education Background</div>
                                    <div className="gus-modal-grid">
                                        <div className="gus-modal-field"><span className="gus-field-lbl">Was Enrolled</span><span className="gus-field-val">{yesNo(selectedApp.education.wasEnrolled)}</span></div>
                                        <div className="gus-modal-field"><span className="gus-field-lbl">Currently Enrolled</span><span className="gus-field-val">{yesNo(selectedApp.education.isCurrentlyEnrolled)}</span></div>
                                        {selectedApp.education.institutionName && <div className="gus-modal-field"><span className="gus-field-lbl">Institution</span><span className="gus-field-val">{val(selectedApp.education.institutionName)}</span></div>}
                                        {selectedApp.education.degree && <div className="gus-modal-field"><span className="gus-field-lbl">Degree</span><span className="gus-field-val">{capFirst(selectedApp.education.degree)}</span></div>}
                                        {selectedApp.education.specialisation && <div className="gus-modal-field"><span className="gus-field-lbl">Specialisation</span><span className="gus-field-val">{val(selectedApp.education.specialisation)}</span></div>}
                                        <div className="gus-modal-field"><span className="gus-field-lbl">Edu. Completion</span><span className="gus-field-val">{selectedApp.education.eduCompletionPct||0}%</span></div>
                                    </div>
                                </div>
                            )}

                            {selectedApp.scores && Object.values(selectedApp.scores).some(v => v && typeof v==='string') && (
                                <div className="gus-modal-sec">
                                    <div className="gus-modal-sec-title"><span className="gus-sec-dot gus-dot-pink"/>Test Scores</div>
                                    <div className="gus-modal-grid">
                                        {[{lbl:'SAT Total',v:selectedApp.scores.satTotal},{lbl:'SAT Math',v:selectedApp.scores.satMath},{lbl:'SAT Reading',v:selectedApp.scores.satReading},{lbl:'IELTS',v:selectedApp.scores.ielts},{lbl:'TOEFL',v:selectedApp.scores.toefl},{lbl:'PTE',v:selectedApp.scores.pte},{lbl:'Duolingo',v:selectedApp.scores.duolingo},{lbl:'ACT',v:selectedApp.scores.act}].filter(s=>s.v).map(s=>(
                                            <div className="gus-modal-field" key={s.lbl}><span className="gus-field-lbl">{s.lbl}</span><span className="gus-field-val">{s.v}</span></div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {selectedApp.specialNeeds && (
                                <div className="gus-modal-sec">
                                    <div className="gus-modal-sec-title"><span className="gus-sec-dot gus-dot-pink"/>Special Needs</div>
                                    <div className="gus-modal-grid">
                                        <div className="gus-modal-field"><span className="gus-field-lbl">Has Special Needs</span><span className="gus-field-val">{selectedApp.specialNeeds.hasSpecialNeeds==='yes'?'✅ Yes':'❌ No'}</span></div>
                                        {selectedApp.specialNeeds.hasSpecialNeeds==='yes' && <>
                                            {selectedApp.specialNeeds.specialNeeds?.length>0 && <div className="gus-modal-field gus-field-full"><span className="gus-field-lbl">Special Needs</span><span className="gus-field-val">{selectedApp.specialNeeds.specialNeeds.join(', ')}</span></div>}
                                            {selectedApp.specialNeeds.requiredArrangements?.length>0 && <div className="gus-modal-field gus-field-full"><span className="gus-field-lbl">Required Arrangements</span><span className="gus-field-val">{selectedApp.specialNeeds.requiredArrangements.join(', ')}</span></div>}
                                        </>}
                                    </div>
                                </div>
                            )}

                            <div className="gus-modal-sec">
                                <div className="gus-modal-sec-title"><span className="gus-sec-dot gus-dot-green"/>Application Status</div>
                                <div className="gus-modal-grid">
                                    <div className="gus-modal-field"><span className="gus-field-lbl">App Status</span><span className="gus-field-val">{capFirst(selectedApp.applicationStatus)}</span></div>
                                    <div className="gus-modal-field"><span className="gus-field-lbl">Verified</span><span className="gus-field-val">{selectedApp.isVerified?'✅ Yes':'❌ No'}</span></div>
                                    <div className="gus-modal-field"><span className="gus-field-lbl">Account Status</span><span className="gus-field-val">{capFirst(selectedApp.accountStatus)}</span></div>
                                    <div className="gus-modal-field"><span className="gus-field-lbl">Role</span><span className="gus-field-val">{capFirst(selectedApp.role)}</span></div>
                                    <div className="gus-modal-field"><span className="gus-field-lbl">Joined</span><span className="gus-field-val">{formatDate(selectedApp.joinDate)}</span></div>
                                    <div className="gus-modal-field"><span className="gus-field-lbl">Last Login</span><span className="gus-field-val">{formatDate(selectedApp.lastLogin)}</span></div>
                                    <div className="gus-modal-field"><span className="gus-field-lbl">Created At</span><span className="gus-field-val">{formatDate(selectedApp.createdAt)}</span></div>
                                    <div className="gus-modal-field"><span className="gus-field-lbl">Last Updated</span><span className="gus-field-val">{formatDate(selectedApp.updatedAt)}</span></div>
                                </div>
                            </div>

                            <div className="gus-modal-sec">
                                <div className="gus-modal-sec-title"><span className="gus-sec-dot gus-dot-green"/>Application Progress</div>
                                <div className="gus-modal-prog-wrap">
                                    <div className="gus-modal-prog-track">
                                        <div className="gus-modal-prog-fill" style={{width:`${selectedApp.completionPercentage||0}%`}}/>
                                    </div>
                                    <span className="gus-modal-prog-lbl">{selectedApp.completionPercentage||0}% Complete</span>
                                </div>
                            </div>

                        </div>

                        <div className="gus-modal-ftr">
                            <button className="gus-modal-dl-btn" onClick={() => {closeModal();handleDownloadPDF(selectedApp);}} disabled={pdfLoading===selectedApp.studentId}>
                                {pdfLoading===selectedApp.studentId ? (
                                    <><span className="gus-btn-spinner" style={{marginRight:6}}/> Generating...</>
                                ) : (
                                    <><IcoPdf/> Download PDF</>
                                )}
                            </button>
                            <button className="gus-modal-close-btn" onClick={closeModal}>Close</button>
                        </div>
                    </div>
                </div>
            )}

            {/* ══ DOCUMENT VIEWER ══ */}
            {docViewer && (
                <div className="gus-docviewer-overlay" onClick={closeDocViewer}>
                    <div className="gus-docviewer-box" onClick={e => e.stopPropagation()}>
                        <div className="gus-docviewer-hdr">
                            <div className="gus-docviewer-hdr-left">
                                <span className="gus-docviewer-icon">
                                    {isImageType(docViewer.fileType)?'🖼️':docViewer.fileType==='pdf'?'📕':'📄'}
                                </span>
                                <div>
                                    <div className="gus-docviewer-title">{docViewer.label}</div>
                                    <div className="gus-docviewer-filename">{docViewer.originalName}</div>
                                </div>
                            </div>
                            <div className="gus-docviewer-hdr-right">
                                <a href={docViewer.url} target="_blank" rel="noopener noreferrer" className="gus-docviewer-open-btn" title="Open in new tab">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{width:14,height:14}}>
                                        <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/>
                                        <polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
                                    </svg>
                                    Open
                                </a>
                                <button className="gus-docviewer-open-btn" disabled={downloadingDoc} onClick={handleDownloadDoc}>
                                    {downloadingDoc ? 'Downloading...' : (
                                        <>
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{width:14,height:14}}>
                                                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
                                                <polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
                                            </svg>
                                            Download
                                        </>
                                    )}
                                </button>
                                <button className="gus-docviewer-close" onClick={closeDocViewer}>✕</button>
                            </div>
                        </div>
                        <div className="gus-docviewer-body">
                            {isImageType(docViewer.fileType) ? (
                                <div className="gus-docviewer-img-wrap">
                                    <img src={docViewer.url} alt={docViewer.originalName} className="gus-docviewer-img"
                                        onError={e=>{e.target.style.display='none';e.target.nextSibling.style.display='flex';}}/>
                                    <div className="gus-docviewer-fallback" style={{display:'none'}}>
                                        <span style={{fontSize:48}}>🖼️</span>
                                        <p>Could not load image preview.</p>
                                        <button className="gus-docviewer-open-btn" onClick={handleDownloadDoc} disabled={downloadingDoc}>
                                            {downloadingDoc?'Downloading...':'Download File'}
                                        </button>
                                    </div>
                                </div>
                            ) : docViewer.fileType==='pdf' ? (
                                <object data={docViewer.url} type="application/pdf" style={{width:'100%',height:'100%',border:'none'}}>
                                    <embed src={docViewer.url} type="application/pdf" style={{width:'100%',height:'100%'}}/>
                                </object>
                            ) : (
                                <div className="gus-docviewer-fallback">
                                    <span style={{fontSize:56}}>📄</span>
                                    <p style={{fontWeight:600,color:'#374151'}}>{docViewer.originalName}</p>
                                    <p style={{color:'#9ca3af',fontSize:13}}>Preview not available for <strong>.{docViewer.fileType}</strong> files.</p>
                                    <button className="gus-docviewer-open-btn" onClick={handleDownloadDoc} disabled={downloadingDoc}>
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{width:14,height:14}}>
                                            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
                                            <polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
                                        </svg>
                                        {downloadingDoc?'Downloading...':'Download File'}
                                    </button>
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