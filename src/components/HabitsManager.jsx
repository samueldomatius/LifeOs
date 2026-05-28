import React from 'react';

export default function HabitsManager({ currentDay, setCurrentDay, selectedDate, formatDateHeader }) {
  return (
    <div className="subpanel-overlay">
      <div className="subpanel-header">
        <span className="subpanel-title">🩺 Habit Sliders & Moods</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', overflowY: 'auto', flex: 1 }}>
        
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

        {/* Steps sliders */}
        <div className="glass-panel volt-card">
          <span style={{ fontWeight: 'bold', fontSize: '0.85rem', display: 'block', marginBottom: '0.5rem' }}>🏃 Target Langkah & Cardio</span>
          <div className="range-slider-group" style={{ marginBottom: '0.75rem' }}>
            <div className="slider-label-row">
              <span>Langkah Kaki</span>
              <span style={{ fontWeight: 'bold' }}>{currentDay.steps} Steps</span>
            </div>
            <input 
              type="range" 
              min="1000" 
              max="15000" 
              step="500" 
              className="custom-range-slider"
              value={currentDay.steps}
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
