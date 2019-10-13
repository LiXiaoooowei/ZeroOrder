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
		return (this.isFreeToActivate && !this.has_activated && !this.defeated);
	}
	// mark a unit as defeated
	defeat() {
		this.defeated = true;
		// this.is_mobile = false;
		// this.free_to_activate = false;
		// this.position = null;
	}
	revive() {
		this.defeated = false;
	}
	performAction() {
		this.has_activated = true;
	}
	// reset at the end of turn
	
	resetActivation() {
		this.has_activated = false;
	}
	isFreeToMove() {
		return this.is_mobile;
	}
	can_activate(game_board) {
		if (!this.free_to_activate || this.defeated) {
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
		var neighbouring_enemies = game_board.getNeighbouringEnemies(this.player_id, this.position);
		var valid_targets = [];
		for (var i = 0; i < neighbouring_enemies.length; i++) {
			var enemy_pos = neighbouring_enemies[i];
			var target_ID = game_board.getNextHexInDirection(this.position, enemy_pos);
			// the action is valid if the space behind target is out of map
			if (target_ID === null){
				valid_targets.push(enemy_pos);
			}
			// the action is valid if the space behind target is an empty tile
			if (game_board.getHexagon(target_ID).is_empty_tile) {
				valid_targets.push(enemy_pos);
			}
			// (the action is not valid if the space behind target is an occupied tile)
		}
		return valid_targets;
	}
}

class Toss extends Unit {
	constructor(player_id) {
		super(player_id);
		this.name = 'toss';
	}

	getActivations(game_board){
		var neighbouring_enemies = game_board.getNeighbouringEnemies(this.player_id, this.position);
		var valid_targets = [];
		for (var i = 0; i < neighbouring_enemies.length; i++) {
			var enemy_pos = neighbouring_enemies[i];
			var target_ID = game_board.getNextHexInOppDirection(this.position, enemy_pos);
			// the action is valid if the space behind target is out of map
			if (target_ID === null){
				valid_targets.push(enemy_pos);
			}
			// the action is valid if the space behind target is an empty tile
			if (game_board.getHexagon(target_ID).is_empty_tile) {
				valid_targets.push(enemy_pos);
			}
			// (the action is not valid if the space behind target is an occupied tile)
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
		var friendly_units = game_board.getFriendlyUnits(this.player_id);
		var valid_targets = [];
		for (var i = 0; i < friendly_units.length; i++) {
			var unit = game_board.getHexagon(friendly_units[i]).getUnit();
			if (!unit.defeated && unit.getName() != 'switch') {
				valid_targets.push(unit.getPosition());
			}
		}
		return valid_targets;
	}
}

module.exports.Delete = Delete;
module.exports.Push = Push;
module.exports.Toss = Toss;
module.exports.Switch = Switch;