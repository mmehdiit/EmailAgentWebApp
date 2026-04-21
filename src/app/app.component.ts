import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { ToasterComponent } from './shared/components/toaster/toaster.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, ToasterComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {}
