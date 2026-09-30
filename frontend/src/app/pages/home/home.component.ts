import { CommonModule, DOCUMENT } from '@angular/common';
import { Component, ElementRef, OnInit, ViewChild, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { academyDestination } from '../../core/academy/academy-guards';
import { AcademySessionStore } from '../../core/academy/academy-session.store';
import {
  DEFAULT_SITE_CONFIG,
  SiteConfigService,
  type SiteConfig,
} from '../../core/services/site-config.service';
import { preferredScrollBehavior } from './public-experience';

declare global {
  interface Window {
    AOS?: { init: (options?: Record<string, unknown>) => void };
  }
}

@Component({
  selector: 'app-home',
  imports: [CommonModule, RouterLink],
  templateUrl: './home.component.html',
  styles: `
    :host {
      display: block;
    }

    .page {
      min-height: 100vh;
      position: relative;
      overflow: clip;
    }

    .shell {
      width: min(1400px, calc(100% - 48px));
      margin: 0 auto;
    }

    .topbar {
      position: sticky;
      top: 0;
      z-index: 20;
      border-bottom: 1px solid rgba(17, 17, 17, 0.08);
      background: rgba(255, 253, 251, 0.82);
      backdrop-filter: blur(18px);
    }

    .topbar-shell {
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      padding: 12px 0;
      gap: 12px;
    }

    :is(#inicio, #metodo, #clases, #formulario, #contacto) {
      scroll-margin-top: 88px;
    }

    .brand {
      display: flex;
      align-items: center;
      gap: 14px;
    }

    .brand-logo {
      display: block;
      width: auto;
      height: auto;
      max-width: 70px;
    }

    .footer-logo {
      display: block;
      width: auto;
      height: auto;
      max-width: 170px;
    }

    .brand-copy {
      display: grid;
      gap: 2px;
    }

    .brand-copy strong,
    .section-kicker,
    .eyebrow,
    h1,
    h2,
    h3 {
      font-family: var(--display-font);
      text-transform: uppercase;
    }

    .brand-copy strong {
      letter-spacing: 0.04em;
      font-size: 0.92rem;
    }

    .brand-copy small {
      color: var(--muted);
      letter-spacing: 0.08em;
      text-transform: uppercase;
      font-size: 0.68rem;
    }

    nav {
      display: flex;
      gap: 18px;
      font-size: 0.95rem;
      color: var(--muted);
    }

    nav a {
      position: relative;
      padding: 4px 0;
    }

    nav a::after {
      content: '';
      position: absolute;
      left: 0;
      bottom: -2px;
      width: 100%;
      height: 2px;
      background: var(--accent);
      transform: scaleX(0);
      transform-origin: left;
      transition: transform 180ms ease;
    }

    nav a:hover {
      color: var(--text);
    }

    nav a:hover::after {
      transform: scaleX(1);
    }

    .academy-access {
      display: flex;
      align-items: center;
    }

    .academy-access-link {
      min-height: 40px;
      padding: 0 14px;
      white-space: nowrap;
    }

    .academy-access-link:focus-visible {
      outline: 3px solid var(--accent);
      outline-offset: 3px;
    }

    .academy-menu {
      position: relative;
    }

    .academy-menu summary {
      cursor: pointer;
      font-weight: 700;
      padding: 4px 0;
    }

    .academy-menu[open] > div {
      position: absolute;
      right: 0;
      display: grid;
      gap: 4px;
      min-width: max-content;
      padding: 10px;
      border: 1px solid var(--line);
      border-radius: 14px;
      background: var(--surface);
      box-shadow: var(--shadow);
    }

    .academy-menu[open] > div a {
      padding: 8px 4px;
    }

    .academy-menu button {
      border: 0;
      background: none;
      color: var(--text);
      cursor: pointer;
      font: inherit;
      padding: 8px 4px;
      text-align: left;
    }

    .academy-menu :is(summary, a, button):focus-visible {
      outline: 3px solid var(--accent);
      outline-offset: 3px;
    }

    .hamburger {
      display: none;
      flex-direction: column;
      justify-content: center;
      gap: 5px;
      background: none;
      border: none;
      cursor: pointer;
      padding: 8px;
      border-radius: 10px;
    }

    .hamburger span {
      display: block;
      width: 24px;
      height: 2px;
      background: var(--text);
      border-radius: 2px;
      transition: transform 220ms ease, opacity 220ms ease;
    }

    .hamburger[aria-expanded='true'] span:nth-child(1) {
      transform: translateY(7px) rotate(45deg);
    }

    .hamburger[aria-expanded='true'] span:nth-child(2) {
      opacity: 0;
    }

    .hamburger[aria-expanded='true'] span:nth-child(3) {
      transform: translateY(-7px) rotate(-45deg);
    }

    .hero {
      display: grid;
      grid-template-columns: minmax(0, 1fr) minmax(320px, 540px);
      align-items: stretch;
      gap: 20px;
      padding: 36px 0 22px;
    }

    .card,
    .hero-copy,
    .hero-stage,
    .form-card,
    .info-card,
    .benefit {
      border-radius: 28px;
      background: var(--surface);
      box-shadow: var(--shadow);
    }

    /* Hover estilo cartel TEW: borde rojo + sombra */
    .overview-copy,
    .proof-card,
    .overview-summary,
    .benefit,
    .testimonial-card,
    .tech-copy,
    .classroom-card,
    .mini-banner-card,
    .info-card,
    .form-card,
    .hero-copy,
    .hero-stage {
      outline: 2px solid transparent;
      transition: outline-color 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease;
    }

    .overview-copy:hover,
    .proof-card:hover,
    .overview-summary:hover,
    .benefit:hover,
    .testimonial-card:hover,
    .tech-copy:hover,
    .classroom-card:hover,
    .mini-banner-card:hover,
    .info-card:hover,
    .form-card:hover,
    .hero-copy:hover,
    .hero-stage:hover {
      outline-color: var(--accent);
      transform: translateY(-2px);
      box-shadow: 4px 4px 0 var(--accent);
    }

    .hero-copy::after,
    .button.primary::after,
    .marquee-track {
      will-change: transform;
    }

    .hero-copy {
      position: relative;
      overflow: hidden;
      padding: 38px 42px;
      background: linear-gradient(145deg, #111111 0%, #1f1f1f 62%, #3b0d0d 100%);
      color: #fff;
    }

    .hero-brand-pair {
      display: flex;
      align-items: center;
      gap: 14px;
      margin-top: 18px;
    }

    .hero-brand-robot,
    .hero-brand-official {
      display: block;
      height: auto;
    }

    .hero-brand-robot {
      max-width: 84px;
      padding: 6px;
      border-radius: 50%;
      background: #fff;
      filter: drop-shadow(0 8px 16px rgba(0, 0, 0, 0.3));
    }

    .hero-brand-official {
      max-width: 104px;
      filter: drop-shadow(0 10px 20px rgba(0, 0, 0, 0.24));
    }

    .hero-copy::after {
      content: '';
      position: absolute;
      inset: auto -20% -35% auto;
      width: 260px;
      height: 260px;
      border-radius: 50%;
      background: radial-gradient(circle, rgba(229, 57, 53, 0.34) 0%, rgba(229, 57, 53, 0) 72%);
      animation: pulseGlow 7s ease-in-out infinite;
    }

    .eyebrow,
    .mode-pill,
    .section-kicker,
    .benefit-tag {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 8px 14px;
      border-radius: 999px;
      font-size: 0.82rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.06em;
    }

    .eyebrow {
      background: rgba(255, 255, 255, 0.12);
    }

    .section-kicker,
    .benefit-tag {
      background: #111111;
      color: #fff;
    }

    .mode-pill {
      justify-self: start;
      background: #fdf1f1;
      color: var(--accent-dark);
    }

    .mode-pill.live {
      background: #eff8ef;
      color: #216a2c;
    }

    p {
      margin: 0;
    }

    h1 {
      margin: 16px 0 0;
      font-size: clamp(2.2rem, 4.8vw, 3.8rem);
      line-height: 0.9;
      letter-spacing: -0.04em;
    }

    h1 span {
      display: block;
    }

    .hero-line-fixed {
      white-space: nowrap;
    }

    h2 {
      margin: 14px 0 0;
      font-size: clamp(2rem, 4vw, 3rem);
      line-height: 0.96;
      letter-spacing: -0.03em;
    }

    h3 {
      margin: 12px 0 0;
      font-size: 1.32rem;
      letter-spacing: -0.02em;
    }

    .info-card > p,
    .form-card > .copy-muted {
      margin-top: 18px;
    }

    .hero-text,
    .section-copy p,
    .tech-copy p,
    .info-card p,
    .benefit p,
    .point p,
    .copy-muted,
    .field-note,
    li,
    label {
      color: var(--muted);
      line-height: 1.7;
    }

    .hero-text {
      margin-top: 18px;
      max-width: 56ch;
      color: rgba(255, 255, 255, 0.82);
    }

    .hero-actions {
      display: flex;
      flex-wrap: wrap;
      gap: 14px;
      margin-top: 28px;
    }

    .button {
      display: inline-flex;
      justify-content: center;
      align-items: center;
      min-height: 48px;
      padding: 0 18px;
      border: 0;
      border-radius: 14px;
      font-weight: 700;
      cursor: pointer;
    }

    .button.primary {
      position: relative;
      overflow: hidden;
      background: linear-gradient(180deg, #f04843 0%, var(--accent) 100%);
      color: #fff;
      box-shadow: 0 18px 38px rgba(194, 11, 11, 0.26);
    }

    .button.secondary {
      background: rgba(255, 255, 255, 0.92);
      color: var(--text);
    }

    .button.primary::after {
      content: '';
      position: absolute;
      inset: 0;
      background: linear-gradient(120deg, transparent 18%, rgba(255, 255, 255, 0.28) 44%, transparent 72%);
      transform: translateX(-120%);
      animation: buttonSweep 5.5s ease-in-out infinite;
    }

    .hero-stage {
      position: relative;
      min-height: 520px;
      max-height: 640px;
      overflow: hidden;
      border-radius: 28px;
      background: #111111;
    }

    .hero-stage img {
      position: absolute;
      inset: 0;
      display: block;
      width: 100%;
      height: 100%;
      object-fit: cover;
      object-position: center top;
    }

    .hero-stage::after {
      content: '';
      position: absolute;
      inset: 0;
      background: linear-gradient(90deg, rgba(17, 17, 17, 0.72) 0%, rgba(17, 17, 17, 0.18) 45%, transparent 70%);
      pointer-events: none;
    }

    .classroom-banner {
      position: relative;
      height: 100%;
      min-height: 380px;
      margin: 0;
      overflow: hidden;
      border-radius: 28px;
      background: #111111;
      outline: 2px solid transparent;
      box-shadow: var(--shadow);
      transition: outline-color 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease;
    }

    .classroom-banner:hover {
      outline-color: var(--accent);
      transform: translateY(-2px);
      box-shadow: 4px 4px 0 var(--accent);
    }

    .classroom-banner img {
      position: absolute;
      inset: 0;
      display: block;
      width: 100%;
      height: 100%;
      object-fit: cover;
      object-position: center;
    }

    .classroom-banner figcaption {
      position: relative;
      z-index: 1;
      display: flex;
      flex-direction: column;
      justify-content: flex-end;
      height: 100%;
      min-height: 320px;
      padding: 28px;
      background: linear-gradient(0deg, rgba(17, 17, 17, 0.82) 0%, rgba(17, 17, 17, 0.2) 60%, transparent 100%);
      color: #fff;
    }

    .classroom-banner figcaption h3 {
      margin: 8px 0 6px;
      font-size: 1.55rem;
      line-height: 1.2;
    }

    .classroom-banner figcaption p {
      margin: 0;
      color: rgba(255, 255, 255, 0.82);
    }

    .hero-points,
    .overview,
    .benefits,
    .tech-showcase,
    .contact,
    .contact-grid,
    .tech-stack,
    .check-grid {
      display: grid;
      gap: 24px;
    }

    .hero-points {
      grid-template-columns: repeat(3, minmax(0, 1fr));
      margin-top: 26px;
    }

    .point {
      border-radius: 18px;
      background: #fff;
      padding: 20px;
    }

    .point strong {
      color: var(--accent);
    }

    .point p {
      color: #111111;
    }

    .marquee {
      width: 100%;
      overflow: hidden;
      padding: 18px 0;
      border-top: 0;
      border-bottom: 0;
      background: #111111;
    }

    .marquee-track {
      display: flex;
      gap: 32px;
      width: max-content;
      white-space: nowrap;
      animation: marqueeMove 24s linear infinite;
      font-family: 'MV Boli', 'Comic Sans MS', var(--display-font), cursive;
      font-size: clamp(1.1rem, 2vw, 1.45rem);
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }

    .marquee-logo-red {
      color: #ff5252;
    }

    .marquee-logo-black {
      color: rgba(255, 255, 255, 0.9);
    }

    .marquee-logo-soft {
      color: rgba(255, 255, 255, 0.5);
    }

    main > section {
      padding: 28px 0;
    }

    main > section:not(.hero):not(.marquee):nth-of-type(even) {
      background: rgba(255, 255, 255, 0.55);
    }

    .overview,
    .benefits,
    .tech-showcase,
    .contact,
    .testimonials,
    .enroll {
      margin-top: 0;
    }

    .overview {
      align-items: stretch;
    }

    .overview-centered {
      justify-items: center;
    }

    .overview-centered .overview-copy {
      width: 100%;
    }

    .overview-copy {
      padding: 34px;
      background:
        radial-gradient(circle at top right, rgba(229, 57, 53, 0.12), transparent 24%),
        linear-gradient(180deg, #fffdfa 0%, #f6efe9 100%);
      border: 1px solid rgba(17, 17, 17, 0.06);
    }

    .overview-heading {
      display: grid;
      gap: 14px;
      justify-items: center;
      text-align: center;
    }

    .overview-heading h2 {
      max-width: none;
      margin-top: 0;
      font-size: clamp(2.2rem, 4.2vw, 4rem);
      line-height: 1.1;
      letter-spacing: -0.05em;
    }

    .overview-heading p {
      max-width: 70ch;
      text-align: left;
      color: rgba(17, 17, 17, 0.7);
    }

    .overview-summary {
      margin-top: 26px;
      padding: 20px 22px;
      border-radius: 24px;
      background: #111111;
      color: #fff;
      box-shadow: 0 24px 40px rgba(17, 17, 17, 0.16);
    }

    .overview-summary strong {
      display: block;
      margin-bottom: 8px;
      font-size: 1rem;
      letter-spacing: 0.02em;
      text-transform: uppercase;
    }

    .overview-summary span {
      color: rgba(255, 255, 255, 0.72);
      line-height: 1.65;
    }

    .overview-image {
      position: relative;
      overflow: hidden;
      border-radius: 28px;
      min-height: 520px;
      background:
        linear-gradient(145deg, #7b5fcb 0%, #8b6dd7 42%, #f3ede6 42%, #f3ede6 100%);
      border: 1px solid rgba(17, 17, 17, 0.06);
      box-shadow: var(--shadow);
    }

    .overview-image img {
      position: absolute;
      right: -4%;
      bottom: -2%;
      display: block;
      width: min(88%, 520px);
      height: auto;
      object-fit: contain;
      filter: drop-shadow(0 24px 38px rgba(41, 28, 74, 0.22));
    }

    .overview-image::after {
      content: '';
      position: absolute;
      inset: 0;
      background:
        linear-gradient(135deg, rgba(255, 255, 255, 0.14) 0%, transparent 36%),
        linear-gradient(180deg, rgba(17, 17, 17, 0.02) 0%, rgba(17, 17, 17, 0) 100%);
      pointer-events: none;
    }

    .overview-image-badge {
      position: absolute;
      top: 22px;
      left: 22px;
      z-index: 2;
      display: inline-flex;
      padding: 10px 14px;
      border-radius: 999px;
      background: rgba(17, 17, 17, 0.82);
      color: #fff;
      font-size: 0.78rem;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      backdrop-filter: blur(10px);
    }

    .overview-image-note {
      position: absolute;
      left: 22px;
      bottom: 22px;
      z-index: 2;
      max-width: 250px;
      padding: 18px 18px 16px;
      border-radius: 24px;
      background: rgba(255, 253, 251, 0.9);
      border: 1px solid rgba(17, 17, 17, 0.06);
      box-shadow: 0 16px 32px rgba(17, 17, 17, 0.08);
      backdrop-filter: blur(10px);
    }

    .overview-image-note strong {
      display: block;
      margin-bottom: 6px;
      font-family: var(--display-font);
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: var(--accent);
    }

    .overview-image-note span {
      color: rgba(17, 17, 17, 0.72);
      line-height: 1.55;
    }

    .proof-grid {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 20px;
      margin-top: 24px;
    }

    .proof-card {
      min-height: 180px;
      padding: 20px;
      border-radius: 24px;
      background: rgba(255, 255, 255, 0.9);
      border: 1px solid rgba(17, 17, 17, 0.06);
      box-shadow: 0 12px 28px rgba(17, 17, 17, 0.06);
    }

    .proof-card small {
      display: inline-block;
      margin-bottom: 18px;
      font-size: 0.78rem;
      font-weight: 700;
      color: var(--accent);
      letter-spacing: 0.08em;
    }

    .proof-card strong {
      display: block;
      margin-bottom: 8px;
      font-family: var(--display-font);
      text-transform: uppercase;
      font-size: 1rem;
      line-height: 1.1;
    }

    .proof-card span {
      color: rgba(17, 17, 17, 0.68);
      line-height: 1.6;
    }

    .benefits {
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }

    .tech-showcase {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .enroll {
      margin-top: 0;
    }

    .enroll .form-card {
      width: 100%;
      max-width: none;
    }

    .dark-card,
    .benefit,
    .form-card,
    .info-card,
    .image-card,
    .classroom-card,
    .mini-banner-card,
    .tech-copy {
      padding: 28px;
    }

    .dark-card {
      background: linear-gradient(155deg, #0f0f10 0%, #261111 100%);
      color: #fff;
    }

    .dark-card p,
    .dark-card li {
      color: rgba(255, 255, 255, 0.76);
    }

    .image-card,
    .classroom-card,
    .mini-banner-card {
      overflow: hidden;
      border: 1px solid rgba(17, 17, 17, 0.06);
    }

    .image-card img,
    .classroom-card img,
    .mini-banner-card img,
    .footer-logo {
      display: block;
      width: 100%;
      height: auto;
    }

    .benefit {
      position: relative;
      overflow: hidden;
      transition: transform 220ms ease, box-shadow 220ms ease;
    }

    .benefit:hover,
    .button:hover,
    .form-card:hover,
    .info-card:hover,
    .image-card:hover,
    .classroom-card:hover,
    .mini-banner-card:hover {
      transform: translateY(-4px);
    }

    .benefit:hover {
      box-shadow: 0 26px 52px rgba(17, 17, 17, 0.13);
    }

    .benefit::before {
      display: none;
    }

    .benefit-explain {
      background: #fff8f5;
    }

    .benefit-practice {
      background: #f2f7fe;
    }

    .benefit-follow {
      background: #f2fbf4;
    }

    .feature-list,
    ul {
      margin: 18px 0 0;
      padding-left: 20px;
    }

    .check-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
      margin-top: 20px;
    }

    .check-grid div {
      padding: 14px 16px;
      border-radius: 18px;
      background: linear-gradient(180deg, #fff 0%, #f7f1ee 100%);
      border: 1px solid rgba(17, 17, 17, 0.06);
      font-weight: 600;
      color: var(--text);
    }

    .tech-stack {
      align-content: stretch;
      height: 100%;
    }

    .mini-banner-card {
      display: grid;
      place-items: center;
      background: linear-gradient(180deg, #111111 0%, #1f1f1f 100%);
    }

    .mini-banner-card img {
      width: auto;
      height: auto;
      max-width: 100%;
      max-height: 360px;
      object-fit: contain;
    }

    .video-showcase {
      max-width: 1200px;
      margin: 0 auto;
    }

    .video-stage {
      border-radius: 28px;
      overflow: hidden;
      background: #111111;
      box-shadow: var(--shadow);
      outline: 2px solid transparent;
      aspect-ratio: 16 / 9;
      transition: outline-color 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease;
    }

    .video-stage:hover {
      outline-color: var(--accent);
      transform: translateY(-2px);
      box-shadow: 4px 4px 0 var(--accent);
    }

    .video-stage video {
      display: block;
      width: 100%;
      height: 100%;
      object-fit: contain;
    }

    .form-card {
      background: linear-gradient(180deg, #ffffff 0%, #fbf8f3 100%);
      border: 1px solid rgba(17, 17, 17, 0.06);
    }

    form {
      display: grid;
      gap: 14px;
      margin-top: 20px;
    }

    .field {
      display: grid;
      gap: 8px;
    }

    .field span {
      font-weight: 600;
    }

    .eyebrow,
    .brand-copy strong,
    .hero-points strong,
    .form-section-title {
      font-family: 'MV Boli', 'Comic Sans MS', var(--display-font), cursive;
      text-transform: none;
      letter-spacing: 0.01em;
    }

    .field input,
    .field textarea,
    .field select {
      width: 100%;
      border: 1px solid var(--line);
      border-radius: 14px;
      padding: 14px 16px;
      background: #fff;
      color: var(--text);
      transition: border-color 180ms ease, box-shadow 180ms ease, transform 180ms ease;
    }

    .field input:focus,
    .field textarea:focus,
    .field select:focus {
      outline: 0;
      border-color: rgba(194, 11, 11, 0.4);
      box-shadow: 0 0 0 4px rgba(229, 57, 53, 0.08);
      transform: translateY(-1px);
    }

    .field textarea {
      min-height: 140px;
      resize: vertical;
    }

    .field input.ng-invalid.ng-touched,
    .field textarea.ng-invalid.ng-touched,
    .field select.ng-invalid.ng-touched {
      border-color: var(--accent);
    }

    .form-section {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 14px;
      padding-top: 18px;
      border-top: 1px solid rgba(17, 17, 17, 0.08);
    }

    .form-section:first-of-type {
      padding-top: 0;
      border-top: 0;
    }

    .form-section-title {
      grid-column: 1 / -1;
      margin: 0;
    }

    .field-full,
    .section-note {
      grid-column: 1 / -1;
    }

    .map-card {
      margin-top: 22px;
      overflow: hidden;
      border-radius: 24px;
      border: 1px solid rgba(17, 17, 17, 0.08);
      box-shadow: var(--shadow);
    }

    .map-card iframe {
      display: block;
      width: 100%;
      min-height: 380px;
      border: 0;
    }

    .map-consent {
      display: grid;
      justify-items: start;
      gap: 14px;
      min-height: 280px;
      padding: 28px;
      align-content: center;
      background: #f5f0e8;
    }

    .map-consent p {
      max-width: 58ch;
      color: var(--muted);
      line-height: 1.65;
    }

    .map-link,
    .email-link {
      color: var(--accent-dark);
      text-decoration: underline;
    }

    .field-note,
    .error,
    .success,
    .helper {
      padding: 12px 14px;
      border-radius: 14px;
      font-size: 0.94rem;
    }

    .field-note {
      padding: 0;
      font-size: 0.86rem;
    }

    .helper {
      background: #f5f0e8;
      color: #5b4f44;
    }

    .error {
      background: #fdecec;
      color: #8d1f1f;
    }

    .success {
      background: #edf8ef;
      color: #216a2c;
    }

    .success-celebrate {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 10px;
      text-align: center;
      padding: 20px 14px;
    }

    .success-robot {
      width: 72px;
      height: auto;
      animation: robotCelebrate 0.7s cubic-bezier(0.36, 0.07, 0.19, 0.97) both;
    }

    @keyframes robotCelebrate {
      0%   { transform: scale(0.2) rotate(-20deg); opacity: 0; }
      45%  { transform: scale(1.2) rotate(10deg);  opacity: 1; }
      65%  { transform: scale(0.9) rotate(-5deg); }
      82%  { transform: scale(1.05) rotate(2deg); }
      100% { transform: scale(1) rotate(0deg); opacity: 1; }
    }

    .contact-grid {
      grid-template-columns: repeat(3, minmax(0, 1fr));
      margin-top: 24px;
    }

    .contact-grid strong {
      display: block;
      margin-bottom: 6px;
      font-size: 0.86rem;
      text-transform: uppercase;
      letter-spacing: 0.08em;
    }

    .privacy-notice {
      font-size: 0.82rem;
      color: var(--muted);
      line-height: 1.6;
      margin: 0;
    }

    .privacy-notice a {
      color: var(--accent-dark);
      text-decoration: underline;
    }

    .testimonials {
      margin-top: 28px;
    }

    .testimonials-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 12px;
      margin-bottom: 20px;
    }

    .testimonials-stars {
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .star {
      color: #f4b942;
      font-size: 1.1rem;
    }

    .testimonials-score {
      font-size: 0.82rem;
      color: var(--muted);
      margin-left: 6px;
    }

    .testimonials-grid {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 24px;
    }

    .testimonial-card {
      padding: 28px 28px 24px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      gap: 18px;
      position: relative;
    }

    .testimonial-card::before {
      content: '"';
      position: absolute;
      top: 6px;
      left: 20px;
      font-size: 4rem;
      line-height: 1;
      color: var(--accent);
      opacity: 0.15;
      font-family: Georgia, serif;
      pointer-events: none;
    }

    .testimonial-text {
      font-size: 0.95rem;
      line-height: 1.7;
      font-style: italic;
      color: var(--text);
      margin: 0;
    }

    .testimonial-author {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .testimonial-initials {
      width: 38px;
      height: 38px;
      border-radius: 50%;
      background: #111;
      color: #fff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.9rem;
      font-weight: 700;
      flex-shrink: 0;
    }

    .testimonial-author strong {
      display: block;
      font-size: 0.86rem;
      color: var(--text);
    }

    .testimonial-author span {
      font-size: 0.74rem;
      color: var(--muted);
    }

    .footer {
      display: grid;
      justify-items: center;
      gap: 12px;
      padding: 32px 0 40px;
      color: var(--muted);
      font-size: 0.95rem;
      text-align: center;
    }

    .footer-legal {
      font-size: 0.82rem;
    }

    .footer-legal a {
      color: var(--muted);
      text-decoration: underline;
    }

    .footer-logo {
      max-width: 190px;
    }

    @keyframes marqueeMove {
      from {
        transform: translateX(0);
      }

      to {
        transform: translateX(-50%);
      }
    }

    @keyframes floatCard {
      0%,
      100% {
        transform: translate3d(0, 0, 0);
      }

      50% {
        transform: translate3d(0, -10px, 0);
      }
    }

    @keyframes orbitFloat {
      0%,
      100% {
        transform: translate3d(0, 0, 0) scale(1);
      }

      50% {
        transform: translate3d(12px, -12px, 0) scale(1.05);
      }
    }

    @keyframes sway {
      0%,
      100% {
        transform: rotate(0deg) translateY(0);
      }

      50% {
        transform: rotate(1.6deg) translateY(-6px);
      }
    }

    @keyframes pulseGlow {
      0%,
      100% {
        opacity: 0.52;
        transform: scale(0.96);
      }

      50% {
        opacity: 1;
        transform: scale(1.08);
      }
    }

    @keyframes buttonSweep {
      0%,
      55% {
        transform: translateX(-120%);
      }

      100% {
        transform: translateX(120%);
      }
    }

    @media (max-width: 900px) {
      .hero,
      .overview,
      .benefits,
      .tech-showcase,
      .hero-points,
      .form-section,
      .contact-grid,
      .check-grid,
      .testimonials-grid {
        grid-template-columns: 1fr;
      }

      .overview-image {
        min-height: 360px;
        order: -1;
      }

      .proof-grid {
        grid-template-columns: 1fr;
      }

      .hero {
        padding-top: 28px;
      }

      .hero-stage {
        min-height: 420px;
        max-height: 520px;
      }
    }

    @media (max-width: 640px) {
      .shell {
        width: min(1400px, calc(100% - 24px));
      }

      .topbar-shell {
        display: grid;
        grid-template-columns: minmax(0, 1fr) auto auto;
        gap: 8px;
      }

      .brand {
        min-width: 0;
        gap: 8px;
      }

      .brand-logo {
        max-width: 48px;
      }

      .brand-copy small {
        display: none;
      }

      .brand-copy strong {
        white-space: nowrap;
        font-size: 0.78rem;
      }

      .academy-access {
        min-width: 0;
      }

      .academy-access-link {
        min-height: 38px;
        padding: 0 10px;
        font-size: 0.78rem;
      }

      .academy-menu summary {
        max-width: 120px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      main > section {
        padding: 22px 0;
      }

      .hamburger {
        display: flex;
      }

      nav {
        display: none;
        grid-column: 1 / -1;
        width: 100%;
        flex-direction: column;
        gap: 0;
        padding: 8px 0 4px;
        border-top: 1px solid rgba(17, 17, 17, 0.06);
        order: unset;
      }

      nav.nav-open {
        display: flex;
      }

      nav a {
        padding: 13px 4px;
        font-size: 1.05rem;
        border-bottom: 1px solid rgba(17, 17, 17, 0.04);
        color: var(--text);
      }

      nav a:last-child {
        border-bottom: 0;
      }

      .academy-menu[open] > div {
        position: static;
        margin-top: 8px;
      }

      .hero,
      .overview,
      .benefits,
      .tech-showcase,
      .contact {
        gap: 18px;
      }

      .brand-logo {
        max-width: 64px;
      }

      .footer-logo {
        max-width: 136px;
      }

      .hero-copy,
      .hero-stage,
      .dark-card,
      .benefit,
      .form-card,
      .info-card,
      .image-card,
      .classroom-card,
      .mini-banner-card,
      .tech-copy {
        padding: 22px;
      }

      h1 {
        font-size: clamp(2.2rem, 10vw, 3.15rem);
      }

      .hero-line-fixed {
        white-space: normal;
        overflow-wrap: anywhere;
      }

      .hero-stage {
        min-height: 320px;
        max-height: min(420px, 90vw);
        padding: 0;
      }

      .overview-heading h2 {
        max-width: none;
      }

      .overview-image img {
        width: min(90%, 420px);
      }

      .overview-image-note {
        max-width: 220px;
      }
    }

    @media (prefers-reduced-motion: reduce) {
      *,
      *::before,
      *::after {
        animation-duration: 0.01ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0.01ms !important;
      }

      .button:hover,
      .form-card:hover,
      .info-card:hover,
      .image-card:hover,
      .classroom-card:hover,
      .mini-banner-card:hover,
      .benefit:hover {
        transform: none;
      }
    }
  `,
})
export class HomeComponent implements OnInit {
  private readonly document = inject(DOCUMENT);

  @ViewChild('menuButton')
  private menuButton?: ElementRef<HTMLButtonElement>;
  private readonly siteConfigService = inject(SiteConfigService);
  protected readonly academySession = inject(AcademySessionStore);
  protected readonly academyDestination = academyDestination;

  protected readonly currentYear = new Date().getFullYear();
  protected menuOpen = false;
  protected mapLoaded = false;
  protected siteConfig: SiteConfig = DEFAULT_SITE_CONFIG;

  ngOnInit() {
    this.siteConfigService.load().subscribe((state) => {
      this.siteConfig = state.config;

      if (state.status === 'ready' && this.siteConfig.apiBaseUrl && this.academySession.token) {
        this.academySession.restore(this.siteConfig.apiBaseUrl).subscribe();
      } else if (!this.siteConfig.apiBaseUrl) {
        this.academySession.clear();
      }
    });

    const initializeAos = () => {
      const aos = window.AOS;
      if (!aos) return;
      aos.init({ once: true, duration: 850, easing: 'ease-out-cubic' });
      this.document.documentElement.classList.add('aos-enabled');
    };

    initializeAos();
    this.document
      .getElementById('aos-script')
      ?.addEventListener('load', initializeAos, { once: true });
  }

  protected toggleMenu() {
    this.menuOpen = !this.menuOpen;
  }

  protected closeMenu(restoreFocus = false) {
    this.menuOpen = false;
    if (restoreFocus) this.menuButton?.nativeElement.focus();
  }

  protected loadMap() {
    this.mapLoaded = true;
  }

  protected logout() {
    this.closeMenu();
    if (this.siteConfig.apiBaseUrl) {
      this.academySession.logout(this.siteConfig.apiBaseUrl).subscribe();
    } else {
      this.academySession.clear();
    }
  }

  protected scrollToSection(event: Event, id: string) {
    event.preventDefault();
    this.closeMenu();

    const target = this.document.getElementById(id);
    const topbar = this.document.querySelector('.topbar');

    if (!(target instanceof HTMLElement)) {
      return;
    }

    const topbarHeight = topbar instanceof HTMLElement ? topbar.offsetHeight : 0;
    const top = window.scrollY + target.getBoundingClientRect().top - topbarHeight - 12;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    target.tabIndex = -1;
    target.focus({ preventScroll: true });
    window.scrollTo({
      top: Math.max(top, 0),
      behavior: preferredScrollBehavior(reduceMotion),
    });
  }

}
