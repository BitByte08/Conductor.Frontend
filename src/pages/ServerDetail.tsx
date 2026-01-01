import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Activity, Terminal, Package, Settings, ChevronLeft, Power, Square, Play, Download } from 'lucide-react';
import { Console } from './Console';
import { ServerMods } from './ServerMods';
import { StatsWidget } from '../components/StatsWidget';
import { useAgentSocket } from '../hooks/useAgentSocket';
import api from '../lib/axios';

const TabButton: React.FC<{ active: boolean; onClick: () => void; icon: any; label: string }> = ({ active, onClick, icon: Icon, label }) => (
    <button
        onClick={onClick}
        style={{
            background: 'transparent',
            border: 'none',
            borderBottom: active ? '2px solid var(--primary)' : '2px solid transparent',
            color: active ? 'var(--text-main)' : 'var(--text-muted)',
            padding: '1rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '1rem',
            fontWeight: 500,
            transition: 'all 0.2s'
        }}
    >
        <Icon size={18} />
        {label}
    </button>
);

export const ServerDetail: React.FC = () => {
    const { agentId } = useParams<{ agentId: string }>();
    const [activeTab, setActiveTab] = useState<'overview' | 'console' | 'mods' | 'settings'>('overview');
    const { status: agentStatus, messages } = useAgentSocket(agentId || '');
    const [statsHistory, setStatsHistory] = useState<any[]>([]);
    const [serverStatus, setServerStatus] = useState<string>('OFFLINE');

    // New State for Config/Metadata/Properties
    const [metadata, setMetadata] = useState<string>('');
    const [ramConfig, setRamConfig] = useState<string>('');
    const [serverProperties, setServerProperties] = useState<Record<string, string>>({});
    const [serverIp, setServerIp] = useState<string>('unknown');

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
                    return [...prev.slice(-49), newData];
                });

                // Update server status
                if (payload.server_status) setServerStatus(payload.server_status);
                // Update Metadata/Config from Heartbeat
                if (payload.metadata) setMetadata(payload.metadata);
                if (payload.config?.ram_mb) setRamConfig(payload.config.ram_mb);
                if (payload.server_ip) setServerIp(payload.server_ip);
            } else if (lastMsg.type === 'PROPERTIES') {
                // Format: { type: "PROPERTIES", payload: { "gamemode": "survival", ... } }
                console.log('[ServerDetail] Received PROPERTIES:', lastMsg.payload);
                setServerProperties(lastMsg.payload);
            } else if (lastMsg.type === 'LOG') {
                const line = lastMsg.payload?.line || '';
                // Detect metadata notice written by agent
                if (line.startsWith('METADATA:')) {
                    const rest = line.replace('METADATA:', '').trim();
                    setMetadata(rest);
                }
            } else if (lastMsg.type === 'RAW') {
                // If raw contains METADATA, pick it up
                const raw = lastMsg.raw || '';
                if (typeof raw === 'string' && raw.includes('METADATA:')) {
                    const idx = raw.indexOf('METADATA:');
                    const rest = raw.slice(idx + 'METADATA:'.length).trim();
                    setMetadata(rest);
                }
            }
        }
    }, [messages]);

    // Fetch properties and collaborators when entering Settings tab
    const [collaborators, setCollaborators] = React.useState<Array<{ id: number; username: string; role: string }>>([]);
    const [inviteUsername, setInviteUsername] = React.useState('');
    const [inviteRole, setInviteRole] = React.useState<'viewer'|'manager'>('viewer');
    const [myRole, setMyRole] = React.useState<'owner'|'manager'|'viewer'|'unknown'>('unknown');

    useEffect(() => {
        const fetchMyRole = async () => {
            try {
                const { data } = await api.get('/api/agents');
                const me = data.find((a: any) => a.id === agentId);
                if (me && me.role) setMyRole(me.role);
            } catch (e) {}
        };

        const fetchCollaborators = async () => {
            try {
                const { data } = await api.get(`/api/agent/${agentId}/collaborators`);
                setCollaborators(data);
            } catch (e) {}
        };

        if (activeTab === 'settings' && agentId) {
            console.log('[ServerDetail] Requesting properties fetch for agent:', agentId);
            api.post(`/api/agent/${agentId}/properties/fetch`)
                .then(() => console.log('[ServerDetail] Properties fetch requested'))
                .catch(e => console.error('[ServerDetail] Properties fetch failed:', e));
            fetchMyRole();
            fetchCollaborators();
        }
    }, [activeTab, agentId]);

    const handleInvite = async () => {
        if (!inviteUsername.trim()) return;
        try {
            await api.post(`/api/agent/${agentId}/collaborators`, { username: inviteUsername.trim(), role: inviteRole });
            setInviteUsername('');
            setInviteRole('viewer');
            const { data } = await api.get(`/api/agent/${agentId}/collaborators`);
            setCollaborators(data);
        } catch (e: any) {
            alert(`Invite failed: ${e.response?.data?.detail || e.message}`);
        }
    };

    const handleRemoveCollaborator = async (id: number) => {
        if (!confirm('이 사용자를 협업자에서 제거하시겠습니까?')) return;
        try {
            await api.delete(`/api/agent/${agentId}/collaborators/${id}`);
            setCollaborators(prev => prev.filter(c => c.id !== id));
        } catch (e) {
            alert('Failed to remove collaborator');
        }
    };



    const handleAction = async (action: 'start' | 'stop') => {
        if (!agentId) return;
        try {
            await api.post(`/api/agent/${agentId}/${action}`);
        } catch (e) {
            console.error(`Failed to ${action} server`, e);
        }
    };

    const handleSaveConfig = async () => {
        if (!agentId) return;
        try {
            // Stop server if running
            if (serverStatus === 'ONLINE') {
                await api.post(`/api/agent/${agentId}/stop`);
                // Wait for server to stop
                await new Promise(resolve => setTimeout(resolve, 3000));
            }
            // Update config
            await api.post(`/api/agent/${agentId}/config`, { ram_mb: ramConfig });
            // Restart server
            await api.post(`/api/agent/${agentId}/start`);
            alert('설정이 저장되고 서버가 재시작되었습니다.');
        } catch (e) {
            alert('설정 저장 실패');
        }
    };

    const handleSaveProperties = async () => {
        if (!agentId) return;
        try {
            await api.post(`/api/agent/${agentId}/properties/update`, serverProperties);
            alert('서버 속성이 저장되었습니다.');
        } catch (e) {
            alert('서버 속성 저장 실패');
        }
    };

    const handleDeleteServer = async () => {
        if (!agentId) return;
        if (!window.confirm('정말로 이 서버를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) return;
        try {
            await api.delete(`/api/agent/${agentId}`);
            alert('서버가 삭제되었습니다.');
            window.location.href = '/dashboard';
        } catch (e: any) {
            alert('서버 삭제 실패: ' + (e.response?.data?.detail || e.message));
        }
    };

    if (!agentId) return <div>Invalid Agent ID</div>;

    // 1. Agent Offline State
    if (agentStatus !== 'ONLINE') {
        return (
            <div style={{ maxWidth: '800px', margin: '4rem auto', textAlign: 'center' }}>
                <div className="glass-panel" style={{ padding: '3rem' }}>
                    <div style={{ marginBottom: '1.5rem', display: 'inline-block', padding: '1rem', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '50%' }}>
                        <Power size={48} color="#ef4444" />
                    </div>
                    <h2 style={{ marginBottom: '1rem' }}>에이전트 연결 대기 중...</h2>
                    <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>
                        이 서버를 관리하려면 에이전트를 실행하고 연결해야 합니다.
                    </p>

                    <div style={{ background: 'rgba(0,0,0,0.3)', padding: '1.5rem', borderRadius: '8px', textAlign: 'left', marginBottom: '2rem' }}>
                        <p style={{ marginBottom: '0.5rem', color: 'var(--text-muted)' }}>1. 에이전트 실행 후 터미널에 다음 명령어를 입력하세요:</p>
                        <code style={{ display: 'block', padding: '1rem', background: '#000', borderRadius: '4px', color: '#4ade80', fontFamily: 'monospace' }}>
                            set-id {agentId}
                        </code>
                    </div>

                    <Link to="/" className="btn-primary" style={{ background: 'var(--surface-light)' }}>
                        대시보드로 돌아가기
                    </Link>
                </div>
            </div>
        );
    }

    // 2. Server Not Installed Check (Moved inside content)
    // Check if metadata string is "Unknown ?" or similar default
    const isInstalled = metadata && !metadata.includes('Unknown') && !metadata.includes('?');

    // BLOCKING UI REMOVED - Logic moved to ActiveTab === 'overview'


    return (
        <div style={{ maxWidth: '1600px', margin: '0 auto', padding: '0 1rem', height: 'calc(100vh - 80px)', display: 'flex', flexDirection: 'column' }}>
            {/* Header */}
            <div style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <Link to="/" className="glass-panel" style={{ padding: '8px', display: 'flex' }}><ChevronLeft /></Link>
                <div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                        <h1 style={{ margin: 0, fontSize: '1.5rem' }}>{agentId}</h1>
                        <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.1)', padding: '2px 8px', borderRadius: '4px' }}>
                            {metadata || 'Unknown Version'}
                        </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.875rem' }}>
                        <span style={{
                            width: '8px', height: '8px', borderRadius: '50%',
                            background: agentStatus === 'ONLINE' ? '#4ade80' : '#ef4444'
                        }} />
                        <span style={{ color: 'var(--text-muted)' }}>{agentStatus === 'ONLINE' ? 'CONNECTED' : 'OFFLINE'}</span>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.1)', marginBottom: '2rem' }}>
                <TabButton active={activeTab === 'overview'} onClick={() => setActiveTab('overview')} icon={Activity} label="개요" />
                <TabButton active={activeTab === 'console'} onClick={() => setActiveTab('console')} icon={Terminal} label="콘솔" />
                <TabButton active={activeTab === 'mods'} onClick={() => setActiveTab('mods')} icon={Package} label="모드" />
                <TabButton active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} icon={Settings} label="설정" />
            </div>

            {/* Content */}
            <div style={{ flex: 1, overflow: 'hidden' }}>
                {activeTab === 'overview' && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '2rem' }}>
                        {!isInstalled ? (
                            <div className="glass-panel" style={{ padding: '3rem', gridColumn: '1 / -1', textAlign: 'center' }}>
                                <div style={{ marginBottom: '1.5rem', display: 'inline-block', padding: '1rem', background: 'rgba(129, 140, 248, 0.1)', borderRadius: '50%' }}>
                                    <Package size={48} color="#818cf8" />
                                </div>
                                <h2 style={{ marginBottom: '1rem' }}>서버가 설치되지 않음</h2>
                                <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>
                                    에이전트가 연결되었지만 Minecraft 서버가 설치되어 있지 않습니다.
                                </p>
                                <Link to={`/install?agent=${agentId}`} className="btn-primary" style={{ fontSize: '1.1rem', padding: '0.75rem 2rem', display: 'inline-flex', alignItems: 'center' }}>
                                    <Download size={20} style={{ marginRight: '8px' }} />
                                    서버 설치하기
                                </Link>
                                <p style={{ marginTop: '1rem', color: 'var(--text-muted)' }}>
                                    설치를 시작했다면 <b>콘솔(Console)</b> 탭에서 진행 상황을 확인하세요.
                                </p>
                            </div>
                        ) : (
                            <>
                                <div className="glass-panel" style={{ padding: '2rem', gridColumn: '1 / -1' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                                        <h3>서버 제어</h3>
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            {serverStatus === 'OFFLINE' ? (
                                                <button onClick={() => handleAction('start')} className="btn-primary" style={{ background: '#22c55e' }}>
                                                    <Play size={16} /> 시작
                                                </button>
                                            ) : (
                                                <button onClick={() => handleAction('stop')} className="btn-primary" style={{ background: '#ef4444' }}>
                                                    <Square size={16} /> 정지
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem' }}>
                                        <span style={{
                                            width: '8px', height: '8px', borderRadius: '50%',
                                            background: serverStatus === 'ONLINE' ? '#4ade80' : '#ef4444'
                                        }} />
                                        <span style={{ color: 'var(--text-muted)' }}>서버 상태: {serverStatus}</span>
                                    </div>
                                </div>
                                <StatsWidget title="CPU 사용량" data={statsHistory} dataKey="cpu" color="#f472b6" unit="%" />
                                <StatsWidget title="RAM 사용량" data={statsHistory} dataKey="ram" color="#38bdf8" unit=" GB" />
                                <div className="glass-panel" style={{ padding: '2rem' }}>
                                    <h3>빠른 정보</h3>
                                    <p>IP 주소: {serverIp}</p>
                                    <p>포트: {serverProperties['server-port'] || '25565'}</p>
                                </div>
                            </>
                        )}
                    </div>
                )}
                {activeTab === 'console' && <div style={{ height: '100%' }}><Console /></div>}
                {activeTab === 'mods' && <div style={{ height: '100%', overflow: 'auto' }}><ServerMods /></div>}
                {activeTab === 'settings' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', height: '100%', overflow: 'auto' }}>
                        {/* Server Configuration */}
                        <div className="glass-panel" style={{ padding: '2rem' }}>
                            <h3>서버 설정</h3>
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>설정을 변경하면 서버가 자동으로 재시작됩니다.</p>
                            
                            <div style={{ marginBottom: '1.5rem' }}>
                                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>최대 RAM 할당 (예: 4G, 2048M)</label>
                                <input
                                    type="text"
                                    value={ramConfig}
                                    onChange={(e) => setRamConfig(e.target.value)}
                                    className="input-field"
                                    placeholder="4G"
                                />
                                <button onClick={handleSaveConfig} className="btn-primary" style={{ marginTop: '0.5rem' }}>
                                    RAM 설정 저장 및 재시작
                                </button>
                            </div>
                        </div>

                        {/* Server Properties */}
                        <div className="glass-panel" style={{ padding: '2rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                                <h3>서버 속성 (server.properties)</h3>
                                <button onClick={handleSaveProperties} className="btn-primary">속성 저장 및 재시작</button>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                {Object.entries(serverProperties).length === 0 ? (
                                    <p style={{ color: 'var(--text-muted)' }}>속성을 불러오는 중이거나 파일이 없습니다.</p>
                                ) : (
                                    // Common Properties Filters
                                    ['motd', 'max-players', 'server-port', 'gamemode', 'difficulty', 'level-name', 'white-list', 'online-mode'].map(key => (
                                        <div key={key}>
                                            <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>{key}</label>
                                            <input
                                                type="text"
                                                className="input-field"
                                                value={serverProperties[key] || ''}
                                                onChange={(e) => setServerProperties(prev => ({ ...prev, [key]: e.target.value }))}
                                            />
                                        </div>
                                    ))
                                )}

                                <details>
                                    <summary style={{ cursor: 'pointer', padding: '1rem 0', color: 'var(--accent-color)' }}>모든 속성 보기</summary>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        {Object.entries(serverProperties).map(([key, value]) => (
                                            !['motd', 'max-players', 'server-port', 'gamemode', 'difficulty', 'level-name', 'white-list', 'online-mode'].includes(key) &&
                                            <div key={key} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                                <span style={{ width: '200px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>{key}</span>
                                                <input
                                                    type="text"
                                                    className="input-field"
                                                    value={value}
                                                    onChange={(e) => setServerProperties(prev => ({ ...prev, [key]: e.target.value }))}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </details>
                            </div>
                        </div>

                        {/* Collaborators Section */}
                        <div className="glass-panel" style={{ padding: '2rem' }}>
                            <h3>협업자 관리</h3>
                            <div style={{ marginTop: '0.5rem', display: 'flex', gap: '8px' }}>
                                <input value={inviteUsername} onChange={e => setInviteUsername(e.target.value)} placeholder="Username to invite" style={{ padding: '0.5rem', marginRight: '0.5rem' }} />
                                <select value={inviteRole} onChange={e => setInviteRole(e.target.value as any)} style={{ padding: '0.5rem', marginRight: '0.5rem' }}>
                                    <option value="viewer">Viewer</option>
                                    <option value="manager">Manager</option>
                                </select>
                                <button onClick={handleInvite} className="btn-primary">초대</button>
                            </div>

                            <div style={{ marginTop: '1rem' }}>
                                <h4>현재 협업자</h4>
                                {collaborators.length === 0 ? (
                                    <div style={{ color: 'var(--text-muted)' }}>협업자가 없습니다.</div>
                                ) : (
                                    <ul>
                                        {collaborators.map(c => (
                                            <li key={c.id} style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                                <strong>{c.username}</strong>
                                                <span style={{ color: 'var(--text-muted)' }}>{c.role}</span>
                                                { (myRole === 'owner' || myRole === 'manager') && (
                                                    <button onClick={() => handleRemoveCollaborator(c.id)} style={{ marginLeft: 'auto' }} className="btn-primary">제거</button>
                                                ) }
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        </div>
                        
                        {/* Danger Zone */}
                        <div className="glass-panel" style={{ padding: '2rem', borderColor: '#ef4444' }}>
                            <h3 style={{ color: '#ef4444' }}>위험 구역</h3>
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1rem' }}>이 작업은 되돌릴 수 없습니다.</p>
                            <button onClick={handleDeleteServer} className="btn-primary" style={{ background: '#ef4444' }}>서버 삭제</button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
