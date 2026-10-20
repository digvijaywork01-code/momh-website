/**
 * Card reveal on the Press Grid (768px up): the cards rise 30px and fade in as
 * they come into view, one after another, 0.05s apart, each over 0.8s on a
 * soft ease-in-out (see the Press Grid for why not the site's GSAP curve).
 * The photos are lazy, but Chrome loads them well ahead (measured: every photo
 * was there when its card began fading in, even with each photo 1.5s slow).
 * A card starts once its top passes 85% of the screen height, not the 75% the
 * site's blocks use: on a tall screen (1024 x 1366) the first row sits at 83%
 * when the page opens and would stay blank until scrolled. Shared by the
 * Press Grid (the inline scripts and the hidden state) and PressCarousel.
 *
 * The cards are hidden only while REVEAL is on <html>:
 *  - ARM_REVEAL, an inline script just ahead of the list in the page's HTML,
 *    sets it while the page is still loading, so the cards are hidden before
 *    the browser first draws them (no flash of cards that then vanish).
 *  - START_REVEAL, an inline script just after the list, starts revealing
 *    the cards at once (REVEAL_LIVE), so on a load or a reload they do not
 *    wait for the page's script to start up (about 0.7s on the dev server).
 *    It marks each card itself, before React has taken the page over, which
 *    is why the cards carry suppressHydrationWarning.
 *  - PressCarousel then takes that reveal over (so it stops when the page is
 *    left), or, after a client-side navigation, where inline scripts do not
 *    run, sets REVEAL and does the same itself (keep the two in step).
 *  - Safety net: if nothing has started the reveal REVEAL_SAFETY after the
 *    first inline script ran, it lifts REVEAL and sets REVEAL_OFF: every card
 *    fades in at once.
 * Without JavaScript nothing is ever hidden. Phones (the carousel), "reduce
 * motion" and printing never hide the cards either (see the Press Grid).
 */
export const REVEAL = 'data-press-reveal'
export const REVEAL_LIVE = 'data-press-reveal-live'
export const REVEAL_OFF = 'data-press-reveal-off'
/** Where START_REVEAL leaves its IntersectionObserver for PressCarousel (a property of the list). */
export const REVEAL_OBSERVER = '__pressRevealObserver'
/** Time between one card starting to appear and the next. */
export const REVEAL_STAGGER = 50
/** The longest a newly arrived group of cards waits for the previous group to finish starting. */
export const REVEAL_MAX_WAIT = 100
/** A card counts once its top passes 85% of the screen height. */
export const REVEAL_MARGIN = '0px 0px -15% 0px'
export const REVEAL_SAFETY = 4000

export const ARM_REVEAL = `(function(){var h=document.documentElement;if(!('IntersectionObserver' in window))return;h.setAttribute('${REVEAL}','');setTimeout(function(){if(!h.hasAttribute('${REVEAL_LIVE}')){h.removeAttribute('${REVEAL}');h.setAttribute('${REVEAL_OFF}','')}},${REVEAL_SAFETY})})()`

/** The same reveal as PressCarousel's, in plain JavaScript, for the inline script after the list. */
export const START_REVEAL = `(function(){var h=document.documentElement,s=document.currentScript,l=s&&s.parentNode&&s.parentNode.querySelector('ul');if(!l||!h.hasAttribute('${REVEAL}')||h.hasAttribute('${REVEAL_OFF}'))return;h.setAttribute('${REVEAL_LIVE}','');var items=Array.prototype.slice.call(l.children),next=0;var io=new IntersectionObserver(function(es){var now=performance.now(),t=now+Math.min(Math.max(next-now,0),${REVEAL_MAX_WAIT});es.filter(function(e){return e.isIntersecting}).map(function(e){return e.target}).sort(function(a,b){return items.indexOf(a)-items.indexOf(b)}).forEach(function(li){io.unobserve(li);li.style.transitionDelay=Math.round(t-now)+'ms';li.setAttribute('data-shown','');next=t+${REVEAL_STAGGER};t=next})},{rootMargin:'${REVEAL_MARGIN}'});items.forEach(function(li){io.observe(li)});l['${REVEAL_OBSERVER}']=io})()`
