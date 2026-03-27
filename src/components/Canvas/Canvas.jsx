import { useCallback } from 'react'
import ReactFlow, { Background, Controls, MiniMap, useReactFlow } from 'reactflow'
import 'reactflow/dist/style.css'
import HardwareNode from '../nodes/HardwareNode'
import RackPortNode from '../nodes/RackPortNode'
import RackNode from '../nodes/RackNode'
import CableEdge from '../edges/CableEdge'
import useStore from '../../store/useStore'

const nodeTypes = { hardware: HardwareNode, rack: RackNode, rackPort: RackPortNode }
const edgeTypes = { cable: CableEdge }

export default function Canvas() {
  const {
    selectedCableType,
    setSelectedNode, setSelectedEdge, clearSelection,
    addEdgeToScene, setNodes,
    enterRackScene,
  } = useStore()

  const scene   = useStore(s => s.currentScene())
  const nodes   = scene?.nodes || []
  const edges   = scene?.edges || []
  const onNC    = useStore(s => s.onNodesChange)
  const onEC    = useStore(s => s.onEdgesChange)

  const { screenToFlowPosition } = useReactFlow()

  const onConnect  = useCallback((p) => addEdgeToScene(p, selectedCableType), [addEdgeToScene, selectedCableType])
  const onDragOver = useCallback((e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move' }, [])

  const onDrop = useCallback((e) => {
    e.preventDefault()
    const raw = e.dataTransfer.getData('application/bandwire')
    if (!raw) return
    const iconData = JSON.parse(raw)
    const position = screenToFlowPosition({ x: e.clientX, y: e.clientY })

    const isRack = iconData.isRack
    const newNode = {
      id:   'node-' + crypto.randomUUID(),
      type: isRack ? 'rack' : 'hardware',
      position,
      data: isRack
        ? { label: 'Rack', notes: '', color: null }
        : {
            label:   iconData.name.replace(/_/g, ' '),
            model:   iconData.model || '',
            iconSrc: iconData.src,
            inputs:  (iconData.defaultInputs  || [{ id: 'in-0',  label: 'In',  connector: 'XLR' }]),
            outputs: (iconData.defaultOutputs || [{ id: 'out-0', label: 'Out', connector: 'XLR' }]),
            notes:   '',
            color:   null,
          },
    }
    setNodes(prev => [...prev, newNode])
  }, [screenToFlowPosition, setNodes])

  const onNodeClick = useCallback((_, node) => {
    setSelectedNode(node.id)
  }, [setSelectedNode])

  const onNodeDoubleClick = useCallback((_, node) => {
    if (node.type === 'rack') enterRackScene(node.id, node.data.label)
  }, [enterRackScene])

  const onEdgeClick  = useCallback((_, edge) => setSelectedEdge(edge.id), [setSelectedEdge])
  const onPaneClick  = useCallback(() => clearSelection(), [clearSelection])

  return (
    <div className="canvas-container">
      <ReactFlow
        nodes={nodes} edges={edges}
        onNodesChange={onNC} onEdgesChange={onEC}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        onNodeDoubleClick={onNodeDoubleClick}
        onEdgeClick={onEdgeClick}
        onPaneClick={onPaneClick}
        onDrop={onDrop} onDragOver={onDragOver}
        nodeTypes={nodeTypes} edgeTypes={edgeTypes}
        deleteKeyCode={null}
        fitView fitViewOptions={{ padding: 0.2 }}
        proOptions={{ hideAttribution: true }}
        connectionRadius={10}
      >
        <Background color="#1e1e30" gap={28} size={1} />
        <Controls />
        <MiniMap nodeColor="#6366f1" maskColor="rgba(0,0,0,0.75)" />
      </ReactFlow>
    </div>
  )
}
