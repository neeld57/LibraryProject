var express = require('express');
var router = express.Router();
var mongo = require('mongodb').MongoClient;
var objectId = require('mongodb').ObjectID;
var assert = require('assert');

var url = 'mongodb://localhost:27017/test';

var userID;
/* GET home page. */


router.post('/login',function(req,res,next){
    var uid = req.body.cardNumber;
    userID = uid;
    var password = req.body.password;
    var checknull;
    mongo.connect(url,function(err,db){
       assert.equal(null,err);
       db.collection('card-data').find({number:uid}).toArray(function(err,results){
           checknull=results[0];
           if(checknull === undefined){
               var checknullAdmin;
               db.collection('admins').find({number:uid}).toArray(function(err,results){
                checknullAdmin=results[0];
                if(checknullAdmin ===undefined){
                    return res.redirect('/');
                }
                if(results[0].password===password){
                    return res.render('admin');
                }
                else{
                    return res.redirect('/');
                }
               });
           }
          else if((results[0].password)===password){
              uid = {
                  uid:req.body.cardNumber
              };
              db.collection('session').insertOne(uid);
               db.collection('session').find().toArray(function(err,result){
                   console.log(result);
               });
             return res.redirect('/user');
          }
          else{
              return res.redirect('/');
          }
           });
    });
});
router.get('/admin',function(req,res,next){
    res.render('admin');
});
router.get('/', function(req, res, next) {
  res.render('login');
});
router.get('/user',function(req,res,next){
    res.render('user');
});
router.get('/get-data', function(req, res, next) {
  var resultArray = [];
  mongo.connect(url, function(err, db) {
    assert.equal(null, err);
    var cursor = db.collection('user-data').find();
    cursor.forEach(function(doc, err) {
      assert.equal(null, err);
      resultArray.push(doc);
    }, function() {
      db.close();
      res.render('user', {items: resultArray});
    });
  });
});
router.post('/getCheckedOut', function(req, res, next) {
  var cardID = req.body.card;
    var resultArray = [];
    mongo.connect(url, function(err, db) {
        assert.equal(null, err);
        var cursor = db.collection('checkedOut').find({card : cardID}).toArray(function(err,result){
          console.log(result);
            res.render('user', {item: result});
        });
            db.close();

    });
});

router.post('/insert', function(req, res, next) {
  var item = {
    title: req.body.title,
    content: req.body.content,
    author: req.body.author,
      copies: req.body.copies
  };

  mongo.connect(url, function(err, db) {
    assert.equal(null, err);
    db.collection('user-data').insertOne(item, function(err, result) {
      assert.equal(null, err);
      console.log('Item inserted');
      db.close();
    });
  });

  res.redirect('/');
});

router.post('/createadmin',function(req,res,next){
    var admin = {
        number : req.body.id,
        password : req.body.password
    };
    mongo.connect(url,function(err,db){
        assert.equal(null,err);
        db.collection('admins').insertOne(admin, function(err,result){
            assert.equal(null,err);
            db.close();
        });
    });
    res.redirect('/admin');
});
router.post('/createCard',function(req,res,next){
    var card = {
      number : req.body.card,
      password : req.body.password
    };
    mongo.connect(url,function(err,db){
      assert.equal(null,err);
      db.collection('card-data').insertOne(card,function(err,result){
        assert.equal(null,err);
        console.log('Card Created');
        db.close();
      });
    });
    res.redirect('/');
});
router.post('/checkout',function (req,res,next){
  var cardID = req.body.card;
  var password = req.body.password;
  var bookID = req.body.id;
  mongo.connect(url,function(err,db){
    assert.equal(null,err);

    var log = db.collection('card-data').find({number : cardID}).toArray(function(err,results){
      if((results[0].password)==password){
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
                      author: results[0].author, card : cardID, relid: bookID
                  };
                db.collection('checkedOut').insertOne(bookData);
              });
              db.close();
            })
          }
        });
      }
     });
    });
  res.redirect('user');
});
router.post('/update', function(req, res, next) {
  var item = {
    title: req.body.title,
    content: req.body.content,
    author: req.body.author
  };
  var id = req.body.id;

  mongo.connect(url, function(err, db) {
    assert.equal(null, err);
    db.collection('user-data').updateOne({"_id": objectId(id)}, {$set: item}, function(err, result) {
      assert.equal(null, err);
      console.log('Item updated');
      db.close();
    });
  });
    res.redirect('/get-data');
});

router.post('/delete', function(req, res, next) {
  var id = req.body.id;

  mongo.connect(url, function(err, db) {
    assert.equal(null, err);
    db.collection('user-data').deleteOne({"_id": objectId(id)}, function(err, result) {
      assert.equal(null, err);
      console.log('Item deleted');
      db.close();
    });
  });
    res.redirect('/get-data');
});

router.post('/return', function(req,res,next){
  var card = req.body.card;
  var title = req.body.title;
    mongo.connect(url, function(err, db) {
        assert.equal(null, err);
        var test = null;
        var idInCO;
        db.collection('checkedOut').find({card: card,title:title}).toArray(function(err,result){
        if(result[0].title!=null){
            var set, idInUD;
            idInCO = result[0]._id;
            db.collection('user-data').find({title : title}).toArray(function(err,results){
              idInUD = results[0]._id;
                set = {title:results[0].title,content:results[0].content,author:results[0].author,copies:(results[0].copies+1)};
                console.log(set.copies);
                db.collection('user-data').updateOne({"_id":objectId(idInUD)},{$set:set});
                db.collection('checkedOut').deleteOne({"_id" : objectId(idInCO)});
            });

        }
        });
    });
    res.redirect('/user');
});


module.exports = router;
