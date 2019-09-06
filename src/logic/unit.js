'use strict';

// super class for all units
class Unit {
	constructor(player_id) {
		this.player_id = player_id;
		this.has_activated = false;
		this.free_to_activate = true;
		this.name = 'unit';
		this.position = null;
		this.defeated = false;
		this.is_mobile = true;
	}

	setBoardPosition(position) {
		this.board_position = position;
	}

	getBoardPosition() {
		return this.position;
	}
	// reset at the end of turn
	resetActivation() {
		this.has_activated = false;
	}

	getName() {
		return this.name;
	}

	getPlayerID() {
		return this.player_id;
	}

	getPosition() {
		return this.position;
	}

	setPosition(position) {
		this.position = position;
	}

	getMobileStatus() {
		return this.is_mobile;
	}
	isFreeToActivate() {
		return (this.isFreeToActivate && !this.has_activated);
	}
	defeat() {
		this.defeated = true;
		this.is_mobile = false;
		this.free_to_activate = false;
		this.position = null;
	}
	performAction() {
		this.has_activated = true;
	}
	isFreeToMove() {
		return this.is_mobile;
	}
	can_activate(game_board) {
		if (!this.free_to_activate) {
			return false;
		}
		return true
	}
}


class Delete extends Unit {
	constructor(player_id) {
		super(player_id);
		this.name = 'delete';
	}

	
	delete_any(game_board){
		var hexagon_list = game_board.get_hexagon_neighbours(this.position);
		var target = hexagon_list[0].getID()
		return target;

	}
	getActivations(game_board){
		return game_board.getNeighbouringEnemies(this.player_id, this.position);
	}

	
}

class Push extends Unit {
	constructor(player_id) {
		super(player_id);
		this.name = 'push';
	}

	getActivations(game_board){
		var neighbouring_enemies = game_board.getNeighbouringEnemies();
		var valid_targets = [];
		for (var i = 0; i < neighbouring_enemies.length; i++) {
			var target_ID = getNextHexInDirection(origin, next);
			if (game_board.getHexagon(ID).is_empty_tile) {
				valid_targets.push(target_ID);
			}
		}
		return valid_targets;
	}
}

class Switch extends Unit {
	constructor(player_id) {
		super(player_id);
		this.name = 'switch';
	}

	getActivations(game_board){
		var 
		var valid_targets = [];
	}
}

module.exports.Delete = Delete;
module.exports.Push = Push;