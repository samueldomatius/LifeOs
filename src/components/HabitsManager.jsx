import React from 'react';

export default function HabitsManager({ 
  currentDay, 
  setCurrentDay, 
  selectedDate, 
  formatDateHeader,
  startGpsTracking,
  stopGpsTracking,
  gpsSeconds,
  gpsDistance,
  isTrackingGps
}) {
  const steps = currentDay.steps || 0;
  const distanceKm = (steps * 0.00075).toFixed(2);
  const caloriesBurned = Math.round(steps * 0.04);

  return (
    <div className="subpanel-overlay">
      <div className="subpanel-header">
        <span className="subpanel-title">🩺 Habit Sliders & Moods</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', overflowY: 'auto', flex: 1 }}>
        
        {/* Strava interactive tracker */}
        <div className="glass-panel volt-card" style={{ borderColor: 'rgba(252, 76, 2, 0.4)', background: 'linear-gradient(135deg, rgba(252, 76, 2, 0.05), rgba(0, 0, 0, 0.3))' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <span style={{ fontWeight: 'bold', fontSize: '0.85rem', color: '#fc4c02', display: 'flex', alignItems: 'center', gap: '6px' }}>
              🏃 STRAVA INTERACTIVE TRACKER
            </span>
            {isTrackingGps && (
              <span className="animate-pulse" style={{ color: '#fc4c02', fontSize: '0.65rem', fontWeight: 'bold' }}>
                🔴 LIVE TRACKING
              </span>
            )}
          </div>

          {/* GPS Live Tracking Mode */}
          {isTrackingGps ? (
            <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: '12px', padding: '12px', textAlign: 'center', marginBottom: '0.75rem', border: '1px solid rgba(252, 76, 2, 0.3)' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#fff' }}>{gpsDistance.toFixed(2)} km</div>
              <div style={{ fontSize: '0.75rem', color: '#fc4c02', margin: '4px 0' }}>⏱️ {Math.floor(gpsSeconds / 60)}m {gpsSeconds % 60}s</div>
              <button 
                type="button" 
                onClick={stopGpsTracking} 
                style={{ background: '#fc4c02', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '0.7rem', padding: '6px 12px', fontWeight: 'bold', cursor: 'pointer', marginTop: '6px' }}
              >
                ⏹️ Hentikan & Simpan Lari
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: '8px', marginBottom: '0.75rem' }}>
              <button 
                type="button" 
                onClick={startGpsTracking} 
                style={{ flex: 1, background: 'rgba(252, 76, 2, 0.1)', color: '#fc4c02', border: '1px solid #fc4c02', borderRadius: '10px', fontSize: '0.75rem', padding: '8px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
              >
                🏃 Mulai GPS Live Tracking
              </button>
            </div>
          )}

          {/* Quick Metrics display */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '0.75rem', background: 'rgba(255,255,255,0.02)', padding: '10px', borderRadius: '12px' }}>
            <div style={{ textAlign: 'center' }}>
              <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)', display: 'block' }}>EST. JARAK</span>
              <strong style={{ fontSize: '0.9rem', color: '#fff' }}>{distanceKm} km</strong>
            </div>
            <div style={{ textAlign: 'center' }}>
              <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)', display: 'block' }}>KALORI TERBAKAR</span>
              <strong style={{ fontSize: '0.9rem', color: '#fc4c02' }}>🔥 {caloriesBurned} kcal</strong>
            </div>
          </div>

          {/* Sliders for steps and duration */}
          <div className="range-slider-group" style={{ marginBottom: '0.75rem' }}>
            <div className="slider-label-row">
              <span>Langkah Kaki</span>
              <span style={{ fontWeight: 'bold' }}>{steps} Steps</span>
            </div>
            <input 
              type="range" 
              min="1000" 
              max="15000" 
              step="500" 
              className="custom-range-slider"
              value={steps}
              onChange={(e) => setCurrentDay({ ...currentDay, steps: parseInt(e.target.value) })}
            />
          </div>

          <div className="range-slider-group">
            <div className="slider-label-row">
              <span>Durasi Latihan</span>
              <span style={{ fontWeight: 'bold' }}>{currentDay.workoutMinutes} Menit</span>
            </div>
            <input 
              type="range" 
              min="0" 
              max="90" 
              step="5" 
              className="custom-range-slider"
              value={currentDay.workoutMinutes}
              onChange={(e) => setCurrentDay({ ...currentDay, workoutMinutes: parseInt(e.target.value) })}
            />
          </div>
        </div>

        {/* Sleep sliders */}
        <div className="glass-panel volt-card">
          <span style={{ fontWeight: 'bold', fontSize: '0.85rem', display: 'block', marginBottom: '0.5rem' }}>🌙 Tidur Semalam ({formatDateHeader(selectedDate)})</span>
          <div className="range-slider-group">
            <div className="slider-label-row">
              <span>Durasi Tidur</span>
              <span style={{ fontWeight: 'bold' }}>{currentDay.sleepHours} Jam</span>
            </div>
            <input 
              type="range" 
              min="4" 
              max="10" 
              step="0.5" 
              className="custom-range-slider"
              value={currentDay.sleepHours}
              onChange={(e) => setCurrentDay({ ...currentDay, sleepHours: parseFloat(e.target.value) })}
            />
          </div>
        </div>

        {/* Mood Buttons */}
        <div className="glass-panel volt-card">
          <span style={{ fontWeight: 'bold', fontSize: '0.85rem', display: 'block', marginBottom: '0.5rem' }}>🧠 Log Mood Mental</span>
          <div className="mood-selector-buttons">
            {[
              { val: 'good', emoji: '😎', name: 'Chill', color: 'var(--accent-volt-dark)', glow: 'var(--accent-volt-glow)' },
              { val: 'neutral', emoji: '😐', name: 'Flat', color: 'var(--accent-purple)', glow: 'var(--accent-purple-glow)' },
              { val: 'tired', emoji: '😴', name: 'Tired', color: 'var(--accent-orange)', glow: 'var(--accent-orange-glow)' },
              { val: 'anxious', emoji: '😰', name: 'Worry', color: 'var(--accent-cyan)', glow: 'var(--accent-cyan-glow)' },
              { val: 'stressed', emoji: '💥', name: 'Stress', color: 'var(--accent-coral)', glow: 'var(--accent-coral-glow)' }
            ].map(m => (
              <button
                key={m.val}
                type="button"
                className={`mood-select-btn ${currentDay.directMood === m.val ? 'active' : ''}`}
                style={{
                  '--mood-accent': m.color,
                  '--mood-accent-glow': m.glow
                }}
                onClick={() => setCurrentDay({ ...currentDay, directMood: m.val })}
              >
                <span className="mood-emoji">{m.emoji}</span>
                <span className="mood-name">{m.name}</span>
              </button>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
