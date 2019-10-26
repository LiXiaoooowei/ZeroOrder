'use strict';

var RoundSequence = require('./roundSequence');
var gameBoardAI = require('./gameBoardAI');

class Player {
	constructor(name) {
		this.name = name
		this.isCurrentPlayer = false;
		this.unitList = [];
	}
	setColour(colour) {
		this.colour = colour;
	}

	addUnit(unit) {
		// check if the player already has the unit
		for (var i in this.unitList.length){
			if (unit.getName === this.unitList[i]){
				return false;
			}
		}
		this.unitList.push(unit);
		return true;
	}

	getMobileUnitList() {
		var list = []
		for (var i = 0; i < this.unitList.length; i++){
			if (this.unitList[i].getMobileStatus()){
				list.push(this.unitList[i]);
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
		return this.unitList;
	}

	resetUnitActivation() {
		for (var i = 0; i < this.unitList.length; i++) {
			this.unitList[i].resetActivation();
		}
	}
	getUnitWithName(name) {
		for (var i = 0; i < this.unitList.length; i++) {
			if (name === this.unitList[i].getName()){
				return this.unitList[i];
			}
		}
		return null;
	}
}

/* 
 * Two decision making methods:
 * 1. Random decision making:
 	  makeMoveRandom()
 	  activateAll()
 	  placeTileRandom()
 * 2. DFS based decision making:
	  makeMovePlan()
	  activatePlan()
	  buildPlan()
 */
class AI extends Player {
	constructor(name) {
		super(name)
	}

	// make a movement and plan for the rest of this round
	makeMovePlan(validMovements, game_state) {
		this.roundSequence = this.planRound(game_state);
		// console.log(this.round_sequence)
		return this.round_sequence.getMovement();
	}

	// use DFS to search for best strategy of this round
	planRound(game_state) {
		let currentScore = -Infinity;
		const game_board = new gameBoardAI.GameBoardAI(game_state, this.name);
		const round_sequence = new RoundSequence.RoundSequence(this.name);
		// let action_plan = [];
		return this.planRoundRec(game_board, currentScore, round_sequence);
	}

	// recursive function for DFS
	planRoundRec(game_board, currentScore, round_sequence) {
		// check round status
		const round_status = round_sequence.getStatus();
		// this should not happen!!!! for debugging only!!!
		if (round_status != 'movement' && round_sequence.movement === null){
			console.log('SOMETHING IS WRONG WITH ROUND_SEQUENCE')
			console.log(round_sequence);
		}
		// console.log(round_status);
		// termination
		// terminate when game status is in building and there is nothing to build
		if (round_status === 'end_of_turn') {
			// evaluate score for current gameboard, update if score is higher
			const newScore = Math.random();
			// console.log('new score: ' + newScore + ' best score: ' + currentScore);
			// console.log(this.round_sequence);
			if (newScore > currentScore) {
				// this.round_sequence = clone(round_sequence);
				// this.round_sequence = JSON.parse(JSON.stringify(round_sequence));
				this.round_sequence = round_sequence.copy();
				// console.log('inside');
				// console.log(this.round_sequence);
				return newScore;
			}
			else {
				return currentScore;
			}
		}
		// propagation
		// TO-DO: de-couple round_sequence and game_board at this stage, create round_sequence
		//		  only when current score is updated
		else {
			// get next layer
			let choices = null;
			switch(round_status) {
				case 'movement':
					choices = game_board.getAllValidMoves(this.name);
					// console.log(choices.length)
					break;
				case 'activation':
					choices = game_board.getAllValidActivations(this.name);
					// console.log(choices)
					break;
				case 'building':
					choices = game_board.getEmptySpaces();
					// console.log(choices)
					break;
				default:
					console.log('UNKONWN ROUND_STATUS')
					console.log(round_status);
			}
			for (let i = 0; i < choices.length; i++) {
				// console.log(choices[i])
				// go to next layer
				switch(round_status) {
					case 'movement':
						game_board.performMovement(choices[i]);
						round_sequence.setMovement(choices[i]);
						break;
					case 'activation':
						game_board.performAction(choices[i]);
						round_sequence.setNextActivation(choices[i]);
						break;
					case 'building':
						game_board.buildTile(choices[i]);
						round_sequence.setNextBuilding(choices[i]);
						break;
					default:
						console.log('UNKONWN ROUND_STATUS');
						console.log(round_status);
				}
				// recursion
				// console.log(currentScore)
				const score = this.planRoundRec(game_board, currentScore, round_sequence);
				if (score > currentScore){
					currentScore = score;
				}
				// backtrack for next iteration
				game_board.backtrack();
				// console.log('before')
				// console.log(round_sequence)
				round_sequence.removeLastStep();
				// console.log('after')
				// console.log(round_sequence)
			} // end of choices for-loop			
		}// end of propagation
		return currentScore;
	}

	activatePlan(valid_activations) {
		// console.log(valid_activations);
		// console.log(this.round_sequence.activation_list)
		return this.round_sequence.getNextActivation();
	}

	buildPlan(empty_spaces) {
		return this.round_sequence.getNextBuilding();
	}

	// make a random move from list of valid momements
	makeMoveRandom(validMovements) {

		var rand1 = Math.floor(Math.random()*validMovements.length);
		var unit_position = validMovements[rand1][0];
		var rand2 = Math.floor(Math.random()*validMovements[rand1][1].length);
		var new_position = validMovements[rand1][1][rand2];
		return [unit_position, new_position];
	}

	// activate all possible piece in random sequence with random targets
	activateAll(valid_activations) {
		// return null when there is no valid activation
		if (valid_activations.length == 0){
			return null;
		}
		// for (var i = 0; i < this.unitList; i++) {
		// 	unit = this.unitList[i]
		// 	if (unit.can_activate(game_board)){
		// 		var target_list = unit.getActivations(game_board);
		// 		if (target_list.length > 0){
		// 			activation_list.push([unit, target_list[0]]);
		// 		}
		// 	}
				
		// }
		var rand1 = Math.floor(Math.random()*valid_activations.length);
		// var unit = this.getUnitWithName(valid_activations[rand1][0]);
		const unit = valid_activations[rand1][1];
		var rand2 = Math.floor(Math.random()*valid_activations[rand1][2].length);
		var target = valid_activations[rand1][2][rand2];
		return [unit, target, valid_activations[rand1][0]];
	}

	// randomly choose an empty space to place the new tile
	placeTileRandom(empty_spaces) {
		var rand = Math.floor(Math.random()*empty_spaces.length);
		return empty_spaces[rand];
	}
}


class Human extends Player {
	constructor(name) {
		super(name)
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


module.exports.AI = AI;
module.exports.Human = Human;