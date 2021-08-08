var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var cheerio = require('cheerio');
const URL = require('url');

var map = require('./routes/map');

var app = express();

const https = require('https');
const fs = require('fs');
var cors = require('cors')

const schedule = require('node-schedule');

function getData(){
  //Эта функция загружает данные о турнирах и сохраняет их в файл
  
  var city;
  var pdata;
  var tournament;
  var tour_id;

  var date = new Date();
  //Собираем url api сайта рейтинга
  var apiurl = URL.format({
	protocol: 'https',
	hostname: 'api.rating.chgk.net',
	pathname: '/tournaments',
	query: {'page': '1', 'dateStart[after]': date, 'type': '2'}
  });

  try {
    fs.unlinkSync('tournaments.json');
  } catch (err) {
	console.log('No file')
  }
  https.get(apiurl, (resp) => {
    var primdata = '';

    resp.on('data', (chunk) => {
      primdata += chunk;
    });

    resp.on('end', () => {
	  pdata = JSON.parse(primdata);
	  //Для каждого турнира получаем город (да, в ответе апи его нет)
	  pdata.forEach(function(tournament){
		tour_id = tournament["id"];
		var tour_url = 'https://rating.chgk.info/tournament/' + tour_id.toString();
		https.get(tour_url, (resp) => {
		  var tdata = '';
		  resp.on('data', (chunk) => {
            tdata += chunk;
		  });
		  resp.on('end', () => {
			var chdata = cheerio.load(tdata);
			city = chdata('.town').html();
			city = city.replace('\n', '');
			city = city.trim();
			tournament["full_city"] = city;
			//Если не онлайн, записываем турнир в файл
			if (city != "Онлайн (-)") {
			  fs.appendFile('tournaments.json', JSON.stringify(tournament) + ',', err => {
                if (err) {
                  console.error(err)
                  return
                }
	          });
			};
		  });
		});
	  });
	  
	});
	
  });

};
    
//console.log(path);
getData();

//Каждый день в 4 утра обновлять список турниров (не тестировалось)
const timer = schedule.scheduleJob('0 4 * * *', () => getData());

app.use(cors());

/*app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "http://localhost:3000");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});*/

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());

app.use('/api/v1/map', map);

module.exports = app;
