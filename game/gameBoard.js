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

	hasFreeTileToGo(tile_ID, player_ID) {
		var neighbours = get_hexagon_neighbour_ID(tile_ID);
		for (var i = 0; i < neighbours.length; i++){
			var hexagon = this.getHexagon(neighbours[i]);
			if (hexagon.isEmptyTile()){
				return true;
			}
		}
		return false;
	}

	isValidMove(move, player_ID) {
		var starting_pos = move[0];
		var ending_pos = move[1];
		// check if starting pos has player's piece
		var hexagon = this.getHexagon(starting_pos);
		var unit = hexagon.getUnit();
		if (unit === null){
			return false;
		}
		if (unit.getPlayerID() != player_ID) {
			return false;
		}
		// check if ending pos is avaliable
		var sec_hexagon = this.getHexagon(ending_pos);
		// console.log(sec_hexagon.is_empty_tile)
		//!!!!!!!!!!!!!!!!!!!!!
		if (!sec_hexagon.is_empty_tile) {
			return false;
		}
		return true;
	}
	performMovement(move) {
		var first_ID = move[0];
		var second_ID = move[1];
		var first_hexagon =  this.hexagon_list.get(ID_to_key(first_ID));
		var second_hexagon =  this.hexagon_list.get(ID_to_key(second_ID));
		var unit = first_hexagon.getUnit();
		first_hexagon.setUnit(null);
		second_hexagon.setUnit(unit);
		unit.setPosition(second_ID);
	}
	get_hexagon_neighbours(ID) {
		var ID_list = get_hexagon_neighbour_ID(ID);
		var neighbours = [];
		for (var i = 0; i < ID_list.length; i++) {
			neighbours.push(this.hexagon_list.get(ID_to_key(ID)));
		}
		return neighbours;
	}

	getNeighbouringEnemies(player_id, position){
		var neighbours = this.get_hexagon_neighbours(position);
		var enemy_positions = [];
		for (var i = 0; i < neighbours.length; i++) {
			if (neighbours[i].unit != null && neighbours[i].unit.getPlayerID() != player_id){
				enemy_positions.push(neighbours[i].unit.getPosition());
			}
		}
		return enemy_positions;
	}
	isValidActivation(unit, target){
		if (!unit.free_to_activate || unit.has_activated) {
			return false;
		}
		var target_unit = this.hexagon_list.get(ID_to_key(target)).getUnit();
		if (unit.getName() === 'delete') {
			if (target_unit.getPlayerID() === unit.getPlayerID()){
				return false;
			}
			if (target_unit.defeated) {
				return false;
			}
			var neighbours = get_hexagon_neighbour_ID(unit.position);
			for (var i = 0; i < neighbours.length; i++) {
				if (neighbours[i] === target_unit.getPosition()){
					return true;
				}
			}
		}
		return false;
	}
	performAction(unit, target) {
		if (unit.getNmae() === 'delete') {
			var target_unit = this.hexagon_list.get(ID_to_key(target)).getUnit();
			// set unit as activated
			unit.performAction();
			// defeat target unit
			target_unit.defeat();
			// clean-up gameboard
			var hexagon = this.hexagon_list.get(ID_to_key(target));
			hexagon.setUnit(null);
		}
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
		// console.log(this.ID)
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
	isTile() {
		return this.is_tile;
	}
	getID() {
		return ID;
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
	// console.log(ID);
	var i = ID[0];
	var j = ID[1];
	var key = i.toString()+'-'+j.toString();
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
// module.exports. GameBoard.get_hexagon_neighbour_ID =  get_hexagon_neighbour_ID;