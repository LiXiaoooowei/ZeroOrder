'use strict';

/* Each round is madeup by two stages:
* Firstly a move, which involves a starting position and an ending position
* Then a activation sequence.
* Each activation consists a unit, a target, activation parameters and hex position if a piece is defeated
*/

class RoundSequence {
	constructor(player_id) {
		this.player_id = player_id;

	}
	setMovement(starting, ending) {
		this.movement = [starting, ending];
	}
}

// class Activation {
// 	constructor() {
// 		this.
// 	}
// }