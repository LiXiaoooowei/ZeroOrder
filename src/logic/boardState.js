'use strict';

const Constants = require('./constants');
const UnitList = require('./units/unitList');
/* 	boardState is an dictionary with the following properties:
*	boardState.numCol: number of columns of game board
*	boardState.boardShape: a 2D array specifying valid locations on each column
* 	boardState.boardMatrix: a matrix representation of game board. Each loaction is represented as [UNIT, MOBILITY]
*	boardState.whitePlayer: name of white player
*	boardState.currentPlayer: name of current player
* 	boardState.state: current game status, it can be CONSTANT.GAME_STATUS.PENDING_MOVE, CONSTANT.GAME_STATUS.PENDING_ACTION, PENDING_NEW_TILE, CONSTANT.GAME_STATUS.WHITE_WIN
*					or CONSTANT.GAME_STATUS.BLACK_WIN
*	boardState.content: if the game is pending movement, it contents a list of valid movements,
*					each movement is represented as [starting location, [list of valid ending locations]]
*					if the game is pending activation, it contents a list of valid activations, 
*					each activation is represented as [name of unit, location, [list of valid targets]]
* 					if the game is waiting for player to place a defeated piece, it contains the 
*					list of non-tile spaces.
*/

const CONSTANT = Constants.Constants;
const UNIT_ARRAY = UnitList.unitNameArray;

class BoardState {
	constructor(numCol, boardShape, whitePlayer, currentPlayer) {
		this.boardState = {};
		this.boardState.numCol = numCol;
		this.boardState.boardShape = boardShape;
		this.boardState.whitePlayer = whitePlayer;
		this.boardState.currentPlayer = currentPlayer;
		this.boardState.boardMatrix = [];
		for (let i = 0; i < numCol; i++) {
			this.boardState.boardMatrix.push([]);
			for (let j = 0; j <= boardShape[i][1]; j++) {
				this.boardState.boardMatrix[i].push(null);
				if (j >= boardShape[i][0]) {
					this.boardState.boardMatrix[i][j] = [CONSTANT.UNIT_CODE.EMPTY_TILE,null]
				}
			}
		}
	}
	getBoardState() {
		return this.boardState;
	}
	setHexagon(ID, hexagon) {
		const col = ID[0];
		const row = ID[1];
		////////////// handle temp tile, to be changed later
		if (col < 50) {
			const array = this.hexagonToArray(hexagon);
			this.boardState.boardMatrix[col][row] = array;
		}
		
	}
	setStatus(state, content) {
		if (state === 'waiting_movement') {
			this.boardState.state = CONSTANT.GAME_STATUS.PENDING_MOVE;
		}
		else if (state === 'waiting_activation') {
			this.boardState.state = CONSTANT.GAME_STATUS.PENDING_ACTION;
		}
		else if (state === 'waiting_tile') {
			this.boardState.state = CONSTANT.GAME_STATUS.WAITING_NEW_TILE
		}
		else if (state === 'CONSTANT.GAME_STATUS.WHITE_WIN') {
			this.boardState.state = CONSTANT.GAME_STATUS.WHITE_WIN;
		}
		else {
			this.boardState.state = CONSTANT.GAME_STATUS.BLACK_WIN;
		}
		
		this.boardState.content = content;
	}
	
	hexagonToArray(hexagon) {
		let array = [];
		// the space is not a tile
		if (!hexagon.checkIsTile()){
			return [CONSTANT.UNIT_CODE.EMPTY_SPACE, null];
		}
		// the space has no unit
		if (hexagon.checkIsEmptyTile()){
			return [CONSTANT.UNIT_CODE.EMPTY_TILE, null];
		}
		// the tile is occupied by a unit
		let colour, offset;
		if (hexagon.getUnit().getPlayerID() == this.boardState.whitePlayer) {
			// colour = white;
			offset = 18;
		}
		else {
			// colour = black;
			offset = 0;
		}
		const name = hexagon.getUnit().getName();

		const unit_index = UNIT_ARRAY.indexOf(name);
		const num = unit_index + offset+1;

		return [num, hexagon.getUnit().immobileStatus]
	}
}


module.exports.BoardState = BoardState;