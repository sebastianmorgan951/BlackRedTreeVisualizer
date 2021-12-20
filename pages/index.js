import { createRef, useEffect, useReducer, useRef, useState } from "react";
import Edge from "../components/edge";
import Node from "../components/node";

/* TODO: When a node has a self edge, if we move that node, self edge does not update accordingly, why? */

/** Action must have a few params
 *    type: type of action
 *    ind: node id number
 *
 * TODO: Might need to add label to this as well?
 */
const nodeReducer = (state, action) => {
  switch (action.type) {
    case "add":
      var updated = state;
      updated.push({
        id: action.ind,
        ref: action.ref,
        edges: [],
        isBlack: true,
      });
      return updated;
    case "addEdge":
      var updated = [...state];
      updated[action.ind].edges.push(action.e_id);
      return updated;
    case "removeEdge":
      /* Action must have
       * id: node position in array nodes object
       * e_id: edge position in node[id].edges array
       * */
      var updated = [...state];
      updated[action.ind].edges.splice(action.e_id, 1);
      return updated;
    case "changeColor":
      var updated = [...state];
      updated[action.ind].isBlack = !updated[action.ind].isBlack;
      return updated;
    case "remove":
      var updated = state.map((a) => {
        if (!a) return a;
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
      var updated = state.map((a) => {
        if (!a) return a;
        let returnVal = { ...a };
        if (a.id === action.ind) {
          returnVal = null;
        }
        return returnVal;
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

const labelReducer = (state, action) => {
  switch (action.type) {
    case "change":
      let updatedState = [...state];
      while (action.ind >= updatedState.length) {
        updatedState.push("Label");
      }
      updatedState[action.ind] = action.label;
      return updatedState;
  }
};

export default function Home() {
  /**
   * P = Pan
   * S = Select (and for Dragging)
   * E = edge
   */
  const [mouseState, setMouseState] = useState("E");
  const [currInd, setCurrInd] = useState(0);
  const [currEdge, setCurrEdge] = useState(0);
  const [selected, setSelected] = useState("");
  const [rootId, setRootId] = useState(0);
  const [verifyMessage, setVerifyMessage] = useState("");

  let tree = [
    /*
    {
      label: "",
      parent: num,
      parentId: num,
      left: num,
      leftId: num,
      right: num,
      rightId: num,
      id: num,
      isBlack: bool,
    }
     */
  ];

  let verifyState = {
    numVisited: 0,
    redHasRedChildren: false,
    blackHeightGood: true,
    exceedsMaxEdgeCount: false,
    hasCycle: false,
    badOrder: false,
    sameLabel: false,
  };

  const [nodeSize, setNodeSize] = useState(50);

  const [label, labelChangeDispatch] = useReducer(labelReducer, [
    /* Contains strings corresponding to the id of node
     *
     * We use a separate object for this, as if this was part of the node state,
     * this would force many re-renders to take place on a label change. This
     * is because we use a contenteditable <p> tag to contain the label, and use
     * onInput to record the label into our application when it is changed. This
     * is called every time the input is changed, meaning if this was part of the
     * node reducer state, it would mutate the "nodes" array many times for a
     * single label, repainting the entire set of nodes multiple times. This is
     * potentially slow, so we use a separate storage system, as us storing the
     * labels should not force a re-render.
     */
  ]);

  const [nodes, nodeChangeDispatch] = useReducer(nodeReducer, [
    /*{
      id: 0,
      edges: [],
      ref: {},
      isBlack: true,
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
    const nodeIdNum = parseInt(id.match(/\d+$/)[0]);

    switch (mouseState) {
      case "S":
        draggable(e, id);
        return;
      case "E":
        if (selected == "") {
          setSelected(id);
          return;
        }
        edgeLinking(id);
        return;
      case "C":
        nodeChangeDispatch({
          type: "changeColor",
          ind: nodeIdNum,
        });
        return;
      case "D":
        deleteNode(nodeIdNum);
        return;
      case "R":
        setRootId(nodeIdNum);
        return;
    }
  };

  const edgeLinking = (id) => {
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

    /** Array containing details of the edges, an entry has
     *    -1: If this node is the start of the edge
     *     0: If this edge is a self edge
     *     1: If this node is the end of the edge
     *
     * Array containing whether or not this node is the start or end of the edge, where
     * the index of entry in this array corresponds to the edge at the same index of the
     * edgeRefs array
     */
    const isStart = nodes[nodeIdNum].edges.map((a) => {
      if (edges[a].start === nodeIdNum) {
        if (edges[a].end === nodeIdNum) {
          return 0;
        }
        return -1;
      }
      return 1;
    });

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
        const edgeCase = isStart[i];
        const ref = edgeRefs[i];
        if (edgeCase === -1 || edgeCase === 0) {
          ref.attributes.x1.nodeValue = pageX - offsetX + width / 2 + "px";
          ref.attributes.x1.value = pageX - offsetX + width / 2 + "px";
          ref.attributes.x1.textContent = pageX - offsetX + width / 2 + "px";
          ref.attributes.y1.nodeValue = pageY - offsetY + height / 2 + "px";
          ref.attributes.y1.value = pageY - offsetY + height / 2 + "px";
          ref.attributes.y1.textContent = pageY - offsetY + height / 2 + "px";
        }
        if (edgeCase === 1 || edgeCase === 0) {
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

  const addToTree = (action) => {
    tree.push({
      label: action.label,
      left: action.leftLabel,
      right: action.rightLabel,
      parent: action.parentLabel,
      isBlack: action.isBlack,
    });
  };

  /**
   * @param id, the index of the node within the nodes array to be deleted
   *
   * This function is called when we delete a node.
   *    1. The function gets the node and iterates through its edges.
   *    2. When it finds an edge which leads to another node and isn't in foundNeighbors
   *      1. It adds the neighboring node to the foundNeighbors list.
   *      2. It goes through every edge of the neighboring node
   *      3. It removes every edge of the neighbor that has an endpoint at the current node
   *        (Note, these edges must be both removed from the nodes object and edges object)
   *        (With the nodes object, we can simply remove the edge from the list of edges)
   *        (With the edges object, we turn that edge into null, as if we simply removed
   *          it, we would ruin our system of edge IDs which correspond to the edges array
   *          indices, we must preserve these indices, so we do not want to resize the arr)
   *    3. Continues iterating until all edges have been searched
   *    4. Deletes the current node (by turning the object into null, preserving the size
   *        of this array so as not to ruin our IDing Node system by array index)
   */
  const deleteNode = (id) => {
    const removeEdge = (edgesArrId, nodeEdgesArrId, neighborNodeId) => {
      nodeChangeDispatch({
        type: "removeEdge",
        ind: neighborNodeId,
        e_id: nodeEdgesArrId,
      });
      edgeChangeDispatch({
        type: "remove",
        ind: edgesArrId,
      });
    };

    const currNode = nodes[id];

    const foundNeighbors = [];
    for (let i = 0; i < currNode.edges.length; i++) {
      const edge = edges[currNode.edges[i]];

      /* Ignore self edge */
      if (edge.start === edge.end) {
        edgeChangeDispatch({
          type: "remove",
          ind: edge.id,
        });
        continue;
      }

      /* Get the position of the neighbor node within the nodes array */
      const endPoint = edge.start === id ? edge.end : edge.start;
      const neighborNode = nodes[endPoint];

      if (foundNeighbors.find((e) => e === endPoint)) {
        continue;
      }
      foundNeighbors.push(endPoint);

      for (let j = 0; j < neighborNode.edges.length; j++) {
        const neighborEdge = edges[neighborNode.edges[j]];
        const neighborEndPoint =
          neighborEdge.start === neighborNode.id
            ? neighborEdge.end
            : neighborEdge.start;

        if (neighborEndPoint !== id) continue;

        removeEdge(neighborEdge.id, j, neighborNode.id);
      }
    }
    nodeChangeDispatch({
      type: "remove",
      ind: id,
    });
  };

  /** We expect labels to be integers (so we can parseInt) */
  const recursivelyCheckAndBuildTree = (currNode, parentNode) => {
    const currLabel = parseInt(label[currNode.id]);
    const currId = currNode.id;
    let parentId = -1;
    let parentLabel = undefined;

    /* Quit if any error states are true */
    if (
      verifyState.exceedsMaxEdgeCount ||
      verifyState.hasCycle ||
      verifyState.sameLabel ||
      verifyState.badOrder
    ) {
      return;
    }

    if (parentNode) {
      /* Non-Root Node Case */
      parentLabel = parseInt(label[parentNode.id]);
      parentId = parentNode.id;
    }

    /* Identify & store non-parent and non-self edges from the current node */
    let childEdges = [];
    for (let i = 0; i < currNode.edges.length; i++) {
      const edge = edges[currNode.edges[i]];

      console.log(edge);

      /* Ignore self-edges */
      if (edge.start === edge.end) {
        continue;
      }

      /* Ignore edges to parent */
      if (
        (edge.start === currId || edge.end === currId) &&
        (edge.start === parentId || edge.end === parentId)
      ) {
        continue;
      }

      /* Ignore extra copies of an edge if multiple edges between a node and another node exists */
      let currEdgeInChildrenAlready = false;
      for (let i = 0; i < childEdges.length; i++) {
        const childEdge = childEdges[i];
        if (
          (edge.start === childEdge.start || edge.end === childEdge.start) &&
          (edge.start === childEdge.end || edge.end === childEdge.end)
        ) {
          currEdgeInChildrenAlready = true;
          break;
        }
      }
      if (currEdgeInChildrenAlready) {
        continue;
      }

      childEdges.push(edge);
    }

    /* Invalid tree structure case (more than 2 children edges) */
    if (childEdges.length > 2) {
      verifyState = {
        ...verifyState,
        exceedsMaxEdgeCount: true,
      };
      return;
    }

    /* Set the left and right children accordingly from the valid edges from currNode
     *
     *  leftChild and rightChild are to construct the tree node
     *  leftNodeId and rightNodeId are to recursively call this function on the children
     * */
    let leftChild = undefined;
    let rightChild = undefined;
    let leftNodeId = undefined;
    let rightNodeId = undefined;
    for (let i = 0; i < childEdges.length; i++) {
      const edge = childEdges[i];
      const startId = edge.start;
      const endId = edge.end;
      const endLabel = parseInt(label[endId]);
      const startLabel = parseInt(label[startId]);

      /* Have a node with identical value as a neighbor, two nodes with same val */
      if (endLabel === startLabel) {
        verifyState = {
          ...verifyState,
          sameLabel: true,
        };
        return;
      }

      /* Find which endpoint of the edge corresponds to a neighboring node */
      let toAdd = startId === currId ? endLabel : startLabel;
      let toAddId = startId === currId ? endId : startId;

      /* Assign left and right children, if we have two children and attempt to
       * set both children to be left/right children, we throw an error of badOrder,
       * meaning a node has two children with labels that can not form a valid tree */
      if (toAdd < currLabel) {
        if (leftChild) {
          verifyState = {
            ...verifyState,
            badOrder: true,
          };
          return;
        }
        leftNodeId = toAddId;
        leftChild = toAdd;
      } else {
        if (rightChild) {
          verifyState = {
            ...verifyState,
            badOrder: true,
          };
          return;
        }
        rightNodeId = toAddId;
        rightChild = toAdd;
      }
    }

    /* If our tree already has a node of the same label in it, then either we have reached this same
     * node via cycle, or this is a new node with a label that exists on another node in the tree */
    if (tree.find((e) => e.label === currLabel)) {
      verifyState = {
        ...verifyState,
        sameLabel: true,
        hasCycle: true,
      };
      return;
    }

    verifyState = {
      ...verifyState,
      numVisited: verifyState.numVisited + 1,
    };

    /* Construct our tree */
    addToTree({
      label: currLabel,
      leftLabel: leftChild,
      rightLabel: rightChild,
      parentLabel: parentLabel,
      isBlack: currNode.isBlack,
    });

    if (leftChild) {
      recursivelyCheckAndBuildTree(nodes[leftNodeId], currNode);
    }
    if (rightChild) {
      recursivelyCheckAndBuildTree(nodes[rightNodeId], currNode);
    }
  };

  /* Returns [id of node with given label, node] */
  const getTreeNode = (label) => {
    if (!label) {
      return [-1, undefined];
    }
    for (let i = 0; i < tree.length; i++) {
      if (tree[i].label === label) {
        return [i, tree[i]];
      }
    }
    return [-1, undefined];
  };

  const checkIsTreeBSTAndRed = (node, min, max) => {
    /* First, get left, right, parent nodes, connect them by id within tree */

    if (
      verifyState.redHasRedChildren ||
      !verifyState.blackHeightGood ||
      verifyState.hasCycle ||
      verifyState.badOrder ||
      verifyState.sameLabel
    ) {
      return false;
    }

    /* Stop recursion if a node is undefined */
    if (!node) {
      return true;
    }

    const currId = getTreeNode(node.label)[0];
    const [leftId, leftNode] = getTreeNode(node.left);
    const [rightId, rightNode] = getTreeNode(node.right);
    const [parentId, parentNode] = getTreeNode(node.parent);

    /* These IDs are sort of pointers within our tree to the surrounding nodes */
    tree[currId] = {
      ...tree[currId],
      leftId: leftId,
      rightId: rightId,
      parentId: parentId,
      id: currId,
    };

    /* Checks if tree has BST ordering */
    if (node.label > max || node.label < min) {
      verifyState = {
        ...verifyState,
        badOrder: true,
      };
      return false;
    }

    /* Checks if we have currnode is red with childnode is red, not allowed */
    if (!node.isBlack) {
      if (
        (leftNode && !leftNode.isBlack) ||
        (rightNode && !rightNode.isBlack)
      ) {
        verifyState = {
          ...verifyState,
          redHasRedChildren: true,
        };
        return false;
      }
    }

    if (
      checkIsTreeBSTAndRed(leftNode, min, node.label - 1) &&
      checkIsTreeBSTAndRed(rightNode, node.label + 1, max)
    ) {
      return true;
    }
  };

  /* Credit to this stackoverflow answer for this simple black height algorithm
   *
   * https://stackoverflow.com/questions/27731072/check-whether-a-tree-satisfies-the-black-height-property-of-red-black-tree
   *
   * This simply checks if the black height property is satisfied on a tree */
  const checkTreeBlackHeight = (node) => {
    if (!node) {
      return 0;
    }
    let leftHeight = checkTreeBlackHeight(tree[node.leftId]);
    let rightHeight = checkTreeBlackHeight(tree[node.rightId]);
    let addCurrNode = node.isBlack ? 1 : 0;

    if (leftHeight === -1 || rightHeight === -1 || leftHeight !== rightHeight) {
      return -1;
    } else {
      return leftHeight + addCurrNode;
    }
  };

  const isValidRedBlackTree = (root) => {
    const nodeCount = nodes.length - nodes.filter((x) => x === null).length;

    /* Call with (current node, last node)
     *
     * Will construct tree for algorithm usage and make sure the structure is a valid tree
     * (has at most two children*/
    recursivelyCheckAndBuildTree(root, null);
    if (
      verifyState.exceedsMaxEdgeCount ||
      verifyState.hasCycle ||
      verifyState.sameLabel ||
      verifyState.badOrder
    ) {
      setVerifyMessage("This is not a valid tree");
      return false;
    }

    /* Call with tree[0], which is garaunteed to be root node,
     *  checks red properties (no red node with red children), checks
     *  BST property fully
     *
     * This also will link the tree, giving each tree node pointers to their parents, and children
     *  */
    if (
      !checkIsTreeBSTAndRed(
        tree[0],
        Number.MIN_SAFE_INTEGER,
        Number.MAX_SAFE_INTEGER
      )
    ) {
      setVerifyMessage("This is not a valid tree");
      return false;
    }

    /* Checks if there are any disconnected nodes in our structure */
    if (tree.length !== nodeCount) {
      setVerifyMessage("This is not a valid tree");
      return false;
    }

    /** Checks Black height property is respected */
    if (checkTreeBlackHeight(tree[0]) === -1) {
      setVerifyMessage("This is not a valid tree");
      return false;
    }
    setVerifyMessage("This is a valid tree");
    return true;
  };

  const resetVerifyState = () => {
    verifyState = {
      numVisited: 0,
      redHasRedChildren: false,
      blackHeightGood: true,
      exceedsMaxEdgeCount: false,
      hasCycle: false,
      badOrder: false,
      sameLabel: false,
    };
  };

  const verifyStruct = () => {
    resetVerifyState();
    tree = [];

    const nodeCount = nodes.length - nodes.filter((x) => x === null).length;

    /** Empty tree case */
    if (nodeCount === 0) {
      setVerifyMessage("The empty Red-Black Tree is a valid structure");
      return;
    }

    /* TODO: Use a find-union data structure to check if the tree is fully connected
     *
     * Use an array to store ids of edges, keep adding to it until it cannot be added to, check
     * if length = length of nodes */

    let rootNode;
    /** Making sure root node is valid */
    if (rootId >= 0 && nodes[rootId] && nodes[rootId].isBlack) {
      rootNode = nodes[rootId];
    } else {
      rootNode = null;
      nodes[rootId]
        ? setVerifyMessage("The root node of a Red-Black Tree must be Black")
        : setVerifyMessage("This structure has no root node");
      return;
    }

    /**
     * Fail cases:
     * 1. Non-connected nodes
     *  - Catch by visiting all connected nodes from the root, return the number of unique visited nodes
     *  - If this is not equal to nodeCount, we have non-connected nodes
     *
     * 2. Cycles exist in the structure/Two nodes with the same label
     *  - As we go through the tree, construct an identical structure which stores the tree more rigorously
     *    (with left, right, parent pointers to nodes), if we go to add a node to the tree and it is already
     *    in the tree, then there must be a cycle OR two nodes with the same label exist in the tree
     *
     * 3. A node has more than two children
     *  - Can simply check if a node has >3 edges, in that case it can not be a node in a tree (other than root with 2 edges)
     *
     * 4. Black Height property of tree is violated
     *  - Our function checks for this
     *
     * 5. Red node has red children
     *  - Our function checks for this
     */
    if (isValidRedBlackTree(rootNode)) {
      setVerifyMessage("Is valid BST");
    }
    console.log(verifyState);
    console.log(tree);
  };

  return (
    <div id="canvas" className="relative min-w-full min-h-screen bg-background">
      <div className="relative inset-0 m-auto">{verifyMessage}</div>
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
        <button
          className="p-5 bg-white w-full"
          onClick={() => {
            setMouseState("C");
            setSelected("");
            console.log(edges);
            console.log(nodes);
          }}
        >
          Color
        </button>
        <button className="p-5 bg-white w-full" onClick={() => enlargeCanvas()}>
          Canvas
        </button>
        <button className="p-5 bg-white w-full" onClick={() => verifyStruct()}>
          Verify
        </button>
        <button
          className="p-5 bg-white w-full"
          onClick={() => {
            setMouseState("L");
            setSelected("");
          }}
        >
          Label
        </button>
        <button
          className="p-5 bg-white w-full"
          onClick={() => {
            setMouseState("D");
            setSelected("");
          }}
        >
          Delete
        </button>
        <button
          className="p-5 bg-white w-full"
          onClick={() => {
            setMouseState("R");
            setSelected("");
          }}
        >
          Root
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
        if (!a) {
          return;
        }
        return (
          <Node
            root={a.id === rootId}
            id={`node${a.id}`}
            key={`node${a.id}`}
            setRef={a.ref}
            color={a.isBlack}
            onMouseDown={(e) => {
              handleNodeClick(e, `node${a.id}`);
            }}
            size={nodeSize}
          >
            <p
              contentEditable={mouseState === "L" ? true : false}
              suppressContentEditableWarning={true}
              className="text-xs absolute text-white"
              onInput={(e) => {
                labelChangeDispatch({
                  type: "change",
                  ind: a.id,
                  label: e.currentTarget.textContent,
                });
              }}
            >
              Label
            </p>
          </Node>
        );
      })}
    </div>
  );
}
