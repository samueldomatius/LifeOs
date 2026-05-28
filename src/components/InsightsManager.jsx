import React from 'react';

export default function InsightsManager({ insightsList }) {
  return (
    <div className="subpanel-overlay">
      <div className="subpanel-header">
        <span className="subpanel-title">📈 Laporan Pola AI Learning</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', overflowY: 'auto', flex: 1 }}>
        {insightsList.map((ins, idx) => (
          <div className="glass-panel volt-card" key={idx} style={{ borderLeft: `4px solid ${ins.type === 'negative' || ins.type === 'warning' ? 'var(--accent-coral)' : 'var(--accent-volt-dark)'}`, position: 'relative' }}>
            <h4 style={{ fontSize: '0.85rem', marginBottom: '0.2rem' }}>{ins.title}</h4>
            <span style={{ fontSize: '0.65rem', fontWeight: 'bold', color: 'var(--theme-text-muted)', display: 'block', marginBottom: '0.4rem' }}>{ins.impact}</span>
            <p style={{ fontSize: '0.75rem', lineHeight: '1.4' }} dangerouslySetInnerHTML={{ __html: ins.insight }} />
          </div>
        ))}
      </div>
    </div>
  );
}
