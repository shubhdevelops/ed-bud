import React, {
  useEffect,
  useState,
  useCallback,
  useMemo,
  CSSProperties,
  useRef,
} from "react";
import { Loader2, RefreshCw, Bug, Wand2, ExternalLink, GitBranch } from "lucide-react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import ReactFlow, {
  Node,
  Edge,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  Position,
  Handle,
  ReactFlowInstance,
} from "reactflow";
import html2canvas from "html2canvas";
import "reactflow/dist/style.css";

interface MindMapBranch {
  name: string;
  type?: string;
  subbranches?: MindMapBranch[];
  description?: string;
}

interface MindMapData {
  topic: string;
  branches: MindMapBranch[];
}

interface MindMapProps {
  taskId: string;
}

// Custom node component for the mind map
const MindMapNode = ({
  data,
}: {
  data: { label: string; type?: string; isRoot?: boolean };
}) => {
  const nodeStyle: CSSProperties = {
    padding: data.isRoot ? "20px" : "12px",
    background: data.isRoot
      ? "#3b82f6"
      : data.type === "error"
      ? "#ef4444"
      : "#1e40af",
    color: "white",
    borderRadius: "50%",
    minWidth: data.isRoot ? "120px" : "80px",
    minHeight: data.isRoot ? "120px" : "80px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: data.isRoot ? "16px" : "14px",
    fontWeight: data.isRoot ? "600" : "500",
    textAlign: "center",
    boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
    border: "2px solid white",
  };

  return (
    <>
      <Handle
        type="target"
        position={Position.Left}
        style={{ background: "#93c5fd" }}
      />
      <div style={nodeStyle}>{data.label}</div>
      <Handle
        type="source"
        position={Position.Right}
        style={{ background: "#93c5fd" }}
      />
    </>
  );
};

// Node types for React Flow
const nodeTypes = {
  mindMapNode: MindMapNode,
};

