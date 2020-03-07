const fs = require('fs');
const { emulateLogin } = require('./raw.js');
const { dispatchRequest } = require('./utils.js');


(async function () {
  // Read username and password from this external file.
  const externConfig = JSON.parse(fs.readFileSync('./config.json', 'utf-8'));

  // The service URL is included in the login page URL of HUST Authentication System
  // Please analyse the login page URL carefully to get the correct service URL, for example
  // For the following login page URL,
  //   "https://pass.hust.edu.cn/cas/login?service=http%3A%2F%2Fm.hust.edu.cn%2Fwechat%2Findex.jsp"
  // its service URL is
  //   "http://m.hust.edu.cn/wechat/index.jsp"
  const serviceURL = 'http://ecard.m.hust.edu.cn:80/wechat-web/QueryController/Queryurl.html';

  const { serviceAuthCookies } = await emulateLogin({
    username: externConfig.username,
    password: externConfig.password,
    serviceURL,
  });

  console.info('Auth cookies: ', serviceAuthCookies);

  // The target URL is used to fetch the data which you needed.
  // [NOTICE] Use a target URL as the service URL might not work.
  const targetURL =
    'http://ecard.m.hust.edu.cn/wechat-web/QueryController/select.html?jsoncallback=call' +
    '&account=222225' +
    '&curpage=1' +
    '&dateStatus=2020-01-01' +
    '&typeStatus=1' +
    '';

  const { payload } = await dispatchRequest({ url: targetURL, cookies: serviceAuthCookies });

  // Process the fetched data further...
  console.log(payload);

})();

