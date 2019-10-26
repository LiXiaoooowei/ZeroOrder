'use strict';

var BoardState = require('./boardState');

// Game board and hexagons

// constants for shape of board, see rule.pdf
const BOARD_SHAPE = [[0, 6], [0, 7], [1, 7], [1, 8], [2,8]];
const NUM_COLS = 5;
// place holder for intermeidate steps such as switch
const tempTileID = [100,100]


class GameBoard {
	constructor() {
		this.hexagonList = new Map();
		for(var i = 0; i < NUM_COLS; i++){
			for(var j = BOARD_SHAPE[i][0]; j <= BOARD_SHAPE[i][1]; j++){
				var ID = [i,j];
				this.hexagonList.set(IDTokey(ID), new Hexagon(ID));
			}
		}
		// list of units to be built
		this.pieceToPlace = [];
		// place holder for intermeidate steps such as switch
		this.tempTile = new Hexagon(tempTileID);
		this.tempTile.setAsTile();
		this.hexagonList.set(IDTokey(tempTileID), this.tempTile);
		// keeps record for movements, activations and builds
		this.stepLog = [];
	}

	setWhitePlayer(playerID) {
		this.whitePlayer = playerID;
	}

	getHexagon(ID) {
		return this.hexagonList.get(IDTokey(ID));
	}

	get_hexagon_neighbours(ID) {
		// var IDList = getHexagonNeighbourID(ID);		
		var IDList = this.hexagonList.get(IDTokey(ID)).getNeighbourHexagonID();
		var neighbours = [];
		for (var i = 0; i < IDList.length; i++) {
			neighbours.push(this.hexagonList.get(IDTokey(IDList[i])));
		}
		return neighbours;
	}


	// create an boardstate object for front-end
	generateBoardState(currentPlayer) {
		var boardstate = new BoardState.BoardState(NUM_COLS, BOARD_SHAPE, this.whitePlayer, currentPlayer);
		for (var pair of this.hexagonList) {
			boardstate.setHexagon(keyToID(pair[0]),pair[1]);
		}
		return boardstate;
	}

	//////////////////////////////////////////////////////////////////////////////////////////
	//////////////////////////////////// IRREDUCIBLE STEP ////////////////////////////////////
	//////////////////////////////////////////////////////////////////////////////////////////
	/* Any actual change to gameboard must be executed by one of these functions.
	 * These steps are easily reversible, hence it makes backtracking easy.
	 * They should be treated as private functions.
	 */

	// movement = [ID of starting tile, ID of ending tile]
	move(movement) {
		var firstID = movement[0];
		var secondID = movement[1];
		var firstHexagon =  this.hexagonList.get(IDTokey(firstID));
		var secondHexagon =  this.hexagonList.get(IDTokey(secondID));
		var unit = firstHexagon.getUnit();
		firstHexagon.setUnit(null);
		secondHexagon.setUnit(unit);
		unit.setPosition(secondID);
	}
	// target = ID of target tile
	build(target) {	 	
		var hexagon = this.hexagonList.get(IDTokey(target));
		hexagon.setAsTile();
		hexagon.setTileUnit(this.pieceToPlace.pop());
	}

	// freeze() {

	// }
	// target = ID of tile with defeated unit
	defeat(target) {
	 	const hexagon = this.hexagonList.get(IDTokey(target));
	 	const targetUnit = hexagon.getUnit();
	 	targetUnit.defeat();
	 	hexagon.setUnit(null);
	 	this.pieceToPlace.push(targetUnit);
	}
	// target = ID of the tile with the unit to activate
	activate(target) {
	 	const hexagon = this.hexagonList.get(IDTokey(target));
	 	const targetUnit = hexagon.getUnit();
	 	targetUnit.performAction();
	}

