'use strict';

const Delete = require('./delete');
const Push = require('./push');
const Toss = require('./toss');
const Switch = require('./switch');

const unitList = {	'delete': Delete.Delete,
					'push': Push.Push,
					'toss': Toss.Toss,
					'switch': Switch.Switch};
const unitNameArray = ['delete', 'push', 'switch', 'toss'];

module.exports.unitList = unitList;
module.exports.unitNameArray = unitNameArray;