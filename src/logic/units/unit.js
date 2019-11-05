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


// [i,j] ==> 'i-j'
function IDTokey(ID) {
	// console.log(ID);
	const i = ID[0];
	const j = ID[1];
	const key = i.toString()+'-'+j.toString();
	return key;
}

module.exports.Unit = Unit;