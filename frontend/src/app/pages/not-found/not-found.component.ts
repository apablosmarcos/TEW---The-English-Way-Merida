import { AfterViewInit, Component, ElementRef, ViewChild } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-not-found',
  imports: [RouterLink],
  template: `
    <main #mainContent class="not-found" tabindex="-1">
      <img src="assets/img/TEW.png" alt="The English Way" width="827" height="300" />
      <p class="code">404</p>
      <h1>Página no encontrada</h1>
      <p>La dirección no existe o ya no está disponible.</p>
      <a routerLink="/">Volver al inicio</a>
    </main>
  `,
  styles: `
    :host { display: grid; min-height: 100vh; place-items: center; padding: 24px; }
    .not-found { max-width: 620px; text-align: center; }
    img { width: min(230px, 70vw); height: auto; }
    .code { margin: 28px 0 0; color: var(--accent); font-weight: 800; letter-spacing: .12em; }
    h1 { margin: 8px 0 12px; font: 700 clamp(2.3rem, 8vw, 4.5rem)/.95 var(--display-font); text-transform: uppercase; }
    p { color: var(--muted); line-height: 1.6; }
    a { display: inline-flex; margin-top: 18px; padding: 14px 18px; border-radius: 14px; background: var(--accent); color: #fff; font-weight: 700; }
  `,
})
export class NotFoundComponent implements AfterViewInit {
  @ViewChild('mainContent') private mainContent?: ElementRef<HTMLElement>;

  ngAfterViewInit() {
    this.mainContent?.nativeElement.focus();
  }
}
