'use strict'

// abstract class for features, specific features extend this class
class Feature {
	constructor() {
		this.score = 0;
	}

	normalisedScore(score) {
		return parseFloat(score - this.minScore)/parseFloat(this.maxScore - this.minScore)
	}
}


class NumberOfEnemy extends Feature {
	constructor() {
		super();
		this.minScore = 0;
		this.maxScore = 6;
	}

	evaluate(gameboard) {
		let count = 0
		const owner = gameboard.owner;
		for (let pair of gameboard.hexagonList) {
			const hexagon = pair[1];
			const unit = hexagon.getUnit();
			if (unit !== null) {
				if (unit.getPlayerID() !== owner) {
					count += 1;
				}
			}
		}
		// console.log(count);
		return this.normalisedScore(count);
	}
}


class MobileEnemy extends Feature {
	constructor() {
		super();
		this.minScore = 0;
		this.maxScore = 6;
	}

	evaluate(gameboard) {
		let count = 0
		const owner = gameboard.owner;
		for (let pair of gameboard.hexagonList) {
			const hexagon = pair[1];
			const unit = hexagon.getUnit();
			if (unit !== null) {
				if (unit.getPlayerID() !== owner) {
					count += 1;
				}
			}
		}
		// console.log(count);
		return this.normalisedScore(count);
	}
}


class NumberOfFrendly extends Feature {
	constructor() {
		super();
		this.minScore = 0;
		this.maxScore = 6;
	}

	evaluate(gameboard) {
		let count = 0
		const owner = gameboard.owner;
		for (let pair of gameboard.hexagonList) {
			const hexagon = pair[1];
			const unit = hexagon.getUnit();
			if (unit !== null) {
				if (unit.getPlayerID() === owner) {
					count += 1;
				}
			}
		}
		// console.log(count);
		return this.normalisedScore(count);
	}
}


class AdjacentEnemy extends Feature {
	constructor() {
		super();
		this.minScore = 0;
		this.maxScore = 12;	// not accurate
	}

	evaluate(gameboard) {
		let count = 0
		const owner = gameboard.owner;
		for (let pair of gameboard.hexagonList) {
			const hexagon = pair[1];
			const unit = hexagon.getUnit();
			if (unit !== null) {
				if (unit.getPlayerID() === owner) {
					count += gameboard.getNeighbouringEnemies(owner, hexagon.ID).length;
				}
			}
		}
		// console.log(count);
		return this.normalisedScore(count);
	}
}


class AdjacentFriendly extends Feature {
	constructor() {
		super();
		this.minScore = 0;
		this.maxScore = 6;
	}

	evaluate(gameboard) {
		let count = 0
		const owner = gameboard.owner;
		const notOwner = 'not'+owner;
		for (let pair of gameboard.hexagonList) {
			const hexagon = pair[1];
			const unit = hexagon.getUnit();
			if (unit !== null) {
				if (unit.getPlayerID() === notOwner) {
					count += gameboard.getNeighbouringEnemies(notOwner, hexagon.ID).length;
				}
			}
		}
		// console.log(count);
		return this.normalisedScore(count);
	}
}


class UnrootedTargeted extends Feature {
	constructor() {
		super();
		this.minScore = 0;
		this.maxScore = 6;
	}

	evaluate(gameboard) {

	}
}


class AreaControlled extends Feature {
	constructor() {
		super();
		this.minScore = 0;
		this.maxScore = 36;
	}

	evaluate(gameboard) {
		let count = 0
		const owner = gameboard.owner;
		const notOwner = 'not'+owner;
		for (let pair of gameboard.hexagonList) {
			const hexagon = pair[1];
			// console.log(keyToID(pair[0]))
			if (hexagon.isTile && IDToKey(gameboard.tempTileID) !== pair[0]) {
				const friendlyList = gameboard.getNeighbouringEnemies(notOwner, keyToID(pair[0]));
				if (friendlyList.length > 0){
					count += 1
				}
			}
		}
		// console.log(count);
		return this.normalisedScore(count);
	}
}



// Give special advantage for winning move and losing move
class GameStatus extends Feature {
	constructor() {
		super();
	}


}


// [i,j] ==> 'i-j'
function IDToKey(ID) {
	// console.log(ID);
	const i = ID[0];
	const j = ID[1];
	const key = i.toString()+'-'+j.toString();
	return key;
}


// 'i-j' => [i,j]
function keyToID(key) {
	const tokens = key.split('-');
	const i = parseInt(tokens[0]);
	const j = parseInt(tokens[1]);
	return [i, j];
}


const featureList = [new NumberOfEnemy(), new NumberOfFrendly(), new AdjacentEnemy(), new AreaControlled(), new AdjacentFriendly()];
const bestWeight = [-1, 1, -0.5, 0.5, 0.3]

module.exports.featureList = featureList;
module.exports.bestWeight = bestWeight;