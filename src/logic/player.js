'use strict';

const RoundSequence = require('./roundSequence');
const GameBoardAI = require('./gameBoardAI');

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
		for (let i in this.unitList.length){
			if (unit.getName === this.unitList[i]){
				return false;
			}
		}
		this.unitList.push(unit);
		return true;
	}

	getMobileUnitList() {
		let list = []
		for (let i = 0; i < this.unitList.length; i++){
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
		for (let i = 0; i < this.unitList.length; i++) {
			this.unitList[i].resetActivation();
		}
	}
	getUnitWithName(name) {
		for (let i = 0; i < this.unitList.length; i++) {
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
	makeMovePlan(validMovements, gameState) {
		this.planRound(gameState);
		// console.log(this.roundSequence)
		return this.roundSequence.getMovement();
	}

	// use DFS to search for best strategy of this round
	planRound(gameState) {
		let currentScore = -Infinity;
		const gameBoard = new GameBoardAI.GameBoardAI(gameState, this.name);
		const roundSequence = new RoundSequence.RoundSequence(this.name);
		// let action_plan = [];
		this.planRoundRec(gameBoard, currentScore, roundSequence);
	}

	// recursive function for DFS
	planRoundRec(gameBoard, currentScore, roundSequence) {
		// check round status
		const roundStatus = roundSequence.getStatus();
		// this should not happen!!!! for debugging only!!!
		if (roundStatus != 'movement' && roundSequence.movement === null){
			console.log('SOMETHING IS WRONG WITH roundSequence')
			console.log(roundSequence);
		}
		// console.log(roundStatus);
		// termination
		if (roundStatus === 'end_of_turn') {
			// evaluate score for current gameboard, update if score is higher
			const newScore = Math.random();
			// console.log('new score: ' + newScore + ' best score: ' + currentScore);
			// console.log(this.roundSequence);
			if (newScore > currentScore) {
				this.roundSequence = roundSequence.copy();
				// console.log('inside');
				// console.log(this.roundSequence);
				return newScore;
			}
			else {
				return currentScore;
			}
		}
		// propagation
		// TO-DO: de-couple roundSequence and gameBoard at this stage, create roundSequence
		//		  only when current score is updated
		else {
			// get next layer
			let choices = null;
			switch(roundStatus) {
				case 'movement':
					choices = gameBoard.getAllValidMoves(this.name);
					// console.log(choices.length)
					break;
				case 'activation':
					choices = gameBoard.getAllValidActivations(this.name);
					// console.log(choices)
					break;
				case 'building':
					choices = gameBoard.getEmptySpaces();
					// console.log(choices)
					break;
				default:
					console.log('UNKONWN roundStatus')
					console.log(roundStatus);
			}
			for (let i = 0; i < choices.length; i++) {
				// console.log(choices[i])
				// go to next layer
				switch(roundStatus) {
					case 'movement':
						gameBoard.performMovement(choices[i]);
						roundSequence.setMovement(choices[i]);
						break;
					case 'activation':
						gameBoard.performAction(choices[i]);
						roundSequence.setNextActivation(choices[i]);
						break;
					case 'building':
						gameBoard.buildTile(choices[i]);
						roundSequence.setNextBuilding(choices[i]);
						break;
					default:
						console.log('UNKONWN roundStatus');
						console.log(roundStatus);
				}
				// recursion
				// console.log(currentScore)
				const score = this.planRoundRec(gameBoard, currentScore, roundSequence);
				if (score > currentScore){
					currentScore = score;
				}
				// backtrack for next iteration
				gameBoard.backtrack();
				roundSequence.removeLastStep();
			} // end of choices for-loop			
		}// end of propagation
		return currentScore;
	}

	activatePlan(validActivations) {
		return this.roundSequence.getNextActivation();
	}

	buildPlan(emptySpaces) {
		return this.roundSequence.getNextBuilding();
	}

	// make a random move from list of valid momements
	makeMoveRandom(validMovements) {

		const rand1 = Math.floor(Math.random()*validMovements.length);
		const unitPosition = validMovements[rand1][0];
		const rand2 = Math.floor(Math.random()*validMovements[rand1][1].length);
		const newPosition = validMovements[rand1][1][rand2];
		return [unitPosition, newPosition];
	}

	// activate all possible piece in random sequence with random targets
	activateAll(validActivations) {
		// return null when there is no valid activation
		if (validActivations.length == 0){
			return null;
		}
				
		const rand1 = Math.floor(Math.random()*validActivations.length);
		// var unit = this.getUnitWithName(validActivations[rand1][0]);
		const unit = validActivations[rand1][1];
		const rand2 = Math.floor(Math.random()*validActivations[rand1][2].length);
		const target = validActivations[rand1][2][rand2];
		return [unit, target, validActivations[rand1][0]];
	}

	// randomly choose an empty space to place the new tile
	placeTileRandom(emptySpaces) {
		const rand = Math.floor(Math.random()*emptySpaces.length);
		return emptySpaces[rand];
	}
}


class Human extends Player {
	constructor(name) {
		super(name)
	}
}


function clone(obj) {
    if (null == obj || "object" != typeof obj) return obj;
    const copy = new obj.constructor();
    for (let attr in obj) {
        if (obj.hasOwnProperty(attr)) copy[attr] = obj[attr];
    }
    // console.log(copy)
    return copy;
}


module.exports.AI = AI;
module.exports.Human = Human;