'use strict';

const unit = require('./unit');

class Toss extends unit.Unit {
		constructor(playerID) {
		super(playerID);
		this.name = 'toss';
	}

	getActivations(gameBoard){
		const neighbouringEnemies = gameBoard.getNeighbouringEnemies(this.playerID, this.position);
		const validTargets = [];
		for (let i = 0; i < neighbouringEnemies.length; i++) {
			const enemyPos = neighbouringEnemies[i];
			const targetID = gameBoard.getNextHexInOppDirection(this.position, enemyPos);
			// the action is valid if the space behind target is out of map
			if (targetID === null){
				validTargets.push(enemyPos);
			}
			// the action is valid if the space behind target is an empty tile
			else if (gameBoard.getHexagon(targetID).isEmptyTile) {
				validTargets.push(enemyPos);
			}
			// (the action is not valid if the space behind target is an occupied tile)
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
		if (targetUnit.getPlayerID() === this.playerID){
			console.log('invalid activation: target belongs to wrong player!!');
			console.log(activation);
			return false;
		}
		// target must be neighbour of target piece
		const neighbours = gameBoard.getHexagonNeighbourID(this.position);
		let isNeighbour = false;
		for (let i = 0; i < neighbours.length; i++) {
			if (IDTokey(neighbours[i]) === IDTokey(targetUnit.getPosition())){
				isNeighbour = true;
			}
		}
		if (!isNeighbour) {
			console.log('invalid activation: target is not neighbour of unit!!');
			console.log(activation);
			return false;
		}
		// the space behind target must not be an occupied tile
		const nextHex = gameBoard.getNextHexInOppDirection(this.position, target);
		// the action is valid if the space behind target is out of map
		if (nextHex === null){
			return true;
		}
		// the action is valid if the space behind target is an empty tile
		if (gameBoard.getHexagon(nextHex).isEmptyTile) {
			return true;
		}
		console.log('invalid activation: unit opp to target!!');
		console.log(activation);
		return false;
	}

	activate(gameBoard, activation){
		let stepSequence = [];
		// set unit as activated, it is important to not directly change this.isActivated,
		// so that the step can be backtracked
		stepSequence.push(['activate', this.position]);

		const target = activation[1];
		const hexagons = gameBoard.getAllHexInOppDirection(this.getPosition(), target);
		// Four possibilities for target:				
		//	[tile, tile, unit, ...]			#1
		//	[tile, tile, not tile, ...]		#2
		//	[tile, tile, ..., tile]			#3
		//	[]								#4
		let offBoardFlag = true;
		let targetDefeated = true;
		let hexagon = null;
		for (let i = 0; i < hexagons.length; i++) {
			hexagon = gameBoard.getHexagon(hexagons[i]);
			// #2
			if (!hexagon.checkIsTile()) {
				offBoardFlag = false;
				break;
			}
			// #1
			if (!hexagon.checkIsEmptyTile()) {
				hexagon = gameBoard.getHexagon(hexagons[i-1]);
				offBoardFlag = false;
				targetDefeated = false;
				break;
			}
		}
		// if target sruvives (#1)
		if (!targetDefeated) {
			stepSequence.push(['move', [target, hexagon.getID()]]);
		}
		// if target is defeated but not off map (#2)
		else if(!offBoardFlag){
			stepSequence.push(['defeat', target]);
			stepSequence.push(['build', hexagon.getID()]);
		}
		// target is defeated and off map (#3 and #4)
		else {
			stepSequence.push(['defeat', target]);
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

module.exports.Toss = Toss;