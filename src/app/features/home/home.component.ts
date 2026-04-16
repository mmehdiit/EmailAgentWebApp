import { NgFor } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

type HomeStep = {
  step: number;
  title: string;
  desc: string;
};

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [NgFor, RouterLink],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent {
  protected readonly steps: HomeStep[] = [
    { step: 1, title: 'Connect Outlook', desc: 'Securely link your Outlook account' },
    {
      step: 2,
      title: 'Define Rules',
      desc: 'Set up forwarding instructions with keywords and recipients'
    },
    {
      step: 3,
      title: 'Let AI Work',
      desc: 'AI analyzes emails and forwards them automatically'
    }
  ];
}
