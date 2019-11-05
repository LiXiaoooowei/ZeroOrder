'use strict';

/* 	boardState is an dictionary with the following properties:
*	boardState.numCol: number of columns of game board
*	boardState.boardShape: a 2D array specifying valid locations on each column
* 	boardState.boardMatrix: a matrix representation of game board. Each loaction is represented as [UNIT, ABLE_TO_MOVE]
*	boardState.whitePlayer: name of white player
*	boardState.currentPlayer: name of current player
* 	boardState.state: current game status, it can be PENDING_MOVE, PENDING_ACTION, PENDING_NEW_TILE, WHITE_WIN
*					or BLACK_WIN
*	boardState.content: if the game is pending movement, it contents a list of valid movements,
*					each movement is represented as [starting location, [list of valid ending locations]]
*					if the game is pending activation, it contents a list of valid activations, 
*					each activation is represented as [name of unit, location, [list of valid targets]]
* 					if the game is waiting for player to place a defeated piece, it contains the 
*					list of non-tile spaces.
*/

const ZERO_ORDER = 0,
BLACK_DELETE = 1,
BLACK_PUSH = 2,
BLACK_SWITCH = 3,
BLACK_TOSS = 4,
WHITE_DELETE = 19,
WHITE_PUSH = 20,
WHITE_SWITCH = 21,
WHITE_TOSS = 22,
EMPTY_SPACE = 37,
EMPTY_TILE = 38;

const UNIT = 0,
ABLE_TO_MOVE = 1;


const PENDING_MOVE = 0,
PENDING_ACTION = 1,
WAITING_NEW_TILE = 2,
WHITE_WIN = 3,
BLACK_WIN = 4;

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
					this.boardState.boardMatrix[i][j] = [EMPTY_TILE,false]
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
			this.boardState.state = PENDING_MOVE;
		}
		else if (state === 'waiting_activation') {
			this.boardState.state = PENDING_ACTION;
		}
		else if (state === 'waiting_tile') {
			this.boardState.state = WAITING_NEW_TILE
		}
		else if (state === 'white_win') {
			this.boardState.state = WHITE_WIN;
		}
		else {
			this.boardState.state = BLACK_WIN;
		}
		
		this.boardState.content = content;
	}
	
	hexagonToArray(hexagon) {
		let array = [];
		// the space is not a tile
		if (!hexagon.checkIsTile()){
			return [EMPTY_SPACE, false];
		}
		// the space has no unit
		if (hexagon.checkIsEmptyTile()){
			return [EMPTY_TILE, false];
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
		let num = 0;
		if (name === 'delete'){
			num = 1+offset;
		}
		else if(name === 'push'){
			num = 2+offset;
		}
		else if(name === 'switch'){
			num = 3+offset;
		}
		else if(name === 'toss') {
			num = 4+offset;
		}
		return [num, true]
	}
}


module.exports.BoardState = BoardState;