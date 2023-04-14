import { Component, OnInit } from '@angular/core';
import { UntypedFormControl, UntypedFormGroup } from '@angular/forms';
import {
  MAT_MOMENT_DATE_FORMATS,
  MomentDateAdapter,
  MAT_MOMENT_DATE_ADAPTER_OPTIONS,
} from '@angular/material-moment-adapter';
import {DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE} from '@angular/material/core';
import * as L from 'leaflet';
import { HttpClient} from '@angular/common/http';
import { Router } from '@angular/router';
import { HttpParameterCodec } from "@angular/common/http";

//Для каждой точки создаем попап
function onEachFeature(feature: any, layer:any) {
  if (feature.properties && feature.properties.popupContent) {
    layer.bindPopup(feature.properties.popupContent);
  }
};

@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.css']
})
export class MainComponent implements OnInit {
  minDate: Date;
  maxDate: Date;
  geojsonFeature: any;

  
  constructor(private http:HttpClient) {
    this.minDate = new Date();
    this.maxDate = new Date(new Date().setFullYear(new Date().getFullYear() + 10));
  }
  
  private map: any;
  private geojsonLayer: any;
  
  //Инициализируем карту
  private initMap(): void {
    this.map = L.map('map', {
      center: [ 52, 66 ],
      zoom: 3
    });
	
	//Получаем geojson через api
	var apiurl = "http://localhost:3000/api/v1/map?start=" + encodeURIComponent(Date.now())
	this.http.get(apiurl).subscribe((data:any) => {
	  this.geojsonFeature = data;
	  this.geojsonLayer = L.geoJSON(this.geojsonFeature, {
        onEachFeature: onEachFeature
      })
	  this.geojsonLayer.addTo(this.map);
	  console.log(data);
	  console.log(data);
	}, error => {
	  console.log('api not working', error);
	});
	
	//Получаем тайлы осм
	const tiles = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 18,
      minZoom: 3,
      attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    });

    tiles.addTo(this.map);
  }
  
  ngOnInit(): void {
  }
  range = new UntypedFormGroup({
    start: new UntypedFormControl(),
    end: new UntypedFormControl()
  });
  
  ngAfterViewInit(): void {
    this.initMap();
  };
  
  //При каждом обновлении фильтра слой точек удаляется, выполняется новый запрос и создается новый слой
  onSubmit()
  {
	this.map.removeLayer(this.geojsonLayer);
	this.geojsonLayer.clearLayers();
	var apiurl = "http://localhost:3000/api/v1/map?start=" + encodeURIComponent(this.range.value.start.getTime()) + "&end=" + encodeURIComponent(this.range.value.end.getTime());
  	this.http.get(apiurl).subscribe((data:any) => {
	  this.geojsonFeature = data;
	  this.geojsonLayer = L.geoJSON(this.geojsonFeature, {
        onEachFeature: onEachFeature
      })
	  this.geojsonLayer.addTo(this.map);
	  console.log(data);
	}, error => {
	  console.log('api not working', error);
	});
	
  };
}
