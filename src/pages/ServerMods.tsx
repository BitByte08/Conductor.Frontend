import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Package, Search, Download } from 'lucide-react';
import api from '../lib/axios';

export const ServerMods: React.FC<{ agentId?: string }> = ({ agentId: propAgentId }) => {
    const [searchParams] = useSearchParams();
    const agentId = propAgentId || searchParams.get('agent') || 'test-agent';

    const [query, setQuery] = useState('');
    const [mods, setMods] = useState<any[]>([]);
    const [searching, setSearching] = useState(false);
    const [installing, setInstalling] = useState<string | null>(null);

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        setSearching(true);
        try {
            const { data } = await api.get(`/api/mods/search?query=${encodeURIComponent(query)}`);
            setMods(data);
        } catch (err) {
            console.error(err);
        } finally {
            setSearching(false);
        }
    };

    const handleInstall = async (mod: any) => {
        // Modrinth result has .project_id, .versions... but search result might be simple
        // For search result, we usually need to fetch versions for that project
        // Simpler for MVP: Assume we can get latest version from slug?
        // Actually Modrinth search result doesn't give direct download link.
        // We might need another backend endpoint to resolve latest version file.
        // Let's assume backend proxy does resolution or we fetch `versions` from modrinth for that project.

        // Let's implement fully:
        // 1. Get Project ID -> 2. Get Versions -> 3. Get Files
        // This is complex for frontend.
        // Better: Backend `POST /api/mods/install` with project_id, and backend resolves it.

        setInstalling(mod.project_id);

        // For now, let's just trigger the backend endpoint we made
        // But wait, our backend expected "url" and "filename".
        // Frontend needs to find those.

        // Quick Hack: Fetch versions for project
        try {
            const vRes = await fetch(`https://api.modrinth.com/v2/project/${mod.project_id}/version`);
            const versions = await vRes.json();
            // Filter game version? For now take latest
            const latest = versions[0];
            const file = latest.files[0];

            await api.post(`/api/agent/${agentId}/mods`, {
                url: file.url,
                filename: file.filename
            });
            alert(`Installed ${file.filename}`);
        } catch (e) {
            console.error(e);
            alert("Failed to install");
        } finally {
            setInstalling(null);
        }
    };

    return (
        <div className="glass-panel" style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
            <h2 style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Package className="text-primary" />
                Mod Manager (Modrinth)
            </h2>

            <form onSubmit={handleSearch} style={{ display: 'flex', gap: '8px', marginBottom: '2rem' }}>
                <input
                    type="text"
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    placeholder="Search for mods (e.g. JEI, JourneyMap)..."
                    style={{ flex: 1 }}
                />
                <button type="submit" className="btn-primary" disabled={searching}>
                    <Search size={18} style={{ marginRight: '8px' }} />
                    {searching ? 'Searching...' : 'Search'}
                </button>
            </form>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {mods.map(mod => (
                    <div key={mod.project_id} className="glass-panel" style={{ padding: '1rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
                        <img src={mod.icon_url} alt="" style={{ width: '48px', height: '48px', borderRadius: '8px', background: '#333' }} />
                        <div style={{ flex: 1 }}>
                            <h3 style={{ margin: '0 0 4px 0' }}>{mod.title}</h3>
                            <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-muted)' }}>{mod.description}</p>
                        </div>
                        <button
                            className="btn-primary"
                            disabled={installing === mod.project_id}
                            onClick={() => handleInstall(mod)}
                        >
                            <Download size={16} />
                            {installing === mod.project_id ? '...' : 'Install'}
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};
