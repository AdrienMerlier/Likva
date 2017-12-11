var mongoose = require('mongoose');
var ObjectID = require('mongodb').ObjectID;
var slug = require('slugify')


Team = mongoose.model('Team');
User = mongoose.model('User');

var teamusers = require('./teamUser')


var bcrypt = require('bcrypt-nodejs');



exports.findAll = function(req, res) {
	 Team.find({}, function(err, teams) {
    	res.json(teams);
  	});
};
exports.findById = function(req, res) {
	Team.find({teamName: req.params.teamId}, function(err, team) {
    	res.json(team);
  	});
};

exports.findCategories = function(req, res) {
	console.log("On cherche des categories là!");
	Team.findOne({skug: req.params.teamId}, function(err, team) {
    	res.json(team.categories);
  	});
};

exports.add = function(req, res) {
	console.log("Here is the first request:" + req.body);

	Team.count({slug: slug(req.body.teamName)}, function (err, count) {

		if (count != 0) {
					res.send({
						success: false,
						message: "Sorry, this team name is already taken."
					});
		}

		else{

			 console.log("Le nombre d'équipe avec ce nom est: " + count);
			//Review how to insert the first user once token management is done by front
					
			var hash = bcrypt.hashSync(req.body.pwd);

			var new_team = {
				_id: new ObjectID(),
			   	slug : slug(req.body.teamName),
				displayName: req.body.teamName,
				type: req.body.type,
				password : hash,
			};

			Team.create(new_team, function (err) {
				if (err) {
                    return res.json({ success: false, message: 'Sorry, couldnt create the team.' });    
                } else {

                	//Add user in teamUsers collection
                	teamusers.addFirstUser(req, function (err) {
                		if (err) throw err;
                	});

                	//Update the user with the information about his account;

                	var permission = {
                		slug: slug(req.body.teamName),
                		displayName: req.body.teamName,
                		admin: true,
                		proposer: true,
                		role: "Voter"
                	}

                	User.findOneAndUpdate({email: req.body.email}, {$push: {teams: permission}}, function (err) {
                		if (err) throw err;
                	});

                	res.send(
                		{
                			success: true,
                			team: new_team
                		});
                }
			});
		}
	});
	
};

exports.addSimpleUser = function(req, res) {

	Team.find({slug: req.params.teamId}, function (err, team) {

		if (err) throw err;

            if (!team) {
            	res.send({
						success: false,
						message: "Sorry, this team doesn'exist."
					});
            }

            else if (team) {

            	if (!bcrypt.compareSync(req.body.teamPassword, team.password)) {
                	res.json({ success: false, message: 'Authentication failed. Wrong password.' });
              } else {


              	//Add a new TeamUser
              	teamusers.addSimpleUser(req, function (err) {
                		if (err) throw err;
                	});


                	//Update the user with the information about his account;

                	var permission = {
                		slug: req.params.teamId,
                		displayName: team.displayName,
                		admin: false,
                		proposer: false,
                		role: "Observer"
                	}

                	User.findOneAndUpdate({email: req.body.email}, {$push: {teams: permission}}, function (err) {
                		if (err) throw err;
                	});

                	res.send(
                		{
                			success: true,
                		});

            }
        }
    });		
	
};

exports.addUserViaAdmin = function(req, res) {

	Team.find({slug: req.params.teamId}, function (err, team) {

		if (err) throw err;

            if (!team) {
            	res.send({
						success: false,
						message: "Sorry, this team doesn'exist."
					});
            }

            else if (team) {

              	//Add a new TeamUser
              	teamusers.addUserViaAdmin(req, function (err) {
                		if (err) throw err;
                	});

              		adminReq = (req.body.admin =="Oui");
              		proposerReq = (req.body.proposer =="Oui");

                	//Update the user with the information about his account;

                	var permission = {
                		slug: req.params.teamId,
                		displayName: team.displayName,
                		admin: adminReq,
                		proposer: proposerReq,
                		role: req.body.type
                	}

                	User.findOneAndUpdate({email: req.body.email}, {$push: {teams: permission}}, function (err) {
                		if (err) throw err;
                	});

                	res.send(
                		{
                			success: true,
                		});

            }
    });		
	
};

exports.addCategory = function(req, res) {

	console.log(req.params.teamId);

	Team.count({teamName: req.params.teamId}, function (err, count) {

		//To review after token management

		if (count != 1) {
					res.send("Sorry, this team doesn't exist.");
		}

		else{

			Team.findOneAndUpdate({teamName: req.params.teamId}, {$push: {categories: {categoryName: req.body.categoryName, img : ""}}}, function (err) {
            	if (err) throw err;
            });

            res.send(202);
		}
	});
	
};

exports.updateTeam = function() {};
exports.updateTeamPassword = function() {};
exports.delete = function() {};