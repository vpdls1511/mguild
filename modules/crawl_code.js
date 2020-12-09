const axios = require("axios");
const cheerio = require("cheerio");
const log = console.log;

let nickNameUrl = "https://maplestory.nexon.com/Common/Character/Detail/"
    +encodeURI("아재의쌍칼")
    +"/Ranking?p=mikO8qgdC4hElCwBGQ6GOx8CmO11EvduZkV0bRbPAhZqDCipM1QLvS8Oas7MpgMxWV9v2CZvhBXc44zXBYkE9RuLHC%2frdl3K8PrNToCwgjLjyi7tEoCbP5cYCUHAYmJozAqJobYfq3jXFdhyV%2bqpn6dnVMDY2Bn4JoRGZ8k6kYj6cWVv89XEzGfAbapwZVty"

exports.crawl = () => {

    const getHtml = async (callBackFunc) => {
        const html = await axios.get(nickNameUrl);

        let ulList = [];
        const $ = cheerio.load(html.data);
        const $bodyList = $("div#wrap").children("div.center_wrap");

        $bodyList.each(function(i, elem) {
            ulList[i] = {
                nickname: $bodyList.find('div.char_info_top div.char_name span').text().slice(0,-1)
            };
        });

        const data = ulList.filter(n => n.nickname);
        callBackFunc(data);
        return data;
    };

    return getHtml( (callbackData) => {
        return callbackData;
    });

}