/**
 * Created by 1 on 2018/6/19.
 */
var MongoClient = require('mongodb').MongoClient;
var settings = require("../settings.js");

//连接数据库
function _connectDB(callback){
    var url = settings.dburl;  //从settings.js文件中中读取数据库的地址
    MongoClient.connect(url, function(err, db){
        console.log("连接成功！");
        callback(err,db);

    });
}

init();

function init(){
    //对数据库进行一个初始化
    _connectDB(function(err, db){
        if (err) {
            console.log(err);
            return;
        }
        db.collection('users').createIndex(
            { "username": 1},
            null,
            function(err, results) {
                if (err) {
                    console.log(err);
                    return;
                }
                console.log("索引建立成功");
            }
        );
    });
}

//插入单条数据操作
exports.insertOne = function(collectionName, json, callback){
    _connectDB(function(err,db){
        if (err) {
            callback(err, null);
            return;
        }
        db.collection(collectionName).insertOne(json,function(err,result){
            callback(err,result);
            db.close();  //关闭数据库
        });
    });
}

//查找数据操作
exports.find = function(collectionName, json, C, D){
    if (arguments.length == 3) {
        //参数C就是callback，参数D没有传递
        var callback = C;
        var limitNumber = 0;
        var skipNumber = 0;
    } else if(arguments.length == 4) {
        //C就是args，D就是callback
        var args = C;
        var callback = D;
        var skipNumber = args.pageamount * args.page || 0;  //应该省略的条数
        var limitNumber = args.pageamount || 0;  //数目限制
        var sort = args.sort || {};  //排序方式
    } else {
        throw new Error("find函数的参数必须是3个，或者4个");
    }

    var result = []; //结果数组
    _connectDB(function(err, db){
        var cursor = db.collection(collectionName).find(json).limit(limitNumber).skip(skipNumber).sort(sort);
        cursor.each(function(err, doc){
            if (err) {
                callback(err, null);
                return;
            }

            if (doc != null){
                result.push(doc);  // 遍历数据，放入结果数组
            } else {
                //遍历结束，没有更多的数据了
                callback(err,result);
                db.close();  //关闭数据库
            }
        })
    });
}

//删除数据操作
exports.deleteMany = function (collectionName, json, callback) {
    _connectDB(function (err, db) {
        //删除
        db.collection(collectionName).deleteMany(
            json,
            function (err, result) {
                callback(err, result);
                db.close(); //关闭数据库
            }
        );
    });
}

//修改数据操作
exports.updateMany = function(collectionName, json1, json2, callback) {
    _connectDB(function(err, db){
        db.collection(collectionName).updateMany(
            json1,
            json2,
            function(err, result){
                callback(err, result);
                db.close(); //关闭数据库
        })
    });
}

exports.getAllCount = function(collectionName, callback) {
        _connectDB(function (err, db) {
            db.collection(collectionName).count({}).then(function(count) {
                callback(count);
                db.close();
            });
        });
}