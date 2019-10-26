'use strict';

var gameboard = require('./gameBoard');
var unit = require('./unit');

/*	This class is used by AI player to simulate game board for planning purpose
	The key difference is that this class allows the player to backtrack steps 
	performed in the current turn.
*/

class GameBoardAI extends gameboard.GameBoard {

	constructor(board_state, player_name) {
		super();		
		if (board_state != null) {
			this.setupGameBoard(board_state, player_name);
		}
		this.turn_status = 'movement';
	}

	//////////////////////////////////////////////////////////////////////////////////////////
	////////////////////////////////////// BOARDSTATE ////////////////////////////////////////
	//////////////////////////////////////////////////////////////////////////////////////////
	/* 	board_state is an array with the following:
	*	board_state[0]: number of columns of game board
	*	board_state[1]: a 2D array specifying valid locations on each column
	* 	board_state[2]: a matrix representation of game board. Each loaction is represented as [UNIT, ABLE_TO_MOVE]
	*	board_state[3]: name of white player
	*	board_state[4]: name of current player
	* 	board_state[5]: current game status, it can be PENDING_MOVE, PENDING_ACTION, PENDING_NEW_TILE, WHITE_WIN
	*					or BLACK_WIN
	*	board_state[6]: if the game is pending movement, it contents a list of valid movements,
	*					each movement is represented as [starting location, [list of valid ending locations]]
	*					if the game is pending activation, it contents a list of valid activations, 
	*					each activation is represented as [name of unit, location, [list of valid targets]]
	* 					if the game is waiting for player to place a defeated piece, it contains the 
	*					list of non-tile spaces.
	*/
	// initialise gameboard from boardstate
	// ASSUMPTION: board_state is at PENDING_MOVE!!!
	setupGameBoard(board_state, player_name) {
		// set white player
		this.setWhitePlayer(board_state[3]);
		// determine current player colour
		let current_player = board_state[4];
		// const current_player_colour = ;
		let current_player_colour = '??'
		if (board_state[3] === current_player){
			current_player_colour = 'white';
		}
		else {
			current_player_colour = 'black';
		}
		// set name for the other player
		current_player = player_name;
		// console.log(current_player)
		const other_player = 'not'+current_player;
		// set units and tiles
		let unit_list = [];
		const num_col = board_state[0];
		for (let i = 0; i < num_col; i++) {
			for (let j = board_state[1][i][0]; j <= board_state[1][i][1]; j++) {
				const tile_status = board_state[2][i][j];
				const unit_idx = tile_status[0];
				const unit_status = tile_status[1];
				// skip if there is no unit at this position
				if (unit_idx === 37) {
					continue;
				}
				// set the position as empty tile
				else if (unit_idx === 38) {
					const tile_position = [i, j]
					const hexagon = this.hexagon_list.get(ID_to_key(tile_position));
					hexagon.setAsTile();
					continue;
				}
				let new_unit = null;
				// determine which player the unit is belonged to
				let unit_owner = current_player;
				if ((current_player_colour === 'white' && unit_idx < 16) ||
					(current_player_colour === 'black' && unit_idx >= 16)) {
					unit_owner = other_player;
				}
				// console.log(current_player, unit_owner, current_player_colour, unit_idx, i, j)
				switch(unit_idx%16) {
					case 1:
						new_unit = new unit.Delete(unit_owner);
						break;
					case 2:
						new_unit = new unit.Push(unit_owner);
						break;
					case 3:
						new_unit = new unit.Switch(unit_owner);
						break;
					case 4:
						new_unit = new unit.Toss(unit_owner);
						break;
					default:
						console.log('UNKNOWN UNIT TYPE WHEN CONSTRUCTING AIGAMEBOARD');
						console.log(tile_status);
				}
				const tile_position = [i, j]
				const hexagon = this.hexagon_list.get(ID_to_key(tile_position));
				hexagon.setAsTile();
				new_unit.setPosition(tile_position);
				hexagon.setUnit(new_unit);
			}
		}
		// set units status

	}

