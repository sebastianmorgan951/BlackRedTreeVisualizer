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
    const startCoords = this.props.startRef.current.getBoundingClientRect();
    const endCoords = this.props.endRef.current.getBoundingClientRect();

    return (
      <line
        className={`${this.state.refMounted ? `` : `hidden`}`}
        id={this.props.id}
        key={this.props.id}
        ref={this.props.setRef}
        x1={`${(startCoords.left + startCoords.right) / 2}px`}
        y1={`${(startCoords.top + startCoords.bottom) / 2}px`}
        x2={`${(endCoords.left + endCoords.right) / 2}px`}
        y2={`${(endCoords.top + endCoords.bottom) / 2}px`}
        strokeWidth="10px"
        strokeLinecap="round"
        stroke="gray"
      />
    );
  }
}

export default Edge;
