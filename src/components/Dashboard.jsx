import React from 'react';
import { Sparkles } from 'lucide-react';

export default function Dashboard({ finalScore, breakdown, aiExplanation, getGlowColor, getGlowClass }) {
  const radius = 44;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (finalScore / 100) * circumference;

  return (
    <section className="lqs-circular-widget glass-panel volt-card" style={{ boxShadow: `0 15px 45px ${getGlowClass(finalScore)}` }}>
      <div className="section-label-row">
        <span className="section-title-label">Life Quality Score</span>
        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 'bold' }}>REAL-TIME INDEX</span>
      </div>

      <div className="lqs-progress-row">
        
        {/* SVG Circular score */}
        <div className="lqs-circle-svg-wrap">
          <svg className="circle-lqs-svg" viewBox="0 0 100 100">
            <defs>
              <linearGradient id="scoreGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#fff" stopOpacity="0.2" />
                <stop offset="100%" stopColor={getGlowColor(finalScore)} stopOpacity="0.8" />
              </linearGradient>
              <filter id="glow">
                <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>
            <circle className="lqs-bg-circle" cx="50" cy="50" r={radius} />
            <circle 
              className="lqs-bar-circle" 
              cx="50" 
              cy="50" 
              r={radius} 
              stroke={getGlowColor(finalScore)}
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              filter="url(#glow)"
            />
          </svg>
          <div className="lqs-value-overlay">
            <div className="lqs-badge">LQS</div>
            <span className="lqs-num-val">{finalScore}</span>
          </div>
        </div>

        {/* Linear indicators for the 4 dimensions */}
        <div className="lqs-progress-bars-column">
          
          {/* Health */}
          <div className="progress-linear-item" style={{ 
            '--linear-accent': 'var(--accent-purple)', 
            '--linear-accent-start': 'rgba(139, 92, 246, 0.4)',
            '--linear-accent-glow': 'var(--accent-purple-glow)',
            '--badge-bg': 'rgba(139, 92, 246, 0.1)',
            '--progress-pct': `${breakdown.health}%` 
          }}>
            <div className="linear-label-row">
              <span className="linear-indicator-badge">🩺 KESEHATAN</span>
              <span className="linear-status-text">Fisik & Tidur</span>
              <span className="linear-percentage">{breakdown.health}%</span>
            </div>
            <div className="linear-bar-background">
              <div className="linear-bar-fill"></div>
            </div>
          </div>

          {/* Productivity */}
          <div className="progress-linear-item" style={{ 
            '--linear-accent': 'var(--accent-volt-dark)', 
            '--linear-accent-start': 'rgba(122, 162, 0, 0.4)',
            '--linear-accent-glow': 'var(--accent-volt-glow)',
            '--badge-bg': 'rgba(122, 162, 0, 0.1)',
            '--progress-pct': `${breakdown.productivity}%` 
          }}>
            <div className="linear-label-row">
              <span className="linear-indicator-badge">⚡ PRODUKTIVITAS</span>
              <span className="linear-status-text">Fokus Blok</span>
              <span className="linear-percentage">{breakdown.productivity}%</span>
            </div>
            <div className="linear-bar-background">
              <div className="linear-bar-fill"></div>
            </div>
          </div>

          {/* Finance */}
          <div className="progress-linear-item" style={{ 
            '--linear-accent': 'var(--accent-coral)', 
            '--linear-accent-start': 'rgba(255, 71, 126, 0.4)',
            '--linear-accent-glow': 'var(--accent-coral-glow)',
            '--badge-bg': 'rgba(255, 71, 126, 0.1)',
            '--progress-pct': `${breakdown.finance}%` 
          }}>
            <div className="linear-label-row">
              <span className="linear-indicator-badge">💵 FINANSIAL</span>
              <span className="linear-status-text">Budget Cap</span>
              <span className="linear-percentage">{breakdown.finance}%</span>
            </div>
            <div className="linear-bar-background">
              <div className="linear-bar-fill"></div>
            </div>
          </div>

          {/* Mood & Mental */}
          <div className="progress-linear-item" style={{ 
            '--linear-accent': 'var(--accent-cyan)', 
            '--linear-accent-start': 'rgba(34, 211, 238, 0.4)',
            '--linear-accent-glow': 'var(--accent-cyan-glow)',
            '--badge-bg': 'rgba(6, 182, 212, 0.1)',
            '--progress-pct': `${breakdown.mood}%` 
          }}>
            <div className="linear-label-row">
              <span className="linear-indicator-badge">🧠 MENTAL</span>
              <span className="linear-status-text">Mood & Stres</span>
              <span className="linear-percentage">{breakdown.mood}%</span>
            </div>
            <div className="linear-bar-background">
              <div className="linear-bar-fill"></div>
            </div>
          </div>

        </div>

      </div>

      <div className="ai-coaching-box">
        <div className="ai-coaching-icon-wrap">
          <Sparkles size={16} />
        </div>
        <div className="ai-coaching-text">
          <strong>Coaching AI</strong>
          <p>
            {aiExplanation && aiExplanation.advice && aiExplanation.advice[0] ? (
              aiExplanation.advice[0].replace('🌿 ', '').replace('💵 ', '').replace('🏃‍♂️ ', '').replace('⚠️ ', '')
            ) : (
              'Kondisi seimbang! Ritme hidupmu terjaga dengan baik.'
            )}
          </p>
        </div>
      </div>
    </section>
  );
}
