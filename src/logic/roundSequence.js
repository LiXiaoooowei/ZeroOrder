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
		this.activationPointer = 0
		this.buildingPointer = 0
		// actual content
		this.movement = null;
		this.activationList = [];
		this.buildingList = [];
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
			this.activationList.push(activation);
		}		
	}
	setNextBuilding(target) {
		if (target === null) {
			this.status = 'end_of_turn';
		}
		else {
			this.buildingList.push(target);
		}		
	}

	// getters
	getMovement() {
		return this.movement;
	}
	getNextActivation() {
		if (this.activationPointer === this.activationList.length) {
			return null;
		}
		var activation = this.activationList[this.activationPointer];
		this.activationPointer += 1;
		// console.log(this.activationList);
		return activation;
	}
	getNextBuilding() {
		var building = this.buildingList[this.buildingPointer];
		this.buildingPointer += 1;
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
		else if (this.buildingList.length > 0) {
			this.buildingList.pop();
		}
		else if (this.status === 'building') {
			this.status = 'activation';
		}
		else if (this.activationList.length > 0) {
			const step = this.activationList.pop();
			// if (this.activationList.length === 0) {
			// 	this.status = 'movement'
			// }
		}
		else if (this.status === 'activation' && this.activationList.length === 0) {
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
		const roundSequence = new RoundSequence(this.playerID);
		roundSequence.status = this.status;
		roundSequence.activationPointer = this.activationPointer;
		roundSequence.buildingPointer = this.buildingPointer;
		// copy movement
		roundSequence.movement = JSON.parse(JSON.stringify(this.movement));
		// copy activation
		roundSequence.activationList = JSON.parse(JSON.stringify(this.activationList));
		// copy building list
		roundSequence.buildingList = JSON.parse(JSON.stringify(this.buildingList));
		return roundSequence;
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