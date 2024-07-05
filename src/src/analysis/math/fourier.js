// ref: https://github.com/mikolalysenko/bit-twiddle/blob/master/twiddle.js

//Number of bits in an integer
const INT_BITS = 32;
const api = {};

//Constants
api.INT_BITS  = INT_BITS;
api.INT_MAX   =  0x7fffffff;
api.INT_MIN   = -1<<(INT_BITS-1);

//Returns -1, 0, +1 depending on sign of x
api.sign = function(v) {
  return (v > 0) - (v < 0);
}

//Computes absolute value of integer
api.abs = function(v) {
  var mask = v >> (INT_BITS-1);
  return (v ^ mask) - mask;
}

//Computes minimum of integers x and y
api.min = function(x, y) {
  return y ^ ((x ^ y) & -(x < y));
}

//Computes maximum of integers x and y
api.max = function(x, y) {
  return x ^ ((x ^ y) & -(x < y));
}

//Checks if a number is a power of two
api.isPow2 = function(v) {
  return !(v & (v-1)) && (!!v);
}

//Computes log base 2 of v
api.log2 = function(v) {
  var r, shift;
  r =     (v > 0xFFFF) << 4; v >>>= r;
  shift = (v > 0xFF  ) << 3; v >>>= shift; r |= shift;
  shift = (v > 0xF   ) << 2; v >>>= shift; r |= shift;
  shift = (v > 0x3   ) << 1; v >>>= shift; r |= shift;
  return r | (v >> 1);
}

//Computes log base 10 of v
api.log10 = function(v) {
  return  (v >= 1000000000) ? 9 : (v >= 100000000) ? 8 : (v >= 10000000) ? 7 :
          (v >= 1000000) ? 6 : (v >= 100000) ? 5 : (v >= 10000) ? 4 :
          (v >= 1000) ? 3 : (v >= 100) ? 2 : (v >= 10) ? 1 : 0;
}

//Counts number of bits
api.popCount = function(v) {
  v = v - ((v >>> 1) & 0x55555555);
  v = (v & 0x33333333) + ((v >>> 2) & 0x33333333);
  return ((v + (v >>> 4) & 0xF0F0F0F) * 0x1010101) >>> 24;
}

//Counts number of trailing zeros
function countTrailingZeros(v) {
  var c = 32;
  v &= -v;
  if (v) c--;
  if (v & 0x0000FFFF) c -= 16;
  if (v & 0x00FF00FF) c -= 8;
  if (v & 0x0F0F0F0F) c -= 4;
  if (v & 0x33333333) c -= 2;
  if (v & 0x55555555) c -= 1;
  return c;
}
api.countTrailingZeros = countTrailingZeros;

//Rounds to next power of 2
api.nextPow2 = function(v) {
  v += v === 0;
  --v;
  v |= v >>> 1;
  v |= v >>> 2;
  v |= v >>> 4;
  v |= v >>> 8;
  v |= v >>> 16;
  return v + 1;
}

//Rounds down to previous power of 2
api.prevPow2 = function(v) {
  v |= v >>> 1;
  v |= v >>> 2;
  v |= v >>> 4;
  v |= v >>> 8;
  v |= v >>> 16;
  return v - (v>>>1);
}

//Computes parity of word
api.parity = function(v) {
  v ^= v >>> 16;
  v ^= v >>> 8;
  v ^= v >>> 4;
  v &= 0xf;
  return (0x6996 >>> v) & 1;
}

const REVERSE_TABLE = new Array(256);

(function(tab) {
  for(let i=0; i<256; ++i) {
    let v = i, r = i, s = 7;
    for (v >>>= 1; v; v >>>= 1) {
      r <<= 1;
      r |= v & 1;
      --s;
    }
    tab[i] = (r << s) & 0xff;
  }
})(REVERSE_TABLE);

//Reverse bits in a 32 bit word
api.reverse = function(v) {
  return  (REVERSE_TABLE[ v         & 0xff] << 24) |
          (REVERSE_TABLE[(v >>> 8)  & 0xff] << 16) |
          (REVERSE_TABLE[(v >>> 16) & 0xff] << 8)  |
           REVERSE_TABLE[(v >>> 24) & 0xff];
}

