const fs = require('fs');
const qs = require('querystring');
const { dispatchRequest, delayTime } = require('./utils');
const { strEnc } = require('./crypto');

// Read username and password from this external file.
const externConfig = JSON.parse(fs.readFileSync('./config.json', 'utf-8'));

run({
  ...externConfig,
});


async function run({ username, password, serviceTarget }) {
  // const loginPageURL = `https://pass.hust.edu.cn/cas/login?service=${encodeURIComponent(serviceTarget)}`;
  const loginPageURL = `https://pass.hust.edu.cn/cas/login?service=http%3A%2F%2Fecard.m.hust.edu.cn%3A80%2Fwechat-web%2FQueryController%2FQueryurl.html`;
  const loginPageParams = await fetchLoginPage(loginPageURL);
  // await delayTime(100);

  const { location: ticketRedirectTarget } = await requestLogin({
    lt: loginPageParams.lt,
    formAction: 'https://pass.hust.edu.cn' + loginPageParams.formAction,
    _eventId: loginPageParams._eventId,
    execution: loginPageParams.execution,
    cookie_jsessionid: loginPageParams.cookie_jsessionid,
    cookie_BIGip: loginPageParams.cookie_BIGip,
    ...calculateLoginField(username, password, loginPageParams.lt),
    // rsa: '9AB8DB7...',
    // ul: '10',
    // pl: '12',
  });

  console.log(ticketRedirectTarget);

  if ((!ticketRedirectTarget) || ticketRedirectTarget.indexOf('pass.hust') >= 0) {
    console.error('Fail to login.');
    return;
  }

  const { cookies: ticketCookies } = await redirectToTarget(ticketRedirectTarget);

  const targetURL = 'http://ecard.m.hust.edu.cn/wechat-web/QueryController/select.html;jsessionid=24E9167CF245E7AF5238FD4B4C5DE06F?jsoncallback=call&account=222225&curpage=1&dateStatus=2020-01-01&typeStatus=1&_=1583209226870';
  const { payload: body } = await dispatchRequest({ url: targetURL, cookies: ticketCookies });

  console.log(body);
}

function calculateLoginField(username, password, ltCode) {
  return {
    ul: username.length,
    pl: password.length,
    rsa: strEnc(username + password + ltCode, '1', '2', '3'),
  };
}

async function fetchLoginPage(pageURL) {
  const { payload: pageContent, setCookies: cookies } = await dispatchRequest({
    url: pageURL,
    method: 'GET',
  });

  const params = {
    formAction: pageContent.match(/<form id="loginForm" action="(.*?)"/)[1],

    lt: pageContent.match(/<input type="hidden" id="lt" name="lt" value="(.*?)"/)[1],
    execution: pageContent.match(/<input type="hidden" name="execution" value="(.*?)"/)[1],
    _eventId: pageContent.match(/<input type="hidden" name="_eventId" value="(.*?)"/)[1],

    cookie_jsessionid: cookies['JSESSIONID'],
    cookie_BIGip: cookies['BIGipServerpool-icdc-cas2'],
  };

  return params;
}


async function requestLogin(fields) {
  const { rsa, ul, pl, formAction, lt, execution, _eventId, cookie_jsessionid, cookie_BIGip } = fields;

  const { headers: responseHeaders } = await dispatchRequest({
    method: 'POST',
    url: formAction,
    // url: 'https://pass.hust.edu.cn/cas/login?service=http%3A%2F%2Fecard.m.hust.edu.cn%3A80%2Fwechat-web%2FQueryController%2FQueryurl.html',
    cookies: {
      cas_hash: '',
      Language: 'zh_CN',
      JSESSIONID: cookie_jsessionid,
      'BIGipServerpool-icdc-cas2': cookie_BIGip,
    },
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    payload: qs.stringify({
      rsa: rsa,
      ul: ul,
      pl: pl,
      lt: lt,
      execution: execution,
      _eventId: _eventId,
    }),
  });

  console.log(responseHeaders);

  return {
    location: responseHeaders.location,
  };
}


async function redirectToTarget(location) {
  const { headers, setCookies } = await dispatchRequest({
    url: location,
  });

  return { cookies: setCookies, location: headers.location };
}

