const express = require('express');
const app = express();

const pool = require('../db/pool');



app.get('/register',(req, res) => {

    const jsonData =[{
        aid : 109225207,
        id:"test",
        pw:"1234",
        nick : "아재의쌍칼",
        server : "크로아",
        lev : 210,
        exp : 6374973469,
        job : "듀얼블레이더",
        gid : 254315,
        charimg : "",
    }];

    base64encode = (plaintext) => {
        return Buffer.from(plaintext, "utf8").toString('base64');
    }

    base64decode = (base64text) => {
        return Buffer.from(base64text, 'base64').toString('utf8');
    }

    getConnection = async(callback) =>{

        try{
            const conn = await pool.dbconn().getConnection();

            console.log(typeof(jsonData[0].id));
            const rows = await conn.query(
                "INSERT INTO user(accountid,id,pw,nickname,level,server,job,gid,exp,charImg) VALUES(?,?,?,?,?,?,?,?,?,?)",
                [
                    jsonData[0].aid,
                    jsonData[0].id,
                    jsonData[0].pw,
                    jsonData[0].nick,
                    jsonData[0].lev,
                    jsonData[0].server,
                    jsonData[0].job,
                    jsonData[0].gid,
                    jsonData[0].exp,
                    base64decode(jsonData[0].aid+".png")
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