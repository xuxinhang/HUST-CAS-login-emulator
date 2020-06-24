const fs = require('fs');
const recognizeCaptcha = require('../src/captcha');

async function testRecognizeCaptcha () {
  const buf = fs.readFileSync('./example-captcha-2.gif');
  const result = await recognizeCaptcha(buf);
  console.log(result);
}

testRecognizeCaptcha();
