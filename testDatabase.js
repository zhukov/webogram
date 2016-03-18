var bot = require('telegram-bot-bootstrap');
var fs = require('fs');
var chat = 36392602; //replace this with your chat id noted previously 
var text="this is my sample test"; //replace this with your message
var token = "189573317:AAEQXcSxr8YI1F5Zex65_TCvRc_jEtTi4UY"; //replace token with the token given by botfather
var Alice = new bot(token);

//載入MySQL模組
var mysql = require('mysql');
//建立連線
var connection = mysql.createConnection({
    host: '181.224.159.222',
    user: 'c3bro000_coding',
    password: 'phy3math4',
    database: 'c3bro000_coding'
});

//開始連接
connection.connect();

connection.query('SELECT * from user_id',function(error, rows){
    //檢查是否有錯誤
    if(error){
        throw error;
    }
    console.log(rows); //2
    Alice.getUpdates().then(console.log)
    Alice.sendMessage(chat, "indexID is "+rows[0].indexID+" and chatID is "+rows[0].chatID)
});


connection.end();