/**

 JSZip - A Javascript class for generating Zip files
 <http://jszip.stuartk.co.uk>

 (c) 2009 Stuart Knightley <stuart [at] stuartk.co.uk>
 Licenced under the GPLv3 and the MIT licences

 Usage:
 zip = new JSZip();
 zip.add("hello.txt", "Hello, World!").add("tempfile", "nothing");
 zip.folder("images").add("smile.gif", base64Data, {base64: true});
 zip.add("Xmas.txt", "Ho ho ho !", {date : new Date("December 25, 2007 00:00:01")});
 zip.remove("tempfile");

 base64zip = zip.generate();

 **/

function JSZip(compression)
{
	// default : no compression
	this.compression = (compression || "STORE").toUpperCase();
	this.files = [];

	// Where we are in the hierarchy
	this.root = "";

	// Default properties for a new file
	this.d = {
		base64: false,
		binary: false,
		dir: false,
		date: null
	};

	if (!JSZip.compressions[this.compression]) {
		throw compression + " is not a valid compression method !";
	}
}

/**
 * Add a file to the zip file
 * @param   name  The name of the file
 * @param   data  The file data, either raw or base64 encoded
 * @param   o     File options
 * @return  this JSZip object
 */
JSZip.prototype.add = function(name, data, datalength, o) {

	name = AsciiExtractor(name);

	o = o || {};
	name = this.root + name;

	if (o.base64 === true && o.binary == null)
		o.binary = true;

	for (var opt in this.d) {
		o[opt] = o[opt] || this.d[opt];
	}

	// date
	// @see http://www.delorie.com/djgpp/doc/rbinter/it/52/13.html
	// @see http://www.delorie.com/djgpp/doc/rbinter/it/65/16.html
	// @see http://www.delorie.com/djgpp/doc/rbinter/it/66/16.html

	o.date = o.date || new Date();
	var dosTime, dosDate;

	dosTime = o.date.getHours();
	dosTime = dosTime << 6;
	dosTime = dosTime | o.date.getMinutes();
	dosTime = dosTime << 5;
	dosTime = dosTime | o.date.getSeconds() / 2;

	dosDate = o.date.getFullYear() - 1980;
	dosDate = dosDate << 4;
	dosDate = dosDate | (o.date.getMonth() + 1);
	dosDate = dosDate << 5;
	dosDate = dosDate | o.date.getDate();

	if (o.base64 === true)
		data = JSZipBase64.decode(data);
	// decode UTF-8 strings if we are dealing with text data
	if (o.binary === false)
		data = this.utf8encode(data);


	var compression = JSZip.compressions[this.compression];
	var compressedData = compression.compress(data);

	var header = "";

	// version needed to extract
	header += "\x0A\x00";
	// general purpose bit flag
	header += "\x01\x00"; // Encryption
	// compression method
	header += compression.magic;
	// last mod file time
	header += this.decToHex(dosTime, 2);
	// last mod file date
	header += this.decToHex(dosDate, 2);
	// crc-32
	header += this.decToHex(this.crc32(data), 4);
	// compressed size
	header += this.decToHex(compressedData.length, 4);
	// uncompressed size
	//header += this.decToHex(data.length, 4);
	header += this.decToHex(datalength, 4);
	// file name length
	header += this.decToHex(name.length, 2);
	// extra field length
	header += "\x00\x00";

	// file name

	this.files[name] = {header: header,data: compressedData,dir: o.dir};

	return this;
};

/**
 * Add a directory to the zip file
 * @param   name  The name of the directory to add
 * @return  JSZip object with the new directory as the root
 */
JSZip.prototype.folder = function(name)
{
	// Check the name ends with a /
	if (name.substr(-1) != "/")
		name += "/";

	// Does this folder already exist?
	if (typeof this.files[name] === "undefined")
		this.add(name, '', {dir: true});

	// Allow chaining by returning a new object with this folder as the root
	var ret = this.clone();
	ret.root = this.root + name;
	return ret;
};

