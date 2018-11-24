/**
 * Created by 1 on 2018/6/23.
 */
var formidable = require("formidable");
var db = require("../models/db.js");
var md5 = require("../models/md5.js");
var path = require("path");
var fs = require("fs");
var gm = require("gm");

//首页
exports.showIndex = function (req, res, next) {
    //检索数据库，查找此人的头像
    if (req.session.login == "1") {
        //如果登陆了
        var username = req.session.username;
        var login = true;
    } else {
        //没有登陆
        var username = "";  //制定一个空用户名
        var login = false;
    }
    //已经登陆了，那么就要检索数据库，查登陆这个人的头像
    db.find("users", {username: username}, function (err, result) {
        if (result.length == 0) {
            var avatar = "moren.jpg";
        } else {
            var avatar = result[0].avatar;
        }
        res.render("index", {
            "login": login,
            "username": username,
            "active": "首页",
            "avatar": avatar    //登录人的头像
        });
    });
};

//显示注册页
exports.showRegist =  function(req, res, next){
    res.render("regist",  {
        "login" : req.session.login == "1" ? true : false,
        "username" :  req.session.login == "1" ? req.session.username : "",
        "active" : "注册"
    });
}

//执行注册业务
exports.doRegist = function(req, res, next){
    var from = new formidable.IncomingForm;
    from.parse(req, function(err, fields, files){
        var username = fields.username;
        var password = fields.password;
        console.log(username+""+password);
        //得到用户填写的东西
        //查询数据库是否存在该用户
        db.find("users", {"username" : username}, function(err, result){
            if (err) {
                res.send("-3");  //服务器出现错误
                return;
            }
            if (result.length != 0) {
                res.send("-1");  //数据库已存在该用户名
                return;
            }
            //设置md5加密
            password = md5(md5(password) +"凌添");
            //现在可以讲用户填写信息存入数据库
            db.insertOne("users", {
                "username" : username,
                "password" : password,
                "avatar" : "moren.jpg"
                },
                function(err, result){
                if (err) {
                    res.send("-3"); //服务器出现错误
                    return;
                }
                req.session.login = "1";
                req.session.username = username;
                res.send("1"); //注册成功，写入session

            })
        });
    });
}

//显示登录页
exports.showLogin = function(req, res, next){
    res.render("login", {
        "login" : req.session.login == "1" ? true : false,
        "username" :  req.session.login == "1" ? req.session.username : "",
        "active" : "登录"
    });
}

//执行登录业务
exports.doLogin = function(req, res, next){
    var form = new formidable.IncomingForm;
    form.parse(req, function(err, fields, files){
        var username = fields.username;
        var password = fields.password;
        console.log(username+" "+password);
        var jiamihou = md5(md5(password) +"凌添");
        //查询数据库，看看有没有该用户
        db.find("users", {"username" : username}, function(err, result){
            if (err) {
                res.send("-5");
                return;
            }
            if (result.length == 0){
                res.send("-1");  //用户不存在
                return;
            }
            if (jiamihou ==  result[0].password) {
                req.session.login = "1";
                req.session.username = username;
                res.send("1"); //登录成功
            } else {
                res.send("-2"); //密码错误
            }
        })
    });
}

//设置头像页
exports.showSetavatar = function(req, res, next){
    //设置头像必须处于已经登录状态
    if (req.session.login != "1") {
        res.send("非法操作！请先登录，再进行设置头像");
        return;
    }

    res.render("setavatar", {
        "login" : true,
        "username" :  req.session.username,
        "active" : "修改头像"
    });
}

