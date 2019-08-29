'use strict';

// Game board and hexagons

// constants for shape of board, see rule.pdf
const BOARD_SHAPE = [[1, 7], [1, 8], [2, 8], [2, 9], [3,9]];
const NUM_COLS = 5;



class GameBoard {
	constructor() {
		this.hexagon_list = new Map();
		for(var i = 0; i < NUM_COLS; i++){
			for(var j = BOARD_SHAPE[i][0]; j <= BOARD_SHAPE[i][1]; j++){
				var ID = [i,j];
				this.hexagon_list.set(ID_to_key(ID), new Hexagon(ID));
			}
		}
	}

	getHexagon(ID) {
		// console.log(this.hexagon_list.get(ID_to_key([2,3])))
		return this.hexagon_list.get(ID_to_key(ID));
	}
}


class Hexagon {
	constructor(ID) {
		this.ID = ID;
		this.is_tile = false;
		this.unit = null;
		this.is_empty_tile = false;
		this.neighbour_ID = get_hexagon_neighbour_ID(ID);
		// console.log(ID);
		// console.log(this.neighbour_ID);
	}
	getNeighbourHexagonID() {
		return this.neighbour_ID
	}
	setAsTile() {
		this.is_tile = true;
		this.is_empty_tile = true;
	}
	getUnit() {
		return this.unit
	}
	setUnit(unit) {
		// check if the current hexagon is a tile
		if (!this.is_tile) {
			return false;
		}
		this.unit = unit;
		// updata tile status
		if (unit === null) {
			this.is_empty_tile = true;
		}
		else {
			this.is_empty_tile = false;
		}
	}
	isEmptyTile() {
		return this.is_empty_tile;
	}
}


// returns a list of ID of nighbouring hexagons
function get_hexagon_neighbour_ID(ID){
	var col = ID[0];
	var row = ID[1];
	var neighbours = [];
	// check up-down
	if (BOARD_SHAPE[col][0] < row){
		neighbours.push([col, row-1]);
	}
	if (BOARD_SHAPE[col][1] > row){
		neighbours.push([col, row+1]);
	}
	// check left
	if (col > 0){
		if (BOARD_SHAPE[col-1][0] < row){
			neighbours.push([col-1, row-1]);
		}
		if (BOARD_SHAPE[col-1][1] >= row){
			neighbours.push([col-1, row]);
		}
	}
	// check right
	if (col < NUM_COLS-1) {
		if (BOARD_SHAPE[col+1][0] <= row){
			neighbours.push([col+1, row]);
		}
		if (BOARD_SHAPE[col+1][1] > row){
			neighbours.push([col+1, row+1]);
		}
	}
	return neighbours;
}

// [i,j] ==> 'i-j'
function ID_to_key(ID) {
	var i = ID[0];
	var j = ID[1];
	var key = i.toString()+' '+j.toString();
	return key;
}

// 'i-j' => [i,j]
function key_to_ID(key) {
	var tokens = key.split('-');
	var i = parseInt(tokens[0]);
	var j = parseInt(tokens[1]);
	return [i, j];
}


// module.exports.Hexagon = Hexagon;
module.exports.GameBoard = GameBoard;