import React from 'react';
import './ListView.css';

const getStatusColor = (status) => {
  switch (status.toLowerCase()) {
    case 'rascunho': 
    case 'pendente': return 'var(--status-pending)';
    case 'aprovado': 
    case 'agendado': return 'var(--status-posting)';
    case 'postando': return 'var(--status-posting)';
    case 'sucesso': 
    case 'publicado': return 'var(--status-success)';
    case 'erro': return 'var(--status-error)';
    default: return 'var(--text-secondary)';
  }
};

const getPlatformIcon = (platform) => {
  const p = platform.toLowerCase();
  if (p === 'instagram') return <><i className="bi bi-instagram" style={{ color: '#E1306C' }}></i> Instagram</>;
  if (p === 'facebook') return <><i className="bi bi-facebook" style={{ color: '#1877F2' }}></i> Facebook</>;
  if (p === 'ambos') return <><i className="bi bi-arrow-repeat" style={{ color: '#10B981' }}></i> Ambos</>;
  return <><i className="bi bi-phone"></i> {platform}</>;
};

const ListView = ({ posts, onDelete, onPreview }) => {
  if (!posts || posts.length === 0) return null;

  return (
    <div className="list-view-container animate-fade-in">
      <table className="list-view-table">
        <thead>
          <tr>
            <th>Postagem</th>
            <th>Cliente</th>
            <th>Plataforma</th>
            <th>Data Agendada</th>
            <th>Status</th>
            <th style={{ textAlign: 'right' }}>Ações</th>
          </tr>
        </thead>
        <tbody>
          {posts.map((post) => {
            const color = getStatusColor(post.status);
            const isActive = ['postando', 'agendado', 'aprovado'].includes(post.status.toLowerCase());
            
            return (
              <tr key={post.id}>
                <td className="list-col-title">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {post.title || `Post do tipo ${post.type || 'Imagem'}`}
                    {post.errorMessage && (
                      <i 
                        className="bi bi-exclamation-circle-fill" 
                        style={{ color: 'var(--status-error)', cursor: 'help' }}
                        title={post.errorMessage}
                      ></i>
                    )}
                  </div>
                </td>
                <td className="list-col-client">
                  {post.client}
                </td>
                <td>
                  <span className="list-platform-icon">
                    {getPlatformIcon(post.platform)}
                  </span>
                </td>
                <td className="list-date">
                  {post.scheduledDate || 'Sem data'}
                </td>
                <td>
                  <span 
                    className="list-status-badge"
                    style={{ 
                      backgroundColor: `${color}1A`, // 10% opacity for background
                      color: color,
                      border: `1px solid ${color}40`,
                      boxShadow: isActive ? `0 0 10px ${color}30` : 'none'
                    }}
                  >
                    {post.status.toUpperCase()}
                  </span>
                </td>
                <td>
                  <div className="list-actions">
                    <button 
                      className="list-action-btn" 
                      onClick={() => onPreview(post)}
                      title="Pré-visualizar Post"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                        <circle cx="12" cy="12" r="3"></circle>
                      </svg>
                    </button>
                    <button 
                      className="list-action-btn" 
                      onClick={() => onDelete(post.id)}
                      title="Ocultar post"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 6h18"></path>
                        <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                        <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default ListView;
