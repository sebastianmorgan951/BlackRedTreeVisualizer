const Node = ({ id, z, black, color, size, setRef, ...props }) => {
  return (
    <div
      key={id}
      id={id}
      draggable="true"
      className="absolute z-10 rounded-full overflow-visible"
      ref={setRef}
      {...props}
      onDragStart={() => false}
    >
      <svg width={`${size}px`} height={`${size}px`} overflow="visible">
        <circle
          fill="black"
          stroke={`${color ? "black" : "#df3820"}`}
          strokeWidth={`${size / 10}px`}
          cx={`${size / 2}px`}
          cy={`${size / 2}px`}
          r={`${size / 2}px`}
        />
      </svg>
    </div>
  );
};

export default Node;
