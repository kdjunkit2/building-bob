//=============================== UTILITY FUNCTIONS ===================================

function randIntBetween(min, max) {
	if(min==max) return max;
	if(min > max) {let t=min; min=max; max=t;}
	return Math.floor(Math.random()*(max-min+1))+min;
}

function validateInteger(value, allowNegative = true, wrapNegative = 0) {
	if(typeof value != 'number') return 0;

	if(Number.isInteger(value)) {
		if(!allowNegative && value < 0) {
			if(wrapNegative) return wrapNegative + value;
		}
		return value;
	}

	if(value % 1 != 0) {
		value = Math.round(value);
		if(!allowNegative && value < 0) {
			if(wrapNegative) return wrapNegative + value;
		}
		return value;
	}

	return 0;
}

function uniqueArray(arr) {
	if(!arr) return [];
	if(arr.length < 1) return [];
	let uset = new Set(arr);
	return Array.from(uset);
}

function shuffleArray(array) {
	let currentIndex = array.length,  randomIndex;

	while (currentIndex > 0) {
		randomIndex = Math.floor(Math.random() * currentIndex);
		currentIndex--;
		[array[currentIndex], array[randomIndex]] = [
		array[randomIndex], array[currentIndex]];
	}

	return array;
}

function expandArray(array, dim) {
	if(!array) return [];
	if(!array.length) return [];
	let len = array.length;
	if(len == dim) return array;
	if(len > dim) return array.slice(0, dim);

	let narray = new Array(dim); // Create the expanded array
    let step = (dim - 1) / (array.length - 1); // Spacing for the original points in the new array

    // Place original values at their exact positions in the new array
    for (let i = 0; i < array.length; i++) {
        let index = Math.round(i * step); // Calculate the position in the new array
        narray[index] = array[i]; // Place the value
    }

    // Fill in interpolated values for the remaining positions
    for (let i = 0; i < dim; i++) {
        if (narray[i] === undefined) {
            // Find nearest defined neighbors
            let leftIndex = i - 1;
            while (leftIndex >= 0 && narray[leftIndex] === undefined) {
                leftIndex--;
            }

            let rightIndex = i + 1;
            while (rightIndex < dim && narray[rightIndex] === undefined) {
                rightIndex++;
            }

            // Interpolate between the nearest defined neighbors
            if (leftIndex >= 0 && rightIndex < dim) {
                let leftValue = narray[leftIndex];
                let rightValue = narray[rightIndex];
                let weight = (i - leftIndex) / (rightIndex - leftIndex);
                narray[i] = leftValue * (1 - weight) + rightValue * weight;
            }
        }
    }

    return narray;
}

function blendArrays(a1, a2, weight1 = 0.5) {
	if(!a1 || !a2) return [];
	if(!a1.length || !a2.length || a1.length != a2.length) return [];
	let narray = [];
	for(i=0; i<a1.length; i++) {
		narray[i] = a1[i] * weight1 + a2[i] * (1 - weight1);
	}

	return narray;
}

function scaleArray(array, newMin, newMax) {
    if(!array) return [];
	if(!array.length) return [];
	if(newMin == newMax) return [];

	let temp;
	if(newMin > newMax) {temp = newMin; newMin = newMax, newMax = temp;}

    const min = Math.min(...array);
    const max = Math.max(...array);

    if (min === max) {
        throw new Error("Array cannot have all identical values.");
    }

    return array.map(value => {
        const normalized = (value - min) / (max - min); // Normalize to [0, 1]
        return normalized * (newMax - newMin) + newMin; // Rescale to [newMin, newMax]
    });
}

function scaleFactorArray(array, factor) {
	if(!array) return [];
	if(!array.length) return [];
	return array.map(number => number * factor);
}

function powerArray(array, exponent) {
	if(!array) return [];
	if(!array.length) return [];
	return array.map(number => Math.pow(number, exponent));
}

function constantArray(array, factor) {
	if(!array) return [];
	if(!array.length) return [];
	return array.map(number => number + factor);
}

function meanArray(array) {
	if(!array) return 0;
	if(!array.length) return 0;
	return array.reduce((a, b) => a + b) / array.length;
}

function meanMagArray(array) {
	if(!array) return 0;
	if(!array.length) return 0;
	return array.reduce((a, b) => Math.abs(a) + Math.abs(b)) / array.length;
}

function minArray(array) {
	if(!array) return 0;
	if(!array.length) return 0;
	return Math.min(...array);
}

function maxArray(array) {
	if(!array) return 0;
	if(!array.length) return 0;
	return Math.max(...array);
}

function statArray(array) {
	if(!array) return {min: 0, max: 0, range: 0, mean: 0};
	if(!array.length) return {min: 0, max: 0, range: 0, mean: 0};
	let min = Math.min(...array);
	let max = Math.max(...array);
	let ave = array.reduce((a, b) => a + b) / array.length;
	return {min: min, max: max, range: (max-min), mean: ave};

}

function digitLength(n, l) {
    let padlen = l - n.length;
    let vstr = '';
    for(let i=0; i<padlen; i++) {vstr += '0';}
    vstr += n;
    return vstr;
}

function paddArrayRight(arr, len, fill) {
	if(len <= 0) return arr;
	let arr2 = Array(len).fill(fill);
	return arr.concat(arr2);
}

function paddArrayLeft(arr, len, fill) {
	if(len <= 0) return arr;
	let arr2 = Array(len).fill(fill);
	return arr2.concat(arr);
}

