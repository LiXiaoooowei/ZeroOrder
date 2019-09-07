// @flow

import React, {useEffect, useRef, useState} from "react";
import ReactDOM from "react-dom";
import UIConstants, {UnitType} from "../constants";
import type {Point} from "../typeDefinitions";

type UIProps = {
  absoluteCenter: Point,
  relativeCenter: Point,
  radius: number,
  handleUnitClick: (unit: string) => void
};

type LgProps = {
  unitType: UnitType
};

type Props = UIProps & LgProps;

function Tile(props: Props) {
  const {
    absoluteCenter,
    radius,
    relativeCenter,
    handleUnitClick,
    unitType
  } = props;
  const [radius_adjusted, setRadius] = useState(
    radius - UIConstants.UNIT_TILE_MARGIN
  );

  function setColor() {
    switch (unitType) {
      case UnitType.BLACK_DELETE:
        return "yellow";
      case UnitType.WHITE_DELETE:
        return "orange";
      default:
        return "red";
    }
  }

  function toVertex(dx, dy) {
    return [dx + absoluteCenter.X, dy + absoluteCenter.Y].join(",");
  }

  function handleClick(dataset) {
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
      fill={setColor()}
    />
  );
}

export default Tile;
