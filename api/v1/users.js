const express = require('express');
const app = express();

const enc = require('../db/encryption');
const pool = require('../db/pool');

app.post('/register',(req, res) => {

    getConnection = async (callback) =>{

        try{
            const conn = await pool.dbconn().getConnection();

            const rows = await conn.query(
                "INSERT INTO user(accountid,id,pw,nickname,level,server,job,gid,exp,charImg) VALUES(?,?,?,?,?,?,?,?,?,?)",
                [
                    parseInt(req.body.aid),
                    req.body.id,
                    enc.b64e(enc.b64e(req.body.pw)),
                    req.body.nick,
                    parseInt(req.body.lev),
                    req.body.server,
                    req.body.job,
                    parseInt(req.body.gid),
                    parseInt(req.body.exp),
                    enc.b64e(req.body.aid.toString()+".png")
                ]
            );

            callback(rows);
        }catch(err){
            callback(err.sqlState);
        }
    }

    getConnection((rows) =>{
        console.log(rows);
        res.end();
    });

});
app.post('/register/check', (req, res) => {


    getConnection = async (callback) =>{
        if(req.body.id != undefined){
            try{
                const conn = await pool.dbconn().getConnection();
                const row = await conn.query("select id from user WHERE id=?", [req.body.id]);
                if(row[0] != undefined) callback(1);
                else if(row[0] == undefined) callback(0);
            }catch(err){
                console.log(err);
            }
        }else if(req.body.accountid != undefined){
            try{
                const conn = await pool.dbconn().getConnection();
                const row = await conn.query("select id from user WHERE accountid=?", [req.body.accountid]);
                if(row[0] != undefined) callback(1);
                else if(row[0] == undefined) callback(0);
            }catch(err){
                console.log(err);
            }
        }else{
            res.end();
        }
    }

    getConnection((rows) =>{
        console.log(rows);
        res.end();
    });

})
app.post('/login',(req, res) => {

    getUserLogin = async (callback) =>{

        const sql = "select id,pw from user where id=?;"
        const param = [ req.body.userid ]

        try{
            const conn = await pool.dbconn().getConnection();
            conn.query(sql,param);

            callback("haveUserData");
        }catch (e) {
            if(e.name == "TypeError") {
                console.log(e.name);
                callback("no userData");
            }
            return 0;
        }

    }

    getUserLogin = (userData) => {
        if(userData == "haveUserData") console.log("굳");
        else if (userData == "no userData") console.log("없는아이디");
    }

})

module.exports = app;