	performStepSequence(stepSequence) {
		for (let idx in stepSequence) {
			const step = stepSequence[idx];
			const stepType = step[0];
			const stepContent = step[1];
			switch(stepType) {
				case 'move':
					this.move(stepContent);
					break;
				case 'build':
					this.build(stepContent);
					break;
				case 'defeat':
					this.defeat(stepContent);
					break;
				case 'activate':
					this.activate(stepContent);
					break;
				default:
					console.log('UNKNOWN stepType IN stepSequence');
					console.log(step);
			}
		}
	}
	//////////////////////////////////////////////////////////////////////////////////////////
	////////////////////////////////////// MOVEMENT //////////////////////////////////////////
	//////////////////////////////////////////////////////////////////////////////////////////
	
	//[[unitPosition, [target positions]],...]
	getAllValidMoves(playerID) {
		var movementList = [];		
		// loop through all hexagons
		for (var pair of this.hexagonList) {
			var key = pair[0];
			var hexagon = pair[1];
			var unit = hexagon.getUnit();
			
			if (unit === null) {
				continue;
			}
			
			// check if the unit is free to move
			if (unit.playerID != playerID || !unit.isFreeToMove()){
				continue;
			}
			// get valid movement of the piece
			var tileID = keyToID(key);
			var targets = this.getTilesToMove(tileID, playerID);
			// console.log(targets)
			if (targets.length > 0) {
				movementList.push([keyToID(key), targets]);
			}
		}
		// console.log(movementList)
		return movementList;
	}
	isValidMove(move, playerID) {
		var startingPos = move[0];
		var endingPos = move[1];
		// check if starting pos has player's piece
		var hexagon = this.getHexagon(startingPos);
		var unit = hexagon.getUnit();
		if (unit === null){
			return false;
		}
		if (unit.getPlayerID() != playerID) {
			return false;
		}
		// check if ending pos is avaliable
		var secHexagon = this.getHexagon(endingPos);
		// console.log(secHexagon.isEmptyTile)
		//!!!!!!!!!!!!!!!!!!!!!
		if (!secHexagon.isEmptyTile) {
			return false;
		}
		return true;
	}
	performMovement(movement) {
		this.move(movement);
		this.stepLog.push(['movement', movement]);
	}
	hasFreeTileToGo(tileID, playerID) {
		var neighbours = getHexagonNeighbourID(tileID);
		for (var i = 0; i < neighbours.length; i++){
			var hexagon = this.getHexagon(neighbours[i]);
			if (hexagon.checkIsEmptyTile()){
				return true;
			}
		}
		return false;
	}
	getTilesToMove(tileID, playerID) {
		var validTiles = [];
		var neighbours = getHexagonNeighbourID(tileID);
		for (var i = 0; i < neighbours.length; i++){
			var hexagon = this.getHexagon(neighbours[i]);
			if (hexagon.checkIsEmptyTile()){
				validTiles.push(hexagon.getID());
			}
		}
		return validTiles;
	}

	//////////////////////////////////////////////////////////////////////////////////////////
	////////////////////////////////////// ACTIVATION ////////////////////////////////////////
	//////////////////////////////////////////////////////////////////////////////////////////
	