//Interleave bits of 2 coordinates with 16 bits.  Useful for fast quadtree codes
api.interleave2 = function(x, y) {
  x &= 0xFFFF;
  x = (x | (x << 8)) & 0x00FF00FF;
  x = (x | (x << 4)) & 0x0F0F0F0F;
  x = (x | (x << 2)) & 0x33333333;
  x = (x | (x << 1)) & 0x55555555;

  y &= 0xFFFF;
  y = (y | (y << 8)) & 0x00FF00FF;
  y = (y | (y << 4)) & 0x0F0F0F0F;
  y = (y | (y << 2)) & 0x33333333;
  y = (y | (y << 1)) & 0x55555555;

  return x | (y << 1);
}

//Extracts the nth interleaved component
api.deinterleave2 = function(v, n) {
  v = (v >>> n) & 0x55555555;
  v = (v | (v >>> 1))  & 0x33333333;
  v = (v | (v >>> 2))  & 0x0F0F0F0F;
  v = (v | (v >>> 4))  & 0x00FF00FF;
  v = (v | (v >>> 16)) & 0x000FFFF;
  return (v << 16) >> 16;
}


//Interleave bits of 3 coordinates, each with 10 bits.  Useful for fast octree codes
api.interleave3 = function(x, y, z) {
  x &= 0x3FF;
  x  = (x | (x<<16)) & 4278190335;
  x  = (x | (x<<8))  & 251719695;
  x  = (x | (x<<4))  & 3272356035;
  x  = (x | (x<<2))  & 1227133513;

  y &= 0x3FF;
  y  = (y | (y<<16)) & 4278190335;
  y  = (y | (y<<8))  & 251719695;
  y  = (y | (y<<4))  & 3272356035;
  y  = (y | (y<<2))  & 1227133513;
  x |= (y << 1);

  z &= 0x3FF;
  z  = (z | (z<<16)) & 4278190335;
  z  = (z | (z<<8))  & 251719695;
  z  = (z | (z<<4))  & 3272356035;
  z  = (z | (z<<2))  & 1227133513;

  return x | (z << 2);
}

//Extracts nth interleaved component of a 3-tuple
api.deinterleave3 = function(v, n) {
  v = (v >>> n)       & 1227133513;
  v = (v | (v>>>2))   & 3272356035;
  v = (v | (v>>>4))   & 251719695;
  v = (v | (v>>>8))   & 4278190335;
  v = (v | (v>>>16))  & 0x3FF;
  return (v<<22)>>22;
}

//Computes next combination in colexicographic order (this is mistakenly called nextPermutation on the bit twiddling hacks page)
api.nextCombination = function(v) {
  const t = v | (v - 1);
  return (t + 1) | (((~t & -~t) - 1) >>> (countTrailingZeros(v) + 1));
}

// complex
// ref: https://github.com/vail-systems/node-fft/blob/master/src/complex.js

const complexAdd = function (a, b)
{
    return [a[0] + b[0], a[1] + b[1]];
};

//-------------------------------------------------
// Subtract two complex numbers
//-------------------------------------------------
const complexSubtract = function (a, b)
{
    return [a[0] - b[0], a[1] - b[1]];
};

//-------------------------------------------------
// Multiply two complex numbers
//
// (a + bi) * (c + di) = (ac - bd) + (ad + bc)i
//-------------------------------------------------
const complexMultiply = function (a, b)
{
    return [(a[0] * b[0] - a[1] * b[1]),
            (a[0] * b[1] + a[1] * b[0])];
};

//-------------------------------------------------
// Calculate |a + bi|
//
// sqrt(a*a + b*b)
//-------------------------------------------------
const complexMagnitude = function (c)
{
    return Math.sqrt(c[0]*c[0] + c[1]*c[1]);
};

api.complex = {
    add: complexAdd,
    subtract: complexSubtract,
    multiply: complexMultiply,
    magnitude: complexMagnitude
};

// fft util
// ref: https://github.com/vail-systems/node-fft/blob/master/src/fftutil.js

/*===========================================================================*\
 * Fast Fourier Transform Frequency/Magnitude passes
 *
 * (c) Vail Systems. Joshua Jung and Ben Bryan. 2015
 *
 * This code is not designed to be highly optimized but as an educational
 * tool to understand the Fast Fourier Transform.
\*===========================================================================*/

//-------------------------------------------------
// The following code assumes a complex number is
// an array: [real, imaginary]
//-------------------------------------------------

