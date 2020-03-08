var qs = require("querystring");
var http = require("https");
var axios = require('axios').default;


async function get_lt_code() {
  const cas_url = 'https://pass.hust.edu.cn/cas/login?service=http%3A%2F%2Fecard.m.hust.edu.cn%3A80%2Fwechat-web%2FQueryController%2FQueryurl.html';
  const resp_first = await axios.get(cas_url)

  const html = resp_first.data;

  const lt_code = html.match(/<input type="hidden" id="lt" name="lt" value="(.*?)"/)[1];
  const action_path = html.match(/<form id="loginForm" action="(.*?)"/)[1];

  // const cookie_jsessionid = resp_first.headers.cookie.match(/JSESSIONID=(.*?);/)[1];
  const cookie_jsessionid = '';

  const cookies = resp_first.headers['set-cookie'].reduce((accu, c) => {
    const mats = c.match(/^(.*?)=(.*?);/);
    accu[mats[1]] = mats[2];
    return accu;
  }, {});

  return { lt_code, action: action_path, cookies };
}

async function request_login(url, params, cookies) {
  const resp = await axios.request({
    method: 'POST',
    url: url,
    headers: {
      'content-type': 'application/x-www-form-urlencoded',
      'cookie': Object.entries(cookies).reduce((accu, [k, v]) => {
        return accu + `; ${k}=${v}`;
      }, ''),
    },
    data: qs.stringify(params),
  });
  console.log(qs.stringify(params))

  const location = resp.headers.location;
  console.log(location);
  return location;
}

async function run() {
  const { lt_code, action, cookies } = await get_lt_code();
  const params = {
    rsa: '9AB8DB7...',
    ul: 10,
    pl: 12,
    lt: lt_code,
    execution: 'e2s1',
    _eventId: 'submit',
  };

  const location = await request_login(`https://pass.hust.edu.cn${action}`, params, cookies);
  return location;
}

run();


return;
var options = {
  "method": "POST",
  "hostname": [
    "pass",
    "hust",
    "edu",
    "cn"
  ],
  "path": [
    "cas",
    "login;jsessionid=YxOfermPYWkMk3CVnKXGGmNj3iFFjbyS7bKf_KnGPC1O4qdUxtCC%21282606594"
  ],
  "headers": {
    "Content-Type": "application/x-www-form-urlencoded",
    "Origin": "https://pass.hust.edu.cn",
    "Cookie": "cas_hash=; Language=zh_CN; JSESSIONID=YxOfermPYWkMk3CVnKXGGmNj3iFFjbyS7bKf_KnGPC1O4qdUxtCC!282606594; BIGipServerpool-icdc-cas2=1829048492.25627.0000,cas_hash=; Language=zh_CN; JSESSIONID=YxOfermPYWkMk3CVnKXGGmNj3iFFjbyS7bKf_KnGPC1O4qdUxtCC!282606594; BIGipServerpool-icdc-cas2=1829048492.25627.0000; Language=zh_CN; JSESSIONID=utifhtKHH3RFClg4bAxglSlskVO-eviywxDu6Vv39rEZbzEYnB4P!282606594",
    "User-Agent": "PostmanRuntime/7.13.0",
    "Accept": "*/*",
    "Cache-Control": "no-cache",
    "Postman-Token": "d58e4f00-b9d6-4e43-980b-a8e17fa3fddf,069d574e-0016-4910-bc5f-c0ef0c4872f4",
    "accept-encoding": "gzip, deflate",
    "referer": "https://pass.hust.edu.cn/cas/login;jsessionid=YxOfermPYWkMk3CVnKXGGmNj3iFFjbyS7bKf_KnGPC1O4qdUxtCC!282606594?service=http%3A%2F%2Fecard.m.hust.edu.cn%3A80%2Fwechat-web%2FQueryController%2FQueryurl.html",
    "Connection": "keep-alive",
    "cache-control": "no-cache"
  }
};

var req = http.request(options, function (res) {
  var chunks = [];

  res.on("data", function (chunk) {
    chunks.push(chunk);
  });

  res.on("end", function () {
    var body = Buffer.concat(chunks);
    console.log(body.toString());
  });
});

req.write(qs.stringify({ rsa: '9AB8DB7...',
  ul: '10',
  pl: '12',
  lt: 'LT-13320-7EGvZedalAbt2Ey0tSyyTgFpb4oAPx-cas',
  execution: 'e1s1',
  _eventId: 'submit' }));
req.end();
