// @flow

import React, {useState} from "react";
import Constants from "../constants";
import Tile from "./Tile.react";

type Props = {|
  handleUnitClick: (unit: string) => void,
  height: number,
  width: number
|};

function GameBoard(props: Props) {
  const {handleUnitClick, height, width} = props;
  const [numRows, setNumRows] = useState(8);
  const [numCols, setNumCols] = useState(5);
  const radius = computeRadius();
  const margin = computeMargin();

  function computeRadius() {
    const availHeight = height - 2 * Constants.GAMEBOARD_PADDING;
    const availWidth = width - 2 * Constants.GAMEBOARD_PADDING;
    return Math.min(
      availWidth / (1.5 * numCols + 0.5),
      availHeight / (Math.sqrt(3) * numRows + Math.sqrt(3) / 2)
    );
  }

  function computeMargin() {
    var boardWidth;
    if (numCols % 2 === 1) {
      boardWidth = (3 * radius * (numCols + 1)) / 2 - 1;
    } else {
      boardWidth = (3 * radius * numCols) / 2;
    }
    return (width - 2 * Constants.GAMEBOARD_PADDING - boardWidth) / 2;
  }

  function createTiles() {
    let tiles = [];
    for (var i = 0; i < numRows; i++) {
      for (var j = 0; j < numCols; j++) {
        if (i === numRows - 1 && j % 2 === 0) {
          continue;
        }
        tiles.push(
          <Tile
            key={i + "->" + j}
            absoluteCenter={{
              X: (1 + 1.5 * j) * radius + margin,
              Y:
                (Math.sqrt(3) / 2) * (j % 2 === 0 ? 2 : 1) * radius +
                i * Math.sqrt(3) * radius +
                Constants.GAMEBOARD_PADDING
            }}
            relativeCenter={{
              X: i,
              Y: j
            }}
            radius={radius}
            handleUnitClick={handleUnitClick}
          />
        );
      }
    }
    return tiles;
  }

  return (
    <svg
      style={{
        height: height,
        width: width,
        background: "lightgray"
      }}
    >
      {createTiles()}
    </svg>
  );
}

export default GameBoard;
