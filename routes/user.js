var express = require('express');
var router = express.Router();
var mongo = require('mongodb').MongoClient;
var objectId = require('mongodb').ObjectID;
var assert = require('assert');

var url = 'mongodb://localhost:27017/test';

var userID;

function accountID() {
    mongo.connect(url, function (err, db) {
        db.collection('session').find().toArray(function (err, result) {
                userID = result[0].uid;
              //  console.log("A");
                //console.log(userID);
        });
    });
}
router.get('/',function(req,res,next){
    res.render('user');
});
router.post('/getUserCheckedOut',function(req,res,next){
    mongo.connect(url, function (err, db) {
        db.collection('session').find().toArray(function (err, result) {
            userID = result[0].uid;
            assert.equal(null,err);
            var cursor = db.collection('checkedOut').find({card:userID}).toArray(function(err,result){
                console.log(result);
                //  console.log("A");
                //console.log(result);
                //console.log("B");
                res.render('user',{item:result});
            });
            db.close();
            //  console.log("A");
            //console.log(userID);
        });
    });
    console.log(userID);
    //console.log("userID");
   /* mongo.connect(url,function(err,db){
        assert.equal(null,err);
        var cursor = db.collection('checkedOut').find({card:userID}).toArray(function(err,result){
            console.log(result);
          //  console.log("A");
            //console.log(result);
            //console.log("B");
            res.render('user',{item:result});
        });
        db.close();
    }); */
});

router.post('/userReturn',function(req,res,next){
    accountID();
    var bookID = req.body.id;
    var title = req.body.title;
    // res.redirect('/getUserCheckedOut');
    mongo.connect(url, function(err, db) {
        assert.equal(null, err);
        db.collection('checkedOut').find({card: userID,"_id":objectId(bookID)}).toArray(function(err,result){
            var set, idInUD;
            title=result[0].relid;
            db.collection('user-data').find({"_id" : objectId(title)}).toArray(function(err,results){
                console.log(results);
                idInUD = results[0]._id;
                set = {title:results[0].title,content:results[0].content,author:results[0].author,copies:(results[0].copies+1)};
                console.log(set.copies);
                db.collection('user-data').updateOne({"_id":objectId(idInUD)},{$set:set});
                db.collection('checkedOut').deleteOne({"_id" : objectId(bookID)});
            });
        });
    });
    res.redirect('/user');
});

router.post('/userCheckout',function(req,res,next){
    accountID();
    console.log(userID);
    var bookID = req.body.id;
    mongo.connect(url,function(err,db){
        assert.equal(null,err);
        var log = db.collection('card-data').find({number : userID}).toArray(function(err,results){
            var bookCheck = db.collection('user-data').find({"_id": objectId(bookID)}).toArray(function(err,results){
                if(results[0].copies>0){
                    console.log("Books Found");
                    var bookData = {
                        title : results[0].title,content:results[0].content,
                        author: results[0].author, copies : (results[0].copies-1)
                    };
                    db.collection('user-data').updateOne({"_id": objectId(bookID)}, {$set:bookData},  function(err,result){
                        assert.equal(null,err);
                        mongo.connect(url,function(err,db){
                            assert.equal(null,err);
                            bookData = {
                                title : results[0].title,content:results[0].content,
                                author: results[0].author, card : userID, relid: bookID
                            };
                            db.collection('checkedOut').insertOne(bookData);
                            db.collection('checkedOut').find().toArray(function(err,results){
                               console.log(results);
                            });
                        });
                        db.close();
                    })
                }
            });
        });
    });
    res.redirect('/user');
});
module.exports=router;