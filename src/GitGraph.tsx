import { useMemo } from 'react';
import { ReactFlow, Controls, Background, Node, Edge, MarkerType } from '@xyflow/react';
import '@xyflow/react/dist/style.css';

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
    // Branches can be spread on x axis.
    
    const branchXMap = new Map<string, number>();
    let maxBranchX = 0;

    commits.forEach((commit, index) => {
      // Find x position
      let xPos = 0;
      
      flowNodes.push({
        id: commit.hash,
        position: { x: 50, y: index * 80 },
        data: { 
          label: (
            <div className="text-left">
              <div className="font-mono text-xs font-bold">{commit.hash.substring(0, 7)}</div>
              <div className="text-xs truncate w-48">{commit.message}</div>
              <div className="text-[10px] text-gray-500">{commit.author}</div>
            </div>
          ) 
        },
        style: {
          background: '#fff',
          border: '1px solid #ddd',
          borderRadius: '4px',
          padding: '8px',
          width: 220,
        },
      });

      // Add edges to parents
      commit.parents.forEach((parentHash, parentIndex) => {
        flowEdges.push({
          id: `${commit.hash}-${parentHash}`,
          source: commit.hash,
          target: parentHash,
          type: 'smoothstep',
          markerEnd: {
            type: MarkerType.ArrowClosed,
          },
          style: {
            strokeWidth: 2,
            stroke: parentIndex === 0 ? '#3b82f6' : '#ef4444',
          }
        });
      });
    });

    return { nodes: flowNodes, edges: flowEdges };
  }, [commits]);

  return (
    <div className="w-full h-full bg-white dark:bg-gray-900 rounded-md border border-gray-200 dark:border-gray-800">
      <ReactFlow nodes={nodes} edges={edges} fitView>
        <Background />
        <Controls />
      </ReactFlow>
    </div>
  );
}