/**
 * Compare a string or regular expression against all of the filenames and
 * return an informational object for each that matches.
 * @param   string/regex The regular expression to test against
 * @return  An array of objects representing the matched files. In the form
 *          {name: "filename", data: "file data", dir: true/false}
 */
JSZip.prototype.find = function(needle)
{
	var result = [], re;
	if (typeof needle === "string")
	{
		re = new RegExp("^" + needle + "$");
	}
	else
	{
		re = needle;
	}

	for (var filename in this.files)
	{
		if (re.test(filename))
		{
			var file = this.files[filename];
			result.push({name: filename,data: file.data,dir: !!file.dir});
		}
	}

	return result;
};

/**
 * Delete a file, or a directory and all sub-files, from the zip
 * @param   name  the name of the file to delete
 * @return  this JSZip object
 */
JSZip.prototype.remove = function(name)
{
	var file = this.files[name];
	if (!file)
	{
		// Look for any folders
		if (name.substr(-1) != "/")
			name += "/";
		file = this.files[name];
	}

	if (file)
	{
		if (name.match("/") === null)
		{
			// file
			delete this.files[name];
		}
		else
		{
			// folder
			var kids = this.find(new RegExp("^" + name));
			for (var i = 0; i < kids.length; i++)
			{
				if (kids[i].name == name)
				{
					// Delete this folder
					delete this.files[name];
				}
				else
				{
					// Remove a child of this folder
					this.remove(kids[i].name);
				}
			}
		}
	}

	return this;
};

/**
 * Generate the complete zip file
 * @return  A base64 encoded string of the zip file
 */
JSZip.prototype.generate = function(asBytes)
{
	asBytes = asBytes || false;

	// The central directory, and files data
	var directory = [], files = [], fileOffset = 0;

	for (var name in this.files)
	{
		if (!this.files.hasOwnProperty(name)) {
			continue;
		}

		var fileRecord = "", dirRecord = "";
		fileRecord = "\x50\x4b\x03\x04" + this.files[name].header + name + this.files[name].data;

		dirRecord = "\x50\x4b\x01\x02" +
			// version made by (00: DOS)
				"\x14\x00" +
			// file header (common to file and central directory)
				this.files[name].header +
			// file comment length
				"\x00\x00" +
			// disk number start
				"\x00\x00" +
			// internal file attributes TODO
				"\x00\x00" +
			// external file attributes
				(this.files[name].dir === true ? "\x10\x00\x00\x00" : "\x00\x00\x00\x00") +
			// relative offset of local header
				this.decToHex(fileOffset, 4) +
			// file name
				name;

		fileOffset += fileRecord.length;

		files.push(fileRecord);
		directory.push(dirRecord);
	}

	var fileData = files.join("");
	var dirData = directory.join("");

	var dirEnd = "";

	// end of central dir signature
	dirEnd = "\x50\x4b\x05\x06" +
		// number of this disk
			"\x00\x00" +
		// number of the disk with the start of the central directory
			"\x00\x00" +
		// total number of entries in the central directory on this disk
			this.decToHex(files.length, 2) +
		// total number of entries in the central directory
			this.decToHex(files.length, 2) +
		// size of the central directory   4 bytes
			this.decToHex(dirData.length, 4) +
		// offset of start of central directory with respect to the starting disk number
			this.decToHex(fileData.length, 4) +
		// .ZIP file comment length
			"\x00\x00";

	var zip = fileData + dirData + dirEnd;
	return (asBytes) ? zip : JSZipBase64.encode(zip);

};

/*
 * Compression methods
 * This object is filled in as follow :
 * name : {
 *    magic // the 2 bytes indentifying the compression method
 *    compress // function, take the uncompressed content and return it compressed.
 * }
 *
 * STORE is the default compression method, so it's included in this file.
 * Other methods should go to separated files : the user wants modularity.
 */
