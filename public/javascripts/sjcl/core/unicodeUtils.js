var UNICODE_MAX = 0xFFFF;

var U_NUMBERS = 0;
var U_SYMBOLS_A = 1;
var U_SYMBOLS_B = 2;
var U_LATIN_BASE_UP = 3;
var U_LATIN_BASE_LO = 4;
var U_LATIN_1_SUPPLEMENT_UP = 5;
var U_LATIN_1_SUPPLEMENT_LO = 6;
var U_LATIN_EXTENDED_A_UP = 7;
var U_LATIN_EXTENDED_A_LO = 8;
var U_LATIN_EXTENDED_B_UP = 9;
var U_LATIN_EXTENDED_B_LO = 10;
var U_CYRILLIC_BASE_UP = 11;
var U_CYRILLIC_BASE_LO = 12;
var U_CYRILLIC_EXTENSION_UP = 13;
var U_CYRILLIC_EXTENSION_LO = 14;

var uTable = [];

function uTableInit() {
    for (i = 0; i < UNICODE_MAX; i++)
	{
	    uTable[i] = {
	        chart: -1,
	        uplo: 0,
	        index: 0
	    };

		if (uTable[i].chart == -1) {
		    if ((i >= uTableNumbers[0]) && (i <= uTableNumbers[uTableNumbers.length - 1])) {
		        for (j = 0; j < (uTableNumbers.length); j++)
			    {
			        if (i == uTableNumbers[j])
				    {
				        uTable[i].chart = U_NUMBERS;
				        uTable[i].uplo = 0;
				        uTable[i].index = j;
					    break;
				    }
			    }
            }
		}
        if (uTable[i].chart == -1) {
            if ((i >= uTableSymbolsA[0]) && (i <= uTableSymbolsA[uTableSymbolsA.length - 1])) {
                for (j = 0; j < (uTableSymbolsA.length); j++) {
                    if (i == uTableSymbolsA[j]) {
                        uTable[i].chart = U_SYMBOLS_A;
                        uTable[i].uplo = 0;
                        uTable[i].index = j;
                        break;
                    }
                }
            }
        }
        if (uTable[i].chart == -1) {
            if ((i >= uTableSymbolsB[0]) && (i <= uTableSymbolsB[uTableSymbolsB.length - 1])) {
                for (j = 0; j < (uTableSymbolsB.length); j++) {
                    if (i == uTableSymbolsB[j]) {
                        uTable[i].chart = U_SYMBOLS_B;
                        uTable[i].uplo = 0;
                        uTable[i].index = j;
                        break;
                    }
                }
            }
        }
        if (uTable[i].chart == -1) {
		    if ((i >= uTableLatinBaseUp[0]) && (i <= uTableLatinBaseUp[uTableLatinBaseUp.length - 1])) {
		        for (j = 0; j < (uTableLatinBaseUp.length); j++) {
		            if (i == uTableLatinBaseUp[j]) {
		                uTable[i].chart = U_LATIN_BASE_UP;
		                uTable[i].uplo = 1;
		                uTable[i].index = j;
		                break;
		            }
		        }
		    }
		}
		if (uTable[i].chart == -1) {
		    if ((i >= uTableLatinBaseLo[0]) && (i <= uTableLatinBaseLo[uTableLatinBaseLo.length - 1])) {
                for (j = 0; j < (uTableLatinBaseLo.length); j++) {
                    if (i == uTableLatinBaseLo[j]) {
                        uTable[i].chart = U_LATIN_BASE_LO;
                        uTable[i].uplo = 2;
                        uTable[i].index = j;
                        break;
                    }
                }
		    }
		}
		if (uTable[i].chart == -1) {
		    if ((i >= uTableLatin1SupplementUp[0]) && (i <= uTableLatin1SupplementUp[uTableLatin1SupplementUp.length - 1])) {
		        for (j = 0; j < (uTableLatin1SupplementUp.length); j++) {
		            if (i == uTableLatin1SupplementUp[j]) {
		                uTable[i].chart = U_LATIN_1_SUPPLEMENT_UP;
		                uTable[i].uplo = 1;
		                uTable[i].index = j;
		                break;
		            }
		        }
            }
		}
		if (uTable[i].chart == -1) {
		    if ((i >= uTableLatin1SupplementLo[0]) && (i <= uTableLatin1SupplementLo[uTableLatin1SupplementLo.length - 1])) {
		        for (j = 0; j < (uTableLatin1SupplementLo.length); j++) {
		            if (i == uTableLatin1SupplementLo[j]) {
		                uTable[i].chart = U_LATIN_1_SUPPLEMENT_LO;
		                uTable[i].uplo = 2;
		                uTable[i].index = j;
		                break;
		            }
		        }
		    }
		}
		if (uTable[i].chart == -1) {
		    if ((i >= uTableLatinExtendedAUp[0]) && (i <= uTableLatinExtendedAUp[uTableLatinExtendedAUp.length - 1])) {
		        for (j = 0; j < (uTableLatinExtendedAUp.length); j++) {
		            if (i == uTableLatinExtendedAUp[j]) {
		                uTable[i].chart = U_LATIN_EXTENDED_A_UP;
		                uTable[i].uplo = 1;
		                uTable[i].index = j;
		                break;
		            }
		        }
            }
		}
		if (uTable[i].chart == -1) {
		    if ((i >= uTableLatinExtendedALo[0]) && (i <= uTableLatinExtendedALo[uTableLatinExtendedALo.length - 1])) {
		        for (j = 0; j < (uTableLatinExtendedALo.length); j++) {
		            if (i == uTableLatinExtendedALo[j]) {
		                uTable[i].chart = U_LATIN_EXTENDED_A_LO;
		                uTable[i].uplo = 2;
		                uTable[i].index = j;
		                break;
		            }
		        }
		    }
		}
		if (uTable[i].chart == -1) {
		    if ((i >= uTableLatinExtendedBUp[0]) && (i <= uTableLatinExtendedBUp[uTableLatinExtendedBUp.length - 1])) {
		        for (j = 0; j < (uTableLatinExtendedBUp.length); j++) {
		            if (i == uTableLatinExtendedBUp[j]) {
		                uTable[i].chart = U_LATIN_EXTENDED_B_UP;
		                uTable[i].uplo = 1;
		                uTable[i].index = j;
		                break;
		            }
		        }
            }
		}
		if (uTable[i].chart == -1) {
		    if ((i >= uTableLatinExtendedBLo[0]) && (i <= uTableLatinExtendedBLo[uTableLatinExtendedBLo.length - 1])) {
		        for (j = 0; j < (uTableLatinExtendedBLo.length); j++) {
		            if (i == uTableLatinExtendedBLo[j]) {
		                uTable[i].chart = U_LATIN_EXTENDED_B_LO;
		                uTable[i].uplo = 2;
		                uTable[i].index = j;
		                break;
		            }
		        }
		    }
		}
		if (uTable[i].chart == -1) {
		    if ((i >= uTableCyrillicBaseUp[0]) && (i <= uTableCyrillicBaseUp[uTableCyrillicBaseUp.length - 1])) {
		        for (j = 0; j < (uTableCyrillicBaseUp.length); j++) {
		            if (i == uTableCyrillicBaseUp[j]) {
		                uTable[i].chart = U_CYRILLIC_BASE_UP;
		                uTable[i].uplo = 1;
		                uTable[i].index = j;
		                break;
		            }
		        }
		    }
		}
		if (uTable[i].chart == -1) {
		    if ((i >= uTableCyrillicBaseLo[0]) && (i <= uTableCyrillicBaseLo[uTableCyrillicBaseLo.length - 1])) {
		        for (j = 0; j < (uTableCyrillicBaseLo.length); j++) {
		            if (i == uTableCyrillicBaseLo[j]) {
		                uTable[i].chart = U_CYRILLIC_BASE_LO;
		                uTable[i].uplo = 2;
		                uTable[i].index = j;
		                break;
		            }
		        }
		    }
		}
		if (uTable[i].chart == -1) {
		    if ((i >= uTableCyrillicExtensionUp[0]) && (i <= uTableCyrillicExtensionUp[uTableCyrillicExtensionUp.length - 1])) {
		        for (j = 0; j < (uTableCyrillicExtensionUp.length); j++) {
		            if (i == uTableCyrillicExtensionUp[j]) {
		                uTable[i].chart = U_CYRILLIC_EXTENSION_UP;
		                uTable[i].uplo = 1;
		                uTable[i].index = j;
		                break;
		            }
		        }
		    }
		}
		if (uTable[i].chart == -1) {
		    if ((i >= uTableCyrillicExtensionLo[0]) && (i <= uTableCyrillicExtensionLo[uTableCyrillicExtensionLo.length - 1])) {
		        for (j = 0; j < (uTableCyrillicExtensionLo.length); j++) {
		            if (i == uTableCyrillicExtensionLo[j]) {
		                uTable[i].chart = U_CYRILLIC_EXTENSION_LO;
		                uTable[i].uplo = 2;
		                uTable[i].index = j;
		                break;
		            }
		        }
		    }
		}
    }
}
