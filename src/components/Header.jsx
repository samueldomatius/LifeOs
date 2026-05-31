import React from 'react';
import { Brain, Bell, Moon, Sun, Flame } from 'lucide-react';

export default function Header({ 
  theme, 
  toggleTheme, 
  onOpenDiagnosis, 
  onOpenNotifications, 
  streakCount, 
  isStreakActive,
  userProfile,
  onOpenProfile,
  hasUnreadNotifications
}) {
  return (
    <header className="phone-header">
      <div className="header-logo-section">
        <span className="logo-v-icon">L</span>
        <span className="header-title-app">LifeOS.</span>
        <div className={`streak-badge-header ${isStreakActive ? 'active' : ''}`} title={isStreakActive ? "Streak Menyala! 🔥" : "Selesaikan semua tugas hari ini untuk menyalakan streak! ⚡"}>
          <Flame size={14} className="streak-flame-icon" />
          <span className="streak-count-text">{streakCount}</span>
        </div>
      </div>
      
      <div className="header-utilities">
        <button 
          className="circular-utility-btn" 
          title="Diagnosis AI LQS"
          onClick={onOpenDiagnosis}
        >
          <Brain size={16} />
        </button>
        
        <button 
          className="circular-utility-btn" 
          title="Notifikasi"
          onClick={onOpenNotifications}
          style={{ position: 'relative' }}
        >
          <Bell size={16} />
          {hasUnreadNotifications && (
            <span style={{
              position: 'absolute',
              top: '4px',
              right: '4px',
              width: '8px',
              height: '8px',
              background: 'var(--accent-coral)',
              borderRadius: '50%',
              boxShadow: '0 0 6px var(--accent-coral)',
              border: '1.5px solid var(--card-bg-solid)'
            }} />
          )}
        </button>
        
        <button 
          className="circular-utility-btn" 
          title="Ganti Tema"
          onClick={toggleTheme}
        >
          {theme === 'light-theme' ? <Moon size={16} /> : <Sun size={16} />}
        </button>
      </div>
    </header>
  );
}