function topObjectKey(obj) {
	let max = Object.keys(obj).reduce((a, b) => obj[a] > obj[b] ? a : b);
	return {key: max, value: obj[max]};
}

function meanPoolArrays(arrayOfArrays) {
	if (!arrayOfArrays || arrayOfArrays.length === 0) {
		return []; // Handle empty input
	}

	const numInnerArrays = arrayOfArrays.length;
	const numPositions = arrayOfArrays[0].length; // Assuming all inner arrays have the same length
	const averages = new Array(numPositions).fill(0); // Initialize with zeros

	// Iterate through each inner array
	for (let i = 0; i < numInnerArrays; i++) {
		const currentArray = arrayOfArrays[i];
		// Iterate through each position within the current inner array
		for (let j = 0; j < numPositions; j++) {
			averages[j] += currentArray[j]; // Sum values at each position
		}
	}

	// Calculate the average for each position
	for (let i = 0; i < numPositions; i++) {
		averages[i] /= numInnerArrays;
	}

	return averages;
}

function maxPoolArrays(arrayOfArrays) {
	if (!arrayOfArrays || arrayOfArrays.length === 0) {
		return []; // Handle empty input
	}

	const numInnerArrays = arrayOfArrays.length;
	const numPositions = arrayOfArrays[0].length; // Assuming all inner arrays have the same length
	const maxes = new Array(numPositions).fill(-Infinity); // Initialize with zeros

	// Iterate through each inner array
	for (let i = 0; i < numInnerArrays; i++) {
		const currentArray = arrayOfArrays[i];
		// Iterate through each position within the current inner array
		for (let j = 0; j < numPositions; j++) {
			if(currentArray[j] > maxes[j]) maxes[j] = currentArray[j];
		}
	}

	return maxes;
}

//========================================== COLOR CONVERSION =====================================

function hexToRgb(hex) {
	var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
	return result ? {
		r: parseInt(result[1], 16),
		g: parseInt(result[2], 16),
		b: parseInt(result[3], 16)
	} : null;
}

function scaleColor(color, factor) {
	color.r = Math.floor(color.r * factor); if(color.r > 255) color.r = 255;
	color.g = Math.floor(color.g * factor); if(color.g > 255) color.g = 255;
	color.b = Math.floor(color.b * factor); if(color.b > 255) color.b = 255;
	return color;
}

function hexScaleColor(hex, factor) {
	let color = scaleColor(hexToRgb(hex), factor);
	return rgbToHex(color.r, color.g, color.b);
}

function componentToHex(c) {
	var hex = c.toString(16);
	return hex.length == 1 ? "0" + hex : hex;
}

function rgbToHex(r, g, b) {
  	return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
}

function rgbToHexObj(color) {return rgbToHex(color.r, color.g, color.b);}

function colorIntensityHex(c) {
	let color = hexToRgb(c);
	return colorIntensity(color);
}

function colorIntensity(color) {return (color.r + color.g + color.b)/3;}

//======================================== COPY TO CLIPBOARD ====================================

function copyDivText(eleid, callback=null) {
	const divElement = document.getElementById(eleid);
	const textToCopy = divElement.textContent;
  
	navigator.clipboard.writeText(textToCopy)
		.then(() => {
			if(callback) callback({status: 'success', msg: 'Text copied to clipboard'})
		})
		.catch(err => {
			if(callback) callback({status: 'fail', msg: `Text not copied to clipboard [${err}]`})
		});
  }

//======================================== DELIMITED TEXT ========================================

function delimToArray(strData, strDelimiter){
	// Check to see if the delimiter is defined. If not, then default to comma.
	strDelimiter = (strDelimiter || ",");

	// Create a regular expression to parse the CSV values.
	var objPattern = new RegExp(
		(
			// Delimiters.
			"(\\" + strDelimiter + "|\\r?\\n|\\r|^)" +

			// Quoted fields.
			"(?:\"([^\"]*(?:\"\"[^\"]*)*)\"|" +

			// Standard fields.
			"([^\"\\" + strDelimiter + "\\r\\n]*))"
		),
		"gi"
		);

	// Create an array to hold our data. Give the array a default empty first row.
	var arrData = [[]];
	// Create an array to hold our individual pattern matching groups.
	var arrMatches = null;


	// Keep looping over the regular expression matches until we can no longer find a match.
	while (arrMatches = objPattern.exec( strData )){

		// Get the delimiter that was found.
		var strMatchedDelimiter = arrMatches[ 1 ];

		// Check to see if the given delimiter has a length (is not the start of string) and if it matches
		// field delimiter. If id does not, then we know that this delimiter is a row delimiter.
		if (
			strMatchedDelimiter.length &&
			(strMatchedDelimiter != strDelimiter)
			){

			// Since we have reached a new row of data, add an empty row to our data array.
			arrData.push( [] );

		}


		// Now that we have our delimiter out of the way, let's check to see which kind of value we captured (quoted or unquoted).
		if (arrMatches[2]){

			// We found a quoted value. When we capture this value, unescape any double quotes.
			var strMatchedValue = arrMatches[ 2 ].replace(
				new RegExp( "\"\"", "g" ),
				"\""
				);

		} else {

			// We found a non-quoted value.
			var strMatchedValue = arrMatches[3];

		}
		// Now that we have our value string, let's add it to the data array.
		arrData[arrData.length - 1].push(strMatchedValue);
	}

	// Return the parsed data.
	return arrData;
}
 