'use strict';

class Player {
	constructor(name) {
		this.name = name
		this.is_current_player = false;
		this.unit_list = [];
	}
	setColour(colour) {
		this.colour = colour;
	}

	addUnit(unit) {
		// check if the player already has the unit
		for (var i in this.unit_list.length){
			if (unit.getName === this.unit_list[i]){
				return false;
			}
		}
		this.unit_list.push(unit);
		return true;
	}

	getMobileUnitList() {
		var list = []
		for (var i = 0; i < this.unit_list.length; i++){
			if (this.unit_list[i].getMobileStatus()){
				list.push(this.unit_list[i]);
			}
		}
		return list;
	}

	getName() {
		return this.name;
	}

	getColour() {
		return this.colour;
	}

	getUnits() {
		return this.unit_list;
	}

	resetUnitActivation() {
		for (var i = 0; i < this.unit_list.length; i++) {
			this.unit_list[i].resetActivation();
		}
	}
	getUnitWithName(name) {
		for (var i = 0; i < this.unit_list.length; i++) {
			if (name === this.unit_list[i].getName()){
				return this.unit_list[i];
			}
		}
		return null;
	}
}


class AI extends Player {
	constructor(name) {
		super(name)
	}

	// make a random move from list of valid momements
	makeMoveRandom(valid_movments) {
		// var unit_position = this.unit_list[0].getPosition();
		// var random_boolean = Math.random() >= 0.5;
		// var new_position = [0,0];
		// new_position[0] = unit_position[0];
		// if (random_boolean){
		// 	new_position[1] = unit_position[1] + 1;
		// }
		// else{
		// 	new_position[1] = unit_position[1] - 1;
		// }
		// return [unit_position, new_position];
		// console.log(valid_movments)
		var rand1 = Math.floor(Math.random()*valid_movments.length);
		var unit_position = valid_movments[rand1][0];
		var rand2 = Math.floor(Math.random()*valid_movments[rand1][1].length);
		var new_position = valid_movments[rand1][1][rand2];
		return [unit_position, new_position];
	}

	// activate all possible piece in random sequence with random targets
	activateAll(valid_activations) {
		// return null when there is no valid activation
		if (valid_activations.length == 0){
			return null;
		}
		// for (var i = 0; i < this.unit_list; i++) {
		// 	unit = this.unit_list[i]
		// 	if (unit.can_activate(game_board)){
		// 		var target_list = unit.getActivations(game_board);
		// 		if (target_list.length > 0){
		// 			activation_list.push([unit, target_list[0]]);
		// 		}
		// 	}
				
		// }
		var rand1 = Math.floor(Math.random()*valid_activations.length);
		var unit = this.getUnitWithName(valid_activations[rand1][0]);
		var rand2 = Math.floor(Math.random()*valid_activations[rand1][2].length);
		var target = valid_activations[rand1][2][rand2];
		return [unit, target];
	}
}


class Human extends Player {
	constructor(name) {
		super(name)
	}
}


module.exports.AI = AI;
module.exports.Human = Human;