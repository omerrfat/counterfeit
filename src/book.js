import gsap from 'gsap';

const $ = (s) => document.querySelector(s);
const pct = (a, b) => (b ? Math.round((a / b) * 100) : null);

// The fake exhibit that fooled the largest share of visitors, if anyone ruled on it.
export function masterpiece(visit, claims) {
  let best = null;
  claims.forEach((c, i) => {
    if (c.real || visit.ruled[i] < 2) return;
    const right = pct(visit.right[i], visit.ruled[i]);
    if (best === null || right < best.right) best = { index: i, right };
  });
  return best;
}

export function visitorTag(visit, i) {
  const p = pct(visit.right[i], visit.ruled[i]);
  return p === null ? null : `${p}% of visitors judged this one correctly`;
}

export function renderBook(visit, { yourCorrect, claims }) {
  const n = visit.n;
  $('#bookDemo').hidden = !visit.demo;
  $('#bookSub').textContent = n <= 1
    ? 'You are the first visitor to sign today’s book. Come back later to see how you compare.'
    : `${n} visitors have signed today’s book.`;
  $('#bookMedian').textContent = `${visit.median} of 8`;
  $('#bookMean').textContent = visit.mean.toFixed(1);
  $('#bookYou').textContent = `${yourCorrect} of 8`;
  const worse = visit.hist.slice(0, yourCorrect).reduce((s, c) => s + c, 0);
  $('#bookStanding').textContent = n > 1
    ? `You out-judged ${pct(worse, n)}% of the visitors ahead of you in the queue.`
    : '';

  // The queue: every visitor stands in the column for how many exhibits they judged correctly.
  const most = Math.max(...visit.hist, 1);
  const k = Math.max(1, Math.ceil(most / 8));
  const fig = (cls = '') => `<svg class="fig ${cls}" viewBox="0 0 14 30" aria-hidden="true"><use href="#fig"/></svg>`;
  $('#queue').innerHTML = visit.hist.map((count, i) => {
    const figs = count ? Math.ceil(count / k) : 0;
    const mine = i === yourCorrect;
    let stack = '';
    for (let f = 0; f < figs; f++) stack += fig(mine && f === figs - 1 ? 'is-you' : '');
    return `<div class="col${i === visit.median ? ' is-median' : ''}${mine ? ' is-you-col' : ''}">
      <span class="flag">${i === visit.median ? 'median' : ''}</span>
      <div class="stack">${stack}</div>
      <b>${i}</b><small>${count}</small>
    </div>`;
  }).join('');
  $('#queueNote').textContent = `Each figure is ${k === 1 ? 'one visitor' : `about ${k} visitors`}. The glowing one is you, torch in hand.`;

  const m = masterpiece(visit, claims);
  const el = $('#forger');
  if (m) {
    el.hidden = false;
    el.innerHTML = `<span class="forger-label">The forger’s masterpiece</span><strong>${claims[m.index].subject}</strong><span>Only ${m.right}% of visitors saw through it.</span>`;
  } else el.hidden = true;
}

export function openBook(reduced) {
  const d = $('#book');
  if (d.open) return;
  d.showModal();
  if (reduced) return;
  gsap.fromTo(d, { y: 56, opacity: 0 }, { y: 0, opacity: 1, duration: 0.42, ease: 'expo.out' });
  gsap.from('#book .fig', { y: -26, opacity: 0, duration: 0.55, ease: 'back.out(1.7)', stagger: { each: 0.012, from: 'start' }, delay: 0.25 });
  gsap.fromTo('#book .fig.is-you', { scale: 1 }, { scale: 1.25, duration: 0.5, yoyo: true, repeat: 3, ease: 'sine.inOut', delay: 1.1, transformOrigin: '50% 100%' });
}

export function closeBook(reduced) {
  const d = $('#book');
  if (!d.open) return;
  if (reduced) { d.close(); return; }
  gsap.to(d, { y: 36, opacity: 0, duration: 0.2, ease: 'power2.in', onComplete: () => { d.close(); gsap.set(d, { clearProps: 'all' }); } });
}
