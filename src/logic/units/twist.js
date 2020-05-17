'use strict';

const unit = require('./unit');

class Twist extends unit.Unit {
	constructor(playerID) {
		super(playerID);
		this.name = 'twist';
	}

	getActivations(gameBoard){
		let activations = [];
		const neighbouringEnemies = gameBoard.getNeighbouringEnemies(this.playerID, this.position);
		for (let i = 0; i < neighbouringEnemies.length; i++) {
			const enemyPosition = neighbouringEnemies[i];
			let unitActivation = [];
			// TO-DO: simplify this covoluted loop
			// check left
			let leftList = gameBoard.getAllHexInClockwise(this.position,enemyPosition, 'anti-clockwise');
			// console.log(leftList);
			let flagArray = [false, false, false, false, false];
			for (let j = 0; j < 5; j++) {
				// break condition 1: position off-board
				if (!gameBoard.isInBoard(leftList[j])){
					unitActivation.push([leftList[j], 'anti-clockwise']);
					flagArray[j] = true;
					break;
				}
				else {
					const hexagon = gameBoard.getHexagon(leftList[j]);
					// break condition 2: hexagon is not tile
					if (!hexagon.checkIsTile()) {
						unitActivation.push([leftList[j], 'anti-clockwise']);
						flagArray[j] = true;
						break;
					}
					// break condition 3: hexagon is occupied
					else if (!hexagon.checkIsEmptyTile()){
						break;
					}
					else {
						unitActivation.push([leftList[j], 'anti-clockwise']);
						flagArray[j] = true;
					}
				}
				
			}
			// check right
			let rightList = gameBoard.getAllHexInClockwise(this.position,enemyPosition, 'clockwise');
			// console.log(rightList);
			for (let j = 0; j < 5; j++) {
				// break condition 1: position off-board
				if (!gameBoard.isInBoard(rightList[j])){
					if (!flagArray[4-j]){
						unitActivation.push([rightList[j], 'clockwise']);
					}					
					break;
				}
				else {
					const hexagon = gameBoard.getHexagon(rightList[j]);
					// break condition 2: hexagon is not tile
					if (!hexagon.checkIsTile()) {
						if (!flagArray[4-j]){
							unitActivation.push([rightList[j], 'clockwise']);
						}
						break;
					}
					// break condition 3: hexagon is occupied
					else if (!hexagon.checkIsEmptyTile()){
						break;
					}
					else {
						if (!flagArray[4-j]){
							unitActivation.push([rightList[j], 'clockwise']);
						}
					}
				}
				
			}
			// if valid space exists, add to activations
			if (unitActivation.length > 0){
				activations.push([enemyPosition,unitActivation]);
			}
		}
		// console.log(activations);
		return activations;
	}

	isValidActivation(gameBoard, activation){ 
		// console.log(activation)
		const target = activation[1];
		const finalPosition = activation[2][0];
		const direction = activation[2][1];
		if (!gameBoard.isInBoard(target)) {
			console.log('invalid activation: target is off board');
			console.log(target);
			return false;
		}
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
		let flag = false
		for (let i = 0; i < neighbours.length; i++) {
			if (IDTokey(neighbours[i]) === IDTokey(targetUnit.getPosition())){
				flag = true;
				break;
			}
		}
		if (flag === false){
			console.log('invalid activation: target is not neighbour of unit!!');
			console.log(activation);
			return false;
		}
		// final position must be at distance 1 to this unit
		// const distance = gameBoard.getDistance(this.position, finalPosition);
		// if (distance !== 1){
		// 	console.log('invalid activation: finalPosition is too far from the unit!!');
		// 	console.log(activation);
		// 	return false;
		// }
		// there must be a empty arc from target to final position
		const arcArray = gameBoard.getAllHexInClockwise(this.position, target, direction);
		flag = false;
		for (let i = 0; i < arcArray.length; i++) {
			if (IDTokey(arcArray[i])===IDTokey(finalPosition)){
				flag = true;
				break;
			}
		}
		if (flag === false){
			console.log('invalid activation: no valid path from enemy unit to final position!!');
			console.log(activation);
			return false;
		}
		// if final position is not in board, return true
		if (!gameBoard.isInBoard(finalPosition)){
			return true;
		}
		// final position must be empty or not a tile
		const hexagon = gameBoard.getHexagon(finalPosition);
		if (hexagon.getUnit()!==null){
			console.log('invalid activation: final position is occupied by another unit!!');
			console.log(activation);
			console.log(hexagon.getUnit());
			return false;
		}
		
		return true;
	}

	activate(gameBoard, activation){
		// console.log(activation)
		let stepSequence = [];
		// set unit as activated, it is important to not directly change this.isActivated,
		// so that the step can be backtracked
		stepSequence.push(['activate', this.position]);
		
		const target = activation[1];
		const finalPosition = activation[2][0];
		const direction = activation[2][1];
		const targetUnit = gameBoard.getHexagon(target).getUnit();
		const updateSequence = targetUnit.updateInfluence(gameBoard);
		stepSequence = stepSequence.concat(updateSequence);

		// defeat the unit if it is pushed off the board	
		if (!gameBoard.isInBoard(finalPosition)) {
			stepSequence.push(['defeat', target]);
		}
		else {
			const hexagon = gameBoard.getHexagon(finalPosition);
			// defeat the unit if it is pushed to empty hexagon
			if (!hexagon.checkIsTile()){
				stepSequence.push(['defeat', target]);
				stepSequence.push(['build', finalPosition]);
			}
			// otherwise, move the target unit
			else {
				stepSequence.push(['move', [target, finalPosition]]);
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

module.exports.Twist = Twist;