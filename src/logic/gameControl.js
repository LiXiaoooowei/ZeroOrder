'use strict';

/*	NOTE: There is an important difference between current version of game and actual game!!!!!
	Currently each player only has 'delete', hence the part for which player place defeated piece
	as tile is not implemented. This will be added once some other pieces are added.
	Main while loop needs to be modified for this change.
*/



var game_board = require('./gameBoard');
var unit = require('./unit');
var player = require('./player');



// set default units for testing
var tile_position = [[2,3],[2,4],[2,5],[2,6],[2,7]];


// Alice win
var initial_pieces = [[['delete', [2,3]]], [['delete', [2,7]]]];

// Bob win
// var initial_pieces = [[['delete', [2,3]]], [['delete', [2,6]]]];

class Game {
	constructor(player_list) { 

		this.game_board = new game_board.GameBoard();
		this.end_of_game = false;
		this.players = player_list;
		this.current_player = player_list[0];
		this.setPlayerColour();
		this.winner = null;	
	}

	setPlayerColour() {
		this.players[0].setColour('black');
		this.players[1].setColour('white');
		this.game_board.setWhitePlayer(this.players[1].getName());
	}

	setTilesFromList(tile_list) {

		var num_tile = tile_list.length;
		for (var i = 0; i < num_tile; i++){
			// console.log(tile_list[i])
			this.game_board.getHexagon(tile_list[i]).setAsTile();
			
		}

	}

	setPlayerUnitsFromList(unit_list) {
		for (var i = 0; i < 2; i++) {
			for (var j = 0; j < unit_list[i].length; j++){
				// check if target hexagon is a tile
				var hexagon_ID = unit_list[i][j][1]
				var hexagon = this.game_board.getHexagon(hexagon_ID);
				if (!hexagon.isTile) {
					continue;
				}
				// check if the player already has the unit
				var new_unit = new unit.Delete(this.players[i].getName());
				var flag = this.players[i].addUnit(new_unit);
				// if successful, set position of the unit and update tile condition
				if (flag){
					new_unit.setPosition(hexagon_ID);
					hexagon.setUnit(new_unit);
					// console.log(new_unit);
				}
			}
		}
	}

	play() {
		this.status = 'waiting_movement'
		// TO-DO: separate components of this loop to different functions
		while (!this.end_of_game) {

			// check if current player has mobile pieces
			var valid_movements = this.game_board.getAllValidMoves(this.current_player.getName());
			// player is immoblised, hence loses the game
			if (valid_movements.length == 0){
				this.end_of_game = true;
				if (this.current_player.getName() === this.players[0].getName()){
					this.winner = this.players[1];
					this.status = 'white_win'
				}
				else {
					this.winner = this.players[0];
					this.status = 'black_win'
				}
				continue;
			}
			this.status = 'waiting_movement'
			//-------------------------------------------------------------------------------
			var board_state = this.getBoardState(valid_movements);
			// console.log(board_state);
			//-------------------------------------------------------------------------------
			// player make move
			// TO-DO: implement move as a class
			// TO-DO: pass a copy of borad status instead of the actual gameboard
			// TO-DO: check end of game condition after every activation
			// console.log(this.game_board.getAllValidMoves(this.current_player.getName()));
			var is_valid_move = false;
			while(!is_valid_move){
				var move = this.current_player.makeMoveRandom(valid_movements);
				is_valid_move = this.game_board.isValidMove(move, this.current_player.getName());
			}
			this.game_board.performMovement(move);
			console.log(this.current_player.getName() + ': ' + move[0] + '=>' + move[1]);
			// player activate piece
			this.status = 'waiting_activation'
			var valid_activations = this.game_board.getAllValidActivations(this.current_player.getName());
			//-------------------------------------------------------------------------------
			var board_state = this.getBoardState(valid_activations);
			// console.log(board_state);
			//-------------------------------------------------------------------------------
			// console.log(this.game_board.getAllValidActivations(this.current_player.getName()));
			var pending_activation = true;
			while(pending_activation) {
				var activation = this.current_player.activateAll(valid_activations);
				if (activation === null) {
					pending_activation = false;
				}				
				else {
					var unit = activation[0];
					if (!unit.can_activate()){
						continue;
					}
					console.log(activation)
					var target = activation[1];
					if (this.game_board.isValidActivation(unit, target)){
						this.game_board.performAction(unit, target);
						valid_activations = this.game_board.getAllValidActivations(this.current_player.getName());

						if (valid_activations.length == 0){
							pending_activation = false;
						}
					}
				}
			}
			

			// reset activation
			this.current_player.resetUnitActivation();
			// switch to next player
			if (this.current_player.getName() === this.players[0].getName()){
				this.current_player = this.players[1];
			}
			else{
				this.current_player = this.players[0];
			}
			// return 0;

		}
		//-------------------------------------------------------------------------------
		var board_state = this.getBoardState(null);
		// console.log(board_state);
		//-------------------------------------------------------------------------------
	}

	getBoardState(content) {
		var board_state = this.game_board.generateBoardState(this.current_player.getName());
		board_state.setStatus(this.status, content);
		return board_state.getBoardState();
	}
}

var player_list = [new player.AI('Alice'), new player.AI('Bob')];
var my_game = new Game(player_list);


my_game.setTilesFromList(tile_position);
my_game.setPlayerUnitsFromList(initial_pieces);
my_game.play();
console.log(my_game.winner.getName() + ' won!');