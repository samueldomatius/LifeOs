import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function CalendarWidget({ history, selectedDate, tasks, finances = [], handleSelectCalendarDay }) {
  // Parse month and year from selectedDate, fallback to current local date
  const [currentMonth, setCurrentMonth] = useState(() => {
    const parts = selectedDate.split('-');
    return parts.length === 3 ? parseInt(parts[1], 10) - 1 : new Date().getMonth();
  });
  
  const [currentYear, setCurrentYear] = useState(() => {
    const parts = selectedDate.split('-');
    return parts.length === 3 ? parseInt(parts[0], 10) : new Date().getFullYear();
  });

  const monthNames = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni", 
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
  ];

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  // Days in month calculation
  const totalDays = new Date(currentYear, currentMonth + 1, 0).getDate();
  
  // Starting day of the week offset (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
  const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay();
  // Adjust offset so Monday is the first column SN (Senin)
  // JS Sun=0 -> Sun Offset=6, Mon=1 -> Mon Offset=0, Tue=2 -> Tue Offset=1, etc.
  const dayOffset = firstDayIndex === 0 ? 6 : firstDayIndex - 1;

  return (
    <section className="calendar-habit-card glass-panel volt-card">
      <div className="calendar-header-block" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        
        {/* Month Navigation Control Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
          <span className="calendar-month-name" style={{ fontSize: '0.95rem', fontWeight: '800' }}>
            {monthNames[currentMonth]} {currentYear}
          </span>
          <div style={{ display: 'flex', gap: '6px' }}>
            <button 
              type="button"
              className="circular-utility-btn" 
              onClick={handlePrevMonth}
              style={{ width: '28px', height: '28px' }}
            >
              <ChevronLeft size={14} />
            </button>
            <button 
              type="button"
              className="circular-utility-btn" 
              onClick={handleNextMonth}
              style={{ width: '28px', height: '28px' }}
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>

        <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: '1.4', margin: 0 }}>
          Klik tanggal untuk memfilter tugas hari itu. Titik di bawah tanggal menandakan kategori event tugas terdaftar!
        </p>
      </div>
      
      <div className="calendar-days-grid" style={{ marginTop: '0.75rem' }}>
        
        {/* Weekday headers starting Monday */}
        {['SN', 'SL', 'RB', 'KM', 'JM', 'SB', 'MG'].map(d => (
          <div className="calendar-weekday-header" key={d}>{d}</div>
        ))}

        {/* Dynamic starting offset spacer */}
        {dayOffset > 0 && (
          <div style={{ gridColumn: `span ${dayOffset}` }}></div>
        )}

        {/* Render dynamic days in this month */}
        {Array.from({ length: totalDays }).map((_, idx) => {
          const dayNum = idx + 1;
          const dateStr = `${currentYear}-${(currentMonth + 1).toString().padStart(2, '0')}-${dayNum.toString().padStart(2, '0')}`;
          
          const isSeededRange = false;
          const historyIndex = null;
          
          const isSelected = selectedDate === dateStr;
          const dayTasks = tasks.filter(t => t.dueDate === dateStr);
          
          return (
            <div 
              className={`calendar-day-node ${isSelected ? 'active-selected' : ''}`}
              key={idx}
              onClick={() => handleSelectCalendarDay(isSeededRange, historyIndex, dayNum, dateStr)}
              style={{ cursor: 'pointer' }}
            >
              <span className="day-number-label">{dayNum}</span>
              
              {/* Dynamic colored dots representing events on this day */}
              {dayTasks.length > 0 && (
                <div className="calendar-dots-row">
                  {dayTasks.some(t => t.tag === 'Productivity') && <span className="calendar-dot-marker productivity" />}
                  {dayTasks.some(t => t.tag === 'Health') && <span className="calendar-dot-marker health" />}
                  {dayTasks.some(t => t.tag === 'Finance') && <span className="calendar-dot-marker finance" />}
                  {dayTasks.some(t => t.tag === 'Growth' || t.tag === 'Social') && <span className="calendar-dot-marker growth" />}
                </div>
              )}
            </div>
          );
        })}

      </div>

      {/* Small selected date tasks & transactions summary pop-up inside calendar */}
      {(() => {
        const selectedDayTasks = tasks.filter(t => t.dueDate === selectedDate);
        const selectedDayFinances = finances.filter(f => f.date === selectedDate);
        if (selectedDayTasks.length === 0 && selectedDayFinances.length === 0) return null;
        
        const completedCount = selectedDayTasks.filter(t => t.status === 'completed').length;
        const pendingCount = selectedDayTasks.filter(t => t.status === 'pending').length;
        
        const totalIncome = selectedDayFinances.filter(f => f.type === 'income').reduce((sum, f) => sum + f.amount, 0);
        const totalExpense = selectedDayFinances.filter(f => f.type === 'expense').reduce((sum, f) => sum + f.amount, 0);
        
        const dayNames = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
        const dayName = dayNames[new Date(selectedDate).getDay()] || "Hari Ini";
        
        return (
          <div style={{
            marginTop: '0.85rem',
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid rgba(255, 255, 255, 0.06)',
            borderRadius: '14px',
            padding: '10px 12px',
            fontSize: '0.7rem',
            animation: 'scalePopIn 0.25s ease-out'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', color: '#fff', marginBottom: '6px' }}>
              <span>📝 Ringkasan Hari ({dayName}):</span>
              <span style={{ color: 'var(--accent-volt)' }}>
                {completedCount} Selesai | {pendingCount} Pending
              </span>
            </div>

            {selectedDayTasks.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '70px', overflowY: 'auto', paddingRight: '4px', marginBottom: selectedDayFinances.length > 0 ? '8px' : '0' }}>
                {selectedDayTasks.map(t => (
                  <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: '6px', color: t.status === 'completed' ? 'var(--text-muted)' : 'var(--text-primary)' }}>
                    <span style={{ color: t.status === 'completed' ? 'var(--accent-volt)' : 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1 }}>•</span>
                    <span style={{ textDecoration: t.status === 'completed' ? 'line-through' : 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {t.text}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {selectedDayFinances.length > 0 && (
              <div style={{ borderTop: selectedDayTasks.length > 0 ? '1px dashed rgba(255, 255, 255, 0.06)' : 'none', paddingTop: selectedDayTasks.length > 0 ? '6px' : '0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)', marginBottom: '4px', fontWeight: 'bold', fontSize: '0.65rem' }}>
                  <span>💰 Transaksi Keuangan:</span>
                  <span>
                    {totalIncome > 0 && <span style={{ color: 'var(--accent-volt)', marginRight: '6px' }}>+{totalIncome.toLocaleString('id-ID')}</span>}
                    {totalExpense > 0 && <span style={{ color: 'var(--accent-coral)' }}>-{totalExpense.toLocaleString('id-ID')}</span>}
                  </span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', maxHeight: '60px', overflowY: 'auto', paddingRight: '4px', fontSize: '0.65rem' }}>
                  {selectedDayFinances.map(f => (
                    <div key={f.id} style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-primary)' }}>
                      <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: '65%' }}>{f.description}</span>
                      <span style={{ color: f.type === 'income' ? 'var(--accent-volt)' : 'var(--accent-coral)' }}>
                        {f.type === 'income' ? '+' : '-'}Rp {f.amount.toLocaleString('id-ID')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })()}
    </section>
  );
}
