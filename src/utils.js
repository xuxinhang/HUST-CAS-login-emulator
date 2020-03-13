const { URL } = require('url');
const http = require('http');
const https = require('https');

module.exports.serializeCookies = serializeCookies;
module.exports.getSetCookies = getSetCookies;
module.exports.dispatchRequest = dispatchRequest;
module.exports.delayTime = delayTime;


function delayTime(ms) {
  return new Promise((resolve) => {
    setTimeout(() => resolve(), ms);
  });
}

function getSetCookies (setCookieArray) {
  if (!setCookieArray) return {};

  const cookies = setCookieArray.reduce((accu, c) => {
    const mats = c.match(/^(.*?)=(.*?);/);
    accu[mats[1]] = mats[2];
    return accu;
  }, {});

  return cookies;
}

function serializeCookies (cookies) {
  return Object.keys(cookies).map(k => `${k}=${cookies[k]}`).join('; ');
}

function constructRequestOptionFromUrl (url, base) {
  // var fullPath = buildFullPath(config.baseURL, config.url);
  var fullPath = url; // [TODO]
  var parsed = new URL(fullPath);
  var protocol = parsed.protocol || 'http:';


  var options = {
    protocol: protocol,
    hostname: parsed.hostname,
    path: parsed.pathname + parsed.search,
    auth: parsed.auth,
    port: parsed.port,
  };

  return options;
}

function mergeRequestOptionObject (...options) {
  return options.reduce((accu, curt) => {
    const opt = { ...accu, ...curt };
    if (accu.headers && curt.headers) {
      opt.headers = { ...accu.headers, ...curt.headers };
    }
    return opt;
  });
}

function dispatchRequest(config) {
  const { url, cookies, payload, ...misc } = config;
  const options = mergeRequestOptionObject(
    defaultOptions,
    constructRequestOptionFromUrl(url),
    { headers: cookies ? { Cookie: serializeCookies(cookies) } : {} },
    misc,
  );

  const protocol = options.protocol;
  const isHttps = protocol.startsWith('https');
  const transport = isHttps ? https : http;

  // console.log(options);
  return new Promise((resolve, reject) => {
    var req = transport.request(options, function (res) {
      var chunks = [];

      res.on('data', function (chunk) {
        chunks.push(chunk);
      });

      res.on('end', function () {
        var body = Buffer.concat(chunks);
        const setCookies = getSetCookies(res.headers['set-cookie']);
        resolve({ resp: res, payload: body.toString(), setCookies, headers: res.headers });
      });
    });

    req.on('error', function (e) {
      reject(e);
    });

    if (payload) {
      req.write(payload);
    }

    req.end();
  });
}

const defaultOptions = {
  "method": "GET",
  "headers": {
    "Connection": "keep-alive",
    "Upgrade-Insecure-Requests": "1",
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.132 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9",
    "Accept-Language": "zh-CN,zh;q=0.9",
    "cache-control": "no-cache",
  },
};
