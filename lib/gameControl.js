'use strict';

var game_board = require('./gameBoard');

var unit = require('./unit');

var player = require('./player'); // set default units for testing


var tile_position = [[2, 3], [2, 4], [2, 5], [2, 6], [2, 7]]; // Alice win
// var initial_pieces = [[['delete', [2,3]]], [['delete', [2,7]]]];
// Bob win

var initial_pieces = [[['delete', [2, 3]]], [['delete', [2, 6]]]];

class Game {
  constructor(player_list) {
    this.game_board = new game_board.GameBoard();
    this.end_of_game = false;
    this.players = player_list;
    this.current_player = player_list[0];
    this.winner = null;
  }

  setTilesFromList(tile_list) {
    var num_tile = tile_list.length;

    for (var i = 0; i < num_tile; i++) {
      // console.log(tile_list[i])
      this.game_board.getHexagon(tile_list[i]).setAsTile();
    }
  }

  setPlayerUnitsFromList(unit_list) {
    for (var i = 0; i < 2; i++) {
      for (var j = 0; j < unit_list[i].length; j++) {
        // check if target hexagon is a tile
        var hexagon_ID = unit_list[i][j][1];
        var hexagon = this.game_board.getHexagon(hexagon_ID);

        if (!hexagon.isTile) {
          continue;
        } // check if the player already has the unit


        var new_unit = new unit.Delete(this.players[i].getName());
        var flag = this.players[i].addUnit(new_unit); // if successful, set position of the unit and update tile condition

        if (flag) {
          new_unit.setPosition(hexagon_ID);
          hexagon.setUnit(new_unit); // console.log(new_unit);
        }
      }
    }
  }

  play() {
    // TO-DO: separate components of this loop to different functions
    while (!this.end_of_game) {
      // check if current player has mobile pieces
      var mobile_list = this.current_player.getMobileUnitList(); // console.log(mobile_list)

      var flag = false;

      for (var i = 0; i < mobile_list.length; i++) {
        var hexagon_ID = mobile_list[i].getPosition();

        if (this.game_board.hasFreeTileToGo(hexagon_ID, this.current_player.getName())) {
          flag = true;
        }
      } // player is immoblised, hence loses the game


      if (flag === false) {
        this.end_of_game = true;

        if (this.current_player.getName() === this.players[0].getName()) {
          this.winner = this.players[1];
        } else {
          this.winner = this.players[0];
        }

        continue;
      } // player make move
      // TO-DO: implement move as a class
      // TO-DO: pass a copy of borad status instead of the actual gameboard


      var is_valid_move = false;

      while (!is_valid_move) {
        var move = this.current_player.makeMoveTest(this.game_board);
        is_valid_move = this.game_board.isValidMove(move, this.current_player.getName());
      }

      this.game_board.performMovement(move);
      console.log(this.current_player.getName() + ': ' + move[0] + '=>' + move[1]); // player activate piece

      var activation = this.current_player.activateAll(this.game_board);

      for (var i = 0; i < activation.length; i++) {
        var unit = activation[i][0];

        if (!unit.can_activate()) {
          continue;
        }

        if (game_board.isValidActivation(unit, target)) {
          game_board.performAction(unit, target);
        }
      } // reset activation


      this.current_player.resetUnitActivation(); // switch to next player

      if (this.current_player.getName() === this.players[0].getName()) {
        this.current_player = this.players[1];
      } else {
        this.current_player = this.players[0];
      } // return 0;

    }
  }

}

var player_list = [new player.AI('Alice'), new player.AI('Bob')];
var my_game = new Game(player_list);
my_game.setTilesFromList(tile_position);
my_game.setPlayerUnitsFromList(initial_pieces);
my_game.play();
console.log(my_game.winner.getName() + ' won!');