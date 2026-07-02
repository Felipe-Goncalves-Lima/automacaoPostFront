import { useState, useEffect, useRef } from 'react';
import PostCard from './PostCard';
import CustomAlert from './CustomAlert';
import useN8nErrors from '../hooks/useN8nErrors';
import './Dashboard.css';
const SHEET_ID = '1T8n1DXK7bmadmxSvCMIJmsLbAyVNhJbzedCL-GMRX58';
const SHEET_GID = '354284204';
const REFRESH_INTERVAL = 10000;
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
const fetchGoogleSheet = async () => {
  const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&gid=${SHEET_GID}`;
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
const Dashboard = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [hiddenPosts, setHiddenPosts] = useState(() => JSON.parse(localStorage.getItem('hiddenPosts') || '[]'));
  const [alertConfig, setAlertConfig] = useState({ isOpen: false, type: null, targetId: null });
  const { errors: n8nErrors, isWorkflowActive } = useN8nErrors(); 
  const isFirstLoad = useRef(true);
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
          platform: row["Onde Postar"] || "N/A",
          status: row.Status || "Pendente",
          scheduledDate: parseGvizDate(row["Data de Publicação"] || row["Data de Publicaçao"] || ""),
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
  const visiblePosts = posts.filter(p => !hiddenPosts.includes(String(p.id)));
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
              {isWorkflowActive ? (
                <span className="last-update" style={{ color: 'var(--status-pending)', fontWeight: 600 }}>
                  ⏱️ O robô verifica a planilha a cada 1 minuto
                </span>
              ) : (
                <span className="last-update" style={{ color: 'var(--status-error)', fontWeight: 600 }}>
                  ⏸️ Robô de postagem pausado
                </span>
              )}
            </>
          )}
        </div>
      </div>
      {error && !loading && (
        <div className="error-banner glass-panel animate-fade-in" style={{ animationDelay: '0.3s' }}>
          {error} (Mostrando dados de demonstração)
        </div>
      )}
      <div className="posts-grid">
        {visiblePosts.map((post, index) => (
          <PostCard 
            key={post.id || index} 
            post={post} 
            index={index + 3} 
            onDelete={() => handleDeleteRequest(post.id)} 
          />
        ))}
      </div>
      <CustomAlert 
        isOpen={alertConfig.isOpen}
        title={alertConfig.title}
        message={alertConfig.message}
        confirmText={alertConfig.confirmText}
        onConfirm={handleConfirmAlert}
        onCancel={() => setAlertConfig({ ...alertConfig, isOpen: false })}
      />
    </main>
  );
};
export default Dashboard;
