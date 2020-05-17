'use strict';

const unit = require('./unit');

class Freeze extends unit.Unit {
	constructor(playerID) {
		super(playerID);
		this.name = 'freeze';
	}

	getActivations(gameBoard){
		let validTargets = [];
		const neighbouringEnemies = gameBoard.getNeighbouringEnemies(this.playerID, this.position);
		for (let i = 0; i < neighbouringEnemies.length; i++){
			let neighbour = gameBoard.getHexagon(neighbouringEnemies[i]).getUnit();
			if (neighbour.isFreeToMove()){
				validTargets.push(neighbouringEnemies[i]);
			}
		}
		if (validTargets.length>0){
			return [validTargets];	// it is important to warp in array so that it is treated as one option
		}
		else {
			return [];
		}
	}

	isValidActivation(gameBoard, activation){
		const targetList = activation[1];
		const neighbouringEnemies = gameBoard.getNeighbouringEnemies(this.playerID, this.position);

		// targetList should be the same as neighbouringEnemies
		if (targetList.length !== neighbouringEnemies.length){
			console.log('invalid activation: targetUnit.length != neighbouringEnemies.length!!');
			console.log(activation);
			console.log(targetList);
			console.log(neighbouringEnemies);
			return false;
		}
		for (let i = 0; i < targetList.length; i++){
			// target must match with one of neighbouring enemies
			let flag = false;
			for (let j = 0; j < neighbouringEnemies.length; j++){
				if ((targetList[i][0] === neighbouringEnemies[j][0]) && (targetList[i][1] === neighbouringEnemies[j][1])){
					flag = true;
					break;
				}
			}
			if (flag === false){
				console.log('invalid activation: target mismatch with neighbouringEnemies!!');
				console.log(activation);
				console.log(neighbouringEnemies);
				return false;
			}
			// target must be mobile
			let neighbour = gameBoard.getHexagon(targetList[i]).getUnit();
			if (!neighbour.isFreeToMove()){
				console.log('invalid activation: try to freeze an immobile piece!!');
				console.log(targetList[i]);
				return false;
			}
		}

		return true;
	}

	activate(gameBoard, activation){
		let stepSequence = [];
		// set unit as activated, it is important to not directly change this.isActivated,
		// so that the step can be backtracked
		stepSequence.push(['activate', this.position]);
		// if the target unit is mobile, freeze the unit
		const targets = activation[1];
		for (let i = 0; i < targets.length; i++) {
			stepSequence.push(['mobility',targets[i], 'freeze', null]);
		}
		
		return stepSequence;
	}
	
	updateInfluence(gameBoard){
		let stepSequence = [];
		const neighbouringEnemies = gameBoard.getNeighbouringEnemies(this.playerID, this.position);
		for (let i = 0; i < neighbouringEnemies.length; i++){
			let neighbour = gameBoard.getHexagon(neighbouringEnemies[i]).getUnit();
			if (neighbour.getImmobileStatus() === 'freeze'){
				stepSequence.push(['mobility',neighbour.getPosition(), null, 'freeze']);
				// console.log(['mobility',neighbour.getPosition(), null, 'freeze']);
			}
		}
		return stepSequence;
	}
}

// [i,j] ==> 'i-j'
function IDTokey(ID) {
	// console.log(ID);
	const i = ID[0];
	const j = ID[1];
	const key = i.toString()+'-'+j.toString();
	return key;
}

module.exports.Freeze = Freeze;