const { dispatchRequest } = require('./utils');

(async function () {
  const { resp, data } = await dispatchRequest({
    url: 'https://www.baidu.com',
    method: 'GET',
  });

  console.log(data);
})();


