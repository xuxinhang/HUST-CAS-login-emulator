const fs = require('fs');
const path = require('path');
const ndarray = require('ndarray');
const npyjs = require('npyjs');

const npyLoader = new npyjs();

const charList = [
  { char: '0', filename: './char_0.npy' },
  { char: '1', filename: './char_1.npy' },
  { char: '2', filename: './char_2.npy' },
  { char: '3', filename: './char_3.npy' },
  { char: '4', filename: './char_4.npy' },
  { char: '5', filename: './char_5.npy' },
  { char: '6', filename: './char_6.npy' },
  { char: '7', filename: './char_7.npy' },
  { char: '8', filename: './char_8.npy' },
  { char: '9', filename: './char_9.npy' },
];


async function readNdarrayFromNpyFile (path) {
  const rawBuf = await fs.promises.readFile(path);
  /**
   * the wrong solution:
   *   const buf = Buffer.from(rawBuf);
   * another correct solution:
   *   const buf = new Uint8Array(rawBuf);
   */
  const buf = Buffer.alloc(rawBuf.length);
  rawBuf.copy(buf);
  // console.log(buf, buf.buffer);
  const { data, shape } = npyLoader.parse(buf.buffer);
  return ndarray(data, shape);
}


module.exports = async function () {
  const dataList = await Promise.all(charList.map(item => {
    const filepath = path.join(__dirname, item.filename)
    // console.log(filepath);
    return readNdarrayFromNpyFile(filepath)
      .then(ndarray => ({ char: item.char, ndarray }));
  }));
  return dataList;
};