export function MindMap({ taskId }: MindMapProps) {
  console.log("MindMap component rendered with taskId:", taskId);

  const [mindmap, setMindmap] = useState<MindMapData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [processingStatus, setProcessingStatus] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [generating, setGenerating] = useState(false);

  // React Flow state
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [reactFlowInstance, setReactFlowInstance] =
    useState<ReactFlowInstance | null>(null);
  const [exporting, setExporting] = useState(false);
  const flowWrapperRef = useRef<HTMLDivElement>(null);

  const fetchMindMap = useCallback(async () => {
    if (!taskId) {
      console.error("No taskId provided to MindMap component");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      console.log("Fetching mind map for taskId:", taskId);

      const url = `http://localhost:5001/status/${taskId}`;
      console.log("Fetching from URL:", url);

      const response = await fetch(url);
      console.log("Response status:", response.status);

      if (!response.ok) {
        console.error("Response not OK:", response.status, response.statusText);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log("Mind map response data:", JSON.stringify(data, null, 2));

      setProcessingStatus(data.status);
      console.log("Processing status set to:", data.status);

      if (data.status === "completed" && data.results?.mindmap) {
        console.log("Mind map found in response");
        // Validate mind map structure
        if (isValidMindMap(data.results.mindmap)) {
          setMindmap(data.results.mindmap);
        } else {
          console.error("Invalid mind map structure:", data.results.mindmap);
          setError("Invalid mind map structure received from server");
        }
      } else if (data.status === "error") {
        console.error("Error status received:", data.error);
        setError(data.error || "Failed to load mind map");
      } else if (data.status !== "completed") {
        // If processing is still ongoing, set a more informative message
        let statusMessage = "Processing not complete yet. ";

        switch (data.status) {
          case "uploaded":
            statusMessage += "File has been uploaded.";
            break;
          case "converting":
            statusMessage += "Converting video to audio.";
            break;
          case "transcribing":
            statusMessage += "Generating transcript.";
            break;
          case "summarizing":
            statusMessage += "Creating summary.";
            break;
          case "generating_notes":
            statusMessage += "Generating notes.";
            break;
          default:
            statusMessage += "Please wait.";
        }

        console.log("Processing status message:", statusMessage);
        setError(statusMessage);
      } else {
        console.warn("Unexpected response format:", data);
        setError("Unexpected response format from server");
      }
    } catch (err) {
      console.error("Error fetching mind map:", err);
      setError(
        "Failed to fetch mind map: " +
          (err instanceof Error ? err.message : String(err))
      );
    } finally {
      setLoading(false);
    }
  }, [taskId]);

  const generateMindMap = async () => {
    if (!taskId) {
      console.error("No taskId provided for mind map generation");
      return;
    }

    try {
      setGenerating(true);
      setError(null);
      console.log("Generating mind map for taskId:", taskId);

      const url = `http://localhost:5001/generate_mindmap/${taskId}`;
      console.log("Generating mind map from URL:", url);

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      console.log("Generation response status:", response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Generation failed:", errorData);
        throw new Error(
          errorData.error || `HTTP error! status: ${response.status}`
        );
      }

      const data = await response.json();
      console.log("Generated mind map data:", JSON.stringify(data, null, 2));

      if (data.status === "success" && data.mindmap) {
        console.log("Mind map generated successfully");
        // Validate mind map structure
        if (isValidMindMap(data.mindmap)) {
          setMindmap(data.mindmap);
        } else {
          console.error("Invalid mind map structure:", data.mindmap);
          setError("Invalid mind map structure received from server");
        }
      } else if (data.status === "processing") {
        // If the mind map is still processing, set the status and start polling
        setProcessingStatus(data.status);
        // The useEffect will handle the polling
      } else {
        console.warn("Unexpected generation response format:", data);
        setError("Unexpected response format from server");
      }
    } catch (err) {
      console.error("Error generating mind map:", err);
      setError(
        "Failed to generate mind map: " +
          (err instanceof Error ? err.message : String(err))
      );
    } finally {
      setGenerating(false);
    }
  };

  // Helper function to validate mind map structure
  const isValidMindMap = (data: any): data is MindMapData => {
    if (!data || typeof data !== "object") {
      console.error("Mind map data is not an object");
      return false;
    }

    if (typeof data.topic !== "string") {
      console.error("Mind map topic is not a string");
      return false;
    }

    if (!Array.isArray(data.branches)) {
      console.error("Mind map branches is not an array");
      return false;
    }

    // Validate each branch
    for (const branch of data.branches) {
      if (typeof branch.name !== "string") {
        console.error("Branch name is not a string:", branch);
        return false;
      }

      if (branch.subbranches && !Array.isArray(branch.subbranches)) {
        console.error("Branch subbranches is not an array:", branch);
        return false;
      }

      // Recursively validate subbranches
      if (branch.subbranches) {
        for (const subbranch of branch.subbranches) {
          if (
            !isValidMindMap({ topic: subbranch.name, branches: [subbranch] })
          ) {
            return false;
          }
        }
      }
    }

    return true;
  };

  // Only fetch if we're already in a processing state (e.g., after generating)
  useEffect(() => {
    console.log("MindMap useEffect triggered");

    if (
      processingStatus &&
      processingStatus !== "completed" &&
      processingStatus !== "error"
    ) {
      console.log("Setting up polling interval for status:", processingStatus);
      fetchMindMap();

      const interval = setInterval(fetchMindMap, 5000); // Poll every 5 seconds

      return () => {
        console.log("Cleaning up MindMap component");
        console.log("Clearing polling interval");
        clearInterval(interval);
      };
    }

    return () => {
      console.log("Cleaning up MindMap component");
    };
  }, [fetchMindMap, processingStatus]);

  // Convert mind map data to React Flow nodes and edges
  useEffect(() => {
    if (!mindmap) return;

    const newNodes: Node[] = [];
    const newEdges: Edge[] = [];
    let nodeId = 0;

    // Helper function to create a unique ID for each node
    const getId = () => `node-${nodeId++}`;

    // Add the central topic node
    const centralNodeId = getId();
    newNodes.push({
      id: centralNodeId,
      type: "mindMapNode",
      position: { x: 0, y: 0 },
      data: {
        label: mindmap.topic,
        isRoot: true,
      },
    });

    // Process branches and create nodes/edges
    const processBranch = (
      branch: MindMapBranch,
      parentId: string,
      level: number,
      index: number,
      total: number
    ) => {
      const branchId = getId();

      // Calculate position based on level
      let radius = level === 1 ? 300 : 200; // Larger radius for first level
      let angleStep = (2 * Math.PI) / total;
      let angle = index * angleStep - Math.PI / 2; // Start from top

      // Adjust angle for better distribution
      if (level > 1) {
        // For subbranches, distribute them in a semicircle facing outward
        const parentNode = newNodes.find((n) => n.id === parentId);
        if (parentNode) {
          const parentAngle = Math.atan2(
            parentNode.position.y,
            parentNode.position.x
          );
          angle =
            parentAngle - Math.PI / 4 + ((index / (total - 1)) * Math.PI) / 2;
        }
      }

      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;

      newNodes.push({
        id: branchId,
        type: "mindMapNode",
        position: { x, y },
        data: {
          label: branch.name,
          type: branch.type || "concept",
        },
      });

      newEdges.push({
        id: `edge-${parentId}-${branchId}`,
        source: parentId,
        target: branchId,
        type: "smoothstep",
        style: {
          stroke: "#93c5fd",
          strokeWidth: 2,
        },
        animated: level === 1,
      });

      if (branch.subbranches && branch.subbranches.length > 0) {
        branch.subbranches.forEach((subbranch, i) => {
          processBranch(
            subbranch,
            branchId,
            level + 1,
            i,
            branch.subbranches!.length
          );
        });
      }
    };

    // Process each branch
    mindmap.branches.forEach((branch, i) => {
      processBranch(branch, centralNodeId, 1, i, mindmap.branches.length);
    });

    setNodes(newNodes);
    setEdges(newEdges);
  }, [mindmap, setNodes, setEdges]);

  const handleRefresh = () => {
    console.log("Manual refresh triggered");
    fetchMindMap();
  };

  const handleDebug = async () => {
    console.log("Debug button clicked");
    try {
      // Fetch debug info from backend
      const response = await fetch("http://localhost:5001/debug/tasks");
      const data = await response.json();
      console.log("Debug data:", data);

      // Also check localStorage
      const storedTaskId = localStorage.getItem("taskId");
      const storedResults = localStorage.getItem("processingResults");

      // Combine all debug info
      const debugData = {
        currentTaskId: taskId,
        backendTasks: data,
        localStorage: {
          taskId: storedTaskId,
          results: storedResults ? JSON.parse(storedResults) : null,
        },
      };

      console.log("Combined debug info:", debugData);
      setDebugInfo(debugData);
    } catch (err) {
      console.error("Error fetching debug info:", err);
      setDebugInfo({
        error: String(err),
        currentTaskId: taskId,
      });
    }
  };

  // Function to export mind map as PNG
  const exportMindMap = useCallback(async () => {
    if (!flowWrapperRef.current || !mindmap) return;

    try {
      setExporting(true);

      // Wait for the next frame to ensure the flow is fully rendered
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Fit the view to ensure all nodes are visible
      if (reactFlowInstance) {
        reactFlowInstance.fitView({ padding: 0.2 });
        // Wait for the view to be fitted
        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      // Create a clone of the flow container to avoid modifying the original
      const flowContainer = flowWrapperRef.current;
      const clone = flowContainer.cloneNode(true) as HTMLElement;

      // Apply styles to ensure proper rendering
      clone.style.position = "absolute";
      clone.style.left = "-9999px";
      clone.style.top = "-9999px";
      document.body.appendChild(clone);

      try {
        // Convert all colors to RGB before capturing
        const convertColorsToRGB = (element: HTMLElement) => {
          // Convert background colors
          const style = window.getComputedStyle(element);
          const bgColor = style.backgroundColor;
          if (
            bgColor &&
            bgColor !== "rgba(0, 0, 0, 0)" &&
            bgColor !== "transparent"
          ) {
            element.style.backgroundColor = bgColor;
          }

          // Convert text colors
          const textColor = style.color;
          if (
            textColor &&
            textColor !== "rgba(0, 0, 0, 0)" &&
            textColor !== "transparent"
          ) {
            element.style.color = textColor;
          }

          // Convert border colors
          const borderColor = style.borderColor;
          if (
            borderColor &&
            borderColor !== "rgba(0, 0, 0, 0)" &&
            borderColor !== "transparent"
          ) {
            element.style.borderColor = borderColor;
          }

          // Process child elements
          Array.from(element.children).forEach((child) => {
            if (child instanceof HTMLElement) {
              convertColorsToRGB(child);
            }
          });
        };

        // Convert colors in the clone
        convertColorsToRGB(clone);

        // Use html2canvas to capture the flow
        const canvas = await html2canvas(clone, {
          backgroundColor: "#ffffff",
          scale: 2, // Higher quality for retina displays
          logging: false,
          useCORS: true,
          allowTaint: true,
          width: flowContainer.clientWidth,
          height: flowContainer.clientHeight,
          onclone: (clonedDoc) => {
            // Additional color conversion for React Flow specific elements
            const flowElements =
              clonedDoc.getElementsByClassName("react-flow__node");
            Array.from(flowElements).forEach((element) => {
              if (element instanceof HTMLElement) {
                // Set explicit RGB colors for nodes
                const isRoot = element.getAttribute("data-isroot") === "true";
                const type = element.getAttribute("data-type");

                if (isRoot) {
                  element.style.backgroundColor = "rgb(59, 130, 246)"; // #3b82f6
                } else if (type === "error") {
                  element.style.backgroundColor = "rgb(239, 68, 68)"; // #ef4444
                } else {
                  element.style.backgroundColor = "rgb(30, 64, 175)"; // #1e40af
                }

                element.style.color = "rgb(255, 255, 255)"; // white
                element.style.borderColor = "rgb(255, 255, 255)"; // white
              }
            });

            // Convert edge colors
            const edges = clonedDoc.getElementsByClassName("react-flow__edge");
            Array.from(edges).forEach((edge) => {
              if (edge instanceof HTMLElement) {
                edge.style.stroke = "rgb(147, 197, 253)"; // #93c5fd
              }
            });
          },
        });

        // Convert canvas to image
        const image = canvas.toDataURL("image/png");

        // Create a temporary link to download the image
        const link = document.createElement("a");
        link.href = image;
        link.download = `${mindmap.topic.replace(/\s+/g, "_")}_mindmap.png`;
        link.target = "_blank";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } finally {
        // Clean up the clone
        document.body.removeChild(clone);
      }
    } catch (error) {
      console.error("Error exporting mind map:", error);
      setError(
        "Failed to export mind map: " +
          (error instanceof Error ? error.message : String(error))
      );
    } finally {
      setExporting(false);
    }
  }, [reactFlowInstance, mindmap]);

  if (loading) {
    console.log("Rendering loading state");
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    console.log("Rendering error state:", error);
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <p className="text-destructive">{error}</p>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleRefresh}
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Retry</span>
          </Button>
          <Button
            variant="outline"
            onClick={handleDebug}
            className="flex items-center gap-2"
          >
            <Bug className="h-4 w-4" />
            <span>Debug</span>
          </Button>
        </div>
        {debugInfo && (
          <div className="mt-4 p-4 bg-muted rounded-md text-xs overflow-auto max-h-[400px]">
            <h3 className="font-bold mb-2">Debug Information:</h3>
            <div className="mb-2">
              <strong>Current Task ID:</strong>{" "}
              {debugInfo.currentTaskId || "None"}
            </div>
            <div className="mb-2">
              <strong>LocalStorage Task ID:</strong>{" "}
              {debugInfo.localStorage?.taskId || "None"}
            </div>
            <div className="mb-4">
              <strong>Backend Tasks:</strong>
              <pre className="mt-1">
                {JSON.stringify(debugInfo.backendTasks, null, 2)}
              </pre>
            </div>
            <div>
              <strong>LocalStorage Results:</strong>
              <pre className="mt-1">
                {JSON.stringify(debugInfo.localStorage?.results, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Always show the generate button if no mind map is available
  if (!mindmap) {
    console.log("Rendering empty state");
    return (
      <div className="flex flex-col h-full">
        <div className="flex justify-between items-start p-4 border-b">
          <h2 className="text-xl font-semibold">Mind Map</h2>
          <Button
            onClick={generateMindMap}
            disabled={generating}
            className="flex items-center gap-2"
          >
            {generating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Generating...</span>
              </>
            ) : (
              <>
                <GitBranch className="h-4 w-4" />
                <span>Generate Mind Map</span>
              </>
            )}
          </Button>
        </div>
        <div className="flex flex-col items-center pt-12 gap-4">
          <p className="text-muted-foreground">No mind map available</p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleRefresh}
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Refresh</span>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-between items-start p-4 border-b">
        <h2 className="text-xl font-semibold">Mind Map</h2>
        <Button
          onClick={generateMindMap}
          disabled={generating}
          className="flex items-center gap-2"
        >
          {generating ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Generating...</span>
            </>
          ) : (
            <>
              <GitBranch className="h-4 w-4" />
              <span>Generate Mind Map</span>
            </>
          )}
        </Button>
      </div>
      <Card className="p-6 flex-1 flex flex-col overflow-hidden">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">{mindmap.topic}</h2>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={exportMindMap}
              className="flex items-center gap-2"
              disabled={!mindmap || exporting}
            >
              {exporting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ExternalLink className="h-4 w-4" />
              )}
              <span>{exporting ? "Exporting..." : "Open in New Window"}</span>
            </Button>
            <Button
              variant="outline"
              onClick={handleRefresh}
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Refresh</span>
            </Button>
          </div>
        </div>

        {/* Flowchart visualization */}
        <div
          ref={flowWrapperRef}
          className="flex-1 overflow-auto min-h-[600px] border rounded-md bg-white"
          style={{ height: "700px" }}
        >
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            nodeTypes={{ mindMapNode: MindMapNode }}
            onInit={setReactFlowInstance}
            fitView
            minZoom={0.5}
            maxZoom={1.5}
            defaultEdgeOptions={{
              type: "smoothstep",
              style: { stroke: "#93c5fd", strokeWidth: 2 },
            }}
            proOptions={{ hideAttribution: true }}
          >
            <Background color="#e2e8f0" gap={16} size={1} />
            <Controls />
          </ReactFlow>
        </div>
      </Card>
    </div>
  );
}
