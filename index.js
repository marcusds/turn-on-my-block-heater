const { login } = require('tplink-cloud-api');
const xmlParser = require('fast-xml-parser');
const request = require('sync-request');
let switchedOn = false;

function weather() {
	let url = 'https://weather.gc.ca/rss/city/bc-45_e.xml';
	let xmlData = request('GET', url);
	let data = xmlParser.parse(xmlData.getBody('utf8'));
	let tempature = 0;
	
	data.feed.entry.forEach((item) => {
		if(item.title.indexOf('Current Conditions:') > -1) {
			tempature = item.title.split(',')[1].trim();
			tempature = Number(tempature.split('&#xB0;')[0].trim());
			
			return false;
		}
	});
		
	return tempature;
}

async function plug(on = true, forceOff = false) {	
	const tplink = await login('', '', '');
	let response;
	
	let deviceList = await tplink.getDeviceList();
	let plug = await tplink.getHS100('block heater');
	
	if(on) {
		response = await plug.powerOn();
		switchedOn = true;
	} else if(switchedOn === true || forceOff === false) { // Only turn off if this script turned the light one
		response = await plug.powerOff();
		switchedOn = false;
	}
	
	return response;
}

function main() {
	let date = new Date();
	let hour = date.getHours();
	let minute = date.getMinutes();
	let tempature = weather();
	
	console.log('Current time: ' + hour + ':' + minute);
	console.log('Current tempature: ' + tempature + 'C');
	
	if(tempature <= -15 && (hour > 4 || hour === 4 && minute >= 30)) {
		plug(true);
		console.log('Turning outlet on.');
	} else if(switchedOn) {
		plug(false);
		console.log('Turning outlet off.');
	} else {
		console.log('Not doing anything.');
	}
	
	console.log('Running again in 10 minutes.');
		
	setTimeout(main, 10 * 60 * 1000);
}

main();