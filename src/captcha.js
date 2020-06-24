const util = require('util');
const getPixels = util.promisify(require('get-pixels'));
const ops = require('ndarray-ops');
const pool = require('ndarray-scratch');
// const nj = require('numjs');
const loadCharTmplData = require('./stdchar');


module.exports = recognizeCaptcha;

// const charTmplDataCache = null;

async function recognizeCaptcha (buffer) {
  const pixels = await getPixels(buffer, 'image/gif');
  // assign here pixels is a 4D array

  const originalFrames = [];
  for (let f = 0; f < pixels.shape[0]; f++) {
    originalFrames.push(pixels.pick(f, null, null, 0));
    originalFrames.push(pixels.pick(f, null, null, 1));
    originalFrames.push(pixels.pick(f, null, null, 2));
  }

  const thresholdedFrames = originalFrames.map(frame => {
    const thres = get_otsu_threshold(frame);
    return threshold_image(thres, frame);
  });

  const averagedImage = pool.zeros(thresholdedFrames[0].shape, 'uint32');
  thresholdedFrames.forEach(curt => ops.addeq(averagedImage, curt));
  ops.divseq(averagedImage, thresholdedFrames.length);
  const thresholdedImage = threshold_image(get_otsu_threshold(averagedImage), averagedImage, 1);

  // console.log(averagedImage)

  const [ imageWidth, imageHeight ] = thresholdedImage.shape;
  const dw = ~~(imageWidth / 4);
  const splittedImages = [0, 1, 2, 3].map(i => thresholdedImage.hi(dw * i + dw, null).lo(dw * i, null));

  const charTmplData = await loadCharTmplData();

  const hamming = (a, b) => {
    const arrayShape = a.shape;
    const dest = pool.zeros(arrayShape, 'uint8');
    ops.bxor(dest, a, b);
    return ops.sum(dest);
  };

  const recognizedImageChars = splittedImages.map(img => {
    // console.log(ops.sum(img));
    const distances = charTmplData.map(tmpl => {
      // console.log(tmpl);
      // console.log(ops.sum(tmpl.ndarray));
      return hamming(img.transpose(1, 0), tmpl.ndarray);
    });
    // console.log(distances);
    const minDistValue = Math.min(...distances);
    const minDistIndex = distances.indexOf(minDistValue);
    return charTmplData[minDistIndex].char;
  });

  return recognizedImageChars;
}

// function hammingDistance (a, b, q=255) {
//   const arrayShape = a.shape;
//   const arraySize = arrayShape.reduce((a, b) => a * b);
//   const dest = ndarray(new Int16Array(arraySize), arrayShape);

//   ops.sub(dest, a, b);
//   ops.abseq(dest);
//   ops.divseq(dest, q);
//   return ops.sum(dest);
// }

function threshold_image (threshold, arr, maxVal=255) {
  const res = pool.zeros(arr.shape, 'uint8');
  ndarrayForEach(arr, (value, index) => {
    res.set(...index, value > threshold ? maxVal : 0);
  });
  return res;
}

function get_otsu_threshold (arr) {
  let g_value = 0, g_thres = 0;

  for (let t = 0; t < 255; t++) {
    let lo_count = 0, lo_sum = 0, hi_count = 0, hi_sum = 0;

    ndarrayForEach(arr, value => {
      if (value < t) {
        lo_count++;
        lo_sum += value;
      } else {
        hi_count++;
        hi_sum += value;
      }
    });

    const g = lo_count * hi_count * (hi_sum / hi_count - lo_sum / lo_count) ** 2;
    if (g > g_value) {
      g_value = g;
      g_thres = t;
    }
  }

  return g_thres;
}

function ndarrayForEach (arr, fn) {
  const shape = arr.shape;
  const [width, height] = shape;
  for (let w = 0; w < width; w++) {
    for (let h = 0; h < height; h++) {
      fn(arr.get(w, h), [w, h]);
    }
  }
}





