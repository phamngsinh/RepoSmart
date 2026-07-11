import { useMemo } from 'react';
import { ReactFlow, Controls, Background, Node, Edge, MarkerType, Handle, Position } from '@xyflow/react';
import '@xyflow/react/dist/style.css';

const CommitNodeComponent = ({ data }: any) => {
  return (
    <div className="relative group cursor-pointer hover:bg-muted/50 rounded-md transition-colors py-1 w-[1000px]">
      <Handle type="target" position={Position.Top} style={{ left: 30, opacity: 0 }} />
      <div className="grid grid-cols-[80px_1fr_150px_150px] gap-4 text-left items-center px-4">
        <div className="font-mono text-xs font-bold text-primary opacity-0 group-hover:opacity-100 transition-opacity">
          {data.hash}
        </div>
        <div className="text-sm truncate font-medium text-foreground">{data.message}</div>
        <div className="text-xs text-muted-foreground truncate">{data.author}</div>
        <div className="text-xs text-muted-foreground">{data.date}</div>
      </div>
      <Handle type="source" position={Position.Bottom} style={{ left: 30, opacity: 0 }} />
    </div>
  );
};

const nodeTypes = {
  commit: CommitNodeComponent,
};

interface CommitNode {
  hash: string;
  message: string;
  author: string;
  timestamp: number;
  parents: string[];
}

export interface GitGraphProps {
  commits: CommitNode[];
}

export function GitGraph({ commits }: GitGraphProps) {
  const { nodes, edges } = useMemo(() => {
    const flowNodes: Node[] = [];
    const flowEdges: Edge[] = [];
    
    // Very naive layout algorithm:
    // Every commit goes to y = index * 60
    commits.forEach((commit, index) => {
      
      flowNodes.push({
        id: commit.hash,
        type: 'commit',
        position: { x: 20, y: index * 40 },
        data: { 
          hash: commit.hash.substring(0, 7),
          message: commit.message,
          author: commit.author,
          date: new Date(commit.timestamp * 1000).toLocaleString()
        },
        style: {
          width: 1000,
          background: 'transparent',
          border: 'none',
          padding: 0,
        },
      });

      // Add edges to parents
      commit.parents.forEach((parentHash, parentIndex) => {
        flowEdges.push({
          id: `${commit.hash}-${parentHash}`,
          source: commit.hash,
          target: parentHash,
          type: 'straight',
          markerEnd: {
            type: MarkerType.ArrowClosed,
            width: 15,
            height: 15,
            color: '#3b82f6'
          },
          style: {
            strokeWidth: 3,
            stroke: '#3b82f6',
          }
        });
      });
    });

    return { nodes: flowNodes, edges: flowEdges };
  }, [commits]);

  return (
    <div className="w-full h-full bg-background rounded-md border-none">
      <ReactFlow nodes={nodes} edges={edges} nodeTypes={nodeTypes} fitView={false} minZoom={1} maxZoom={1} defaultViewport={{ x: 0, y: 0, zoom: 1 }}>
        <Background gap={40} size={1} />
        <Controls />
      </ReactFlow>
    </div>
  );
}
