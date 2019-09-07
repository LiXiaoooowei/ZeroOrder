// @flow

import React, {useEffect, useRef, useState} from "react";
import ReactDOM from "react-dom";
import Constants from "../constants";
import Point from "../typeDefinitions";

type Props = {|
  absoluteCenter: Point,
  relativeCenter: Point,
  radius: number,
  handleUnitClick: (unit: string) => void
|};

function Tile(props: Props) {
  const {absoluteCenter, radius, relativeCenter, handleUnitClick} = props;
  const [radius_adjusted, setRadius] = useState(
    radius - Constants.UNIT_TILE_MARGIN
  );
  const [color, setColor] = useState("white");

  function toVertex(dx, dy) {
    return [dx + absoluteCenter.X, dy + absoluteCenter.Y].join(",");
  }

  function handleClick(dataset) {
    setColor("black");
    handleUnitClick(dataset.id);
  }

  function toVerticesString() {
    return [
      toVertex(
        (-1 * radius_adjusted) / 2,
        (-1 * (Math.sqrt(3) * radius_adjusted)) / 2
      ),
      toVertex(
        radius_adjusted / 2,
        (-1 * (Math.sqrt(3) * radius_adjusted)) / 2
      ),
      toVertex(radius_adjusted, 0),
      toVertex(radius_adjusted / 2, (Math.sqrt(3) * radius_adjusted) / 2),
      toVertex(
        (-1 * radius_adjusted) / 2,
        (Math.sqrt(3) * radius_adjusted) / 2
      ),
      toVertex(-1 * radius_adjusted, 0)
    ].join(" ");
  }

  return (
    <polygon
      data-id={relativeCenter.X + "-" + relativeCenter.Y}
      points={toVerticesString()}
      onClick={e => {
        handleClick(e.target.dataset);
      }}
      fill={color}
    ></polygon>
  );
}

export default Tile;
