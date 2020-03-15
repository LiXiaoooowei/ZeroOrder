'use strict';

const unit = require('./unit');

class Delete extends unit.Unit {
	constructor(playerID) {
		super(playerID);
		this.name = 'delete';
	}

	getActivations(gameBoard){
		return gameBoard.getNeighbouringEnemies(this.playerID, this.position);
	}

	isValidActivation(gameBoard, activation){
		const target = activation[1];
		const targetUnit = gameBoard.getHexagon(target).getUnit();
		// target must not be already defeated
		if (targetUnit.defeated) {
			console.log('invalid activation: unit is already defeated!!');
			console.log(activation);
			return false;
		}	
		// target must belong to correct player
		if (targetUnit.getPlayerID() === this.playerID){
			console.log('invalid activation: target belongs to wrong player!!');
			console.log(activation);
			return false;
		}
		// target unit must be a neighbour of this unit
		const neighbours = gameBoard.getHexagonNeighbourID(this.position);		
		// console.log(targetUnit)
		for (let i = 0; i < neighbours.length; i++) {
			if (IDTokey(neighbours[i]) === IDTokey(targetUnit.getPosition())){
				return true;
			}
		}
		console.log('invalid activation: target is not neighbour of unit!!');
		console.log(activation);
		return false;
	}

	activate(gameBoard, activation){
		let stepSequence = [];
		// set unit as activated, it is important to not directly change this.isActivated,
		// so that the step can be backtracked
		stepSequence.push(['activate', this.position]);
		// defeat the target unit
		const target = activation[1];
		const targetUnit = gameBoard.getHexagon(target).getUnit();
		const updateSequence = targetUnit.updateInfluence(gameBoard);
		stepSequence = stepSequence.concat(updateSequence);
		stepSequence.push(['defeat', target]);

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

module.exports.Delete = Delete;