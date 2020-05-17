'use strict';

const BoardState = require('./boardState');
const Constants = require('./constants');
// Game board and hexagons

const CONSTANT = Constants.Constants;

// TO-DO?: bind unit.updateInfluence() with unit.setPosition and unit.defeat?
// 			as of now updateInfluence is triggered by gameBoard.performMovement(), and various unit.activate()
class GameBoard {
	constructor() {
		this.hexagonList = new Map();
		for(let i = 0; i < CONSTANT.NUM_COLS; i++){
			for(let j = CONSTANT.BOARD_SHAPE[i][0]; j <= CONSTANT.BOARD_SHAPE[i][1]; j++){
				const ID = [i,j];
				this.hexagonList.set(IDToKey(ID), new Hexagon(ID));
			}
		}
		// list of units to be built
		this.pieceToPlace = [];
		// place holder for intermeidate steps such as switch
		this.tempTileID = CONSTANT.tempTileID;
		this.tempTile = new Hexagon(this.tempTileID);
		this.tempTile.setAsTile();
		this.hexagonList.set(IDToKey(this.tempTileID), this.tempTile);
		// keeps record for movements, activations and builds
		this.stepLog = [];
	}

	setWhitePlayer(playerID) {
		this.whitePlayer = playerID;
	}

	getHexagon(ID) {
		return this.hexagonList.get(IDToKey(ID));
	}

	getHexagonNeighbourID(ID) {
		const IDList = this.hexagonList.get(IDToKey(ID)).getNeighbourHexagonID();
		return IDList;
	}

	getHexagonNeighbours(ID) {
		// var IDList = getHexagonNeighbourID(ID);		
		const IDList = this.hexagonList.get(IDToKey(ID)).getNeighbourHexagonID();
		const neighbours = [];
		for (let i = 0; i < IDList.length; i++) {
			neighbours.push(this.hexagonList.get(IDToKey(IDList[i])));
		}
		return neighbours;
	}


	// create an boardstate object for front-end
	generateBoardState(currentPlayer) {
		const boardstate = new BoardState.BoardState(CONSTANT.NUM_COLS, CONSTANT.BOARD_SHAPE, this.whitePlayer, currentPlayer);
		for (let pair of this.hexagonList) {
			boardstate.setHexagon(keyToID(pair[0]),pair[1]);
		}
		return boardstate;
	}