//-------------------------------------------------
// By Eulers Formula:
//
// e^(i*x) = cos(x) + i*sin(x)
//
// and in DFT:
//
// x = -2*PI*(k/N)
//-------------------------------------------------
const mapExponent = {};
const exponent = function (k, N) {
    const x = -2 * Math.PI * (k / N);

    mapExponent[N] = mapExponent[N] || {};
    mapExponent[N][k] = mapExponent[N][k] || [Math.cos(x), Math.sin(x)];// [Real, Imaginary]

    return mapExponent[N][k];
};

//-------------------------------------------------
// Calculate FFT Magnitude for complex numbers.
//-------------------------------------------------
const fftMag = function (fftBins) {
    const ret = fftBins.map(api.complex.magnitude);
    return ret.slice(0, ret.length / 2);
};

//-------------------------------------------------
// Calculate Frequency Bins
//
// Returns an array of the frequencies (in hertz) of
// each FFT bin provided, assuming the sampleRate is
// samples taken per second.
//-------------------------------------------------
const fftFreq = function (fftBins, sampleRate) {
    const stepFreq = sampleRate / (fftBins.length);
    const ret = fftBins.slice(0, fftBins.length / 2);

    return ret.map(function (__, ix) {
        return ix * stepFreq;
    });
};

api.fftutil = {
    fftMag: fftMag,
    fftFreq: fftFreq,
    exponent: exponent
};

// fft
// ref: https://github.com/vail-systems/node-fft/blob/master/src/fft.js

/*===========================================================================*\
 * Fast Fourier Transform (Cooley-Tukey Method)
 *
 * (c) Vail Systems. Joshua Jung and Ben Bryan. 2015
 *
 * This code is not designed to be highly optimized but as an educational
 * tool to understand the Fast Fourier Transform.
\*===========================================================================*/

//------------------------------------------------
// Note: Some of this code is not optimized and is
// primarily designed as an educational and testing
// tool.
// To get high performace would require transforming
// the recursive calls into a loop and then loop
// unrolling. All of this is best accomplished
// in C or assembly.
//-------------------------------------------------

//-------------------------------------------------
// The following code assumes a complex number is
// an array: [real, imaginary]
//-------------------------------------------------

//-------------------------------------------------
// Calculate FFT for vector where vector.length
// is assumed to be a power of 2.
//-------------------------------------------------
api.fft = function fft(vector) {
  const X = [];
  const N = vector.length;

  // Base case is X = x + 0i since our input is assumed to be real only.
  if (N == 1) {
    if (Array.isArray(vector[0])) //If input vector contains complex numbers
      return [[vector[0][0], vector[0][1]]];
    else
      return [[vector[0], 0]];
  }

  // Recurse: all even samples
  const X_evens = fft(vector.filter(even));

  // Recurse: all odd samples
  const X_odds  = fft(vector.filter(odd));

  // Now, perform N/2 operations!
  for (let k = 0; k < N / 2; k++) {
    // t is a complex number!
    const t = X_evens[k],
        e = api.complex.multiply(api.fftutil.exponent(k, N), X_odds[k]);

    X[k] = api.complex.add(t, e);
    X[k + (N / 2)] = api.complex.subtract(t, e);
  }

  function even(__, ix) {
    return ix % 2 == 0;
  }

  function odd(__, ix) {
    return ix % 2 == 1;
  }

  return X;
};
//-------------------------------------------------
// Calculate FFT for vector where vector.length
// is assumed to be a power of 2.  This is the in-
// place implementation, to avoid the memory
// footprint used by recursion.
//-------------------------------------------------
api.fft.faster = function(vector) {
  const N = vector.length;

  const trailingZeros = api.countTrailingZeros(N); //Once reversed, this will be leading zeros

  // Reverse bits
  for (let k = 0; k < N; k++) {
    const p = api.reverse(k) >>> (api.INT_BITS - trailingZeros);
    if (p > k) {
      const complexTemp = [vector[k], 0];
      vector[k] = vector[p];
      vector[p] = complexTemp;
    } else {
      vector[p] = [vector[p], 0];
    }
  }

  //Do the DIT now in-place
  for (let len = 2; len <= N; len += len) {
    for (let i = 0; i < len / 2; i++) {
      const w = api.fftutil.exponent(i, len);
      for (let j = 0; j < N / len; j++) {
        const t = api.complex.multiply(w, vector[j * len + i + len / 2]);
        vector[j * len + i + len / 2] = api.complex.subtract(vector[j * len + i], t);
        vector[j * len + i] = api.complex.add(vector[j * len + i], t);
      }
    }
  }
};


