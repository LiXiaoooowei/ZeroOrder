'use strict';

const unit = require('./unit');

class Switch extends unit.Unit {
	constructor(playerID) {
		super(playerID);
		this.name = 'switch';
	}

	getActivations(gameBoard){
		const friendlyUnits = gameBoard.getFriendlyUnits(this.playerID);
		let validTargets = [];
		for (let i = 0; i < friendlyUnits.length; i++) {
			const unit = gameBoard.getHexagon(friendlyUnits[i]).getUnit();
			if (!unit.defeated && unit.getName() != 'switch') {
				validTargets.push(unit.getPosition());
			}
		}
		return validTargets;
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
		if (targetUnit.getPlayerID() != this.playerID){
			console.log('invalid activation: target belongs to wrong player!!');
			console.log(activation);
			return false;
		}
		return true;
	}

	activate(gameBoard, activation){
		let stepSequence = [];
		// set unit as activated, it is important to not directly change this.isActivated,
		// so that the step can be backtracked
		stepSequence.push(['activate', this.position]);
		// exchange position between 'switch' and target	
		const firstPosition = this.position;
		const secondPosition = activation[1];
		const tempTileID = gameBoard.tempTileID;
		stepSequence.push(['move',[firstPosition, tempTileID]]);
		stepSequence.push(['move',[secondPosition, firstPosition]]);
		stepSequence.push(['move',[tempTileID, secondPosition]]);

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

module.exports.Switch = Switch;