import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAgentSocket } from '../hooks/useAgentSocket';
import { apiUrl } from '../lib/api';
import { Send, Terminal as TerminalIcon, Play, Square } from 'lucide-react';

export const Console: React.FC = () => {
    const params = useParams<{ agentId: string }>();
    const agentId = params.agentId || 'test-agent';
    const { agentStatus, wsStatus, messages } = useAgentSocket(agentId);
    const [input, setInput] = useState('');

    const sendCommand = async (cmd: string) => {
        await fetch(apiUrl(`/api/agent/${agentId}/command`), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ command: cmd })
        });
    };

    const handleAction = async (action: 'start' | 'stop') => {
        await fetch(apiUrl(`/api/agent/${agentId}/${action}`), { method: 'POST' });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim()) return;

        // Optimistic local echo?
        // setMessages(prev => [...prev, { type: 'CMD', payload: { line: `> ${input}` } }]);

        await sendCommand(input);
        setInput('');
    };

    return (
        <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 4rem)', padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
                    <TerminalIcon size={24} className="text-primary" />
                    Server Console
                </h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <button onClick={() => handleAction('start')} className="btn-primary" style={{ display: 'flex', gap: '4px', background: '#3b82f6' }}>
                            <Play size={16} /> Start
                        </button>
                        <button onClick={() => handleAction('stop')} className="btn-primary" style={{ display: 'flex', gap: '4px', background: '#ef4444' }}>
                            <Square size={16} /> Stop
                        </button>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{
                            width: '8px', height: '8px', borderRadius: '50%',
                            background: wsStatus === 'CONNECTED' ? '#4ade80' : '#ef4444'
                        }} />
                        <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>{wsStatus} / {agentStatus}</span>
                    </div>
                </div>
            </div>

            {/* Log Output Area */}
            <div style={{
                flex: 1,
                background: 'rgba(0,0,0,0.3)',
                borderRadius: '8px',
                padding: '1rem',
                overflowY: 'auto',
                fontFamily: 'monospace',
                marginBottom: '1rem',
                border: '1px solid var(--border-glass)',
                fontSize: '0.9rem',
                color: '#e5e7eb'
            }}>
                {messages.length === 0 ? (
                    <div style={{ color: 'var(--text-muted)', textAlign: 'center', marginTop: '2rem' }}>Waiting for logs...</div>
                ) : (
                    messages.map((msg, idx) => {
                        // Handle different message types
                        const payload = msg.payload || {};
                        let content = "";
                        let color = "inherit";

                        if (msg.type === "LOG") {
                            content = payload.line;
                        } else if (msg.type === "HEARTBEAT") {
                            // Don't show heartbeats in console usually, 
                            // maybe show in status bar?
                            // For debug, let's skip
                            return null;
                        } else {
                            content = JSON.stringify(msg);
                            color = "#818cf8";
                        }

                        return (
                            <div key={idx} style={{ marginBottom: '2px', color, whiteSpace: 'pre-wrap' }}>
                                {content}
                            </div>
                        );
                    })
                )}
            </div>

            {/* Input Area */}
            <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '8px' }}>
                <input
                    type="text"
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    placeholder="Type a command (/op, /gamemode)..."
                    style={{ flex: 1 }}
                />
                <button type="submit" className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Send size={16} />
                    Send
                </button>
            </form>
        </div>
    );
};
