
/*
 * GET home page.
 */
module.exports = {
    chat : function(req,res){
        res.render('chat.html');
    },
    lounge : function(req,res){
        res.render('lounge.html');
    }
}
