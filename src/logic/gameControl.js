'use strict';

/*	NOTE: There is an important difference between current version of game and actual game!!!!!
	Currently each player only has 'delete', hence the part for which player place defeated piece
	as tile is not implemented. This will be added once some other pieces are added.
	Main while loop needs to be modified for this change.
*/



const GameBoard = require('./gameBoard');
const unit = require('./unit');
const player = require('./player');


 const tilePosition = [[1,3],[1,4],[1,5],[1,6],[1,7],[2,3],[2,4],[2,5],[2,6],[2,7],[3,2],[3,3],[3,5],[3,6],[3,7]];
 const initialPieces = [[['delete', [2,3]], ['toss', [2,4]], ['push',[1,3]]], [['delete', [2,7]],['switch',[3,6]],['push',[3,5]]]];


// set default units for testing
// var tilePosition = [[2,3],[2,4],[2,5],[2,6],[2,7]];


// Alice win
// var initialPieces = [[['delete', [2,3]]], [['delete', [2,7]]]];

// Bob win
// var initialPieces = [[['delete', [2,3]]], [['delete', [2,6]]]];

class Game {
	constructor(playerList) { 

		this.gameBoard = new GameBoard.GameBoard();
		this.endOfGame = false;
		this.players = playerList;
		this.currentPlayer = playerList[0];
		this.setPlayerColour();
		this.winner = null;	
	}

	setPlayerColour() {
		this.players[0].setColour('black');
		this.players[1].setColour('white');
		this.gameBoard.setWhitePlayer(this.players[1].getName());
	}

	setTilesFromList(tileList) {

		const numTile = tileList.length;
		for (let i = 0; i < numTile; i++){
			// console.log(tileList[i])
			this.gameBoard.getHexagon(tileList[i]).setAsTile();
			
		}

	}

	setPlayerUnitsFromList(unitList) {
		let newUnit = null;
		for (let i = 0; i < 2; i++) {
			for (let j = 0; j < unitList[i].length; j++){
				// check if target hexagon is a tile
				const hexagonID = unitList[i][j][1]
				const hexagon = this.gameBoard.getHexagon(hexagonID);
				if (!hexagon.isTile) {
					continue;
				}
				switch (unitList[i][j][0]) {
					case 'delete':
						newUnit = new unit.Delete(this.players[i].getName());
						break;
					case 'push':
						newUnit = new unit.Push(this.players[i].getName());
						break;
					case 'toss':
						newUnit = new unit.Toss(this.players[i].getName());
						break;
					case 'switch':
						newUnit = new unit.Switch(this.players[i].getName());
						break;
					default:
						console.log('unknown unit in unit list' + unitList[i][j][0]);
				}
				
				// check if the player already has the unit				
				const flag = this.players[i].addUnit(newUnit);
				// if successful, set position of the unit and update tile condition
				if (flag){
					newUnit.setPosition(hexagonID);
					hexagon.setUnit(newUnit);
					// console.log(newUnit);
				}
			}
		}
	}

	play() {		
		while (!this.endOfGame) {
			
			this.move();
			if (this.endOfGame){
				continue;
			}
			
			this.action();

			this.build();

			this.endOfTurn();

		}
		//-------------------------------------------------------------------------------
		const boardState = this.getBoardState(null);
		// console.log(boardState);
		//-------------------------------------------------------------------------------
	}
	move() {
		// check if current player has mobile pieces
		const validMovements = this.gameBoard.getAllValidMoves(this.currentPlayer.getName());
		// player is immoblised, hence loses the game
		if (validMovements.length == 0){
			this.endOfGame = true;
			if (this.currentPlayer.getName() === this.players[0].getName()){
				this.winner = this.players[1];
				this.status = 'white_win'
			}
			else {
				this.winner = this.players[0];
				this.status = 'black_win'
			}
			return;
		}
		this.status = 'waiting_movement'
		//-------------------------------------------------------------------------------
		const boardState = this.getBoardState(validMovements);
		// console.log(boardState);
		//-------------------------------------------------------------------------------
		// player make move
		// TO-DO: check end of game condition after every activation
		// console.log(this.gameBoard.getAllValidMoves(this.currentPlayer.getName()));
		let isValidMove = false;
		let move = null;
		while(!isValidMove){
			move = this.currentPlayer.makeMovePlan(validMovements, boardState);
			isValidMove = this.gameBoard.isValidMove(move, this.currentPlayer.getName());
		}
		this.gameBoard.performMovement(move);
		console.log(this.currentPlayer.getName() + ': ' + move[0] + '=>' + move[1]);
	}
	action() {
		// player activate piece
		this.status = 'waiting_activation'
		let validActivations = this.gameBoard.getAllValidActivations(this.currentPlayer.getName());
		//-------------------------------------------------------------------------------
		const boardState = this.getBoardState(validActivations);
		// console.log(boardState);
		//-------------------------------------------------------------------------------
		let pendingActivation = true;
		while(pendingActivation) {
			const activation = this.currentPlayer.activatePlan(validActivations);
			if (activation === null) {
				pendingActivation = false;
			}				
			else {
				// var unit = activation[0];
				// if (!unit.can_activate()){
				// 	continue;
				// }
				// var target = activation[1];
				if (this.gameBoard.isValidActivation(activation)){
					console.log(activation);
					this.gameBoard.performAction(activation);
					validActivations = this.gameBoard.getAllValidActivations(this.currentPlayer.getName());
					// if (validActivations.length == 0){
					// 	pendingActivation = false;
					// }
				}
			}
		}
	}
	build() {
		while (this.gameBoard.needBuilding()){
			this.status = 'waiting_tile';
			const emptySpaces = this.gameBoard.getEmptySpaces();
			//-------------------------------------------------------------------------------
			const boardState = this.getBoardState(emptySpaces);
			// console.log(boardState);
			//-------------------------------------------------------------------------------
			const target = this.currentPlayer.buildPlan(emptySpaces);
			if (this.gameBoard.isValidBuilding(target)) {
				this.gameBoard.buildTile(target);
				console.log('new tile at ' + target);
			}			
		}
	}
	endOfTurn() {
		// reset activation
		this.currentPlayer.resetUnitActivation();
		// switch to next player
		if (this.currentPlayer.getName() === this.players[0].getName()){
			this.currentPlayer = this.players[1];
		}
		else{
			this.currentPlayer = this.players[0];
		}
	}
	getBoardState(content) {
		const boardState = this.gameBoard.generateBoardState(this.currentPlayer.getName());
		boardState.setStatus(this.status, content);
		return boardState.getBoardState();
	}
}

const playerList = [new player.AI('Alice'), new player.AI('Bob')];
const myGame = new Game(playerList);


myGame.setTilesFromList(tilePosition);
myGame.setPlayerUnitsFromList(initialPieces);
myGame.play();
console.log(myGame.winner.getName() + ' won!');