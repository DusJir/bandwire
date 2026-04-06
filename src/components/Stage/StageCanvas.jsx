import ReactFlow, {
  Background, Controls, MiniMap,
  addEdge, applyNodeChanges, applyEdgeChanges,
} from 'reactflow'
import { useCallback, useRef, useMemo } from 'react'
import useStore from '../../store/useStore'
import StageNode            from '../nodes/StageNode'
import StageBackgroundNode  from '../nodes/StageBackgroundNode'
import StageEdge            from '../edges/StageEdge'
import { DIR_ROTATION }     from '../../constants/stageDirections'
import 'reactflow/dist/style.css'

const nodeTypes = { stageDevice: StageNode, stageBackground: StageBackgroundNode }
const edgeTypes = { stageEdge: StageEdge }

export default function StageCanvas() {
  const rfRef = useRef(null)

  const stageData       = useStore(s => s.stageData)
  const updateStageData = useStore(s => s.updateStageData)
  const setSelectedNode = useStore(s => s.setSelectedNode)
  const setSelectedEdge = useStore(s => s.setSelectedEdge)
  const clearSelection  = useStore(s => s.clearSelection)

  const onNodeClick = useCallback((_, n) => {
    if (n.type === 'stageBackground') return
    setSelectedNode(n.id)  // already clears selectedEdgeId
  }, [setSelectedNode])

  const onEdgeClick = useCallback((_, e) => {
    setSelectedEdge(e.id)  // already clears selectedNodeId
  }, [setSelectedEdge])

  const onPaneClick = useCallback(() => clearSelection(), [clearSelection])

  const onNodesChange = useCallback((changes) => {
    const filtered = changes.filter(c => c.type !== 'select')
    if (filtered.length === 0) return
    updateStageData({ nodes: applyNodeChanges(filtered, stageData.nodes || []) })
  }, [stageData.nodes, updateStageData])

  const onEdgesChange = useCallback((changes) => {
    updateStageData({ edges: applyEdgeChanges(changes, stageData.edges || []) })
  }, [stageData.edges, updateStageData])

  const onConnect = useCallback((params) => {
    const next = addEdge({
      ...params,
      type: 'stageEdge',
      data: { stageRole: null, label: '', color: '#888888' },
    }, stageData.edges || [])
    updateStageData({ edges: next })
  }, [stageData.edges, updateStageData])

  const onDrop = useCallback((e) => {
    e.preventDefault()
    const raw = e.dataTransfer.getData('application/bandwire')
    if (!raw) return
    const item = JSON.parse(raw)
    // Use rfRef instead of useReactFlow() hook — avoids shared provider conflicts
    const position = rfRef.current?.screenToFlowPosition({ x: e.clientX, y: e.clientY }) || { x: 100, y: 100 }
    const newNode = {
      id:       'stage-' + crypto.randomUUID().slice(0, 8),
      type:     'stageDevice',
      position,
      zIndex:   1,
      data: {
        label:      item.name?.replace(/_/g, ' ') || 'Device',
        iconSrc:    item.src || null,
        iconName:   item.name || '',
        stageRole:  null,
        stageColor: null,
      },
    }
    updateStageData({ nodes: [...(stageData.nodes || []), newNode] })
  }, [stageData.nodes, updateStageData])

  const enrichedNodes = useMemo(() => {
    const bgNodes = (stageData.nodes || []).filter(n => n.type === 'stageBackground')
    return (stageData.nodes || []).map(node => {
      if (node.type !== 'stageDevice') return node
      const container = bgNodes.find(bg => {
        const { x: bx, y: by } = bg.position
        const w = bg.data?.width  || 600
        const h = bg.data?.height || 400
        return node.position.x >= bx && node.position.x <= bx + w &&
               node.position.y >= by && node.position.y <= by + h
      })
      const rotation = container ? -(DIR_ROTATION[container.data?.fohDirection] ?? 0) : 0
      return { ...node, data: { ...node.data, stageRotation: rotation } }
    })
  }, [stageData.nodes])

  return (
    <ReactFlow
      nodes={enrichedNodes}
      edges={stageData.edges || []}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onConnect={onConnect}
      onDrop={onDrop}
      onDragOver={e => { e.preventDefault(); e.dataTransfer.dropEffect = 'move' }}
      nodeTypes={nodeTypes}
      edgeTypes={edgeTypes}
      onNodeClick={onNodeClick}
      onEdgeClick={onEdgeClick}
      onPaneClick={onPaneClick}
      onInit={rf => { rfRef.current = rf }}
      fitView
      deleteKeyCode={null}
    >
      <Background />
      <Controls />
      <MiniMap nodeStrokeWidth={3} zoomable pannable />
    </ReactFlow>
  )
}
