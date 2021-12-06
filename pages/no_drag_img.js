import Head from "next/head";
import { useState } from "react";

export default function Home() {
  /**
   * P = Pan
   * S = Select (and for Dragging)
   */
  const [mouseState, setMouseState] = useState("S");
  const [selected, setSelected] = useState(null);
  const [offsetX, setOffsetX] = useState(0);
  const [offsetY, setOffsetY] = useState(0);

  /** Called when use wants to enlarge space */
  const enlargeCanvas = () => {
    const canvas = (document.getElementById("canvas").style.width = "2000px");
  };

  const handleNodeClick = (e) => {
    e.preventDefault();
    console.log(e);
    const target = document.getElementById(e.target.id);
    const boundingRect = target.getBoundingClientRect();

    setSelected(target);
    setOffsetX(e.clientX - boundingRect.left);
    setOffsetY(e.clientY - boundingRect.top);
  };

  const handleMouseUp = (e) => {
    console.log("Mouse Up");
    if (!selected) return;

    console.log(offsetX);
    console.log(offsetY);
    selected.style.left = e.pageX - offsetX + "px";
    selected.style.top = e.pageY - offsetY + "px";

    setSelected(null);
    setOffsetX(0);
    setOffsetY(0);
  };

  return (
    <div
      id="canvas"
      className="relative min-w-full min-h-screen bg-background"
      onMouseUp={(e) => handleMouseUp(e)}
    >
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
        onMouseDown={(e) => handleNodeClick(e)}
        onDragStart={() => false}
      >
        Hello
      </div>
    </div>
  );
}
