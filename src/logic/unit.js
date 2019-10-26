'use strict';

// super class for all units
class Unit {
	constructor(playerID) {
		this.playerID = playerID;
		this.hasActivated = false;
		this.freeToActivate = true;
		this.name = 'unit';
		this.position = null;
		this.defeated = false;
		this.isMobile = true;
	}

	// setBoardPosition(position) {
	// 	this.position = position;
	// }

	getBoardPosition() {
		return this.position;
	}
	
	getName() {
		return this.name;
	}

	getPlayerID() {
		return this.playerID;
	}

	getPosition() {
		return this.position;
	}

	setPosition(position) {
		this.position = position;
	}

	getMobileStatus() {
		return this.isMobile;
	}
	isFreeToActivate() {
		return (this.isFreeToActivate && !this.hasActivated && !this.defeated);
	}
	// mark a unit as defeated
	defeat() {
		this.defeated = true;
		// this.isMobile = false;
		// this.freeToActivate = false;
		// this.position = null;
	}
	revive() {
		this.defeated = false;
	}
	performAction() {
		this.hasActivated = true;
	}
	// reset at the end of turn
	
	resetActivation() {
		this.hasActivated = false;
	}
	isFreeToMove() {
		return this.isMobile;
	}
	can_activate(gameBoard) {
		if (!this.freeToActivate || this.defeated) {
			return false;
		}
		return true
	}
}


class Delete extends Unit {
	constructor(playerID) {
		super(playerID);
		this.name = 'delete';
	}

	
	delete_any(gameBoard){
		const hexagonList = gameBoard.get_hexagon_neighbours(this.position);
		const target = hexagonList[0].getID()
		return target;

	}
	getActivations(gameBoard){
		return gameBoard.getNeighbouringEnemies(this.playerID, this.position);
	}

	
}

class Push extends Unit {
	constructor(playerID) {
		super(playerID);
		this.name = 'push';
	}

	getActivations(gameBoard){
		const neighbouringEnemies = gameBoard.getNeighbouringEnemies(this.playerID, this.position);
		let validTargets = [];
		for (let i = 0; i < neighbouringEnemies.length; i++) {
			const enemyPos = neighbouringEnemies[i];
			const targetID = gameBoard.getNextHexInDirection(this.position, enemyPos);
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
}

class Toss extends Unit {
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
}

class Switch extends Unit {
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
}

module.exports.Delete = Delete;
module.exports.Push = Push;
module.exports.Toss = Toss;
module.exports.Switch = Switch;