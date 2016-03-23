var TelegramBot = require('node-telegram-bot-api');
var telegram = require('telegram-bot-api');
var token = '189573317:AAEQXcSxr8YI1F5Zex65_TCvRc_jEtTi4UY';
var api = new telegram({token:token});
// Setup polling way
var bot = new TelegramBot(token, {polling: true});
var data = [];

bot.onText(/\/start/, function (msg, match) {
  var fromId = msg.from.id;
  var name = bot.getMe().id;
  console.log(bot.getMe());
  var resp = 'Welcome';
  bot.sendMessage(fromId, resp);
});

bot.onText(/\/me/, function (msg, match){
	var fromId = msg.from.id;
	var ask = 'Do you want to start filling in Personal Information?'



});

bot.onText(/\/echo (.+)/, function (msg, match) {
  var fromId = msg.from.id;
  var resp = 'You said: '+match[1];
  bot.sendMessage(fromId, resp);
});

bot.onText(/\/send (.+)/, function (msg, match) {
  var toId = msg.from.id;
  var resp = match[1];
  bot.sendMessage(toId, resp);
});

bot.onText(/\/search/, function (msg, match) {
  conn();
  var fromId = msg.from.id;
  var reply = data[0].indexID;
  console.log(data);
  bot.sendMessage(fromId, reply);
});

bot.onText(/\/new/, function (msg, match) {
  var fromId = msg.from.id;
  var reply = data[0].indexID;
  console.log(data);
  bot.sendMessage(fromId, reply);
});

function conn(test, callback){
	var fs = require('fs');
	var mysql = require('mysql');

	var connection = mysql.createConnection({
	    host: '181.224.159.222',
	    user: 'c3bro000_coding',
	    password: 'phy3math4',
	    database: 'c3bro000_coding'
	});

	connection.connect();

	connection.query('SELECT * from user_id',function(error, result){
	    if(error){
	        throw error;
	    }
		callback && callback(result.slice());
	});

	connection.end();
}

conn(123, function(arr){
	setValue(arr);
});

function insertID(newName,newID){
	var fs = require('fs');
	var mysql = require('mysql');

	var connection = mysql.createConnection({
	    host: '181.224.159.222',
	    user: 'c3bro000_coding',
	    password: 'phy3math4',
	    database: 'c3bro000_coding'
	});

	connection.connect();

	connection.query('insert into '+ 'user_id' +' (userID,name) values ("' + newID + '", "' + newName + '")',
	function(err, results, fields) {
	    if (err) throw err;
	    else bot.sendMessage(newID,'success');
	});

	connection.end();
}



function setValue(value){
	data=[];
	data.push(value[0]);
}

