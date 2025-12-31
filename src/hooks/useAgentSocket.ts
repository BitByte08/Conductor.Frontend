import { useEffect, useRef, useState, useCallback } from 'react';

type Message = {
    type: string;
    payload?: any;
    raw?: string;
};

export const useAgentSocket = (agentId: string) => {
    const ws = useRef<WebSocket | null>(null);
    const [status, setStatus] = useState<string>('DISCONNECTED'); // Connection to Backend
    const [agentStatus, setAgentStatus] = useState<string>('OFFLINE'); // Connection from Agent to Backend
    const [messages, setMessages] = useState<Message[]>([]);

    useEffect(() => {
        // In dev, use proxy or direct localhost. Support overriding the API host via Vite env VITE_API_BASE
        const envBase: string = (import.meta.env.VITE_API_BASE as string) || '';
        const isDev = import.meta.env.DEV as boolean;
        const apiBase: string = envBase || (isDev ? `${window.location.protocol}//${window.location.host}` : 'https://conductor.bitworkspace.kr');
        // Convert http(s) -> ws(s)
        const toWs = (u: string) => {
            if (u.startsWith('https://')) return u.replace(/^https:/, 'wss:');
            if (u.startsWith('http://')) return u.replace(/^http:/, 'ws:');
            return u; // assume already ws:// or wss://
        };
        const wsBase = toWs(apiBase.replace(/\/$/, ''));
        const wsUrl = `${wsBase}/ws/client/${agentId}`;

        console.log('Connecting to:', wsUrl);
        const socket = new WebSocket(wsUrl);
        ws.current = socket;

        socket.onopen = () => setStatus('CONNECTED');
        socket.onclose = () => {
            setStatus('DISCONNECTED');
            setAgentStatus('OFFLINE');
        };
        socket.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                if (data.type === 'AGENT_STATUS') {
                    setAgentStatus(data.status);
                } else {
                    setMessages(prev => [...prev.slice(-99), data]); // Keep last 100
                }
            } catch (e) {
                console.error('Parse error', e);
                // Preserve raw messages so UI can show them for debugging
                setMessages(prev => [...prev.slice(-99), { type: 'RAW', raw: event.data }]);
            }
        };

        return () => {
            socket.close();
        };
    }, [agentId]);

    const sendHelp = useCallback((cmd: string) => {
        if (ws.current?.readyState === WebSocket.OPEN) {
            ws.current.send(JSON.stringify({ type: 'COMMAND', payload: { command: cmd } }));
        }
    }, []);

    // Expose both fields for clarity
    return { agentStatus, status: agentStatus, wsStatus: status, messages, sendHelp };
};
