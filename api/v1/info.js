const express = require('express');
const app = express();

const axios = require("axios");
const cheerio = require("cheerio");
const fs = require('fs');
const fetch = require('node-fetch');

const enc = require('../db/encryption');

const soapRequest = require('easy-soap-request');
const convert = require('xml-js');


app.use("/user", require("./users"));
app.use("/guild", require("./guild"));

app.get("/guildInfo", (req,res) => {
    const guildName = req.query.name;
    const urlData = "https://maplestory.nexon.com/Ranking/World/Guild?t=1&n="+encodeURI(guildName);

    const getGuildData = async(callback) => {
        let guildList = [];
        const html = await axios.get(urlData);
        const $ = cheerio.load(html.data);
        const $guildLink = $("div.rank_table_wrap table.rank_table2 tbody tr");
        $guildLink.each((i,elem) => {
            const gwid = $(elem).find('td:nth-child(2) span a').attr("href").replace("/Common/Guild?gid=","").replace("&wid=","-").split("-");
            guildList[i]={
                gName : $(elem).find('td:nth-child(2) span a img').attr("alt"),
                gId : parseInt(gwid[0]),
                wId : parseInt(gwid[1]),
                gLevel : parseInt($(elem).find('td:nth-child(3)').text()),
                gServer : $(elem).find('td:nth-child(4) a span.gd_name img').attr("src"),
                gMaster : $(elem).find('td:nth-child(4) a span.gd_name').text(),
            };
        });

        callback(guildList);
        return guildList;
    }

    getGuildData((guildData) => {
        console.log(guildData);
        res.json(guildData);
    })
});
app.get("/charInfo", (req,res) => {

    const accountid = req.query.accountid;

    let xml =
        `<soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <GetCharacterInfoByAccountID xmlns="http://gnxsoap.nexon.com/soap/">
      <AccountID>${accountid}</AccountID>
    </GetCharacterInfoByAccountID>
  </soap:Body>
</soap:Envelope>
`
    const url = "http://api.maplestory.nexon.com/soap/maplestory.asmx?wsdl";
    const sampleHeaders = {
        'Content-Type':'text/xml; charset=utf-8',
        'Content-Length':xml.length,
        'SOAPAction':"http://gnxsoap.nexon.com/soap/GetCharacterInfoByAccountID"
    };



    getUserData = async(callBack) => {
        try{
            const { response } = await soapRequest({
                url : url,
                headers : sampleHeaders,
                xml : xml,
                timeout : 1000
            });
            const { header, body, statusCode } = response;

            var xmlToJson = convert.xml2json(body, {compact: true, spaces: 4});

            callBack(xmlToJson);
        } catch (error){
            console.error(error);
        }
    }

    getUserData( (userXML) => {
        const jsonData = JSON.parse(userXML)['soap:Envelope']['soap:Body']['GetCharacterInfoByAccountIDResponse']['GetCharacterInfoByAccountIDResult']['diffgr:diffgram']['NewDataSet']['UserInfo'];

        getUserSeedRank = async (callback) => {
            const html = await axios.get("https://maplestory.nexon.com/Ranking/World/Seed/ThisWeek?c=" + encodeURI(jsonData.CharacterName._text));
            const $ = cheerio.load(html.data);
            const body = $("tr.search_com_chk");
            let list = [
                {
                    ranking : null,
                    floors : null,
                    times : null
                }
            ]

            let rank = body.find("td p.ranking_other").text().slice(1).replace(/ /gi,"");
            if(rank == ""){
                rank = body.find("td p.ranking_num img").attr("alt");
                if(rank == undefined){
                    callback(list);
                    return list;
                }
            }

            body.each((i,elem) => {
                list[i] = {
                    ranking : rank,
                    floors : body.find("td:nth-child(4)").text(),
                    times : body.find("td:nth-child(5)").text(),

                }
            });

            callback(list);
        }

        getUserSeedRank( (seedRankData) =>{

            getUserDojangRank = async (callback) => {
                const html = await axios.get("https://maplestory.nexon.com/Ranking/World/Dojang/LastWeek?c=" + encodeURI(jsonData.CharacterName._text) + "&t=2");
                const $ = cheerio.load(html.data);
                const body = $("tr.search_com_chk");

                let list = [
                    {
                        ranking : null,
                        floors : null,
                        times : null
                    }
                ]

                let rank = body.find("td p.ranking_other").text().slice(1).replace(/ /gi,"");
                if(rank == ""){
                    rank = body.find("td p.ranking_num img").attr("alt");
                    if(rank == undefined){
                        callback(list);
                        return list;
                    }
                }



                body.each((i,elem) => {
                    list[i] = {
                        ranking : rank,
                        floors : body.find("td:nth-child(4)").text(),
                        times : body.find("td:nth-child(5)").text(),

                    }
                });

                callback(list);
            }

            getUserDojangRank((dojangRankData)=>{

                const userData = {
                    userAccountID : parseInt(req.query.accountid),
                    userNickName : jsonData.CharacterName._text,
                    userWorldName : jsonData.WorldName._text,
                    userAvatarImgUrl : jsonData.AvatarImgURL._text,
                    userLevel : parseInt(jsonData.Lev._text),
                    userExp : parseInt(jsonData.Exp._text),
                    userJob : jsonData.JobDetail._text,
                    userToRank : parseInt(jsonData.TotRank._text),
                    userWorldRank : parseInt(jsonData.WorldRank._text),
                    userDojangRank : parseInt(dojangRankData[0].ranking),
                    userDojangFloor : parseInt(dojangRankData[0].floors),
                    userDojangTime : dojangRankData[0].times,
                    userSeedRank : parseInt(seedRankData[0].ranking),
                    userSeedFloor : parseInt(seedRankData[0].floors),
                    userSeedTime : seedRankData[0].times
                }

                async function download(url, filename) {
                    const response = await fetch(url);
                    const buffer = await response.buffer();
                    fs.writeFile(`./public/images/${filename}.png`, buffer, () =>
                        console.log(`finished downloading! to :::: ${filename}.png`));
                }

                download(userData.userAvatarImgUrl , enc.b64e(userData.userAccountID.toString()))

                res.json(userData);
                res.end();
            });
        });
    });
});
app.get("/guildUserList", (req,res) =>{

    const gid = req.query.gid;
    const wid = req.query.wid;
    const guildPageUrl = "https://maplestory.nexon.com/Common/Guild?gid=" + gid + "&wid=" + wid;

    const getGuildUserData = async(callback) => {

        const html = await axios.get(guildPageUrl);
        const $ = cheerio.load(html.data);

        const guildRankList = [{
            aRank : parseInt($('div.char_info_top div.char_info dl:nth-child(1) dd.num').text().replace(" 위","")),
            wRank : parseInt($('div.char_info_top div.char_info dl:nth-child(2) dd.num').text().replace("위",""))
        }];

        const guildInfoData = $('div.char_info_top div.char_info_tb div.info_tb_wrap ul.info_tb_left_list');
        const guildInfoDataList=[{
            world : guildInfoData.find("li:nth-child(1)").text().slice(2),
            master : guildInfoData.find("li:nth-child(2)").text().slice(6),
            reputation : parseInt(guildInfoData.find("li:nth-child(3)").text().slice(6).replace(/,/gi,"")),
            guildUserCnt : parseInt(guildInfoData.find("li:nth-child(4)").text().slice(5,-1))
        }];


        const guildMasterData = $('div.char_info_top div.char_info_tb div.info_tb_wrap');
        const guildMasterDataList = [{
            masterImg : guildMasterData.find('div.char_img2 img').attr("src"),
            masterJob : guildMasterData.find('ul.info_tb_left_list2 li:nth-child(1)').text().slice(2),
            masterLev : parseInt(guildMasterData.find('ul.info_tb_left_list2 li:nth-child(2)').text().slice(2)),
            masterExp : parseInt(guildMasterData.find('ul.info_tb_left_list2 li:nth-child(3)').text().slice(3).replace(/,/gi,"")),
            masterPop : parseInt(guildMasterData.find('ul.info_tb_left_list2 li:nth-child(4)').text().slice(3)),

        }];

        let guildUserListPageCnt = $("div.guild_user_list div.page_numb a").text();
        guildUserListPageCnt = guildUserListPageCnt.slice(-1) > 0 ? guildUserListPageCnt.slice(-1) : 10;
        const guildUserDataList = [];
        let cnt = 0;
        for(let index = 1 ; index <= guildUserListPageCnt ; index++){
            const html2 = await axios.get(guildPageUrl+"&orderby=0&page="+index);
            const chri = cheerio.load(html2.data);
            const guildUserData = chri("div.center_wrap div#container div.top_bg div.guild_user_list table.rank_table tbody").children("tr");
            guildUserData.each((i,elem) => {

                guildUserDataList[cnt] = {
                    status : chri(elem).find("td:nth-child(1)").text(),
                    charImg : chri(elem).find("td:nth-child(2) span.char_img img").attr("src"),
                    charNick : chri(elem).find("td:nth-child(2) span.char_img img").attr("alt"),
                    charJob : chri(elem).find("td:nth-child(2) dl dd").text(),
                    charLev : parseInt(chri(elem).find("td:nth-child(3)").text().slice(3)),
                    charExp : parseInt(chri(elem).find("td:nth-child(4)").text().replace(/,/gi,"")),
                    charPop : parseInt(chri(elem).find("td:nth-child(5)").text()),
                }
                cnt++;
            });
        }


        const guildTotalData = [{
            guildRank : guildRankList,
            guildInfoData : guildInfoDataList,
            guildMasterData : guildMasterDataList,
            guildUserDataList : guildUserDataList,
        }]

        callback(guildTotalData);
    }

    getGuildUserData((guildUserList) => {
        res.json(guildUserList);
    });
});



module.exports = app;