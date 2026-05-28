import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  handleReset = () => {
    localStorage.clear();
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          maxWidth: '480px',
          margin: '0 auto',
          padding: '2rem',
          minHeight: '100vh',
          background: '#07050d',
          color: '#f8fafc',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          textAlign: 'center',
          fontFamily: 'sans-serif'
        }}>
          <h2 style={{ color: '#ff477e', marginBottom: '1rem' }}>Ups! Terjadi Kesalahan Render 😰</h2>
          <p style={{ fontSize: '0.9rem', color: '#94a3b8', marginBottom: '2rem', lineHeight: '1.5' }}>
            Ada data yang tidak valid di penyimpanan browser Anda atau terjadi kesalahan sistem.
          </p>
          <div style={{
            background: 'rgba(255,255,255,0.05)',
            padding: '1rem',
            borderRadius: '12px',
            fontSize: '0.8rem',
            textAlign: 'left',
            fontFamily: 'monospace',
            marginBottom: '2rem',
            overflowX: 'auto',
            width: '100%',
            color: '#fb923c'
          }}>
            {this.state.error && this.state.error.toString()}
          </div>
          <button 
            onClick={this.handleReset}
            style={{
              background: '#bbee00',
              color: '#000',
              border: 'none',
              padding: '0.75rem 1.5rem',
              borderRadius: '25px',
              fontWeight: 'bold',
              cursor: 'pointer',
              fontSize: '0.9rem',
              boxShadow: '0 8px 25px rgba(187, 238, 0, 0.4)'
            }}
          >
            Reset Data & Muat Ulang
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