	//////////////////////////////////////////////////////////////////////////////////////////
	//////////////////////////////////// IRREDUCIBLE STEP ////////////////////////////////////
	//////////////////////////////////////////////////////////////////////////////////////////
	/* Any actual change to gameboard must be executed by one of these functions.
	 * These steps are easily reversible, hence it makes backtracking possible.
	 * They should be treated as private functions.
	 */
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
				case 'mobility':
					this.mobility(step);
					break;
				default:
					console.log('UNKNOWN stepType IN stepSequence');
					console.log(step);
			}
		}
	}
	// movement = [ID of starting tile, ID of ending tile]
	move(movement) {
		const firstID = movement[0];
		const secondID = movement[1];
		const firstHexagon =  this.hexagonList.get(IDToKey(firstID));
		const secondHexagon =  this.hexagonList.get(IDToKey(secondID));
		const unit = firstHexagon.getUnit();
		firstHexagon.setUnit(null);
		secondHexagon.setUnit(unit);
		unit.setPosition(secondID);
	}
	// target = ID of target tile
	build(target) {	 	
		const hexagon = this.hexagonList.get(IDToKey(target));
		hexagon.setAsTile();
		hexagon.setTileUnit(this.pieceToPlace.pop());
	}

	// target = ID of tile with defeated unit
	defeat(target) {
	 	const hexagon = this.hexagonList.get(IDToKey(target));
	 	const targetUnit = hexagon.getUnit();
	 	targetUnit.defeat();
	 	hexagon.setUnit(null);
	 	this.pieceToPlace.push(targetUnit);
	}
	// target = ID of the tile with the unit to activate
	activate(target) {
	 	const hexagon = this.hexagonList.get(IDToKey(target));
	 	const targetUnit = hexagon.getUnit();
	 	targetUnit.performAction();
	}
	// step[1] = targetID, step[2] = objective status
	mobility(step)  {
		const targetID = step[1];
		const objectiveStatus = step[2];
		const hexagon = this.hexagonList.get(IDToKey(targetID));
	 	const targetUnit = hexagon.getUnit();
		targetUnit.setImmobileStatus(objectiveStatus);
		// tentatively in switch{}, will merge to unit.setImmobileStatus() 
		// if there is no special requirement for other units
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
	
	//////////////////////////////////////////////////////////////////////////////////////////
	////////////////////////////////////// MOVEMENT //////////////////////////////////////////
	//////////////////////////////////////////////////////////////////////////////////////////
	
	//[[unitPosition, [target positions]],...]
	getAllValidMoves(playerID) {
		let movementList = [];		
		for (let pair of this.hexagonList) {
			const key = pair[0];
			const hexagon = pair[1];
			const unit = hexagon.getUnit();
			
			if (unit === null) {
				continue;
			}
			
			// check if the unit is free to move
			if (unit.playerID != playerID || !unit.isFreeToMove()){
				continue;
			}
			// get valid movement of the piece
			const tileID = keyToID(key);
			const targets = this.getTilesToMove(tileID, playerID);
			// console.log(targets)
			if (targets.length > 0) {
				movementList.push([keyToID(key), targets]);
			}
		}
		// console.log(movementList)
		return movementList;
	}
	isValidMove(move, playerID) {
		const startingPos = move[0];
		const endingPos = move[1];
		// check if starting pos has player's piece
		const hexagon = this.getHexagon(startingPos);
		const unit = hexagon.getUnit();
		if (unit === null){
			return false;
		}
		if (unit.getPlayerID() != playerID) {
			return false;
		}
		// check if ending pos is avaliable
		const secHexagon = this.getHexagon(endingPos);
		// console.log(secHexagon.isEmptyTile)
		//!!!!!!!!!!!!!!!!!!!!!
		if (!secHexagon.isEmptyTile) {
			return false;
		}
		return true;
	}
	performMovement(movement) {
		const startingPos = movement[0];
		const hexagon = this.getHexagon(startingPos);
		const unit = hexagon.getUnit();
		const updateList = unit.updateInfluence(this);
		this.move(movement);
		const currentStep = [['move', movement]];			
		for (let i = 0; i < updateList.length; i++){
			const update = updateList[i];
			this.mobility(update);
			currentStep.push(update);
		}
		this.stepLog.push(['movement', currentStep]);	
	}
	hasFreeTileToGo(tileID, playerID) {
		const neighbours = getHexagonNeighbourID(tileID);
		for (let i = 0; i < neighbours.length; i++){
			const hexagon = this.getHexagon(neighbours[i]);
			if (hexagon.checkIsEmptyTile()){
				return true;
			}
		}
		return false;
	}
	getTilesToMove(tileID, playerID) {
		const validTiles = [];
		const neighbours = getHexagonNeighbourID(tileID);
		for (let i = 0; i < neighbours.length; i++){
			const hexagon = this.getHexagon(neighbours[i]);
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
		let activationList = [];
		for (let pair of this.hexagonList) {
			const key = pair[0];
			const hexagon = pair[1];
			const unit = hexagon.getUnit();
			if (unit === null) {
				continue;
			}
			// check if the unit is free to activate
			if ((unit.playerID != playerID) || (!unit.isFreeToActivate())){
				continue;
			}
			// get valid activations of the piece
			const targets = unit.getActivations(this);
			// console.log(targets)
			if (targets.length > 0) {
				activationList.push([unit.getName(), keyToID(key), targets]);
				// console.log(unit);
			}
		}
		// console.log(activationList);
		return activationList;
	}
	// validate an action
	// activation = [unitPosition, target_info, 'unit_name']
	//This should always returns true!!!!!!!!!!!
	isValidActivation(activation){
		if (activation === null) {
			return true;
		}
		// console.log(activation)			
		const unitPosition = activation[0];
		const initialHexagon = this.hexagonList.get(IDToKey(unitPosition));
		const unit = initialHexagon.getUnit();
		// the unit must be free to activate and has not yet activated
		if (!unit.freeToActivate || unit.hasActivated) {
			console.log('invalid activation: the unit cannot be activated!!');
			console.log(activation);
			console.log(unit)
			return false;
		}
		// the unit must be correct type
		if (unit.getName() != activation[activation.length-1]) {
			console.log('invalid activation: wrong activation syntax!!');
			console.log(activation);
			console.log(unit);
			return false;
		}
		// check unit-specific requirements
		return unit.isValidActivation(this, activation);
	}
	
	// execute an action
	performAction(activation) {
		// null activation indicates end of activation phase
		if (activation === null) {
			this.stepLog.push(['activation', []]);
			return;
		}
		// get stepSequence from the unit
		const unitPosition = activation[0];
		const initialHexagon = this.hexagonList.get(IDToKey(unitPosition));
		const unit = initialHexagon.getUnit();
		const stepSequence = unit.activate(this, activation);
		// perform the steps and log
		// console.log(stepSequence)
		this.performStepSequence(stepSequence);
		this.stepLog.push(['activation', stepSequence]);
	}

	// utility functions for unit activation
	//----------------------------- general functions----------------------------------
	getNeighbouringEnemies(playerID, position){
		const neighbours = this.getHexagonNeighbours(position);
		// console.log(neighbours)
		let enemyPositions = [];
		for (let i = 0; i < neighbours.length; i++) {
			if (neighbours[i].unit != null && neighbours[i].unit.getPlayerID() != playerID){
				enemyPositions.push(neighbours[i].unit.getPosition());
				// console.log(enemyPositions)
			}
		}
		return enemyPositions;
	}
	getFriendlyUnits(playerID) {
		let friendlyList = [];
		for (let pair of this.hexagonList) {
			const key = pair[0];
			const hexagon = pair[1];
			if (hexagon.checkIsTile() && (!hexagon.checkIsEmptyTile())){
				const unit = hexagon.getUnit();
				if (unit.getPlayerID() === playerID){
					friendlyList.push(unit.getPosition());
				}
			}
		}
		return friendlyList;
	}
	getDistance(first, second) {
		const first_c = axialToCube(first);
		const second_c = axialToCube(second);
		return getDistanceCubic(first_c, second_c);
	}
	isInBoard(ID){
		return isInBoard(ID);
	}
	//----------------------------- end of general ----------------------------------
	//----------------------------PUSH and TOSS------------------------------
	getNextHexInDirection(origin, next) {
		//----------to do: validate origin and next are neighbours
		const colChange = next[0]-origin[0];
		const rowChange = next[1]-origin[1];
		let col = next[0];
		let row = next[1];
		col = col + colChange;
		row = row + rowChange;
		const nextPos = [col, row]
		if (isInBoard(nextPos)){
			return nextPos;
		}
		return null;
	}
	getAllHexInDirection(origin, next) {
		//----------to do: validate origin and next are neighbours
		const colChange = next[0]-origin[0];
		const rowChange = next[1]-origin[1];
		let col = next[0];
		let row = next[1];
		let outOfBoard = false;
		let hexagonList = [];
		while (!outOfBoard) {
			col = col + colChange;
			row = row + rowChange;
			const nextPos = [col, row]
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
	//---------------------------- TWIST------------------------------
	getAllHexInClockwise(origin,startingPos, rotationDirection) {
		let hexagonList = [];
		let outOfBoard = false;
		const direction = (rotationDirection==='clockwise') ? 1:2; 
		const tileList = get60DegreeRotationList(origin, startingPos, direction);
		// while (!outOfBoard) {
		// 	const nextPos = tileList.shift();
		// 	if (isInBoard(nextPos)){
		// 		hexagonList.push(nextPos);
		// 	}
		// 	else {
		// 		outOfBoard = true;
		// 	}
		// 	if (tileList.length===0){
		// 		outOfBoard = true;
		// 	}
		// }
		return tileList;
	}
	//----------------------------end of TWIST------------------------------
	//////////////////////////////////////////////////////////////////////////////////////////
	/////////////////////////////////////// BUILDING /////////////////////////////////////////
	//////////////////////////////////////////////////////////////////////////////////////////
	
	// check whether building is required for this turn
	needBuilding() {
		return (this.pieceToPlace.length != 0);
	}

	// returns a list of emtpy spaces for building
	getEmptySpaces() {
		let emptySpaces = [];
		for (let pair of this.hexagonList) {
			const key = pair[0];
			const hexagon = pair[1];
			if (!hexagon.checkIsTile()) {
				emptySpaces.push(hexagon.getID());
			}
		}
		return emptySpaces;
	}
	isValidBuilding(target) {
		const hexagon = this.hexagonList.get(IDToKey(target));
		return !hexagon.isTile;
	}
	buildTile(target) {
		this.build(target);
		this.stepLog.push(['building',[['build',target]]])
	}
}


class Hexagon {
	constructor(ID) {
		this.ID = ID;
		this.isTile = false;
		this.unit = null;
		this.isEmptyTile = false;
		if (ID != CONSTANT.tempTileID) {
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
	const col = ID[0];
	const row = ID[1];
	const neighbours = [];
	// check up-down
	if (CONSTANT.BOARD_SHAPE[col][0] < row){
		neighbours.push([col, row-1]);
	}
	if (CONSTANT.BOARD_SHAPE[col][1] > row){
		neighbours.push([col, row+1]);
	}
	// check left
	if (col > 0){
		if (CONSTANT.BOARD_SHAPE[col-1][0] < row){
			neighbours.push([col-1, row-1]);
		}
		if (CONSTANT.BOARD_SHAPE[col-1][1] >= row){
			neighbours.push([col-1, row]);
		}
	}
	// check right
	if (col < CONSTANT.NUM_COLS-1) {
		if (CONSTANT.BOARD_SHAPE[col+1][0] <= row){
			neighbours.push([col+1, row]);
		}
		if (CONSTANT.BOARD_SHAPE[col+1][1] > row){
			neighbours.push([col+1, row+1]);
		}
	}
	return neighbours;
}

// check if [i,j] is in game board, the temp tile is not on game board
// move into Gameboard class??????????????????
function isInBoard(ID) {
	// console.log(ID)
	const i = ID[0];
	const j = ID[1];
	if (i < 0 || i >= CONSTANT.NUM_COLS){
		return false;
	}
	if (j < CONSTANT.BOARD_SHAPE[i][0] || j > CONSTANT.BOARD_SHAPE[i][1]){
		return false;
	}
	return true;
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


// convert coordinate in axial grid to cubic grid
function axialToCube(position){
	return [position[0],position[1],-(position[0]+position[1])];
}

// computes distance between two points in cubic grid
function getDistanceCubic(a, b){
    return (abs(a[0] - b[0]) + abs(a[1] - b[1]) + abs(a.z[2] - b.z[2])) / 2;
}


// computes the list of 60 degree roataion of tile around center (ending with tile)
// direction == 1 for clockwise
// direction == 2 for anticlockwise
function get60DegreeRotationList(center, tile, direction) {
	let list = [];
	for (let i = 0; i < 6; i++){
		tile = get60DegreeRotation(center, tile, direction);
		list.push(tile);
	}
	return list;
}

// computes the list of 60 degree roataion of tile around center
// direction == 1 for clockwise
// direction == 2 for anticlockwise
// function get60DegreeRotation(center, tile, direction) {
// 	const center_cubic = axialToCube(center);
// 	const tile_cubic = axialToCube(tile);
// 	let vector = [0,0,0];
// 	let temp = 0;
// 	for (let i = 0; i < 3; i++){
// 		vector[i] = tile_cubic[i]-center_cubic[i];
// 	}
// 	// console.log(vector)
// 	if (direction === 1){
// 		temp = vector[0];
// 		vector[0] = -vector[1];
// 		vector[1] = -vector[2];
// 		vector[2] = -temp;
// 	}
// 	else {
// 		temp = vector[0];
// 		vector[0] = -vector[2];
// 		vector[2] = -vector[1];
// 		vector[1] = -temp;
// 	}
// 	const final = [center_cubic[0]+vector[0],center_cubic[1]+vector[1]];
// 	// console.log(final)
// 	return final;
// }

function get60DegreeRotation(center, tile, direction) {
	let vector = [0,0];
	let temp = 0;
	const col = center[0];
	const row = center[1];
	for (let i = 0; i < 2; i++){
		vector[i] = tile[i]-center[i];
	}
	vector =  IDToKey(vector)
	// console.log(vector)
	if (direction === 1){

		if (vector ==  IDToKey([0,-1])){
			return [col+1,row];
		}
		else if (vector ===  IDToKey([1,0])) {
			return [col+1,row+1];
		}
		else if (vector ===  IDToKey([1,1])) {
			return [col, row+1];
		}
		else if (vector ===  IDToKey([0,1])) {
			// console.log('bbbbbbbbb')
			return [col-1, row];
		}
		else if (vector ===  IDToKey([-1, 0])) {
			return [col-1, row-1];
		}
		else{
			// console.log('aaaaaa')
			return [col, row-1];
		
		}
	}
	else {
		if (vector ===  IDToKey([0,-1])){
			return [col-1,row-1];
		}
		else if (vector ===  IDToKey([1,0])){
			return [col,row-1];
		}
		else if (vector ===  IDToKey([1,1])) {
			return [col+1, row];
		}
		else if (vector ===  IDToKey([0,1])) {
			return [col+1, row+1];
		}
		else if (vector ===  IDToKey([-1, 0])) {
			return [col, row+1];
		}
		else{
			return [col-1, row];
		}
	}

}

// module.exports.Hexagon = Hexagon;
module.exports.GameBoard = GameBoard;
// module.exports. GameBoard.getHexagonNeighbourID =  getHexagonNeighbourID;