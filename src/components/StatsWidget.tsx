import React from 'react';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';

interface StatsWidgetProps {
    title: string;
    data: any[];
    dataKey: string;
    color: string;
    unit: string;
}

export const StatsWidget: React.FC<StatsWidgetProps> = ({ title, data, dataKey, color, unit }) => {
    const latestValue = data.length > 0 ? data[data.length - 1][dataKey] : 0;

    return (
        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>{title}</span>
                <span style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--text-main)' }}>
                    {latestValue.toFixed(1)}{unit}
                </span>
            </div>
            <div style={{ height: '100px', width: '100%' }}>
                <ResponsiveContainer>
                    <AreaChart data={data}>
                        <defs>
                            <linearGradient id={`grad-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                                <stop offset="95%" stopColor={color} stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <Area
                            type="monotone"
                            dataKey={dataKey}
                            stroke={color}
                            fillOpacity={1}
                            fill={`url(#grad-${dataKey})`}
                            strokeWidth={2}
                            isAnimationActive={false} // Performance
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};
