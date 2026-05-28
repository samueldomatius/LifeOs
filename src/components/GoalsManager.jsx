import React, { useState } from 'react';
import { Target, Plus, Trash2, X } from 'lucide-react';

export default function GoalsManager({ 
  goals, 
  onAddGoal, 
  onDeleteGoal, 
  currentDay, 
  filteredTasks, 
  filteredFinances,
  assets 
}) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [name, setName] = useState('');
  const [type, setType] = useState('spend_cap');
  const [target, setTarget] = useState('');

  const totalAssetsVal = assets ? assets.reduce((sum, a) => sum + a.balance, 0) : 0;
  const todayExpenseVal = filteredFinances ? filteredFinances.filter(f => f.type === 'expense').reduce((sum, f) => sum + f.amount, 0) : 0;
  const completedTasksVal = filteredTasks ? filteredTasks.filter(t => t.status === 'completed').length : 0;

  const handleAddSubmit = (e) => {
    e.preventDefault();
    if (!name.trim() || !target) return;
    const targetNum = parseFloat(target);
    if (isNaN(targetNum) || targetNum <= 0) return;

    onAddGoal(name.trim(), type, targetNum);
    setName('');
    setTarget('');
    setShowAddForm(false);
  };

  const getProgressDetails = (goal) => {
    let current = 0;
    let percent = 0;
    let unit = '';
    let statusText = 'In Progress';
    let isAcheived = false;
    let isCapExceeded = false;

    if (goal.type === 'spend_cap') {
      current = todayExpenseVal;
      unit = 'Rp';
      isCapExceeded = current > goal.targetValue;
      percent = Math.min(100, (current / goal.targetValue) * 100);
      statusText = isCapExceeded ? '🔥 Limit Jebol!' : `Aman (Limit: Rp ${goal.targetValue.toLocaleString('id-ID')})`;
      isAcheived = !isCapExceeded && current > 0;
    } else if (goal.type === 'steps') {
      current = currentDay ? currentDay.steps : 0;
      unit = 'Langkah';
      percent = Math.min(100, (current / goal.targetValue) * 100);
      isAcheived = current >= goal.targetValue;
      statusText = isAcheived ? '🎉 Target Tercapai!' : `${current} / ${goal.targetValue} Langkah`;
    } else if (goal.type === 'sleep') {
      current = currentDay ? currentDay.sleepHours : 0;
      unit = 'Jam';
      percent = Math.min(100, (current / goal.targetValue) * 100);
      isAcheived = current >= goal.targetValue;
      statusText = isAcheived ? '💤 Tidur Nyenyak!' : `${current} / ${goal.targetValue} Jam`;
    } else if (goal.type === 'tasks') {
      current = completedTasksVal;
      unit = 'Tugas';
      percent = Math.min(100, (current / goal.targetValue) * 100);
      isAcheived = current >= goal.targetValue;
      statusText = isAcheived ? '⚡ Produktivitas Gila!' : `${current} / ${goal.targetValue} Tugas Selesai`;
    } else if (goal.type === 'savings') {
      current = totalAssetsVal;
      unit = 'Rp';
      percent = Math.min(100, (current / goal.targetValue) * 100);
      isAcheived = current >= goal.targetValue;
      statusText = isAcheived ? '💰 Kaya Raya!' : `Terkumpul: Rp ${current.toLocaleString('id-ID')} / Rp ${goal.targetValue.toLocaleString('id-ID')}`;
    }

    return { current, percent, unit, statusText, isAcheived, isCapExceeded };
  };

  return (
    <div className="subpanel-overlay">
      <div className="subpanel-header">
        <span className="subpanel-title">🎯 Goals & Resolusi Harian</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', overflowY: 'auto', flex: 1 }}>
        
        {/* Header Summary */}
        <div style={{ background: 'var(--bg-pill)', padding: '0.65rem 1rem', borderRadius: '16px', fontSize: '0.8rem', fontWeight: 700 }}>
          🚀 Selesaikan target harian untuk mempertahankan performa LQS dan memperpanjang Streak!
        </div>

        {/* Add Goal Form Button */}
        {!showAddForm && (
          <button 
            onClick={() => setShowAddForm(true)} 
            className="primary-btn"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', background: 'var(--bg-pill)', color: 'var(--text-primary)', border: '1px solid var(--card-border-inner)', borderRadius: '14px', padding: '0.65rem' }}
          >
            <Plus size={16} /> Buat Target / Resolusi Baru
          </button>
        )}

        {/* Add Goal Form */}
        {showAddForm && (
          <form onSubmit={handleAddSubmit} className="glass-panel volt-card" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', padding: '1rem' }}>
            <div style={{ display: 'flex', justify: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 'bold' }}>Buat Target Baru</span>
              <button type="button" onClick={() => setShowAddForm(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={14} /></button>
            </div>
            <input 
              type="text" 
              placeholder="Nama Target (e.g. Hemat Kopi, Workout Rutin)" 
              className="task-input" 
              value={name} 
              onChange={(e) => setName(e.target.value)}
              required
            />
            <div style={{ display: 'flex', gap: '4px' }}>
              <select 
                className="select-input"
                value={type} 
                onChange={(e) => setType(e.target.value)}
                style={{ flex: 1 }}
              >
                <option value="spend_cap">💳 Limit Belanja Harian</option>
                <option value="steps">🏃 Target Langkah Kaki</option>
                <option value="sleep">🌙 Jam Tidur Minimal</option>
                <option value="tasks">⚡ Jumlah Tugas Selesai</option>
                <option value="savings">💰 Target Tabungan Aset</option>
              </select>
              
              <input 
                type="number" 
                placeholder="Jumlah Target" 
                className="task-input" 
                value={target} 
                onChange={(e) => setTarget(e.target.value)}
                style={{ flex: 1 }}
                required
              />
            </div>
            <button type="submit" className="primary-btn">Simpan Resolusi</button>
          </form>
        )}

        {/* Goals List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {goals.map(g => {
            const { percent, statusText, isAcheived, isCapExceeded } = getProgressDetails(g);
            
            // Set goal card accent colors based on completion or failure
            let barColor = 'var(--accent-volt)';
            let cardBorderColor = 'var(--card-border)';
            if (isCapExceeded) {
              barColor = 'var(--accent-coral)';
              cardBorderColor = 'rgba(255, 71, 126, 0.2)';
            } else if (isAcheived) {
              barColor = 'var(--accent-volt-dark)';
              cardBorderColor = 'rgba(187, 238, 0, 0.2)';
            }

            return (
              <div key={g.id} className="glass-panel volt-card" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '8px', borderColor: cardBorderColor }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Target size={14} color={isCapExceeded ? 'var(--accent-coral)' : 'var(--accent-volt-dark)'} />
                    <span style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>{g.name}</span>
                  </div>
                  <button 
                    onClick={() => onDeleteGoal(g.id)} 
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--accent-coral)', padding: '2px' }}
                    title="Hapus"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: 'var(--text-secondary)' }}>
                  <span>{statusText}</span>
                  <span style={{ fontWeight: 'bold' }}>{percent}%</span>
                </div>

                {/* Progress bar */}
                <div style={{ height: '8px', background: 'var(--bg-pill)', borderRadius: '99px', overflow: 'hidden', position: 'relative', marginTop: '2px' }}>
                  <div style={{ 
                    height: '100%', 
                    background: barColor, 
                    width: `${percent}%`, 
                    borderRadius: '99px', 
                    transition: 'width 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
                    position: 'relative'
                  }}>
                    {/* Glowing white cap orb at the end of active bars */}
                    {percent > 0 && (
                      <div style={{
                        position: 'absolute',
                        right: '0',
                        top: '50%',
                        transform: 'translate(50%, -50%)',
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        background: '#fff',
                        boxShadow: '0 0 8px #fff'
                      }} />
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {goals.length === 0 && (
            <p style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
              Belum ada target dibuat. Ayo bikin satu resolusi hari ini!
            </p>
          )}
        </div>

      </div>
    </div>
  );
}
