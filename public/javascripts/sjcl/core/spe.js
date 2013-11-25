/** @fileOverview SPE mode implementation.
*
* @author Igor Zboran
*/

/** @namespace OFB mode with Syntax Preserving Encryption. */
sjcl.mode.spe = {
    /** The name of the mode.
    * @constant
    */
    name: "spe",
    uplo_mode: { set: 1, revert: 0 },
    prf_offs: 0,

    /*_strikethroughText: function(text) {
    var result = '';
    $.each(text.split(''), function() {
    result += this + '\u0336';
    });
    },*/

    /** Encrypt in SPE mode.
    * @static
    * @param {Object} prf The pseudorandom function.  It must have a block size of 16 bytes.
    * @param {bitArray} plaintext The plaintext data.
    * @param {bitArray} iv The initialization value.
    * @param {bitArray} [adata=[]] The authenticated data.
    * @param {Number} [tlen=64] the desired tag length, in bits.
    * @param {Object} [params] The parameters including tag, iv and salt.
    * @param {Object} [rp] A returned version with filled-in parameters.
    * @return {bitArray} The encrypted data, an array of bytes.
    */
    encrypt: function (prf, plaintext, iv, adata, tlen, params, rp) {
        params = params || {};
        rp = rp || {};

        var L, i, out = plaintext.slice(0), tag, w = sjcl.bitArray, ivl = w.bitLength(iv) / 8, ol = w.bitLength(out) / 8, ctr;
        tlen = tlen || 64;
        adata = adata || [];

        if (ivl < 7) {
            throw new sjcl.exception.invalid("spe: iv must be at least 7 bytes");
        }

        // compute the length of the length
        for (L = 2; L < 4 && ol >>> 8 * L; L++) { }
        if (L < 15 - ivl) { L = 15 - ivl; }
        iv = w.clamp(iv, 8 * (15 - L));

        // compute the tag
        tag = sjcl.mode.spe._computeTag(prf, plaintext, iv, adata, tlen, L);

        // encrypt the tag
        out = sjcl.mode.spe._ctrMode(prf, iv, tag, tlen, L);

        tag = out.tag;

        rp.tdata = sjcl.codec.base64.fromBits(tag, 1);

        if (typeof plaintext === "object") {
            plaintext = sjcl.codec.utf8String.fromBits(plaintext);
        }

        ctr = out.ctr;
        ctr[3] += ol;

        // encrypt the data, switch to OFB mode using ctr as iv
        return sjcl.codec.utf8String.toBits(sjcl.mode.spe._encrypt(prf, plaintext, ctr));
    },

    /** Decrypt in SPE mode.
    * @static
    * @param {Object} prf The pseudorandom function.  It must have a block size of 16 bytes.
    * @param {bitArray} ciphertext The ciphertext data.
    * @param {bitArray} iv The initialization value.
    * @param {bitArray} [[]] adata The authenticated data.
    * @param {Number} [64] tlen the desired tag length, in bits.
    * @param {bitArray} [[]] tdata The authentication tag data.
    * @return {bitArray} The decrypted data.
    */
    decrypt: function (prf, ciphertext, iv, adata, tlen, tdata) {
        var L, i, out, w = sjcl.bitArray, ivl = w.bitLength(iv) / 8, ol = w.bitLength(ciphertext), tag2, ctr;
        tlen = tlen || 64;
        adata = adata || [];

        ol = ol / 8;

        if (ivl < 7) {
            throw new sjcl.exception.invalid("spe: iv must be at least 7 bytes");
        }

        // compute the length of the length
        for (L = 2; L < 4 && ol >>> 8 * L; L++) { }
        if (L < 15 - ivl) { L = 15 - ivl; }
        iv = w.clamp(iv, 8 * (15 - L));

        if (typeof ciphertext === "object") {
            ciphertext = sjcl.codec.utf8String.fromBits(ciphertext);
        }

        if (typeof tdata === "string") {
            tdata = sjcl.codec.base64.toBits(tdata, 1);
        }

        // decrypt the tag
        out = sjcl.mode.spe._ctrMode(prf, iv, tdata, tlen, L);

        tdata = out.tag;

        ctr = out.ctr;
        ctr[3] += ol;

        // decrypt the data, switch to OFB mode using ctr as iv
        out = sjcl.codec.utf8String.toBits(sjcl.mode.spe._encrypt(prf, ciphertext, ctr));

        // check the tag
        tag2 = sjcl.mode.spe._computeTag(prf, out, iv, adata, tlen, L);
        if (!w.equal(tdata, tag2)) {
            throw new sjcl.exception.corrupt("spe: tag doesn't match");
        }

        return out;
    },

    /* private */
    _f: [],

    /** Core encrypt/decrypt in SPE mode (encryption and decryption are the same).
    * @static
    * @param {Object} prf The pseudorandom function.  It must have a block size of 16 bytes.
    * @param {bitArray} plaintext The plaintext data.
    * @param {bitArray} iv The initialization value.
    * @return {bitArray} The encrypted data, an array of bytes.
    */
    _encrypt: function (prf, plaintext, iv) {
        var singleword, singlewordindex = -1, intArray = [], wbegin = -1, wend = -1, chart = -1, chart_1 = -1, chart_2 = -1;
        var uplo = false, uplo_1 = false, uplo_2 = false, chr = ['', ''];

        sjcl.mode.spe._ofb4ModeInit(prf, iv);

        String.prototype.replaceAt = function (index, data) {
            return this.substr(0, index) + data + this.substr(index + data.length);
        }

        for (var i = 0; i < plaintext.length; i++) {

            if (plaintext.charCodeAt(i) < UNICODE_MAX)
                chart = uTable[plaintext.charCodeAt(i)].chart;
            else
                chart = -1;

            if ((wbegin < 0) && (chart >= 0)) {
                wbegin = i;
            }
            if ((wbegin >= 0) && (((wend < 0) && (chart < 0)) || (i == plaintext.length - 1))) {
                if ((chart >= 0) && i == plaintext.length - 1)
                    wend = i + 1;
                else
                    wend = i;
            }

            if ((wbegin >= 0) && ((wend >= 0) || (i == plaintext.length - 1))) {
                //process single word
                singleword = plaintext.substr(wbegin, wend - wbegin);
                singlewordindex++;

                for (var j = 0; j < singleword.length; j++) {
                    intArray[j] = j;
                }

                sjcl.mode.spe._fisherYates(prf, intArray);

                for (var j = 0; j < singleword.length; j++) {
                    // encrypt single character
                    if ((intArray[j] > -1) && (intArray[intArray[j]] > -1)) {
                        if (intArray[j] == intArray[intArray[j]]) {
                            singleword = singleword.replaceAt(j, sjcl.mode.spe._ofb4fpe1Mode(prf, singleword.charCodeAt(j)));
                        }
                        else {
                            chart_1 = uTable[singleword.charCodeAt(j)].chart;
                            chart_2 = uTable[singleword.charCodeAt(intArray[j])].chart;
                            uplo_1 = uTable[singleword.charCodeAt(j)].uplo;
                            uplo_2 = uTable[singleword.charCodeAt(intArray[j])].uplo;

                            if ((chart_1 == chart_2) || (chart_1 <= U_SYMBOLS_B) || (chart_1 <= U_SYMBOLS_B) ||
							    (Math.abs(chart_1 - chart_2) == 1 && (chart_1 ^ chart_2) > 1)) {
                                singleword = singleword.replaceAt(j, sjcl.mode.spe._ofb4fpe1Mode(prf, singleword.charCodeAt(j)));
                                singleword = singleword.replaceAt(Number([intArray[j]]), sjcl.mode.spe._ofb4fpe1Mode(prf, singleword.charCodeAt(intArray[j])));
                            }
                            else {
                                uplo = ((uplo_1 == 1) && (uplo_2 == 2)) ||
                                       ((uplo_1 == 2) && (uplo_2 == 1));

                                chr[0] = singleword.charCodeAt(j);
                                chr[1] = singleword.charCodeAt(intArray[j]);

                                sjcl.mode.spe._ofb4fpe2Mode(prf, chr, uplo);

                                singleword = singleword.replaceAt(j, String.fromCharCode(chr[0]));
                                singleword = singleword.replaceAt(Number([intArray[j]]), String.fromCharCode(chr[1]));
                            }
                        }

                        intArray[intArray[j]] = -1;
                        intArray[j] = -1;
                    }
                }

                for (var j = 0; j < singleword.length; j++) {
                    if (intArray[j] > -1) {
                        singleword = singleword.replaceAt(j, sjcl.mode.spe._ofb4fpe1Mode(prf, singleword.charCodeAt(j)));
                    }
                }

                intArray.length = 0;

                /*singleword = this._strikethroughText(singleword);*/

                plaintext = plaintext.replaceAt(wbegin, singleword);
                wbegin = -1;
                wend = -1;
            }
        }

        return plaintext;
    },

    /* Compute the (unencrypted) authentication tag, according to the CCM specification
    * @param {Object} prf The pseudorandom function.
    * @param {bitArray} plaintext The plaintext data.
    * @param {bitArray} iv The initialization value.
    * @param {bitArray} adata The authenticated data.
    * @param {Number} tlen the desired tag length, in bits.
    * @return {bitArray} The tag, but not yet encrypted.
    * @private
    */
    _computeTag: function (prf, plaintext, iv, adata, tlen, L) {
        // compute B[0]
        var q, mac, field = 0, offset = 24, tmp, i, macData = [], w = sjcl.bitArray, xor = w._xor4;

        tlen /= 8;

        // check tag length and message length
        if (tlen % 2 || tlen < 4 || tlen > 16) {
            throw new sjcl.exception.invalid("spe: invalid tag length");
        }

        if (adata.length > 0xFFFFFFFF || plaintext.length > 0xFFFFFFFF) {
            // I don't want to deal with extracting high words from doubles.
            throw new sjcl.exception.bug("spe: can't deal with 4GiB or more data");
        }

        // mac the flags
        mac = [w.partial(8, (adata.length ? 1 << 6 : 0) | (tlen - 2) << 2 | L - 1)];

        // mac the iv and length
        mac = w.concat(mac, iv);
        mac[3] |= w.bitLength(plaintext) / 8;
        mac = prf.encrypt(mac);


        if (adata.length) {
            // mac the associated data.  start with its length...
            tmp = w.bitLength(adata) / 8;
            if (tmp <= 0xFEFF) {
                macData = [w.partial(16, tmp)];
            } else if (tmp <= 0xFFFFFFFF) {
                macData = w.concat([w.partial(16, 0xFFFE)], [tmp]);
            } // else ...

            // mac the data itself
            macData = w.concat(macData, adata);
            for (i = 0; i < macData.length; i += 4) {
                mac = prf.encrypt(xor(mac, macData.slice(i, i + 4).concat([0, 0, 0])));
            }
        }

        // mac the plaintext
        for (i = 0; i < plaintext.length; i += 4) {
            mac = prf.encrypt(xor(mac, plaintext.slice(i, i + 4).concat([0, 0, 0])));
        }

        return w.clamp(mac, tlen * 8);
    },

    /** CCM CTR mode.
    * Encrypt or decrypt data and tag with the prf in CCM-style CTR mode.
    * May mutate its arguments.
    * @param {Object} prf The PRF.
    * @param {bitArray} iv The initialization vector.
    * @param {bitArray} tag The authentication tag.
    * @param {Number} tlen The length of th etag, in bits.
    * @param {Number} L The CCM L value.
    * @return {Object} An object with data and tag, the en/decryption of data and tag values.
    * @private
    */
    _ctrMode: function (prf, iv, tag, tlen, L) {
        var w = sjcl.bitArray, xor = w._xor4, ctr;

        // start the ctr
        ctr = w.concat([w.partial(8, L - 1)], iv).concat([0, 0, 0]).slice(0, 4);

        // en/decrypt the tag
        tag = w.bitSlice(xor(tag, prf.encrypt(ctr)), 0, tlen);

        return { tag: tag, ctr: ctr };
    },

    _fisherYates: function (prf, myArray) {
        var i = myArray.length;
        if (i == 0) return false;
        while (--i) {
            var rnd = this._ofb4Mode(prf);
            var j = Math.floor((i + 1) * (rnd / Math.pow(2, 32)));
            var tempi = myArray[i];
            var tempj = myArray[j];
            myArray[i] = tempj;
            myArray[j] = tempi;
        }
    },

    _ofb4ModeInit: function (prf, iv) {
        var l = iv.length;

        if (l != 4) {
            throw new sjcl.exception.invalid("spe: invalid OFB4 iv length");
        }

        sjcl.mode.spe.prf_offs = 0;

        this._f = iv;
    },

    _ofb4Mode: function (prf) {
        var l = this._f.length;

        if (l != 4) {
            throw new sjcl.exception.invalid("spe: invalid OFB4 data length");
        }

        if (sjcl.mode.spe.prf_offs > 3)
            sjcl.mode.spe.prf_offs = 0;

        if (sjcl.mode.spe.prf_offs == 0)
            this._f = prf.encrypt(this._f);

        return this._f[sjcl.mode.spe.prf_offs++] >>> 0;
    },

    _ofb4fpe1Mode: function (prf, chr) {
        var p, out, idx;

        p = { baseTable: [], shuffledTable: [], baseOffset: -1, baseRange: -1 };

        this._baseTable(prf, chr, p);

        if (p.baseTable) {
            this._fisherYates(prf, p.shuffledTable);

            out = this._ofb4Mode(prf);

            for (j = 0; j < p.baseRange; j++) {

                if (p.shuffledTable[j] == chr) {

                    idx = (p.baseRange - 1) - j;
                    break;
                }
            }

            idx = (idx + (out % p.baseRange)) % p.baseRange;

            chr = p.shuffledTable[idx];

            return String.fromCharCode(chr);
        }
    },

    _ofb4fpe2Mode: function (prf, chr, uplo) {
        var p = [], out, idx1, idx2;

        p[0] = { baseTable: [], shuffledTable: [], baseOffset: -1, baseRange: -1 };
        p[1] = { baseTable: [], shuffledTable: [], baseOffset: -1, baseRange: -1 };

        this._baseTable(prf, chr[0], p[0]);
        this._baseTable(prf, chr[1], p[1]);

        var uplo_done1 = false;
        var uplo_done2 = false;

        if (p[0].baseTable && p[1].baseTable) {

            if (p[0].baseTable[0] > p[1].baseTable[0]) {
                if (uplo) {
                    uplo_done1 = this._upLo(prf, this.uplo_mode.set, 0, chr, p);
                    uplo_done2 = this._upLo(prf, this.uplo_mode.set, 1, chr, p);
                }
                this._fisherYates(prf, p[0].shuffledTable);
                this._fisherYates(prf, p[1].shuffledTable);
            }
            else {
                if (uplo) {
                    uplo_done1 = this._upLo(prf, this.uplo_mode.set, 0, chr, p);
                    uplo_done2 = this._upLo(prf, this.uplo_mode.set, 1, chr, p);
                }
                this._fisherYates(prf, p[1].shuffledTable);
                this._fisherYates(prf, p[0].shuffledTable);
            }
        }

        if (p[0].baseTable && p[1].baseTable) {

            out = this._ofb4Mode(prf);

            for (i = 0; i < p[0].baseRange; i++) {

                if (p[0].shuffledTable[i] == chr[0]) {

                    for (j = 0; j < p[1].baseRange; j++) {

                        if (p[1].shuffledTable[j] == chr[1]) {

                            idx1 = (p[0].baseRange - 1) - i;
                            idx2 = (p[1].baseRange - 1) - j;
                            break;
                        }
                    }
                    if (idx1 >= 0)
                        break;
                }
            }

            if ((idx1 == -1) || (idx2 == -1)) {
                throw new sjcl.exception.invalid("spe: error in _ofb4fpe2Mode");
            }

            idx1 = (idx1 + (out % p[0].baseRange)) % p[0].baseRange;
            idx2 = (idx2 + (out % p[1].baseRange)) % p[1].baseRange;

            chr[1] = p[0].shuffledTable[idx1];
            chr[0] = p[1].shuffledTable[idx2];

            if (uplo_done1)
                this._upLo(prf, this.uplo_mode.revert, 0, chr, p);

            if (uplo_done2)
                this._upLo(prf, this.uplo_mode.revert, 1, chr, p);
        }
    },

    _baseTable: function (prf, chr, p) {
        var chart = uTable[chr].chart;

        switch (chart) {
            case U_NUMBERS:
                p.baseTable = uTableNumbers;
                break;
            case U_SYMBOLS_A:
                p.baseTable = uTableSymbolsA;
                break;
            case U_SYMBOLS_B:
                p.baseTable = uTableSymbolsB;
                break;
            case U_LATIN_BASE_UP:
                p.baseTable = uTableLatinBaseUp;
                break;
            case U_LATIN_BASE_LO:
                p.baseTable = uTableLatinBaseLo;
                break;
            case U_LATIN_1_SUPPLEMENT_UP:
                p.baseTable = uTableLatin1SupplementUp;
                break;
            case U_LATIN_1_SUPPLEMENT_LO:
                p.baseTable = uTableLatin1SupplementLo;
                break;
            case U_LATIN_EXTENDED_A_UP:
                p.baseTable = uTableLatinExtendedAUp;
                break;
            case U_LATIN_EXTENDED_A_LO:
                p.baseTable = uTableLatinExtendedALo;
                break;
            case U_LATIN_EXTENDED_B_UP:
                p.baseTable = uTableLatinExtendedBUp;
                break;
            case U_LATIN_EXTENDED_B_LO:
                p.baseTable = uTableLatinExtendedBLo;
                break;
            case U_CYRILLIC_BASE_UP:
                p.baseTable = uTableCyrillicBaseUp;
                break;
            case U_CYRILLIC_BASE_LO:
                p.baseTable = uTableCyrillicBaseLo;
                break;
            case U_CYRILLIC_EXTENSION_UP:
                p.baseTable = uTableCyrillicExtensionUp;
                break;
            case U_CYRILLIC_EXTENSION_LO:
                p.baseTable = uTableCyrillicExtensionLo;
                break;
            default:
                ;
        }

        if (p.baseTable) {
            p.baseOffset = p.baseTable[0];
            p.baseRange = p.baseTable.length;
            p.shuffledTable = p.baseTable.slice(0);
        }
    },

    _upLo: function (prf, mode, idx, chr, p) {
        var chart = uTable[chr[idx]].chart;
        var index = uTable[chr[idx]].index;
        var rslt = false;

        switch (chart) {
            case U_NUMBERS:
                p[idx].baseTable = uTableNumbers;
                rslt = false;
                break;
            case U_SYMBOLS_A:
                p[idx].baseTable = uTableSymbolsA;
                rslt = false;
                break;
            case U_SYMBOLS_B:
                p[idx].baseTable = uTableSymbolsB;
                rslt = false;
                break;
            case U_LATIN_BASE_UP:
                p[idx].baseTable = mode ? uTableLatinBaseLo : uTableLatinBaseUp;
                rslt = true;
                break;
            case U_LATIN_BASE_LO:
                p[idx].baseTable = mode ? uTableLatinBaseLo : uTableLatinBaseUp;
                rslt = false;
                break;
            case U_LATIN_1_SUPPLEMENT_UP:
                p[idx].baseTable = mode ? uTableLatin1SupplementLo : uTableLatin1SupplementUp;
                rslt = true;
                break;
            case U_LATIN_1_SUPPLEMENT_LO:
                p[idx].baseTable = mode ? uTableLatin1SupplementLo : uTableLatin1SupplementUp;
                rslt = false;
                break;
            case U_LATIN_EXTENDED_A_UP:
                p[idx].baseTable = mode ? uTableLatinExtendedALo : uTableLatinExtendedAUp;
                rslt = true;
                break;
            case U_LATIN_EXTENDED_A_LO:
                p[idx].baseTable = mode ? uTableLatinExtendedALo : uTableLatinExtendedAUp;
                rslt = false;
                break;
            case U_LATIN_EXTENDED_B_UP:
                p[idx].baseTable = mode ? uTableLatinExtendedBLo : uTableLatinExtendedBUp;
                rslt = true;
                break;
            case U_LATIN_EXTENDED_B_LO:
                p[idx].baseTable = mode ? uTableLatinExtendedBLo : uTableLatinExtendedBUp;
                rslt = false;
                break;
            case U_CYRILLIC_BASE_UP:
                p[idx].baseTable = mode ? uTableCyrillicBaseLo : uTableCyrillicBaseUp;
                rslt = true;
                break;
            case U_CYRILLIC_BASE_LO:
                p[idx].baseTable = mode ? uTableCyrillicBaseLo : uTableCyrillicBaseUp;
                rslt = false;
                break;
            case U_CYRILLIC_EXTENSION_UP:
                p[idx].baseTable = mode ? uTableCyrillicExtensionLo : uTableCyrillicExtensionUp;
                rslt = true;
                break;
            case U_CYRILLIC_EXTENSION_LO:
                p[idx].baseTable = mode ? uTableCyrillicExtensionLo : uTableCyrillicExtensionUp;
                rslt = false;
                break;
            default:
                rslt = false;
                ;
        }

        if (p[idx].baseTable) {
            p[idx].baseOffset = p[idx].baseTable[0];
            p[idx].baseRange = p[idx].baseTable.length;
            p[idx].shuffledTable = p[idx].baseTable.slice(0);
            chr[idx] = p[idx].baseTable[index];
        }

        return rslt;
    }

};
