var express = require('express');
var router = express.Router();

const fs = require('fs');

/* GET users listing. */
router.get('/', function(req, res, next) {
  //Получаем лимиты по дате из запроса
  filterstart = Date.parse(req.query.start);
  filterfinish = Date.parse(req.query.end);
  //Читаем файлы с городами и турнирами
  cities = fs.readFileSync('cities.geojson');
  cities = JSON.parse(cities);
  tournaments = fs.readFileSync('tournaments.json');
  tournaments = tournaments.slice(0, -1);
  tournaments = "[" + tournaments + "]";
  tournaments = JSON.parse(tournaments);
  //Фильтруем турниры по дате
  if (((isNaN(filterstart)) == false) && ((isNaN(filterfinish)) == false)) {
	tournamentsfiltered = [];
	tournaments.forEach(function(tr) {
	  dstrt = Date.parse(tr['dateStart']);
	  dend = Date.parse(tr['dateEnd']);
	  if ((dstrt >= filterstart) && (dend <= filterfinish)) {
		tournamentsfiltered.push(tr);
	  };
	});
	tournaments = tournamentsfiltered;
  };
  
  //Для каждого турнира добавляем координаты из файла с городами
  var primjson = [];
  tournaments.forEach(function(tour){
    cities["features"].forEach(function(city){
	  props = city["properties"]
      if (tour["full_city"] == props["full_city"]) {
		tour["geometry"] = city["geometry"];
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
	  if (tour["full_city"] == props["name"]) {
		isduplicate = true;
		city.properties.popupContent = city.properties.popupContent + '<br>' + content ;
	  };
	});
	//Иначе - создаем новый город в геоджсоне
	if (isduplicate == false) {
      ft = {};
	  ft['type'] = "Feature";
	  ft['properties'] = {'name': tour["full_city"], 'popupContent': '<h5><b>'+ tour["full_city"] + '</b></h5>' +content};
	  ft['geometry'] = tour['geometry']
	  finaljson.push(ft);
	};
  });
  //Собираем геоджсон
  finaljson = {'type': cities['type'], 'name': cities['name'], 'crs': cities['crs'], 'features': finaljson};
    
  res.json(finaljson);
});

module.exports = router;
