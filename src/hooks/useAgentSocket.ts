import { useEffect, useRef, useState, useCallback } from 'react';

type Message = {
    type: string;
    payload?: any;
};

export const useAgentSocket = (agentId: string) => {
    const ws = useRef<WebSocket | null>(null);
    const [status, setStatus] = useState<string>('DISCONNECTED'); // Connection to Backend
    const [agentStatus, setAgentStatus] = useState<string>('OFFLINE'); // Connection from Agent to Backend
    const [messages, setMessages] = useState<Message[]>([]);

    useEffect(() => {
        // In dev, use proxy or direct localhost
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        // Connect as a CLIENT listener
        const wsUrl = `${protocol}//${window.location.host}/ws/client/${agentId}`;

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

    // Return agentStatus as 'status' for backward compatibility or explicit field
    // But better to expose both or override status
    return { status: agentStatus, wsStatus: status, messages, sendHelp }; // Override status to be Agent Status
};
