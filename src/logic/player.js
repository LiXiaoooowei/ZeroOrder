'use strict';

/* interesting observation about AI_Random and AI_DFS:
 * when AI_DFS has random evaluation function, it performs better than
 * AI_Random although both are making random moves. This is because 
 * AI_DFS has higher chance of making more complicated moves and those
 * moves are generally better.
 */

const RoundSequence = require('./roundSequence');
const GameBoardAI = require('./AI/gameBoardAI');
const StateEvaluator = require('./AI/stateEvaluation');

const convertActivations  = GameBoardAI.convertActivations;

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


class AI_DFS extends Player {
	constructor(name, key) {
		super(name)
		this.evaluator = new StateEvaluator.StateEvaluation(key);
	}

	// make a movement and plan for the rest of this round
	move(validMovements, gameState) {
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
			const newScore = this.evaluator.evaluate(gameBoard)
			// const newScore = Math.random();
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

	activate(validActivations) {
		return this.roundSequence.getNextActivation();
	}

	build(emptySpaces) {
		return this.roundSequence.getNextBuilding();
	}
}


// make random movements but always activate if possible
class AI_Random extends Player {
	constructor(name) {
		super(name)
	}

	// make a random move from list of valid momements
	move(validMovements, gameState) {

		const rand1 = Math.floor(Math.random()*validMovements.length);
		const unitPosition = validMovements[rand1][0];
		const rand2 = Math.floor(Math.random()*validMovements[rand1][1].length);
		const newPosition = validMovements[rand1][1][rand2];
		return [unitPosition, newPosition];
	}

	// activate all possible piece in random sequence with random targets
	activate(validActivations) {
		// console.log(validActivations)
		// return null when there is no valid activation
		if (validActivations.length == 0){
			return null;
		}
		const activations = convertActivations(validActivations);
		const rand1 = Math.floor(Math.random()*activations.length);
		return activations[rand1];
	}

	// randomly choose an empty space to place the new tile
	build(emptySpaces) {
		const rand = Math.floor(Math.random()*emptySpaces.length);
		return emptySpaces[rand];
	}
}



class Human extends Player {
	constructor(name) {
		super(name)
	}

	move(validMovements, gameState) {

		const rand1 = Math.floor(Math.random()*validMovements.length);
		const unitPosition = validMovements[rand1][0];
		const rand2 = Math.floor(Math.random()*validMovements[rand1][1].length);
		const newPosition = validMovements[rand1][1][rand2];
		return [unitPosition, newPosition];
	}

	// activate all possible piece in random sequence with random targets
	activate(validActivations) {
		// return null when there is no valid activation
		if (validActivations.length == 0){
			return null;
		}
		const activations = convertActivations(validActivations);
		const rand1 = Math.floor(Math.random()*activations.length);
		return activations[rand1];
	}

	// randomly choose an empty space to place the new tile
	build(emptySpaces) {
		const rand = Math.floor(Math.random()*emptySpaces.length);
		return emptySpaces[rand];
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


module.exports.AI_Random = AI_Random;
module.exports.AI_DFS = AI_DFS;
module.exports.Human = Human;