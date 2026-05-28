import React from 'react';
import { X, Send, Sparkles, User } from 'lucide-react';

export default function AiChatCompanion({ 
  aiChatOpen, 
  setAiChatOpen, 
  chatHistory, 
  chatInput, 
  setChatInput, 
  handleSendChatMessage, 
  handleAcceptAIAction, 
  chatBottomRef 
}) {
  if (!aiChatOpen) return null;

  return (
    <div className="chat-drawer-overlay" onClick={() => setAiChatOpen(false)}>
      <div className="chat-drawer-sheet" onClick={(e) => e.stopPropagation()}>
        
        <div className="drawer-drag-pill"></div>

        <div className="drawer-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div className="logo-v-icon">AI</div>
            <div>
              <h3 style={{ fontSize: '0.95rem', fontWeight: '800' }}>AI Advisor Chat</h3>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Proaktif & Lintas-Dimensi</span>
            </div>
          </div>
          <button className="circular-utility-btn" onClick={() => setAiChatOpen(false)}>
            <X size={14} />
          </button>
        </div>

        {/* Chat messages */}
        <div className="chat-messages-scroll-block">
          {chatHistory.map((c, idx) => {
            const isAi = c.sender === 'ai';
            return (
              <div 
                className={`chat-message-row ${isAi ? 'ai-row' : 'user-row'}`} 
                key={c.id || idx}
                style={{
                  display: 'flex',
                  gap: '10px',
                  alignItems: 'flex-start',
                  width: '100%',
                  justifyContent: isAi ? 'flex-start' : 'flex-end',
                  margin: '8px 0',
                  animation: 'messageBounce 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
                }}
              >
                {/* AI Avatar on the left */}
                {isAi && (
                  <div className="chat-avatar ai" style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #c084fc, #8b5cf6)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    flexShrink: 0,
                    boxShadow: '0 4px 10px rgba(139, 92, 246, 0.3)'
                  }}>
                    <Sparkles size={14} />
                  </div>
                )}

                {/* Message Bubble Container */}
                <div 
                  className={`chat-bubble-card ${isAi ? 'ai-bubble' : 'user-bubble'}`} 
                  style={{
                    flex: '0 1 82%',
                    background: isAi ? '#1c1a24' : '#203a5c', // Obsidian dark for AI, Slate blue for User
                    border: isAi ? '1px solid rgba(255,255,255,0.03)' : '1px solid rgba(255,255,255,0.05)',
                    borderRadius: '20px',
                    padding: '12px 16px',
                    borderTopLeftRadius: isAi ? '4px' : '20px',
                    borderTopRightRadius: isAi ? '20px' : '4px',
                    color: '#fff',
                    boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
                  }}
                >
                  {/* Header Line */}
                  <div style={{ 
                    fontSize: '0.7rem', 
                    color: isAi ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.6)', 
                    fontWeight: 'bold', 
                    marginBottom: '6px',
                    display: 'flex',
                    justifyContent: 'space-between'
                  }}>
                    <span>{isAi ? 'AI' : 'Kamu'} — {c.timestamp || '07.00'}</span>
                  </div>

                  {/* Body Text */}
                  <p 
                    style={{ fontSize: '0.8rem', color: '#fff', lineHeight: '1.45', margin: 0 }}
                    dangerouslySetInnerHTML={{ 
                      __html: c.text
                        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                        .replace(/\*(.*?)\*/g, '<em>$1</em>')
                        .replace(/\n/g, '<br />')
                    }} 
                  />

                  {/* Action block if present */}
                  {c.suggestedAction && (
                    <div className="ai-action-card" style={{ marginTop: '10px', background: 'rgba(255,255,255,0.04)', padding: '10px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                      <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.7)', display: 'block', marginBottom: '6px', lineHeight: '1.3' }}>
                        🤖 <strong>Tindakan Proaktif AI:</strong>
                        <br />
                        {c.suggestedAction.type === 'AUTO_RESCHEDULE_TIRED' 
                          ? 'AI menyarankan penundaan tugas berat & penambahan micro-break.' 
                          : 'AI menyarankan memecah tugas besar yang sering ditunda.'}
                      </span>
                      <button 
                        type="button"
                        className="action-card-btn"
                        onClick={() => handleAcceptAIAction(c.suggestedAction)}
                        style={{ background: '#fff', color: '#000', border: 'none', borderRadius: '8px', padding: '6px 12px', fontSize: '0.7rem', fontWeight: 'bold', cursor: 'pointer', width: '100%' }}
                      >
                        Setujui Rekomendasi
                      </button>
                    </div>
                  )}
                </div>

                {/* User Avatar on the right */}
                {!isAi && (
                  <div className="chat-avatar user" style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: '#319795', // Teal avatar matching the screenshot
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    flexShrink: 0,
                    boxShadow: '0 4px 10px rgba(49, 151, 149, 0.3)'
                  }}>
                    <User size={14} />
                  </div>
                )}
              </div>
            );
          })}
          <div ref={chatBottomRef} />
        </div>

        {/* Send bar */}
        <form onSubmit={handleSendChatMessage} className="drawer-chat-input-bar">
          <input 
            type="text" 
            className="chat-input-field task-input" 
            placeholder="Ketik capek banget / olahraga / beli kopi 25000..."
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            style={{ fontSize: '0.85rem' }}
          />
          <button type="submit" className="primary-btn" style={{ padding: '0.85rem 1.2rem' }}>
            <Send size={14} />
          </button>
        </form>

      </div>
    </div>
  );
}
