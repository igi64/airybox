<script>
  //  Modified from:
  // https://github.com/kanaka/noVNC/blob/master/include/base64.js
  var _pad = '=';
  var _to_base_64_table = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  var _chr_table = _to_base_64_table.split('');

  // @public


  function encode(data, offset, length) {
    "use strict";
    var result = '',
        i, effi;
    length = length || data.length;
    offset = offset || 0;
    // Convert every three bytes to 4 ascii characters.
    for (i = 0; i < (length - 2); i += 3) {
      effi = offset + i;
      result += _to_base_64_table[data[effi] >> 2];
      result += _to_base_64_table[((data[effi] & 0x03) << 4) + (data[effi + 1] >> 4)];
      result += _to_base_64_table[((data[effi + 1] & 0x0f) << 2) + (data[effi + 2] >> 6)];
      result += _to_base_64_table[data[effi + 2] & 0x3f];
    }

    // Convert the remaining 1 or 2 bytes, pad out to 4 characters.
    if (length % 3) {
      i = length - (length % 3);
      effi = offset + i;
      result += _to_base_64_table[data[effi] >> 2];
      if ((length % 3) === 2) {
        result += _to_base_64_table[((data[effi] & 0x03) << 4) + (data[effi + 1] >> 4)];
        result += _to_base_64_table[(data[effi + 1] & 0x0f) << 2];
        result += _pad;
      } else {
        result += _to_base_64_table[(data[effi] & 0x03) << 4];
        result += _pad + _pad;
      }
    }

    return result;
  }

