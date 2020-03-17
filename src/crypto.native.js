const crypto = require('crypto');

module.exports.strEnc = strEnc;

const compose = (...fns) => fns.reduce((f, g) => (...args) => f(g(...args)));

const PRE_PERMUTE_TABLE = [ // mergedTableOfSpecialAndReversedNormal
  1, 2, 3, 7, 39, 38, 37, 8,
  9, 10, 11, 15, 47, 46, 45, 16,
  17, 18, 19, 23, 55, 54, 53, 24,
  25, 26, 27, 31, 63, 62, 61, 32,
  33, 34, 35, 36, 6, 5, 4, 40,
  41, 42, 43, 44, 14, 13, 12, 48,
  49, 50, 51, 52, 22, 21, 20, 56,
  57, 58, 59, 60, 30, 29, 28, 64,
];

function permuteByteArrayWithTable (table, arr) {
  const newArr = [];
  for (let j = 0; j < table.length; j+= 8) {
    const slice = table.slice(j, j + 8);
    const arrIndex = j / 8;
    newArr[arrIndex] = slice.reduce((accu, t, i) => {
      const n = t - 1;
      accu |= ((arr[Math.floor(n / 8)] >> (7 - n % 8)) & 1) << (7 - i);
      return accu;
    }, 0);
  }
  return newArr;
}

function strToByteArray (str) {
  const bytes = new Array(Math.ceil(str.length / 4) * 4 * 2);
  for (let i = 0; i < str.length; i++) {
    bytes[i*2 + 1] = str.charCodeAt(i);
  }
  return bytes;
}

function strEnc (sData, ...sKeys) {
  const data = Buffer.from(strToByteArray(sData));
  const keys = sKeys.map(compose(
    Buffer.from,
    a => permuteByteArrayWithTable(PRE_PERMUTE_TABLE, a),
    strToByteArray
  ));
  const ciphers = keys.map(k => crypto.createCipheriv('des-ecb', k, null));
  const result = ciphers.reduce((t, c) => c.update(t), data);
  const resultHexString = result.toString('hex').toUpperCase();
  return resultHexString;
}
