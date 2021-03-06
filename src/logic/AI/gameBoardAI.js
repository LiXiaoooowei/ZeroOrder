'use strict';

const Gameboard = require('./../gameBoard');
const UnitList = require('./../units/unitList');
const Constants = require('./../constants');

/*	This class is used by AI player to simulate game board for planning purpose
	The key difference is that this class allows the player to backtrack steps 
	performed in the current turn.
*/

const CONSTANT = Constants.Constants;

class GameBoardAI extends Gameboard.GameBoard {

	constructor(boardState, playerName) {
		super();		
		if (boardState != null) {
			this.setupGameBoard(boardState, playerName);
		}
		this.turnStatus = 'movement';
	}

	//////////////////////////////////////////////////////////////////////////////////////////
	////////////////////////////////////// BOARDSTATE ////////////////////////////////////////
	//////////////////////////////////////////////////////////////////////////////////////////

	// initialise gameboard from boardstate
	// ASSUMPTION: boardState is at PENDING_MOVE!!!
	setupGameBoard(boardState, playerName) {
		// set white player
		this.setWhitePlayer(boardState.whitePlayer);
		this.owner = playerName;
		// determine current player colour
		let currentPlayer = boardState.currentPlayer;
		// const currentPlayerColour = ;
		let currentPlayerColour = '??'
		if (boardState.whitePlayer === currentPlayer){
			currentPlayerColour = 'white';
		}
		else {
			currentPlayerColour = 'black';
		}
		// set name for the other player
		currentPlayer = playerName;
		// console.log(currentPlayer)
		const otherPlayer = 'not'+currentPlayer;
		// set units and tiles
		let unitList = [];
		const numCol = boardState.numCol;
		for (let i = 0; i < numCol; i++) {
			for (let j = boardState.boardShape[i][0]; j <= boardState.boardShape[i][1]; j++) {
				const tileStatus = boardState.boardMatrix[i][j];
				const unitIdx = tileStatus[0];
				const unitStatus = tileStatus[1];
				// skip if there is no unit at this position
				if (unitIdx === CONSTANT.UNIT_CODE.EMPTY_SPACE) {
					continue;
				}
				// set the position as empty tile
				else if (unitIdx === CONSTANT.UNIT_CODE.EMPTY_TILE) {
					const tilePosition = [i, j];
					const hexagon = this.hexagonList.get(IDToKey(tilePosition));
					hexagon.setAsTile();
					continue;
				}
				let newUnit = null;
				// determine which player the unit is belonged to
				let unitOwner = currentPlayer;
				if ((currentPlayerColour === 'white' && unitIdx < 18) ||
					(currentPlayerColour === 'black' && unitIdx >= 18)) {
					unitOwner = otherPlayer;
				}
				// console.log(currentPlayer, unitOwner, currentPlayerColour, unitIdx, i, j)
				let listIdx = unitIdx;
				if (unitIdx > 18) {
					listIdx -= 18;
				}
				listIdx -= 1;
				newUnit = new UnitList.unitList[UnitList.unitNameArray[listIdx]](unitOwner);

				const tilePosition = [i, j]
				const hexagon = this.hexagonList.get(IDToKey(tilePosition));
				hexagon.setAsTile();
				newUnit.setPosition(tilePosition);
				newUnit.setImmobileStatus(unitStatus);
				hexagon.setUnit(newUnit);
			}
		}
	}

	// restructured the array returned to make DFS easier
	getAllValidMoves(player_id) {
		const movements = super.getAllValidMoves(player_id);
		// console.log(movements);
		let choices = [];
		for (let i = 0; i < movements.length; i++) {
			const starting = movements[i][0];
			for (let j = 0; j < movements[i][1].length; j++) {
				const ending = movements[i][1][j];
				choices.push([starting, ending]);
			}
		}
		return choices;
	}

	getAllValidActivations(player_id) {
		const activations = super.getAllValidActivations(player_id);		
		return convertActivations(activations);
	}

	getEmptySpaces() {
		if (this.pieceToPlace.length === 0) {
			return [null];
		}
		else {
			return super.getEmptySpaces();
		}
	}

