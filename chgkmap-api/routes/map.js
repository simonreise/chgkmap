var express = require('express');
var router = express.Router();

const fs = require('fs');
const URL = require('url');
const https = require('https');

/* GET users listing. */
router.get('/', function(req, res, next) {
  //Получаем лимиты по дате из запроса
  var filterstart = new Date(parseInt(req.query.start));
  var filterfinish = new Date(parseInt(req.query.end));
  //Читаем файлы с городами и турнирами
  cities = fs.readFileSync('cities.geojson');
  cities = JSON.parse(cities);
  //Собираем url api сайта рейтинга
  var apiurl = URL.format({
	protocol: 'https',
	hostname: 'api.rating.chgk.net',
	pathname: '/tournaments',
	query: {'page': '1', 'itemsPerPage': '100', 'dateStart[after]': filterstart.toLocaleDateString("ru-RU"), 'dateEnd[before]': filterfinish.toLocaleDateString("ru-RU"), 'type': '2'}
  });
  var tournaments;
  https.get(apiurl, (resp) => {
    var primdata = '';

    resp.on('data', (chunk) => {
      primdata += chunk;
    });

    resp.on('end', () => {
	  tournaments = JSON.parse(primdata);
	  //Для каждого турнира добавляем координаты из файла с городами
	  var primjson = [];
	  tournaments.forEach(function(tour){
		cities["features"].forEach(function(city){
		  props = city["properties"]
		  if (tour["idtown"] == parseInt(props["ИД города"])) {
			tour["geometry"] = city["geometry"];
			tour["Город"] = props["Город"];
			//console.log(tour);
			primjson.push(tour);
		  }
		});
	  });
	  finaljson = []
	  primjson.forEach(function(tour){
		isduplicate = false;
		//Форматируем дату начала и конца в человеческий вид
		ds = Date.parse(tour['dateStart']);
		ds = new Intl.DateTimeFormat('ru', { year: 'numeric', month: 'short', day: '2-digit' }).format(ds);
		de = Date.parse(tour['dateEnd']);
		de = new Intl.DateTimeFormat('ru', { year: 'numeric', month: 'short', day: '2-digit' }).format(de);
		//Если однодневный турнир - одна дата
		if (ds == de){
		  datecompiled = ds;
		} else {
		  datecompiled = ds + ' - ' + de;
		};
		//Собираем содержимое попапа
		content = '<b>' + tour["name"] + '</b><br>' + datecompiled + '<br>' + '<a href="https://rating.chgk.info/tournament/' + tour['id']+ ' " target="_blank">Ссылка</a>';
		//Если город уже есть в списке - помечаем как дубликат и добавляем к уже существующему попапу
		finaljson.forEach(function(city){
		  props = city["properties"];
		  if (tour["idtown"] == props["name"]) {
			isduplicate = true;
			city.properties.popupContent = city.properties.popupContent + '<br>' + content ;
		  };
		});
		//Иначе - создаем новый город в геоджсоне
	    if (isduplicate == false) {
		  ft = {};
		  ft['type'] = "Feature";
		  ft['properties'] = {'name': tour["idtown"], 'popupContent': '<h5><b>'+ tour["Город"] + '</b></h5>' +content};
		  ft['geometry'] = tour['geometry']
		  finaljson.push(ft);
		};
	  });
	  //Собираем геоджсон
	  finaljson = {'type': cities['type'], 'name': cities['name'], 'crs': cities['crs'], 'features': finaljson};
			
	  res.json(finaljson);
	});
  });
  
  

});

module.exports = router;
