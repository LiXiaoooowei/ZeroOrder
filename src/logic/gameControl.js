'use strict';

const GameBoard = require('./gameBoard');
const UnitList = require('./units/unitList');
const player = require('./player');

/***************************test variables***********************************/
const playerList = [new player.AI_DFS('Alice', 'random'), new player.AI_DFS('Bob', 'best')];

// full game
const tilePosition = [[0,1],[0,2],[0,3],[0,4],[0,5],[1,2],[1,3],[1,4],[1,5],[1,6],[2,2],[2,3],[2,4],[2,5],[2,6],[3,2],[3,3],[3,4],[3,5],[3,6],[4,3],[4,4],[4,5],[4,6],[4,7]];
const initialPieces = [[['delete', [3,3]], ['toss', [0,1]], ['switch',[1,2]],['push',[4,4]],['twist',[4,3]],['freeze',[2,2]]], [['delete', [1,5]], ['toss', [4,7]], ['switch',[3,6]],['push',[0,4]],['twist',[0,5]],['freeze',[2,6]]]];
// test freeze
// const tilePosition = [[1,2],[1,3],[1,4],[1,5],[1,6],[1,7]];
// const initialPieces = [[['freeze', [1,2]]], [['delete', [1,4]],['push',[1,5]]]];
// test freeze 2
// const tilePosition = [[1,2],[1,3],[1,4],[1,5],[1,6],[3,3],[3,4]];
// const initialPieces = [[['switch', [1,2]],['freeze', [3,3]]], [['delete', [1,5]],['push',[1,4]]]];

// test twist
// const tilePosition = [[1,2],[1,3],[1,4],[1,5],[1,6],[3,3],[3,4]];
// const initialPieces = [[['twist', [1,2]]], [['delete', [1,5]],['push',[1,4]]]];
// set default units for testing
// var tilePosition = [[2,3],[2,4],[2,5],[2,6],[2,7]];
// Alice win
// var initialPieces = [[['delete', [2,3]]], [['delete', [2,7]]]];
// Bob win
// var initialPieces = [[['delete', [2,3]]], [['delete', [2,6]]]];
/****************************************************************************/

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

				newUnit = new UnitList.unitList[unitList[i][j][0]](this.players[i].getName());
				
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

	// main game loop
	play() {		
		while (!this.endOfGame) {
			
			this.move();
			if (this.endOfGame){
				continue;
			}
			
			this.action();

			this.build();

			this.endOfTurn();
			console.log('========== next player =============');

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
			move = this.currentPlayer.move(validMovements, boardState);
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
			const activation = this.currentPlayer.activate(validActivations);
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
			const target = this.currentPlayer.build(emptySpaces);
			if (this.gameBoard.isValidBuilding(target)) {
				this.gameBoard.buildTile(target);
				console.log('new tile at ' + target);
			}			
		}
	}
	// clean up game status for next turn
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
	// this is intended to be passed to front end
	getBoardState(content) {
		const boardState = this.gameBoard.generateBoardState(this.currentPlayer.getName());
		boardState.setStatus(this.status, content);
		return boardState.getBoardState();
	}
}

function playGame(playerList, tilePosition, initialPieces) {
	const myGame = new Game(playerList);
	myGame.setTilesFromList(tilePosition);
	myGame.setPlayerUnitsFromList(initialPieces);
	myGame.play();
	console.log(myGame.winner.getName() + ' won!');
}

playGame(playerList, tilePosition, initialPieces);

module.exports.Game = Game;
module.exports.playGame = playGame;