exports.howLongAgoString = function howLongAgoString(aTime)
{
	var aTimeInterval = Math.abs(((new Date().getTime())) - aTime)/1000;
		
	if (aTimeInterval <= 1)
		return "1 second";
	
	if (aTimeInterval < 60)
		if (aTimeInterval >= 30)
			return "half a minute";
		else
			return Math.floor(aTimeInterval) + " seconds";
	
	var time = Math.floor(aTimeInterval / 60);
	
	if (time < 60)
		if (time === 1)
			return "1 minute";
		else
			return time + " minutes";
	
	time = Math.floor(aTimeInterval / (60 * 60));
	
	if (time < 24)
		if (time === 1)
			return "1 hour";
		else
			return time + " hours";
	
	time = Math.floor(aTimeInterval / (60 * 60 * 24));
		
	if (time < 30)
		if (time == 1)
			return "1 day";
		else 
			return time + " days";
	
	time = Math.floor(aTimeInterval / (60.0 * 60.0 * 24.0 * 30.0));
	
	if (time < 12)
		if (time == 1)
			return "1 month";
		else 
			return time + " months";

	time = Math.floor(aTimeInterval / (60.0 * 60.0 * 24.0 * 30.0 * 12.0));
	
	if (time == 1)
		return "1 year";
	
	return time + " years";
}
