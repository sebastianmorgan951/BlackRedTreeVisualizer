const Node = ({ id, z, black, size, setRef, ...props }) => {
  return (
    <div
      key={id}
      id={id}
      draggable="true"
      className="absolute z-10 rounded-full"
      ref={setRef}
      {...props}
      onDragStart={() => false}
    >
      <svg width={`${size}px`} height={`${size}px`}>
        <circle cx={`${size / 2}px`} cy={`${size / 2}px`} r={`${size / 2}px`} />
      </svg>
    </div>
  );
};

export default Node;
