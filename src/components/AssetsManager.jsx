import React, { useState } from 'react';
import { CreditCard, Plus, Trash2, X, Edit2 } from 'lucide-react';

export default function AssetsManager({ 
  assets, 
  onAddAsset, 
  onUpdateAssetBalance, 
  onDeleteAsset,
  finances 
}) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newBalance, setNewBalance] = useState('');
  
  const [editingAssetId, setEditingAssetId] = useState(null);
  const [editBalance, setEditBalance] = useState('');

  const totalAssets = assets.reduce((sum, a) => sum + (a.balance || 0), 0);

  const handleAddSubmit = (e) => {
    e.preventDefault();
    if (!newName.trim() || !newBalance) return;
    const balanceNum = parseFloat(newBalance);
    if (isNaN(balanceNum)) return;

    onAddAsset(newName.trim(), balanceNum);
    setNewName('');
    setNewBalance('');
    setShowAddForm(false);
  };

  const handleEditSubmit = (e, id) => {
    e.preventDefault();
    const balanceNum = parseFloat(editBalance);
    if (isNaN(balanceNum)) return;
    onUpdateAssetBalance(id, balanceNum);
    setEditingAssetId(null);
    setEditBalance('');
  };

  return (
    <div className="subpanel-overlay">
      <div className="subpanel-header">
        <span className="subpanel-title">💳 Aset & Wallet Ledger</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', overflowY: 'auto', flex: 1 }}>
        
        {/* Balance card */}
        <div className="glass-panel volt-card" style={{ background: '#120e24', border: '1px solid rgba(255, 255, 255, 0.08)', color: '#fff', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <span style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.6)', fontWeight: 'bold', textTransform: 'uppercase' }}>Total Kekayaan Bersih</span>
          <h2 style={{ color: '#fff', fontSize: '1.6rem' }}>Rp {totalAssets.toLocaleString('id-ID')}</h2>
          <span style={{ fontSize: '0.6rem', color: 'var(--accent-volt)', marginTop: '4px' }}>Tersinkronisasi otomatis dengan transaksi keuangan Anda.</span>
        </div>

        {/* Add Asset Form trigger */}
        {!showAddForm && (
          <button 
            onClick={() => setShowAddForm(true)} 
            className="primary-btn"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', background: 'var(--bg-pill)', color: 'var(--text-primary)', border: '1px solid var(--card-border-inner)', borderRadius: '14px', padding: '0.65rem' }}
          >
            <Plus size={16} /> Tambah Akun / Dompet Baru
          </button>
        )}

        {/* Add Asset Form */}
        {showAddForm && (
          <form onSubmit={handleAddSubmit} className="glass-panel volt-card" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', padding: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 'bold' }}>Tambah Akun Baru</span>
              <button type="button" onClick={() => setShowAddForm(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={14} /></button>
            </div>
            <input 
              type="text" 
              placeholder="Nama Akun (e.g. GoPay, Bank Mandiri)" 
              className="task-input" 
              value={newName} 
              onChange={(e) => setNewName(e.target.value)}
              required
            />
            <input 
              type="number" 
              placeholder="Saldo Awal (Rp)" 
              className="task-input" 
              value={newBalance} 
              onChange={(e) => setNewBalance(e.target.value)}
              required
            />
            <button type="submit" className="primary-btn">Simpan Dompet</button>
          </form>
        )}

        {/* Assets Grid List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {assets.map(a => {
            const isEditing = editingAssetId === a.id;
            
            // Filter latest 3 transactions for this asset
            const assetTxns = finances.filter(f => f.assetId === a.id).slice(0, 3);

            return (
              <div key={a.id} className="glass-panel volt-card" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ background: 'var(--bg-pill)', width: '32px', height: '32px', borderRadius: '10px', display: 'flex', alignItems: 'center', justify: 'center' }}>
                      <CreditCard size={14} color="var(--accent-purple)" />
                    </div>
                    <span style={{ fontWeight: 'bold', fontSize: '0.85rem' }}>{a.name}</span>
                  </div>
                  
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button 
                      onClick={() => {
                        setEditingAssetId(a.id);
                        setEditBalance(a.balance.toString());
                      }} 
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '4px' }}
                      title="Edit Saldo"
                    >
                      <Edit2 size={12} />
                    </button>
                    {assets.length > 1 && (
                      <button 
                        onClick={() => {
                          if (confirm(`Apakah Anda yakin ingin menghapus akun "${a.name}"?`)) {
                            onDeleteAsset(a.id);
                          }
                        }} 
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--accent-coral)', padding: '4px' }}
                        title="Hapus"
                      >
                        <Trash2 size={12} />
                      </button>
                    )}
                  </div>
                </div>

                {isEditing ? (
                  <form onSubmit={(e) => handleEditSubmit(e, a.id)} style={{ display: 'flex', gap: '6px', marginTop: '4px' }}>
                    <input 
                      type="number" 
                      className="task-input" 
                      value={editBalance} 
                      onChange={(e) => setEditBalance(e.target.value)} 
                      style={{ flex: 1, padding: '4px 8px', height: '32px' }}
                      autoFocus
                    />
                    <button type="submit" className="primary-btn" style={{ padding: '4px 10px', borderRadius: '8px', fontSize: '0.7rem' }}>Simpan</button>
                    <button type="button" onClick={() => setEditingAssetId(null)} className="primary-btn" style={{ padding: '4px 10px', borderRadius: '8px', fontSize: '0.7rem', background: 'var(--bg-pill)', color: 'var(--text-primary)' }}>Batal</button>
                  </form>
                ) : (
                  <h3 style={{ fontSize: '1.25rem', fontFamily: 'Outfit', fontWeight: '800' }}>
                    Rp {a.balance.toLocaleString('id-ID')}
                  </h3>
                )}

                {/* Subledger: recent transactions for this wallet */}
                {assetTxns.length > 0 && (
                  <div style={{ borderTop: '1px solid var(--card-border-inner)', paddingTop: '6px', marginTop: '2px' }}>
                    <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>TRANSAKSI TERAKHIR DOMPET</span>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      {assetTxns.map(t => (
                        <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem' }}>
                          <span style={{ color: 'var(--text-secondary)' }}>{t.description}</span>
                          <span style={{ fontWeight: 'bold', color: t.type === 'income' ? 'var(--accent-volt-dark)' : 'var(--accent-coral)' }}>
                            {t.type === 'income' ? '+' : '-'}Rp {t.amount.toLocaleString('id-ID')}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
}
