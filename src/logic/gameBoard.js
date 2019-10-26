'use strict';

var board_state = require('./boardState');

// Game board and hexagons

// constants for shape of board, see rule.pdf
const BOARD_SHAPE = [[0, 6], [0, 7], [1, 7], [1, 8], [2,8]];
const NUM_COLS = 5;
// place holder for intermeidate steps such as switch
const temp_tile_ID = [100,100]


class GameBoard {
	constructor() {
		this.hexagon_list = new Map();
		for(var i = 0; i < NUM_COLS; i++){
			for(var j = BOARD_SHAPE[i][0]; j <= BOARD_SHAPE[i][1]; j++){
				var ID = [i,j];
				this.hexagon_list.set(ID_to_key(ID), new Hexagon(ID));
			}
		}
		// list of units to be built
		this.piece_to_place = [];
		// place holder for intermeidate steps such as switch
		this.temp_tile = new Hexagon(temp_tile_ID);
		this.temp_tile.setAsTile();
		this.hexagon_list.set(ID_to_key(temp_tile_ID), this.temp_tile);
		// keeps record for movements, activations and builds
		this.step_log = [];
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
	//////////////////////////////////// IRREDUCIBLE STEP ////////////////////////////////////
	//////////////////////////////////////////////////////////////////////////////////////////
	/* Any actual change to gameboard must be executed by one of these functions.
	 * These steps are easily reversible, hence it makes backtracking easy.
	 * They should be treated as private functions.
	 */

	// movement = [ID of starting tile, ID of ending tile]
	move(movement) {
		var first_ID = movement[0];
		var second_ID = movement[1];
		var first_hexagon =  this.hexagon_list.get(ID_to_key(first_ID));
		var second_hexagon =  this.hexagon_list.get(ID_to_key(second_ID));
		var unit = first_hexagon.getUnit();
		first_hexagon.setUnit(null);
		second_hexagon.setUnit(unit);
		unit.setPosition(second_ID);
	}
	// target = ID of target tile
	build(target) {	 	
		var hexagon = this.hexagon_list.get(ID_to_key(target));
		hexagon.setAsTile();
		hexagon.setTileUnit(this.piece_to_place.pop());
	}

	// freeze() {

	// }
	// target = ID of tile with defeated unit
	defeat(target) {
	 	const hexagon = this.hexagon_list.get(ID_to_key(target));
	 	const target_unit = hexagon.getUnit();
	 	target_unit.defeat();
	 	hexagon.setUnit(null);
	 	this.piece_to_place.push(target_unit);
	}
	// target = ID of the tile with the unit to activate
	activate(target) {
	 	const hexagon = this.hexagon_list.get(ID_to_key(target));
	 	const target_unit = hexagon.getUnit();
	 	target_unit.performAction();
	}

	performStepSequence(step_sequence) {
		for (let idx in step_sequence) {
			const step = step_sequence[idx];
			const step_type = step[0];
			const step_content = step[1];
			switch(step_type) {
				case 'move':
					this.move(step_content);
					break;
				case 'build':
					this.build(step_content);
					break;
				case 'defeat':
					this.defeat(step_content);
					break;
				case 'activate':
					this.activate(step_content);
					break;
				default:
					console.log('UNKNOWN STEP_TYPE IN STEP_SEQUENCE');
					console.log(step);
			}
		}
	}
	//////////////////////////////////////////////////////////////////////////////////////////
	////////////////////////////////////// MOVEMENT //////////////////////////////////////////
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
		// console.log(movement_list)
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
	performMovement(movement) {
		this.move(movement);
		this.step_log.push(['movement', movement]);
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
	// activation = [unit_position, target_info, 'unit_name']
	isValidActivation(activation){
		if (activation === null) {
			return true;
		}
		// console.log(activation)
		// return true;					//This should always returns true!!!!!!!!!!!
		const unit_position = activation[0];
		const initial_hexagon = this.hexagon_list.get(ID_to_key(unit_position));
		const unit = initial_hexagon.getUnit();
		var target = activation[1];
		// the unit must be free to activate and has not yet activated
		if (!unit.free_to_activate || unit.has_activated) {
			return false;
		}
		var target_unit = this.hexagon_list.get(ID_to_key(target)).getUnit();
		// the unit must be correct type
		if (unit.getName() != activation[2]) {
			return false;
		}
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
		// null activation indicates end of activation phase
		if (activation === null) {
			this.step_log.push(['activation', []]);
			return;
		}
		const unit_position = activation[0];
		const initial_hexagon = this.hexagon_list.get(ID_to_key(unit_position));
		const unit = initial_hexagon.getUnit();
		const unit_ID = unit.getPosition();
		const target = activation[1];
		let step_sequence = [];
		let hexagon = null;
		// set unit as activated
		step_sequence.push(['activate', unit_ID]);
		switch (unit.getName()) {
			case 'delete':
				step_sequence.push(['defeat', target]);
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
				// let hexagon = null;
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
					step_sequence.push(['move', [target, hexagon.getID()]]);
				}
				// if target is defeated but not off map (#2)
				else if(!off_board_flag){
					step_sequence.push(['defeat', target]);
					step_sequence.push(['build', hexagon.getID()]);
				}
				// target is defeated and off map (#3 and #4)
				else {
					step_sequence.push(['defeat', target]);
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
				// if target survives (#1)
				if (!target_defeated) {
					step_sequence.push(['move', [target, hexagon.getID()]]);
				}
				// if target is defeated but not off map (#2)
				else if(!off_board_flag){
					step_sequence.push(['defeat', target]);
					step_sequence.push(['build', hexagon.getID()]);
				}
				// target is defeated and off map (#3 and #4)
				else {
					step_sequence.push(['defeat', target]);
				}
				break;
			case 'switch':
				// exchange position between 'switch' and target
				const first_position = unit_ID;
				const second_position = target;
				step_sequence.push(['move',[first_position, temp_tile_ID]]);
				step_sequence.push(['move',[second_position, first_position]]);
				step_sequence.push(['move',[temp_tile_ID, second_position]]);
				break;
			case 'freeze':
				break;
			default:
				console.log('unknown unit activation' + activation);
		}
		// console.log(step_sequence)
		this.performStepSequence(step_sequence);
		this.step_log.push(['activation', step_sequence]);
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
	
	// check whether building is required for this turn
	needBuilding() {
		return (this.piece_to_place.length != 0);
	}

	// returns a list of emtpy spaces for building
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
		this.build(target);
		this.step_log.push(['building', target])
	}
}


class Hexagon {
	constructor(ID) {
		this.ID = ID;
		this.is_tile = false;
		this.unit = null;
		this.is_empty_tile = false;
		if (ID != temp_tile_ID) {
			this.neighbour_ID = get_hexagon_neighbour_ID(ID);
		}		
		this.tile_unit = null;
		// console.log(ID);
		// console.log(this.neighbour_ID);
	}
	getNeighbourHexagonID() {
		return this.neighbour_ID;
	}
	setAsTile() {
		// console.log(this.ID)
		this.is_tile = true;
		this.is_empty_tile = true;
	}
	setAsNotTile() {
		this.is_tile = false;
		this.is_empty_tile = false;
	}
	getUnit() {
		return this.unit;
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
	setTileUnit(unit) {
		this.tile_unit = unit;
	}
	getTileUnit() {
		return this.tile_unit;
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