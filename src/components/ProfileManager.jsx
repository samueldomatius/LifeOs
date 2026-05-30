import React, { useState } from 'react';
import { User, Flame, Award, AlertCircle, Calendar, Edit3, Save, Check } from 'lucide-react';

export default function ProfileManager({ 
  userProfile, 
  onUpdateProfile, 
  tasks, 
  streakCount, 
  isStreakActive, 
  selectedDate,
  onUpdateTask,
  onDeleteTask,
  onResetAllData,
  onLogout,
  userId
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(userProfile.name);
  const [editAvatar, setEditAvatar] = useState(userProfile.avatar || '');
  const [editBio, setEditBio] = useState(userProfile.bio || '');
  const [editCustomKey, setEditCustomKey] = useState(() => {
    try {
      return localStorage.getItem('lifeos_custom_gemini_key') || '';
    } catch (e) {
      return '';
    }
  });

  // Calculate statistics
  const todayTasks = tasks.filter(t => t.dueDate === selectedDate);
  const todayCompleted = todayTasks.filter(t => t.status === 'completed');
  const todayScore = todayTasks.length > 0 ? Math.round((todayCompleted.length / todayTasks.length) * 100) : 0;

  // Overdue/missed tasks: due date before selectedDate, status not completed
  const missedTasks = tasks.filter(t => t.dueDate < selectedDate && t.status !== 'completed');

  // Total completed tasks historically
  const totalCompleted = tasks.filter(t => t.status === 'completed').length;

  const handleSave = (e) => {
    e.preventDefault();
    onUpdateProfile({
      ...userProfile,
      name: editName.trim(),
      avatar: editAvatar.trim(),
      bio: editBio.trim()
    });
    try {
      localStorage.setItem('lifeos_custom_gemini_key', editCustomKey.trim());
    } catch (e) {}
    setIsEditing(false);
  };

  // Badge generation logic based on streaks & completed tasks
  const badges = [
    { id: 'streak_3', name: '🔥 3 Hari Konsisten', desc: 'Selesaikan semua tugas 3 hari berturut-turut', unlocked: streakCount >= 3 },
    { id: 'streak_7', name: '⚡ 7 Hari Konsisten', desc: 'Selesaikan semua tugas 7 hari berturut-turut', unlocked: streakCount >= 7 },
    { id: 'streak_30', name: '👑 30 Hari God-Mode', desc: 'Selesaikan semua tugas 30 hari berturut-turut', unlocked: streakCount >= 30 },
    { id: 'tasks_10', name: '🎯 Task Ninja', desc: 'Menyelesaikan 10 tugas secara historis', unlocked: totalCompleted >= 10 },
    { id: 'tasks_50', name: '🏆 Produktivitas Dewa', desc: 'Menyelesaikan 50 tugas secara historis', unlocked: totalCompleted >= 50 },
    { id: 'finance_saver', name: '💵 Budget Master', desc: 'Mempunyai saldo BCA di atas Rp 1 Juta', unlocked: true } // Mock or based on asset check
  ];

  return (
    <div className="subpanel-overlay">
      <div className="subpanel-header">
        <span className="subpanel-title">👤 Profil & Pencapaian Anda</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', overflowY: 'auto', flex: 1, paddingBottom: '20px' }}>
        
        {/* Profile Card Info */}
        <div className="glass-panel volt-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center', textAlign: 'center', padding: '1.5rem 1.25rem' }}>
          {isEditing ? (
            <form onSubmit={handleSave} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              <div style={{ textAlign: 'left' }}>
                <label style={{ fontSize: '0.65rem', fontWeight: 'bold', color: 'var(--text-muted)', display: 'block' }}>UNGGAH FOTO PROFIL</label>
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        const img = new Image();
                        img.src = reader.result;
                        img.onload = () => {
                          const canvas = document.createElement('canvas');
                          const ctx = canvas.getContext('2d');
                          canvas.width = 150;
                          canvas.height = 150;
                          ctx.drawImage(img, 0, 0, 150, 150);
                          const compressedBase64 = canvas.toDataURL('image/jpeg', 0.8);
                          setEditAvatar(compressedBase64);
                        };
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                  style={{ fontSize: '0.75rem', marginTop: '4px', width: '100%', color: 'var(--text-secondary)' }}
                />
                <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', marginTop: '4px' }}>Atau masukkan URL gambar di bawah:</div>
                <input 
                  type="text" 
                  className="task-input" 
                  placeholder="https://..."
                  value={(editAvatar && typeof editAvatar === 'string' && editAvatar.startsWith('data:image/')) ? '' : (editAvatar || '')} 
                  onChange={(e) => setEditAvatar(e.target.value)} 
                  style={{ width: '100%', fontSize: '0.75rem', padding: '5px 10px', marginTop: '2px' }}
                />
              </div>
              <div style={{ textAlign: 'left' }}>
                <label style={{ fontSize: '0.65rem', fontWeight: 'bold', color: 'var(--text-muted)' }}>NAMA USER</label>
                <input 
                  type="text" 
                  className="task-input" 
                  value={editName} 
                  onChange={(e) => setEditName(e.target.value)} 
                  required 
                  style={{ width: '100%', fontSize: '0.8rem', padding: '6px 10px', marginTop: '3px' }}
                />
              </div>
              <div style={{ textAlign: 'left' }}>
                <label style={{ fontSize: '0.65rem', fontWeight: 'bold', color: 'var(--text-muted)' }}>BIO / MANTRA</label>
                <input 
                  type="text" 
                  className="task-input" 
                  value={editBio} 
                  onChange={(e) => setEditBio(e.target.value)} 
                  style={{ width: '100%', fontSize: '0.8rem', padding: '6px 10px', marginTop: '3px' }}
                />
              </div>
              <div style={{ textAlign: 'left' }}>
                <label style={{ fontSize: '0.65rem', fontWeight: 'bold', color: 'var(--text-muted)' }}>KUNCI API GEMINI KUSTOM (OPSIONAL)</label>
                <input 
                  type="password" 
                  className="task-input" 
                  placeholder="AIzaSy..."
                  value={editCustomKey} 
                  onChange={(e) => setEditCustomKey(e.target.value)} 
                  style={{ width: '100%', fontSize: '0.8rem', padding: '6px 10px', marginTop: '3px' }}
                />
                <div style={{ fontSize: '0.55rem', color: 'var(--text-muted)', marginTop: '4px' }}>Jika kunci bawaan error/habis, masukkan kunci API Gemini gratis Anda sendiri di sini untuk pemulihan instan!</div>
              </div>
              <button type="submit" className="primary-btn" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', width: '100%', marginTop: '6px' }}>
                <Save size={14} /> Simpan Perubahan
              </button>
            </form>
          ) : (
            <>
              <div style={{ position: 'relative' }}>
                <img 
                  src={userProfile.avatar} 
                  alt="Avatar" 
                  style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover', border: '3px solid var(--accent-volt)', boxShadow: '0 8px 24px rgba(187,238,0,0.2)' }}
                />
                <button 
                  onClick={() => setIsEditing(true)}
                  style={{ position: 'absolute', bottom: '-4px', right: '-4px', background: 'var(--text-primary)', color: 'var(--bg-main)', border: 'none', width: '24px', height: '24px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                >
                  <Edit3 size={11} />
                </button>
              </div>
              
              <div style={{ marginTop: '4px' }}>
                <h2 style={{ fontSize: '1.35rem', fontWeight: '900', color: 'var(--text-primary)' }}>{userProfile.name}</h2>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: '4px 0 2px 0', fontStyle: 'italic' }}>
                  {userProfile.bio || 'Living life on autopilot ✨'}
                </p>
                <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.03)', padding: '2px 8px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)', display: 'inline-block', marginTop: '6px', cursor: 'text' }}>
                  ID Akun: {userId}
                </div>
              </div>
              <button 
                type="button"
                onClick={onResetAllData}
                className="primary-btn"
                style={{ 
                  marginTop: '0.75rem', 
                  background: 'var(--accent-coral)', 
                  color: '#fff', 
                  border: 'none', 
                  borderRadius: '12px', 
                  padding: '8px 16px', 
                  fontSize: '0.75rem',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  width: '100%'
                }}
              >
                ⚠️ Reset Semua Data (Restart Aplikasi)
              </button>
            </>
          )}
        </div>

        {/* Stats Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
          <div className="glass-panel volt-card" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)', fontWeight: 'bold', textTransform: 'uppercase' }}>Streak Hari Ini</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: isStreakActive ? 'var(--accent-coral)' : 'var(--text-muted)' }}>
              <Flame size={18} fill={isStreakActive ? 'var(--accent-coral)' : 'none'} />
              <strong style={{ fontSize: '1.2rem', fontFamily: 'Outfit' }}>{streakCount} Hari</strong>
            </div>
            <span style={{ fontSize: '0.55rem', color: 'var(--text-secondary)' }}>
              {isStreakActive ? 'Streak Aktif! 🔥' : 'Tugas belum beres hari ini'}
            </span>
          </div>

          <div className="glass-panel volt-card" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)', fontWeight: 'bold', textTransform: 'uppercase' }}>Tugas Beres Hari Ini</span>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
              <strong style={{ fontSize: '1.2rem', fontFamily: 'Outfit', color: 'var(--accent-volt-dark)' }}>{todayCompleted.length}/{todayTasks.length}</strong>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>({todayScore}%)</span>
            </div>
            <span style={{ fontSize: '0.55rem', color: 'var(--text-secondary)' }}>Target harian terpenuhi</span>
          </div>
        </div>

        {/* Missed / Overdue Tasks */}
        <div className="glass-panel volt-card" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <AlertCircle size={15} color="var(--accent-coral)" />
            <span style={{ fontSize: '0.75rem', color: 'var(--text-primary)', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em' }}>⚠️ Tugas yang Terlewat ({missedTasks.length})</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {missedTasks.map(t => (
              <div 
                key={t.id} 
                style={{ 
                  background: 'rgba(244, 63, 94, 0.04)', 
                  border: '1px solid rgba(244, 63, 94, 0.15)', 
                  borderRadius: '12px', 
                  padding: '8px 10px', 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center' 
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', overflow: 'hidden' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#fff', textOverflow: 'ellipsis', whiteSpace: 'nowrap', overflow: 'hidden' }}>{t.text}</span>
                  <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>Jatuh tempo: {t.dueDate} {t.time ? `• 🕒 ${t.time}` : ''}</span>
                </div>
                
                <div style={{ display: 'flex', gap: '4px' }}>
                  <button 
                    onClick={() => onUpdateTask(t.id, { dueDate: selectedDate })}
                    className="primary-btn"
                    style={{ padding: '3px 8px', borderRadius: '6px', fontSize: '0.6rem', background: 'var(--accent-volt)', color: '#000', border: 'none' }}
                  >
                    Kerjakan
                  </button>
                  <button 
                    onClick={() => onDeleteTask(t.id)}
                    className="primary-btn"
                    style={{ padding: '3px 8px', borderRadius: '6px', fontSize: '0.6rem', background: 'rgba(255,255,255,0.08)', color: 'var(--accent-coral)', border: 'none' }}
                  >
                    Hapus
                  </button>
                </div>
              </div>
            ))}
            {missedTasks.length === 0 && (
              <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.7rem', margin: '10px 0' }}>
                🎉 Mantap! Tidak ada tugas yang terlewatkan.
              </p>
            )}
          </div>
        </div>

        {/* Achievements / Badges Appreciation */}
        <div className="glass-panel volt-card" style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Award size={15} color="var(--accent-purple)" />
            <span style={{ fontSize: '0.75rem', color: 'var(--text-primary)', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em' }}>🏆 Lencana & Apresiasi</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem' }}>
            {badges.map(b => (
              <div 
                key={b.id} 
                className="badge-item-card"
                style={{ 
                  background: b.unlocked ? 'linear-gradient(135deg, rgba(192, 132, 252, 0.12), rgba(187, 238, 0, 0.05))' : 'rgba(255,255,255,0.01)', 
                  border: b.unlocked ? '1px solid rgba(192, 132, 252, 0.3)' : '1px solid rgba(255,255,255,0.04)', 
                  borderRadius: '16px', 
                  padding: '8px 10px', 
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: '4px',
                  opacity: b.unlocked ? 1 : 0.45
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: b.unlocked ? '#fff' : 'var(--text-muted)' }}>
                    {b.name}
                  </span>
                  {b.unlocked && (
                    <div style={{ background: 'var(--accent-volt)', borderRadius: '50%', width: '12px', height: '12px', display: 'flex', alignItems: 'center', justify: 'center' }}>
                      <Check size={8} color="#000" strokeWidth={4} />
                    </div>
                  )}
                </div>
                <span style={{ fontSize: '0.55rem', color: 'var(--text-secondary)', lineHeight: '1.2' }}>{b.desc}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Logout Button */}
        <button
          type="button"
          onClick={() => {
            if (confirm('Apakah Anda yakin ingin keluar dari akun?')) {
              onLogout();
            }
          }}
          className="primary-btn animate-hover"
          style={{
            marginTop: '0.25rem',
            padding: '10px',
            fontSize: '0.75rem',
            fontWeight: 'bold',
            background: 'rgba(239, 68, 68, 0.08)',
            border: '1px solid var(--accent-coral)',
            color: 'var(--accent-coral)',
            borderRadius: '14px',
            cursor: 'pointer',
            textAlign: 'center',
            width: '100%',
            transition: 'all 0.25s'
          }}
        >
          🚪 Keluar Dari Akun (Logout)
        </button>

      </div>
    </div>
  );
}
