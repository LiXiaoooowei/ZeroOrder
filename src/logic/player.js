'use strict';

class Player {
  constructor(name) {
    this.name = name;
    this.is_current_player = false;
    this.unit_list = [];
  }

  addUnit(unit) {
    // check if the player already has the unit
    for (var i in this.unit_list.length) {
      if (unit.getName === this.unit_list[i]) {
        return false;
      }
    }

    this.unit_list.push(unit);
    return true;
  }

  getMobileUnitList() {
    var list = [];

    for (var i = 0; i < this.unit_list.length; i++) {
      if (this.unit_list[i].getMobileStatus()) {
        list.push(this.unit_list[i]);
      }
    }

    return list;
  }

  getName() {
    return this.name;
  }

  getUnits() {
    return this.unit_list;
  }

  resetUnitActivation() {
    for (var i = 0; i < this.unit_list.length; i++) {
      this.unit_list[i].resetActivation();
    }
  }

}

class AI extends Player {
  constructor(name) {
    super(name);
  } // make a random up-or-down move for first unit


  makeMoveTest(game_board) {
    var unit_position = this.unit_list[0].getPosition();
    var random_boolean = Math.random() >= 0.5;
    var new_position = [0, 0];
    new_position[0] = unit_position[0];

    if (random_boolean) {
      new_position[1] = unit_position[1] + 1;
    } else {
      new_position[1] = unit_position[1] - 1;
    }

    return [unit_position, new_position];
  } // activate all possible piece


  activateAll(game_board) {
    var activation_list = [];

    for (var i = 0; i < this.unit_list; i++) {
      unit = this.unit_list[i];

      if (unit.can_activate(game_board)) {
        var target_list = unit.getActivations(game_board);

        if (target_list.length > 0) {
          activation_list.push([unit, target_list[0]]);
        }
      }
    }

    return activation_list;
  }

}

class Human extends Player {
  constructor(name) {
    super(name);
  }

}

module.exports.AI = AI;
module.exports.Human = Human;