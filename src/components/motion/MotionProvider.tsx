'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const EXCLUDED_SELECTOR = '[data-motion-skip], [id^="task-card-"], [data-rbd-draggable-context-id]';
const CONTENT_SELECTOR = [
  '[data-motion="page-header"]',
  '[data-motion="card"]',
  '[data-motion="section"]',
  '[data-motion="chart"]',
  '[data-motion="table"]',
  '[data-motion="board-column"]',
  'main > section',
  'main > div > section',
  'main > div > div.rounded-2xl',
  'main > div > div.rounded-3xl',
].join(',');

function isVisible(element: HTMLElement) {
  const style = window.getComputedStyle(element);
  return style.display !== 'none' && style.visibility !== 'hidden' && element.offsetParent !== null;
}

function canAnimate(element: HTMLElement) {
  return !element.matches(EXCLUDED_SELECTOR) && !element.closest(EXCLUDED_SELECTOR) && isVisible(element);
}

function animateOverlay(element: HTMLElement) {
  if (element.dataset.gsapAnimated === 'true') return;

  const panel = element.querySelector<HTMLElement>('[role="dialog"], form, .rounded-2xl, .rounded-3xl');
  element.dataset.gsapAnimated = 'true';

  const timeline = gsap.timeline({ defaults: { ease: 'power3.out' } });
  timeline.fromTo(element, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.2 });

  if (panel && panel !== element) {
    timeline.fromTo(panel, { autoAlpha: 0, y: 20, scale: 0.985 }, { autoAlpha: 1, y: 0, scale: 1, duration: 0.42 }, 0.04);
  }
}

function animatePopover(element: HTMLElement) {
  if (element.dataset.gsapAnimated === 'true') return;
  element.dataset.gsapAnimated = 'true';
  gsap.fromTo(
    element,
    { autoAlpha: 0, y: -8, scale: 0.98, transformOrigin: 'top right' },
    { autoAlpha: 1, y: 0, scale: 1, duration: 0.26, ease: 'power3.out', clearProps: 'transform' }
  );
}

function animateDynamicContent(root: HTMLElement) {
  const elements = [root, ...Array.from(root.querySelectorAll<HTMLElement>(CONTENT_SELECTOR))]
    .filter(canAnimate)
    .filter((element) => element.dataset.gsapAnimated !== 'true')
    .slice(0, 18);

  elements.forEach((element, index) => {
    element.dataset.gsapAnimated = 'true';
    gsap.fromTo(
      element,
      { autoAlpha: 0, y: 18, scale: 0.994 },
      {
        autoAlpha: 1,
        y: 0,
        scale: 1,
        duration: 0.48,
        delay: Math.min(index * 0.04, 0.24),
        ease: 'power3.out',
        clearProps: 'transform',
      }
    );
  });

  root.querySelectorAll<HTMLCanvasElement>('canvas').forEach((canvas) => {
    const shell = canvas.parentElement;
    if (!shell || shell.dataset.gsapAnimated === 'true') return;
    shell.dataset.gsapAnimated = 'true';
    gsap.fromTo(shell, { autoAlpha: 0, scale: 0.96 }, { autoAlpha: 1, scale: 1, duration: 0.7, ease: 'power3.out', clearProps: 'transform' });
  });
}

export default function MotionProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const contextRef = useRef<gsap.Context | null>(null);

  useEffect(() => {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reducedMotion) return;

    contextRef.current?.revert();
    const context = gsap.context(() => {
      const header = document.querySelector<HTMLElement>('body > div > header, header');
      if (header) {
        gsap.fromTo(header, { autoAlpha: 0, y: -12 }, { autoAlpha: 1, y: 0, duration: 0.5, ease: 'power3.out', clearProps: 'transform' });
      }

      const page = document.querySelector<HTMLElement>('main');
      if (!page) return;

      const heading = page.querySelector<HTMLElement>('h1');
      if (heading) {
        const headingGroup = heading.parentElement ?? heading;
        gsap.fromTo(headingGroup, { autoAlpha: 0, y: 18 }, { autoAlpha: 1, y: 0, duration: 0.62, ease: 'power3.out', clearProps: 'transform' });
      }

      const candidates = Array.from(page.querySelectorAll<HTMLElement>(CONTENT_SELECTOR))
        .filter(canAnimate)
        .filter((element, index, all) => !all.some((parent, parentIndex) => parentIndex < index && parent.contains(element)))
        .slice(0, 28);

      candidates.forEach((element, index) => {
        element.dataset.gsapAnimated = 'true';
        gsap.fromTo(
          element,
          { autoAlpha: 0, y: 24, scale: 0.992 },
          {
            autoAlpha: 1,
            y: 0,
            scale: 1,
            duration: 0.58,
            delay: Math.min(index * 0.045, 0.32),
            ease: 'power3.out',
            clearProps: 'transform',
            scrollTrigger: {
              trigger: element,
              start: 'top 94%',
              once: true,
            },
          }
        );
      });

      const tables = Array.from(page.querySelectorAll<HTMLElement>('tbody')).filter(isVisible).slice(0, 4);
      tables.forEach((table) => {
        const rows = Array.from(table.querySelectorAll<HTMLElement>(':scope > tr')).slice(0, 14);
        gsap.fromTo(rows, { autoAlpha: 0, y: 10 }, {
          autoAlpha: 1,
          y: 0,
          duration: 0.36,
          stagger: 0.035,
          ease: 'power2.out',
          clearProps: 'transform',
          scrollTrigger: { trigger: table, start: 'top 92%', once: true },
        });
      });

      const charts = Array.from(page.querySelectorAll<HTMLCanvasElement>('canvas'));
      charts.forEach((canvas) => {
        const shell = canvas.parentElement;
        if (!shell) return;
        gsap.fromTo(shell, { autoAlpha: 0, scale: 0.96 }, {
          autoAlpha: 1,
          scale: 1,
          duration: 0.75,
          ease: 'power3.out',
          clearProps: 'transform',
          scrollTrigger: { trigger: shell, start: 'top 90%', once: true },
        });
      });
    });

    contextRef.current = context;
    const refreshTimer = window.setTimeout(() => ScrollTrigger.refresh(), 120);

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (!(node instanceof HTMLElement)) return;

          if (node.matches('.fixed.inset-0') && node.querySelector('form, [role="dialog"], .rounded-2xl, .rounded-3xl')) {
            animateOverlay(node);
            return;
          }

          if (node.matches('[data-motion="dropdown"]') || (node.classList.contains('absolute') && node.classList.contains('shadow-2xl'))) {
            animatePopover(node);
            return;
          }

          if (node.closest('main') && !node.matches(EXCLUDED_SELECTOR) && !node.closest(EXCLUDED_SELECTOR)) {
            animateDynamicContent(node);
          }
        });
      });
    });

    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      window.clearTimeout(refreshTimer);
      observer.disconnect();
      context.revert();
    };
  }, [pathname]);

  return children;
}
