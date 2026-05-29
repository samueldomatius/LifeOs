import React from 'react';
import { Leaf, Award, Compass } from 'lucide-react';

export default function GrowthGarden({ tasks = [], savings = [], currentDay = {} }) {
  // Calculate stats
  const completedTasks = tasks.filter(t => t.status === 'completed').length;
  const totalSavings = savings.reduce((sum, s) => sum + s.currentAmount, 0);
  const steps = currentDay?.steps || 0;
  
  // Growth formula
  const taskPoints = completedTasks * 20; // 20 points per completed task
  const savingsPoints = Math.floor(totalSavings / 5000); // 1 point per Rp 5.000 saved
  const stravaPoints = Math.floor(steps / 100); // 1 point per 100 steps from Strava activity
  const totalPoints = taskPoints + savingsPoints + stravaPoints;

  // Determine stage
  let stage = 0; // Seed
  let stageName = 'Biji Harapan (Seed)';
  let stageDesc = 'Selesaikan tugas dan menabunglah untuk melihat biji ini tumbuh! 🌱';
  let level = 1;
  let nextLevelPoints = 50;

  if (totalPoints >= 1200) {
    stage = 5;
    level = 6;
    stageName = 'Pohon Emas Legendaris (Golden Tree) 🌟';
    stageDesc = 'Luar biasa! Kedisiplinanmu menciptakan pohon kemakmuran emas!';
    nextLevelPoints = 999999;
  } else if (totalPoints >= 600) {
    stage = 4;
    level = 5;
    stageName = 'Pohon Rindang (Mature Tree) 🌳';
    stageDesc = 'Keren abis! Hidupmu sangat produktif & finansialmu makin kokoh!';
    nextLevelPoints = 1200;
  } else if (totalPoints >= 250) {
    stage = 3;
    level = 4;
    stageName = 'Pohon Muda (Sapling) 🌿';
    stageDesc = 'Wah, daun-daun baru bermunculan seiring tabungan & tugasmu selesai!';
    nextLevelPoints = 600;
  } else if (totalPoints >= 100) {
    stage = 2;
    level = 3;
    stageName = 'Tunas Hijau (Sprout)';
    stageDesc = 'Tunas kecil mulai meninggi mencari cahaya kesuksesan!';
    nextLevelPoints = 250;
  } else if (totalPoints >= 30) {
    stage = 1;
    level = 2;
    stageName = 'Kecambah (Seedling) 🌱';
    stageDesc = 'Biji impianmu mulai pecah dan menunjukkan kehidupan pertama!';
    nextLevelPoints = 100;
  }

  const progressPercent = Math.min(100, Math.round(((totalPoints - (stage === 0 ? 0 : stage === 1 ? 30 : stage === 2 ? 100 : stage === 3 ? 250 : 600)) / (nextLevelPoints - (stage === 0 ? 0 : stage === 1 ? 30 : stage === 2 ? 100 : stage === 3 ? 250 : 600))) * 100));

  // Render SVG based on stage
  const renderPlantSVG = () => {
    switch (stage) {
      case 0:
        return (
          <svg width="120" height="120" viewBox="0 0 100 100">
            {/* Soil */}
            <path d="M 10 90 Q 50 80 90 90 L 90 95 L 10 95 Z" fill="#4e3629" />
            <circle cx="50" cy="85" r="4" fill="#a78bfa" className="pulse-anim" /> {/* Seed */}
            <text x="50" y="70" textAnchor="middle" fontSize="6" fill="var(--text-muted)">💤 Menunggu Aksi</text>
          </svg>
        );
      case 1:
        return (
          <svg width="120" height="120" viewBox="0 0 100 100">
            <style>{`
              .sway { animation: sway-anim 3s ease-in-out infinite alternate; transform-origin: bottom center; }
              @keyframes sway-anim { 0% { transform: rotate(-2deg); } 100% { transform: rotate(2deg); } }
            `}</style>
            <path d="M 10 90 Q 50 80 90 90 L 90 95 L 10 95 Z" fill="#4e3629" />
            {/* Sprout stem */}
            <path className="sway" d="M 50 85 Q 48 70 52 65" stroke="#bbff00" strokeWidth="3" fill="none" strokeLinecap="round" />
            {/* Tiny leaves */}
            <path className="sway" d="M 52 65 Q 58 60 56 57 Q 50 60 52 65" fill="#a7f3d0" />
            <path className="sway" d="M 52 65 Q 46 62 44 59 Q 49 61 52 65" fill="#34d399" />
          </svg>
        );
      case 2:
        return (
          <svg width="120" height="120" viewBox="0 0 100 100">
            <style>{`
              .sway-med { animation: sway-med-anim 3.5s ease-in-out infinite alternate; transform-origin: 50px 85px; }
              @keyframes sway-med-anim { 0% { transform: rotate(-3deg); } 100% { transform: rotate(3deg); } }
            `}</style>
            <path d="M 10 90 Q 50 80 90 90 L 90 95 L 10 95 Z" fill="#4e3629" />
            <g className="sway-med">
              {/* Stem */}
              <path d="M 50 85 Q 45 60 50 45" stroke="#7aa200" strokeWidth="4" fill="none" strokeLinecap="round" />
              {/* Branch */}
              <path d="M 48 65 Q 38 55 35 57" stroke="#7aa200" strokeWidth="2.5" fill="none" strokeLinecap="round" />
              {/* Leaves */}
              <path d="M 50 45 Q 60 38 58 34 Q 48 38 50 45" fill="#34d399" />
              <path d="M 50 45 Q 40 40 38 35 Q 46 41 50 45" fill="#10b981" />
              <path d="M 35 57 Q 27 53 28 48 Q 35 52 35 57" fill="#6ee7b7" />
            </g>
          </svg>
        );
      case 3:
        return (
          <svg width="120" height="120" viewBox="0 0 100 100">
            <style>{`
              .sway-tree { animation: sway-tree-anim 4s ease-in-out infinite alternate; transform-origin: 50px 85px; }
              @keyframes sway-tree-anim { 0% { transform: rotate(-2deg); } 100% { transform: rotate(2.5deg); } }
            `}</style>
            <path d="M 10 90 Q 50 80 90 90 L 90 95 L 10 95 Z" fill="#4e3629" />
            <g className="sway-tree">
              {/* Trunk */}
              <path d="M 50 85 Q 46 55 50 30" stroke="#5c4033" strokeWidth="6" fill="none" strokeLinecap="round" />
              {/* Branches */}
              <path d="M 48 60 Q 35 48 32 50" stroke="#5c4033" strokeWidth="3" fill="none" />
              <path d="M 49 48 Q 65 38 68 40" stroke="#5c4033" strokeWidth="3" fill="none" />
              {/* Leaves clusters */}
              <circle cx="50" cy="25" r="12" fill="#10b981" opacity="0.9" />
              <circle cx="30" cy="48" r="8" fill="#34d399" opacity="0.95" />
              <circle cx="68" cy="38" r="9" fill="#059669" opacity="0.9" />
              <circle cx="50" cy="22" r="7" fill="#a7f3d0" opacity="0.6" />
            </g>
          </svg>
        );
      case 4:
        return (
          <svg width="120" height="120" viewBox="0 0 100 100">
            <style>{`
              .sway-mature { animation: sway-mature-anim 5s ease-in-out infinite alternate; transform-origin: 50px 85px; }
              @keyframes sway-mature-anim { 0% { transform: rotate(-1.5deg); } 100% { transform: rotate(1.5deg); } }
            `}</style>
            <path d="M 10 90 Q 50 80 90 90 L 90 95 L 10 95 Z" fill="#4e3629" />
            <g className="sway-mature">
              {/* Trunk */}
              <path d="M 50 85 L 50 40" stroke="#3d2518" strokeWidth="10" strokeLinecap="round" />
              <path d="M 47 62 Q 30 45 25 48" stroke="#3d2518" strokeWidth="5" fill="none" />
              <path d="M 52 50 Q 70 35 75 38" stroke="#3d2518" strokeWidth="5" fill="none" />
              {/* Large Leaf Foliage */}
              <circle cx="50" cy="30" r="18" fill="#047857" />
              <circle cx="40" cy="25" r="15" fill="#059669" />
              <circle cx="62" cy="28" r="16" fill="#10b981" />
              <circle cx="25" cy="46" r="12" fill="#34d399" />
              <circle cx="75" cy="36" r="13" fill="#059669" />
              {/* Small details */}
              <circle cx="50" cy="18" r="8" fill="#a7f3d0" opacity="0.5" />
              <circle cx="58" cy="22" r="5" fill="#facc15" opacity="0.8" /> {/* Fruit */}
              <circle cx="35" cy="30" r="4" fill="#facc15" opacity="0.8" /> {/* Fruit */}
            </g>
          </svg>
        );
      case 5:
        return (
          <svg width="120" height="120" viewBox="0 0 100 100">
            <style>{`
              .sway-gold { animation: sway-gold-anim 6s ease-in-out infinite alternate; transform-origin: 50px 85px; }
              .star-sparkle { animation: sparkle 2s infinite alternate; }
              @keyframes sway-gold-anim { 0% { transform: rotate(-2deg); } 100% { transform: rotate(2deg); } }
              @keyframes sparkle { 0% { opacity: 0.3; transform: scale(0.8); } 100% { opacity: 1; transform: scale(1.2); } }
            `}</style>
            <path d="M 10 90 Q 50 80 90 90 L 90 95 L 10 95 Z" fill="#4e3629" />
            <g className="sway-gold">
              {/* Trunk */}
              <path d="M 50 85 L 50 35" stroke="#78350f" strokeWidth="12" strokeLinecap="round" />
              <path d="M 46 58 Q 25 40 20 45" stroke="#78350f" strokeWidth="6" fill="none" />
              <path d="M 53 48 Q 75 30 80 35" stroke="#78350f" strokeWidth="6" fill="none" />
              {/* Golden Foliage */}
              <circle cx="50" cy="25" r="22" fill="#d97706" opacity="0.85" />
              <circle cx="35" cy="20" r="18" fill="#f59e0b" opacity="0.9" />
              <circle cx="65" cy="22" r="18" fill="#fbbf24" opacity="0.9" />
              <circle cx="20" cy="42" r="14" fill="#f59e0b" />
              <circle cx="80" cy="32" r="15" fill="#fbbf24" />
              {/* Sparkles */}
              <polygon points="50,5 52,10 57,12 52,14 50,19 48,14 43,12 48,10" fill="#fef08a" className="star-sparkle" />
              <polygon points="25,20 27,23 30,24 27,25 25,28 23,25 20,24 23,23" fill="#fef08a" className="star-sparkle" style={{ animationDelay: '0.5s' }} />
              <polygon points="75,15 77,18 80,19 77,20 75,23 73,20 70,19 73,18" fill="#fef08a" className="star-sparkle" style={{ animationDelay: '1s' }} />
            </g>
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <section className="glass-panel volt-card" style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', padding: '1.25rem', marginTop: '1rem', background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08), rgba(0, 0, 0, 0.2))', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
      <div className="section-label-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Leaf size={14} color="var(--accent-volt)" />
          <span style={{ fontSize: '0.75rem', color: 'var(--text-primary)', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            🌱 Pohon Kemakmuran (Growth Garden)
          </span>
        </div>
        <span style={{ fontSize: '0.6rem', color: 'var(--accent-volt)', fontWeight: 'bold', background: 'rgba(187, 238, 0, 0.1)', padding: '2px 6px', borderRadius: '8px' }}>
          LEVEL {level}
        </span>
      </div>

      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
        
        {/* Dynamic Plant SVG */}
        <div style={{ background: 'rgba(0,0,0,0.15)', borderRadius: '16px', padding: '6px', display: 'flex', justifyContent: 'center', alignItems: 'center', border: '1px solid rgba(255,255,255,0.05)' }}>
          {renderPlantSVG()}
        </div>

        {/* Level Stats & Details */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <h4 style={{ margin: 0, color: '#fff', fontSize: '0.85rem' }}>{stageName}</h4>
          <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.68rem', lineHeight: '1.4' }}>{stageDesc}</p>
          
          <div style={{ marginTop: '4px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.6rem', color: 'var(--text-muted)', marginBottom: '2px', fontWeight: 'bold' }}>
              <span>PROGRES LEVEL</span>
              <span>{totalPoints} / {nextLevelPoints === 999999 ? 'MAX' : `${nextLevelPoints} GP`}</span>
            </div>
            {nextLevelPoints !== 999999 && (
              <div style={{ height: '6px', background: 'var(--bg-pill)', borderRadius: '9px', overflow: 'hidden' }}>
                <div style={{ height: '100%', background: 'linear-gradient(90deg, var(--accent-volt), #34d399)', width: `${progressPercent}%`, borderRadius: '9px' }} />
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Mini Stats Breakdown row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '8px', textAlign: 'center' }}>
        <div>
          <span style={{ fontSize: '0.52rem', color: 'var(--text-muted)', display: 'block' }}>Tugas</span>
          <strong style={{ fontSize: '0.72rem', color: '#fff' }}>{completedTasks} ({taskPoints}p)</strong>
        </div>
        <div>
          <span style={{ fontSize: '0.52rem', color: 'var(--text-muted)', display: 'block' }}>Tabungan</span>
          <strong style={{ fontSize: '0.72rem', color: 'var(--accent-volt)' }}>{savingsPoints}p</strong>
        </div>
        <div>
          <span style={{ fontSize: '0.52rem', color: 'var(--text-muted)', display: 'block' }}>Strava</span>
          <strong style={{ fontSize: '0.72rem', color: '#fc4c02' }}>{steps} ({stravaPoints}p)</strong>
        </div>
        <div>
          <span style={{ fontSize: '0.52rem', color: 'var(--text-muted)', display: 'block' }}>Total GP</span>
          <strong style={{ fontSize: '0.72rem', color: '#a7f3d0' }}>✨ {totalPoints}</strong>
        </div>
      </div>
    </section>
  );
}
