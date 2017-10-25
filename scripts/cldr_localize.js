/* A little utility to translate Country names for Webogram.
 * You need to install nodejs.
 * Usage: node <thisfile> <languageCode> <inputFile> [outputFile]
 * If outputFile is not specified, inputFile will be overwritten.
 *
 * @author: Michele Locati <mlocati@gmail.com>
 * @licence: MIT
 */
try {
	var fs = require('fs'), path = require('path');

	var cldrFolder = path.join(__dirname, 'cldr');
	if(!(isDir(cldrFolder) && isDir(path.join(cldrFolder, 'main')))) {
			process.stderr.write('Please download the CLDR json data from http://cldr.unicode.org and extract it to the following directory:\n' + cldrFolder + '\n');
			process.exit(1);
	}

	var locale, inputFile, outputFile = '';
	switch(process.argv.length) {
		case 5:
			outputFile = process.argv[4];
			/*-fallthrough*/
		case 4:
			inputFile = process.argv[3];
			locale = process.argv[2];
			break;
		default:
			process.stderr.write('Syntax:\n' + process.argv[0] + ' ' + path.basename(process.argv[1]) + ' <languageCode> <inputFile> [outputFile]' + '\n');
			process.exit(1);
	}

	var foundLocale = '';
	getLocaleAlternatives(locale).every(function(loc) {
		if(isDir(path.join(cldrFolder, 'main', loc))) {
			foundLocale = loc;
			return false;
		}
		return true;
	});
	if(foundLocale.length === 0) {
		process.stderr.write('Unable to find data folder for the "' + locale + '" language.');
		process.exit(1);
	}
	process.stdout.write('Found locale: ' + foundLocale + '\n');
	var territoryData = readJsonFromFile(path.join(cldrFolder, 'main', foundLocale, 'territories.json'));
	var displayNames = territoryData.main[foundLocale].localeDisplayNames.territories;
	var theData = readJsonFromFile(inputFile);
	var inputKey, match, territoryID;
	for(inputKey in theData) {
		if (theData.hasOwnProperty(inputKey)) {
			match = /^country_select_modal_country_([a-z]+)$/.exec(inputKey);
			if(match) {
				territoryID = match[1].toUpperCase();
				process.stdout.write('Found territory: ' + territoryID + ' (' + theData[inputKey] + ')... ');
				if(displayNames.hasOwnProperty(territoryID)) {
					process.stdout.write('translated as "' + displayNames[territoryID] + '"\n');
					theData[inputKey] = displayNames[territoryID];
				}
				else {
					process.stdout.write('NOT FOUND IN CLDR!\n');
				}
			}
		}
	}
	if(outputFile.length === 0) {
		outputFile = inputFile;
	}
	writeJsonToFile(outputFile, theData);
	process.stdout.write('File written: "' + outputFile  + '"!\n');
}
catch(e) {
	process.stderr.write(e.message + '\n');
	process.exit(1);
}

function isFile(path) {
	var r = false;
	if((typeof(path) === 'string') && (path.length > 0)) {
		try {
			if(fs.existsSync(path)) {
				if(fs.lstatSync(path).isFile()) {
					r = true;
				}
			}
		}
		catch(x) {
		}
	}
	return r;
}

function isDir(path) {
	var r = false;
	if((typeof(path) === 'string') && (path.length > 0)) {
		try {
			if(fs.existsSync(path)) {
				if(fs.lstatSync(path).isDirectory()) {
					r = true;
				}
			}
		}
		catch(x) {
		}
	}
	return r;
}

function getLocaleAlternatives(locale) {
	var language = '', script = '', territory = '';
	locale.replace(/_/g, '-').split('-').forEach(function(chunk, index) {
		if(index === 0) {
			language = chunk.toLowerCase();
		}
		else if(chunk.length === 4) {
			if(script.length > 0) {
				throw new Error('"' + locale + '" is not a valid locale identifier');
			}
			script = chunk.charAt(0).toUpperCase() + chunk.substr(1).toLowerCase();
		}
		else if(territory.length) {
			throw new Error('"' + locale + '" is not a valid locale identifier');
		}
		else {
			if(/^[a-z]{2}$/i.test(chunk) || /^[0-9]{3}$/i.test(chunk)) {
				territory = chunk.toUpperCase();
			}
			else {
			console.log(chunk);
				throw new Error('"' + locale + '" is not a valid locale identifier');
			}
		}
	});
	if(language.length === 0) {
		throw new Error('"' + locale + '" is not a valid locale identifier');
	}
	var result = [];
	if((script.length > 0) && (territory.length > 0)) {
		result.push([language, script, territory].join('-'));
	}
	if(script.length > 0) {
		result.push([language, script].join('-'));
	}
	if(territory.length > 0) {
		result.push([language, territory].join('-'));
	}
	result.push(language);
	return result;
}

function readJsonFromFile(path) {
	if(!isFile(path)) {
		throw new Error('File not found: ' + path);
	}
	var fileContents = fs.readFileSync(path), data;
	try {
		data = JSON.parse(fileContents);
	}
	catch(e) {
		throw new Error('Error reading JSON file ' + path + ':\n' + e.message);
	}
	return data;
}
function writeJsonToFile(path, data) {
	fs.writeFileSync(path, JSON.stringify(data, null, 4));
}