JSZip.compressions = {
	"STORE": {
		magic: "\x00\x00",
		compress: function(content) {
			return content; // no compression
		}
	},
	"JSON": {
		magic: "\x15\x00",
		compress: function(content) {
			return content; // Json format with no compression
		}
	}
};

// Utility functions

JSZip.prototype.decToHex = function(dec, bytes)
{
	var hex = "";
	for (var i = 0; i < bytes; i++) {
		hex += String.fromCharCode(dec & 0xff);
		dec = dec >>> 8;
	}
	return hex;
};

JSZip.prototype.crc32 = function(data, crc)
{
	if( typeof(data) === 'undefined' || data.length === 0 )
		return 0;

	if( typeof(crc) == 'undefined' )
		crc = 0;

	var crc32table = [
		0x00000000, 0x77073096, 0xee0e612c, 0x990951ba, 0x076dc419, 0x706af48f, 0xe963a535,
		0x9e6495a3, 0x0edb8832, 0x79dcb8a4, 0xe0d5e91e, 0x97d2d988, 0x09b64c2b, 0x7eb17cbd,
		0xe7b82d07, 0x90bf1d91, 0x1db71064, 0x6ab020f2, 0xf3b97148, 0x84be41de, 0x1adad47d,
		0x6ddde4eb, 0xf4d4b551, 0x83d385c7, 0x136c9856, 0x646ba8c0, 0xfd62f97a, 0x8a65c9ec,
		0x14015c4f, 0x63066cd9, 0xfa0f3d63, 0x8d080df5, 0x3b6e20c8, 0x4c69105e, 0xd56041e4,
		0xa2677172, 0x3c03e4d1, 0x4b04d447, 0xd20d85fd, 0xa50ab56b, 0x35b5a8fa, 0x42b2986c,
		0xdbbbc9d6, 0xacbcf940, 0x32d86ce3, 0x45df5c75, 0xdcd60dcf, 0xabd13d59, 0x26d930ac,
		0x51de003a, 0xc8d75180, 0xbfd06116, 0x21b4f4b5, 0x56b3c423, 0xcfba9599, 0xb8bda50f,
		0x2802b89e, 0x5f058808, 0xc60cd9b2, 0xb10be924, 0x2f6f7c87, 0x58684c11, 0xc1611dab,
		0xb6662d3d, 0x76dc4190, 0x01db7106, 0x98d220bc, 0xefd5102a, 0x71b18589, 0x06b6b51f,
		0x9fbfe4a5, 0xe8b8d433, 0x7807c9a2, 0x0f00f934, 0x9609a88e, 0xe10e9818, 0x7f6a0dbb,
		0x086d3d2d, 0x91646c97, 0xe6635c01, 0x6b6b51f4, 0x1c6c6162, 0x856530d8, 0xf262004e,
		0x6c0695ed, 0x1b01a57b, 0x8208f4c1, 0xf50fc457, 0x65b0d9c6, 0x12b7e950, 0x8bbeb8ea,
		0xfcb9887c, 0x62dd1ddf, 0x15da2d49, 0x8cd37cf3, 0xfbd44c65, 0x4db26158, 0x3ab551ce,
		0xa3bc0074, 0xd4bb30e2, 0x4adfa541, 0x3dd895d7, 0xa4d1c46d, 0xd3d6f4fb, 0x4369e96a,
		0x346ed9fc, 0xad678846, 0xda60b8d0, 0x44042d73, 0x33031de5, 0xaa0a4c5f, 0xdd0d7cc9,
		0x5005713c, 0x270241aa, 0xbe0b1010, 0xc90c2086, 0x5768b525, 0x206f85b3, 0xb966d409,
		0xce61e49f, 0x5edef90e, 0x29d9c998, 0xb0d09822, 0xc7d7a8b4, 0x59b33d17, 0x2eb40d81,
		0xb7bd5c3b, 0xc0ba6cad, 0xedb88320, 0x9abfb3b6, 0x03b6e20c, 0x74b1d29a, 0xead54739,
		0x9dd277af, 0x04db2615, 0x73dc1683, 0xe3630b12, 0x94643b84, 0x0d6d6a3e, 0x7a6a5aa8,
		0xe40ecf0b, 0x9309ff9d, 0x0a00ae27, 0x7d079eb1, 0xf00f9344, 0x8708a3d2, 0x1e01f268,
		0x6906c2fe, 0xf762575d, 0x806567cb, 0x196c3671, 0x6e6b06e7, 0xfed41b76, 0x89d32be0,
		0x10da7a5a, 0x67dd4acc, 0xf9b9df6f, 0x8ebeeff9, 0x17b7be43, 0x60b08ed5, 0xd6d6a3e8,
		0xa1d1937e, 0x38d8c2c4, 0x4fdff252, 0xd1bb67f1, 0xa6bc5767, 0x3fb506dd, 0x48b2364b,
		0xd80d2bda, 0xaf0a1b4c, 0x36034af6, 0x41047a60, 0xdf60efc3, 0xa867df55, 0x316e8eef,
		0x4669be79, 0xcb61b38c, 0xbc66831a, 0x256fd2a0, 0x5268e236, 0xcc0c7795, 0xbb0b4703,
		0x220216b9, 0x5505262f, 0xc5ba3bbe, 0xb2bd0b28, 0x2bb45a92, 0x5cb36a04, 0xc2d7ffa7,
		0xb5d0cf31, 0x2cd99e8b, 0x5bdeae1d, 0x9b64c2b0, 0xec63f226, 0x756aa39c, 0x026d930a,
		0x9c0906a9, 0xeb0e363f, 0x72076785, 0x05005713, 0x95bf4a82, 0xe2b87a14, 0x7bb12bae,
		0x0cb61b38, 0x92d28e9b, 0xe5d5be0d, 0x7cdcefb7, 0x0bdbdf21, 0x86d3d2d4, 0xf1d4e242,
		0x68ddb3f8, 0x1fda836e, 0x81be16cd, 0xf6b9265b, 0x6fb077e1, 0x18b74777, 0x88085ae6,
		0xff0f6a70, 0x66063bca, 0x11010b5c, 0x8f659eff, 0xf862ae69, 0x616bffd3, 0x166ccf45,
		0xa00ae278, 0xd70dd2ee, 0x4e048354, 0x3903b3c2, 0xa7672661, 0xd06016f7, 0x4969474d,
		0x3e6e77db, 0xaed16a4a, 0xd9d65adc, 0x40df0b66, 0x37d83bf0, 0xa9bcae53, 0xdebb9ec5,
		0x47b2cf7f, 0x30b5ffe9, 0xbdbdf21c, 0xcabac28a, 0x53b39330, 0x24b4a3a6, 0xbad03605,
		0xcdd70693, 0x54de5729, 0x23d967bf, 0xb3667a2e, 0xc4614ab8, 0x5d681b02, 0x2a6f2b94,
		0xb40bbe37, 0xc30c8ea1, 0x5a05df1b, 0x2d02ef8d
	];

	var octet = 0;

	crc = crc ^ (-1);
	for( var i = 0, iTop = data.length; i < iTop; i++ )
	{
		octet = (crc ^ data.charCodeAt(i)) & 0xff;
		crc = (crc >>> 8) ^ crc32table[octet];
	}

	return crc ^ (-1);
}

