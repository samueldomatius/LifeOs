import React, { useState } from 'react';
import { Clock, ExternalLink, Trash2, Edit2, X, Mic, Check, Plus, ChevronDown, ChevronUp } from 'lucide-react';

export default function TasksManager({ 
  tasks = [],
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

  // Form expansion state to save screen real estate
  const [showAddForm, setShowAddForm] = useState(false);

  // Details bottom sheet state
  const [showDetailsSheet, setShowDetailsSheet] = useState(false);
  const [activeTaskIdForDetails, setActiveTaskIdForDetails] = useState(null);
  const [activeTab, setActiveTab] = useState('daily');

  const handleSubmitSimple = (e) => {
    e.preventDefault();
    if (!taskText.trim()) return;

    // Save the text to edit
    const text = taskText;
    const tempId = `task_${Date.now()}`;

    // Set smart defaults
    setTaskPriority('medium');
    setTaskTag('Productivity');
    setTaskDate(selectedDate);
    setTaskTime('');
    setTaskEndTime('');
    setTaskLink('');

    // Trigger parent add task
    handleAddTask(e);

    // Set state for details editing sheet
    setActiveTaskIdForDetails(tempId);
    setEditTaskText(text);
    setEditTaskPriority('medium');
    setEditTaskTag('Productivity');
    setEditTaskTime('');
    setEditTaskEndTime('');
    setEditTaskDate(selectedDate);
    setEditTaskLink('');

    // Open details sheet
    setShowDetailsSheet(true);
  };

  const handleSaveDetails = (e) => {
    e.preventDefault();
    
    // Find the latest added task or matching task text in list to get the real ID
    // Since task ID is generated using Date.now() in handleAddTask, we look for a task added within the last 5 seconds with the same text
    const matchingTask = [...tasks]
      .reverse()
      .find(t => t.text === editTaskText && t.dueDate === selectedDate);

    const targetId = matchingTask ? matchingTask.id : activeTaskIdForDetails;

    if (targetId) {
      onUpdateTask(targetId, {
        priority: editTaskPriority,
        tag: editTaskTag,
        time: editTaskTime,
        endTime: editTaskEndTime,
        dueDate: editTaskDate,
        link: editTaskLink
      });
    }

    setShowDetailsSheet(false);
  };

  return (
    <div className="subpanel-overlay">
      <div className="subpanel-header">
        <span className="subpanel-title">⚡ Tasks & Focus Blocks</span>
      </div>

      {/* Sleek Tab Navigation */}
      <div style={{ 
        display: 'flex', 
        background: 'var(--bg-pill)', 
        padding: '4px', 
        borderRadius: '16px', 
        margin: '0.25rem 0 0.75rem 0',
        border: '1px solid var(--card-border-inner)',
        flexShrink: 0
      }}>
        {[
          { id: 'daily', label: '📋 Tugas Harian' },
          { id: 'focus', label: '⏱️ Fokus' },
          { id: 'history', label: '📊 Riwayat' }
        ].map(tab => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                flex: 1,
                padding: '0.65rem 0.5rem',
                border: 'none',
                background: isActive ? 'var(--card-bg)' : 'transparent',
                color: isActive ? 'var(--text-primary)' : 'var(--text-muted)',
                borderRadius: '12px',
                fontSize: '0.72rem',
                fontWeight: isActive ? 'bold' : 'normal',
                cursor: 'pointer',
                transition: 'all 0.25s ease',
                boxShadow: isActive ? '0 4px 12px rgba(0,0,0,0.05)' : 'none'
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content 1: Daily Tasks (Tugas Harian) */}
      {activeTab === 'daily' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          
          {/* Header Info */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            background: 'var(--bg-pill)', 
            padding: '0.75rem 1rem', 
            borderRadius: '16px', 
            fontSize: '0.8rem' 
          }}>
            <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
              📅 {formatDateHeader(selectedDate)}
            </span>
            <span style={{ 
              fontSize: '0.7rem', 
              background: 'var(--accent-volt-glow)', 
              color: 'var(--accent-volt-dark)', 
              padding: '2px 8px', 
              borderRadius: '20px', 
              fontWeight: 'bold' 
            }}>
              {filteredTasks.length} Tugas
            </span>
          </div>

          {/* Collapsible Form Trigger Button */}
          <button
            type="button"
            onClick={() => setShowAddForm(!showAddForm)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              width: '100%',
              padding: '0.8rem 1rem',
              borderRadius: '16px',
              border: showAddForm ? '1px solid var(--card-border)' : 'none',
              background: showAddForm ? 'var(--bg-pill)' : 'var(--accent-volt)',
              color: showAddForm ? 'var(--text-primary)' : '#000',
              fontSize: '0.8rem',
              fontWeight: 'bold',
              cursor: 'pointer',
              transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
              boxShadow: showAddForm ? 'none' : '0 4px 14px var(--accent-volt-glow)'
            }}
          >
            {showAddForm ? (
              <>
                Tutup Form <ChevronUp size={15} />
              </>
            ) : (
              <>
                Tambah Tugas Baru <ChevronDown size={15} />
              </>
            )}
          </button>

          {/* Premium Multi-Field Task Form (Collapsible) */}
          {showAddForm && (
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                handleAddTask(e);
                setShowAddForm(false); // Collapse form after adding task
              }} 
              style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                gap: '1rem',
                background: 'var(--card-bg)',
                border: '1px solid var(--card-border)',
                padding: '1.25rem',
                borderRadius: '24px',
                boxShadow: 'var(--card-shadow)',
                animation: 'slideDown 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
              }}
            >
              {/* Nama Event */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Nama Event / Tugas
                </label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <input 
                    type="text" 
                    className="task-input" 
                    placeholder="Masukkan nama tugas..."
                    value={taskText}
                    onChange={(e) => setTaskText(e.target.value)}
                    required
                    style={{ width: '100%', paddingRight: '40px' }}
                  />
                  <button 
                    type="button"
                    className="circular-utility-btn"
                    style={{ position: 'absolute', right: '8px', background: 'none', border: 'none', color: 'var(--text-muted)' }}
                    onClick={() => alert('Fitur Asisten Suara (Mic) akan segera hadir!')}
                  >
                    <Mic size={16} />
                  </button>
                </div>
              </div>

              {/* Waktu Mulai & Selesai */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Jam Mulai
                  </label>
                  <input 
                    type="time" 
                    className="select-input" 
                    value={taskTime}
                    onChange={(e) => setTaskTime(e.target.value)}
                    style={{ width: '100%', color: 'var(--text-primary)', fontSize: '0.85rem', padding: '0.75rem 1rem' }}
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Jam Selesai
                  </label>
                  <input 
                    type="time" 
                    className="select-input" 
                    value={taskEndTime}
                    onChange={(e) => setTaskEndTime(e.target.value)}
                    style={{ width: '100%', color: 'var(--text-primary)', fontSize: '0.85rem', padding: '0.75rem 1rem' }}
                  />
                </div>
              </div>

              {/* Link Rapat */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Tautan Rapat / Zoom / Drive (Opsional)
                </label>
                <input 
                  type="url" 
                  className="task-input" 
                  placeholder="https://zoom.us/j/..."
                  value={taskLink}
                  onChange={(e) => setTaskLink(e.target.value)}
                  style={{ width: '100%', fontSize: '0.8rem' }}
                />
              </div>

              {/* Selector Prioritas */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Tingkat Prioritas
                </label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {['low', 'medium', 'high'].map(prio => {
                    const isActive = taskPriority === prio;
                    const prioColors = {
                      low: { bg: 'rgba(34, 197, 94, 0.1)', text: 'rgba(34, 197, 94, 1)' },
                      medium: { bg: 'rgba(249, 115, 22, 0.1)', text: 'rgba(249, 115, 22, 1)' },
                      high: { bg: 'rgba(239, 68, 68, 0.1)', text: 'rgba(239, 68, 68, 1)' }
                    };
                    const activeColor = prioColors[prio];
                    return (
                      <button
                        key={prio}
                        type="button"
                        onClick={() => setTaskPriority(prio)}
                        style={{
                          flex: 1,
                          padding: '0.65rem 0.5rem',
                          background: isActive ? activeColor.bg : 'var(--bg-pill)',
                          color: isActive ? activeColor.text : 'var(--text-secondary)',
                          border: isActive ? `1.5px solid ${activeColor.text}` : '1.5px solid var(--card-border)',
                          borderRadius: '12px',
                          fontSize: '0.75rem',
                          fontWeight: 'bold',
                          cursor: 'pointer',
                          textTransform: 'uppercase',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        {prio}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Selector Tag/Kategori */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Kategori Tugas
                </label>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {['Productivity', 'Health', 'Finance', 'Growth', 'Social'].map(tag => {
                    const isActive = taskTag === tag;
                    const tagColors = {
                      Productivity: { bg: 'rgba(168, 85, 247, 0.1)', text: 'rgba(168, 85, 247, 1)' },
                      Health: { bg: 'rgba(34, 197, 94, 0.1)', text: 'rgba(34, 197, 94, 1)' },
                      Finance: { bg: 'rgba(6, 182, 212, 0.1)', text: 'var(--accent-cyan)' },
                      Growth: { bg: 'rgba(249, 115, 22, 0.1)', text: 'rgba(249, 115, 22, 1)' },
                      Social: { bg: 'rgba(244, 63, 94, 0.1)', text: 'rgba(244, 63, 94, 1)' }
                    };
                    const activeColor = tagColors[tag] || { bg: 'rgba(255,255,255,0.1)', text: '#fff' };
                    return (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => setTaskTag(tag)}
                        style={{
                          padding: '0.5rem 0.75rem',
                          background: isActive ? activeColor.bg : 'var(--bg-pill)',
                          color: isActive ? activeColor.text : 'var(--text-secondary)',
                          border: isActive ? `1.5px solid ${activeColor.text}` : '1.5px solid var(--card-border)',
                          borderRadius: '12px',
                          fontSize: '0.7rem',
                          fontWeight: 'bold',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        {tag}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                style={{
                  marginTop: '0.5rem',
                  padding: '0.85rem',
                  background: 'var(--accent-volt)',
                  color: '#000',
                  border: 'none',
                  borderRadius: '14px',
                  fontSize: '0.85rem',
                  fontWeight: '900',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 4px 15px var(--accent-volt-glow)'
                }}
              >
                🚀 Simpan & Tambahkan Tugas
              </button>
            </form>
          )}

          {/* List filtered Tasks */}
          <div className="section-label-row" style={{ marginTop: '0.25rem', marginBottom: '0.1rem' }}>
            <span className="section-title-label" style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              📋 LIST TUGAS HARI INI
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', paddingBottom: '10px' }}>
            {filteredTasks.map(t => {
              const isEditing = editingTaskId === t.id;
              return (
                <div className={`recent-row-item ${t.status === 'completed' ? 'completed' : ''}`} key={t.id} style={{ opacity: t.status === 'completed' ? 0.6 : 1, padding: '0.85rem 1rem' }}>
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
                          style={{ flex: '1 1 80px', padding: '4px', fontSize: '0.7rem', color: 'var(--text-primary)' }}
                        >
                          <option value="low">Low</option>
                          <option value="medium">Medium</option>
                          <option value="high">High</option>
                        </select>
                        <select 
                          className="select-input" 
                          value={editTaskTag} 
                          onChange={(e) => setEditTaskTag(e.target.value)}
                          style={{ flex: '1 1 100px', padding: '4px', fontSize: '0.7rem', color: 'var(--text-primary)' }}
                        >
                          <option value="Productivity">Productivity</option>
                          <option value="Health">Health</option>
                          <option value="Finance">Finance</option>
                          <option value="Growth">Growth</option>
                          <option value="Social">Social</option>
                        </select>
                        <input 
                          type="time" 
                          className="select-input" 
                          value={editTaskTime} 
                          onChange={(e) => setEditTaskTime(e.target.value)}
                          style={{ flex: '1 1 80px', padding: '4px', fontSize: '0.7rem', color: 'var(--text-primary)' }}
                        />
                        <input 
                          type="time" 
                          className="select-input" 
                          value={editTaskEndTime} 
                          onChange={(e) => setEditTaskEndTime(e.target.value)}
                          style={{ flex: '1 1 80px', padding: '4px', fontSize: '0.7rem', color: 'var(--text-primary)' }}
                        />
                        <input 
                          type="date" 
                          className="select-input" 
                          value={editTaskDate} 
                          onChange={(e) => setEditTaskDate(e.target.value)}
                          style={{ flex: '1 1 100px', padding: '4px', fontSize: '0.7rem', color: 'var(--text-primary)' }}
                        />
                      </div>
                      <div style={{ display: 'flex', gap: '4px', marginTop: '4px' }}>
                        <button type="submit" className="section-subtitle-btn" style={{ background: 'var(--accent-volt)', color: '#000', padding: '4px 10px', borderRadius: '6px', fontWeight: 'bold' }}>Simpan</button>
                        <button type="button" className="section-subtitle-btn" onClick={() => setEditingTaskId(null)} style={{ background: 'var(--bg-pill)', color: 'var(--text-primary)', padding: '4px 10px', borderRadius: '6px' }}>Batal</button>
                      </div>
                    </form>
                  ) : (
                    <>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flex: 1, overflow: 'hidden' }}>
                        <div 
                          style={{ 
                            width: '18px', 
                            height: '18px', 
                            border: '2px solid var(--text-secondary)', 
                            borderRadius: '6px', 
                            background: t.status === 'completed' ? 'var(--accent-volt)' : 'none', 
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer', 
                            flexShrink: 0 
                          }}
                          onClick={() => toggleTaskStatus(t.id)}
                        >
                          {t.status === 'completed' && <Check size={12} color="#000" strokeWidth={3} />}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                            <span style={{ 
                              fontSize: '0.8rem', 
                              fontWeight: 600, 
                              textDecoration: t.status === 'completed' ? 'line-through' : 'none', 
                              color: 'var(--text-primary)', 
                              overflow: 'hidden', 
                              textOverflow: 'ellipsis', 
                              maxWidth: '100%' 
                            }}>
                              {t.text}
                            </span>
                            {(t.time || t.endTime) && (
                              <span style={{ fontSize: '0.62rem', color: 'var(--accent-orange)', fontWeight: 'bold', background: 'var(--bg-pill)', padding: '1px 6px', borderRadius: '4px', whiteSpace: 'nowrap' }}>
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
                                    fontSize: '0.58rem', 
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
                          <span style={{ fontSize: '0.62rem', color: 'var(--text-secondary)' }}>
                            📅 {t.dueDate || selectedDate} • <span style={{ color: 'var(--accent-purple)', fontWeight: 'bold' }}>{t.tag}</span> • Snooze: {t.snoozeCount || 0}
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
                            <Clock size={12} />
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
                          <Edit2 size={12} />
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
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              );
            })}
            {filteredTasks.length === 0 && (
              <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                🏝️ Belum ada tugas untuk hari ini.
              </div>
            )}
          </div>

          {/* AI Task Recommendation Card */}
          {(() => {
            const pending = filteredTasks.filter(t => t.status === 'pending');
            if (pending.length === 0) return null;

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
                  <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>
                    Urgent & Rumit ({topTask.priority} priority • {topTask.snoozeCount} snoozes)
                  </span>
                  <button 
                    type="button"
                    onClick={() => {
                      onSelectFocusTask(topTask);
                      setActiveTab('focus'); // Auto navigate to timer tab when clicked
                    }}
                    className="section-subtitle-btn animate-pulse"
                    style={{ fontSize: '0.65rem', padding: '4px 8px', borderRadius: '8px', border: '1px solid var(--accent-purple)', background: 'rgba(139, 92, 246, 0.08)', fontWeight: 'bold' }}
                  >
                    Fokus Sekarang ⏱️
                  </button>
                </div>
              </div>
            );
          })()}


          {/* AI Daily Activity Summary Section */}
          {dailySummary && (
            <div className="glass-panel volt-card" style={{ borderLeft: '4px solid var(--accent-purple)', background: 'var(--bg-pill)', display: 'flex', flexDirection: 'column', gap: '6px', paddingBottom: '20px', marginTop: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '1rem' }}>🧠</span>
                <strong style={{ fontSize: '0.75rem', color: 'var(--accent-purple)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>AI Rangkuman Hari Ini</strong>
              </div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-primary)', lineHeight: '1.45', margin: 0 }}>
                {dailySummary.summary}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Tab Content 2: Focus Timer (Fokus) */}
      {activeTab === 'focus' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Focus Block Timer Widget */}
          <div className="glass-panel volt-card" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', textAlign: 'center', marginTop: '0.5rem' }}>
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
        </div>
      )}

      {/* Tab Content 3: History (Riwayat Seluruh Tanggal) */}
      {activeTab === 'history' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Dedicated Tasks Tracking History */}
          <div className="glass-panel volt-card" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', paddingBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '1rem' }}>📈</span>
              <strong style={{ fontSize: '0.75rem', color: 'var(--accent-volt-dark)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Tracking & Riwayat Tugas Seluruh Tanggal</strong>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', maxHeight: '380px', overflowY: 'auto', paddingRight: '4px' }}>
              {(() => {
                const allTasksSorted = [...(tasks || [])]
                  .filter(t => t && typeof t === 'object' && t.dueDate && typeof t.dueDate === 'string')
                  .sort((a, b) => b.dueDate.localeCompare(a.dueDate));
                if (allTasksSorted.length === 0) {
                  return <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', margin: 0, fontStyle: 'italic' }}>Belum ada data tugas sama sekali.</p>;
                }
                return allTasksSorted.map(t => {
                  const isCompleted = t.status === 'completed';
                  return (
                    <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.02)', padding: '0.45rem 0.65rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.03)' }}>
                      <div style={{
                        width: '12px',
                        height: '12px',
                        borderRadius: '3px',
                        border: isCompleted ? 'none' : '1px solid var(--text-muted)',
                        background: isCompleted ? 'var(--accent-volt)' : 'transparent',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#000',
                        fontSize: '0.48rem',
                        fontWeight: 'bold'
                      }}>
                        {isCompleted && "✓"}
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
                        <span style={{
                          fontSize: '0.72rem',
                          color: isCompleted ? 'var(--text-muted)' : 'var(--text-primary)',
                          textDecoration: isCompleted ? 'line-through' : 'none',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden'
                        }}>
                          {t.text}
                        </span>
                        <span style={{ fontSize: '0.6rem', color: 'var(--text-secondary)' }}>
                          Tanggal: {formatDateHeader(t.dueDate)} {t.time && `| Waktu: ${t.time}`}
                        </span>
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          </div>
        </div>
      )}

      {/* Task Details Bottom Sheet Overlay */}
      {showDetailsSheet && (
        <div className="chat-drawer-overlay" onClick={() => setShowDetailsSheet(false)} style={{ zIndex: 5000 }}>
          <div 
            className="chat-drawer-sheet" 
            onClick={(e) => e.stopPropagation()} 
            style={{ height: 'auto', maxHeight: '80%', padding: '1.5rem', borderRadius: '30px 30px 0 0' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div>
                <h3 style={{ fontSize: '1rem', fontWeight: 800 }}>⚡ Detail Tugas Baru</h3>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{editTaskText}</span>
              </div>
              <button className="circular-utility-btn" onClick={() => setShowDetailsSheet(false)}>
                <X size={14} />
              </button>
            </div>

            <form onSubmit={handleSaveDetails} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              
              {/* 2-column grid layout using existing styles */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                
                {/* Column 1 */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div>
                    <label style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>PRIORITAS</label>
                    <select 
                      className="select-input"
                      value={editTaskPriority}
                      onChange={(e) => setEditTaskPriority(e.target.value)}
                      style={{ width: '100%', fontSize: '0.8rem' }}
                    >
                      <option value="high">High</option>
                      <option value="medium">Medium</option>
                      <option value="low">Low</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>KATEGORI</label>
                    <select 
                      className="select-input"
                      value={editTaskTag}
                      onChange={(e) => setEditTaskTag(e.target.value)}
                      style={{ width: '100%', fontSize: '0.8rem' }}
                    >
                      <option value="Productivity">Productivity</option>
                      <option value="Health">Health</option>
                      <option value="Finance">Finance</option>
                      <option value="Growth">Growth</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>TANGGAL DEADLINE</label>
                    <input 
                      type="date" 
                      className="select-input"
                      value={editTaskDate} 
                      onChange={(e) => setEditTaskDate(e.target.value)}
                      style={{ width: '100%', color: 'var(--text-primary)', fontSize: '0.8rem' }}
                      required
                    />
                  </div>
                </div>

                {/* Column 2 */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div>
                    <label style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>RENTANG WAKTU (MULAI)</label>
                    <input 
                      type="time" 
                      className="select-input" 
                      value={editTaskTime} 
                      onChange={(e) => setEditTaskTime(e.target.value)}
                      style={{ width: '100%', color: 'var(--text-primary)', fontSize: '0.8rem' }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>RENTANG WAKTU (SELESAI)</label>
                    <input 
                      type="time" 
                      className="select-input" 
                      value={editTaskEndTime} 
                      onChange={(e) => setEditTaskEndTime(e.target.value)}
                      style={{ width: '100%', color: 'var(--text-primary)', fontSize: '0.8rem' }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>TAUTAN RAPAT / ZOOM</label>
                    <input 
                      type="url" 
                      className="task-input" 
                      placeholder="https://..."
                      value={editTaskLink}
                      onChange={(e) => setEditTaskLink(e.target.value)}
                      style={{ width: '100%', fontSize: '0.8rem' }}
                    />
                  </div>
                </div>

              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                <button 
                  type="submit" 
                  className="primary-btn" 
                  style={{ flex: 1, padding: '10px', borderRadius: '12px', fontWeight: 'bold', background: 'var(--accent-volt)', color: '#000' }}
                >
                  Simpan Detail
                </button>
                <button 
                  type="button" 
                  className="primary-btn" 
                  onClick={() => setShowDetailsSheet(false)}
                  style={{ flex: 1, padding: '10px', borderRadius: '12px', background: 'var(--bg-pill)', color: 'var(--text-primary)', border: '1px solid var(--card-border-inner)' }}
                >
                  Lewati
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
