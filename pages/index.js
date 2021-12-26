import { createRef, useEffect, useReducer, useRef, useState } from "react";
import Edge from "../components/edge";
import Node from "../components/node";
import styles from "../styles/home.module.css";
import Navbar from "../components/nav";

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
    case "animations":
      console.log("Animating edges");
      var updated = state.map((a, i) => {
        if (!a) return a;
        const currAnim = action.animations[i];
        console.log(currAnim);
        return !currAnim
          ? { ...a }
          : { ...a, to: currAnim.to, from: currAnim.from };
      });
      return updated;
    case "removeAnims":
      var updated = state.map((a, i) => {
        if (!a) return a;
        delete a.to;
        delete a.from;
        return a;
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
  const [isValid, setIsValid] = useState(false);
  const [treeState, setTreeState] = useState([]);

  let treeArrRoot = 0;
  let tree = [
    /*
    {
      nodeId: num,  //position of this node in nodes DOM arr
      label: num,   //int label of this node
      parent: num,  //int label of parent node === undefined if root
      parentId: num, //int index of parent node in tree arr === -1 if root
      left: num,    //int label of left node === undefined if no child
      leftId: num,  //int index of left node in tree arr === undefined if no child
      right: num,   //int label of right node === undefined if no child
      rightId: num, //int index of right node in tree arr === undefined if no child
      id: num,      //int index of this node in tree arr
      isBlack: bool, //Whether or not this node is black
    }
     */
  ];
  let edgeAnimations = [];
  let actions = [];

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
  const [animationSpeed, setAnimationSpeed] = useState("500ms");

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

  /* Structure: Array of Objects (each object representing a node) with the
   *             following properties
   * {
   *   .id: a number, the index of the node within this nodes array
   *   .edges: an array of edge ID numbers for edges connected to this node
   *   .ref: a reference to the currently rendered node for this object
   *   .isBlack: whether this node is black or red in the Red-Black structure
   * }
   *
   * Keeps tracks of user-created nodes, this object is used to render nodes onto
   * the browser, we cannot resize or alter the positions of nodes within this array,
   * as the ID of the node is actually the position of the node within this array,
   * which allows us to quickly access nodes by id since javascript doesn't have
   * pointers.
   * */
  const [nodes, nodeChangeDispatch] = useReducer(nodeReducer, [
    /*{
      id: 0,
      edges: [],
      ref: {},
      isBlack: true,
    },*/
  ]);

  /* Structure: Array of Objects (each object representing an edge) with the
   *             following properties
   * {
   *   .id: a number, the index of the edge within this edges array
   *   .start: a number, the index of one of the node endpoints of this edge,
   *           where the index is the index of that node within the nodes arr
   *   .end: a number, the index of the other node endpoint of this edge, where
   *           the index is the index of that node within the nodes array
   *   .ref: a reference to the currently rendered edge for this object
   * }
   *
   * Keeps tracks of user-created edges, this object is used to render edges onto
   * the browser, we cannot resize or alter the positions of edges within this array,
   * as the ID of the edge is actually the position of the edge within this array,
   * which allows us to quickly access edges by id since javascript doesn't have
   * pointers.
   * */
  const [edges, edgeChangeDispatch] = useReducer(edgeReducer, [
    /*{
      id: 0,
      start, number, (id)
      end: number,
      ref: {},
    },*/
  ]);

  /** Called when user wants to enlarge space to create a structure
   */
  const enlargeCanvas = () => {
    document.getElementById("canvas").style.width = "2000px";
  };

  /** Called when a node is added while the structure is being created,
   * currInd is used to keep track of the current index of the node being
   * added to the nodes object, and sort of uses this index as a pointer
   * to the node. We also create a ref for the current node if we need to
   * access it at any point and perform more complicated operations on the
   * node.
   */
  const handleAddNode = () => {
    /** TODO: Put new node in middle of screen
     *
     */
    nodeChangeDispatch({
      type: "add",
      ind: currInd,
      ref: createRef(),
    });
    setCurrInd(currInd + 1);
  };

  /** Called when a node is clicked, this determines what action to take based
   * on the mouseState (the mouse setting)
   *
   * If "S", mouse is in Select mode, and will be used to drag the node, calling
   *  the draggable function
   * If "E", mouse is in Edge mode, and will be used to construct edges, first
   *  setting the "selected" state when one node (endpoint) is clicked, then
   *  calling the edgeLinking function when the function has two endpoints
   * If "C", mouse is in Color mode, and will toggle the node color, switching
   *  the color from red to black and back
   * If "D", mouse is in Delete mode, and will call deleteNode to delete the node
   *  in question and all connected edges
   * If "R", mouse is in Root mode, and will set the rootId state to the current
   *  node, changing the root of the tree structure
   *
   * @param e, the mousedown event which was triggered on the node
   * @param id, the id of the node clicked on (with form node##), where ## is
   *            the index of the node within the nodes state array
   */
  const handleNodeClick = (e, id) => {
    const nodeIdNum = parseInt(id.match(/\d+$/)[0]);
    nodes[nodeIdNum].ref.current.style.transition = "all 0s ease 0s";
    setIsValid(false);

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
        console.log("Setting id homie");
        setRootId(nodeIdNum);
        return;
    }
  };

  /** This function is called to connect two nodes with an edge.
   *
   * This function can only be called once the "selected" state has been set to a
   * non-empty string representing the ID of the node to be connected at one
   * endpoint. Therefore, both endpoints of the edge are formed with the current ID
   * parameter and the selected ID.
   *
   * We keep track of the current index of the edge within the edges object being
   * added using the currEdge state object. We use this to create a sort of pointer
   * to the edge (which is the index of the edge in the edges object). Finally, in
   * this function, we call a few useReducer dispatch methods which adds the created
   * edge to the array of edges associated with both endpoint nodes, and adds the
   * edge to the edges object with the appropriate parameters, incrementing the ID
   * of the next edge to be added, since the edges object has grown as well.
   *
   * @param id, the ID of the node endpoint to be connected
   */
  const edgeLinking = (id) => {
    const endNodeNum = parseInt(id.match(/\d+$/)[0]);
    const startNodeNum = parseInt(selected.match(/\d+$/)[0]);

    if (endNodeNum === startNodeNum) {
      return;
    }

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

  /** This function implements the draggable nodes.
   *
   * This function is called when the mouse is in select mode (mouseState === "S"),
   * and we click on a node. Within this function, we prevent default, as when dragging,
   * the default behavior causes the next mouseup event to be ignored for some reason.
   *
   * Then, we get the references to each edge which is connected to the node which has
   * been clicked, and we record whether or not each edge is
   *    - A self edge (an edge from the node in question to itself)
   *    - An edge start point (The node connected to the edge.start)
   *    - An edge end point (The node connected to the edge.end)
   * Then, we get the position of the current node and mouse to start moving to node as
   * we drag it around. We also set the z-Index of the node to 1000 so it moves above
   * every other element as we are dragging it, which we set back to 10 at the end.
   *
   * Within this function, we add two event listeners
   *  - For mousemove, we call the internal moveAt function, where we use the current
   *    mouse position to update all connected edges and node positions accordingly
   *  - For mouseup, we remove the event listeners, reset the node's z position,
   *    and stop the draggable function
   *
   * @param e, the mousedown event
   * @param id, the ID of the node clicked on, with form "node##", where ## is some
   *            integer number representing the index of the node in the nodes array
   */
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

  /**
   * @param action, the object containing details of the node to be added to the tree
   *    Action must have a few fields
   *      .label: The label of the node, must be an integer (number)
   *      .left: The label of the left child, must be an integer or undefined
   *      .right: The label of the right child, must be an integer or undefined
   *      .parent: The label of the parent node, must be an integer or undefined
   *      .isBlack: Whether or not this node is black, must be a bool
   *
   * This is just a helper function to push to the tree object while we construct a
   * more useful Red-Black Tree object to be used for future operations as we verify
   * the structure of a user-built tree
   */
  const addToTree = (action) => {
    tree.push({
      nodeId: action.nodeId,
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
      nodeId: currNode.id,
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
      spaceOutTree();
      setIsValid(true);
      setTreeState(tree);
    }
  };

  const getTreeHeight = (node) => {
    if (!node) {
      return 0;
    }
    const leftHeight = getTreeHeight(tree[node.leftId]);
    const rightHeight = getTreeHeight(tree[node.rightId]);

    return 1 + (leftHeight > rightHeight ? leftHeight : rightHeight);
  };

  const spaceOutTree = () => {
    const height = getTreeHeight(tree[0]);

    /* At the bottom of a tree, a node at minimum needs space for itself, and half
     * of its size as right padding between itself and the node on the right, and half
     * for left padding */
    let minimumWidthNeeded = nodeSize * 2;
    let totalWidthNeeded = minimumWidthNeeded * Math.pow(2, height - 1);
    let totalHeightNeeded = nodeSize + (height - 1) * 1.5 * nodeSize;
    let windowMidpointX = window.scrollX + window.innerWidth / 2;
    let windowMidpointY = window.scrollY + window.innerHeight / 2;
    let windowTop = windowMidpointY - totalHeightNeeded / 2;

    let widthFactor = 1.9;
    while (totalWidthNeeded >= window.innerWidth) {
      minimumWidthNeeded = nodeSize * widthFactor;
      totalWidthNeeded = minimumWidthNeeded * Math.pow(2, height - 1);
      widthFactor = widthFactor - 0.1;
    }

    edgeAnimations = new Array(edges.length).fill(null);

    /* Call with (root node, position where node gets placed x, position where node
     * gets placed y, x offset for children, y offset for children) */
    positionTree(
      tree[0],
      windowMidpointX,
      windowTop,
      totalWidthNeeded / 4,
      1.5 * nodeSize
    );

    edgeChangeDispatch({
      type: "animations",
      animations: edgeAnimations,
    });
    setTimeout(() => {
      edgeChangeDispatch({
        type: "removeAnims",
      });
    }, 600);
    console.log(edgeAnimations);
  };

  const positionTree = (
    node,
    positionX,
    positionY,
    childrenOffsetX,
    childrenOffsetY
  ) => {
    if (!node) {
      return;
    }

    const nodeOffset = nodeSize / 2;
    const renderedNodeObj = nodes[node.nodeId];
    const currRef = renderedNodeObj.ref;
    const currPosition = currRef.current.getBoundingClientRect();
    const fromNodeCenterX = currPosition.left + nodeSize / 2;
    const fromNodeCenterY = currPosition.top + nodeSize / 2;

    const nodeEdges = renderedNodeObj.edges;

    for (let i = 0; i < nodeEdges.length; i++) {
      const edge = edges[nodeEdges[i]];
      const isCurrNodeStart = edge.start === node.nodeId;
      let from, to;
      if (isCurrNodeStart) {
        to = {
          x1: positionX,
          y1: positionY,
        };
        from = {
          x1: fromNodeCenterX,
          y1: fromNodeCenterY,
        };
      } else {
        to = {
          x2: positionX,
          y2: positionY,
        };
        from = {
          x2: fromNodeCenterX,
          y2: fromNodeCenterY,
        };
      }
      edgeAnimations[edge.id] = {
        to: {
          ...edgeAnimations[edge.id]?.to,
          ...to,
        },
        from: {
          ...edgeAnimations[edge.id]?.from,
          ...from,
        },
      };
    }

    currRef.current.style.transition = "all 0.5s linear";
    currRef.current.style.top = `${positionY - nodeOffset}px`;
    currRef.current.style.left = `${positionX - nodeOffset}px`;

    positionTree(
      tree[node.leftId],
      positionX - childrenOffsetX,
      positionY + childrenOffsetY,
      childrenOffsetX / 2,
      childrenOffsetY
    );
    positionTree(
      tree[node.rightId],
      positionX + childrenOffsetX,
      positionY + childrenOffsetY,
      childrenOffsetX / 2,
      childrenOffsetY
    );
  };

  /** Will alter the actions array used to animate this process
   *
   * Idea: Change the tree array to handle the insert, altering the actions array
   *       along the way, then go through the actions array, updating the DOM state
   *       objects to animate stuff
   */
  const handleInsertion = (insertLabel) => {
    actions = [];
    tree = treeState;
    console.log(tree);

    /* Call with (labelToInsert, tree root, parent node) */
    insertIntoTreeArr(insertLabel, tree[0], undefined);
    setTreeState(tree);
    console.log(actions);
  };

  const insertIntoTreeArr = (label, currNode, parNode) => {
    /* Halting case */
    if (!currNode) {
      /* Inserting root node case */
      if (!parNode) {
        tree.push({
          nodeId: currInd,
          label: label,
          parent: undefined,
          parentId: -1,
          left: undefined,
          leftId: undefined,
          right: undefined,
          rightId: undefined,
          id: tree.length,
          isBlack: true,
        });
        actions.push("root");
        return;
      }
      tree.push({
        nodeId: currInd,
        label: label,
        parent: parNode.label,
        parentId: parNode.id,
        left: undefined,
        leftId: undefined,
        right: undefined,
        rightId: undefined,
        id: tree.length,
        isBlack: false,
      });
      if (label < parNode.label) {
        tree[parNode.id].left = label;
        tree[parNode.id].leftId = tree.length - 1;
      } else {
        tree[parNode.id].right = label;
        tree[parNode.id].rightId = tree.length - 1;
      }
      actions.push("place");
      if (!parNode.isBlack) {
        /* Know grandparent must exist if parent is red, as our algorithm cannot
         * set a node to be red if that node is the root */
        const grandparNode = tree[parNode.parentId];
        const changeRoot = grandparNode.parentId === -1;
        const updatedParNode = tree[parNode.id];
        const updatedCurrNode = tree[tree.length - 1];
        let avlKink = false;

        /* Checks if we need two AVL rotations to remove a kink (case 1) */
        if (
          grandparNode.leftId === updatedParNode.id &&
          updatedParNode.rightId === updatedCurrNode.id
        ) {
          avlKink = true;
          AVLRotateTree(tree[updatedParNode.id], false);
          actions.push(`rotateparleft`);
        } else if (
          /* Checks if we need two AVL rotations to remove a kink (case 2) */
          grandparNode.rightId === updatedParNode.id &&
          updatedParNode.leftId === updatedCurrNode.id
        ) {
          avlKink = true;
          AVLRotateTree(tree[updatedParNode.id], true);
          actions.push(`rotateparright`);
        }

        const needToRotateRight = grandparNode.leftId === updatedParNode.id;
        AVLRotateTree(tree[grandparNode.id], needToRotateRight);
        tree[grandparNode.id].isBlack = false;
        if (avlKink) {
          tree[updatedCurrNode.id].isBlack = true;
          if (changeRoot) {
            treeArrRoot = updatedCurrNode.id;
          }
        } else {
          tree[updatedParNode.id].isBlack = true;
          if (changeRoot) {
            treeArrRoot = updatedParNode.id;
          }
        }
        actions.push(`rotategrandpar${needToRotateRight ? "right" : "left"}`);
      }
      return;
    }

    /* Fail case */
    if (currNode.label === label) {
      actions.push("fail");
      return;
    }

    console.log(currNode.leftId);
    /* If currNode is black and has red children, recolor */
    if (currNode.isBlack) {
      if (
        currNode.leftId &&
        currNode.rightId &&
        currNode.leftId > -1 &&
        currNode.rightId > -1 &&
        !tree[currNode.leftId].isBlack &&
        !tree[currNode.rightId].isBlack
      ) {
        actions.push("recolor");
        /* Only recolor currNode to red if it is not root, if it is root is must be black */
        if (currNode.parent) {
          tree[currNode.id].isBlack = false;
        } else {
          actions.push("blackroot");
        }
        tree[currNode.leftId].isBlack = true;
        tree[currNode.rightId].isBlack = true;

        /* Make sure we now don't have a red node with red parent, if we do we need
         * to AVL rotate */
        if (parNode && !parNode.isBlack) {
          /* Know grandparent must exist if parent is red, as our algorithm cannot
           * set a node to be red if that node is the root */
          const grandparNode = tree[parNode.parentId];
          const changeRoot = grandparNode.parentId === -1;
          let avlKink = false;

          /* Checks if we need two AVL rotations to remove a kink (case 1) */
          if (
            grandparNode.leftId === parNode.id &&
            parNode.rightId === currNode.id
          ) {
            avlKink = true;
            AVLRotateTree(tree[parNode.id], false);
            actions.push(`rotateparleft`);
          } else if (
            /* Checks if we need two AVL rotations to remove a kink (case 2) */
            grandparNode.rightId === parNode.id &&
            parNode.leftId === currNode.id
          ) {
            avlKink = true;
            AVLRotateTree(tree[parNode.id], true);
            actions.push(`rotateparright`);
          }

          const needToRotateRight = grandparNode.leftId === parNode.id;
          AVLRotateTree(tree[grandparNode.id], needToRotateRight);
          tree[grandparNode.id].isBlack = false;
          if (avlKink) {
            tree[currNode.id].isBlack = true;
            if (changeRoot) {
              treeArrRoot = currNode.id;
            }
          } else {
            tree[parNode.id].isBlack = true;
            if (changeRoot) {
              treeArrRoot = parNode.id;
            }
          }
          actions.push(`rotategrandpar${needToRotateRight ? "right" : "left"}`);
        }
      }
    }

    if (label > currNode.label) {
      actions.push("right");
      insertIntoTreeArr(
        label,
        tree[tree[currNode.id].rightId],
        tree[currNode.id]
      );
    } else {
      actions.push("left");
      insertIntoTreeArr(
        label,
        tree[tree[currNode.id].leftId],
        tree[currNode.id]
      );
    }
  };

  const AVLRotateTree = (node, right) => {
    let parentLabel = node.parent;
    let parentId = node.parentId;
    const newRoot = parentId === -1;
    let nodeToConnectToOldPar = undefined;
    if (right) {
      nodeToConnectToOldPar = tree[node.leftId];
      const newRightChild = node;
      const newRightLeftChild = tree[nodeToConnectToOldPar.rightId];
      tree[nodeToConnectToOldPar.id].parent = parentLabel;
      tree[nodeToConnectToOldPar.id].parentId = parentId;
      tree[nodeToConnectToOldPar.id].right = tree[newRightChild.id].label;
      tree[nodeToConnectToOldPar.id].rightId = newRightChild.id;
      tree[newRightChild.id].parent = tree[nodeToConnectToOldPar.id].label;
      tree[newRightChild.id].parentId = nodeToConnectToOldPar.id;
      tree[newRightChild.id].left = tree[newRightLeftChild.id].label;
      tree[newRightChild.id].leftId = newRightLeftChild.id;
      tree[newRightLeftChild.id].parent = tree[newRightChild.id].label;
      tree[newRightLeftChild.id].parentId = newRightChild.id;
    } else {
      nodeToConnectToOldPar = tree[node.rightId];
      const newLeftChild = node;
      const newLeftRightChild = tree[nodeToConnectToOldPar.leftId];
      tree[nodeToConnectToOldPar.id].parent = parentLabel;
      tree[nodeToConnectToOldPar.id].parentId = parentId;
      tree[nodeToConnectToOldPar.id].left = tree[newLeftChild.id].label;
      tree[nodeToConnectToOldPar.id].leftId = newLeftChild.id;
      tree[newLeftChild.id].parent = tree[nodeToConnectToOldPar.id].label;
      tree[newLeftChild.id].parentId = nodeToConnectToOldPar.id;
      tree[newLeftChild.id].right = tree[newLeftRightChild.id].label;
      tree[newLeftChild.id].rightId = newLeftRightChild.id;
      tree[newLeftRightChild.id].parent = tree[newLeftChild.id].label;
      tree[newLeftRightChild.id].parentId = newLeftChild.id;
    }
    if (newRoot) {
      treeArrRoot = nodeToConnectToOldPar.id;
      return;
    }
    if (tree[parentId].leftId === node.id) {
      tree[parentId].leftId = nodeToConnectToOldPar.id;
      tree[parentId].left = nodeToConnectToOldPar.label;
    } else {
      tree[parentId].rightId = nodeToConnectToOldPar.id;
      tree[parentId].right = nodeToConnectToOldPar.label;
    }
  };

  const AVLRotateDOM = () => {};

  /* Set of functions to be sent to the navbar, ordered from left to right of nav,
   * then top to bottom (so top left dropdown option is 0, bottom right dropdown option
   * is the number of total dropdown options available minus 1) */
  const navClickFunctions = [
    () => handleAddNode(),
    () => {
      setMouseState("S");
      setSelected("");
    },
    () => {
      setMouseState("C");
      setSelected("");
    },
    () => {
      setMouseState("L");
      setSelected("");
    },
    () => {
      setMouseState("D");
      setSelected("");
    },
    () => {
      setMouseState("R");
      setSelected("");
    },
    () => {
      setMouseState("E");
    },
    () => verifyStruct(),
    () => enlargeCanvas(),
  ];

  return (
    <div id="canvas" className="relative min-w-full min-h-screen bg-background">
      <Navbar handleClickEvents={navClickFunctions} />
      <div className="relative inset-0 m-auto">{verifyMessage}</div>
      <div className={`absolute top-0 left-0 z-0 overflow-visible`}>
        <svg overflow="visible" width="100%" height="100%">
          {edges.map((a) => {
            if (!a) {
              return;
            }
            const beginTime =
              Date.now() - window.performance.timing.domComplete;
            return (
              <Edge
                dur={animationSpeed}
                to={a.to}
                id={`edge${a.id}`}
                key={`edge${a.id}`}
                begin={`${beginTime}ms`}
                setRef={a.ref}
                from={a.from}
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
