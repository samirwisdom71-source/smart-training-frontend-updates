import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { LocaleService } from '../../core/i18n/locale.service';
import { LanguageSwitcherComponent } from '../../layout/header/language-switcher/language-switcher.component';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [RouterLink, TranslateModule, LanguageSwitcherComponent],
  template: `
    <div class="landing" [attr.dir]="locale.isRtl ? 'rtl' : 'ltr'">
      <button class="landing-lang-btn" type="button">
        <app-language-switcher />
      </button>
      <main>
        <section class="hero hero--full" aria-labelledby="hero-title">
          <div class="hero-bg" aria-hidden="true"></div>
          <div class="hero__inner hero__inner--split">
            <div class="hero__content">
              <h1 id="hero-title" class="hero__title">{{ 'landing.heroTitle' | translate }}</h1>
              <p class="hero__subtitle">{{ 'landing.heroSubtitle' | translate }}</p>
              <div class="hero__cta">
                <a routerLink="/login" class="ds-btn ds-btn--primary ds-btn--lg">{{ 'landing.signIn' | translate }}</a>
              </div>
            </div>
            <div class="hero__lifecycle" aria-label="Training lifecycle">
              <article class="lifecycle-card">
                <h2 class="lifecycle-card__title">دورة حياة التدريب</h2>
                <p class="lifecycle-card__desc">
                  من تقييم الاحتياجات إلى الخطط والبرامج والتسجيلات والشهادات.
                </p>
              </article>
              <article class="lifecycle-card">
                <h2 class="lifecycle-card__title">الكفاءات والتقييمات</h2>
                <p class="lifecycle-card__desc">
                  ربط الكفاءات وإجراء التقييمات وسد الفجوات بالتطوير المستهدف.
                </p>
              </article>
              <article class="lifecycle-card">
                <h2 class="lifecycle-card__title">التقارير والرؤى</h2>
                <p class="lifecycle-card__desc">
                  لوحات معلومات وتقارير لتتبع التقدم وإثبات الأثر.
                </p>
              </article>
            </div>
          </div>
        </section>
      </main>
    </div>
  `,
  styles: [`
    .landing {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }
    .landing-header { display: none; }
    .landing-header__inner { display: none; }
    .landing-lang-btn {
      position: fixed;
      top: var(--space-sm);
      inset-inline-end: var(--space-lg);
      z-index: 110;
      padding: 0;
      border: none;
      background: transparent;
    }
    .landing-nav { display: none; }
    .hero {
      position: relative;
      padding: var(--space-md) 0 var(--space-md);
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100vh;
      overflow: hidden;
    }
    .hero-bg {
      position: absolute;
      inset: 0;
      background-image:
        linear-gradient(160deg, rgba(15,23,42,0.22), rgba(15,23,42,0.38)),
        url('/assets/images/landing.png');
      background-size: cover;
      background-position: center;
      background-repeat: no-repeat;
    }
    .hero-bg::before {
      content: ''; position: absolute; inset: 0;
      background: radial-gradient(ellipse 80% 50% at 50% 0%, rgba(10,77,82,0.08) 0%, transparent 60%);
    }
    .hero__inner {
      position: relative;
      width: 100%;
      display: grid;
      grid-template-columns: minmax(0, 1.2fr) minmax(0, 1fr);
      column-gap: var(--space-2xl);
      align-items: center;
    }
    .hero__inner--split {
      /* class kept for template; layout handled by .hero__inner */
    }
    .hero__content {
      max-width: 560px;
      align-self: center;
      padding-top: var(--header-height);
      padding-inline-start: var(--space-lg);
    }
    .hero__title {
      font-size: clamp(2rem, 4.2vw, 2.6rem);
      font-weight: 700;
      line-height: 1.2;
      color: #f9fafb;
      margin: 0 0 var(--space-md);
      letter-spacing: -0.03em;
      font-family: var(--font-display);
    }
    .hero__subtitle {
      font-size: var(--text-body);
      color: #e5e7eb;
      margin: 0 0 var(--space-xl);
      max-width: 520px;
    }
    .hero__cta {
      display: flex;
      flex-wrap: wrap;
      gap: var(--space-md);
      justify-content: flex-start;
    }
    .hero__lifecycle {
      display: flex;
      flex-direction: column;
      gap: var(--space-md);
      max-width: 430px;
      align-self: end;
      padding-bottom: var(--space-md);
      margin-top: var(--space-2xl);
      margin-inline-start: auto;
      padding-inline-end: var(--space-md);
    }
    .lifecycle-card {
      background: rgba(15,23,42,0.78);
      border-radius: var(--radius-lg);
      padding: var(--space-lg);
      border: 1px solid rgba(148,163,184,0.5);
      box-shadow: 0 18px 40px rgba(15,23,42,0.45);
      color: #e5e7eb;
      backdrop-filter: blur(14px);
      cursor: pointer;
      transform-origin: center;
      width: 100%;
      min-height: 140px;
      animation: lifecycle-in 0.6s ease-out forwards;
      transition: transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease;
    }
    .lifecycle-card:nth-child(1),
    .lifecycle-card:nth-child(2),
    .lifecycle-card:nth-child(3) {
      margin-inline-start: 0;
      margin-block-start: 0;
    }
    .lifecycle-card:hover {
      transform: translateY(-6px) scale(1.02);
      box-shadow: 0 24px 60px rgba(15,23,42,0.6);
      border-color: var(--color-primary);
    }
    .lifecycle-card__title {
      margin: 0 0 var(--space-xs);
      font-size: var(--text-h1);
      font-weight: 600;
      font-family: var(--font-display);
      letter-spacing: -0.02em;
    }
    .lifecycle-card__desc {
      margin: 0;
      font-size: var(--text-body-sm);
      line-height: 1.7;
      color: #cbd5f5;
    }
    @keyframes lifecycle-in {
      0% {
        opacity: 0;
        transform: translateX(-30px);
      }
      100% {
        opacity: 1;
        transform: translateX(0);
      }
    }
    .section { padding: var(--space-3xl) var(--space-lg); }
    .section__inner { max-width: 1200px; margin: 0 auto; }
    .section__title {
      font-size: var(--text-display-2); font-weight: 600; text-align: center;
      color: var(--color-text); margin: 0 0 var(--space-sm); font-family: var(--font-display);
    }
    .section__subtitle {
      text-align: center; color: var(--color-text-secondary); font-size: var(--text-body);
      margin: 0 0 var(--space-2xl); max-width: 560px; margin-inline: auto;
    }
    .features { background: var(--color-bg-alt); }
    .features-grid {
      display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: var(--space-lg);
    }
    .feature-card { padding: var(--space-xl); transition: transform 0.2s ease, box-shadow 0.2s ease; }
    .feature-card:hover { transform: translateY(-2px); box-shadow: var(--shadow-lg); }
    .feature-card__icon {
      width: 48px; height: 48px; border-radius: var(--radius-md); margin-bottom: var(--space-md);
      background: var(--color-primary-muted);
    }
    .feature-card__icon--1 { background: linear-gradient(135deg, var(--color-primary-muted), var(--color-accent-soft)); }
    .feature-card__icon--2 { background: linear-gradient(135deg, var(--color-info-soft), var(--color-primary-muted)); }
    .feature-card__icon--3 { background: linear-gradient(135deg, var(--color-success-soft), var(--color-primary-muted)); }
    .feature-card__title { font-size: var(--text-h1); font-weight: 600; margin: 0 0 var(--space-sm); color: var(--color-text); }
    .feature-card__desc { font-size: var(--text-body-sm); color: var(--color-text-secondary); margin: 0; line-height: 1.5; }
    .lifecycle-steps {
      display: flex; flex-wrap: wrap; justify-content: center; gap: var(--space-sm);
    }
    .lifecycle-step {
      padding: var(--space-md) var(--space-lg); background: var(--color-bg-elevated);
      border: 1px solid var(--color-border-light); border-radius: var(--radius-md);
      box-shadow: var(--shadow-sm); font-size: var(--text-body-sm); font-weight: 500;
      color: var(--color-text); transition: border-color 0.2s, box-shadow 0.2s;
    }
    .lifecycle-step:hover { border-color: var(--color-primary); box-shadow: var(--shadow-md); }
    .lifecycle-step__label { display: block; }
    .screens-mock { display: flex; justify-content: center; padding: var(--space-md) 0; }
    .screens-mock__window {
      width: 100%; max-width: 900px; border-radius: var(--radius-lg);
      overflow: hidden; box-shadow: var(--shadow-xl); border: 1px solid var(--color-border);
    }
    .screens-mock__bar { height: 40px; background: var(--color-bg-sidebar); }
    .screens-mock__content { display: flex; min-height: 320px; }
    .screens-mock__sidebar { width: 200px; background: var(--color-bg-alt); }
    .screens-mock__main {
      flex: 1; padding: var(--space-lg); display: flex; gap: var(--space-md); flex-wrap: wrap;
      background: var(--color-bg);
    }
    .screens-mock__card {
      flex: 1 1 180px; min-height: 100px; border-radius: var(--radius-md);
      background: var(--color-bg-elevated); border: 1px solid var(--color-border-light);
    }
    .cta { background: linear-gradient(180deg, var(--color-bg-alt) 0%, var(--color-bg) 100%); }
    .cta__inner { text-align: center; }
    .cta__title { font-size: var(--text-display-2); font-weight: 600; margin: 0 0 var(--space-sm); color: var(--color-text); }
    .cta__subtitle { color: var(--color-text-secondary); margin: 0 0 var(--space-xl); }
    @media (max-width: 768px) {
      .hero { min-height: 75vh; padding-top: 70px; }
      .hero__cta { flex-direction: column; }
      .lifecycle-steps { flex-direction: column; }
      .screens-mock__content { flex-direction: column; }
      .screens-mock__sidebar { width: 100%; min-height: 60px; }
    }
  `]
})
export class LandingComponent {
  year = new Date().getFullYear();
  constructor(public locale: LocaleService) {}
}
