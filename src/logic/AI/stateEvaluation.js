'use strict';

const FeatureList = require('./feature');

const featureList = FeatureList.featureList;
const bestWeight = FeatureList.bestWeight;

class StateEvaluation {
	constructor(key) {
		this.featureList = FeatureList.featureList;
		const numFeature = this.featureList.length;
		if (key === 'random') {
			this.weight = [];
			for (let i = 0; i < numFeature; i++) {
				this.weight.push(Math.random()*2-1);
			}
		}
		else if (key === 'best') {
			this.weight = bestWeight;
		}
		else {
			this.weight = key;
		}
		// console.log(this.weight);
	}

	evaluate(gameboard) {
		let score = 0;
		for (let i = 0; i < this.featureList.length; i++) {
			score += featureList[i].evaluate(gameboard)*this.weight[i];
		}
		return score;
	}
}


module.exports.StateEvaluation = StateEvaluation;