	// restructured the array returned to make DFS easier
	getAllValidMoves(player_id) {
		const movements = super.getAllValidMoves(player_id);
		// console.log(movements);
		let choices = [];
		for (let i = 0; i < movements.length; i++) {
			const starting = movements[i][0];
			for (let j = 0; j < movements[i][1].length; j++) {
				const ending = movements[i][1][j];
				choices.push([starting, ending]);
			}
		}
		return choices;
	}
	getAllValidActivations(player_id) {
		const activations = super.getAllValidActivations(player_id);
		let choices = [null];	// null -> skip activation
		for (let i = 0; i < activations.length; i++) {
			const unit_name = activations[i][0];
			const unit_position = activations[i][1];
			for (let j = 0; j < activations[i][2].length; j++) {
				const target = activations[i][2][j];
				choices.push([unit_position, target, unit_name]);
			}
		}
		return choices;
	}
	getEmptySpaces() {
		if (this.piece_to_place.length === 0) {
			return [null];
		}
		else {
			return super.getEmptySpaces();
		}
	}

	buildTile(target) {
		if (target === null) {
			this.step_log.push(['building', null]);
		}
		else {
			super.buildTile(target);
		}
	}
	//////////////////////////////////////////////////////////////////////////////////////////
	//////////////////////////////////// IRREDUCIBLE STEP ////////////////////////////////////
	//////////////////////////////////////////////////////////////////////////////////////////
	// movement = [ID of starting tile, ID of ending tile]
	reverseMove(movement) {
		const first_ID = movement[1];
		const second_ID = movement[0];
		const first_hexagon =  this.hexagon_list.get(ID_to_key(first_ID));
		const second_hexagon =  this.hexagon_list.get(ID_to_key(second_ID));
		const unit = first_hexagon.getUnit();
		first_hexagon.setUnit(null);
		second_hexagon.setUnit(unit);
		unit.setPosition(second_ID);
	}
	// target = ID of target tile
	reverseBuild(target) {	 
		if (target === null) {
			return;
		}	
		const hexagon = this.hexagon_list.get(ID_to_key(target));
		const unit = hexagon.getTileUnit();
		hexagon.setAsNotTile();
		hexagon.setTileUnit(null);
		this.piece_to_place.push(unit);
	}

	// freeze() {

	// }
	// target = ID of tile with defeated unit
	reverseDefeat(target) {
	 	const hexagon = this.hexagon_list.get(ID_to_key(target));
	 	const target_unit = this.piece_to_place.pop();
	 	target_unit.revive();
	 	hexagon.setUnit(target_unit);
	}
	// target = ID of the tile with the unit to activate
	reverseActivate(target) {
	 	const hexagon = this.hexagon_list.get(ID_to_key(target));
	 	const target_unit = hexagon.getUnit();
	 	target_unit.resetActivation();
	}

	// reverse steps performed in one activation
	reverseStepSequence(step_sequence) {
		step_sequence.reverse();
		for (let idx in step_sequence) {
			const step = step_sequence[idx];
			const step_type = step[0];
			const step_content = step[1];
			switch(step_type) {
				case 'move':
					this.reverseMove(step_content);
					break;
				case 'build':
					this.reverseBuild(step_content);
					break;
				case 'defeat':
					this.reverseDefeat(step_content);
					break;
				case 'activate':
					this.reverseActivate(step_content);
					break;
				default:
					console.log('UNKNOWN STEP_TYPE IN STEP_SEQUENCE');
					console.log(step);
			}
		}
	}

	// backtrack one step in the current turn
	backtrack() {
		const last_step = this.step_log.pop();
		const step_type = last_step[0];
		const step_content = last_step[1];
		switch (step_type) {
			case 'movement':
				this.reverseMove(step_content);
				break;
			case 'activation':
				this.reverseStepSequence(step_content);
				break;
			case 'building':
				this.reverseBuild(step_content);
				break;
			// case 'end-of-turn':
			// 	break;
			default:
				console.log('unregonised step type in backtracking' + status);
		}
	}
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


module.exports.GameBoardAI = GameBoardAI;