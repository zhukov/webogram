function nameInput(){
	var ask = 'Please enter your First name with Surname (e.g. Simon Lai)';
	bot.sendMessage(fromId,ask);

	bot.onText(/(.+)/, function (msg, match){
		var name = match[0];
		if(name != null && name.length > 2)

		insertID(name, fromId);
	});
}

function confirm(option){
	var ask = "Are you sure to add " + option + " to your profile?";
	bot.sendMessage(fromId,ask);

	bot.onText(/(.+)/, function (msg, match){
		var choice = match[0];
		if(choice == yes){
			bot.sendMessage(fromId,"success");
		}else{
			nameInput();
		}
	});
}