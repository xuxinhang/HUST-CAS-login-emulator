const http = require('https');
const qs = require('querystring');
const axios = require('axios');


run();

async function run() {
  var { resp, body: html } = await fetchLoginPage();

  const lt_code = html.match(/<input type="hidden" id="lt" name="lt" value="(.*?)"/)[1];
  const action_path = html.match(/<form id="loginForm" action="(.*?)"/)[1];
  const execution = html.match(/<input type="hidden" name="execution" value="(.*?)"/)[1];
  const _eventId = html.match(/<input type="hidden" name="_eventId" value="(.*?)"/)[1];
  const cookies = resp.headers['set-cookie'].reduce((accu, c) => {
    const mats = c.match(/^(.*?)=(.*?);/);
    accu[mats[1]] = mats[2];
    return accu;
  }, {});

  var { resp, body } = await requestLogin({
    rsa: '9AB8DB7...',
    ul: '10',
    pl: '12',
    lt: lt_code,
    action: action_path,
    _eventId,
    execution,
    cookie_jsessionid: cookies['JSESSIONID'],
    cookie_BIGip: '1778585772.25371.0000',
  });

  console.log(resp.headers);

  // const redirectTarget = resp.headers.location;
  // const response = await redirectToTarget(redirectTarget);
  // console.log(response.data);
}

function fetchLoginPage() {
  return new Promise((resolve, reject) => {
    var options = {
      "method": "GET",
      "hostname": "pass.hust.edu.cn",
      "path": '/cas/login?service=http%3A%2F%2Fecard.m.hust.edu.cn%3A80%2Fwechat-web%2FQueryController%2FQueryurl.html',
      "headers": {
        "Connection": "keep-alive",
        "Upgrade-Insecure-Requests": "1",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.122 Safari/537.36",
        "Sec-Fetch-Dest": "document",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9",
        "Sec-Fetch-Site": "none",
        "Sec-Fetch-Mode": "navigate",
        "Sec-Fetch-User": "?1",
        "Accept-Language": "zh-CN,zh;q=0.9",
        "cache-control": "no-cache",
      }
    };

    var req = http.request(options, function (res) {
      var chunks = [];

      res.on("data", function (chunk) {
        chunks.push(chunk);
      });

      res.on("end", function () {
        var body = Buffer.concat(chunks);
        resolve({  resp: res, body: body.toString() });
      });
    });

    req.end();
  });
}


function requestLogin(fields) {
  const { rsa, ul, pl, action, lt, execution, _eventId, cookie_jsessionid, cookie_BIGip } = fields;
  console.log(fields);

  return new Promise((resolve, reject) => {
    var options = {
      "method": "POST",
      "hostname": "pass.hust.edu.cn",
      "path": action,
      "headers": {
        "Connection": "keep-alive",
        "Cache-Control": "max-age=0",
        "Origin": "https://pass.hust.edu.cn",
        "Upgrade-Insecure-Requests": "1",
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.122 Safari/537.36",
        "Sec-Fetch-Dest": "document",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9",
        "Sec-Fetch-Site": "same-origin",
        "Sec-Fetch-Mode": "navigate",
        "Sec-Fetch-User": "?1",
        // "Referer": "https://pass.hust.edu.cn/cas/login?service=http%3A%2F%2Fecard.m.hust.edu.cn%3A80%2Fwechat-web%2FQueryController%2Fselect.html%3Fjsoncallback%3DjQuery21403702775902602937_1583209226868%26account%3D222225%26curpage%3D1%26dateStatus%3D2020-01-01%26typeStatus%3D1%26_%3D1583209226870",
        "Accept-Language": "zh-CN,zh;q=0.9",
        "Cookie": `cas_hash=; Language=zh_CN; JSESSIONID=${cookie_jsessionid}`, // ; BIGipServerpool-icdc-cas2=${cookie_BIGip}`,
        // "Cookie": "cas_hash=; Language=zh_CN; JSESSIONID=znGgEZzv502ePNjyX5s0bJF1BlXAbMnINbswm69GB2O5K8uOmfhc\\u0021-74779814; BIGipServerpool-icdc-cas2=1778585772.25371.0000",
        "cache-control": "no-cache",
      }
    };

    var req = http.request(options, function (res) {
      var chunks = [];

      res.on("data", function (chunk) {
        chunks.push(chunk);
      });

      res.on("end", function () {
        var body = Buffer.concat(chunks);
        // console.log(body.toString());
        resolve({ resp: res, body: body.toString() });
      });
    });

    req.write(qs.stringify({
      rsa: rsa, // rsa: '9AB8DB7...',
      ul: ul, // ul: '10',
      pl: pl, // pl: '12',
      lt: lt, // lt: 'LT-19406-vr6bin5NK6te6pfEiuvYHtZzK6i9Tj-cas',
      execution: execution, // execution: 'e1s1',
      _eventId: _eventId, // _eventId: 'submit',
    }));
    req.end();
  });
}


function redirectToTarget(location) {
  return axios.request({
    method: 'GET',
    url: location,
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.122 Safari/537.36",
    },
  });
}