/* string index is same speed as array lookup e.g: myString[charIndex] 
 * 7% speed boost on chrome by using increment 
*/

  function encodeChromeOptimized(data, offset, length) {
    "use strict";
    var result = '',
        i, effi;
    length = length || data.length;
    offset = offset || 0;
    // Convert every three bytes to 4 ascii characters.
    for (i = 0; i < (length - 2); i += 3) {
      effi = offset + i;
      result += _chr_table[data[effi] >> 2];
      result += _chr_table[((data[effi++] & 0x03) << 4) + (data[effi] >> 4)];
      result += _chr_table[((data[effi++] & 0x0f) << 2) + (data[effi] >> 6)];
      result += _chr_table[data[effi] & 0x3f];
    }

    // Convert the remaining 1 or 2 bytes, pad out to 4 characters.
    if (length % 3) {
      i = length - (length % 3);
      effi = offset + i;
      result += _chr_table[data[effi] >> 2];
      if ((length % 3) === 2) {
        result += _chr_table[((data[effi++] & 0x03) << 4) + (data[effi] >> 4)];
        result += _chr_table[(data[effi] & 0x0f) << 2];
        result += _pad;
      } else {
        result += _chr_table[(data[effi] & 0x03) << 4];
        result += _pad + _pad;
      }
    }

    return result;
  }


  function usebtoa(data, offset, allocator) {
    if (offset) {
      data = data.subarray(offset);
    }
    var params = new Array(data.length);
    var ii;
    for (ii = 0; ii < data.length; ++ii) {
      params[ii] = data[ii];
    }
    data = String.fromCharCode.apply(undefined, params);
    return btoa(data);
  }


  function encode2(data, offset, length) {
    var result, i, effi;
    length = length || data.length;
    offset = offset || 0;
    result = new Array((length * 4 / 3) | 0);
    // Convert every three bytes to 4 ascii characters.
    var outi = 0;
    for (i = 0; i < (length - 2); i += 3) {
      effi = offset + i;
      result[outi++] = _chr_table[data[effi] >> 2];
      result[outi++] = _chr_table[((data[effi] & 0x03) << 4) + (data[effi + 1] >> 4)];
      result[outi++] = _chr_table[((data[effi + 1] & 0x0f) << 2) + (data[effi + 2] >> 6)];
      result[outi++] = _chr_table[data[effi + 2] & 0x3f];
    }

    // Convert the remaining 1 or 2 bytes, pad out to 4 characters.
    if (length % 3) {
      i = length - (length % 3);
      effi = offset + i;
      result.push(_chr_table[data[effi] >> 2]);
      if ((length % 3) === 2) {
        result.push(_chr_table[((data[effi] & 0x03) << 4) + (data[effi + 1] >> 4)]);
        result.push(_chr_table[(data[effi + 1] & 0x0f) << 2]);
        result.push(_pad);
      } else {
        result.push(_chr_table[(data[effi] & 0x03) << 4]);
        result.push(_pad + _pad);
      }
    }

    return result.join('');
  }


  function encode3(data, offset, length) {
    var result, i, effi;
    length = length || data.length;
    offset = offset || 0;
    result = [];
    // Convert every three bytes to 4 ascii characters.
    var outi = 0;
    for (i = 0; i < (length - 2); i += 3) {
      effi = offset + i;
      result.push(_chr_table[data[effi] >> 2]);
      result.push(_chr_table[((data[effi] & 0x03) << 4) + (data[effi + 1] >> 4)]);
      result.push(_chr_table[((data[effi + 1] & 0x0f) << 2) + (data[effi + 2] >> 6)]);
      result.push(_chr_table[data[effi + 2] & 0x3f]);
    }

    // Convert the remaining 1 or 2 bytes, pad out to 4 characters.
    if (length % 3) {
      i = length - (length % 3);
      effi = offset + i;
      result.push(_chr_table[data[effi] >> 2]);
      if ((length % 3) === 2) {
        result.push(_chr_table[((data[effi] & 0x03) << 4) + (data[effi + 1] >> 4)]);
        result.push(_chr_table[(data[effi + 1] & 0x0f) << 2]);
        result.push(_pad);
      } else {
        result.push(_chr_table[(data[effi] & 0x03) << 4]);
        result.push(_pad + _pad);
      }
    }

    return result.join('');
  }

  var googTypeOf = function(value) {
      var s = typeof value;
      if (s == 'object') {
        if (value) {
          // Check these first, so we can avoid calling Object.prototype.toString if
          // possible.
          //
          // IE improperly marshals tyepof across execution contexts, but a
          // cross-context object will still return false for "instanceof Object".
          if (value instanceof Array) {
            return 'array';
          } else if (value instanceof Object) {
            return s;
          }

          // HACK: In order to use an Object prototype method on the arbitrary
          //   value, the compiler requires the value be cast to type Object,
          //   even though the ECMA spec explicitly allows it.
          var className = Object.prototype.toString.call( /** @type {Object} */ (value));
          // In Firefox 3.6, attempting to access iframe window objects' length
          // property throws an NS_ERROR_FAILURE, so we need to special-case it
          // here.
          if (className == '[object Window]') {
            return 'object';
          }

          // We cannot always use constructor == Array or instanceof Array because
          // different frames have different Array objects. In IE6, if the iframe
          // where the array was created is destroyed, the array loses its
          // prototype. Then dereferencing val.splice here throws an exception, so
          // we can't use goog.isFunction. Calling typeof directly returns 'unknown'
          // so that will work. In this case, this function will return false and
          // most array functions will still work because the array is still
          // array-like (supports length and []) even though it has lost its
          // prototype.
          // Mark Miller noticed that Object.prototype.toString
          // allows access to the unforgeable [[Class]] property.
          //  15.2.4.2 Object.prototype.toString ( )
          //  When the toString method is called, the following steps are taken:
          //      1. Get the [[Class]] property of this object.
          //      2. Compute a string value by concatenating the three strings
          //         "[object ", Result(1), and "]".
          //      3. Return Result(2).
          // and this behavior survives the destruction of the execution context.
          if ((className == '[object Array]' ||
          // In IE all non value types are wrapped as objects across window
          // boundaries (not iframe though) so we have to do object detection
          // for this edge case
          typeof value.length == 'number' && typeof value.splice != 'undefined' && typeof value.propertyIsEnumerable != 'undefined' && !value.propertyIsEnumerable('splice')

          )) {
            return 'array';
          }
          // HACK: There is still an array case that fails.
          //     function ArrayImpostor() {}
          //     ArrayImpostor.prototype = [];
          //     var impostor = new ArrayImpostor;
          // this can be fixed by getting rid of the fast path
          // (value instanceof Array) and solely relying on
          // (value && Object.prototype.toString.vall(value) === '[object Array]')
          // but that would require many more function calls and is not warranted
          // unless closure code is receiving objects from untrusted sources.
          // IE in cross-window calls does not correctly marshal the function type
          // (it appears just as an object) so we cannot use just typeof val ==
          // 'function'. However, if the object has a call property, it is a
          // function.
          if ((className == '[object Function]' || typeof value.call != 'undefined' && typeof value.propertyIsEnumerable != 'undefined' && !value.propertyIsEnumerable('call'))) {
            return 'function';
          }


        } else {
          return 'null';
        }

      } else if (s == 'function' && typeof value.call == 'undefined') {
        // In Safari typeof nodeList returns 'function', and on Firefox
        // typeof behaves similarly for HTML{Applet,Embed,Object}Elements
        // and RegExps.  We would like to return object for those and we can
        // detect an invalid function by making sure that the function
        // object has a call method.
        return 'object';
      }
      return s;
      };



  var byteToCharMap_ = null;
  var charToByteMap_ = null;
  var byteToCharMapWebSafe_ = null;
  var charToByteMapWebSafe_ = null;
  var ENCODED_VALS_BASE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ' + 'abcdefghijklmnopqrstuvwxyz' + '0123456789';
  var ENCODED_VALS = ENCODED_VALS_BASE + '+/=';
  var ENCODED_VALS_WEBSAFE = ENCODED_VALS_BASE + '-_.';

  function initBase64_() {
    if (!byteToCharMap_) {
      byteToCharMap_ = {};
      charToByteMap_ = {};
      byteToCharMapWebSafe_ = {};
      charToByteMapWebSafe_ = {};

      // We want quick mappings back and forth, so we precompute two maps.
      for (var i = 0; i < ENCODED_VALS.length; i++) {
        byteToCharMap_[i] = ENCODED_VALS.charAt(i);
        charToByteMap_[byteToCharMap_[i]] = i;
        byteToCharMapWebSafe_[i] = ENCODED_VALS_WEBSAFE.charAt(i);
        charToByteMapWebSafe_[
        byteToCharMapWebSafe_[i]] = i;
      }
    }
  };


  function closureEncode(input, offset, length, opt_webSafe) {
    var type = googTypeOf(input);
    if (!(type == 'array' || type == 'object' && typeof input.length == 'number')) {
      throw Error('encodeByteArray takes an array as a parameter');
    }

    initBase64_();

    var byteToCharMap = opt_webSafe ? byteToCharMapWebSafe_ : byteToCharMap_;

    var output = [];

    for (var i = offset; i < length; i += 3) {
      var byte1 = input[i];
      var haveByte2 = i + 1 < (offset + length);
      var byte2 = haveByte2 ? input[i + 1] : 0;
      var haveByte3 = i + 2 < (offset + length);
      var byte3 = haveByte3 ? input[i + 2] : 0;

      var outByte1 = byte1 >> 2;
      var outByte2 = ((byte1 & 0x03) << 4) | (byte2 >> 4);
      var outByte3 = ((byte2 & 0x0F) << 2) | (byte3 >> 6);
      var outByte4 = byte3 & 0x3F;

      if (!haveByte3) {
        outByte4 = 64;

        if (!haveByte2) {
          outByte3 = 64;
        }
      }

      output.push(byteToCharMap[outByte1], byteToCharMap[outByte2], byteToCharMap[outByte3], byteToCharMap[outByte4]);
    }

    return output.join('');
  };

  var test_data = [252, 169, 3, 1, 0, 1, 101, 1, 24, 80, 69, 49, 102, 57, 98, 97, 52, 56, 49, 49, 49, 50, 49, 54, 52, 98, 52, 99, 52, 99, 51, 52, 50, 4, 33, 6, 1, 242, 236, 171, 66, 141, 67, 60, 193, 6, 143, 192, 64, 3, 235, 152, 3, 191, 47, 215, 226, 190, 15, 130, 245, 190, 75, 109, 14, 191, 0, 0, 1, 24, 80, 69, 48, 100, 55, 52, 49, 56, 53, 98, 53, 97, 102, 99, 48, 98, 48, 97, 100, 56, 99, 99, 101, 52, 4, 33, 6, 1, 227, 166, 97, 65, 127, 194, 40, 194, 122, 191, 75, 64, 3, 203, 178, 194, 61, 96, 80, 180, 190, 111, 31, 102, 63, 16, 123, 120, 190, 0, 0, 1, 24, 80, 69, 54, 50, 52, 48, 52, 50, 99, 48, 57, 100, 57, 54, 49, 57, 50, 54, 49, 52, 50, 102, 56, 100, 4, 33, 6, 1, 172, 154, 169, 194, 218, 245, 176, 194, 233, 145, 43, 64, 3, 248, 156, 247, 62, 155, 182, 174, 190, 219, 235, 237, 62, 244, 152, 40, 191, 0, 0, 1, 24, 80, 69, 55, 98, 49, 50, 50, 52, 100, 53, 102, 52, 55, 56, 51, 49, 57, 56, 57, 52, 98, 52, 57, 48, 4, 33, 6, 1, 209, 202, 111, 66, 148, 145, 90, 194, 70, 121, 187, 64, 3, 251, 137, 184, 190, 106, 205, 91, 62, 13, 208, 237, 62, 236, 168, 71, 191, 0, 0, 1, 24, 80, 69, 56, 100, 52, 99, 99, 97, 50, 53, 48, 101, 97, 53, 97, 56, 48, 97, 54, 98, 51, 55, 100, 102, 4, 33, 6, 1, 255, 227, 148, 66, 141, 166, 79, 66, 175, 117, 23, 64, 3, 136, 82, 9, 63, 125, 247, 108, 190, 133, 154, 164, 62, 153, 198, 62, 191, 0, 0, 1, 24, 80, 69, 49, 99, 56, 52, 57, 48, 54, 49, 56, 51, 98, 48, 54, 54, 97, 102, 49, 52, 56, 51, 49, 53, 4, 33, 6, 1, 88, 171, 158, 193, 111, 196, 41, 66, 215, 94, 60, 64, 3, 186, 207, 180, 62, 65, 69, 84, 190, 182, 117, 236, 62, 114, 106, 73, 191, 0, 0, 1, 24, 80, 69, 52, 52, 102, 54, 97, 51, 56, 54, 54, 54, 55, 55, 48, 56, 97, 53, 56, 51, 51, 50, 98, 50, 4, 33, 6, 1, 14, 38, 220, 65, 33, 53, 101, 65, 153, 171, 10, 64, 3, 244, 4, 44, 63, 206, 48, 193, 60, 19, 176, 212, 188, 61, 97, 61, 191, 0, 0, 1, 24, 80, 69, 55, 102, 98, 53, 51, 53, 102, 98, 52, 53, 53, 101, 56, 101, 55, 57, 50, 53, 52, 51, 52, 101, 4, 33, 6, 1, 148, 38, 82, 65, 80, 210, 196, 65, 231, 111, 179, 64, 3, 191, 66, 72, 190, 185, 189, 133, 62, 49, 182, 65, 63, 149, 7, 17, 191, 0, 0, 1, 24, 80, 69, 53, 49, 49, 101, 51, 97, 48, 50, 98, 55, 99, 101, 48, 54, 51, 57, 53, 55, 55, 51, 100, 50, 4, 33, 6, 1, 243, 156, 107, 66, 213, 99, 46, 66, 62, 212, 164, 64, 3, 34, 182, 228, 189, 250, 74, 227, 61, 102, 52, 50, 63, 32, 81, 51, 191, 0, 0, 1, 24, 80, 69, 51, 102, 101, 101, 51, 56, 55, 101, 54, 52, 99, 101, 52, 48, 57, 51, 57, 54, 57, 101, 48, 56, 4, 33, 6, 1, 182, 219, 61, 194, 225, 202, 170, 65, 178, 224, 18, 64, 3, 250, 241, 209, 62, 73, 27, 130, 62, 49, 63, 236, 190, 212, 155, 62, 191, 0, 0, 1, 24, 80, 69, 50, 57, 55, 97, 99, 53, 55, 97, 100, 98, 101, 51, 101, 99, 54, 48, 56, 57, 99, 51, 98, 56, 4, 33, 6, 1, 251, 43, 68, 65, 239, 170, 45, 66, 212, 10, 131, 64, 3, 0, 250, 12, 187, 135, 40, 166, 60, 244, 132, 126, 63, 60, 242, 215, 189, 0, 0, 1, 24, 80, 69, 101, 53, 102, 98, 49, 49, 53, 50, 100, 57, 50, 50, 99, 102, 56, 52, 102, 52, 54, 98, 51, 102, 4, 33, 6, 1, 49, 52, 23, 193, 222, 247, 198, 192, 48, 41, 149, 64, 3, 248, 32, 184, 188, 64, 29, 2, 190, 153, 250, 121, 191, 99, 224, 48, 190, 0, 0, 1, 24, 80, 69, 98, 102, 98, 57, 102, 49, 100, 50, 100, 101, 55, 100, 97, 49, 98, 57, 98, 102, 100, 51, 100, 99, 4, 46, 6, 1, 197, 26, 219, 190, 81, 123, 27, 65, 195, 39, 5, 64, 3, 234, 37, 163, 62, 144, 226, 198, 62, 159, 33, 43, 191, 162, 97, 12, 191, 0, 12, 3, 4, 45, 49, 95, 48, 11, 4, 0, 0, 0, 67, 0, 1, 24, 80, 69, 57, 49, 102, 98, 102, 54, 56, 100, 97, 49, 56, 48, 55, 56, 57, 52, 48, 53, 53, 51, 56, 97, 4, 33, 6, 1, 145, 148, 15, 65, 224, 73, 161, 65, 246, 11, 85, 64, 3, 133, 133, 71, 61, 92, 227, 167, 190, 7, 231, 110, 63, 77, 245, 13, 190, 0, 0, 1, 24, 80, 69, 101, 57, 97, 57, 56, 54, 57, 55, 52, 101, 99, 57, 55, 99, 53, 52, 99, 55, 100, 98, 57, 56, 4, 33, 6, 1, 126, 223, 91, 65, 134, 231, 37, 66, 122, 54, 147, 64, 3, 222, 132, 226, 188, 191, 218, 199, 189, 105, 8, 117, 191, 208, 220, 138, 190, 0, 0, 0, 0];

  var test_array = test_data;
  if (Uint8Array) test_array = new Uint8Array(test_data);

  var result = encode(test_array, 0, test_array.length);
  console.log(result);
  var result2 = usebtoa(test_array, 0, test_array.length);
  console.log(result2);
  if (result !== result2) {
    console.log('DIFFERENT!');
  }
</script>