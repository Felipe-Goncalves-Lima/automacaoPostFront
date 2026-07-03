import React, { useEffect, useState } from 'react';
import './PreviewModal.css';

const DEFAULT_IMAGE = "https://images.unsplash.com/photo-1611162617474-5b21e879e113?q=80&w=600&auto=format&fit=crop";

const getImageUrl = (url) => {
  if (!url) return DEFAULT_IMAGE;
  const driveMatch = url.match(/\/d\/([a-zA-Z0-9_-]+)/) || url.match(/id=([a-zA-Z0-9_-]+)/);
  if (driveMatch) {
    return `https://lh3.googleusercontent.com/d/${driveMatch[1]}`;
  }
  return url;
};

const PreviewModal = ({ post, onClose }) => {
  const [ambosView, setAmbosView] = useState('instagram');
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    setAmbosView('instagram');
    setCurrentImageIndex(0);
  }, [post?.id]);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  if (!post) return null;

  const platform = post.platform?.toLowerCase() || '';
  const isAmbos = platform === 'ambos';
  const isFacebook = platform === 'facebook' || (isAmbos && ambosView === 'facebook');
  
  const username = post.client || "Nome do Cliente";
  const caption = post.fullCaption || post.title || "Exemplo de legenda fantástica que o seu cliente preparou para esta publicação.";
  
  const imageLinks = post.imageLinks && post.imageLinks.length > 0 ? post.imageLinks : [];
  const rawImageUrl = imageLinks[currentImageIndex] || null;
  const imageUrl = getImageUrl(rawImageUrl);

  const hasMultipleImages = imageLinks.length > 1;

  const nextImage = (e) => {
    e.stopPropagation();
    if (currentImageIndex < imageLinks.length - 1) {
      setCurrentImageIndex(prev => prev + 1);
    }
  };

  const prevImage = (e) => {
    e.stopPropagation();
    if (currentImageIndex > 0) {
      setCurrentImageIndex(prev => prev - 1);
    }
  };
  const isLongCaption = caption.length > 80;
  const shortCaption = isLongCaption ? caption.substring(0, 80) + '...' : caption;

  return (
    <div className="preview-modal-overlay" onClick={onClose}>
      {isAmbos && (
        <div className="ambos-switcher" onClick={e => e.stopPropagation()}>
          <button 
            className={`switcher-btn ${ambosView === 'facebook' ? 'active' : ''}`}
            onClick={() => setAmbosView('facebook')}
          >
            Facebook
          </button>
          <button 
            className={`switcher-btn ${ambosView === 'instagram' ? 'active' : ''}`}
            onClick={() => setAmbosView('instagram')}
          >
            Instagram
          </button>
        </div>
      )}

      <div className="preview-modal-content" onClick={e => e.stopPropagation()}>
        <button className="preview-close-btn" onClick={onClose}>✕</button>

        {isFacebook ? (
          <div className="mockup-facebook">
            <div className="fb-card">
              <div className="fb-header">
                <div className="fb-avatar">
                  <img src="https://ui-avatars.com/api/?name=Cliente+F&background=random" alt="avatar" />
                </div>
                <div className="fb-info">
                  <h4 className="fb-name">{username}</h4>
                  <p className="fb-sub">
                    Agora mesmo · 
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"></path></svg>
                  </p>
                </div>
              </div>
              
              <div className="fb-caption">
                {caption}
              </div>

              <div className="fb-image-container" style={{ position: 'relative' }}>
                {hasMultipleImages ? (
                  <div className={`fb-grid fb-grid-${Math.min(imageLinks.length, 5)}`}>
                    {imageLinks.slice(0, 4).map((link, i) => (
                      <div key={i} className="fb-grid-item">
                        <img src={getImageUrl(link)} alt={`Preview ${i}`} referrerPolicy="no-referrer" onError={(e) => e.target.src = DEFAULT_IMAGE} />
                        {imageLinks.length > 4 && i === 3 && (
                          <div className="fb-grid-more">+{imageLinks.length - 4}</div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <img src={imageUrl} alt="Post preview" referrerPolicy="no-referrer" onError={(e) => e.target.src = DEFAULT_IMAGE} />
                )}
              </div>

              <div className="fb-actions">
                <div className="fb-action-btn">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path></svg>
                  Curtir
                </div>
                <div className="fb-action-btn">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
                  Comentar
                </div>
                <div className="fb-action-btn">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 3v18l-5-5-5 5V3a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2z" transform="rotate(90 12 12)"></path></svg>
                  Compartilhar
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="mockup-insta">
            <div className="insta-header">
              <div className="insta-avatar">
                <img src="https://ui-avatars.com/api/?name=Cliente+F&background=random" alt="avatar" />
              </div>
              <span className="insta-username">{username.toLowerCase().replace(/\s+/g, '_')}</span>
              <svg style={{marginLeft: 'auto'}} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>
            </div>
            
            <div className="insta-image-container" style={{ position: 'relative' }}>
                {hasMultipleImages && currentImageIndex > 0 && (
                  <button className="carousel-arrow prev" onClick={prevImage}>❮</button>
                )}
              <img src={imageUrl} alt="Post preview" referrerPolicy="no-referrer" onError={(e) => e.target.src = DEFAULT_IMAGE} />
                {hasMultipleImages && currentImageIndex < imageLinks.length - 1 && (
                  <button className="carousel-arrow next" onClick={nextImage}>❯</button>
                )}
                {hasMultipleImages && (
                  <div className="carousel-dots">
                    {imageLinks.map((_, i) => (
                      <span key={i} className={`dot ${i === currentImageIndex ? 'active' : ''}`} />
                    ))}
                  </div>
                )}
            </div>

            <div className="insta-actions">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
              <svg style={{marginLeft: 'auto'}} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg>
            </div>

            <div className="insta-caption">
              <strong>{username.toLowerCase().replace(/\s+/g, '_')}</strong> 
              {isLongCaption ? (
                <>
                  <span>{shortCaption}</span>
                  <span style={{color: '#8e8e8e', cursor: 'pointer', marginLeft: '4px'}}>mais</span>
                </>
              ) : (
                <span>{caption}</span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PreviewModal;
