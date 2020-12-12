const express = require('express');
const app = express();

const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const fetch = require('node-fetch');

const enc = require('../db/encryption');
const pool = require('../db/pool');

app.get("/userUpdate", (req, res) => {

    const gid = req.query.gid;
    const wid = req.query.wid;
    const guildPageUrl = "https://maplestory.nexon.com/Common/Guild?gid=" + gid + "&wid=" + wid;

    const getGuildUserData = async (callback) => {

        const html = await axios.get(guildPageUrl);
        const $ = cheerio.load(html.data);

        const guildRankList = [{
            aRank: parseInt($('div.char_info_top div.char_info dl:nth-child(1) dd.num').text().replace(" 위", "")),
            wRank: parseInt($('div.char_info_top div.char_info dl:nth-child(2) dd.num').text().replace("위", ""))
        }];

        const guildInfoData = $('div.char_info_top div.char_info_tb div.info_tb_wrap ul.info_tb_left_list');
        const guildInfoDataList = [{
            world: guildInfoData.find("li:nth-child(1)").text().slice(2),
            master: guildInfoData.find("li:nth-child(2)").text().slice(6),
            reputation: parseInt(guildInfoData.find("li:nth-child(3)").text().slice(6).replace(/,/gi, "")),
            guildUserCnt: parseInt(guildInfoData.find("li:nth-child(4)").text().slice(5, -1))
        }];


        const guildMasterData = $('div.char_info_top div.char_info_tb div.info_tb_wrap');
        const guildMasterDataList = [{
            masterImg: guildMasterData.find('div.char_img2 img').attr("src"),
            masterJob: guildMasterData.find('ul.info_tb_left_list2 li:nth-child(1)').text().slice(2),
            masterLev: parseInt(guildMasterData.find('ul.info_tb_left_list2 li:nth-child(2)').text().slice(2)),
            masterExp: parseInt(guildMasterData.find('ul.info_tb_left_list2 li:nth-child(3)').text().slice(3).replace(/,/gi, "")),
            masterPop: parseInt(guildMasterData.find('ul.info_tb_left_list2 li:nth-child(4)').text().slice(3)),

        }];

        let guildUserListPageCnt = $("div.guild_user_list div.page_numb a").text();
        guildUserListPageCnt = guildUserListPageCnt.slice(-1) > 0 ? guildUserListPageCnt.slice(-1) : 10;
        const guildUserDataList = [];
        let cnt = 0;
        for (let index = 1; index <= guildUserListPageCnt; index++) {
            const html2 = await axios.get(guildPageUrl + "&orderby=0&page=" + index);
            const chri = cheerio.load(html2.data);
            const guildUserData = chri("div.center_wrap div#container div.top_bg div.guild_user_list table.rank_table tbody").children("tr");
            guildUserData.each((i, elem) => {

                guildUserDataList[cnt] = {
                    status: chri(elem).find("td:nth-child(1)").text(),
                    charImg: chri(elem).find("td:nth-child(2) span.char_img img").attr("src"),
                    charNick: chri(elem).find("td:nth-child(2) span.char_img img").attr("alt"),
                    charJob: chri(elem).find("td:nth-child(2) dl dd").text(),
                    charLev: parseInt(chri(elem).find("td:nth-child(3)").text().slice(3)),
                    charExp: parseInt(chri(elem).find("td:nth-child(4)").text().replace(/,/gi, "")),
                    charPop: parseInt(chri(elem).find("td:nth-child(5)").text()),
                }
                cnt++;
            });

        }



        const guildTotalData = [{
            guildRank: guildRankList,
            guildInfoData: guildInfoDataList,
            guildMasterData: guildMasterDataList,
            guildUserDataList: guildUserDataList,
        }]

        callback(guildTotalData);
    }

    getGuildUserData((guildUserList) => {
        const userList = guildUserList[0].guildUserDataList.length;

        connection = async (callback) => {
            const conn = await pool.dbconn().getConnection()

            for (let i = 0; i < userList; i++) {
                let pushData = guildUserList[0].guildUserDataList[i];

                download = async () => {
                    const url = pushData.charImg;
                    const filename = enc.b64e(pushData.charNick)
                    try {
                        const response = await fetch(url);
                        const buffer = await response.buffer();
                        fs.writeFile(`./public/guildUserImg/${filename}.png`, buffer, () =>
                            console.log(`finished downloading! to :::: ${filename}.png`));
                    } catch (e) {
                        console.log(e);
                    }
                }

                try{
                    //최초 등록
                    const sql = "INSERT INTO guildUserList(gid,nickname,level,exp,status,charImg,charJob,charPop) VALUES(?,?,?,?,?,?,?,?)";
                    const params = [parseInt(gid), pushData.charNick, pushData.charLev, pushData.charExp, pushData.status, "http://localhost:3000/static/guildUserImg/"+enc.b64e(pushData.charNick)+".png", pushData.charJob, pushData.charPop];
                    await conn.query("SELECT dRank from guildUserList WHERE nickname =?",[pushData.charNick]);
                    await conn.query(sql, params);

                }catch (e){
                    console.log(e.sqlState);

                    await conn.query("UPDATE guildUserList SET level=?, exp=?, charImg=? WHERE nickname=?",
                        [pushData.charLev, pushData.charExp, "http://localhost:3000/static/guildUserImg/"+enc.b64e(pushData.charNick) , pushData.charNick]);


                }
                download();
            }

            await conn.end();

        }

        connection();
        res.end();
    });

})
app.get("/getList", (req, res) => {
    getUser = async (callback) =>{
        try {

            const conn = await pool.dbconn().getConnection()
            const gid = req.query.gid;

            const sql = "SELECT * FROM guildUserList WHERE gid="+parseInt(gid);
            const row = await conn.query(sql);

            callback(row);

        } catch (e){
            console.log(e)
        }
    }

    getUser((jsonData) => {
        res.json(jsonData);
    })
})

module.exports = app;