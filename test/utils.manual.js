const { dispatchRequest } = require('../src/utils');

(async function () {
  const { resp, data } = await dispatchRequest({
    url: 'https://www.baidu.com',
    method: 'GET',
  });

  console.log(data);
})();


