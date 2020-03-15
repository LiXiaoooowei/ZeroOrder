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
		this.immobileStatus = null;
	}

	// setBoardPosition(position) {
	// 	this.position = position;
	// }

	//////////////////////////// basic info ///////////////////////////////////
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
	
	/////////////////////////// defeat /////////////////////////////////////////
	// mark a unit as defeated
	defeat(gameBoard) {
		this.defeated = true;
		// this.isMobile = false;
		// this.freeToActivate = false;
		// this.position = null;
	}
	
	revive() {
		this.defeated = false;
	}
	////////////////////////// activate ///////////////////////////////////////
	isFreeToActivate() {
		return (this.freeToActivate && (!this.hasActivated) && (!this.defeated));
	}
	performAction() {
		this.hasActivated = true;
	}
	// reset at the end of turn	
	resetActivation() {
		this.hasActivated = false;
	}
	
	can_activate(gameBoard) {
		if (!this.freeToActivate || this.defeated) {
			return false;
		}
		return true
	}
	////////////////////////// movement ///////////////////////////////////
	isFreeToMove() {
		return this.isMobile;
	}	
	getImmobileStatus() {
		return this.immobileStatus;
	}
	setImmobileStatus(status) {
		if (status === null){
			this.isMobile = true;
			this.freeToActivate = true;
		}
		else {
			this.isMobile = false;
			this.freeToActivate = false
		}
		this.immobileStatus = status;
	}
	////////////////////////////////////////////////////////////////////////
	// do nothing by default, overwritten in some pieces(e.g. freeze)
	updateInfluence(gameBoard) {
		return [];
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