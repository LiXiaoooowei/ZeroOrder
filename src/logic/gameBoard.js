'use strict';

var board_state = require('./boardState');

// Game board and hexagons

// constants for shape of board, see rule.pdf
const BOARD_SHAPE = [[0, 6], [0, 7], [1, 7], [1, 8], [2,8]];
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
		this.piece_to_place = [];

	}

	setWhitePlayer(player_ID) {
		this.white_player = player_ID;
	}

	getHexagon(ID) {
		return this.hexagon_list.get(ID_to_key(ID));
	}

	get_hexagon_neighbours(ID) {
		// var ID_list = get_hexagon_neighbour_ID(ID);		
		var ID_list = this.hexagon_list.get(ID_to_key(ID)).getNeighbourHexagonID();
		var neighbours = [];
		for (var i = 0; i < ID_list.length; i++) {
			neighbours.push(this.hexagon_list.get(ID_to_key(ID_list[i])));
		}
		return neighbours;
	}
	// create an boardstate object for front-end
	generateBoardState(current_player) {
		var boardstate = new board_state.BoardState(NUM_COLS, BOARD_SHAPE, this.white_player, current_player);
		for (var pair of this.hexagon_list) {
			boardstate.setHexagon(key_to_ID(pair[0]),pair[1]);
		}
		return boardstate;
	}
	
	//////////////////////////////////////////////////////////////////////////////////////////
	////////////////////////////////////// MOVEMENT///////////////////////////////////////////
	//////////////////////////////////////////////////////////////////////////////////////////
	
	//[[unit_position, [target positions]],...]
	getAllValidMoves(player_id) {
		var movement_list = [];		
		// loop through all hexagons
		for (var pair of this.hexagon_list) {
			var key = pair[0];
			var hexagon = pair[1];
			var unit = hexagon.getUnit();
			
			if (unit === null) {
				continue;
			}
			
			// check if the unit is free to move
			if (unit.player_id != player_id || !unit.isFreeToMove()){
				continue;
			}
			// get valid movement of the piece
			var tile_ID = key_to_ID(key);
			var targets = this.getTilesToMove(tile_ID, player_id);
			// console.log(targets)
			if (targets.length > 0) {
				movement_list.push([key_to_ID(key), targets]);
			}
		}
		return movement_list;
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
	getTilesToMove(tile_ID, player_ID) {
		var valid_tiles = [];
		var neighbours = get_hexagon_neighbour_ID(tile_ID);
		for (var i = 0; i < neighbours.length; i++){
			var hexagon = this.getHexagon(neighbours[i]);
			if (hexagon.isEmptyTile()){
				valid_tiles.push(hexagon.getID());
			}
		}
		return valid_tiles;
	}

	//////////////////////////////////////////////////////////////////////////////////////////
	////////////////////////////////////// ACTIVATION ////////////////////////////////////////
	//////////////////////////////////////////////////////////////////////////////////////////
	
	//[['unit_name', unit_position, [target list]],...]
	getAllValidActivations(player_id) {
		var activation_list = [];
		// loop through all hexagons
		for (var pair of this.hexagon_list) {
			var key = pair[0];
			var hexagon = pair[1];
			var unit = hexagon.getUnit();
			if (unit === null) {
				continue;
			}
			// check if the unit is free to activate
			if (unit.player_id != player_id || !unit.isFreeToActivate()){
				continue;
			}
			// get valid activations of the piece
			var targets = unit.getActivations(this);
			// console.log(targets)
			if (targets.length > 0) {
				activation_list.push([unit.getName(), key_to_ID(key), targets]);
			}
		}
		return activation_list;
	}
	// validate an action
	isValidActivation(activation){
		// return true;					//This should always returns true!!!!!!!!!!!
		var unit = activation[0];
		var target = activation[1];
		// the unit must be free to activate and has not yet activated
		if (!unit.free_to_activate || unit.has_activated) {
			return false;
		}
		var target_unit = this.hexagon_list.get(ID_to_key(target)).getUnit();
		
		// target must not be already defeated (to be changed later)
		if (target_unit.defeated) {
			return false;
		}	
		// target must belong to correct player
		switch (unit.getName()) {
			case 'switch':
				if (target_unit.getPlayerID() != unit.getPlayerID()){
					return false;
				}
				break;
			default:
				if (target_unit.getPlayerID() === unit.getPlayerID()){
					return false;
				}
		}	
		switch (unit.getName()) {
			case 'delete':		
				// target must be neighbour of target piece			
				var neighbours = get_hexagon_neighbour_ID(unit.position);
				for (var i = 0; i < neighbours.length; i++) {
					if (ID_to_key(neighbours[i]) === ID_to_key(target_unit.getPosition())){
						return true;
					}
				}
				break;
			case 'toss':
				// target must be neighbour of target piece
				var neighbours = get_hexagon_neighbour_ID(unit.position);
				var is_neighbour = false;
				for (var i = 0; i < neighbours.length; i++) {
					if (ID_to_key(neighbours[i]) === ID_to_key(target_unit.getPosition())){
						is_neighbour = true;
					}
				}
				if (!is_neighbour) {
					return false;
				}
				// the space behind target must not be an occupied tile
				var next_hex = this.getNextHexInOppDirection(unit.getPosition(), target_unit.getPosition());
				// the action is valid if the space behind target is out of map
				if (next_hex === null){
					return true;
				}
				// the action is valid if the space behind target is an empty tile
				if (this.getHexagon(next_hex).is_empty_tile) {
					return true;
				}
				break;
			case 'push':
				// target must be neighbour of target piece
				var neighbours = get_hexagon_neighbour_ID(unit.position);
				var is_neighbour = false;
				for (var i = 0; i < neighbours.length; i++) {
					if (ID_to_key(neighbours[i]) === ID_to_key(target_unit.getPosition())){
						is_neighbour = true;
					}
				}
				if (!is_neighbour) {
					return false;
				}
				// the space behind target must not be an occupied tile
				var next_hex = this.getNextHexInDirection(unit.getPosition(), target_unit.getPosition());
				// the action is valid if the space behind target is out of map
				if (next_hex === null){
					return true;
				}
				// the action is valid if the space behind target is an empty tile
				if (this.getHexagon(next_hex).is_empty_tile) {
					return true;
				}
				break;
			case 'switch':
				// target must be player's unit
				var target_unit = this.hexagon_list.get(ID_to_key(target)).getUnit();
				if (target_unit.getPlayerID() === unit.getPlayerID()) {
					return true;
				}
				break;
			default:
				return false;
		}

		return false;
	}
	// execute an action
	performAction(activation) {
		var unit = activation[0];
		var target = activation[1];

		switch (unit.getName()) {
			case 'delete':
				var target_unit = this.hexagon_list.get(ID_to_key(target)).getUnit();
				// set unit as activated
				unit.performAction();
				// defeat target unit
				target_unit.defeat();
				// clean-up gameboard
				var hexagon = this.hexagon_list.get(ID_to_key(target));
				hexagon.setUnit(null);
				this.piece_to_place.push(target_unit);
				break;
			case 'push':				
				var target_unit = this.hexagon_list.get(ID_to_key(target)).getUnit();
				// set unit as activated
				unit.performAction();
				var hexagons = this.getAllHexInDirection(unit.getPosition(), target);
				// Four possibilities for target:				
				//	[tile, tile, unit, ...]			#1
				//	[tile, tile, not tile, ...]		#2
				//	[tile, tile, ..., tile]			#3
				//	[]								#4
				var off_board_flag = true;
				var target_defeated = true;
				for (var i = 0; i < hexagons.length; i++) {
					hexagon = this.hexagon_list.get(ID_to_key(hexagons[i]));
					// #2
					if (!hexagon.isTile()) {
						off_board_flag = false;
						break;
					}
					// #1
					if (!hexagon.isEmptyTile()) {
						hexagon = this.hexagon_list.get(ID_to_key(hexagons[i-1]));
						off_board_flag = false;
						target_defeated = false;
						break;
					}
				}
				// if target sruvives (#1)
				if (!target_defeated) {
					this.performMovement([target, hexagon.getID()]);
				}
				// if target is defeated but not off map (#2)
				else if(!off_board_flag){
					hexagon.setAsTile();
					var hexagon = this.hexagon_list.get(ID_to_key(target));
					hexagon.setUnit(null);
					target_unit.defeat();
				}
				// target is defeated and off map (#3 and #4)
				else {
					var hexagon = this.hexagon_list.get(ID_to_key(target));
					hexagon.setUnit(null);
					target_unit.defeat();
					this.piece_to_place.push(target_unit);
				}
				break;
			case 'toss':
				var target_unit = this.hexagon_list.get(ID_to_key(target)).getUnit();
				// set unit as activated
				unit.performAction();
				var hexagons = this.getAllHexInOppDirection(unit.getPosition(), target);
				// Four possibilities for target:				
				//	[tile, tile, unit, ...]			#1
				//	[tile, tile, not tile, ...]		#2
				//	[tile, tile, ..., tile]			#3
				//	[]								#4
				var off_board_flag = true;
				var target_defeated = true;
				for (var i = 0; i < hexagons.length; i++) {
					hexagon = this.hexagon_list.get(ID_to_key(hexagons[i]));
					// #2
					if (!hexagon.isTile()) {
						off_board_flag = false;
						break;
					}
					// #1
					if (!hexagon.isEmptyTile()) {
						hexagon = this.hexagon_list.get(ID_to_key(hexagons[i-1]));
						off_board_flag = false;
						target_defeated = false;
						break;
					}
				}
				// if target sruvives (#1)
				if (!target_defeated) {
					this.performMovement([target, hexagon.getID()]);
				}
				// if target is defeated but not off map (#2)
				else if(!off_board_flag){
					hexagon.setAsTile();
					var hexagon = this.hexagon_list.get(ID_to_key(target));
					hexagon.setUnit(null);
					target_unit.defeat();
				}
				// target is defeated and off map (#3 and #4)
				else {
					var hexagon = this.hexagon_list.get(ID_to_key(target));
					hexagon.setUnit(null);
					target_unit.defeat();
					this.piece_to_place.push(target_unit);
				}
				break;
			case 'switch':
				var target_unit = this.hexagon_list.get(ID_to_key(target)).getUnit();
				// set unit as activated
				unit.performAction();
				// exchange position between 'switch' and target
				var original_position = unit.getPosition();
				unit.setPosition(target);
				target_unit.setPosition(original_position);
				// update gameboard
				var hexagon = this.hexagon_list.get(ID_to_key(target));
				hexagon.setUnit(unit);
				hexagon = this.hexagon_list.get(ID_to_key(original_position));
				hexagon.setUnit(target_unit);
				break;
			case 'freeze':
				break;
			default:
				console.log('unknown unit activation' + activation);
		}
	}

	// utility functions for unit activation
	//----------------------------- general functions----------------------------------
	getNeighbouringEnemies(player_id, position){
		var neighbours = this.get_hexagon_neighbours(position);
		// console.log(neighbours)
		var enemy_positions = [];
		for (var i = 0; i < neighbours.length; i++) {
			if (neighbours[i].unit != null && neighbours[i].unit.getPlayerID() != player_id){
				enemy_positions.push(neighbours[i].unit.getPosition());
				// console.log(enemy_positions)
			}
		}
		return enemy_positions;
	}
	getFriendlyUnits(player_id) {
		var friendly_list = [];
		for (var pair of this.hexagon_list) {
			var key = pair[0];
			var hexagon = pair[1];
			if (hexagon.isTile() && (!hexagon.isEmptyTile())){
				var unit = hexagon.getUnit();
				if (unit.getPlayerID() === player_id){
					friendly_list.push(unit.getPosition());
				}
			}
		}
		return friendly_list;
	}
	//----------------------------- end of general ----------------------------------
	//----------------------------PUSH and TOSS------------------------------
	getNextHexInDirection(origin, next) {
		//----------to do: validate origin and next are neighbours
		var col_change = next[0]-origin[0];
		var row_change = next[1]-origin[1];
		var col = next[0];
		var row = next[1];
		col = col + col_change;
		row = row + row_change;
		var next_pos = [col, row]
		if (isInBoard(next_pos)){
			return next_pos;
		}
		return null;
	}
	getAllHexInDirection(origin, next) {
		//----------to do: validate origin and next are neighbours
		var col_change = next[0]-origin[0];
		var row_change = next[1]-origin[1];
		var col = next[0];
		var row = next[1];
		var out_of_board = false;
		var hexagon_list = [];
		while (!out_of_board) {
			col = col + col_change;
			row = row + row_change;
			var next_pos = [col, row]
			if (isInBoard(next_pos)){
				hexagon_list.push(next_pos);
			}
			else {
				out_of_board = true;
			}
		}
		return hexagon_list;
	}
	getNextHexInOppDirection(origin, next) {
		return this.getNextHexInDirection(next, origin);
	}
	getAllHexInOppDirection(origin, next) {
		return this.getAllHexInDirection(next, origin);
	}
	//----------------------------end of PUSH and TOSS------------------------------
		
	

	//////////////////////////////////////////////////////////////////////////////////////////
	/////////////////////////////////////// BUILDING /////////////////////////////////////////
	//////////////////////////////////////////////////////////////////////////////////////////
	needBuilding() {
		return (this.piece_to_place.length != 0);
	}
	getEmptySpaces() {
		var empty_spaces = [];
		for (var pair of this.hexagon_list) {
			var key = pair[0];
			var hexagon = pair[1];
			if (!hexagon.isTile()) {
				empty_spaces.push(hexagon.getID());
			}
		}
		return empty_spaces;
	}
	isValidBuilding(target) {
		var hexagon = this.hexagon_list.get(ID_to_key(target));
		return !hexagon.is_tile;
	}
	buildTile(target) {
		this.piece_to_place.pop();
		var hexagon = this.hexagon_list.get(ID_to_key(target));
		hexagon.setAsTile();
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
		return this.ID;
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

// check if [i,j] is in game board
function isInBoard(ID) {
	var i = ID[0];
	var j = ID[1];
	if (i < 0 || i >= NUM_COLS){
		return false;
	}
	if (j < BOARD_SHAPE[i][0] || j > BOARD_SHAPE[i][1]){
		return false;
	}
	return true;
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