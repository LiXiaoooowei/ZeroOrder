const Constants = {
	// constants for shape of board, see rule.pdf
	BOARD_SHAPE: [[0, 6], [0, 7], [1, 7], [1, 8], [2,8]],
	NUM_COLS: 5,
	// place holder for intermeidate steps such as switch
	tempTileID: [100,100],

	UNIT_CODE: {
		ZERO_ORDER: 0,
		// BLACK_DELETE: 1,
		// BLACK_PUSH: 2,
		// BLACK_SWITCH: 3,
		// BLACK_TOSS: 4,
		// BLACK_FREEZE: 5,
		// BLACK_TWIST: 6,
		// WHITE_DELETE: 19,
		// WHITE_PUSH: 20,
		// WHITE_SWITCH: 21,
		// WHITE_TOSS: 22,
		// WHITE_FREEZE : 23,
		// WHITE_TWIST: 24,
		EMPTY_SPACE: 37,
		EMPTY_TILE: 38
	},

 	GAME_STATUS: {
 		PENDING_MOVE: 0,
		PENDING_ACTION: 1,
		WAITING_NEW_TILE: 2,
		WHITE_WIN: 3,
		BLACK_WIN: 4
 	}
}


module.exports.Constants = Constants;