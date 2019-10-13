'use strict';

var gameboard = require('./gameBoard');
var unit = require('./unit');

/*	This class is used by AI player to simulate game board for planning purpose
	The key difference is that this class allows the player to backtrack steps 
	performed in the current turn.
*/

class GameBoardAI extends gameboard.GameBoard {

	constructor(board_state) {
		super();
		if (board_state != null) {
			this.setupGameBoard(board_state);
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
	setupGameBoard(board_state) {
		// set white player
		this.setWhitePlayer(board_state[3]);
		// determine current player colour
		const current_player = board_state[4];
		// const current_player_colour = ;
		if (board_state[4] === current_player){
			current_player_colour = 'white';
		}
		else {
			current_player_colour = 'black';
		}
		// set name for the other player
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
				if (unit_idx < 1 || unit_idx > 32) {
					continue;
				}
				let unit = null;
				// determine which player the unit is belonged to
				let unit_owner = current_player;
				if ((current_player_colour === 'white' && unit_idx < 16) ||
					(current_player_colour === 'black' && unit_idx >= 16)) {
					unit_owner = other_player;
				}
				switch(unit_idx%16) {
					case 1:
						unit = new unit.Delete(unit_owner);
						break;
					case 2:
						unit = new unit.PUSH(unit_owner);
						break;
					case 3:
						unit = new unit.SWITCH(unit_owner);
						break;
					case 4:
						unit = new unit.TOSS(unit_owner);
						break;
					default:
						console.log('UNKNOWN UNIT TYPE WHEN CONSTRUCTING AIGAMEBOARD');
						console.log(tile_status);
				}
			}
		}
		// set units status

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
				reverseMove(step_content);
				break;
			case 'activation':
				reverseStepSequence(step_content);
				break;
			case 'building':
				reverseBuild(step_content);
				break;
			// case 'end-of-turn':
			// 	break;
			default:
				console.log('unregonised step type in backtracking' + status);
		}
	}
}

module.exports.GameBoardAI = GameBoardAI;