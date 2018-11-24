/**
 * Created by 1 on 2018/6/23.
 */
var express = require("express");
var app = express();
var router = require("./router/router.js");
var session = require('express-session');

//使用session
app.use(session({
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: true
}));

//模板引擎
app.set("view engine", "ejs");

//静态页面
app.use(express.static("./public"));
app.use("/avatar", express.static("./avatar"));

//路由表
app.get("/", router.showIndex);               //显示首页
app.get("/regist", router.showRegist);        //显示注册页
app.get("/login",router.showLogin);           //显示登录页
app.post("/doRegist", router.doRegist);       //执行注册 Ajax服务
app.post("/doLogin", router.doLogin);         //执行登录 Ajax服务
app.get("/setavatar", router.showSetavatar);  //显示设置头像页
app.post("/dosetavatar", router.doSetavatar); //执行设置头像 Ajax服务
app.get("/cut", router.showCut);              //显示裁剪头像页
app.get("/docut", router.doCut);              //执行裁剪头像 Ajax服务
app.post("/post", router.doPost);             //执行发表说说 Ajax服务
app.get("/getAllShuoshuo", router.getAllShuoshuo);  //获取全部说说  Ajax服务
app.get("/getUserInfo", router.getUserInfo);  //获取某个用户信息 Ajax服务
app.get("/getshuoshuoAmount", router.getshuoshuoAmount); //获取说说总数
app.get("/user/:username", router.showUser);      //获取用户列表
app.get("/userlist", router.showUserList);     //显示成员列表

//监听端口
app.listen(3000,"127.0.0.1");