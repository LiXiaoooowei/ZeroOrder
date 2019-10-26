'use strict';

/* Each round is madeup by three stages:
* Firstly a move, which involves a starting position and an ending position
* Then a activation sequence, which always ends with null
* Finally if building is required, a list of places to put new tiles
*
* This class is important for AI to plan the turn
*/

class RoundSequence {
	constructor(playerID) {
		this.playerID = playerID;
		// this indicates which planning stage the AI is at
		// movement -> activation -> building -> end_of_turn
		this.status = 'movement'
		// pointer for current stage of turn
		this.activation_pointer = 0
		this.building_pointer = 0
		// actual content
		this.movement = null;
		this.activation_list = [];
		this.building_list = [];
	}

	// setters
	setMovement(movement) {
		// console.log(movement)
		this.movement = movement;
		this.status = 'activation'
	}
	setNextActivation(activation) {
		if (activation === null) {
			this.status = 'building';
		}
		else {
			this.activation_list.push(activation);
		}		
	}
	setNextBuilding(target) {
		if (target === null) {
			this.status = 'end_of_turn';
		}
		else {
			this.building_list.push(target);
		}		
	}

	// getters
	getMovement() {
		return this.movement;
	}
	getNextActivation() {
		if (this.activation_pointer === this.activation_list.length) {
			return null;
		}
		var activation = this.activation_list[this.activation_pointer];
		this.activation_pointer += 1;
		// console.log(this.activation_list);
		return activation;
	}
	getNextBuilding() {
		var building = this.building_list[this.building_pointer];
		this.building_pointer += 1;
		return building;
	}
	getStatus() {
		return this.status;
	}

	// this function removes the last step planned
	// returns false if there is no step plannen
	// returns true otherwise
	removeLastStep() {
		if (this.status === 'end_of_turn') {
			this.status = 'building';
		}
		else if (this.building_list.length > 0) {
			this.building_list.pop();
		}
		else if (this.status === 'building') {
			this.status = 'activation';
		}
		else if (this.activation_list.length > 0) {
			const step = this.activation_list.pop();
			// if (this.activation_list.length === 0) {
			// 	this.status = 'movement'
			// }
		}
		else if (this.status === 'activation' && this.activation_list.length === 0) {
			this.movement = null;
			this.status = 'movement';
		}
		else {
			return false;
		}
		return true;
	}

	// this duplicates the object
	copy() {
		const round_sequence = new RoundSequence(this.playerID);
		round_sequence.status = this.status;
		round_sequence.activation_pointer = this.activation_pointer;
		round_sequence.building_pointer = this.building_pointer;
		// copy movement
		round_sequence.movement = JSON.parse(JSON.stringify(this.movement));
		// copy activation
		round_sequence.activation_list = JSON.parse(JSON.stringify(this.activation_list));
		// copy building list
		round_sequence.building_list = JSON.parse(JSON.stringify(this.building_list));
		return round_sequence;
		// return clone(this);
	}
}



function clone(obj) {
    if (null == obj || "object" != typeof obj) return obj;
    var copy = new obj.constructor();
    for (var attr in obj) {
        if (obj.hasOwnProperty(attr)) copy[attr] = obj[attr];
    }
    // console.log(copy)
    return copy;
}

module.exports.RoundSequence = RoundSequence;