// Inspired by http://my.opera.com/GreyWyvern/blog/show.dml/1725165
JSZip.prototype.clone = function()
{
	var newObj = new JSZip();
	for (var i in this)
	{
		if (typeof this[i] !== "function")
		{
			newObj[i] = this[i];
		}
	}
	return newObj;
};

JSZip.prototype.utf8encode = function(input)
{
	input = encodeURIComponent(input);
	input = input.replace(/%.{2,2}/g, function(m) {
		var hex = m.substring(1);
		return String.fromCharCode(parseInt(hex, 16));
	});
	return input;
};

var AsciiExtractor = (function() {
	var translate_re = /[öäüÖÄÜáàâéèêúùûóòôÁÀÂÉÈÊÚÙÛÓÒÔßäčďěíĺľňřšťúůýžÄČĎĚÍĹĽŇŘŠŤÚŮÝŽ]/g;
	var translate = {
		"ä": "a","ö": "o","ü": "u",
		"Ä": "A","Ö": "O","Ü": "U",
		"á": "a","à": "a","â": "a",
		"é": "e","è": "e","ê": "e",
		"ú": "u","ù": "u","û": "u",
		"ó": "o","ò": "o","ô": "o",
		"Á": "A","À": "A","Â": "A",
		"É": "E","È": "E","Ê": "E",
		"Ú": "U","Ù": "U","Û": "U",
		"Ó": "O","Ò": "O","Ô": "O",
		"ß": "s",
		"č": "c","ď": "d","ě": "e",
		"Č": "C","Ď": "D","Ě": "E",
		"í": "i","ĺ": "l","ľ": "l",
		"Í": "I","Ĺ": "L","Ľ": "L",
		"ň": "n","ř": "r","š": "s",
		"Ň": "N","Ř": "R","Š": "S",
		"ť": "t","ú": "u","ů": "u",
		"Ť": "T","Ú": "U","Ů": "u",
		"ý": "y","ž": "z","ä": "a",
		"Ý": "Y","Ž": "Z","Ä": "A"
	};
	return function(s) {
		return (s.replace(translate_re, function(match) {
			return translate[match];
		}));
	}
})();

