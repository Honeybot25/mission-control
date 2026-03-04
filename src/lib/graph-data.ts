// Simple graph data stub - minimal working version
export const getGraphData = () => ({
  nodes: [
    { id: 'TraderBot', level: 5, status: 'online' },
    { id: 'ProductBuilder', level: 4, status: 'online' },
    { id: 'Distribution', level: 3, status: 'online' },
    { id: 'MemoryManager', level: 3, status: 'online' },
    { id: 'iOSAppBuilder', level: 2, status: 'online' },
    { id: 'SecurityAgent', level: 2, status: 'online' },
  ],
  edges: [
    { source: 'TraderBot', target: 'ProductBuilder', weight: 5 },
    { source: 'Honey', target: 'TraderBot', weight: 8 },
    { source: 'ProductBuilder', target: 'iOSAppBuilder', weight: 3 },
  ]
});

export default { getGraphData };
