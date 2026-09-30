import { DOCUMENT } from '@angular/common';
import { Component, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { ActivatedRoute, NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  template: '<router-outlet />',
})
export class AppComponent {
  private readonly activatedRoute = inject(ActivatedRoute);
  private readonly document = inject(DOCUMENT);
  private readonly meta = inject(Meta);
  private readonly router = inject(Router);
  private readonly title = inject(Title);

  constructor() {
    this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe(() => this.updateMetadata());
  }

  private updateMetadata() {
    let route: ActivatedRoute | null = this.activatedRoute;
    let title: string | undefined;
    let description: string | undefined;
    let canonicalPath: string | undefined;

    while (route) {
      title = route.snapshot.title ?? title;
      description = (route.snapshot.data['description'] as string | undefined) ?? description;
      canonicalPath = (route.snapshot.data['canonical'] as string | undefined) ?? canonicalPath;
      route = route.firstChild;
    }

    if (title) this.title.setTitle(title);
    if (description) this.meta.updateTag({ name: 'description', content: description });

    const canonical = this.document.querySelector<HTMLLinkElement>("link[rel='canonical']");
    if (canonical && canonicalPath) canonical.href = new URL(canonicalPath, canonical.href).href;
  }
}
