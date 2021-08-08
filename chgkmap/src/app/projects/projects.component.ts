import { Component, OnInit } from '@angular/core';

declare var VK: any;

VK.Widgets.Group("vk_groups", {mode: 4, height: "500", width: "auto"}, 205401387);

@Component({
  selector: 'app-projects',
  templateUrl: './projects.component.html',
  styleUrls: ['./projects.component.css']
})
export class ProjectsComponent implements OnInit {
	
  constructor() { }

  ngOnInit(): void {
  }

}