	//[['unit_name', unitPosition, [target list]],...]
	getAllValidActivations(playerID) {
		var activationList = [];
		// loop through all hexagons
		for (var pair of this.hexagonList) {
			var key = pair[0];
			var hexagon = pair[1];
			var unit = hexagon.getUnit();
			if (unit === null) {
				continue;
			}
			// check if the unit is free to activate
			if (unit.playerID != playerID || !unit.isFreeToActivate()){
				continue;
			}
			// get valid activations of the piece
			var targets = unit.getActivations(this);
			// console.log(targets)
			if (targets.length > 0) {
				activationList.push([unit.getName(), keyToID(key), targets]);
			}
		}
		return activationList;
	}
	// validate an action
	// activation = [unitPosition, target_info, 'unit_name']
	isValidActivation(activation){
		if (activation === null) {
			return true;
		}
		// console.log(activation)
		// return true;					//This should always returns true!!!!!!!!!!!
		const unitPosition = activation[0];
		const initialHexagon = this.hexagonList.get(IDTokey(unitPosition));
		const unit = initialHexagon.getUnit();
		var target = activation[1];
		// the unit must be free to activate and has not yet activated
		if (!unit.freeToActivate || unit.hasActivated) {
			return false;
		}
		var targetUnit = this.hexagonList.get(IDTokey(target)).getUnit();
		// the unit must be correct type
		if (unit.getName() != activation[2]) {
			return false;
		}
		// target must not be already defeated (to be changed later)
		if (targetUnit.defeated) {
			return false;
		}	
		// target must belong to correct player
		switch (unit.getName()) {
			case 'switch':
				if (targetUnit.getPlayerID() != unit.getPlayerID()){
					return false;
				}
				break;
			default:
				if (targetUnit.getPlayerID() === unit.getPlayerID()){
					return false;
				}
		}	
		switch (unit.getName()) {
			case 'delete':		
				// target must be neighbour of target piece			
				var neighbours = getHexagonNeighbourID(unit.position);
				for (var i = 0; i < neighbours.length; i++) {
					if (IDTokey(neighbours[i]) === IDTokey(targetUnit.getPosition())){
						return true;
					}
				}
				break;
			case 'toss':
				// target must be neighbour of target piece
				var neighbours = getHexagonNeighbourID(unit.position);
				var isNeighbour = false;
				for (var i = 0; i < neighbours.length; i++) {
					if (IDTokey(neighbours[i]) === IDTokey(targetUnit.getPosition())){
						isNeighbour = true;
					}
				}
				if (!isNeighbour) {
					return false;
				}
				// the space behind target must not be an occupied tile
				var nextHex = this.getNextHexInOppDirection(unit.getPosition(), targetUnit.getPosition());
				// the action is valid if the space behind target is out of map
				if (nextHex === null){
					return true;
				}
				// the action is valid if the space behind target is an empty tile
				if (this.getHexagon(nextHex).isEmptyTile) {
					return true;
				}
				break;
			case 'push':
				// target must be neighbour of target piece
				var neighbours = getHexagonNeighbourID(unit.position);
				var isNeighbour = false;
				for (var i = 0; i < neighbours.length; i++) {
					if (IDTokey(neighbours[i]) === IDTokey(targetUnit.getPosition())){
						isNeighbour = true;
					}
				}
				if (!isNeighbour) {
					return false;
				}
				// the space behind target must not be an occupied tile
				var nextHex = this.getNextHexInDirection(unit.getPosition(), targetUnit.getPosition());
				// the action is valid if the space behind target is out of map
				if (nextHex === null){
					return true;
				}
				// the action is valid if the space behind target is an empty tile
				if (this.getHexagon(nextHex).isEmptyTile) {
					return true;
				}
				break;
			case 'switch':
				// target must be player's unit
				var targetUnit = this.hexagonList.get(IDTokey(target)).getUnit();
				if (targetUnit.getPlayerID() === unit.getPlayerID()) {
					return true;
				}
				break;
			default:
				return false;
		}

		return false;
	}
	// execute an action
	performAction(activation) {
		// null activation indicates end of activation phase
		if (activation === null) {
			this.stepLog.push(['activation', []]);
			return;
		}
		const unitPosition = activation[0];
		const initialHexagon = this.hexagonList.get(IDTokey(unitPosition));
		const unit = initialHexagon.getUnit();
		const unitID = unit.getPosition();
		const target = activation[1];
		let stepSequence = [];
		let hexagon = null;
		// set unit as activated
		stepSequence.push(['activate', unitID]);
		switch (unit.getName()) {
			case 'delete':
				stepSequence.push(['defeat', target]);
				break;
			case 'push':
				var targetUnit = this.hexagonList.get(IDTokey(target)).getUnit();
				// set unit as activated
				unit.performAction();
				var hexagons = this.getAllHexInDirection(unit.getPosition(), target);
				// Four possibilities for target:				
				//	[tile, tile, unit, ...]			#1
				//	[tile, tile, not tile, ...]		#2
				//	[tile, tile, ..., tile]			#3
				//	[]								#4
				var offBoardFlag = true;
				var targetDefeated = true;
				// let hexagon = null;
				for (var i = 0; i < hexagons.length; i++) {
					hexagon = this.hexagonList.get(IDTokey(hexagons[i]));
					// #2
					if (!hexagon.checkIsTile()) {
						offBoardFlag = false;
						break;
					}
					// #1
					if (!hexagon.checkIsEmptyTile()) {
						hexagon = this.hexagonList.get(IDTokey(hexagons[i-1]));
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
				break;
			case 'toss':
				var targetUnit = this.hexagonList.get(IDTokey(target)).getUnit();
				// set unit as activated
				unit.performAction();
				var hexagons = this.getAllHexInOppDirection(unit.getPosition(), target);
				// Four possibilities for target:				
				//	[tile, tile, unit, ...]			#1
				//	[tile, tile, not tile, ...]		#2
				//	[tile, tile, ..., tile]			#3
				//	[]								#4
				var offBoardFlag = true;
				var targetDefeated = true;
				for (var i = 0; i < hexagons.length; i++) {
					hexagon = this.hexagonList.get(IDTokey(hexagons[i]));
					// #2
					if (!hexagon.checkIsTile()) {
						offBoardFlag = false;
						break;
					}
					// #1
					if (!hexagon.checkIsEmptyTile()) {
						hexagon = this.hexagonList.get(IDTokey(hexagons[i-1]));
						offBoardFlag = false;
						targetDefeated = false;
						break;
					}
				}
				// if target survives (#1)
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
				break;
			case 'switch':
				// exchange position between 'switch' and target
				const firstPosition = unitID;
				const secondPosition = target;
				stepSequence.push(['move',[firstPosition, tempTileID]]);
				stepSequence.push(['move',[secondPosition, firstPosition]]);
				stepSequence.push(['move',[tempTileID, secondPosition]]);
				break;
			case 'freeze':
				break;
			default:
				console.log('unknown unit activation' + activation);
		}
		// console.log(stepSequence)
		this.performStepSequence(stepSequence);
		this.stepLog.push(['activation', stepSequence]);
	}

	// utility functions for unit activation
	//----------------------------- general functions----------------------------------
	getNeighbouringEnemies(playerID, position){
		var neighbours = this.get_hexagon_neighbours(position);
		// console.log(neighbours)
		var enemyPositions = [];
		for (var i = 0; i < neighbours.length; i++) {
			if (neighbours[i].unit != null && neighbours[i].unit.getPlayerID() != playerID){
				enemyPositions.push(neighbours[i].unit.getPosition());
				// console.log(enemyPositions)
			}
		}
		return enemyPositions;
	}
	getFriendlyUnits(playerID) {
		var friendlyList = [];
		for (var pair of this.hexagonList) {
			var key = pair[0];
			var hexagon = pair[1];
			if (hexagon.checkIsTile() && (!hexagon.checkIsEmptyTile())){
				var unit = hexagon.getUnit();
				if (unit.getPlayerID() === playerID){
					friendlyList.push(unit.getPosition());
				}
			}
		}
		return friendlyList;
	}
	//----------------------------- end of general ----------------------------------
	//----------------------------PUSH and TOSS------------------------------
	getNextHexInDirection(origin, next) {
		//----------to do: validate origin and next are neighbours
		var colChange = next[0]-origin[0];
		var rowChange = next[1]-origin[1];
		var col = next[0];
		var row = next[1];
		col = col + colChange;
		row = row + rowChange;
		var nextPos = [col, row]
		if (isInBoard(nextPos)){
			return nextPos;
		}
		return null;
	}
	getAllHexInDirection(origin, next) {
		//----------to do: validate origin and next are neighbours
		var colChange = next[0]-origin[0];
		var rowChange = next[1]-origin[1];
		var col = next[0];
		var row = next[1];
		var outOfBoard = false;
		var hexagonList = [];
		while (!outOfBoard) {
			col = col + colChange;
			row = row + rowChange;
			var nextPos = [col, row]
			if (isInBoard(nextPos)){
				hexagonList.push(nextPos);
			}
			else {
				outOfBoard = true;
			}
		}
		return hexagonList;
	}
	getNextHexInOppDirection(origin, next) {
		return this.getNextHexInDirection(next, origin);
	}
	getAllHexInOppDirection(origin, next) {
		return this.getAllHexInDirection(next, origin);
	}
	//----------------------------end of PUSH and TOSS------------------------------
		
	

	//////////////////////////////////////////////////////////////////////////////////////////
	/////////////////////////////////////// BUILDING /////////////////////////////////////////
	//////////////////////////////////////////////////////////////////////////////////////////
	
	// check whether building is required for this turn
	needBuilding() {
		return (this.pieceToPlace.length != 0);
	}

	// returns a list of emtpy spaces for building
	getEmptySpaces() {
		var emptySpaces = [];
		for (var pair of this.hexagonList) {
			var key = pair[0];
			var hexagon = pair[1];
			if (!hexagon.checkIsTile()) {
				emptySpaces.push(hexagon.getID());
			}
		}
		return emptySpaces;
	}
	isValidBuilding(target) {
		var hexagon = this.hexagonList.get(IDTokey(target));
		return !hexagon.isTile;
	}
	buildTile(target) {
		this.build(target);
		this.stepLog.push(['building', target])
	}
}


class Hexagon {
	constructor(ID) {
		this.ID = ID;
		this.isTile = false;
		this.unit = null;
		this.isEmptyTile = false;
		if (ID != tempTileID) {
			this.neighbourID = getHexagonNeighbourID(ID);
		}		
		this.tileUnit = null;
		// console.log(ID);
		// console.log(this.neighbourID);
	}
	getNeighbourHexagonID() {
		return this.neighbourID;
	}
	setAsTile() {
		// console.log(this.ID)
		this.isTile = true;
		this.isEmptyTile = true;
	}
	setAsNotTile() {
		this.isTile = false;
		this.isEmptyTile = false;
	}
	getUnit() {
		return this.unit;
	}
	setUnit(unit) {
		// check if the current hexagon is a tile
		if (!this.isTile) {
			return false;
		}
		this.unit = unit;
		// updata tile status
		if (unit === null) {
			this.isEmptyTile = true;
		}
		else {
			this.isEmptyTile = false;
		}
	}
	checkIsEmptyTile() {
		return this.isEmptyTile;
	}
	checkIsTile() {
		return this.isTile;
	}
	getID() {
		return this.ID;
	}
	setTileUnit(unit) {
		this.tileUnit = unit;
	}
	getTileUnit() {
		return this.tileUnit;
	}
}


// returns a list of ID of nighbouring hexagons
function getHexagonNeighbourID(ID){
	var col = ID[0];
	var row = ID[1];
	var neighbours = [];
	// check up-down
	if (BOARD_SHAPE[col][0] < row){
		neighbours.push([col, row-1]);
	}
	if (BOARD_SHAPE[col][1] > row){
		neighbours.push([col, row+1]);
	}
	// check left
	if (col > 0){
		if (BOARD_SHAPE[col-1][0] < row){
			neighbours.push([col-1, row-1]);
		}
		if (BOARD_SHAPE[col-1][1] >= row){
			neighbours.push([col-1, row]);
		}
	}
	// check right
	if (col < NUM_COLS-1) {
		if (BOARD_SHAPE[col+1][0] <= row){
			neighbours.push([col+1, row]);
		}
		if (BOARD_SHAPE[col+1][1] > row){
			neighbours.push([col+1, row+1]);
		}
	}
	return neighbours;
}

// check if [i,j] is in game board
function isInBoard(ID) {
	var i = ID[0];
	var j = ID[1];
	if (i < 0 || i >= NUM_COLS){
		return false;
	}
	if (j < BOARD_SHAPE[i][0] || j > BOARD_SHAPE[i][1]){
		return false;
	}
	return true;
}

// [i,j] ==> 'i-j'
function IDTokey(ID) {
	// console.log(ID);
	var i = ID[0];
	var j = ID[1];
	var key = i.toString()+'-'+j.toString();
	return key;
}

// 'i-j' => [i,j]
function keyToID(key) {
	var tokens = key.split('-');
	var i = parseInt(tokens[0]);
	var j = parseInt(tokens[1]);
	return [i, j];
}


// module.exports.Hexagon = Hexagon;
module.exports.GameBoard = GameBoard;
// module.exports. GameBoard.getHexagonNeighbourID =  getHexagonNeighbourID;