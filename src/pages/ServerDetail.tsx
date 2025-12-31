import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Activity, Terminal, Package, Settings, ChevronLeft, Power, Square, Play, Download } from 'lucide-react';
import { Console } from './Console';
import { ServerMods } from './ServerMods';
import { StatsWidget } from '../components/StatsWidget';
import { useAgentSocket } from '../hooks/useAgentSocket';
import { apiUrl } from '../lib/api';

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

    // New State for Config/Metadata/Properties
    const [metadata, setMetadata] = useState<string>('');
    const [ramConfig, setRamConfig] = useState<string>('');
    const [serverProperties, setServerProperties] = useState<Record<string, string>>({});

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

                // Update Metadata/Config from Heartbeat
                if (payload.metadata) setMetadata(payload.metadata);
                if (payload.config?.ram_mb) setRamConfig(payload.config.ram_mb);
            } else if (lastMsg.type === 'PROPERTIES') {
                // Format: { type: "PROPERTIES", payload: { "gamemode": "survival", ... } }
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

    // Fetch properties when entering Settings tab
    useEffect(() => {
        if (activeTab === 'settings' && agentId) {
            fetch(apiUrl(`/api/agent/${agentId}/properties/fetch`), { method: 'POST' });
        }
    }, [activeTab, agentId]);

    const handleAction = async (action: 'start' | 'stop') => {
        if (!agentId) return;
        await fetch(apiUrl(`/api/agent/${agentId}/${action}`), { method: 'POST' });
    };

    const handleSaveConfig = async () => {
        if (!agentId) return;
        await fetch(apiUrl(`/api/agent/${agentId}/config`), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ram_mb: ramConfig })
        });
        alert('설정 저장 완료! 서버를 재시작해주세요.');
    };

    const handleSaveProperties = async () => {
        if (!agentId) return;
        await fetch(apiUrl(`/api/agent/${agentId}/properties/update`), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(serverProperties)
        });
        alert('서버 속성이 저장되었습니다.');
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
                <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px' }}>
                    <button onClick={() => handleAction('start')} className="btn-primary" style={{ background: '#22c55e' }}>
                        <Play size={16} /> 시작
                    </button>
                    <button onClick={() => handleAction('stop')} className="btn-primary" style={{ background: '#ef4444' }}>
                        <Square size={16} /> 정지
                    </button>
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
                                <StatsWidget title="CPU 사용량" data={statsHistory} dataKey="cpu" color="#f472b6" unit="%" />
                                <StatsWidget title="RAM 사용량" data={statsHistory} dataKey="ram" color="#38bdf8" unit=" GB" />
                                <div className="glass-panel" style={{ padding: '2rem' }}>
                                    <h3>빠른 정보</h3>
                                    <p>IP 주소: 127.0.0.1</p>
                                    <p>포트: 25565</p>
                                    <p>할당된 RAM: {ramConfig || '기본값'}</p>
                                </div>
                            </>
                        )}
                    </div>
                )}
                {activeTab === 'console' && <div style={{ height: '100%' }}><Console /></div>}
                {activeTab === 'mods' && <div style={{ height: '100%', overflow: 'auto' }}><ServerMods /></div>}
                {activeTab === 'settings' && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', height: '100%', overflow: 'auto' }}>
                        {/* RAM Config */}
                        <div className="glass-panel" style={{ padding: '2rem', height: 'fit-content' }}>
                            <h3>성능 설정 (Performance)</h3>
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', marginBottom: '8px' }}>최대 RAM 할당 (예: 4G, 2048M)</label>
                                <input
                                    type="text"
                                    value={ramConfig}
                                    onChange={(e) => setRamConfig(e.target.value)}
                                    className="input-field"
                                    placeholder="4G"
                                />
                            </div>
                            <button onClick={handleSaveConfig} className="btn-primary" style={{ marginBottom: '2rem' }}>
                                설정 저장
                            </button>

                            <h3 style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1rem', marginTop: '1rem' }}>위험 구역</h3>
                            <button className="btn-primary" style={{ background: '#ef4444' }}>서버 삭제</button>
                        </div>

                        {/* Server Properties */}
                        <div className="glass-panel" style={{ padding: '2rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                                <h3>서버 속성 (server.properties)</h3>
                                <button onClick={handleSaveProperties} className="btn-primary">속성 저장</button>
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
                    </div>
                )}
            </div>
        </div>
    );
};
