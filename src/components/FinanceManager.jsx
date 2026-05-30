import React, { useState, useRef, useEffect } from 'react';
import { Camera, Sparkles, TrendingUp, X, Trash2, Edit2, Plus, PiggyBank, Calendar, DollarSign, Check, CreditCard } from 'lucide-react';
import { scanReceiptWithGemini, getAIFinanceAdvice } from '../utils/aiEngine';

export default function FinanceManager({ 
  filteredFinances, 
  selectedDate, 
  txnDesc, 
  setTxnDesc, 
  txnAmount, 
  setTxnAmount, 
  txnType, 
  setTxnType, 
  txnCategory,
  setTxnCategory,
  txnAssetId,
  setTxnAssetId,
  handleAddTransaction, 
  onAddDirectTransaction,
  onDeleteTransaction,
  onUpdateTransaction,
  history,
  formatDateHeader,
  assets,
  goals,
  savings,
  setSavings,
  debts,
  setDebts,
  onUpdateSpendCap,
  finances
}) {
  const [activeTab, setActiveTab] = useState('summary'); // 'summary', 'savings_debts', 'monthly_cal', 'ai_advice'
  const [showTxnSheet, setShowTxnSheet] = useState(false);
  
  // Spend cap states
  const spendCapGoal = goals ? goals.find(g => g.type === 'spend_cap') : null;
  const currentSpendCap = spendCapGoal ? spendCapGoal.targetValue : 150000;
  const [isEditingSpendCap, setIsEditingSpendCap] = useState(false);
  const [newSpendCapVal, setNewSpendCapVal] = useState(currentSpendCap.toString());

  // Edit transaction states
  const [editingTxnId, setEditingTxnId] = useState(null);
  const [editTxnDesc, setEditTxnDesc] = useState('');
  const [editTxnAmount, setEditTxnAmount] = useState('');
  const [editTxnType, setEditTxnType] = useState('expense');
  const [editTxnCategory, setEditTxnCategory] = useState('Caffeine/Food');
  const [editTxnAssetId, setEditTxnAssetId] = useState('cash');

  // Scanner states
  const [isScanning, setIsScanning] = useState(false);
  const [scanStatus, setScanStatus] = useState('');
  const fileInputRef = useRef(null);

  // Savings / Debts input states
  const [newSavingName, setNewSavingName] = useState('');
  const [newSavingTarget, setNewSavingTarget] = useState('');
  const [newSavingCurrent, setNewSavingCurrent] = useState('0');
  const [addFundSavingId, setAddFundSavingId] = useState(null);
  const [addFundAmount, setAddFundAmount] = useState('');

  const [newDebtName, setNewDebtName] = useState('');
  const [newDebtAmount, setNewDebtAmount] = useState('');
  const [newDebtDueDate, setNewDebtDueDate] = useState('');

  // AI Advisor states
  const [aiAdviceData, setAiAdviceData] = useState(null);
  const [isLoadingAdvice, setIsLoadingAdvice] = useState(false);

  // Month navigation for Monthly calendar overview
  const [currentYearMonth, setCurrentYearMonth] = useState(() => selectedDate ? selectedDate.substring(0, 7) : '2026-05');

  useEffect(() => {
    if (selectedDate) {
      setCurrentYearMonth(selectedDate.substring(0, 7));
    }
  }, [selectedDate]);

  // Load weekly trends
  const last7Days = history ? history.slice(-7) : [];
  const maxExpense = Math.max(...last7Days.map(d => d.expense || 0), currentSpendCap);

  // Save Spend Cap Handler
  const handleSaveSpendCap = (e) => {
    e.preventDefault();
    const val = parseInt(newSpendCapVal.replace(/[^0-9]/g, ''), 10);
    if (!isNaN(val) && val > 0) {
      onUpdateSpendCap(val);
      setIsEditingSpendCap(false);
    }
  };

  // Receipt Scanner trigger
  const handleScanClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setIsScanning(true);
      setScanStatus('Membaca gambar nota...');
 
      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          const base64Data = reader.result.split(',')[1];
          const mimeType = file.type || 'image/jpeg';
          setScanStatus('Gemini AI sedang menganalisis struk & mendeteksi pengeluaran...');
          const result = await scanReceiptWithGemini(base64Data, mimeType);
          
          if (result) {
            let parsedAmount = parseInt(result.amount, 10);
            if (isNaN(parsedAmount)) parsedAmount = 0;
            setIsScanning(false);
            setScanStatus('');

            if (parsedAmount > 0) {
              onAddDirectTransaction(
                result.description || 'Scan Nota AI', 
                parsedAmount, 
                'expense', 
                result.category || 'Other',
                assets && assets.length > 0 ? assets[0].id : 'cash'
              );
              alert(`🤖 AI Scanner Berhasil!\n\nNota terdeteksi: "${result.description}"\nNominal: Rp ${parsedAmount.toLocaleString('id-ID')}\nKategori: ${result.category}`);
            } else {
              const inputAmountStr = prompt(
                `🤖 AI mendeteksi nota dari "${result.description || 'Merchant'}" tetapi nominalnya kurang jelas.\n\nMasukkan nominal belanja (Rp) secara manual:`,
                "0"
              );
              if (inputAmountStr !== null) {
                const userAmount = parseInt(inputAmountStr.replace(/[^0-9]/g, ''), 10);
                if (!isNaN(userAmount) && userAmount > 0) {
                  onAddDirectTransaction(
                    result.description || 'Scan Nota AI', 
                    userAmount, 
                    'expense', 
                    result.category || 'Other',
                    assets && assets.length > 0 ? assets[0].id : 'cash'
                  );
                  alert(`🤖 Transaksi disimpan!\n\nNota: "${result.description}"\nNominal: Rp ${userAmount.toLocaleString('id-ID')}`);
                }
              }
            }
          }
        } catch (error) {
          console.error(error);
          setIsScanning(false);
          setScanStatus('');
          alert('😢 AI Scanner Gagal: Pastikan Anda mengunggah struk belanja yang jelas.');
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Add Savings Goal
  const handleAddSaving = (e) => {
    e.preventDefault();
    if (!newSavingName.trim() || !newSavingTarget) return;
    const target = parseFloat(newSavingTarget);
    const current = parseFloat(newSavingCurrent) || 0;
    if (isNaN(target) || target <= 0) return;

    const newObj = {
      id: `save_${Date.now()}`,
      name: newSavingName.trim(),
      currentAmount: current,
      targetAmount: target
    };
    setSavings(prev => [...prev, newObj]);
    setNewSavingName('');
    setNewSavingTarget('');
    setNewSavingCurrent('0');
  };

  // Add Funds to Saving Goal
  const handleAddFundSaving = (e) => {
    e.preventDefault();
    if (!addFundAmount) return;
    const amount = parseFloat(addFundAmount);
    if (isNaN(amount) || amount <= 0) return;

    // Deduct from assets (default to first active account or cash)
    const activeAsset = assets && assets.length > 0 ? assets[0] : null;
    if (activeAsset) {
      // Prompt user or log as transaction
      onAddDirectTransaction(
        `Alokasi ke ${savings.find(s => s.id === addFundSavingId)?.name || 'Tabungan'}`,
        amount,
        'expense',
        'Other',
        activeAsset.id
      );
    }

    setSavings(prev => prev.map(s => s.id === addFundSavingId ? { ...s, currentAmount: s.currentAmount + amount } : s));
    setAddFundSavingId(null);
    setAddFundAmount('');
  };

  // Delete Saving Goal
  const handleDeleteSaving = (id) => {
    if (confirm('Hapus tujuan tabungan ini?')) {
      setSavings(prev => prev.filter(s => s.id !== id));
    }
  };

  // Add Debt
  const handleAddDebt = (e) => {
    e.preventDefault();
    if (!newDebtName.trim() || !newDebtAmount || !newDebtDueDate) return;
    const amt = parseFloat(newDebtAmount);
    if (isNaN(amt) || amt <= 0) return;

    const newObj = {
      id: `debt_${Date.now()}`,
      name: newDebtName.trim(),
      amount: amt,
      dueDate: newDebtDueDate,
      paid: false
    };
    setDebts(prev => [...prev, newObj]);
    setNewDebtName('');
    setNewDebtAmount('');
    setNewDebtDueDate('');
  };

  // Pay Debt
  const handlePayDebt = (id) => {
    const targetDebt = debts.find(d => d.id === id);
    if (!targetDebt) return;
    if (confirm(`Bayar hutang "${targetDebt.name}" senilai Rp ${targetDebt.amount.toLocaleString('id-ID')}?`)) {
      const activeAsset = assets && assets.length > 0 ? assets[0] : null;
      if (activeAsset) {
        // Log transaction
        onAddDirectTransaction(
          `Pelunasan Hutang: ${targetDebt.name}`,
          targetDebt.amount,
          'expense',
          'Other',
          activeAsset.id
        );
      }
      setDebts(prev => prev.map(d => d.id === id ? { ...d, paid: true } : d));
    }
  };

  const handleDeleteDebt = (id) => {
    if (confirm('Hapus catatan hutang ini?')) {
      setDebts(prev => prev.filter(d => d.id !== id));
    }
  };

  // AI Recommendation Trigger
  const triggerAiAdvice = async () => {
    setIsLoadingAdvice(true);
    try {
      const result = await getAIFinanceAdvice(goals, finances, assets, savings, debts);
      setAiAdviceData(result);
    } catch(e) {
      console.error(e);
      alert(`😢 Gagal menghubungi AI Advisor: ${e.message}. Silakan coba beberapa saat lagi, bestie!`);
    }
    setIsLoadingAdvice(false);
  };

  // Format Helper Markdown inside App
  const formatMarkdown = (text) => {
    if (!text) return '';
    let processed = text.replace(/\\n/g, '\n').replace(/\r?\n/g, '<br />');
    processed = processed.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    processed = processed.replace(/\*(.*?)\*/g, '<em>$1</em>');
    return processed;
  };

  // Generate calendar days for monthly overview
  const getDaysInMonth = (yearMonthStr) => {
    const [year, month] = yearMonthStr.split('-').map(Number);
    const date = new Date(year, month - 1, 1);
    const days = [];
    while (date.getMonth() === month - 1) {
      days.push(new Date(date));
      date.setDate(date.getDate() + 1);
    }
    return days;
  };

  const daysInMonth = getDaysInMonth(currentYearMonth);

  return (
    <div className="subpanel-overlay">
      
      {/* Scanner laser overlay */}
      {isScanning && (
        <div className="scanner-overlay">
          <div className="scanner-frame">
            <div className="scanner-laser" />
            <Camera size={48} color="var(--accent-volt)" style={{ opacity: 0.6 }} />
          </div>
          <span style={{ color: '#fff', fontWeight: 'bold' }}>AI Scanner Struk Aktif</span>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{scanStatus}</p>
        </div>
      )}

      <div className="subpanel-header">
        <span className="subpanel-title">💵 Keuangan & Budget</span>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.35rem', background: 'var(--bg-pill)', padding: '4px', borderRadius: '14px', marginBottom: '0.75rem' }}>
        <button onClick={() => setActiveTab('summary')} style={{ flex: 1, padding: '8px 4px', fontSize: '0.68rem', fontWeight: 'bold', border: 'none', borderRadius: '10px', background: activeTab === 'summary' ? 'var(--card-bg-solid)' : 'none', color: activeTab === 'summary' ? 'var(--text-primary)' : 'var(--text-secondary)', cursor: 'pointer' }}>Log & Tren</button>
        <button onClick={() => setActiveTab('savings_debts')} style={{ flex: 1, padding: '8px 4px', fontSize: '0.68rem', fontWeight: 'bold', border: 'none', borderRadius: '10px', background: activeTab === 'savings_debts' ? 'var(--card-bg-solid)' : 'none', color: activeTab === 'savings_debts' ? 'var(--text-primary)' : 'var(--text-secondary)', cursor: 'pointer' }}>Tabungan/Hutang</button>
        <button onClick={() => setActiveTab('monthly_cal')} style={{ flex: 1, padding: '8px 4px', fontSize: '0.68rem', fontWeight: 'bold', border: 'none', borderRadius: '10px', background: activeTab === 'monthly_cal' ? 'var(--card-bg-solid)' : 'none', color: activeTab === 'monthly_cal' ? 'var(--text-primary)' : 'var(--text-secondary)', cursor: 'pointer' }}>Kalender Bulat</button>
        <button onClick={() => setActiveTab('ai_advice')} style={{ flex: 1, padding: '8px 4px', fontSize: '0.68rem', fontWeight: 'bold', border: 'none', borderRadius: '10px', background: activeTab === 'ai_advice' ? 'var(--card-bg-solid)' : 'none', color: activeTab === 'ai_advice' ? 'var(--text-primary)' : 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '2px' }}><Sparkles size={10} color="var(--accent-purple)" /> AI Advisor</button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', overflowY: 'auto', flex: 1, paddingBottom: '20px' }}>
        
        {activeTab === 'summary' && (
          <>
            {/* Total Saldo Card */}
            <div className="glass-panel volt-card" style={{ background: 'linear-gradient(135deg, rgba(34, 211, 238, 0.06), rgba(0, 0, 0, 0.3))', border: '1px solid rgba(34, 211, 238, 0.15)', color: '#fff', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.6)', fontWeight: 'bold', textTransform: 'uppercase' }}>Total Saldo Akun (Dompet)</span>
              <h2 style={{ color: (assets || []).reduce((sum, a) => sum + (a.balance || 0), 0) >= 0 ? 'var(--accent-volt)' : 'var(--accent-coral)', fontSize: '1.45rem', margin: '4px 0 0 0', fontWeight: '800' }}>
                Rp {(assets || []).reduce((sum, a) => sum + (a.balance || 0), 0).toLocaleString('id-ID')}
              </h2>
            </div>

            {/* Allowance & Edit Limit section */}
            <div className="glass-panel volt-card" style={{ background: '#120e24', border: '1px solid rgba(255, 255, 255, 0.08)', color: '#fff', padding: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.6)' }}>Allowance Limit Harian</span>
                  {isEditingSpendCap ? (
                    <form onSubmit={handleSaveSpendCap} style={{ display: 'flex', gap: '6px', marginTop: '4px' }}>
                      <input 
                        type="number" 
                        className="task-input" 
                        value={newSpendCapVal} 
                        onChange={(e) => setNewSpendCapVal(e.target.value)} 
                        autoFocus 
                        style={{ width: '120px', padding: '4px 8px', fontSize: '0.9rem', color: '#fff', background: 'rgba(255,255,255,0.08)' }} 
                      />
                      <button type="submit" className="primary-btn" style={{ padding: '4px 10px', fontSize: '0.7rem', background: 'var(--accent-volt)', color: '#000' }}>Save</button>
                      <button type="button" onClick={() => setIsEditingSpendCap(false)} className="primary-btn" style={{ padding: '4px 10px', fontSize: '0.7rem', background: 'rgba(255,255,255,0.1)' }}>X</button>
                    </form>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <h2 style={{ color: '#fff', fontSize: '1.45rem' }}>Rp {currentSpendCap.toLocaleString('id-ID')}</h2>
                      <button 
                        onClick={() => { setIsEditingSpendCap(true); setNewSpendCapVal(currentSpendCap.toString()); }} 
                        style={{ background: 'none', border: 'none', color: 'var(--accent-volt)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                      >
                        <Edit2 size={12} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
              
              <div style={{ marginTop: '0.75rem', display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '0.75rem' }}>
                <div>
                  <span style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.5)' }}>Total Belanja Hari Ini</span>
                  <p style={{ color: 'var(--accent-coral)', fontSize: '0.85rem', fontWeight: 'bold' }}>
                    Rp {filteredFinances.filter(f => f.type === 'expense').reduce((sum, f) => sum + f.amount, 0).toLocaleString('id-ID')}
                  </p>
                </div>
                <div>
                  <span style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.5)' }}>Pemasukan</span>
                  <p style={{ color: 'var(--accent-volt)', fontSize: '0.85rem', fontWeight: 'bold' }}>
                    Rp {filteredFinances.filter(f => f.type === 'income').reduce((sum, f) => sum + f.amount, 0).toLocaleString('id-ID')}
                  </p>
                </div>
              </div>
            </div>

            {/* Weekly Trend Chart */}
            <div className="glass-panel volt-card" style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', padding: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <TrendingUp size={14} color="var(--accent-volt)" />
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-primary)', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Trend Belanja Mingguan</span>
                </div>
                <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>7 HARI TERAKHIR</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', height: '95px', paddingTop: '15px', paddingBottom: '5px', borderBottom: '1px solid var(--card-border-inner)' }}>
                {last7Days.map((d, idx) => {
                  const expenseVal = d.expense || 0;
                  const barHeight = maxExpense > 0 ? (expenseVal / maxExpense) * 60 : 0;
                  const dateParts = d.date.split('-');
                  const dateLabel = dateParts.length === 3 ? dateParts[2] : '';
                  const displayAmt = expenseVal >= 1000 ? `${Math.round(expenseVal / 1000)}K` : `${expenseVal}`;
                  const limitExceeded = expenseVal > currentSpendCap;
                  
                  return (
                    <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, gap: '4px' }}>
                      <span style={{ fontSize: '0.55rem', fontWeight: 'bold', color: limitExceeded ? 'var(--accent-coral)' : 'var(--text-secondary)', opacity: expenseVal > 0 ? 0.9 : 0.2 }}>
                        {expenseVal > 0 ? displayAmt : '-'}
                      </span>
                      <div style={{ 
                        width: '16px', 
                        height: `${barHeight}px`, 
                        background: limitExceeded 
                          ? 'linear-gradient(180deg, var(--accent-coral), rgba(255, 71, 126, 0.3))' 
                          : 'linear-gradient(180deg, var(--accent-volt), rgba(187, 238, 0, 0.2))',
                        borderRadius: '4px 4px 0 0',
                        minHeight: expenseVal > 0 ? '3px' : '1px'
                      }} />
                      <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)', fontWeight: 'bold' }}>{dateLabel}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Trigger Button for Transaction Bottom Sheet & AI Scan */}
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
              <button 
                type="button" 
                className="primary-btn" 
                onClick={() => setShowTxnSheet(true)} 
                style={{ flex: 1, padding: '12px', borderRadius: '14px', background: 'var(--accent-volt)', color: '#000', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
              >
                <Plus size={16} /> Tambah Transaksi baru
              </button>
              <button 
                type="button" 
                className="primary-btn" 
                onClick={handleScanClick} 
                style={{ padding: '12px', background: 'var(--bg-pill)', border: '1px solid var(--card-border-inner)', color: 'var(--text-primary)', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                title="Scan Struk Belanja"
              >
                <Camera size={16} />
              </button>
              <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" style={{ display: 'none' }} />
            </div>

            {/* Single Bottom Sheet Overlay for Transaction Input */}
            {showTxnSheet && (
              <div className="chat-drawer-overlay" onClick={() => setShowTxnSheet(false)} style={{ zIndex: 5000 }}>
                <div 
                  className="chat-drawer-sheet" 
                  onClick={(e) => e.stopPropagation()} 
                  style={{ height: 'auto', maxHeight: '85%', padding: '1.5rem', borderRadius: '30px 30px 0 0' }}
                >
                  {/* Header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: 800 }}>💵 Catat Transaksi</h3>
                    <button className="circular-utility-btn" onClick={() => setShowTxnSheet(false)}>
                      <X size={14} />
                    </button>
                  </div>

                  <form 
                    onSubmit={(e) => {
                      handleAddTransaction(e);
                      setShowTxnSheet(false);
                    }} 
                    style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}
                  >
                    
                    {/* Amount Field: Large & Centered */}
                    <div style={{ textAlign: 'center', margin: '0.5rem 0' }}>
                      <label style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: 'bold', display: 'block', marginBottom: '6px' }}>NOMINAL TRANSAKSI (RP)</label>
                      <input 
                        type="number" 
                        pattern="[0-9]*"
                        inputMode="numeric"
                        className="task-input" 
                        placeholder="0" 
                        value={txnAmount} 
                        onChange={(e) => setTxnAmount(e.target.value)} 
                        required 
                        style={{ fontSize: '2rem', fontWeight: '900', textAlign: 'center', width: '100%', background: 'none', border: 'none', borderBottom: '2.5px solid var(--accent-volt)', borderRadius: 0, color: 'var(--text-primary)', outline: 'none', paddingBottom: '4px' }} 
                      />
                    </div>

                    {/* Type Toggle: Pill Toggle Style */}
                    <div style={{ display: 'flex', background: 'var(--bg-pill)', borderRadius: '12px', padding: '4px', width: '100%' }}>
                      <button 
                        type="button" 
                        onClick={() => { setTxnType('expense'); setTxnCategory('Caffeine/Food'); }} 
                        style={{ flex: 1, padding: '8px', fontSize: '0.78rem', border: 'none', borderRadius: '8px', background: txnType === 'expense' ? 'var(--card-bg-solid)' : 'transparent', color: txnType === 'expense' ? 'var(--text-primary)' : 'var(--text-secondary)', cursor: 'pointer', fontWeight: 'bold', transition: 'all 0.2s' }}
                      >
                        Pengeluaran
                      </button>
                      <button 
                        type="button" 
                        onClick={() => { setTxnType('income'); setTxnCategory('Salary'); }} 
                        style={{ flex: 1, padding: '8px', fontSize: '0.78rem', border: 'none', borderRadius: '8px', background: txnType === 'income' ? 'var(--card-bg-solid)' : 'transparent', color: txnType === 'income' ? 'var(--text-primary)' : 'var(--text-secondary)', cursor: 'pointer', fontWeight: 'bold', transition: 'all 0.2s' }}
                      >
                        Pemasukan
                      </button>
                    </div>

                    {/* Category Scroll Chips: Horizontal scroll */}
                    <div>
                      <label style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: 'bold', display: 'block', marginBottom: '6px' }}>PILIH KATEGORI</label>
                      <div className="category-scroll-row" style={{ display: 'flex', gap: '8px', overflowX: 'auto', padding: '4px 0', scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}>
                        {(txnType === 'income' ? [
                          { value: 'Salary', label: '💵 Gaji' },
                          { value: 'Freelance', label: '💻 Proyek' },
                          { value: 'Investment', label: '📈 Investasi' },
                          { value: 'Gift', label: '🎁 Hadiah' },
                          { value: 'Other', label: '📦 Lainnya' }
                        ] : [
                          { value: 'Caffeine/Food', label: '☕ Makan & Kopi' },
                          { value: 'Impulse/Lifestyle', label: '🛍️ Belanja' },
                          { value: 'Travel', label: '🚗 Transportasi' },
                          { value: 'Other', label: '📦 Lainnya' }
                        ]).map(cat => {
                          const isActive = txnCategory === cat.value;
                          return (
                            <button
                              type="button"
                              key={cat.value}
                              onClick={() => setTxnCategory(cat.value)}
                              style={{
                                flexShrink: 0,
                                padding: '6px 14px',
                                borderRadius: '20px',
                                border: isActive ? '1.5px solid var(--accent-volt)' : '1px solid var(--card-border-inner)',
                                background: isActive ? 'rgba(187, 238, 0, 0.12)' : 'var(--bg-pill)',
                                color: isActive ? 'var(--accent-volt)' : 'var(--text-secondary)',
                                fontSize: '0.72rem',
                                fontWeight: 'bold',
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                              }}
                            >
                              {cat.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Asset / Source Selector */}
                    {assets && assets.length > 0 && (
                      <div>
                        <label style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: 'bold', display: 'block', marginBottom: '6px' }}>METODE PEMBAYARAN / SUMBER</label>
                        <select 
                          className="select-input" 
                          value={txnAssetId} 
                          onChange={(e) => setTxnAssetId(e.target.value)} 
                          style={{ width: '100%', fontSize: '0.8rem' }}
                        >
                          {assets.map(a => <option key={a.id} value={a.id}>💳 {a.name}</option>)}
                        </select>
                      </div>
                    )}

                    {/* Note Field (deskripsi) */}
                    <div>
                      <label style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: 'bold', display: 'block', marginBottom: '6px' }}>CATATAN / DESKRIPSI</label>
                      <input 
                        type="text" 
                        className="task-input" 
                        placeholder="Opsional (e.g. Beli Kopi Latte)" 
                        value={txnDesc} 
                        onChange={(e) => setTxnDesc(e.target.value)} 
                        required 
                        style={{ width: '100%', fontSize: '0.8rem' }}
                      />
                    </div>

                    {/* Confirm Button */}
                    <button 
                      type="submit" 
                      className="primary-btn" 
                      style={{ padding: '12px', borderRadius: '12px', fontWeight: 'bold', background: 'var(--accent-volt)', color: '#000', marginTop: '0.5rem' }}
                    >
                      Catat Transaksi
                    </button>
                  </form>
                </div>
              </div>
            )}

            {/* List all transactions */}
            <div className="section-label-row" style={{ marginTop: '0.75rem', marginBottom: '0.25rem' }}>
              <span className="section-title-label" style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                💵 RIWAYAT TRANSAKSI ({formatDateHeader(selectedDate)})
              </span>
            </div>

            {filteredFinances.length > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0.75rem', background: 'rgba(0,0,0,0.15)', borderRadius: '12px', fontSize: '0.68rem', marginBottom: '0.25rem' }}>
                <span style={{ color: 'var(--accent-volt)' }}>Total Pemasukan: Rp {filteredFinances.filter(f => f.type === 'income').reduce((sum, f) => sum + f.amount, 0).toLocaleString('id-ID')}</span>
                <span style={{ color: 'var(--accent-coral)' }}>Total Pengeluaran: Rp {filteredFinances.filter(f => f.type === 'expense').reduce((sum, f) => sum + f.amount, 0).toLocaleString('id-ID')}</span>
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {filteredFinances.map(f => {
                const isEditing = editingTxnId === f.id;
                return (
                  <div className="recent-row-item" key={f.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem', padding: '0.85rem 1rem' }}>
                    {isEditing ? (
                      <form onSubmit={(e) => { e.preventDefault(); onUpdateTransaction(f.id, { description: editTxnDesc, amount: parseFloat(editTxnAmount), type: editTxnType, category: editTxnCategory, assetId: editTxnAssetId }); setEditingTxnId(null); }} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <input type="text" className="task-input" value={editTxnDesc} onChange={(e) => setEditTxnDesc(e.target.value)} required />
                        <div style={{ display: 'flex', gap: '0.3rem' }}>
                          <input type="number" className="task-input" value={editTxnAmount} onChange={(e) => setEditTxnAmount(e.target.value)} required style={{ flex: 1 }} />
                          <select 
                            className="select-input" 
                            value={editTxnType} 
                            onChange={(e) => {
                              const nextEditType = e.target.value;
                              setEditTxnType(nextEditType);
                              if (nextEditType === 'income') {
                                setEditTxnCategory('Salary');
                              } else {
                                setEditTxnCategory('Caffeine/Food');
                              }
                            }} 
                            style={{ flex: 1 }}
                          >
                            <option value="expense">Expense</option>
                            <option value="income">Income</option>
                          </select>
                        </div>
                        <div style={{ display: 'flex', gap: '0.3rem' }}>
                          <select 
                            className="select-input" 
                            value={editTxnCategory} 
                            onChange={(e) => setEditTxnCategory(e.target.value)} 
                            style={{ flex: 1 }}
                          >
                            {editTxnType === 'income' ? (
                              <>
                                <option value="Salary">💵 Gaji & Bulanan</option>
                                <option value="Freelance">💻 Freelance & Proyek</option>
                                <option value="Investment">📈 Investasi</option>
                                <option value="Gift">🎁 Hadiah & Hibah</option>
                                <option value="Other">📦 Lainnya</option>
                              </>
                            ) : (
                              <>
                                <option value="Caffeine/Food">☕ Makanan & Kopi</option>
                                <option value="Impulse/Lifestyle">🛍️ Belanja Impulsif</option>
                                <option value="Travel">🚗 Transportasi</option>
                                <option value="Other">📦 Lainnya</option>
                              </>
                            )}
                          </select>
                          {assets && assets.length > 0 && (
                            <select className="select-input" value={editTxnAssetId} onChange={(e) => setEditTxnAssetId(e.target.value)} style={{ flex: 1 }}>
                              {assets.map(a => <option key={a.id} value={a.id}>💳 {a.name}</option>)}
                            </select>
                          )}
                        </div>
                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                          <button type="submit" className="primary-btn" style={{ padding: '4px 10px', fontSize: '0.7rem' }}>Simpan</button>
                          <button type="button" onClick={() => setEditingTxnId(null)} className="primary-btn" style={{ padding: '4px 10px', fontSize: '0.7rem', background: 'var(--bg-pill)', color: 'var(--text-primary)' }}>Batal</button>
                        </div>
                      </form>
                    ) : (
                      <>
                        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
                          <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{f.description}</span>
                          <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{f.category} • {f.timestamp}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                          <span className={`row-item-value-badge ${f.type === 'income' ? 'positive' : 'negative'}`} style={{ color: f.type === 'income' ? 'var(--accent-volt-dark)' : 'var(--text-primary)', fontSize: '0.85rem', fontWeight: 'bold' }}>{f.type === 'income' ? '+' : '-'}Rp {f.amount.toLocaleString('id-ID')}</span>
                          <button type="button" className="shortcut-circle-icon" style={{ width: '26px', height: '26px', background: 'none', border: 'none', color: 'var(--text-muted)' }} onClick={() => { setEditingTxnId(f.id); setEditTxnDesc(f.description); setEditTxnAmount(f.amount.toString()); setEditTxnType(f.type); setEditTxnCategory(f.category); setEditTxnAssetId(f.assetId || 'cash'); }}><Edit2 size={11} /></button>
                          <button type="button" className="shortcut-circle-icon" style={{ width: '26px', height: '26px', background: 'none', border: 'none', color: 'var(--accent-coral)' }} onClick={() => { if (confirm('Apakah Anda yakin ingin menghapus transaksi ini?')) onDeleteTransaction(f.id); }}><Trash2 size={11} /></button>
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Dedicated Finance Tracking History */}
            <div style={{ height: '1px', background: 'rgba(255,255,255,0.05)', margin: '1rem 0' }} />
            
            <div className="glass-panel volt-card" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '1rem' }}>📈</span>
                <strong style={{ fontSize: '0.75rem', color: 'var(--accent-volt)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Tracking & Riwayat Transaksi Seluruh Tanggal</strong>
              </div>
              <p style={{ fontSize: '0.68rem', color: 'var(--text-muted)', margin: 0 }}>
                Daftar lengkap semua transaksi yang pernah dicatat untuk memudahkan tracking pengeluaran & pemasukan.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', maxHeight: '200px', overflowY: 'auto', paddingRight: '4px' }}>
                {(() => {
                  const allTxnsSorted = [...(finances || [])].sort((a, b) => b.date.localeCompare(a.date));
                  if (allTxnsSorted.length === 0) {
                    return <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', margin: 0, fontStyle: 'italic' }}>Belum ada data transaksi sama sekali.</p>;
                  }
                  return allTxnsSorted.map(f => {
                    const isExpense = f.type === 'expense';
                    return (
                      <div key={f.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255,255,255,0.02)', padding: '0.45rem 0.65rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.03)', fontSize: '0.7rem' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', overflow: 'hidden' }}>
                          <span style={{ fontSize: '0.75rem', color: '#fff', textOverflow: 'ellipsis', whiteSpace: 'nowrap', overflow: 'hidden' }}>{f.description}</span>
                          <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>
                            {f.category} • {formatDateHeader(f.date)}
                          </span>
                        </div>
                        <span style={{
                          fontWeight: 'bold',
                          color: isExpense ? 'var(--accent-coral)' : 'var(--accent-volt)',
                          whiteSpace: 'nowrap'
                        }}>
                          {isExpense ? "-" : "+"} Rp {f.amount.toLocaleString('id-ID')}
                        </span>
                      </div>
                    );
                  });
                })()}
              </div>
            </div>
          </>
        )}

        {activeTab === 'savings_debts' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            
            {/* SAVINGS SECTION */}
            <div className="glass-panel volt-card" style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', padding: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <PiggyBank size={15} color="var(--accent-volt-dark)" />
                <span style={{ fontSize: '0.78rem', color: 'var(--text-primary)', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em' }}>🐷 Tabungan & Impian</span>
              </div>

              {/* Add saving form */}
              <form onSubmit={handleAddSaving} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', borderBottom: '1px dashed var(--card-border-inner)', paddingBottom: '0.85rem' }}>
                <input type="text" className="task-input" placeholder="Nama Impian (e.g. Tabungan iPhone 17)" value={newSavingName} onChange={(e) => setNewSavingName(e.target.value)} required />
                <div style={{ display: 'flex', gap: '0.4rem' }}>
                  <input type="number" className="task-input" placeholder="Target Dana (Rp)" value={newSavingTarget} onChange={(e) => setNewSavingTarget(e.target.value)} required style={{ flex: 1 }} />
                  <input type="number" className="task-input" placeholder="Dana Awal (Rp)" value={newSavingCurrent} onChange={(e) => setNewSavingCurrent(e.target.value)} style={{ flex: 1 }} />
                  <button type="submit" className="primary-btn" style={{ padding: '0 12px', background: 'var(--accent-volt)', color: '#000' }}><Plus size={16} /></button>
                </div>
              </form>

              {/* Savings list */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {savings.map(s => {
                  const pct = Math.min(100, Math.round((s.currentAmount / s.targetAmount) * 100));
                  return (
                    <div key={s.id} style={{ display: 'flex', flexDirection: 'column', gap: '6px', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--card-border-inner)', borderRadius: '16px', padding: '10px 12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <strong style={{ fontSize: '0.8rem', color: '#fff' }}>{s.name}</strong>
                          <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                            Rp {s.currentAmount.toLocaleString('id-ID')} / Rp {s.targetAmount.toLocaleString('id-ID')}
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button onClick={() => setAddFundSavingId(s.id)} className="primary-btn" style={{ padding: '3px 8px', fontSize: '0.6rem', background: 'var(--accent-volt-dark)', color: '#fff' }}>Isi Saldo</button>
                          <button onClick={() => handleDeleteSaving(s.id)} className="primary-btn" style={{ padding: '3px 6px', fontSize: '0.6rem', background: 'none', border: 'none', color: 'var(--accent-coral)' }}><Trash2 size={11} /></button>
                        </div>
                      </div>
                      
                      {/* Add Fund Inline Form */}
                      {addFundSavingId === s.id && (
                        <form onSubmit={handleAddFundSaving} style={{ display: 'flex', gap: '6px', marginTop: '6px', background: 'rgba(255,255,255,0.04)', padding: '6px', borderRadius: '10px' }}>
                          <input type="number" className="task-input" placeholder="Jumlah (Rp)" value={addFundAmount} onChange={(e) => setAddFundAmount(e.target.value)} required style={{ flex: 1, padding: '3px 6px', fontSize: '0.75rem' }} />
                          <button type="submit" className="primary-btn" style={{ padding: '2px 8px', fontSize: '0.65rem' }}>Simpan</button>
                          <button type="button" onClick={() => setAddFundSavingId(null)} className="primary-btn" style={{ padding: '2px 8px', fontSize: '0.65rem', background: 'none', color: '#fff' }}>X</button>
                        </form>
                      )}

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                        <div style={{ flex: 1, height: '6px', background: 'var(--bg-pill)', borderRadius: '9px', overflow: 'hidden' }}>
                          <div style={{ height: '100%', background: 'var(--accent-volt)', width: `${pct}%`, borderRadius: '9px' }} />
                        </div>
                        <span style={{ fontSize: '0.65rem', fontWeight: 'bold', color: 'var(--accent-volt)', minWidth: '24px', textAlign: 'right' }}>{pct}%</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* DEBTS SECTION */}
            <div className="glass-panel volt-card" style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', padding: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <CreditCard size={15} color="var(--accent-coral)" />
                <span style={{ fontSize: '0.78rem', color: 'var(--text-primary)', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em' }}>💸 Daftar Hutang & Kredit</span>
              </div>

              {/* Add debt form */}
              <form onSubmit={handleAddDebt} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', borderBottom: '1px dashed var(--card-border-inner)', paddingBottom: '0.85rem' }}>
                <input type="text" className="task-input" placeholder="Nama Kredit/Pemberi (e.g. Shopee Paylater)" value={newDebtName} onChange={(e) => setNewDebtName(e.target.value)} required />
                <div style={{ display: 'flex', gap: '0.4rem' }}>
                  <input type="number" className="task-input" placeholder="Jumlah Hutang (Rp)" value={newDebtAmount} onChange={(e) => setNewDebtAmount(e.target.value)} required style={{ flex: 1 }} />
                  <input type="date" className="task-input" value={newDebtDueDate} onChange={(e) => setNewDebtDueDate(e.target.value)} required style={{ flex: 1, fontSize: '0.72rem' }} />
                  <button type="submit" className="primary-btn" style={{ padding: '0 12px', background: 'var(--accent-coral)', color: '#fff' }}><Plus size={16} /></button>
                </div>
              </form>

              {/* Debts list */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                {debts.map(d => (
                  <div key={d.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: d.paid ? 'rgba(187, 238, 0, 0.03)' : 'rgba(244, 63, 94, 0.02)', border: d.paid ? '1px solid rgba(187, 238, 0, 0.15)' : '1px solid rgba(244, 63, 94, 0.1)', borderRadius: '16px', padding: '10px 12px', opacity: d.paid ? 0.6 : 1 }}>
                    <div>
                      <strong style={{ fontSize: '0.8rem', color: '#fff', textDecoration: d.paid ? 'line-through' : 'none' }}>{d.name}</strong>
                      <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                        Rp {d.amount.toLocaleString('id-ID')} • Jatuh tempo: {d.dueDate}
                      </div>
                    </div>
                    
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                      {d.paid ? (
                        <span style={{ fontSize: '0.65rem', color: 'var(--accent-volt)', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '2px' }}><Check size={10} /> LUNAS</span>
                      ) : (
                        <button onClick={() => handlePayDebt(d.id)} className="primary-btn" style={{ padding: '3px 8px', fontSize: '0.6rem', background: 'var(--accent-coral)', color: '#fff' }}>Bayar</button>
                      )}
                      <button onClick={() => handleDeleteDebt(d.id)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><Trash2 size={11} /></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

        {activeTab === 'monthly_cal' && (
          <div className="glass-panel volt-card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>Overview Pengeluaran Bulanan</span>
              <select className="select-input" value={currentYearMonth} onChange={(e) => setCurrentYearMonth(e.target.value)} style={{ padding: '2px 8px', fontSize: '0.72rem' }}>
                <option value="2026-03">Maret 2026</option>
                <option value="2026-04">April 2026</option>
                <option value="2026-05">Mei 2026</option>
              </select>
            </div>

            {/* Grid calendar */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.35rem', textAlign: 'center' }}>
              {['S', 'S', 'R', 'K', 'J', 'S', 'M'].map((day, idx) => (
                <span key={idx} style={{ fontSize: '0.65rem', fontWeight: 'bold', color: 'var(--text-muted)' }}>{day}</span>
              ))}
              
              {/* Padding for first day of week */}
              {(() => {
                const firstDay = daysInMonth[0];
                if (!firstDay) return null;
                const offset = (firstDay.getDay() + 6) % 7; // Align to Monday start
                return Array.from({ length: offset }).map((_, idx) => (
                  <div key={`offset-${idx}`} />
                ));
              })()}

              {daysInMonth.map((dayObj, idx) => {
                const dayNum = dayObj.getDate();
                const year = dayObj.getFullYear();
                const month = (dayObj.getMonth() + 1).toString().padStart(2, '0');
                const dateStr = `${year}-${month}-${dayNum.toString().padStart(2, '0')}`;
                
                // Calculate total expense on this date
                const dateFinances = finances ? finances.filter(f => f.date === dateStr && f.type === 'expense') : [];
                const dailyTotal = dateFinances.reduce((sum, f) => sum + f.amount, 0);
                
                // Find in history too in case transactions aren't logged fully
                const histDay = history ? history.find(h => h.date === dateStr) : null;
                const finalDailyTotal = dailyTotal > 0 ? dailyTotal : (histDay ? histDay.expense : 0);

                const isLimitExceeded = finalDailyTotal > currentSpendCap;

                return (
                  <div key={idx} style={{ 
                    background: 'rgba(255,255,255,0.01)', 
                    border: '1px solid var(--card-border-inner)', 
                    borderRadius: '8px', 
                    padding: '6px 2px', 
                    display: 'flex', 
                    flexDirection: 'column', 
                    justifyContent: 'space-between',
                    minHeight: '44px',
                    position: 'relative'
                  }}>
                    <span style={{ fontSize: '0.7rem', fontWeight: 'bold', color: '#fff' }}>{dayNum}</span>
                    {finalDailyTotal > 0 && (
                      <span style={{ 
                        fontSize: '0.52rem', 
                        fontWeight: '900', 
                        color: isLimitExceeded ? 'var(--accent-coral)' : 'var(--accent-volt)',
                        lineHeight: 1
                      }}>
                        {finalDailyTotal >= 1000 ? `${Math.round(finalDailyTotal / 1000)}k` : finalDailyTotal}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === 'ai_advice' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            
            {/* Trigger Advice button */}
            <button 
              onClick={triggerAiAdvice} 
              disabled={isLoadingAdvice}
              className="primary-btn" 
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: 'linear-gradient(135deg, var(--accent-purple), var(--accent-cyan))', color: '#fff' }}
            >
              <Sparkles size={16} />
              {isLoadingAdvice ? 'AI sedang merancang rencana keuangan...' : 'Minta Rekomendasi AI Financial 🧠'}
            </button>

            {aiAdviceData && (
              <>
                {/* AI Recommendation Explanation */}
                <div className="glass-panel volt-card" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', padding: '1.25rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Sparkles size={14} color="var(--accent-purple)" />
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-primary)', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em' }}>AI Plan Rekomendasi</span>
                  </div>
                  <div 
                    style={{ fontSize: '0.75rem', lineHeight: '1.5', color: 'var(--text-secondary)' }}
                    dangerouslySetInnerHTML={{ __html: formatMarkdown(aiAdviceData.recommendation) }}
                  />
                </div>

                {/* AI Financial Coaching Tips */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <span style={{ fontWeight: 'bold', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Action Tips Keuangan:</span>
                  {(aiAdviceData.coachingTips || []).map((tip, idx) => (
                    <div 
                      key={idx} 
                      style={{ 
                        background: 'var(--bg-pill)', 
                        borderLeft: '4px solid var(--accent-purple)', 
                        padding: '0.65rem 0.85rem', 
                        borderRadius: '12px', 
                        fontSize: '0.72rem', 
                        color: 'var(--text-primary)',
                        fontWeight: '600'
                      }}
                    >
                      {tip}
                    </div>
                  ))}
                </div>
              </>
            )}

            {!aiAdviceData && !isLoadingAdvice && (
              <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.75rem', margin: '20px 0' }}>
                Klik tombol di atas untuk menganalisis aset, tabungan, limit harian, dan hutang Anda demi saran perencanaan terbaik. 🚀
              </p>
            )}

          </div>
        )}

      </div>
    </div>
  );
}
