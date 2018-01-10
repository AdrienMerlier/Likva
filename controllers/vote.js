var mongoose = require('mongoose');
var ObjectID = require('mongodb').ObjectID;

Proposition = mongoose.model('Proposition');
Vote = mongoose.model('Vote');


exports.findByProposition = function(req, res) {

	//To add, protect it: if the deadline is not passed, return too early
	Vote.find({team: req.params.teamId, propId: req.params.propId}, function(err, votes) {
		console.log(votes);
    	res.json(votes);
  	});
};

exports.add = function(req, res) {

	Proposition.count({_id: req.params.propId}, function (err, count) {

		if (count != 1) {
					res.send("Sorry, this proposition doesn't exist.");
		}

		else{

			console.log('Notre premier vote va avoir lieu!:' + req.params.teamId);
			//A revoir une fois qu'on sait gérér le token, vérifier que l'utilisateur est présent dans Teamusers, et peut voter

			Vote.create({
				_id: new ObjectID(),
				slug : req.params.teamId,
				propId : req.params.propId,
				voter: req.body.voter,
				delegation : req.body.delegation,
				content: req.body.content,
				weight: 1
			}, function (err) {
				if (err) {
                    res.send({ success: false, message: 'Sorry, couldnt cast your vote after emargement.' });  
                    //Add to erase the Emargement
                } else {
                	res.send({ success: true});
                }
			});
		}
	});
	
};

exports.automatedAdd = function(newVote) {

	Vote.create({
		_id: new ObjectID(),
		slug : newVote.teamId,
		propId : newVote.propId,
		voter: newVote.voter,
		delegation : newVote.delegation,
		content: newVote.content,
		weight: 1
	}, function (err) {
		if (err) {
            console.log("Couldn't cast the vote of the delegater:" + err);    
        } else {
           	console.log("Casted the vote of the delegater.");
            }
	});	
};

function moveDelegationsForWeightX(propId, weight) {

	console.log("I'm in the recursive function for weight:" + weight);
	
	Vote.find({propId: propId, delegation: true, weight: weight}, function(err, specWeightVotes){

		console.log("There are " + specWeightVotes.length +"votes to delegate.");

				console.log("Gonna delegate these votes.");
				
				for (var i = 0; i < specWeightVotes.length; i++) {


					// Add the weight d, aka the weight of a vote to the delegated voter
					Vote.findOneAndUpdate({propId: propId, voter: specWeightVotes[i].content }, { $inc: { 'weight': specWeightVotes[i].weight }}, function (err) {
						if (err) {
            				console.log("Ca bug.");
        				}
					});

					//Put weight as zero for the ones who have delegated
					Vote.findOneAndUpdate({_id: specWeightVotes[i]._id}, { $set: { 'weight': 0 }}, function (err) {
	            		if (err) {
	            			console.log("Ca bug 2.");
	            		}
	            	});

	            	console.log("One vote delegated!");	
				}

				Vote.count({propId: propId, delegation: true, weight: weight}, function(err, count){

					console.log("There are " + count +"as weight "+ weight+"after this round.");

					if (count==0) {
						console.log("I'm returning true.");
						return true;
					} else{
						console.log("We'll need another round!");
						moveDelegationsForWeightX(propId, weight);
					}

				});
			
			});
}

exports.moveDelegations = function(req) {

	var teamId = req.params.teamId;
	var propId = req.params.propId;

	Vote.count({propId: propId, delegation: true}, function(err, voteNumber) {

		var maxDelegation = voteNumber;

		for(var d=1; d<maxDelegation+1; d++){

			console.log("Gonna delegate votes for weight:" + d);

			moveDelegationsForWeightX(propId, d, function (err) {
				if (err) {
	            			console.log("Ca bug 3.");
	            		}
			});
			
		}
		console.log("I have delegated all votes");

		return status=true;
  	});
};

