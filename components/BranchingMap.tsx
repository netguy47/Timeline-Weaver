
import React, { useMemo, useCallback } from 'react';
import ReactFlow, { 
  Background, 
  Controls, 
  Edge, 
  Node, 
  Position, 
  MarkerType,
  Handle
} from 'reactflow';
import type { Timeline, Article } from '../types';
import Icon from './Icon';

interface BranchingMapProps {
  timeline: Timeline;
  currentArticleId: string | null;
  onNavigateTo: (id: string) => void;
  onClose: () => void;
}

// Custom Node component for better styling
const ArticleNode = ({ data }: any) => {
  const isCurrent = data.isCurrent;
  
  return (
    <div 
      className={`px-4 py-2 border-2 rounded-lg shadow-xl text-center min-w-[150px] transition-all duration-300 ${
        isCurrent 
          ? 'bg-amber-900/80 border-amber-400 text-amber-100 scale-110 z-10' 
          : 'bg-gray-800 border-gray-600 text-gray-300 hover:border-amber-700'
      }`}
    >
      <Handle type="target" position={Position.Left} className="w-2 h-2 !bg-amber-500" />
      <div className="text-[10px] font-mono uppercase tracking-tighter opacity-50 mb-1">
        {isCurrent ? 'Current Nexus' : 'Simulation Node'}
      </div>
      <div className="text-xs font-serif font-bold leading-tight line-clamp-2">
        {data.label}
      </div>
      <Handle type="source" position={Position.Right} className="w-2 h-2 !bg-amber-500" />
    </div>
  );
};

const nodeTypes = {
  article: ArticleNode,
};

export const BranchingMap: React.FC<BranchingMapProps> = ({ 
  timeline, 
  currentArticleId, 
  onNavigateTo, 
  onClose 
}) => {
  const { nodes, edges } = useMemo(() => {
    const nodes: Node[] = [];
    const edges: Edge[] = [];
    
    // Group articles by their distance from root to calculate basic layout
    const levels: Record<string, number> = {};
    const parentToChildMap: Record<string, string[]> = {};
    
    timeline.articles.forEach(a => {
      if (a.parentId) {
        if (!parentToChildMap[a.parentId]) parentToChildMap[a.parentId] = [];
        parentToChildMap[a.parentId].push(a.id);
      }
    });

    const calculateLevels = (id: string, level: number) => {
      levels[id] = level;
      const childIds = parentToChildMap[id] || [];
      childIds.forEach(cId => calculateLevels(cId, level + 1));
    };

    const root = timeline.articles.find(a => a.parentId === null);
    if (root) {
      calculateLevels(root.id, 0);
    }

    // Assign positions based on level and index within level
    const levelCounts: Record<number, number> = {};
    
    timeline.articles.forEach(article => {
      const level = levels[article.id] || 0;
      if (levelCounts[level] === undefined) levelCounts[level] = 0;
      
      const x = level * 300;
      const y = levelCounts[level] * 150;
      levelCounts[level]++;

      nodes.push({
        id: article.id,
        type: 'article',
        data: { 
          label: article.headline,
          isCurrent: article.id === currentArticleId 
        },
        position: { x, y },
      });

      if (article.parentId) {
        edges.push({
          id: `e-${article.parentId}-${article.id}`,
          source: article.parentId,
          target: article.id,
          animated: article.id === currentArticleId || article.parentId === currentArticleId,
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: '#f59e0b',
          },
          style: { 
            stroke: article.id === currentArticleId ? '#fbbf24' : '#4b5563',
            strokeWidth: article.id === currentArticleId ? 3 : 2
          }
        });
      }
    });

    return { nodes, edges };
  }, [timeline, currentArticleId]);

  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    onNavigateTo(node.id);
    onClose();
  }, [onNavigateTo, onClose]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md animate-fade-in">
      <div className="relative w-[95vw] h-[90vh] bg-gray-900 border-2 border-amber-900/50 rounded-2xl overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="p-4 bg-gray-800/50 border-b border-amber-900/30 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-serif text-amber-200">Causal Nexus Map</h2>
            <p className="text-[10px] font-mono text-amber-500 uppercase tracking-widest">Visualizing Temporal Branches</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-700 rounded-full text-amber-400 transition-colors"
          >
            <Icon type="close" className="h-6 w-6" />
          </button>
        </div>

        {/* Graph Area */}
        <div className="flex-grow relative">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            onNodeClick={onNodeClick}
            fitView
            minZoom={0.2}
            maxZoom={1.5}
          >
            <Background color="#1e293b" gap={20} />
            <Controls className="bg-gray-800 border-amber-900/50 fill-amber-500" />
          </ReactFlow>
        </div>

        {/* Legend */}
        <div className="p-3 bg-gray-800/30 border-t border-amber-900/20 text-[10px] font-mono text-amber-500/60 flex gap-6 justify-center">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-amber-900 border border-amber-400 rounded"></div>
            <span>Current Nexus</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-gray-800 border border-gray-600 rounded"></div>
            <span>Simulated Branch</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-0.5 bg-gray-600"></div>
            <span>Causal Link</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BranchingMap;
