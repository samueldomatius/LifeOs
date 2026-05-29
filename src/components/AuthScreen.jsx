import React, { useState } from 'react';
import { Compass, Mail, Lock, User, Eye, EyeOff, Sparkles, Sun, Moon } from 'lucide-react';

export default function AuthScreen({ setUserId, setUserEmail, theme, toggleTheme }) {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    const payload = isRegister ? { email, password, name } : { email, password };
    const endpoint = isRegister ? '/api/auth/register' : '/api/auth/login';

    try {
      const response = await fetch(`http://localhost:5000${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Terjadi kesalahan sistem.');
      }

      // Success
      localStorage.setItem('lifeos_user_id', data.userId);
      localStorage.setItem('lifeos_user_email', data.email);
      setUserId(data.userId);
      setUserEmail(data.email);
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', width: '100%', height: '100%', justifyContent: 'center' }}>
      
      {/* Theme toggle & logo header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div className="pulsing-glow-dot" style={{ width: '12px', height: '12px', background: 'var(--accent-volt)', borderRadius: '50%' }} />
          <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.1em' }}>LIFEOS CORE</span>
        </div>
        <button 
          onClick={toggleTheme} 
          style={{
            border: 'none',
            background: 'var(--bg-pill)',
            color: 'var(--text-primary)',
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            border: '1px solid var(--card-border-inner)'
          }}
          title="Ganti Tema"
        >
          {theme === 'dark-theme' ? <Sun size={15} /> : <Moon size={15} />}
        </button>
      </div>

      <div style={{ textAlign: 'center', margin: '0.5rem 0' }}>
        <h1 style={{ fontSize: '2rem', fontFamily: 'Outfit', fontWeight: 900, background: 'linear-gradient(135deg, #fff, var(--text-muted))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', margin: '0 0 4px 0' }}>
          Selamat Datang 🌌
        </h1>
        <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: 0 }}>
          Kelola agenda, keuangan, & habit dalam satu lembaran cerdas.
        </p>
      </div>

      {/* Auth Card */}
      <div className="glass-panel volt-card" style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '1rem', border: '1px solid rgba(255,255,255,0.08)' }}>
        
        {/* Tabs */}
        <div style={{ display: 'flex', background: 'var(--bg-pill)', borderRadius: '12px', padding: '4px' }}>
          <button 
            type="button"
            onClick={() => { setIsRegister(false); setErrorMsg(''); }}
            style={{
              flex: 1,
              padding: '8px',
              fontSize: '0.75rem',
              fontWeight: 'bold',
              border: 'none',
              borderRadius: '9px',
              background: !isRegister ? 'var(--card-bg-solid)' : 'transparent',
              color: !isRegister ? 'var(--text-primary)' : 'var(--text-secondary)',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            Masuk
          </button>
          <button 
            type="button"
            onClick={() => { setIsRegister(true); setErrorMsg(''); }}
            style={{
              flex: 1,
              padding: '8px',
              fontSize: '0.75rem',
              fontWeight: 'bold',
              border: 'none',
              borderRadius: '9px',
              background: isRegister ? 'var(--card-bg-solid)' : 'transparent',
              color: isRegister ? 'var(--text-primary)' : 'var(--text-secondary)',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            Daftar Akun
          </button>
        </div>

        {errorMsg && (
          <div style={{
            background: 'rgba(255, 71, 126, 0.1)',
            border: '1px solid var(--accent-coral)',
            borderRadius: '10px',
            padding: '8px 12px',
            color: 'var(--accent-coral)',
            fontSize: '0.72rem',
            fontWeight: 600,
            animation: 'shake 0.3s ease'
          }}>
            ⚠️ {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {isRegister && (
            <div style={{ position: 'relative' }}>
              <User size={14} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
              <input 
                type="text" 
                placeholder="Nama Lengkap" 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                required 
                className="task-input" 
                style={{ paddingLeft: '36px', width: '100%', fontSize: '0.78rem' }}
              />
            </div>
          )}

          <div style={{ position: 'relative' }}>
            <Mail size={14} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
            <input 
              type="email" 
              placeholder="Alamat Email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              required 
              className="task-input" 
              style={{ paddingLeft: '36px', width: '100%', fontSize: '0.78rem' }}
            />
          </div>

          <div style={{ position: 'relative' }}>
            <Lock size={14} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
            <input 
              type={showPassword ? "text" : "password"} 
              placeholder="Kata Sandi" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              required 
              className="task-input" 
              style={{ paddingLeft: '36px', paddingRight: '36px', width: '100%', fontSize: '0.78rem' }}
            />
            <button 
              type="button" 
              onClick={() => setShowPassword(!showPassword)}
              style={{
                position: 'absolute',
                right: '12px',
                top: '11px',
                border: 'none',
                background: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                padding: 0
              }}
            >
              {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="primary-btn" 
            style={{
              padding: '10px',
              fontSize: '0.8rem',
              fontWeight: 'bold',
              background: 'var(--accent-volt)',
              color: '#000',
              borderRadius: '12px',
              marginTop: '0.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
          >
            {loading ? 'Memproses...' : (
              <>
                <Sparkles size={13} />
                {isRegister ? 'Daftar Sekarang' : 'Masuk Aplikasi'}
              </>
            )}
          </button>
        </form>

        <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textAlign: 'center', margin: 0, lineHeight: 1.4 }}>
          Dengan masuk, data Anda akan tersimpan aman dan terintegrasi di Supabase.
        </p>
      </div>
    </div>
  );
}
