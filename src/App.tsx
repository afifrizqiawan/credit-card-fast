import React, { useState, useEffect } from 'react';
import { 
  CreditCard, 
  User, 
  Hash, 
  Mail, 
  Phone, 
  MapPin, 
  Sparkles, 
  Clock, 
  Database, 
  Trash2, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  Plus, 
  Search, 
  FileText, 
  Sliders, 
  HelpCircle,
  TrendingUp,
  Award,
  ChevronRight,
  ShieldCheck,
  RefreshCw
} from 'lucide-react';
import { CardCatalog, AVAILABLE_CARDS } from './components/CardCatalog';
import { SignatureCanvas } from './components/SignatureCanvas';
import { SqlLogViewer } from './components/SqlLogViewer';
import { CreditCardApplication, SqlLog } from '../server/db';

export default function App() {
  // Form State
  const [nama, setNama] = useState('');
  const [nik, setNik] = useState('');
  const [email, setEmail] = useState('');
  const [nomorHp, setNomorHp] = useState('');
  const [jenisKartu, setJenisKartu] = useState('Visa Gold Card');
  const [pendapatanBulanan, setPendapatanBulanan] = useState<number>(8000000);
  const [tandaTangan, setTandaTangan] = useState('');
  const [confirmedTerms, setConfirmedTerms] = useState(false);

  // Application Records & Logs
  const [applications, setApplications] = useState<CreditCardApplication[]>([]);
  const [sqlLogs, setSqlLogs] = useState<SqlLog[]>([]);
  
  // UI State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<CreditCardApplication | null>(null);
  const [activeTab, setActiveTab] = useState<'form' | 'records'>('form');
  const [searchQuery, setSearchQuery] = useState('');
  
  // AI Consultant State
  const [aiConsultation, setAiConsultation] = useState<string>('');
  const [isConsulting, setIsConsulting] = useState(false);
  const [activeEvent, setActiveEvent] = useState({
    name: 'Jakarta International Motor Show 2026',
    booth: 'Booth A-12 • ICE BSD',
    officerName: 'Budi Santoso',
    officerId: '#8821'
  });

  // Fetch initial data
  const fetchData = async () => {
    try {
      const appRes = await fetch('/api/applications');
      const appData = await appRes.json();
      if (appData.success) {
        setApplications(appData.data);
      }

      const logRes = await fetch('/api/sql-logs');
      const logData = await logRes.json();
      if (logData.success) {
        setSqlLogs(logData.data);
      }
    } catch (err) {
      console.error('Error fetching backend data:', err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Fetch AI pitch when card or income changes
  const getAiConsultation = async () => {
    if (!nama) {
      setAiConsultation('💡 *Mohon masukkan Nama nasabah terlebih dahulu untuk menganalisis kecocokan personal.*');
      return;
    }
    
    setIsConsulting(true);
    setAiConsultation('');
    try {
      const response = await fetch('/api/gemini/consult', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nama,
          pendapatanBulanan,
          jenisKartu,
          eventTheme: activeEvent.name
        })
      });
      const resData = await response.json();
      if (resData.success) {
        setAiConsultation(resData.text);
      } else {
        setAiConsultation('⚠️ Gagal memuat rekomendasi AI aktif.');
      }
    } catch (err) {
      setAiConsultation('⚠️ Terjadi gangguan koneksi saat berkonsultasi dengan asisten AI.');
    } finally {
      setIsConsulting(false);
    }
  };

  // Submit handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    setSubmitSuccess(null);

    // Front-End Checks
    if (!nama || !nik || !email || !nomorHp || !jenisKartu) {
      setSubmitError('Silakan lengkapi seluruh formulir wajib pengajuan nasabah.');
      return;
    }

    if (nik.length !== 16 || !/^\d+$/.test(nik)) {
      setSubmitError('NIK wajib berupa angka tepat sepanjang 16 digit sesuai KTP.');
      return;
    }

    if (!email.includes('@')) {
      setSubmitError('Alamat email aktif tidak menggunakan format yang valid.');
      return;
    }

    if (!tandaTangan) {
      setSubmitError('Tanda tangan digital nasabah wajib diisi secara on-the-spot.');
      return;
    }

    if (!confirmedTerms) {
      setSubmitError('Anda harus mencentang persetujuan Syarat & Ketentuan petugas.');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nama,
          nik,
          email,
          nomorHp,
          jenisKartu,
          pendapatanBulanan,
          tandaTangan
        })
      });

      const result = await response.json();
      if (result.success) {
        setSubmitSuccess(result.data);
        // Add to state list instantly
        setApplications(prev => [result.data, ...prev]);
        // Refresh SQL logs
        fetchData();
        // Reset form
        setNama('');
        setNik('');
        setEmail('');
        setNomorHp('');
        setTandaTangan('');
        setConfirmedTerms(false);
        // Switch tab to let them see status
        setTimeout(() => {
          setActiveTab('records');
        }, 3000);
      } else {
        setSubmitError(result.message || 'Gagal menyimpan pendaftaran kartu kredit.');
      }
    } catch (err) {
      setSubmitError('Gagal terhubung dengan server pengajuan. Mohon periksa jaringan.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete Application
  const handleDelete = async (id: number) => {
    if (!window.confirm('Apakah Anda yakin ingin membatalkan pengajuan kartu kredit nasabah ini?')) return;

    try {
      const response = await fetch(`/api/applications/${id}`, {
        method: 'DELETE'
      });
      const resData = await response.json();
      if (resData.success) {
        setApplications(prev => prev.filter(app => app.id !== id));
        fetchData();
      } else {
        alert(resData.message);
      }
    } catch (err) {
      alert('Gagal menghapus pengajuan.');
    }
  };

  const filteredApplications = applications.filter(app => {
    const q = searchQuery.toLowerCase();
    return (
      app.nama.toLowerCase().includes(q) ||
      app.nik.includes(q) ||
      app.jenisKartu.toLowerCase().includes(q) ||
      app.status.toLowerCase().includes(q)
    );
  });

  const selectedCardObject = AVAILABLE_CARDS.find(c => c.name === jenisKartu) || AVAILABLE_CARDS[0];

  return (
    <div className="w-full min-h-screen bg-[#F8FAFC] flex flex-col font-sans text-slate-800">
      {/* Top Application Bar */}
      <header className="h-16 bg-[#0F172A] flex items-center justify-between px-4 sm:px-8 shrink-0 shadow-lg sticky top-0 z-50">
        <div id="brand-logo" className="flex items-center gap-3">
          <div className="w-9 h-9 bg-gradient-to-tr from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center font-black text-white shadow-md shadow-blue-500/20">
            CC
          </div>
          <div className="flex flex-col">
            <span className="text-white font-bold text-sm sm:text-base tracking-tight uppercase leading-none">
              BANK BRI <span className="text-blue-400">KILAT</span>
            </span>
            <span className="text-[10px] text-slate-400 font-medium">On-The-Spot Registration Terminal</span>
          </div>
        </div>

        {/* Action Quick Info / User metadata */}
        <div className="flex items-center gap-3 sm:gap-6">
          <div className="hidden md:flex flex-col items-end">
            <span className="text-white text-xs sm:text-sm font-medium leading-none">{activeEvent.officerName}</span>
            <span className="text-slate-400 text-[10px] sm:text-xs">Petugas Event ID: {activeEvent.officerId}</span>
          </div>
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-blue-600 border border-blue-500/30 flex items-center justify-center text-white text-xs sm:text-sm font-extrabold shadow-sm">
            BS
          </div>
        </div>
      </header>

      {/* Main Framework Grid */}
      <main className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
        
        {/* LEFT COLUMN: ACTIVE EVENT INFO & CARD PREVIEW (Spans 4 cols) */}
        <section className="lg:col-span-4 flex flex-col gap-6" id="left-panel">
          
          {/* Active Event Card */}
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-2 h-full bg-blue-600" />
            <div className="flex items-center gap-2 text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-2">
              <MapPin className="w-3.5 h-3.5 text-blue-600 animate-bounce" />
              <span>Event Aktif Hari Ini</span>
            </div>
            <h2 className="text-slate-900 font-extrabold text-base leading-snug">{activeEvent.name}</h2>
            <p className="text-slate-500 text-xs mt-1 font-medium">{activeEvent.booth}</p>
            <div className="mt-3 flex items-center justify-between text-[11px] bg-slate-50 p-2 rounded-xl border border-slate-100">
              <span className="text-slate-500">Mulai Verifikasi</span>
              <span className="text-blue-600 font-bold flex items-center gap-1">
                <Clock className="w-3 h-3" /> Instan 3 Menit
              </span>
            </div>
          </div>

          {/* Interactive Live Credit Card Visualizer */}
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
            <div className="flex items-center justify-between mb-3">
              <span className="text-slate-400 uppercase text-[10px] font-bold tracking-widest">Pratinjau Kartu Instan</span>
              <span className="text-xs bg-indigo-50 text-indigo-700 font-bold px-2.5 py-0.5 rounded-full">
                Live Preview
              </span>
            </div>

            {/* Generated Simulated Card */}
            <div className={`relative w-full aspect-[1.58/1] bg-gradient-to-br ${selectedCardObject.gradient} rounded-2xl shadow-lg p-5 sm:p-6 text-white flex flex-col justify-between overflow-hidden transition-all duration-300 transform`}>
              <div className="absolute right-0 top-0 w-24 h-24 bg-white/5 rounded-full blur-xl pointer-events-none" />
              
              <div className="flex justify-between items-start">
                <div className="flex flex-col">
                  <span className="font-extrabold tracking-tight uppercase text-xs sm:text-sm drop-shadow-sm">EVENT PORTAL</span>
                  <span className="text-[9px] text-white/70 italic uppercase mt-0.5 tracking-wider">{selectedCardObject.name}</span>
                </div>
                {/* Chip emulator */}
                <div className="w-9 h-7 bg-yellow-200/90 rounded-md border border-yellow-300/60 relative flex items-center justify-center">
                  <div className="w-5 h-5 border border-yellow-600/20 rounded" />
                </div>
              </div>

              <div className="space-y-1.5 my-3">
                <p className="text-base sm:text-lg font-mono tracking-widest drop-shadow">
                  {nik ? `${nik.substring(0, 4)} •••• •••• ${nik.substring(12, 16) || '••••'}` : '4567 •••• •••• 8901'}
                </p>
                <p className="text-[10px] sm:text-xs font-bold tracking-wide uppercase truncate">
                  {nama || 'NAMA CALON NASABAH'}
                </p>
              </div>

              <div className="flex justify-between items-end">
                <div className="flex flex-col text-left">
                  <span className="text-[7px] text-white/60 tracking-wider">BATAS KREDIT HINGGA:</span>
                  <span className="text-[10px] sm:text-xs font-bold text-yellow-300 font-mono tracking-wide">
                    {selectedCardObject.limitStr.split(' ')[1] === 'Juta' ? selectedCardObject.limitStr : 'Premium Unlimited'}
                  </span>
                </div>
                <div className="flex -space-x-2">
                  <div className="w-7 h-7 rounded-full bg-red-500/80 backdrop-blur-sm" />
                  <div className="w-7 h-7 rounded-full bg-yellow-500/80 backdrop-blur-sm" />
                </div>
              </div>
            </div>

            {/* Quick stats under the preview */}
            <div className="mt-4 bg-[#F8FAFC] border border-slate-100 p-4 rounded-xl space-y-2">
              <h3 className="text-slate-800 font-bold text-xs flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5 text-blue-600" />
                Rekomendasi Syarat Pendapatan:
              </h3>
              <p className="text-xs text-slate-600">
                Minimum gaji bulanan nasabah Rp <b>{selectedCardObject.minIncome.toLocaleString('id-ID')}</b> untuk mengajukan tipe ini.
              </p>
              <div className="flex items-center gap-2 mt-2 pt-2 border-t border-slate-200/60 text-[11px]">
                <span className="text-slate-400">Status Pendapatan:</span>
                {pendapatanBulanan >= selectedCardObject.minIncome ? (
                  <span className="text-emerald-600 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-500" /> Memenuhi Syarat
                  </span>
                ) : (
                  <span className="text-amber-600 font-semibold flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3 text-amber-500" /> Di bawah syarat min
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* AI Sales Pitch Box (Gemini powered dynamic consultant) */}
          <div className="bg-slate-900 text-white rounded-2xl p-5 border border-slate-800 space-y-3 relative overflow-hidden shadow-md">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-blue-300 font-bold text-xs">
                <Sparkles className="w-4 h-4 text-blue-400 animate-pulse" />
                <span>Asisten Penjualan AI (Gemini)</span>
              </div>
              <span className="text-[9px] bg-blue-950 text-blue-400 font-bold px-1.5 py-0.5 rounded uppercase border border-blue-500/20">
                Instan Pitch
              </span>
            </div>

            <p className="text-[11px] text-slate-300 leading-relaxed">
              Analisis kebutuhan dan dapatkan poin persuasi terbaik khusus untuk profil keuangan nasabah ini secara langsung.
            </p>

            <button
              type="button"
              id="btn-get-ai-tips"
              disabled={isConsulting}
              onClick={getAiConsultation}
              className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 text-white font-bold py-2 px-4 rounded-xl text-xs transition-all flex items-center justify-center gap-2 shadow-md shadow-blue-500/10"
            >
              {isConsulting ? (
                <>
                  <RefreshCw className="w-3 h-3 animate-spin" />
                  Menganalisis profil...
                </>
              ) : (
                <>
                  <Sparkles className="w-3 h-3" />
                  Dapatkan Tips Penjualan AI
                </>
              )}
            </button>

            {aiConsultation && (
              <div className="bg-slate-950 p-4 rounded-xl text-xs leading-relaxed border border-slate-800 max-h-[220px] overflow-y-auto font-sans text-slate-300 whitespace-pre-wrap select-all">
                {aiConsultation}
              </div>
            )}
          </div>
        </section>

        {/* RIGHT COLUMN: APPLICATION FORM TAB, LIST OF ACQUISITIONS, SQL LOGGER (Spans 8 cols) */}
        <section className="lg:col-span-8 flex flex-col gap-6">
          
          {/* Main Workspace Navigation (Tabs) */}
          <div className="bg-white rounded-2xl border border-slate-200 p-2 flex gap-2 shadow-sm">
            <button
              onClick={() => setActiveTab('form')}
              id="tab-btn-form"
              className={`flex-1 py-3 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all text-center flex items-center justify-center gap-2 ${
                activeTab === 'form'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/10'
                  : 'bg-transparent text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Plus className="w-4 h-4" />
              Pendaftaran On-The-Spot
            </button>
            <button
              onClick={() => setActiveTab('records')}
              id="tab-btn-records"
              className={`flex-1 py-3 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all text-center flex items-center justify-center gap-2 relative ${
                activeTab === 'records'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/10'
                  : 'bg-transparent text-slate-600 hover:bg-slate-50'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Daftar Pengisian Event</span>
              {applications.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full border-2 border-white shadow-sm">
                  {applications.length}
                </span>
              )}
            </button>
          </div>

          {/* TAB 1: REGISTRATION FORM */}
          {activeTab === 'form' && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 sm:p-8 space-y-6">
              
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  Formulir Pengajuan Kartu Kredit
                </h1>
                <p className="text-slate-500 text-xs sm:text-sm mt-1">
                  Harap kumpulkan ID resmi nasabah (KTP) dan masukkan data dengan benar di hadapan nasabah.
                </p>
              </div>

              {/* Status Alert Messages */}
              {submitError && (
                <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-xl flex gap-3 text-red-800 text-xs sm:text-sm">
                  <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" />
                  <div className="space-y-1">
                    <span className="font-bold">Gagal Mengirimkan Data</span>
                    <p className="opacity-90">{submitError}</p>
                  </div>
                </div>
              )}

              {submitSuccess && (
                <div className="bg-emerald-50 border-l-4 border-emerald-500 p-4 rounded-xl flex gap-3 text-emerald-900 text-xs sm:text-sm animate-fade-in">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                  <div className="space-y-1">
                    <span className="font-bold">Pengajuan Sukses Terdaftar!</span>
                    <p className="opacity-90">
                      Nasabah <b>{submitSuccess.nama}</b> berhasil didaftarkan. Status Keputusan Instan: 
                      <span className="ml-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        {submitSuccess.status}
                      </span>
                    </p>
                    <p className="text-[11px] text-emerald-700/80 italic mt-1 font-medium bg-white/50 p-2 rounded-lg">
                      &ldquo;{submitSuccess.catatan}&rdquo;
                    </p>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                
                {/* 1. Grid of Personal Details */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                      Nama Lengkap Calon Nasabah <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <User className="w-4 h-4" />
                      </div>
                      <input
                        type="text"
                        required
                        id="form-input-nama"
                        value={nama}
                        onChange={(e) => setNama(e.target.value)}
                        className="w-full h-11 bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white transition-all text-slate-800"
                        placeholder="Contoh: Budi Santoso"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                      Nomor Induk Kependudukan (NIK) <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <Hash className="w-4 h-4" />
                      </div>
                      <input
                        type="text"
                        required
                        maxLength={16}
                        id="form-input-nik"
                        value={nik}
                        onChange={(e) => setNik(e.target.value.replace(/\D/g, ''))}
                        className="w-full h-11 bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white transition-all text-slate-800 font-mono tracking-wider"
                        placeholder="KTP 16 digit angka"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                      Alamat Email Aktif <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <Mail className="w-4 h-4" />
                      </div>
                      <input
                        type="email"
                        required
                        id="form-input-email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full h-11 bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white transition-all text-slate-800"
                        placeholder="alamat@email.com"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                      Nomor Hp / WhatsApp <span className="text-red-500">*</span>
                    </label>
                    <div className="flex">
                      <span className="h-11 flex items-center px-3.5 bg-slate-100 border border-r-0 border-slate-250 rounded-l-xl text-slate-600 text-xs sm:text-sm font-semibold select-none">
                        +62
                      </span>
                      <input
                        type="tel"
                        required
                        id="form-input-nomor-hp"
                        value={nomorHp}
                        onChange={(e) => setNomorHp(e.target.value.replace(/\D/g, ''))}
                        className="w-full h-11 bg-slate-50 border border-slate-200 rounded-r-xl px-4 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white transition-all text-slate-800"
                        placeholder="81234567890"
                      />
                    </div>
                  </div>
                </div>

                {/* 2. Pendapatan Bulanan Slider with real-time Rupiah calculation */}
                <div id="income-input-container" className="bg-slate-50 p-4 sm:p-5 rounded-2xl border border-slate-200 space-y-4">
                  <div className="flex justify-between items-center flex-wrap gap-2">
                    <div>
                      <span className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                        Pendapatan Bulanan Nasabah (Rupiah) <span className="text-red-500">*</span>
                      </span>
                      <p className="text-[11px] text-slate-500 mt-0.5">Pendapatan kotor bulanan reguler</p>
                    </div>
                    <div className="text-right">
                      <span className="text-sm sm:text-base font-extrabold text-blue-600 font-mono">
                        Rp {pendapatanBulanan.toLocaleString('id-ID')}
                      </span>
                    </div>
                  </div>

                  <input
                    type="range"
                    min={3000000}
                    max={150000000}
                    step={500000}
                    id="form-input-pendapatan"
                    value={pendapatanBulanan}
                    onChange={(e) => setPendapatanBulanan(Number(e.target.value))}
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-ew-resize accent-blue-600"
                  />

                  {/* Level Tiers labels */}
                  <div className="flex justify-between text-[10px] text-slate-400 font-bold px-1 select-none">
                    <span>3 Jt (UMR)</span>
                    <span>15 Jt (Platinum)</span>
                    <span>30 Jt (Signature)</span>
                    <span>100 Jt (Elite)</span>
                  </div>
                </div>

                {/* 3. Card Selector Catalog (Renders options for CC choice) */}
                <CardCatalog
                  selectedCard={jenisKartu}
                  onSelectCard={(cardName) => setJenisKartu(cardName)}
                />

                {/* 4. Digital Signature input widget */}
                <div className="border border-slate-100 rounded-2xl p-4 sm:p-5 bg-[#F8FAFC]">
                  <SignatureCanvas
                    value={tandaTangan}
                    onChange={(dataUri) => setTandaTangan(dataUri)}
                  />
                </div>

                {/* Confirm Declarative terms */}
                <div className="flex items-start gap-3 bg-blue-50/50 p-3 sm:p-4 rounded-xl border border-blue-100">
                  <input
                    type="checkbox"
                    id="checkbox-tnc"
                    required
                    checked={confirmedTerms}
                    onChange={(e) => setConfirmedTerms(e.target.checked)}
                    className="w-5 h-5 rounded accent-blue-600 cursor-pointer mt-0.5"
                  />
                  <label htmlFor="checkbox-tnc" className="text-xs text-slate-600 leading-tight cursor-pointer">
                    Saya menyatakan selaku petugas bank yang sah bahwa nasabah di atas telah bersedia diverifikasi dan tunduk terhadap <span className="text-blue-600 font-semibold underline">Syarat & Ketentuan Aturan Kebijakan Kerahasiaan Kredensial Bank BRI KILAT</span>.
                  </label>
                </div>

                {/* Action Form Footer bar */}
                <div className="flex items-center justify-between border-t border-slate-100 pt-5 flex-wrap gap-4">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">
                      Kanal Aman Bank Enkripsi HTTPS
                    </span>
                  </div>

                  <div className="flex gap-3 w-full sm:w-auto">
                    <button
                      type="button"
                      id="btn-form-clear-all"
                      onClick={() => {
                        setNama('');
                        setNik('');
                        setEmail('');
                        setNomorHp('');
                        setTandaTangan('');
                        setConfirmedTerms(false);
                      }}
                      className="px-6 h-11 rounded-xl border border-slate-200 font-bold text-slate-600 hover:bg-slate-50 text-xs sm:text-sm flex-1 sm:flex-initial"
                    >
                      Bersihkan
                    </button>
                    <button
                      type="submit"
                      id="btn-submit-application"
                      disabled={isSubmitting}
                      className="px-10 h-11 rounded-xl bg-blue-600 text-white font-bold shadow-lg shadow-blue-500/20 hover:bg-blue-700 disabled:bg-slate-400 text-xs sm:text-sm flex-1 sm:flex-initial flex items-center justify-center gap-2"
                    >
                      {isSubmitting ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          Memproses...
                        </>
                      ) : (
                        <>
                          <CreditCard className="w-4 h-4" />
                          Kirim Pengajuan
                        </>
                      )}
                    </button>
                  </div>
                </div>

              </form>
            </div>
          )}

          {/* TAB 2: LIST OF PREVIOUS ACQUISITIONS */}
          {activeTab === 'records' && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 sm:p-8 space-y-6">
              
              <div className="flex items-center justify-between flex-wrap gap-4 select-none">
                <div>
                  <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                    Pengajuan Terdaftar Event Ini
                  </h1>
                  <p className="text-slate-500 text-xs">
                    Kelola data pengisian formulir prospek on-the-spot di lokasi Anda saat ini.
                  </p>
                </div>
                
                <div className="text-right">
                  <span className="text-xs bg-slate-100 py-1.5 px-3 rounded-xl font-bold text-slate-700">
                    Total: {applications.length} Nasabah
                  </span>
                </div>
              </div>

              {/* Search Filter input */}
              <div id="search-filter-container" className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Search className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-10 bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white transition-all text-slate-800"
                  placeholder="Cari berdasarkan nama, NIK, kartu, atau status pengajuan..."
                />
              </div>

              {/* Grid or Table List */}
              <div className="space-y-4">
                {filteredApplications.length === 0 ? (
                  <div className="text-center py-12 bg-slate-50/50 rounded-2xl border border-dashed border-gray-200">
                    <p className="text-xs text-slate-400 font-medium">Tidak ada data pendaftaran yang cocok dengan pencarian.</p>
                  </div>
                ) : (
                  filteredApplications.map((app) => {
                    const matchedCard = AVAILABLE_CARDS.find(c => c.name === app.jenisKartu) || AVAILABLE_CARDS[0];
                    return (
                      <div
                        key={app.id}
                        id={`app-record-${app.id}`}
                        className="border border-slate-200 rounded-2xl p-5 hover:shadow-md transition-shadow relative bg-white flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
                      >
                        <div className="space-y-2 flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-extrabold text-slate-900 truncate block">
                              {app.nama}
                            </span>
                            <span className="text-[10px] bg-slate-100 text-slate-600 font-semibold px-2 py-0.5 rounded font-mono">
                              NIK: {app.nik}
                            </span>
                            <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 ${
                              app.status === 'APPROVED' 
                                ? 'bg-green-50 text-green-700 border border-green-200'
                                : app.status === 'REJECTED'
                                ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                : 'bg-amber-50 text-amber-700 border border-amber-250'
                            }`}>
                              {app.status === 'APPROVED' && <CheckCircle2 className="w-2.5 h-2.5 text-green-500" />}
                              {app.status === 'REJECTED' && <XCircle className="w-2.5 h-2.5 text-rose-500" />}
                              {app.status === 'PENDING' && <Clock className="w-2.5 h-2.5 text-amber-500" />}
                              {app.status}
                            </span>
                          </div>

                          {/* Contact and tier metadata row */}
                          <div className="flex items-center gap-4 text-xs text-slate-500 flex-wrap">
                            <span className="flex items-center gap-1 font-mono">
                              <Phone className="w-3 h-3 text-slate-400" />
                              +62 {app.nomorHp}
                            </span>
                            <span className="flex items-center gap-1">
                              <Mail className="w-3 h-3 text-slate-400" />
                              {app.email}
                            </span>
                            <span className="flex items-center gap-1 bg-slate-50 text-slate-700 py-0.5 px-2 rounded-lg text-[10px] font-bold border border-slate-100">
                              <CreditCard className="w-3 h-3 text-blue-500" />
                              {app.jenisKartu}
                            </span>
                          </div>

                          {/* Interactive status reason and feedback */}
                          <p className="text-[11px] text-slate-600 leading-relaxed bg-[#F8FAFC] p-3 rounded-xl border border-slate-200/50">
                            <b>Keputusan Instan:</b> {app.catatan}
                          </p>

                          <div className="flex items-center gap-4 text-[10px] text-slate-400">
                            <span>Suku Bunga Gaji: Rp {app.pendapatanBulanan.toLocaleString('id-ID')}</span>
                            <span>•</span>
                            <span>Diajukan: {new Date(app.tanggalPengajuan).toLocaleDateString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                        </div>

                        {/* Signature thumb and delete actions */}
                        <div className="flex flex-col sm:items-end gap-3 shrink-0 self-stretch sm:self-center justify-between sm:justify-start">
                          {app.tandaTangan && (
                            <div className="text-right">
                              <span className="text-[9px] text-slate-400 block mb-1 uppercase tracking-wider font-semibold">Tanda Tangan</span>
                              <div className="p-1 bg-white border border-slate-200 rounded-lg shadow-sm max-w-[120px]">
                                <img
                                  src={app.tandaTangan}
                                  alt="Tanda Tangan User"
                                  className="h-10 w-full object-contain filter contrast-125"
                                />
                              </div>
                            </div>
                          )}

                          <button
                            type="button"
                            id={`btn-delete-app-${app.id}`}
                            onClick={() => handleDelete(app.id)}
                            className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded-xl transition-colors self-end flex items-center justify-center gap-1.5 text-xs font-semibold"
                            title="Batalkan Pengajuan"
                          >
                            <Trash2 className="w-4 h-4" />
                            <span>Batal Pengajuan</span>
                          </button>
                        </div>

                      </div>
                    );
                  })
                )}
              </div>

            </div>
          )}

          {/* Dev Simulated Microservices logs representing real-time database transactions */}
          <div id="developer-terminal-panel">
            <SqlLogViewer 
              logs={sqlLogs} 
              onRefresh={fetchData} 
            />
          </div>

        </section>

      </main>

      {/* Decorative credit footer */}
      <footer className="bg-[#0F172A] text-slate-400 py-6 text-center text-xs border-t border-slate-800 mt-12">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row justify-between items-center gap-3">
          <span className="font-bold tracking-tight">BANK BRI KILAT ON-THE-SPOT © 2026</span>
          <div className="flex gap-4 text-[11px] text-slate-500">
            <span>MySQL 8.0 Engine</span>
            <span>•</span>
            <span>Go Microservice Mimicry</span>
            <span>•</span>
            <span>Highly Responsive Shell</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
