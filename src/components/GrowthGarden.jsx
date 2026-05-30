import React from 'react';
import { Leaf, Award, Flame, Check, Lock, ChevronRight } from 'lucide-react';

export default function GrowthGarden({ 
  tasks = [], 
  savings = [], 
  currentDay = {}, 
  streakCount = 0,
  isStreakActive = false 
}) {
  // Calculate stats
  const completedTasks = tasks.filter(t => t.status === 'completed').length;
  const totalSavings = savings.reduce((sum, s) => sum + s.currentAmount, 0);
  const steps = currentDay?.steps || 0;
  
  // Growth formula
  const taskPoints = completedTasks * 20; // 20 points per completed task
  const savingsPoints = Math.floor(totalSavings / 5000); // 1 point per Rp 5.000 saved
  const stravaPoints = Math.floor(steps / 100); // 1 point per 100 steps from Strava activity
  const totalPoints = taskPoints + savingsPoints + stravaPoints;

  // Determine stage and level
  const levelThresholds = [
    { level: 1, points: 0, stage: 0, name: 'Biji Harapan (Seed) 🌱', desc: 'Selesaikan tugas dan menabunglah untuk melihat biji ini tumbuh!' },
    { level: 2, points: 50, stage: 1, name: 'Pecah Biji (Germinating Seed) 🌱', desc: 'Biji impianmu mulai pecah dan menunjukkan kehidupan pertama!' },
    { level: 3, points: 150, stage: 1, name: 'Tunas Awal (Sprout) 🌱', desc: 'Tunas kecil mulai meninggi mencari cahaya kesuksesan!' },
    { level: 4, points: 300, stage: 1, name: 'Kecambah Besar (Big Seedling) 🌱', desc: 'Tunas kecil mulai tumbuh meninggi!' },
    { level: 5, points: 500, stage: 2, name: 'Tunas Hijau Mandiri (Young Sprout) 🌿', desc: 'Batang kecil mulai berakar kokoh.' },
    { level: 6, points: 750, stage: 2, name: 'Batang Muda (Young Sapling) 🌿', desc: 'Akar makin kuat, daun makin lebat. Hidupmu makin teratur!' },
    { level: 7, points: 1050, stage: 2, name: 'Tanaman Muda Rimbun 🌿', desc: 'Daun-daun kecil mulai menghijau lebat!' },
    { level: 8, points: 1400, stage: 3, name: 'Pohon Muda Matang (Mature Sapling) 🌿', desc: 'Wah, daun-daun baru bermunculan seiring tabungan & tugasmu selesai!' },
    { level: 9, points: 1800, stage: 3, name: 'Pohon Muda Berbunga (Budding Sapling) 🌸', desc: 'Kuncup-kuncup bunga kecil mulai terlihat menghiasi batang!' },
    { level: 10, points: 2250, stage: 3, name: 'Pohon Berbunga (Flowering Tree) 🌸', desc: 'Indah sekali! Kuncup-kuncup bunga kedisiplinan mulai bermekaran!' },
    { level: 11, points: 2750, stage: 3, name: 'Pohon Berbunga Lebat 🌸', desc: 'Aroma kesuksesan mulai tercium dari kebun disiplinmu!' },
    { level: 12, points: 3300, stage: 4, name: 'Pohon Berbuah Muda 🍎', desc: 'Buah-buah kecil mulai nampak di ranting pohonmu!' },
    { level: 13, points: 3900, stage: 4, name: 'Pohon Berbuah Lebat (Fruiting Tree) 🍎', desc: 'Keren abis! Kerja kerasmu mulai membuahkan hasil finansial & produktivitas!' },
    { level: 14, points: 4550, stage: 4, name: 'Pohon Rindang Kemakmuran (Majestic Tree) 🌳', desc: 'Keren abis! Hidupmu sangat produktif & finansialmu makin kokoh!' },
    { level: 15, points: 5250, stage: 4, name: 'Pohon Rindang Kokoh 🌳', desc: 'Pohonmu menaungi hari-hari sibukmu dengan keteduhan.' },
    { level: 16, points: 6000, stage: 4, name: 'Pohon Rindang Legendaris 🌳', desc: 'Keberhasilanmu menjadi buah bibir di kebun finansial.' },
    { level: 17, points: 6850, stage: 4, name: 'Pohon Rindang Emas Pemula 🌳', desc: 'Daun-daun mulai memancarkan kilau keemasan.' },
    { level: 18, points: 7750, stage: 4, name: 'Pohon Rindang Emas Muda 🌳', desc: 'Setengah bagian pohonmu telah berkilau emas!' },
    { level: 19, points: 8700, stage: 5, name: 'Pohon Emas Bertunas Baru 🌟', desc: 'Luar biasa! Kilau emas mulai mendominasi seluruh pohon!' },
    { level: 20, points: 9700, stage: 5, name: 'Pohon Emas Bersemi 🌟', desc: 'Kekayaan dan kedisiplinanmu menyatu dalam keindahan emas!' },
    { level: 21, points: 10750, stage: 5, name: 'Pohon Emas Matang 🌟', desc: 'Pohon emas berkilau indah di bawah sinar matahari!' },
    { level: 22, points: 11850, stage: 5, name: 'Pohon Emas Berbunga Perak 🌟', desc: 'Kombinasi emas dan bunga perak yang sangat langka!' },
    { level: 23, points: 13000, stage: 5, name: 'Pohon Emas Berbunga Emas 🌟', desc: 'Bunga-bunga emas mulai bermekaran dengan anggun!' },
    { level: 24, points: 14200, stage: 5, name: 'Pohon Emas Berbuah Kristal 🌟', desc: 'Buah kristal berkilauan melambangkan kekayaan abadi!' },
    { level: 25, points: 15450, stage: 5, name: 'Pohon Emas Berbuah Permata 🌟', desc: 'Buah permata indah siap dipetik hasil kerja kerasmu!' },
    { level: 26, points: 16750, stage: 5, name: 'Pohon Dewata Kemakmuran 🌟', desc: 'Energi positif mengalir deras ke seluruh penjuru kebun!' },
    { level: 27, points: 18100, stage: 5, name: 'Pohon Dewata Emas Abadi 🌟', desc: 'Keabadian kesuksesan finansial dan produktivitas terwujud!' },
    { level: 28, points: 19500, stage: 5, name: 'Pohon Kosmik Kemakmuran 🌟', desc: 'Melampaui batas bumi, kesuksesanmu memancar ke angkasa!' },
    { level: 29, points: 21000, stage: 5, name: 'Pohon Kosmik Emas Legendaris 🌟', desc: 'Selangkah lagi menuju puncak kedisiplinan tertinggi!' },
    { level: 30, points: 22600, stage: 5, name: 'Pohon Mahkota Dewa Emas (Ultimate Golden Tree) 🌟', desc: 'PUNCAK KESUKSESAN! Anda telah mencapai level maksimal kebun kehidupan! Sungguh luar biasa!' },
  ];

  let stage = 0;
  let stageName = '';
  let stageDesc = '';
  let level = 1;
  let nextLevelPoints = 50;
  let prevLevelPoints = 0;

  // Find current level config
  let currentLevelIdx = 0;
  for (let i = 0; i < levelThresholds.length; i++) {
    if (totalPoints >= levelThresholds[i].points) {
      currentLevelIdx = i;
    } else {
      break;
    }
  }

  const currentLevelConfig = levelThresholds[currentLevelIdx];
  level = currentLevelConfig.level;
  stage = currentLevelConfig.stage;
  stageName = currentLevelConfig.name;
  stageDesc = currentLevelConfig.desc;
  prevLevelPoints = currentLevelConfig.points;

  if (currentLevelIdx < levelThresholds.length - 1) {
    nextLevelPoints = levelThresholds[currentLevelIdx + 1].points;
  } else {
    nextLevelPoints = prevLevelPoints + 2000;
  }

  const progressPercent = Math.min(100, Math.round(((totalPoints - prevLevelPoints) / (nextLevelPoints - prevLevelPoints)) * 100));

  // Badge configuration system
  const badgesList = [
    {
      id: 'badge_first_task',
      name: 'Tunas Harapan',
      desc: 'Menyelesaikan tugas pertama Anda.',
      requirement: 'Selesaikan 1 tugas',
      unlocked: completedTasks >= 1,
      icon: '🌱',
      color: 'var(--accent-volt-dark)'
    },
    {
      id: 'badge_prod_warrior',
      name: 'Prajurit Produktif',
      desc: 'Disiplin menyelesaikan 10 tugas.',
      requirement: 'Selesaikan 10 tugas',
      unlocked: completedTasks >= 10,
      icon: '⚔️',
      color: 'var(--accent-purple)'
    },
    {
      id: 'badge_prod_general',
      name: 'Jenderal Fokus',
      desc: 'Master produktivitas dengan 30 tugas.',
      requirement: 'Selesaikan 30 tugas',
      unlocked: completedTasks >= 30,
      icon: '👑',
      color: '#fbbf24'
    },
    {
      id: 'badge_thrifty_starter',
      name: 'Wallet Guard',
      desc: 'Memulai target tabungan pertama.',
      requirement: 'Memiliki 1 target tabungan',
      unlocked: savings.length >= 1,
      icon: '🛡️',
      color: 'var(--accent-cyan)'
    },
    {
      id: 'badge_saving_hero',
      name: 'Pahlawan Hemat',
      desc: 'Menyimpan total tabungan Rp 250.000.',
      requirement: 'Tabungan Rp 250.000',
      unlocked: totalSavings >= 250000,
      icon: '💰',
      color: 'var(--accent-volt)'
    },
    {
      id: 'badge_strava_runner',
      name: 'Pelari Estafet',
      desc: 'Mencapai 5.000 langkah aktivitas fisik.',
      requirement: '5.000 langkah hari ini',
      unlocked: steps >= 5000,
      icon: '🏃',
      color: '#fc4c02'
    },
    {
      id: 'badge_streak_starter',
      name: 'Konsisten Membara',
      desc: 'Jaga api streak selama 3 hari.',
      requirement: 'Streak 3 Hari',
      unlocked: streakCount >= 3,
      icon: '🔥',
      color: 'var(--accent-orange)'
    },
    {
      id: 'badge_flame_master',
      name: 'Api Abadi',
      desc: 'Disiplin tiada henti selama 7 hari.',
      requirement: 'Streak 7 Hari',
      unlocked: streakCount >= 7,
      icon: '✨',
      color: 'var(--accent-coral)'
    }
  ];

  // Render SVG based on stage
  const renderPlantSVG = () => {
    switch (stage) {
      case 0:
        return (
          <svg width="120" height="120" viewBox="0 0 100 100">
            <path d="M 10 90 Q 50 80 90 90 L 90 95 L 10 95 Z" fill="#4e3629" />
            <circle cx="50" cy="85" r="4" fill="#a78bfa" className="pulse-anim" /> 
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
            <path className="sway" d="M 50 85 Q 48 70 52 65" stroke="#bbff00" strokeWidth="3" fill="none" strokeLinecap="round" />
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
              <path d="M 50 85 Q 45 60 50 45" stroke="#7aa200" strokeWidth="4" fill="none" strokeLinecap="round" />
              <path d="M 48 65 Q 38 55 35 57" stroke="#7aa200" strokeWidth="2.5" fill="none" strokeLinecap="round" />
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
              <path d="M 50 85 Q 46 55 50 30" stroke="#5c4033" strokeWidth="6" fill="none" strokeLinecap="round" />
              <path d="M 48 60 Q 35 48 32 50" stroke="#5c4033" strokeWidth="3" fill="none" />
              <path d="M 49 48 Q 65 38 68 40" stroke="#5c4033" strokeWidth="3" fill="none" />
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
              <path d="M 50 85 L 50 40" stroke="#3d2518" strokeWidth="10" strokeLinecap="round" />
              <path d="M 47 62 Q 30 45 25 48" stroke="#3d2518" strokeWidth="5" fill="none" />
              <path d="M 52 50 Q 70 35 75 38" stroke="#3d2518" strokeWidth="5" fill="none" />
              <circle cx="50" cy="30" r="18" fill="#047857" />
              <circle cx="40" cy="25" r="15" fill="#059669" />
              <circle cx="62" cy="28" r="16" fill="#10b981" />
              <circle cx="25" cy="46" r="12" fill="#34d399" />
              <circle cx="75" cy="36" r="13" fill="#059669" />
              <circle cx="50" cy="18" r="8" fill="#a7f3d0" opacity="0.5" />
              <circle cx="58" cy="22" r="5" fill="#facc15" opacity="0.8" /> 
              <circle cx="35" cy="30" r="4" fill="#facc15" opacity="0.8" /> 
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
              <path d="M 50 85 L 50 35" stroke="#78350f" strokeWidth="12" strokeLinecap="round" />
              <path d="M 46 58 Q 25 40 20 45" stroke="#78350f" strokeWidth="6" fill="none" />
              <path d="M 53 48 Q 75 30 80 35" stroke="#78350f" strokeWidth="6" fill="none" />
              <circle cx="50" cy="25" r="22" fill="#d97706" opacity="0.85" />
              <circle cx="35" cy="20" r="18" fill="#f59e0b" opacity="0.9" />
              <circle cx="65" cy="22" r="18" fill="#fbbf24" opacity="0.9" />
              <circle cx="20" cy="42" r="14" fill="#f59e0b" />
              <circle cx="80" cy="32" r="15" fill="#fbbf24" />
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
    <div className="subpanel-overlay">
      <div className="subpanel-header">
        <span className="subpanel-title">🌱 Pohon Kehidupan & Milestone</span>
      </div>

      {/* Fire Streak Widget (Sistem Streak Api) */}
      <div 
        className="glass-panel volt-card" 
        style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          padding: '1.1rem 1.4rem', 
          background: isStreakActive ? 'linear-gradient(135deg, rgba(251, 146, 60, 0.15), var(--card-bg))' : 'var(--bg-pill)',
          borderColor: isStreakActive ? 'var(--accent-orange)' : 'var(--card-border-inner)',
          boxShadow: isStreakActive ? '0 8px 32px rgba(251, 146, 60, 0.15)' : 'none'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            background: isStreakActive ? 'rgba(251, 146, 60, 0.2)' : 'var(--bg-pill-hover)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: isStreakActive ? '0 0 15px rgba(251, 146, 60, 0.4)' : 'none'
          }}>
            <Flame size={20} color={isStreakActive ? 'var(--accent-orange)' : 'var(--text-muted)'} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-primary)' }}>Streak Disiplin Anda</span>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
              {isStreakActive ? 'Api menyala membara! Teruskan disiplin harianmu!' : 'Selesaikan tugas untuk memicu api streak.'}
            </span>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
          <span style={{ fontSize: '1.75rem', fontWeight: 900, fontFamily: 'Outfit', color: isStreakActive ? 'var(--accent-orange)' : 'var(--text-muted)', lineHeight: 1 }}>
            {streakCount}
          </span>
          <span style={{ fontSize: '0.55rem', fontWeight: 'bold', color: 'var(--text-muted)', letterSpacing: '0.05em' }}>HARI AKTIF</span>
        </div>
      </div>

      {/* Growth Garden Tree Widget */}
      <div 
        className="glass-panel volt-card" 
        style={{ 
          display: 'flex', 
          flexDirection: 'column',
          gap: '1rem', 
          padding: '1.25rem',
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08), var(--card-bg))', 
          border: '1px solid rgba(16, 185, 129, 0.2)' 
        }}
      >
        <div className="section-label-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Leaf size={14} color="var(--accent-volt)" />
            <span style={{ fontSize: '0.75rem', color: 'var(--text-primary)', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Pohon Kemakmuran Kehidupan
            </span>
          </div>
          <span style={{ fontSize: '0.6rem', color: 'var(--accent-volt)', fontWeight: 'bold', background: 'rgba(187, 238, 0, 0.1)', padding: '2px 6px', borderRadius: '8px' }}>
            LEVEL {level}
          </span>
        </div>

        <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center' }}>
          {/* Dynamic Plant SVG */}
          <div style={{ background: 'var(--bg-pill)', borderRadius: '20px', padding: '6px', display: 'flex', justifyContent: 'center', alignItems: 'center', border: '1px solid var(--card-border-inner)' }}>
            {renderPlantSVG()}
          </div>

          {/* Level Stats & Details */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <h4 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '0.9rem', fontWeight: 800 }}>{stageName}</h4>
            <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.7rem', lineHeight: '1.4' }}>{stageDesc}</p>
            
            <div style={{ marginTop: '4px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.6rem', color: 'var(--text-secondary)', marginBottom: '3px', fontWeight: 'bold' }}>
                <span>PROGRES LEVEL</span>
                <span>{totalPoints} / {nextLevelPoints} GP</span>
              </div>
              <div style={{ height: '7px', background: 'var(--bg-pill)', borderRadius: '9px', overflow: 'hidden' }}>
                <div style={{ height: '100%', background: 'linear-gradient(90deg, var(--accent-volt), #34d399)', width: `${progressPercent}%`, borderRadius: '9px' }} />
              </div>
            </div>
          </div>
        </div>

        {/* Mini Stats Breakdown row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px', borderTop: '1px solid var(--card-border-inner)', paddingTop: '10px', textAlign: 'center' }}>
          <div>
            <span style={{ fontSize: '0.52rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '2px' }}>Tugas Selesai</span>
            <strong style={{ fontSize: '0.72rem', color: 'var(--text-primary)' }}>{completedTasks} ({taskPoints}p)</strong>
          </div>
          <div>
            <span style={{ fontSize: '0.52rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '2px' }}>Tabungan</span>
            <strong style={{ fontSize: '0.72rem', color: 'var(--accent-volt-dark)' }}>{savingsPoints}p</strong>
          </div>
          <div>
            <span style={{ fontSize: '0.52rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '2px' }}>Aktivitas Fisik</span>
            <strong style={{ fontSize: '0.72rem', color: '#fc4c02' }}>{steps} ({stravaPoints}p)</strong>
          </div>
          <div>
            <span style={{ fontSize: '0.52rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '2px' }}>Total GP</span>
            <strong style={{ fontSize: '0.72rem', color: 'var(--text-primary)' }}>✨ {totalPoints}</strong>
          </div>
        </div>
      </div>

      {/* Milestone Badge Reward System */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <div className="section-label-row" style={{ padding: '0 4px' }}>
          <span className="section-title-label" style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
            🏆 PENCAPAIAN & SISTEM BADGE REWARD
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem' }}>
          {badgesList.map(b => (
            <div 
              key={b.id}
              className="glass-panel volt-card"
              style={{
                padding: '0.9rem',
                display: 'flex',
                gap: '10px',
                alignItems: 'center',
                opacity: b.unlocked ? 1 : 0.45,
                background: b.unlocked ? 'var(--card-bg)' : 'var(--bg-pill)',
                border: b.unlocked ? `1px solid ${b.color}aa` : '1px solid var(--card-border-inner)',
                transition: 'all 0.25s ease'
              }}
            >
              {/* Badge Icon */}
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                background: b.unlocked ? `${b.color}15` : 'var(--bg-pill-hover)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.2rem',
                border: b.unlocked ? `1.5px solid ${b.color}` : '1.5px solid var(--card-border-inner)',
                boxShadow: b.unlocked ? `0 0 10px ${b.color}40` : 'none',
                flexShrink: 0
              }}>
                {b.icon}
              </div>

              {/* Badge Info */}
              <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 800, color: b.unlocked ? 'var(--text-primary)' : 'var(--text-muted)', textOverflow: 'ellipsis', whiteSpace: 'nowrap', overflow: 'hidden' }}>
                  {b.name}
                </span>
                <span style={{ fontSize: '0.6rem', color: 'var(--text-secondary)', lineHeight: 1.3, marginTop: '2px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {b.desc}
                </span>
                <span style={{ fontSize: '0.55rem', fontWeight: 'bold', color: b.unlocked ? b.color : 'var(--text-muted)', marginTop: '4px', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '3px' }}>
                  {b.unlocked ? (
                    <>
                      <Check size={9} /> TERBUKA
                    </>
                  ) : (
                    <>
                      <Lock size={9} /> {b.requirement}
                    </>
                  )}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
