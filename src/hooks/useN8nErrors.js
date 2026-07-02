import { useState, useEffect, useRef } from 'react';
const N8N_BASE = '/api/n8n';
const WORKFLOW_ID = import.meta.env.VITE_N8N_WORKFLOW_ID || '';
const API_KEY = import.meta.env.VITE_N8N_API_KEY || '';
const POLL_INTERVAL = 15000; 
const fetchWithTimeout = async (url, options, timeoutMs = 8000) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    return response;
  } finally {
    clearTimeout(timer);
  }
};
const useN8nErrors = () => {
  const [executionErrors, setExecutionErrors] = useState({});
  const [isWorkflowActive, setIsWorkflowActive] = useState(true);
  const cachedExecutionsRef = useRef({}); 
  useEffect(() => {
    if (!API_KEY || !WORKFLOW_ID) {
      console.warn('useN8nErrors: VITE_N8N_API_KEY ou VITE_N8N_WORKFLOW_ID não configurados no .env');
      return;
    }
    const headers = {
      'X-N8N-API-KEY': API_KEY,
      'Accept': 'application/json',
    };
    const checkErrors = async () => {
      try {
        const listUrl = `${N8N_BASE}/executions?workflowId=${WORKFLOW_ID}&status=error&limit=5`;
        const listResponse = await fetchWithTimeout(listUrl, { headers }, 5000);
        if (!listResponse.ok) {
          console.error('useN8nErrors: API retornou', listResponse.status);
          return;
        }
        const listResult = await listResponse.json();
        const executions = listResult.data || [];
        try {
          const wfUrl = `${N8N_BASE}/workflows/${WORKFLOW_ID}`;
          const wfResponse = await fetchWithTimeout(wfUrl, { 
            headers,
            cache: 'no-store'
          }, 3000);
          if (wfResponse.ok) {
            const wfData = await wfResponse.json();
            setIsWorkflowActive(wfData.active === true);
          }
        } catch (e) {
          console.error('Failed to fetch workflow status', e);
        }
        const twentyFourHoursAgo = Date.now() - 24 * 60 * 60 * 1000;
        const recentErrors = executions.filter(exec => {
          const stoppedAt = new Date(exec.stoppedAt || exec.startedAt).getTime();
          return stoppedAt > twentyFourHoursAgo;
        });
        if (recentErrors.length === 0) {
          setExecutionErrors({});
          return;
        }
        const newErrors = {};
        for (const exec of recentErrors) {
          const cached = cachedExecutionsRef.current[exec.id];
          if (cached) {
            if (!newErrors[cached.postId]) {
              newErrors[cached.postId] = {
                message: cached.message,
                stoppedAt: cached.stoppedAt,
              };
            }
            continue;
          }
          try {
            const detailUrl = `${N8N_BASE}/executions/${exec.id}?includeData=true`;
            const detailResponse = await fetchWithTimeout(detailUrl, { headers }, 8000);
            if (!detailResponse.ok) continue;
            const detail = await detailResponse.json();
            const resultData = detail.data?.resultData;
            if (!resultData) continue;
            let errorMessage = resultData.error?.message || 'Erro na automação';
            const lastNode = resultData.lastNodeExecuted;
            if (lastNode && resultData.runData?.[lastNode]) {
              const nodeRuns = resultData.runData[lastNode];
              const lastRun = nodeRuns[nodeRuns.length - 1];
              if (lastRun?.error?.message) {
                errorMessage = `${lastNode}: ${lastRun.error.message}`;
              }
            }
            if (errorMessage.length > 150) {
              errorMessage = errorMessage.substring(0, 147) + '...';
            }
            let postId = null;
            const runData = resultData.runData;
            const filterNode = runData?.['Filter'];
            if (filterNode) {
              const items = filterNode[0]?.data?.main?.[0] || [];
              if (items.length > 0 && items[0].json?.ID) {
                postId = String(items[0].json.ID);
              }
            }
            if (!postId) {
              const triggerNode = runData?.['Google Sheets Trigger'];
              if (triggerNode) {
                const items = triggerNode[0]?.data?.main?.[0] || [];
                const approvedItem = items.find(item =>
                  item.json?.Status?.toLowerCase() === 'aprovado'
                );
                if (approvedItem?.json?.ID) {
                  postId = String(approvedItem.json.ID);
                } else if (items.length === 1 && items[0].json?.ID) {
                  postId = String(items[0].json.ID);
                }
              }
            }
            if (postId && !newErrors[postId]) {
              const stoppedAt = new Date(exec.stoppedAt || exec.startedAt).getTime();
              cachedExecutionsRef.current[exec.id] = {
                postId,
                message: errorMessage,
                stoppedAt,
              };
              newErrors[postId] = {
                message: errorMessage,
                stoppedAt,
              };
            }
          } catch (detailErr) {
            if (detailErr.name === 'AbortError') {
              console.warn('useN8nErrors: Timeout ao buscar execução', exec.id);
            } else {
              console.error('useN8nErrors: Erro ao buscar execução:', exec.id, detailErr);
            }
          }
        }
        setExecutionErrors(prev => {
          const prevKeys = Object.keys(prev).sort().join(',');
          const newKeys = Object.keys(newErrors).sort().join(',');
          if (prevKeys === newKeys) {
            const same = Object.keys(newErrors).every(
              k => prev[k]?.message === newErrors[k]?.message && prev[k]?.stoppedAt === newErrors[k]?.stoppedAt
            );
            if (same) return prev; 
          }
          return newErrors;
        });
      } catch (err) {
        console.error('useN8nErrors: Falha ao consultar API do n8n:', err);
      }
    };
    checkErrors();
    const interval = setInterval(checkErrors, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, []);
  return { errors: executionErrors, isWorkflowActive };
};
export default useN8nErrors;
