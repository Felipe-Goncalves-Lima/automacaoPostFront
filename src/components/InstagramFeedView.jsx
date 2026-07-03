import React from 'react';
import './InstagramFeedView.css';

const DEFAULT_IMAGE = "https://images.unsplash.com/photo-1611162617474-5b21e879e113?q=80&w=600&auto=format&fit=crop";

const getImageUrl = (url) => {
  if (!url) return DEFAULT_IMAGE;
  const driveMatch = url.match(/\/d\/([a-zA-Z0-9_-]+)/) || url.match(/id=([a-zA-Z0-9_-]+)/);
  if (driveMatch) {
    // Add =s600-c to crop to a square perfectly
    return `https://lh3.googleusercontent.com/d/${driveMatch[1]}=s600-c`;
  }
  return url;
};

const InstagramFeedView = ({ posts, onPreview }) => {
  // Filter only posts that go to Instagram (or 'ambos')
  const instaPosts = posts.filter(p => {
    const plat = (p.platform || '').toLowerCase();
    return plat === 'instagram' || plat === 'ambos';
  });

  // Sort by date (newest first for the feed, assuming top-left is newest)
  // Usually, posts are already sorted by date, but just in case:
  const sortedPosts = [...instaPosts].sort((a, b) => {
    if (!a.scheduledDateObj) return 1;
    if (!b.scheduledDateObj) return -1;
    return b.scheduledDateObj - a.scheduledDateObj;
  });

  // Determine client name to show in the mock profile
  // If there's only one unique client in the visible posts, we use that. 
  // Otherwise, we use a generic placeholder to indicate it's a mixed feed.
  const uniqueClients = [...new Set(sortedPosts.map(p => p.client).filter(Boolean))];
  const clientName = uniqueClients.length === 1 ? uniqueClients[0] : (uniqueClients.length === 0 ? 'Sem Cliente' : 'Múltiplos Clientes (Filtre por um!)');
  
  const postCount = sortedPosts.length;
  
  // Format username (lowercase, no spaces)
  const username = clientName.toLowerCase().replace(/\s+/g, '_');

  return (
    <div className="instagram-feed-container animate-fade-in">
      <div className="feed-header">
        <div className="feed-avatar">
          <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(clientName)}&background=random`} alt="avatar" />
        </div>
        <div className="feed-stats-wrapper">
          <div className="feed-username">{username}</div>
          <div className="feed-stats">
            <div className="stat-item">
              <span className="insta-stat-value">{postCount}</span>
              <span className="insta-stat-label">publicações</span>
            </div>
            <div className="stat-item">
              <span className="insta-stat-value">10k</span>
              <span className="insta-stat-label">seguidores</span>
            </div>
            <div className="stat-item">
              <span className="insta-stat-value">123</span>
              <span className="insta-stat-label">seguindo</span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="feed-bio-container">
        <div className="feed-bio">
          <strong>{clientName}</strong><br/>
          ✨ Planejamento Estratégico<br/>
          🚀 Publicações gerenciadas pela Força Digital<br/>
          👇 Clique no link abaixo
        </div>
      </div>

      <div className="feed-tabs">
        <div className="feed-tab active">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
          PUBLICAÇÕES
        </div>
      </div>

      <div className="feed-grid">
        {sortedPosts.length === 0 ? (
          <div className="empty-feed">
            Nenhuma publicação de Instagram encontrada neste filtro.
          </div>
        ) : (
          sortedPosts.map((post) => {
            const imageLinks = post.imageLinks || [];
            const hasMultiple = imageLinks.length > 1;
            const imageUrl = getImageUrl(imageLinks[0]);
            
            return (
              <div 
                key={post.id} 
                className="feed-post"
                onClick={() => onPreview(post)}
                title={post.title}
              >
                <img src={imageUrl} alt={post.title} referrerPolicy="no-referrer" onError={(e) => e.target.src = DEFAULT_IMAGE} />
                
                {hasMultiple && (
                  <svg className="feed-carousel-icon" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M4 4h12v12H4V4zm2 2v8h8V6H6zm14-2h-2v14H6v2h14V4z"/>
                  </svg>
                )}
                
                <div className={`status-badge-mini status-${post.status.toLowerCase()}`} title={`Status: ${post.status}`}></div>
                
                <div className="feed-post-overlay">
                  <div className="overlay-stat">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"></path></svg>
                    <span>{Math.floor(Math.random() * 100) + 10}</span>
                  </div>
                  <div className="overlay-stat">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
                    <span>{Math.floor(Math.random() * 20)}</span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default InstagramFeedView;
