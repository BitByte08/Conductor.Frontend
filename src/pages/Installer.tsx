import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Download, Box } from 'lucide-react';

export const Installer: React.FC = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const agentId = searchParams.get('agent') || 'test-agent';

    const [step, setStep] = useState(1);
    const [type, setType] = useState<'vanilla' | 'paper'>('vanilla');
    const [versions, setVersions] = useState<any[]>([]);
    const [selectedVersion, setSelectedVersion] = useState('');
    const [installing, setInstalling] = useState(false);

    useEffect(() => {
        if (step === 2) {
            fetch(`/api/metadata/versions/${type}`)
                .then(res => res.json())
                .then(data => {
                    // Normalize data structure if needed
                    // Piston meta: { id: "1.20.4", ... }
                    // Paper: "1.20.4"
                    if (type === 'paper') {
                        // Paper returns list of strings
                        setVersions(data.reverse().map((v: string) => ({ id: v })));
                    } else {
                        setVersions(data);
                    }
                });
        }
    }, [step, type]);

    const handleInstall = async () => {
        setInstalling(true);
        try {
            const res = await fetch(`/api/agent/${agentId}/install`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type, version: selectedVersion })
            });
            if (res.ok) {
                // Wait a moment for visual feedback
                setTimeout(() => {
                    navigate(`/server/${agentId}?tab=console`);
                }, 1500);
            } else {
                alert('Failed to start installation');
                setInstalling(false);
            }
        } catch (e) {
            console.error(e);
            alert('Error installing');
            setInstalling(false);
        }
    };

    return (
        <div className="glass-panel" style={{ padding: '2rem', maxWidth: '600px', margin: '0 auto', position: 'relative', overflow: 'hidden' }}>
            <h2 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Download className="text-primary" />
                서버 설치 (Server Installer)
            </h2>

            {/* Steps Indicator */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '2rem' }}>
                {[1, 2, 3].map(s => (
                    <div key={s} style={{
                        flex: 1, height: '4px', borderRadius: '2px',
                        background: s <= step ? '#818cf8' : 'rgba(255,255,255,0.1)'
                    }} />
                ))}
            </div>

            {step === 1 && (
                <div style={{ display: 'flex', gap: '1rem', flexDirection: 'column' }}>
                    <h3>서버 종류 선택 (Server Type)</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <button
                            className={`glass-panel ${type === 'vanilla' ? 'border-primary' : ''}`}
                            style={{
                                padding: '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem',
                                border: type === 'vanilla' ? '1px solid #818cf8' : '1px solid transparent',
                                cursor: 'pointer'
                            }}
                            onClick={() => setType('vanilla')}
                        >
                            <Box size={32} />
                            <strong>Vanilla (순정)</strong>
                        </button>
                        <button
                            className={`glass-panel ${type === 'paper' ? 'border-primary' : ''}`}
                            style={{
                                padding: '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem',
                                border: type === 'paper' ? '1px solid #818cf8' : '1px solid transparent',
                                cursor: 'pointer'
                            }}
                            onClick={() => setType('paper')}
                        >
                            <Box size={32} color="#a78bfa" />
                            <strong>PaperMC (플러그인)</strong>
                        </button>
                    </div>
                    <button className="btn-primary" style={{ marginTop: '1rem' }} onClick={() => setStep(2)}>다음</button>
                </div>
            )}

            {step === 2 && (
                <div style={{ display: 'flex', gap: '1rem', flexDirection: 'column' }}>
                    <h3>버전 선택 ({type})</h3>
                    <select
                        value={selectedVersion}
                        onChange={e => setSelectedVersion(e.target.value)}
                        style={{
                            padding: '0.75rem', borderRadius: '8px',
                            background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-glass)', color: 'white'
                        }}
                    >
                        <option value="">-- 버전 선택 --</option>
                        {versions.map(v => (
                            <option key={v.id} value={v.id}>{v.id}</option>
                        ))}
                    </select>
                    <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                        <button className="glass-panel" style={{ padding: '0.5rem 1rem', cursor: 'pointer' }} onClick={() => setStep(1)}>이전</button>
                        <button className="btn-primary" disabled={!selectedVersion} onClick={() => setStep(3)}>다음</button>
                    </div>
                </div>
            )}

            {step === 3 && (
                <div style={{ display: 'flex', gap: '1rem', flexDirection: 'column', textAlign: 'center' }}>
                    <h3>설치 확인</h3>
                    <p>
                        종류: <strong>{type}</strong><br />
                        버전: <strong>{selectedVersion}</strong>
                    </p>
                    <div style={{ background: 'rgba(239, 68, 68, 0.1)', padding: '1rem', borderRadius: '8px', color: '#fca5a5', fontSize: '0.9rem' }}>
                        경고: 기존 server.jar 파일이 덮어씌워집니다.
                    </div>
                    <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', justifyContent: 'center' }}>
                        <button className="glass-panel" style={{ padding: '0.5rem 1rem', cursor: 'pointer' }} onClick={() => setStep(2)}>이전</button>
                        <button className="btn-primary" disabled={installing} onClick={handleInstall}>
                            {installing ? '설치 중...' : '서버 설치 시작'}
                        </button>
                    </div>
                </div>
            )}

            {
                installing && (
                    <div style={{
                        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                        background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)',
                        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                        zIndex: 50, borderRadius: '16px'
                    }}>
                        <div className="spinner" style={{
                            width: '48px', height: '48px', border: '4px solid rgba(255,255,255,0.1)',
                            borderTop: '4px solid var(--primary)', borderRadius: '50%',
                            animation: 'spin 1s linear infinite', marginBottom: '1rem'
                        }} />
                        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
                        <h3 style={{ margin: 0 }}>설치 시작 중...</h3>
                        <p style={{ color: 'var(--text-muted)' }}>에이전트에 명령을 전송하고 있습니다.</p>
                    </div>
                )
            }
        </div>
    );
};
