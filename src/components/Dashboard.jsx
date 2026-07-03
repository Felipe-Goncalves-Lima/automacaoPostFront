import { useState, useEffect, useRef } from 'react';
import PostCard from './PostCard';
import CustomAlert from './CustomAlert';
import PreviewModal from './PreviewModal';
import CalendarView from './CalendarView';
import InstagramFeedView from './InstagramFeedView';
import useN8nErrors from '../hooks/useN8nErrors';
import './Dashboard.css';
const SHEET_ID = '1wxpYxp7KP9K5GAraiVNg6ZgPIjZaIFYEeiQlK7pq1mU';
const SHEET_GID = '0';
const REFRESH_INTERVAL = 5000;
const parseGvizDate = (value) => {
  if (!value) return 'Sem data';
  if (typeof value === 'string' && !value.startsWith('Date(')) {
    return value;
  }
  const str = typeof value === 'string' ? value : String(value);
  const match = str.match(/Date\((\d+),(\d+),(\d+)(?:,(\d+),(\d+)(?:,(\d+))?)?\)/);
  if (!match) return str;
  const year = parseInt(match[1]);
  const month = parseInt(match[2]); 
  const day = parseInt(match[3]);
  const hour = match[4] ? parseInt(match[4]) : 0;
  const minute = match[5] ? parseInt(match[5]) : 0;
  const date = new Date(year, month, day, hour, minute);
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const parseGvizDateObj = (value) => {
  if (!value) return null;
  const str = typeof value === 'string' ? value : String(value);
  const match = str.match(/Date\((\d+),(\d+),(\d+)(?:,(\d+),(\d+)(?:,(\d+))?)?\)/);
  if (!match) return null;
  return new Date(parseInt(match[1]), parseInt(match[2]), parseInt(match[3]), match[4] ? parseInt(match[4]) : 0, match[5] ? parseInt(match[5]) : 0);
};
const fetchGoogleSheet = async () => {
  const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&gid=${SHEET_GID}&_=${Date.now()}`;
  const response = await fetch(url);
  const text = await response.text();
  const jsonString = text.match(/google\.visualization\.Query\.setResponse\(([\s\S]*)\);?/);
  if (!jsonString || !jsonString[1]) {
    throw new Error('Formato de resposta inesperado do Google Sheets');
  }
  const data = JSON.parse(jsonString[1]);
  const cols = data.table.cols;
  const rows = data.table.rows;
  const headers = cols.map(col => col.label).filter(h => h);
  const result = rows
    .filter(row => row.c && row.c[0] && row.c[0].v)
    .map(row => {
      const obj = {};
      headers.forEach((header, i) => {
        const cell = row.c[i];
        if (cell) {
          if (cell.v !== null && cell.v !== undefined) {
            obj[header] = cell.f || String(cell.v); 
          } else {
            obj[header] = '';
          }
          if (cell.v && String(cell.v).startsWith('Date(')) {
            obj[header] = String(cell.v);
          }
        } else {
          obj[header] = '';
        }
      });
      return obj;
    });
  return result;
};
const MOCK_DATA = [
  {
    id: 1,
    title: "Anúncio Nova Parceria Estratégica",
    platform: "LinkedIn",
    status: "Publicado",
    scheduledDate: "30/06/2026, 10:00",
  },
  {
    id: 2,
    title: "Dicas de Marketing Digital para 2026",
    platform: "Instagram",
    status: "Postando",
    scheduledDate: "30/06/2026, 14:00",
  },
  {
    id: 3,
    title: "Bastidores da Força Digital",
    platform: "TikTok",
    status: "Rascunho",
    scheduledDate: "01/07/2026, 18:00",
  },
  {
    id: 4,
    title: "Lançamento do Novo Site",
    platform: "Facebook",
    status: "Erro",
    scheduledDate: "29/06/2026, 09:00",
    errorMessage: "Falha na autenticação da conta."
  }
];
const CustomDropdown = ({ options, value, onChange, placeholder }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  const selectedOption = options.find(o => o.value === value);
  return (
    <div className="custom-dropdown" ref={dropdownRef}>
      <div 
        className={`dropdown-header ${isOpen ? 'open' : ''}`} 
        onClick={() => setIsOpen(!isOpen)}
      >
        <span>{selectedOption ? selectedOption.label : placeholder}</span>
        <svg className={`chevron ${isOpen ? 'open' : ''}`} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
      </div>
      {isOpen && (
        <div className="dropdown-list animate-fade-in">
          {options.map((opt) => (
            <div 
              key={opt.value} 
              className={`dropdown-item ${value === opt.value ? 'selected' : ''}`}
              onClick={() => {
                onChange(opt.value);
                setIsOpen(false);
              }}
            >
              {opt.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
const Dashboard = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [hiddenPosts, setHiddenPosts] = useState(() => JSON.parse(localStorage.getItem('hiddenPosts') || '[]'));
  const [alertConfig, setAlertConfig] = useState({ isOpen: false, type: null, targetId: null });
  const [previewPost, setPreviewPost] = useState(null);
  const { errors: n8nErrors, isWorkflowActive } = useN8nErrors(); 
  const isFirstLoad = useRef(true);
  const [filterStatus, setFilterStatus] = useState('Todos');
  const [filterPlatform, setFilterPlatform] = useState('Todas');
  const [filterClient, setFilterClient] = useState('Todos os Clientes');
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('grid');
  
  useEffect(() => {
    const fetchPosts = async () => {
      try {
        if (isFirstLoad.current) {
          setLoading(true);
        }
        const rawData = await fetchGoogleSheet();
        const formattedData = rawData.map((row, index) => ({
          id: row.ID || index,
          title: row.Legenda ? (row.Legenda.length > 50 ? row.Legenda.substring(0, 50) + "..." : row.Legenda) : "Sem título",
          fullCaption: row.Legenda || "",
          imageLinks: [
            row["Link do Google Drive"],
            row["Link Mídia 2 (Carrossel)"],
            row["Link Mídia 3 (Carrossel)"],
            row["Link Mídia 4 (Carrossel)"],
            row["Link Mídia 5 (Carrossel)"],
            row["Link Mídia 6 (Carrossel)"],
            row["Link Mídia 7 (Carrossel)"],
            row["Link Mídia 8 (Carrossel)"],
            row["Link Mídia 9 (Carrossel)"]
          ].filter(link => link && String(link).trim() !== ""),
          platform: row["Onde Postar"] || "N/A",
          status: row.Status || "Pendente",
          scheduledDate: parseGvizDate(row["Data de Publicação"] || row["Data de Publicaçao"] || ""),
          scheduledDateObj: parseGvizDateObj(row["Data de Publicação"] || row["Data de Publicaçao"] || ""),
          client: row.Cliente || "",
          postType: row["Tipo de Post"] || "",
          progress: parseInt(row.Progresso) || parseInt(row["Progresso "]) || 0, 
          errorMessage: row.Erro || null
        }));
        const clearedErrors = JSON.parse(localStorage.getItem('clearedN8nErrors') || '{}');
        let clearedErrorsUpdated = false;
        const activeStatuses = ['aprovado', 'agendado', 'postando'];
        const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;
        const now = Date.now();
        const postsWithN8nErrors = formattedData.map(post => {
          const n8nError = n8nErrors[String(post.id)];
          if (n8nError) {
            const isActive = activeStatuses.includes(post.status.toLowerCase());
            const isCleared = clearedErrors[post.id] === n8nError.stoppedAt;
            const isRecent = (now - n8nError.stoppedAt) < TWENTY_FOUR_HOURS;
            if (!isActive && !isCleared) {
              clearedErrors[post.id] = n8nError.stoppedAt;
              clearedErrorsUpdated = true;
            }
            if (isActive && isRecent && !isCleared) {
              return {
                ...post,
                status: 'Erro',
                errorMessage: n8nError.message,
              };
            }
          }
          return post;
        });
        if (clearedErrorsUpdated) {
          localStorage.setItem('clearedN8nErrors', JSON.stringify(clearedErrors));
        }
        setPosts(postsWithN8nErrors.reverse());
        setError(null);
        setLastUpdate(new Date());
      } catch (err) {
        console.error('Erro ao buscar dados:', err);
        setError('Não foi possível carregar os dados. Verifique se a planilha está compartilhada.');
        setPosts(MOCK_DATA);
      } finally {
        if (isFirstLoad.current) {
          setLoading(false);
          isFirstLoad.current = false;
        }
      }
    };
    fetchPosts();
    const interval = setInterval(fetchPosts, REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, [n8nErrors]);
  const unhiddenPosts = posts.filter(p => !hiddenPosts.includes(String(p.id)));
  const uniquePlatforms = [...new Set(unhiddenPosts.map(p => p.platform).filter(Boolean))];
  const sortedPlatforms = uniquePlatforms.sort((a, b) => {
    if (a.toLowerCase() === 'ambos') return 1;
    if (b.toLowerCase() === 'ambos') return -1;
    return a.localeCompare(b);
  });
  const availablePlatforms = ['Todas', ...sortedPlatforms];

  const uniqueClientsRaw = [...new Set(unhiddenPosts.map(p => p.client).filter(Boolean))];
  const availableClients = ['Todos os Clientes', ...uniqueClientsRaw.sort()];

  const visiblePosts = unhiddenPosts.filter(p => {
    if (filterStatus !== 'Todos') {
      const s = p.status.toLowerCase();
      if (filterStatus === 'Pendentes' && !['rascunho', 'pendente', 'postando', 'aprovado', 'agendado'].includes(s)) return false;
      if (filterStatus === 'Publicados' && !['publicado', 'sucesso'].includes(s)) return false;
      if (filterStatus === 'Com Erro' && s !== 'erro') return false;
    }
    if (filterPlatform !== 'Todas' && p.platform.toLowerCase() !== filterPlatform.toLowerCase()) return false;
    if (filterClient !== 'Todos os Clientes' && p.client !== filterClient) return false;
    
    const search = searchTerm.trim().toLowerCase();
    if (search && !p.title.toLowerCase().includes(search) && !p.client.toLowerCase().includes(search)) return false;
    return true;
  });
  const stats = {
    total: visiblePosts.length,
    success: visiblePosts.filter(p => ['publicado', 'sucesso'].includes(p.status.toLowerCase())).length,
    pending: visiblePosts.filter(p => ['rascunho', 'pendente', 'postando', 'aprovado', 'agendado'].includes(p.status.toLowerCase())).length,
    error: visiblePosts.filter(p => p.status.toLowerCase() === 'erro').length,
  };
  const handleClearAllRequest = () => {
    setAlertConfig({
      isOpen: true,
      type: 'clear_all',
      targetId: null,
      title: 'Limpar todos os cards?',
      message: 'Isso vai ocultar todos os posts atuais do painel. Eles continuarão existindo na sua planilha do Google Sheets, mas não aparecerão mais aqui até serem alterados.',
      confirmText: 'Sim, limpar todos',
    });
  };
  const handleDeleteRequest = (id) => {
    setAlertConfig({
      isOpen: true,
      type: 'delete_single',
      targetId: id,
      title: 'Ocultar este card?',
      message: 'O post continuará na sua planilha, mas deixará de aparecer neste painel.',
      confirmText: 'Ocultar post',
    });
  };
  const handleConfirmAlert = () => {
    if (alertConfig.type === 'clear_all') {
      const allIds = posts.map(p => String(p.id));
      const newHidden = [...new Set([...hiddenPosts, ...allIds])];
      setHiddenPosts(newHidden);
      localStorage.setItem('hiddenPosts', JSON.stringify(newHidden));
    } else if (alertConfig.type === 'delete_single' && alertConfig.targetId) {
      const newHidden = [...new Set([...hiddenPosts, String(alertConfig.targetId)])];
      setHiddenPosts(newHidden);
      localStorage.setItem('hiddenPosts', JSON.stringify(newHidden));
    }
    setAlertConfig({ ...alertConfig, isOpen: false });
  };
  const getEmptyStateMessage = () => {
    if (searchTerm) {
      return `Nenhuma publicação encontrada para a busca "${searchTerm}".`;
    }
    let statusText = '';
    switch (filterStatus) {
      case 'Pendentes': statusText = ' pendente ou em rascunho'; break;
      case 'Publicados': statusText = ' publicada'; break;
      case 'Com Erro': statusText = ' com erro'; break;
      default: statusText = ''; break;
    }
    let platformText = (filterPlatform === 'Todas' || filterPlatform.toLowerCase() === 'ambos') ? '' : ` do ${filterPlatform}`;
    let clientText = filterClient === 'Todos os Clientes' ? '' : ` para o cliente ${filterClient}`;
    return `Nenhuma postagem${statusText}${platformText}${clientText} encontrada no momento.`;
  };

  return (
    <main className="dashboard">
      <div className="stats-container animate-fade-in">
        <div className="stat-card glass-panel">
          <span className="stat-value">{stats.total}</span>
          <span className="stat-label">Total de Posts</span>
        </div>
        <div className="stat-card glass-panel">
          <span className="stat-value" style={{color: 'var(--status-success)'}}>{stats.success}</span>
          <span className="stat-label">Publicados</span>
        </div>
        <div className="stat-card glass-panel">
          <span className="stat-value" style={{color: 'var(--status-pending)'}}>{stats.pending}</span>
          <span className="stat-label">Pendentes/Postando</span>
        </div>
        <div className="stat-card glass-panel">
          <span className="stat-value" style={{color: 'var(--status-error)'}}>{stats.error}</span>
          <span className="stat-label">Com Erro</span>
        </div>
      </div>
      <div className="posts-header animate-fade-in" style={{ animationDelay: '0.2s' }}>
        <h2>Últimas Postagens</h2>
        <div className="header-meta">
          <button 
            className="clear-all-btn glass-panel" 
            onClick={handleClearAllRequest}
            disabled={visiblePosts.length === 0}
          >
            Limpar Painel
          </button>
          {loading && <span className="loading-spinner">Atualizando...</span>}
          {lastUpdate && !loading && (
            <>
              <span className="last-update">
                Atualizado às {lastUpdate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </>
          )}
          <span className="last-update" style={{ color: 'var(--status-pending)', fontWeight: 600 }}>
            ⏱️ O robô verifica a planilha a cada 1 minuto
          </span>
        </div>
      </div>
      <div className="filters-container glass-panel animate-fade-in" style={{ animationDelay: '0.2s' }}>
        <div className="view-toggle">
          <button 
            className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
            onClick={() => setViewMode('grid')}
            title="Visualização em Grade"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
          </button>
          <button 
            className={`view-btn ${viewMode === 'calendar' ? 'active' : ''}`}
            onClick={() => setViewMode('calendar')}
            title="Visualização em Calendário"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
          </button>
          <button 
            className={`view-btn ${viewMode === 'feed' ? 'active' : ''}`}
            onClick={() => setViewMode('feed')}
            title="Mosaico Instagram"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="3" y1="15" x2="21" y2="15"></line><line x1="9" y1="3" x2="9" y2="21"></line><line x1="15" y1="3" x2="15" y2="21"></line></svg>
          </button>
        </div>
        <input 
          type="text" 
          className="filter-input"
          placeholder="Buscar postagem ou cliente..." 
          value={searchTerm} 
          onChange={(e) => setSearchTerm(e.target.value)} 
        />
        <CustomDropdown 
          value={filterStatus}
          onChange={setFilterStatus}
          placeholder="Todos os Status"
          options={[
            { value: 'Todos', label: 'Todos os Status' },
            { value: 'Pendentes', label: 'Pendentes / Rascunho' },
            { value: 'Publicados', label: 'Publicados' },
            { value: 'Com Erro', label: 'Com Erro' }
          ]}
        />
        <CustomDropdown 
          value={filterPlatform}
          onChange={setFilterPlatform}
          placeholder="Todas as Plataformas"
          options={availablePlatforms.map(plat => ({
            value: plat,
            label: plat === 'Todas' ? 'Todas as Plataformas' : plat
          }))}
        />
        <CustomDropdown 
          value={filterClient}
          onChange={setFilterClient}
          placeholder="Todos os Clientes"
          options={availableClients.map(client => ({
            value: client,
            label: client
          }))}
        />
      </div>
      {error && !loading && (
        <div className="error-banner glass-panel animate-fade-in" style={{ animationDelay: '0.3s' }}>
          {error} (Mostrando dados de demonstração)
        </div>
      )}
      
      {viewMode === 'grid' && (
        <div className="posts-grid">
          {visiblePosts.map((post, index) => (
            <PostCard 
              key={post.id || index} 
              post={post} 
              index={index + 3} 
              onDelete={() => handleDeleteRequest(post.id)} 
              onPreview={() => setPreviewPost(post)}
            />
          ))}
        </div>
      )}
      
      {viewMode === 'calendar' && (
        <CalendarView 
          posts={visiblePosts}
          onPreview={(post) => setPreviewPost(post)}
        />
      )}

      {viewMode === 'feed' && (
        <InstagramFeedView 
          posts={visiblePosts}
          onPreview={(post) => setPreviewPost(post)}
        />
      )}

      {visiblePosts.length === 0 && !loading && !error && (
        <div className="empty-state animate-fade-in" style={{ animationDelay: '0.4s' }}>
          <svg className="empty-icon" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
          <h3>{getEmptyStateMessage()}</h3>
          <p>Tente ajustar os filtros ou verificar a planilha base.</p>
        </div>
      )}
      
      <CustomAlert  
        isOpen={alertConfig.isOpen}
        title={alertConfig.title}
        message={alertConfig.message}
        confirmText={alertConfig.confirmText}
        onConfirm={handleConfirmAlert}
        onCancel={() => setAlertConfig({ ...alertConfig, isOpen: false })}
      />
      <PreviewModal 
        post={previewPost}
        onClose={() => setPreviewPost(null)}
      />
    </main>
  );
};
export default Dashboard;
