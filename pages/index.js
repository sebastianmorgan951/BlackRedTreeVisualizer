import { createRef, useReducer, useRef, useState } from "react";
import Edge from "../components/edge";
import Node from "../components/node";

/** Idea: remove all states tracking center, just change stuff while things are */

/** Action must have a few params
 *    type: type of action
 *    ind: node id number
 */
const nodeReducer = (state, action) => {
  switch (action.type) {
    case "add":
      var updated = state;
      updated.push({
        id: action.ind,
        ref: action.ref,
        edges: [],
      });
      return updated;
    case "addEdge":
      console.log("added edge");
      var updated = state.map((a) => {
        let returnVal = { ...a };
        if (a.id === action.ind) {
          returnVal.edges.push(action.e_id);
        }
        return returnVal;
      });
      return updated;
    case "remove":
      var updated = state.map((a) => {
        let returnVal = { ...a };
        if (a.id === action.ind) {
          returnVal = null;
        }
        return returnVal;
      });
      return updated;
  }
};

const edgeReducer = (state, action) => {
  switch (action.type) {
    case "remove":
      var updated = state.filter((e) => {
        if (e.id !== action.ind) return e;
        return null;
      });
      return updated;
    case "add":
      var updated = state;
      updated.push({
        id: action.ind,
        start: action.start,
        end: action.end,
        ref: action.ref,
      });
      return updated;
  }
};

export default function Home() {
  /**
   * P = Pan
   * S = Select (and for Dragging)
   */
  const [mouseState, setMouseState] = useState("E");
  const [currInd, setCurrInd] = useState(0);
  const [currEdge, setCurrEdge] = useState(0);
  const [selected, setSelected] = useState("");

  const [nodes, nodeChangeDispatch] = useReducer(nodeReducer, [
    /*{
      id: 0,
      edges: [],
      ref: {},
    },*/
  ]);
  const [edges, edgeChangeDispatch] = useReducer(edgeReducer, [
    /*{
      id: 0,
      start, number, (id)
      end: number,
      ref: {},
    },*/
  ]);

  /** Called when use wants to enlarge space */
  const enlargeCanvas = () => {
    document.getElementById("canvas").style.width = "2000px";
  };

  const handleAddNode = () => {
    nodeChangeDispatch({
      type: "add",
      ind: currInd,
      ref: createRef(),
    });
    setCurrInd(currInd + 1);
  };

  const handleNodeClick = (e, id) => {
    if (mouseState !== "E") {
      draggable(e, id);
      return;
    }
    if (selected == "") {
      setSelected(id);
      return;
    }
    edgeLinking(e, id);
  };

  const edgeLinking = (e, id) => {
    const endNodeNum = parseInt(id.match(/\d+$/)[0]);
    const startNodeNum = parseInt(selected.match(/\d+$/)[0]);

    edgeChangeDispatch({
      type: "add",
      ind: currEdge,
      ref: createRef(),
      start: startNodeNum,
      end: endNodeNum,
    });
    nodeChangeDispatch({
      type: "addEdge",
      ind: startNodeNum,
      e_id: currEdge,
    });
    nodeChangeDispatch({
      type: "addEdge",
      ind: endNodeNum,
      e_id: currEdge,
    });

    setCurrEdge(currEdge + 1);
    setSelected("");
  };

  const draggable = (e, id) => {
    e.preventDefault();

    const drag = document.getElementById(id);
    const boundingRect = drag.getBoundingClientRect();
    const nodeIdNum = parseInt(id.match(/\d+$/)[0]);

    /** Array containing references to edges connected to this node */
    const edgeRefs = nodes[nodeIdNum].edges.map((a) =>
      document.getElementById(`edge${a}`)
    );

    /** Array containing whether or not this node is the start or end of the edge, where
     * the index of entry in this array corresponds to the edge at the same index of the
     * edgeRefs array
     */
    const isStart = nodes[nodeIdNum].edges.map(
      (a) => edges[a].start === nodeIdNum
    );

    let left = boundingRect.left;
    let top = boundingRect.top;
    let offsetX = e.clientX - left;
    let offsetY = e.clientY - top;
    let width = boundingRect.width;
    let height = boundingRect.height;

    drag.style.zIndex = 1000;

    moveAt(e.pageX, e.pageY);

    // moves the drag at (pageX, pageY) coordinates
    // taking initial offsets into account
    function moveAt(pageX, pageY) {
      let i = 0;
      for (let i = 0; i < edgeRefs.length; i++) {
        const isStartPoint = isStart[i];
        const ref = edgeRefs[i];
        if (isStartPoint) {
          ref.attributes.x1.nodeValue = pageX - offsetX + width / 2 + "px";
          ref.attributes.x1.value = pageX - offsetX + width / 2 + "px";
          ref.attributes.x1.textContent = pageX - offsetX + width / 2 + "px";
          ref.attributes.y1.nodeValue = pageY - offsetY + height / 2 + "px";
          ref.attributes.y1.value = pageY - offsetY + height / 2 + "px";
          ref.attributes.y1.textContent = pageY - offsetY + height / 2 + "px";
        } else {
          ref.attributes.x2.nodeValue = pageX - offsetX + width / 2 + "px";
          ref.attributes.x2.value = pageX - offsetX + width / 2 + "px";
          ref.attributes.x2.textContent = pageX - offsetX + width / 2 + "px";
          ref.attributes.y2.nodeValue = pageY - offsetY + height / 2 + "px";
          ref.attributes.y2.value = pageY - offsetY + height / 2 + "px";
          ref.attributes.y2.textContent = pageY - offsetY + height / 2 + "px";
        }
      }
      drag.style.left = pageX - offsetX + "px";
      drag.style.top = pageY - offsetY + "px";
    }

    function onMouseMove(e) {
      moveAt(e.pageX, e.pageY);
    }

    const drop = () => {
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseMove);
      drag.style.zIndex = 10;
      return;
    };

    document.addEventListener("mouseup", drop);
    document.addEventListener("mousemove", onMouseMove);
  };

  return (
    <div id="canvas" className="relative min-w-full min-h-screen bg-background">
      <div className="sticky top-2 z-20 left-2 w-min flex flex-col justify-evenly items-center bg-black">
        <button
          className="p-5 bg-white w-full"
          onClick={() => {
            setMouseState("E");
          }}
        >
          Edge
        </button>
        <button className="p-5 bg-white w-full" onClick={() => handleAddNode()}>
          Node
        </button>
        <button
          className="p-5 bg-white w-full"
          onClick={() => {
            setMouseState("S");
            setSelected("");
          }}
        >
          Select
        </button>
        <button className="p-5 bg-white w-full" onClick={() => enlargeCanvas()}>
          Canvas
        </button>
      </div>
      <div className={`absolute top-0 left-0 z-0 overflow-visible`}>
        <svg overflow="visible" width="100%" height="100%">
          {edges.map((a) => {
            if (!a) {
              return;
            }
            return (
              <Edge
                id={`edge${a.id}`}
                key={`edge${a.id}`}
                setRef={a.ref}
                startRef={nodes[a.start].ref}
                endRef={nodes[a.end].ref}
              />
            );
          })}
        </svg>
      </div>
      {nodes.map((a) => {
        return (
          <Node
            id={`node${a.id}`}
            key={`node${a.id}`}
            setRef={a.ref}
            color="bg-black"
            onMouseDown={(e) => {
              handleNodeClick(e, `node${a.id}`);
            }}
            size={50}
          />
        );
      })}
    </div>
  );
}
