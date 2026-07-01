import useAnimatedProgress from '../hooks/useAnimatedProgress';
import './PostCard.css';

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

const getStatusLabel = (status) => {
  switch (status.toLowerCase()) {
    case 'rascunho': return 'RASCUNHO';
    case 'pendente': return 'PENDENTE';
    case 'aprovado': return 'APROVADO';
    case 'agendado': return 'AGENDADO';
    case 'postando': return 'POSTANDO';
    case 'publicado': return 'PUBLICADO';
    case 'sucesso': return 'SUCESSO';
    case 'erro': return 'ERRO';
    default: return status.toUpperCase();
  }
};

const getProgressLabel = (progress, status) => {
  if (['publicado', 'sucesso'].includes(status.toLowerCase())) return 'Concluído';
  if (status.toLowerCase() === 'erro') return 'Falhou';
  if (progress >= 75) return 'Processando mídia...';
  if (progress >= 50) return 'Publicando...';
  if (progress >= 25) return 'Aguardando horário...';
  if (progress >= 10) return 'Configurando...';
  if (progress > 0) return 'Iniciando...';
  return 'Aguardando';
};

const PostCard = ({ post, index, onDelete }) => {
  const animationDelay = `${index * 0.1}s`;
  // Pass REAL progress from Google Sheet to the animated hook
  const progress = useAnimatedProgress(post.progress || 0, post.status);
  const color = getStatusColor(post.status);
  const isActive = ['postando', 'agendado', 'aprovado'].includes(post.status.toLowerCase());
  const isComplete = ['publicado', 'sucesso'].includes(post.status.toLowerCase());

  return (
    <div 
      className="post-card glass-panel animate-fade-in" 
      style={{ animationDelay }}
    >
      <div className="post-header">
        <h3 className="post-title">{post.title || "Post Sem Título"}</h3>
        <div className="post-header-actions">
          <span 
            className={`post-status ${isActive ? 'status-active' : ''}`}
            style={{ 
              borderColor: color, 
              color: color,
              boxShadow: isActive ? `0 0 10px ${color}40` : 'none'
            }}
          >
            {isActive && <span className="status-dot" style={{ backgroundColor: color }}></span>}
            {getStatusLabel(post.status)}
          </span>
          <button 
            className="delete-post-btn" 
            onClick={onDelete}
            title="Ocultar post"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 6h18"></path>
              <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
              <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
            </svg>
          </button>
        </div>
      </div>
      
      <div className="post-details">
        <div className="detail-item">
          <span className="detail-label">Plataforma:</span>
          <span className="detail-value">{post.platform}</span>
        </div>
        <div className="detail-item">
          <span className="detail-label">Data Agendada:</span>
          <span className="detail-value">{post.scheduledDate}</span>
        </div>
        {post.client && (
          <div className="detail-item">
            <span className="detail-label">Cliente:</span>
            <span className="detail-value">{post.client}</span>
          </div>
        )}
        {post.postType && (
          <div className="detail-item">
            <span className="detail-label">Tipo:</span>
            <span className="detail-value">{post.postType}</span>
          </div>
        )}
      </div>

      <div className="post-footer">
        {post.errorMessage ? (
          <p className="error-message">{post.errorMessage}</p>
        ) : (
          <>
            <div className="progress-info">
              <span className="progress-label">
                {getProgressLabel(progress, post.status)}
              </span>
              <span className="progress-percent" style={{ color }}>
                {Math.round(progress)}%
              </span>
            </div>
            <div className="progress-container">
              <div 
                className={`progress-bar ${isActive ? 'progress-bar-animated' : ''} ${isComplete ? 'progress-bar-complete' : ''}`}
                style={{ 
                  width: `${progress}%`,
                  backgroundColor: color,
                }}
              >
                {isActive && <div className="progress-bar-shine"></div>}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default PostCard;
