import React from "react";

class Edge extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      refMounted: false,
    };
  }

  componentDidMount = () => {
    if (!this.state.refMounted) {
      this.setState({
        refMounted: true,
      });
    }
  };

  render() {
    let startX1;
    let startY1;
    let startX2;
    let startY2;
    if (this.props.from) {
      /* Then an animation is going to happen, we don't want the current node
       * position, but the last node position */
      startX1 = this.props.from.x1;
      startX2 = this.props.from.x2;
      startY1 = this.props.from.y1;
      startY2 = this.props.from.y2;
    } else {
      const startCoords = this.props.startRef.current.getBoundingClientRect();
      const endCoords = this.props.endRef.current.getBoundingClientRect();
      startX1 = `${(startCoords.left + startCoords.right) / 2}px`;
      startX2 = `${(endCoords.left + endCoords.right) / 2}px`;
      startY1 = `${(startCoords.top + startCoords.bottom) / 2}px`;
      startY2 = `${(endCoords.top + endCoords.bottom) / 2}px`;
    }

    return (
      <line
        className={`${this.state.refMounted ? `` : `hidden`}`}
        id={this.props.id}
        key={this.props.id}
        ref={this.props.setRef}
        x1={startX1}
        y1={startY1}
        x2={startX2}
        y2={startY2}
        strokeWidth="10px"
        strokeLinecap="round"
        stroke="gray"
      >
        {this.props.to?.x1 && (
          <animate
            xlinkHref={`#${this.props.id}`}
            attributeName="x1"
            begin={this.props.begin}
            from={startX1}
            to={this.props.to.x1}
            dur={this.props.dur}
            fill="freeze"
          />
        )}
        {this.props.to?.x1 && (
          <animate
            xlinkHref={`#${this.props.id}`}
            attributeName="y1"
            begin={this.props.begin}
            from={startY1}
            to={this.props.to.y1}
            dur={this.props.dur}
            fill="freeze"
          />
        )}
        {this.props.to?.x2 && (
          <animate
            xlinkHref={`#${this.props.id}`}
            attributeName="x2"
            begin={this.props.begin}
            from={startX2}
            to={this.props.to.x2}
            dur={this.props.dur}
            fill="freeze"
          />
        )}
        {this.props.to?.x2 && (
          <animate
            xlinkHref={`#${this.props.id}`}
            attributeName="y2"
            begin={this.props.begin}
            from={startY2}
            to={this.props.to.y2}
            dur={this.props.dur}
            fill="freeze"
          />
        )}
      </line>
    );
  }
}

export default Edge;
