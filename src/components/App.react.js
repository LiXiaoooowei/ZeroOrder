// @flow

import React, {useEffect, useState} from "react";
import "../css/App.react.css";
import UIConstants from "../constants";
import GameBoard from "./GameBoard.react";
import ScoreBoard from "./ScoreBoard.react";

function App() {
  const {width, height} = useWindowSize();
  const [currentUnit, setCurrentUnit] = useState(null);
  const [targetUnit, setTargetUnit] = useState(null);

  function handleUnitClick(unit: string) {
    if (currentUnit !== null) {
      setTargetUnit(unit);
    } else if (targetUnit !== null) {
      setCurrentUnit(unit);
    } else if (currentUnit === null && targetUnit === null) {
      setCurrentUnit(unit);
    }
  }

  useEffect(() => {
    if (currentUnit !== null && targetUnit !== null) {
      // TODO: check if the current move is valid, otherwise,
      // reset everything to null
      console.log("currentUnit = " + currentUnit);
      console.log("targetUnit = " + targetUnit);
    }
  });

  return (
    <div style={{display: "flex"}}>
      <GameBoard
        width={width * UIConstants.GAMEBOARD_WIDTH_PROPORTION}
        height={height}
        handleUnitClick={handleUnitClick}
      />
      <ScoreBoard
        width={width * UIConstants.SCOREBOARD_WIDTH_PROPORTION}
        height={height}
        scores={
          "currentUnit = " +
          (currentUnit === null ? "NULL" : currentUnit) +
          ", " +
          "targetUnit = " +
          (targetUnit === null ? "NULL" : targetUnit)
        }
      />
    </div>
  );
}

function useWindowSize() {
  function getSize() {
    return {width: window.innerWidth, height: window.innerHeight};
  }
  const [windowSize, setWindowSize] = useState(getSize());

  useEffect(() => {
    function handleResize() {
      setWindowSize(getSize());
    }
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  });
  return windowSize;
}

export default App;