	buildTile(target) {
		if (target === null) {
			this.stepLog.push(['building', []]);
		}
		else {
			super.buildTile(target);
		}
	}
	//////////////////////////////////////////////////////////////////////////////////////////
	//////////////////////////////////// IRREDUCIBLE STEP ////////////////////////////////////
	//////////////////////////////////////////////////////////////////////////////////////////
	// movement = [ID of starting tile, ID of ending tile]
	reverseMove(movement) {
		const firstID = movement[1];
		const secondID = movement[0];
		const firstHexagon =  this.hexagonList.get(IDToKey(firstID));
		const secondHexagon =  this.hexagonList.get(IDToKey(secondID));
		const unit = firstHexagon.getUnit();
		firstHexagon.setUnit(null);
		secondHexagon.setUnit(unit);
		unit.setPosition(secondID);
	}
	// target = ID of target tile
	reverseBuild(target) {	 
		if (target === null) {
			return;
		}	
		const hexagon = this.hexagonList.get(IDToKey(target));
		const unit = hexagon.getTileUnit();
		hexagon.setAsNotTile();
		hexagon.setTileUnit(null);
		this.pieceToPlace.push(unit);
	}

	// freeze() {

	// }
	// target = ID of tile with defeated unit
	reverseDefeat(target) {
	 	const hexagon = this.hexagonList.get(IDToKey(target));
	 	const targetUnit = this.pieceToPlace.pop();
	 	targetUnit.revive();
	 	hexagon.setUnit(targetUnit);
	}
	// target = ID of the tile with the unit to activate
	reverseActivate(target) {
	 	const hexagon = this.hexagonList.get(IDToKey(target));
	 	const targetUnit = hexagon.getUnit();
	 	targetUnit.resetActivation();
	}

	reverseMobility(step)  {
		const targetID = step[1];
		const objectiveStatus = step[3];
		const hexagon = this.hexagonList.get(IDToKey(targetID));
	 	const targetUnit = hexagon.getUnit();
	 	targetUnit.setImmobileStatus(objectiveStatus);
		// switch(objectiveStatus){
		// 	case null:
		// 		targetUnit.freeToActivate = true;
		// 		break;
		// 	case 'freeze':
		// 		targetUnit.freeToActivate = false;
		// 		break;
		// 	default:
		// 		console.log('invalid change in mobility statue: unknown status!!!');
		// 		console.log(step);
		// }
	}

	// reverse steps performed in one activation
	reverseStepSequence(stepSequence) {
		stepSequence.reverse();
		for (let idx in stepSequence) {
			const step = stepSequence[idx];
			const stepType = step[0];
			const stepContent = step[1];
			switch(stepType) {
				case 'move':
					this.reverseMove(stepContent);
					break;
				case 'build':
					this.reverseBuild(stepContent);
					break;
				case 'defeat':
					this.reverseDefeat(stepContent);
					break;
				case 'activate':
					this.reverseActivate(stepContent);
					break;
				case 'mobility':
					this.reverseMobility(step);
					break;
				default:
					console.log('UNKNOWN stepType IN stepSequence');
					console.log(step);
			}
		}
	}

	// backtrack one step in the current turn
	backtrack() {
		const lastStep = this.stepLog.pop();
		const stepType = lastStep[0];
		const stepContent = lastStep[1];
		// console.log(lastStep)
		this.reverseStepSequence(stepContent);
		// switch (stepType) {
		// 	case 'movement':
		// 		this.reverseMove(stepContent);
		// 		break;
		// 	case 'activation':
		// 		this.reverseStepSequence(stepContent);
		// 		break;
		// 	case 'building':
		// 		this.reverseBuild(stepContent);
		// 		break;
		// 	default:
		// 		console.log('unregonised step type in backtracking' + stepType);
		// }
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
function key_to_ID(key) {
	const tokens = key.split('-');
	const i = parseInt(tokens[0]);
	const j = parseInt(tokens[1]);
	return [i, j];
}


function getUnitActivationDimension(unitName) {
	// TO-DO: make action dimension as an attribute for unit class
	switch(unitName){
		case 'twist':
			return 2;
		
		default:
			return 1;
	}
}


function convertActivations(activations) {
		let choices = [null];	// null -> skip activation
		for (let i = 0; i < activations.length; i++) {
			const unitName = activations[i][0];
			const unitPosition = activations[i][1];
			
			// TO-DO: make this into recursion
			const unitActivationDimension = getUnitActivationDimension(unitName);
			if (unitActivationDimension === 1) {
				for (let j = 0; j < activations[i][2].length; j++) {
					const target = activations[i][2][j];
					choices.push([unitPosition, target, unitName]);
				}
			}
			else if (unitActivationDimension === 2) {
				for (let j = 0; j < activations[i][2].length; j++) {
					const activation = activations[i][2][j];
					const first = activation[0];
					for (let k = 0; k < activation[1].length; k++) {
						const target = activation[1][k];
						choices.push([unitPosition, first, target, unitName]);
					}
				}
			}
			else {
				console.log('WRONG UNIT dimension');
				console.log(activations[i]);
			}
			
		}
		return choices;
	}


module.exports.GameBoardAI = GameBoardAI;
module.exports.convertActivations = convertActivations;