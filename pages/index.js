import Head from "next/head";
import { useState } from "react";

export default function Home() {
  /**
   * P = Pan
   * S = Select (and for Dragging)
   */
  const [mouseState, setMouseState] = useState("S");

  /** Called when use wants to enlarge space */
  const enlargeCanvas = () => {
    document.getElementById("canvas").style.width = "2000px";
  };

  const draggable = (e) => {
    e.preventDefault();

    const drag = document.getElementById(e.target.id);
    const boundingRect = drag.getBoundingClientRect();

    let offsetX = e.clientX - boundingRect.left;
    let offsetY = e.clientY - boundingRect.top;

    drag.style.zIndex = 1000;

    moveAt(e.pageX, e.pageY);

    // moves the drag at (pageX, pageY) coordinates
    // taking initial offsets into account
    function moveAt(pageX, pageY) {
      drag.style.left = pageX - offsetX + "px";
      drag.style.top = pageY - offsetY + "px";
    }

    function onMouseMove(e) {
      moveAt(e.pageX, e.pageY);
    }

    const drop = () => {
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseMove);
    };

    document.addEventListener("mouseup", drop);
    document.addEventListener("mousemove", onMouseMove);
  };

  return (
    <div id="canvas" className="relative min-w-full min-h-screen bg-background">
      <div className="sticky top-2 left-2 w-min flex flex-col justify-evenly items-center bg-black">
        <button className="p-5 bg-white w-full">Pan</button>
        <button className="p-5 bg-white w-full">Select</button>
        <button className="p-5 bg-white w-full" onClick={() => enlargeCanvas()}>
          Canvas
        </button>
      </div>
      <div
        id="node1"
        draggable="true"
        className="bg-white absolute"
        onMouseDown={(e) => draggable(e)}
        onDragStart={() => false}
      >
        Hello
      </div>
      <div
        id="node2"
        draggable="true"
        className="bg-white absolute"
        onMouseDown={(e) => draggable(e)}
        onDragStart={() => false}
      >
        Henlo
      </div>
    </div>
  );
}
