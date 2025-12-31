import React, { useEffect, useState } from 'react';
import { Server, Activity, Terminal, Play, Square, Package, Plus } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { StatsWidget } from '../components/StatsWidget';
import { useAgentSocket } from '../hooks/useAgentSocket';
import { useAuth } from '../contexts/AuthContext';

type Agent = {
    id: string;
    name: string;
    status: string;
};

// ... ServerCard component remains same (omitted for brevity in this tool call if possible, but replace_file_content needs full block if replacing whole file. 
// I will use replace_file_content to replace the Dashboard component logic mainly)

const ServerCard: React.FC<{ agent: Agent }> = ({ agent }) => {
    // ... Copy existing ServerCard code ...
    const navigate = useNavigate();
    const { status: agentStatus, messages } = useAgentSocket(agent.id);
    const [statsHistory, setStatsHistory] = useState<any[]>([]);

    useEffect(() => {
        if (messages.length > 0) {
            const lastMsg = messages[messages.length - 1];
            if (lastMsg.type === 'HEARTBEAT') {
                const payload = lastMsg.payload || lastMsg;

                setStatsHistory(prev => {
                    const newData = {
                        time: new Date().toLocaleTimeString(),
                        cpu: payload.cpu_usage || 0,
                        ram: (payload.ram_usage / 1024 / 1024 / 1024) || 0
                    };
                    const newHistory = [...prev, newData];
                    if (newHistory.length > 20) newHistory.shift();
                    return newHistory;
                });
            }
        }
    }, [messages]);

    const handleAction = async (e: React.MouseEvent, action: 'start' | 'stop') => {
        e.stopPropagation();
        await fetch(`/api/agent/${agent.id}/${action}`, { method: 'POST' });
    };

    const isOffline = agentStatus !== 'ONLINE';

    return (
        <div
            className="glass-panel"
            onClick={!isOffline ? () => navigate(`/server/${agent.id}`) : undefined}
            style={{
                display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1.5rem',
                cursor: isOffline ? 'default' : 'pointer',
                transition: 'transform 0.2s', position: 'relative',
                opacity: isOffline ? 0.6 : 1,
                filter: isOffline ? 'grayscale(0.8)' : 'none',
                pointerEvents: isOffline ? 'none' : 'auto'
            }}
            onMouseEnter={e => !isOffline && (e.currentTarget.style.transform = 'translateY(-2px)')}
            onMouseLeave={e => !isOffline && (e.currentTarget.style.transform = 'translateY(0)')}
        >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div className="glass-panel" style={{ padding: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Server size={24} color={isOffline ? '#888' : '#818cf8'} />
                    </div>
                    <div>
                        <h3 style={{ margin: 0, fontSize: '1.1rem' }}>{agent.name}</h3>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{agent.id}</span>
                    </div>
                </div>
                <div style={{
                    padding: '4px 12px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 600,
                    background: agentStatus === 'ONLINE' ? 'rgba(74, 222, 128, 0.2)' : 'rgba(100, 100, 100, 0.2)',
                    color: agentStatus === 'ONLINE' ? '#4ade80' : '#888'
                }}>
                    {agentStatus === 'ONLINE' ? '온라인' : '오프라인'}
                </div>
            </div>

            {isOffline ? (
                <div style={{ height: '120px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.9rem', textAlign: 'center' }}>
                    <p style={{ pointerEvents: 'auto' }}>⚠️ 에이전트 연결 필요<br /><span style={{ fontSize: '0.8rem' }}>(터미널에서 set-id 로 연결하세요)</span></p>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <StatsWidget title="CPU 사용량" data={statsHistory} dataKey="cpu" color="#f472b6" unit="%" />
                    <StatsWidget title="RAM 사용량" data={statsHistory} dataKey="ram" color="#38bdf8" unit=" GB" />
                </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '8px', marginTop: 'auto', opacity: isOffline ? 0.3 : 1 }}>
                <button disabled={isOffline} onClick={(e) => handleAction(e, 'start')} className="glass-panel" style={{ cursor: isOffline ? 'not-allowed' : 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', padding: '16px' }}>
                    <Play size={24} color={isOffline ? '#888' : '#4ade80'} />
                    <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>시작</span>
                </button>
                <button disabled={isOffline} onClick={(e) => handleAction(e, 'stop')} className="glass-panel" style={{ cursor: isOffline ? 'not-allowed' : 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', padding: '16px' }}>
                    <Square size={24} color={isOffline ? '#888' : '#ef4444'} />
                    <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>정지</span>
                </button>
                <div onClick={(e) => !isOffline && e.stopPropagation()} style={{ display: 'contents' }}>
                    <Link to={`/server/${agent.id}`} className="glass-panel" style={{ textDecoration: 'none', color: 'var(--text-main)', cursor: isOffline ? 'not-allowed' : 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', padding: '16px', pointerEvents: isOffline ? 'none' : 'auto' }}>
                        <Terminal size={24} />
                        <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>콘솔</span>
                    </Link>
                </div>
                <div onClick={(e) => !isOffline && e.stopPropagation()} style={{ display: 'contents' }}>
                    <Link to={`/server/${agent.id}?tab=mods`} className="glass-panel" style={{ textDecoration: 'none', color: 'var(--text-main)', cursor: isOffline ? 'not-allowed' : 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', padding: '16px', pointerEvents: isOffline ? 'none' : 'auto' }}>
                        <Package size={24} />
                        <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>모드</span>
                    </Link>
                </div>
            </div>
        </div>
    );
};

export const Dashboard: React.FC = () => {
    const [agents, setAgents] = useState<Agent[]>([]);
    const { token, logout } = useAuth();
    const [showAddModal, setShowAddModal] = useState(false);
    const [newAgentName, setNewAgentName] = useState('');

    const fetchAgents = () => {
        if (!token) return;
        fetch('/api/agents', { headers: { Authorization: `Bearer ${token}` } })
            .then(res => {
                if (res.status === 401) { logout(); return []; }
                return res.json();
            })
            .then(data => setAgents(data || []))
            .catch(err => console.error(err));
    };

    useEffect(() => {
        fetchAgents();
    }, [token]);

    const handleAddAgent = async () => {
        if (!newAgentName) return;
        try {
            const res = await fetch('/api/agents/create', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ name: newAgentName })
            });
            if (res.ok) {
                const newAgent = await res.json();
                alert(`에이전트 생성 완료!\nID: ${newAgent.id}\n(이 ID를 에이전트 설정에 입력하세요)`);
                setShowAddModal(false);
                setNewAgentName('');
                fetchAgents();
            }
        } catch (e) {
            alert('Failed to create agent');
        }
    };

    return (
        <div style={{ padding: '0 1rem', maxWidth: '1600px', margin: '0 auto' }}>
            <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'end' }}>
                <div>
                    <h1 style={{ margin: 0, fontSize: '2rem', fontWeight: 700, background: 'linear-gradient(to right, #fff, #94a3b8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                        대시보드
                    </h1>
                    <p style={{ margin: '8px 0 0', color: 'var(--text-muted)' }}>연결된 모든 노드 개요</p>
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <button className="btn-primary" onClick={() => setShowAddModal(true)}>
                        <Plus size={16} /> 에이전트 추가
                    </button>
                    <button className="glass-panel" style={{ cursor: 'pointer', padding: '0.5rem 1rem' }} onClick={fetchAgents}>새로고침</button>
                </div>
            </div>

            {showAddModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
                }}>
                    <div className="glass-panel" style={{ padding: '2rem', width: '400px' }}>
                        <h3>새 에이전트 추가</h3>
                        <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                            새로운 에이전트의 이름을 입력하세요. 생성 후 ID가 발급됩니다.
                        </p>
                        <input
                            className="input-field"
                            style={{ width: '100%', marginBottom: '1rem' }}
                            placeholder="My Minecraft Server"
                            value={newAgentName}
                            onChange={e => setNewAgentName(e.target.value)}
                        />
                        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                            <button className="glass-panel" style={{ cursor: 'pointer', padding: '0.5rem 1rem' }} onClick={() => setShowAddModal(false)}>취소</button>
                            <button className="btn-primary" onClick={handleAddAgent}>생성</button>
                        </div>
                    </div>
                </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: '2rem' }}>
                {agents.map(agent => (
                    <ServerCard key={agent.id} agent={agent} />
                ))}
            </div>

            {agents.length === 0 && (
                <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    <Activity size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
                    <h3>연결된 에이전트 없음</h3>
                    <p>우측 상단의 '에이전트 추가' 버튼을 눌러 시작하세요.</p>
                </div>
            )}
        </div>
    );
};
