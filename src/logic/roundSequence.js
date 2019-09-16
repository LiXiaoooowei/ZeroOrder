'use strict';

/* Each round is madeup by two stages:
* Firstly a move, which involves a starting position and an ending position
* Then a activation sequence, which always ends with null
* Finally if building is required, a list of places to put new tiles
*
* This class is important for AI to plan the turn
*/

class RoundSequence {
	constructor(player_id) {
		this.player_id = player_id;
		// this indicates which planning stage the AI is at
		this.status = 'movement'
		// pointer for current stage of turn
		this.activation_pointer = 0
		this.building_pointer = 0
		// actual content
		this.mvoement = null;
		this.activation_list = [];
		this.building_list = [];
	}

	// setters
	setMovement(starting, ending) {
		this.movement = [starting, ending];
		this.status = 'activation'
	}
	setNextActivation(activation) {
		this.activation_list.push(activation);
	}
	completeActivation(){
		this.activation_list.push(null);
		this.status = 'building';
	}

	// getters
	getMovement() {
		return this.movement;
	}
	getNextActivation() {
		var activation = this.activation_list[this.activation_pointer];
		this.activation_pointer += 1;
		return activation;
	}
	getNextBuilding() {
		var building = this.building_list[this.building_pointer];
		this.building_pointer += 1;
		return building;
	}

	// this function removes the last step planned
	// returns false if there is no step plannen
	// returns true otherwise
	removeLastStep() {
		if (this.building_list.length > 0) {
			this.building_list.pop();
		}
		else if (this.activation_list.length > 0) {
			const step = this.activation_list.pop();
			if (step === null) {
				this.status = 'activation'
			}
		}
		else if (this.movement != null) {
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
		var round_sequence = new RoundSequence(this.player_id);
		round_sequence.status = this.status;
		round_sequence.activation_pointer = this.activation_pointer;
		round_sequence.building_pointer = this.building_pointer;
		round_sequence.movement = this.movement;
		round_sequence.activation_list = this.activation_list;
		round_sequence.building_list = this.building_list;
	}
}

module.exports.RoundSequence = RoundSequence;