'use strict';

const Delete = require('./delete');
const Push = require('./push');
const Toss = require('./toss');
const Switch = require('./switch');
const Freeze = require('./freeze');

const unitList = {	'delete': Delete.Delete,
					'push': Push.Push,
					'toss': Toss.Toss,
					'switch': Switch.Switch,
					'freeze': Freeze.Freeze};
const unitNameArray = ['delete', 'push', 'switch', 'toss', 'freeze'];

module.exports.unitList = unitList;
module.exports.unitNameArray = unitNameArray;