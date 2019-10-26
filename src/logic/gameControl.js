'use strict';

/*	NOTE: There is an important difference between current version of game and actual game!!!!!
	Currently each player only has 'delete', hence the part for which player place defeated piece
	as tile is not implemented. This will be added once some other pieces are added.
	Main while loop needs to be modified for this change.
*/



var game_board = require('./gameBoard');
var unit = require('./unit');
var player = require('./player');


 var tile_position = [[1,3],[1,4],[1,5],[1,6],[1,7],[2,3],[2,4],[2,5],[2,6],[2,7],[3,2],[3,3],[3,5],[3,6],[3,7]];
 var initial_pieces = [[['delete', [2,3]], ['toss', [2,4]], ['push',[1,3]]], [['delete', [2,7]],['switch',[3,6]],['push',[3,5]]]];


// set default units for testing
// var tile_position = [[2,3],[2,4],[2,5],[2,6],[2,7]];


// Alice win
// var initial_pieces = [[['delete', [2,3]]], [['delete', [2,7]]]];

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
				switch (unit_list[i][j][0]) {
					case 'delete':
						var new_unit = new unit.Delete(this.players[i].getName());
						break;
					case 'push':
						var new_unit = new unit.Push(this.players[i].getName());
						break;
					case 'toss':
						var new_unit = new unit.Toss(this.players[i].getName());
						break;
					case 'switch':
						var new_unit = new unit.Switch(this.players[i].getName());
						break;
					default:
						console.log('unknown unit in unit list' + unit_list[i][j][0]);
				}
				
				// check if the player already has the unit				
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
		

		while (!this.end_of_game) {
			
			this.move();
			if (this.end_of_game){
				continue;
			}
			
			this.action();

			this.build();

			this.endOfTurn();

		}
		//-------------------------------------------------------------------------------
		var board_state = this.getBoardState(null);
		// console.log(board_state);
		//-------------------------------------------------------------------------------
	}
	move() {
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
			return;
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
			var move = this.current_player.makeMovePlan(valid_movements, board_state);
			is_valid_move = this.game_board.isValidMove(move, this.current_player.getName());
		}
		this.game_board.performMovement(move);
		console.log(this.current_player.getName() + ': ' + move[0] + '=>' + move[1]);
	}
	action() {
		// player activate piece
		this.status = 'waiting_activation'
		var valid_activations = this.game_board.getAllValidActivations(this.current_player.getName());
		//-------------------------------------------------------------------------------
		var board_state = this.getBoardState(valid_activations);
		// console.log(board_state);
		//-------------------------------------------------------------------------------
		var pending_activation = true;
		while(pending_activation) {
			var activation = this.current_player.activatePlan(valid_activations);
			if (activation === null) {
				pending_activation = false;
			}				
			else {
				// var unit = activation[0];
				// if (!unit.can_activate()){
				// 	continue;
				// }
				// var target = activation[1];
				if (this.game_board.isValidActivation(activation)){
					console.log(activation);
					this.game_board.performAction(activation);
					valid_activations = this.game_board.getAllValidActivations(this.current_player.getName());
					// if (valid_activations.length == 0){
					// 	pending_activation = false;
					// }
				}
			}
		}
	}
	build() {
		while (this.game_board.needBuilding()){
			this.status = 'waiting_tile';
			var empty_spaces = this.game_board.getEmptySpaces();
			//-------------------------------------------------------------------------------
			var board_state = this.getBoardState(empty_spaces);
			// console.log(board_state);
			//-------------------------------------------------------------------------------
			var target = this.current_player.buildPlan(empty_spaces);
			if (this.game_board.isValidBuilding(target)) {
				this.game_board.buildTile(target);
				console.log('new tile at ' + target);
			}			
		}
	}
	endOfTurn() {
		// reset activation
		this.current_player.resetUnitActivation();
		// switch to next player
		if (this.current_player.getName() === this.players[0].getName()){
			this.current_player = this.players[1];
		}
		else{
			this.current_player = this.players[0];
		}
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