/**
 *
 *  Base64 encode / decode
 *  http://www.webtoolkit.info/
 *
 *  Hacked so that it doesn't utf8 en/decode everything
 **/

var JSZipBase64 = function() {
	// private property
	var _keyStr = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";

	return {
		// public method for encoding
		encode: function(input, utf8) {
			var output = "";
			var chr1, chr2, chr3, enc1, enc2, enc3, enc4;
			var i = 0;

			if (window.btoa)
				return window.btoa(input)
			else {
				while (i < input.length) {
					chr1 = input.charCodeAt(i++);
					chr2 = input.charCodeAt(i++);
					chr3 = input.charCodeAt(i++);

					enc1 = chr1 >> 2;
					enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
					enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
					enc4 = chr3 & 63;

					if (isNaN(chr2)) {
						enc3 = enc4 = 64;
					} else if (isNaN(chr3)) {
						enc4 = 64;
					}

					output = output +
							_keyStr.charAt(enc1) + _keyStr.charAt(enc2) +
							_keyStr.charAt(enc3) + _keyStr.charAt(enc4);
				}
			}

			return output;
		},

		// public method for decoding
		decode: function(input, utf8) {
			var output = "";
			var chr1, chr2, chr3;
			var enc1, enc2, enc3, enc4;
			var i = 0;

			input = input.replace(/[^A-Za-z0-9\+\/\=]/g, "");

			if (window.atob)
				return window.atob(input)
			else {
				while (i < input.length) {
					enc1 = _keyStr.indexOf(input.charAt(i++));
					enc2 = _keyStr.indexOf(input.charAt(i++));
					enc3 = _keyStr.indexOf(input.charAt(i++));
					enc4 = _keyStr.indexOf(input.charAt(i++));

					chr1 = (enc1 << 2) | (enc2 >> 4);
					chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
					chr3 = ((enc3 & 3) << 6) | enc4;

					output = output + String.fromCharCode(chr1);

					if (enc3 != 64) {
						output = output + String.fromCharCode(chr2);
					}
					if (enc4 != 64) {
						output = output + String.fromCharCode(chr3);
					}
				}
			}

			return output;
		}
	};
}();