//执行上传头像业务
exports.doSetavatar = function(req, res, next){
    //设置头像必须处于已经登录状态
    if (req.session.login != "1") {
        res.send("非法操作！请先登录，再进行设置头像");
        return;
    }

    var form = new formidable.IncomingForm;
    form.uploadDir = path.normalize(__dirname + "/../avatar");
    form.parse(req, function(err, fields, files){
        var oldpath = files.touxiang.path;
        var newpath = path.normalize(__dirname + "/../avatar") + "/" + req.session.username + ".jpg";
        fs.rename(oldpath, newpath, function(err){
            if (err) {
                res.send("失败！！！");
                return;
            }
            //重定向跳转带裁剪页面
            req.session.avatar  =  req.session.username + ".jpg";
            res.redirect("/cut");
        });

    });
}

//裁剪头像页
exports.showCut = function(req, res, next){
    //裁剪头像必须处于已经登录状态
    if (req.session.login != "1") {
        res.send("非法操作！请先登录，再进行头像操作");
        return;
    }

    res.render("cut", {
        avatar : req.session.avatar
    });
}

//执行裁剪头像业务
exports.doCut = function(req, res, next){
    //设置头像必须处于已经登录状态
    if (req.session.login != "1") {
        res.send("非法操作！请先登录，再进行头像操作");
        return;
    }

    //获取get请求传递x，y，w，h 这几个参数
    var filename = req.session.avatar;
    var x = req.query.x;
    var y = req.query.y;
    var w = req.query.w;
    var h = req.query.h;

    gm("./avatar/" + filename)
        .crop(w, h, x, y)
        .resize(100, 100, "!")
        .write("./avatar/" + filename, function (err) {
            if (err) {
                res.send("-1");
                return;
            }
            //更改数据库当前用户的avatar这个值
            db.updateMany("users", {"username": req.session.username}, {
                $set: {"avatar": req.session.avatar}
            }, function (err, result) {
                if (err) {
                    res.send("-1");
                    return;
                }
                res.send("1");
            });
        });
}

//执行发表说说
exports.doPost = function(req, res, next){
    //发表说说必须处于已经登录状态
    if (req.session.login != "1") {
        res.send("非法操作！请先登录，再进行发表说说");
        return;
    }
    var username = req.session.username;  //将session中的username传过来
    var form = new formidable.IncomingForm;
    form.parse(req, function(err, fields, files){
        var content = fields.content;
        console.log(content);
        //现在可以证明，用户没有被占用
        db.insertOne("posts", {
            "username" : username,
            "datatime" : new Date(),
            "content" : content
        }, function(err, result){
            if (err) {
                res.send("-3");  //服务器错误
                return;
            }
            res.send("1");//注册成功
        });

    });
}

//列出全部说说
exports.getAllShuoshuo = function(req, res, next){
    var page = req.query.page;
    db.find("posts", {}, {"pageamount": 9,"page" : page, "sort" : {"datatime" : -1}}, function(err, result){
       res.json(result);
    });
}

//列出某个用户信息
exports.getUserInfo = function(req, res, next){
    var username = req.query.username;
    db.find("users", {"username" : username}, function(err, result){
        var obj = {
            "username" : result[0].username,
            "avatar" : result[0].avatar,
            "_id" : result[0]._id
        };
        res.json(obj);
    });
}

//获取说说总数
exports.getshuoshuoAmount = function(req,res,next){
    db.getAllCount("posts",function(count){
        res.send(count.toString());
    });
};

//获取当前用户个人主页
exports.showUser = function(req, res, next){
    var user = req.params["username"];
    db.find("posts", {"username" : user}, function(err, result){
        db.find("users", {"username" : user}, function(err, result2){
            res.render("user",{
                "login": req.session.login == "1" ? true : false,
                "username": req.session.login == "1" ? req.session.username : "",
                "user" : user,
                "active" : "我的说说",
                "cirenshuoshuo" : result,
                "cirentouxiang" : result2[0].avatar
            });
        });
    });
}

//所有成员列表
exports.showUserList = function(req, res, next){
    db.find("users", {}, function(err, result){
        res.render("userlist",{
            "login": req.session.login == "1" ? true : false,
            "username": req.session.login == "1" ? req.session.username : "",
            "active" : "成员列表",
            "suoyouchengyuan" : result
        });
    });
}