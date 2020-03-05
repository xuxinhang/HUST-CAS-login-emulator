const superagent = require('superagent');

const agent = superagent.agent();

const loginUrl = 'https://pass.hust.edu.cn/cas/login?service=http%3A%2F%2Fecard.m.hust.edu.cn%3A80%2Fwechat-web%2FQueryController%2FQueryurl.html';

function getPage() {
  return new Promise((resolve, reject) => {
    agent.get(loginUrl)
      .set({
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/66.0.3359.181 Safari/537.36'
      })
      .end((err, res) => {
        if (err) {
          reject(err)
        } else {
          resolve(res.text)
        }
      });
  });
}

async function login(form) {
  return new Promise((resolve, reject) => {
    agent.post(loginUrl)
      .set({
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/66.0.3359.181 Safari/537.36'
      })
      .type('form')
      .send(form)
      .redirects(2)
      .end((err, res) => {
        if (err || !res.ok) {
          reject(err)
        } else {
          resolve(true)
        }
      });
  });
}

async function run() {
  const html = await getPage();
  // console.log(html);
  const lt_code = html.match(/<input type="hidden" id="lt" name="lt" value="(.*?)"/)[1];
  const action_path = html.match(/<form id="loginForm" action="(.*?)"/)[1];

  const form = {
    rsa: '9AB8DB7...',
    ul: 10,
    pl: 12,
    lt: lt_code,
    execution: 'e2s1',
    _eventId: 'submit',
  };

  const result = await login(form);
  console.log(result);
}

run();

