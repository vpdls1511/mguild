const express = require('express');
const app = express();

const pool = require('../db/pool');

app.post('/register',(req, res) => {
    base64encode = (plaintext) => {
        return Buffer.from(plaintext, "utf8").toString('base64');
    }

    base64decode = (base64text) => {
        return Buffer.from(base64text, 'base64').toString('utf8');
    }

    getConnection = async(callback) =>{

        try{
            const conn = await pool.dbconn().getConnection();

            if( base64encode(base64encode(req.body.pw)) == base64decode(base64decode(req.body.pw)) ) console.log("corrent");

            const rows = await conn.query(
                "INSERT INTO user(accountid,id,pw,nickname,level,server,job,gid,exp,charImg) VALUES(?,?,?,?,?,?,?,?,?,?)",
                [
                    parseInt(req.body.aid),
                    req.body.id,
                    base64encode(base64encode(req.body.pw)),
                    req.body.nick,
                    parseInt(req.body.lev),
                    req.body.server,
                    req.body.job,
                    parseInt(req.body.gid),
                    parseInt(req.body.exp),
                    base64encode(req.body.aid.toString()+".png")
                ]
            );

            callback(rows);
        }catch(err){
            console.log(err);
        }
    }

    getConnection((rows) =>{
        console.log(rows);
        res.end();
    });

});

module.exports = app;