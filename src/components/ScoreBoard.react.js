// @flow

import React, {useState} from "react";

type Props = {|
  height: number,
  width: number,
  scores: string
|};

function ScoreBoard(props: Props) {
  const {height, width, scores} = props;

  return (
    <div style={{width: width, height: height}}>
      <h3 style={{textAlign: "center"}}>Score Board</h3>
      <h6 style={{textAlign: "center"}}>{scores}</h6>
    </div>
  );
}

export default ScoreBoard;
