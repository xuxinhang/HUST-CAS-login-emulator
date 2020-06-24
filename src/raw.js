const qs = require('querystring');
const { dispatchRequest } = require('./utils');
const { strEnc } = require('./crypto');
// const { strEnc } = require('./crypto.native'); // How about having a try?
const recognizeCaptcha = require('./captcha');

module.exports.emulateLogin = emulateLogin;
module.exports.dispatchRequest = dispatchRequest; // export this helpful utility function
module.exports.recognizeCaptcha = recognizeCaptcha;


async function emulateLogin({ username, password, serviceURL }) {
  const loginPageURL = `https://pass.hust.edu.cn/cas/login?service=${encodeURIComponent(serviceURL)}`;

  console.info('Fetching the login page.');
  const loginPageParams = await fetchLoginPage(loginPageURL);
  // await delayTime(100);


  const captchaImageBuf = await fetchCaptchaImage({
    cookie_jsessionid: loginPageParams.cookie_jsessionid,
    cookie_BIGip: loginPageParams.cookie_BIGip,
  });
  const captchaChars = await recognizeCaptcha(captchaImageBuf);
  const captchaString = captchaChars.join('');
  console.info('Recognized CAPTCHA string: ', captchaString);


  console.info('Submitting the login form.');
  const { location: ticketRedirectTarget } = await requestLogin({
    lt: loginPageParams.lt,
    formAction: 'https://pass.hust.edu.cn' + loginPageParams.formAction,
    _eventId: loginPageParams._eventId,
    execution: loginPageParams.execution,
    cookie_jsessionid: loginPageParams.cookie_jsessionid,
    cookie_BIGip: loginPageParams.cookie_BIGip,
    code: captchaString,
    // rsa: '9AB8DB7...', ul: '11', pl: '22',
    ...calculateLoginField(username, password, loginPageParams.lt),
  });

  if ((!ticketRedirectTarget) || ticketRedirectTarget.indexOf('pass.hust') >= 0) {
    console.error('An unexpected redirect URL is returned.');
    throw 'An unexpected redirect URL is returned.';
  }

  console.info(`Redirecting to "${ticketRedirectTarget}" ...`);

  const { cookies: ticketCookies } = await redirectToTarget(ticketRedirectTarget);

  return { serviceAuthCookies: ticketCookies };
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

async function fetchCaptchaImage (fields) {
  const imageURL = 'https://pass.hust.edu.cn/cas/code';
  const { payload: imageDataBuf } = await dispatchRequest({
    method: 'GET',
    url: imageURL,
    cookies:{
      cas_hash: '',
      Language: 'zh_CN',
      JSESSIONID: fields.cookie_jsessionid,
      'BIGipServerpool-icdc-cas2': fields.cookie_BIGip,
    },
    payloadParser: x => x,
  });

  return imageDataBuf;
}


async function requestLogin(fields) {
  const { code, rsa, ul, pl, formAction, lt, execution, _eventId, cookie_jsessionid, cookie_BIGip } = fields;

  const { headers: responseHeaders } = await dispatchRequest({
    method: 'POST',
    url: formAction,
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
      code: code,
      rsa: rsa,
      ul: ul,
      pl: pl,
      lt: lt,
      execution: execution,
      _eventId: _eventId,
    }),
  });

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

