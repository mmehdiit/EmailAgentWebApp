import { Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';

@Component({
  selector: 'app-migration-placeholder',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './migration-placeholder.component.html',
  styleUrl: './migration-placeholder.component.scss'
})
export class MigrationPlaceholderComponent {
  private readonly route = inject(ActivatedRoute);

  protected readonly title = this.route.snapshot.data['title'] as string;
  protected readonly sourcePath = this.route.snapshot.data['sourcePath'] as string;
}
