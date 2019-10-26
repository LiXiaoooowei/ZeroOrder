'use strict';

/* 	boardState is an array with the following:
*	boardState[0]: number of columns of game board
*	boardState[1]: a 2D array specifying valid locations on each column
* 	boardState[2]: a matrix representation of game board. Each loaction is represented as [UNIT, ABLE_TO_MOVE]
*	boardState[3]: name of white player
*	boardState[4]: name of current player
* 	boardState[5]: current game status, it can be PENDING_MOVE, PENDING_ACTION, PENDING_NEW_TILE, WHITE_WIN
*					or BLACK_WIN
*	boardState[6]: if the game is pending movement, it contents a list of valid movements,
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
		this.numCol = numCol;
		this.boardShape = boardShape;
		this.whitePlayer = whitePlayer;
		this.currentPlayer = currentPlayer;
		this.baordMatrix = [];
		for (var i = 0; i < numCol; i++) {
			this.baordMatrix.push([]);
			for (var j = 0; j <= boardShape[i][1]; j++) {
				this.baordMatrix[i].push(null);
				if (j >= boardShape[i][0]) {
					this.baordMatrix[i][j] = [EMPTY_TILE,false]
				}
			}
		}
	}
	getBoardState() {
		return [this.numCol, this.boardShape, this.baordMatrix, this.whitePlayer, this.currentPlayer, this.state, this.content];
	}
	setHexagon(ID, hexagon) {
		var col = ID[0];
		var row = ID[1];
		////////////// handle temp tile, to be changed later
		if (col < 50) {
			var array = this.hexagonToArray(hexagon);
		this.baordMatrix[col][row] = array;
		}
		
	}
	setStatus(state, content) {
		if (state === 'waiting_movement') {
			this.state = PENDING_MOVE;
		}
		else if (state === 'waiting_activation') {
			this.state = PENDING_ACTION;
		}
		else if (state === 'waiting_tile') {
			this.state = WAITING_NEW_TILE
		}
		else if (state === 'white_win') {
			this.state = WHITE_WIN;
		}
		else {
			this.state = BLACK_WIN;
		}
		
		this.content = content;
	}
	
	hexagonToArray(hexagon) {
		var array = [];
		// the space is not a tile
		if (!hexagon.checkIsTile()){
			return [EMPTY_SPACE, false];
		}
		// the space has no unit
		if (hexagon.checkIsEmptyTile()){
			return [EMPTY_TILE, false];
		}
		// the tile is occupied by a unit
		var colour, offset;
		if (hexagon.getUnit().getPlayerID() == this.whitePlayer) {
			// colour = white;
			offset = 16;
		}
		else {
			// colour = black;
			offset = 0;
		}
		var name = hexagon.getUnit().getName();
		var num = 0;
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