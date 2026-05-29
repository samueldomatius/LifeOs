import React, { useState } from 'react';
import { Clock, ExternalLink, Trash2, Edit2 } from 'lucide-react';
//twst
export default function TasksManager({ 
  filteredTasks, 
  selectedDate, 
  taskText, 
  setTaskText, 
  taskPriority, 
  setTaskPriority, 
  taskTag, 
  setTaskTag, 
  taskTime,
  setTaskTime,
  taskEndTime,
  setTaskEndTime,
  taskDate,
  setTaskDate,
  taskLink,
  setTaskLink,
  handleAddTask, 
  toggleTaskStatus, 
  handleSnoozeTask,
  onDeleteTask,
  onUpdateTask,
  timerTime,
  timerRunning,
  toggleTimer,
  resetTimer,
  ambientSound,
  setAmbientSound,
  formatDateHeader,
  onSelectFocusTask,
  focusTask,
  dailySummary
}) {
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [editTaskText, setEditTaskText] = useState('');
  const [editTaskPriority, setEditTaskPriority] = useState('medium');
  const [editTaskTag, setEditTaskTag] = useState('Productivity');
  const [editTaskTime, setEditTaskTime] = useState('');
  const [editTaskEndTime, setEditTaskEndTime] = useState('');
  const [editTaskDate, setEditTaskDate] = useState('');
  const [editTaskLink, setEditTaskLink] = useState('');
  return (
    <div className="subpanel-overlay">
      <div className="subpanel-header">
        <span className="subpanel-title">⚡ Tasks & Focus Blocks</span>
      </div>

      <div style={{ background: 'var(--bg-pill)', padding: '0.65rem 1rem', borderRadius: '16px', fontSize: '0.8rem', fontWeight: 700 }}>
        📅 Menambahkan tugas untuk tanggal terpilih: <span style={{ color: 'var(--accent-volt-dark)' }}>{formatDateHeader(selectedDate)}</span>
      </div>

      {/* Task input form */}
      <form onSubmit={handleAddTask} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <input 
          type="text" 
          className="task-input" 
          placeholder="Nama tugas baru..."
          value={taskText}
          onChange={(e) => setTaskText(e.target.value)}
          required
        />
        
        <input 
          type="url" 
          className="task-input" 
          placeholder="Tautan kerja / meeting Zoom/Meet (opsional)..."
          value={taskLink}
          onChange={(e) => setTaskLink(e.target.value)}
        />

        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
          <select 
            className="select-input"
            value={taskPriority}
            onChange={(e) => setTaskPriority(e.target.value)}
            style={{ flex: '1 1 90px' }}
          >
            <option value="high">Prio: High</option>
            <option value="medium">Prio: Medium</option>
            <option value="low">Prio: Low</option>
          </select>

          <select 
            className="select-input"
            value={taskTag}
            onChange={(e) => setTaskTag(e.target.value)}
            style={{ flex: '1 1 90px' }}
          >
            <option value="Productivity">Productivity</option>
            <option value="Health">Health</option>
            <option value="Finance">Finance</option>
            <option value="Growth">Growth</option>
          </select>

          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flex: '1 1 180px' }}>
            <input 
              type="time" 
              className="select-input" 
              value={taskTime} 
              onChange={(e) => setTaskTime(e.target.value)}
              style={{ flex: '1', color: 'var(--text-primary)', minWidth: '70px' }}
              title="Jam Mulai"
            />
            <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>s/d</span>
            <input 
              type="time" 
              className="select-input" 
              value={taskEndTime} 
              onChange={(e) => setTaskEndTime(e.target.value)}
              style={{ flex: '1', color: 'var(--text-primary)', minWidth: '70px' }}
              title="Jam Selesai"
            />
          </div>

          <input 
            type="date" 
            className="select-input"
            value={taskDate} 
            onChange={(e) => setTaskDate(e.target.value)}
            style={{ flex: '1 1 120px', color: 'var(--text-primary)' }}
            title="Tanggal Tugas"
            required
          />

          <button type="submit" className="primary-btn" style={{ flex: '1 1 60px' }}>
            Log
          </button>
        </div>
      </form>

      {/* AI Task Recommendation Card */}
      {(() => {
        const pending = filteredTasks.filter(t => t.status === 'pending');
        if (pending.length === 0) return null;

        // Urgency scoring: Priority + length + snoozes + keywords
        const scoredTasks = pending.map(t => {
          let score = t.priority === 'high' ? 100 : t.priority === 'medium' ? 50 : 10;
          score += (t.snoozeCount || 0) * 20;
          if (t.text.length > 25) score += 15;
          
          const textLower = t.text.toLowerCase();
          const complexKeywords = ['tugas', 'berat', 'pitch', 'deck', 'code', 'coding', 'laporan', 'paper', 'ujian', 'final', 'review', 'analisis', 'tagihan'];
          if (complexKeywords.some(kw => textLower.includes(kw))) {
            score += 25;
          }
          return { task: t, score };
        });

        scoredTasks.sort((a, b) => b.score - a.score);
        const topTask = scoredTasks[0].task;

        return (
          <div className="glass-panel volt-card" style={{ borderLeft: '4px solid var(--accent-volt-dark)', padding: '1rem', background: 'rgba(187, 238, 0, 0.05)', display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '0.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '1rem' }}>🤖</span>
              <strong style={{ fontSize: '0.75rem', color: 'var(--accent-volt-dark)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>AI Rekomendasi Fokus</strong>
            </div>
            <p style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>
              {topTask.text}
            </p>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
              <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                Urgent & Rumit ({topTask.priority} priority • {topTask.snoozeCount} snoozes)
              </span>
              <button 
                type="button"
                onClick={() => onSelectFocusTask(topTask)}
                className="section-subtitle-btn animate-pulse"
                style={{ fontSize: '0.65rem', padding: '4px 8px', borderRadius: '8px', border: '1px solid var(--accent-purple)', background: 'rgba(139, 92, 246, 0.08)', fontWeight: 'bold' }}
              >
                Fokus Sekarang ⏱️
              </button>
            </div>
          </div>
        );
      })()}

      {/* Focus Block Timer Widget */}
      <div className="glass-panel volt-card" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', textAlign: 'center', marginTop: '0.25rem' }}>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 'bold' }}>
          {focusTask ? `🎯 FOKUS: ${focusTask.text}` : 'FOCUS TIMER BLOCK'}
        </span>
        <div style={{ fontSize: '2.5rem', fontFamily: 'Outfit', fontWeight: '800', color: 'var(--text-primary)' }}>
          {Math.floor(timerTime / 60)}:{(timerTime % 60).toString().padStart(2, '0')}
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button 
            type="button"
            className="timer-btn start" 
            style={{ flex: 1, padding: '8px', borderRadius: '12px', border: 'none', background: timerRunning ? 'var(--accent-orange)' : 'var(--accent-volt)', color: '#000', fontWeight: 'bold', cursor: 'pointer' }}
            onClick={toggleTimer}
          >
            {timerRunning ? 'Pause' : 'Start'}
          </button>
          <button 
            type="button"
            className="timer-btn reset" 
            style={{ flex: 1, padding: '8px', borderRadius: '12px', background: 'var(--bg-pill)', color: 'var(--text-primary)', border: '1px solid var(--card-border-inner)', cursor: 'pointer' }}
            onClick={resetTimer}
          >
            Reset
          </button>
        </div>
        <div className="ambient-sound-sim" style={{ color: 'var(--text-secondary)', background: 'var(--bg-pill)', marginTop: '0.2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', borderRadius: '12px', padding: '4px 8px' }}>
          <select 
            value={ambientSound} 
            onChange={(e) => setAmbientSound(e.target.value)}
            style={{ background: 'none', border: 'none', color: 'var(--text-primary)', fontSize: '0.75rem', fontWeight: 'bold', outline: 'none', cursor: 'pointer', flex: 1 }}
          >
            <option value="rain" style={{ background: '#222', color: '#fff' }}>🌧️ Rain & Storm</option>
            <option value="waves" style={{ background: '#222', color: '#fff' }}>🌊 Ocean Waves</option>
            <option value="lofi" style={{ background: '#222', color: '#fff' }}>🎹 Lofi Ambient Pads</option>
            <option value="silent" style={{ background: '#222', color: '#fff' }}>🔇 Silent Focus</option>
          </select>
          {timerRunning && ambientSound !== 'silent' && (
            <div className="music-waves" style={{ flexShrink: 0 }}>
              <div className="wave-bar"></div>
              <div className="wave-bar"></div>
              <div className="wave-bar"></div>
              <div className="wave-bar"></div>
            </div>
          )}
        </div>
      </div>

      {/* List filtered Tasks */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', overflowY: 'auto', flex: 1, maxHeight: '250px' }}>
        {filteredTasks.map(t => {
          const isEditing = editingTaskId === t.id;
          return (
            <div className={`recent-row-item ${t.status === 'completed' ? 'completed' : ''}`} key={t.id} style={{ opacity: t.status === 'completed' ? 0.5 : 1, padding: '0.85rem 1rem' }}>
              {isEditing ? (
                <form 
                  onSubmit={(e) => {
                    e.preventDefault();
                    onUpdateTask(t.id, {
                      text: editTaskText,
                      priority: editTaskPriority,
                      tag: editTaskTag,
                      time: editTaskTime,
                      endTime: editTaskEndTime,
                      dueDate: editTaskDate,
                      link: editTaskLink
                    });
                    setEditingTaskId(null);
                  }}
                  style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}
                >
                  <input 
                    type="text" 
                    className="task-input" 
                    value={editTaskText} 
                    onChange={(e) => setEditTaskText(e.target.value)} 
                    required 
                    style={{ padding: '0.45rem 0.75rem', fontSize: '0.8rem', width: '100%' }}
                  />
                  <input 
                    type="url" 
                    className="task-input" 
                    placeholder="Link kerja/meeting (opsional)"
                    value={editTaskLink} 
                    onChange={(e) => setEditTaskLink(e.target.value)}
                    style={{ padding: '0.45rem 0.75rem', fontSize: '0.75rem', width: '100%' }}
                  />
                  <div style={{ display: 'flex', gap: '0.3rem', alignItems: 'center', width: '100%', flexWrap: 'wrap' }}>
                    <select 
                      className="select-input" 
                      value={editTaskPriority} 
                      onChange={(e) => setEditTaskPriority(e.target.value)}
                      style={{ flex: '1 1 80px', padding: '4px', fontSize: '0.7rem' }}
                    >
                      <option value="high">High</option>
                      <option value="medium">Medium</option>
                      <option value="low">Low</option>
                    </select>
                    <select 
                      className="select-input" 
                      value={editTaskTag} 
                      onChange={(e) => setEditTaskTag(e.target.value)}
                      style={{ flex: '1 1 90px', padding: '4px', fontSize: '0.7rem' }}
                    >
                      <option value="Productivity">Productivity</option>
                      <option value="Health">Health</option>
                      <option value="Finance">Finance</option>
                      <option value="Growth">Growth</option>
                    </select>
                    <div style={{ display: 'flex', gap: '4px', alignItems: 'center', flex: '1 1 120px' }}>
                      <input 
                        type="time" 
                        className="select-input" 
                        value={editTaskTime} 
                        onChange={(e) => setEditTaskTime(e.target.value)}
                        style={{ flex: 1, padding: '4px', fontSize: '0.7rem', color: 'var(--text-primary)', minWidth: '50px' }}
                        title="Jam Mulai"
                      />
                      <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>s/d</span>
                      <input 
                        type="time" 
                        className="select-input" 
                        value={editTaskEndTime} 
                        onChange={(e) => setEditTaskEndTime(e.target.value)}
                        style={{ flex: 1, padding: '4px', fontSize: '0.7rem', color: 'var(--text-primary)', minWidth: '50px' }}
                        title="Jam Selesai"
                      />
                    </div>
                    <input 
                      type="date" 
                      className="select-input" 
                      value={editTaskDate} 
                      onChange={(e) => setEditTaskDate(e.target.value)}
                      style={{ flex: '1 1 100px', padding: '4px', fontSize: '0.7rem', color: 'var(--text-primary)' }}
                      title="Tanggal Tugas"
                      required
                    />
                  </div>
                  <div style={{ display: 'flex', gap: '6px', alignSelf: 'flex-end', marginTop: '4px' }}>
                    <button type="submit" className="primary-btn" style={{ padding: '4px 10px', fontSize: '0.7rem', borderRadius: '8px' }}>Simpan</button>
                    <button type="button" onClick={() => setEditingTaskId(null)} className="primary-btn" style={{ padding: '4px 10px', fontSize: '0.7rem', borderRadius: '8px', background: 'var(--bg-pill)', color: 'var(--text-primary)' }}>Batal</button>
                  </div>
                </form>
              ) : (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1, overflow: 'hidden' }}>
                    <div 
                      style={{ width: '18px', height: '18px', border: '2px solid var(--text-secondary)', borderRadius: '6px', background: t.status === 'completed' ? 'var(--accent-volt-dark)' : 'none', cursor: 'pointer', flexShrink: 0 }}
                      onClick={() => toggleTaskStatus(t.id)}
                    />
                    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 600, textDecoration: t.status === 'completed' ? 'line-through' : 'none', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%' }}>
                          {t.text}
                        </span>
                        {(t.time || t.endTime) && (
                          <span style={{ fontSize: '0.6rem', color: 'var(--accent-orange)', fontWeight: 'bold', background: 'var(--bg-pill)', padding: '1px 5px', borderRadius: '4px', whiteSpace: 'nowrap' }}>
                            🕒 {t.time || ''}{t.endTime ? ` - ${t.endTime}` : ''}
                          </span>
                        )}
                        {t.link && (() => {
                          const isMeet = t.link.includes('meet.google.com') || t.link.includes('zoom.us') || t.link.includes('teams.');
                          return (
                            <a 
                              href={t.link} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              style={{ 
                                fontSize: '0.55rem', 
                                padding: '2px 6px', 
                                borderRadius: '6px', 
                                border: '1px solid var(--accent-cyan)', 
                                background: 'rgba(34, 211, 238, 0.05)',
                                color: 'var(--accent-cyan)',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '3px',
                                textDecoration: 'none',
                                fontWeight: 'bold',
                                whiteSpace: 'nowrap'
                              }}
                            >
                              {isMeet ? '📹 Rapat' : '🔗 Link'}
                            </a>
                          );
                        })()}
                      </div>
                      <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>
                        📅 {t.dueDate || selectedDate} • {t.tag} • Snooze: {t.snoozeCount || 0}
                      </span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '4px', alignItems: 'center', flexShrink: 0 }}>
                    {t.status !== 'completed' && (
                      <button 
                        type="button"
                        className="shortcut-circle-icon" 
                        style={{ width: '26px', height: '26px', background: 'none', border: 'none', padding: 0 }}
                        onClick={() => handleSnoozeTask(t.id)}
                        title="Snooze"
                      >
                        <Clock size={11} />
                      </button>
                    )}
                    <button 
                      type="button"
                      className="shortcut-circle-icon" 
                      style={{ width: '26px', height: '26px', background: 'none', border: 'none', color: 'var(--text-muted)', padding: 0 }}
                       onClick={() => {
                        setEditingTaskId(t.id);
                        setEditTaskText(t.text);
                        setEditTaskPriority(t.priority);
                        setEditTaskTag(t.tag);
                        setEditTaskTime(t.time || '');
                        setEditTaskEndTime(t.endTime || '');
                        setEditTaskDate(t.dueDate || selectedDate);
                        setEditTaskLink(t.link || '');
                      }}
                      title="Edit"
                    >
                      <Edit2 size={11} />
                    </button>
                    <button 
                      type="button"
                      className="shortcut-circle-icon" 
                      style={{ width: '26px', height: '26px', background: 'none', border: 'none', color: 'var(--accent-coral)', padding: 0 }}
                      onClick={() => {
                        if (confirm('Apakah Anda yakin ingin menghapus tugas ini?')) {
                          onDeleteTask(t.id);
                        }
                      }}
                      title="Hapus"
                    >
                      <Trash2 size={11} />
                    </button>
                  </div>
                </>
              )}
            </div>
          );
        })}
        {filteredTasks.length === 0 && (
          <p style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
            Belum ada tugas untuk hari ini.
          </p>
        )}
      </div>

      {/* AI Daily Activity Summary Section */}
      {dailySummary && (
        <div className="glass-panel volt-card" style={{ borderLeft: '4px solid var(--accent-purple)', background: 'var(--bg-pill)', marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '1rem' }}>🧠</span>
            <strong style={{ fontSize: '0.75rem', color: 'var(--accent-purple)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>AI Rangkuman Hari Ini</strong>
          </div>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-primary)', lineHeight: '1.45', margin: 0 }}>
            {dailySummary.summary}
          </p>
          {dailySummary.bullets && dailySummary.bullets.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', marginTop: '2px', borderTop: '1px solid var(--card-border-inner)', paddingTop: '4px' }}>
              {dailySummary.bullets.map((b, idx) => (
                <div key={idx} style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span>{b}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
