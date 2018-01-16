module.exports = function(app){

    var votes = require('../controllers/vote');


    app.get('/api/teams/:teamId/proposition/:propId/votes', votes.findByProposition);
    app.get('/api/votes/author', votes.getVotesInfosForUserProfile);
}