// ifft
// ref: https://github.com/vail-systems/node-fft/blob/master/src/ifft.js

/*===========================================================================*\
 * Inverse Fast Fourier Transform (Cooley-Tukey Method)
 *
 * (c) Maximilian Bügler. 2016
 *
 * Based on and using the code by
 * (c) Vail Systems. Joshua Jung and Ben Bryan. 2015
 *
 * This code is not designed to be highly optimized but as an educational
 * tool to understand the Fast Fourier Transform.
\*===========================================================================*/

//------------------------------------------------
// Note: Some of this code is not optimized and is
// primarily designed as an educational and testing
// tool.
// To get high performace would require transforming
// the recursive calls into a loop and then loop
// unrolling. All of this is best accomplished
// in C or assembly.
//-------------------------------------------------

//-------------------------------------------------
// The following code assumes a complex number is
// an array: [real, imaginary]
//-------------------------------------------------

api.ifft = function ifft(signal) {
    //Interchange real and imaginary parts
    const csignal=[];
    for(let i=0; i<signal.length; i++){
        csignal[i]=[signal[i][1], signal[i][0]];
    }

    //Apply fft
    const ps=api.fft.fft(csignal);

    //Interchange real and imaginary parts and normalize
    const res=[];
    for(let j=0; j<ps.length; j++){
        res[j]=[ps[j][1]/ps.length, ps[j][0]/ps.length];
    }
    return res;
};

// dft
// ref: https://github.com/vail-systems/node-fft/blob/master/src/dft.js

/*===========================================================================*\
 * Discrete Fourier Transform (O(n^2) brute-force method)
 *
 * (c) Vail Systems. Joshua Jung and Ben Bryan. 2015
 *
 * This code is not designed to be highly optimized but as an educational
 * tool to understand the Fast Fourier Transform.
\*===========================================================================*/

//------------------------------------------------
// Note: this code is not optimized and is
// primarily designed as an educational and testing
// tool.
//------------------------------------------------

//-------------------------------------------------
// Calculate brute-force O(n^2) DFT for vector.
//-------------------------------------------------
api.dft = function(vector) {
  const X = [];
  const N = vector.length;

  for (let k = 0; k < N; k++) {
    X[k] = [0, 0]; //Initialize to a 0-valued complex number.

    for (let i = 0; i < N; i++) {
      const exp = api.fftutil.exponent(k * i, N);
      let term;
      if (Array.isArray(vector[i]))
        term = api.complex.multiply(vector[i], exp)//If input vector contains complex numbers
      else
        term = api.complex.multiply([vector[i], 0], exp);//Complex mult of the signal with the exponential term.
      X[k] = api.complex.add(X[k], term); //Complex summation of X[k] and exponential
    }
  }

  return X;
};

// idft
// ref: https://github.com/vail-systems/node-fft/blob/master/src/idft.js

/*===========================================================================*\
 * Inverse Discrete Fourier Transform (O(n^2) brute-force method)
 *
 * (c) Maximilian Bügler. 2016
 *
 * Based on and using the code by
 * (c) Vail Systems. Joshua Jung and Ben Bryan. 2015
 *
 * This code is not designed to be highly optimized but as an educational
 * tool to understand the Fast Fourier Transform.
\*===========================================================================*/

//------------------------------------------------
// Note: Some of this code is not optimized and is
// primarily designed as an educational and testing
// tool.
//-------------------------------------------------

//-------------------------------------------------
// The following code assumes a complex number is
// an array: [real, imaginary]
//-------------------------------------------------
api.idft = function (signal) {
    //Interchange real and imaginary parts
    const csignal = [];
    for (var i = 0; i < signal.length; i++) {
        csignal[i] = [signal[i][1], signal[i][0]];
    }

    //Apply dft
    const ps = api.dft(csignal);

    //Interchange real and imaginary parts and normalize
    const res = [];
    for (var j = 0; j < ps.length; j++) {
        res[j] = [ps[j][1] / ps.length, ps[j][0] / ps.length];
    }
    return res;
}

export default api;