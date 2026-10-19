// Daily cases. Each case has 8 exhibits: 5 genuine, 3 forged.
// `truth` is shown when the case is closed: a supporting detail for genuine
// exhibits, the correction for forgeries.
//
// Every claim should be fact-checked against a primary source before a case
// ships to the public.

const g = (subject, text, truth) => ({ subject, text, real: true, truth });
const f = (subject, text, truth) => ({ subject, text, real: false, truth });

export const CASES = [
  {
    wing: 'The Oceans',
    claims: [
      g('Challenger Deep', 'At nearly eleven kilometres down, the Mariana Trench could swallow Everest with more than a mile of water to spare.', 'Challenger Deep is about 10,935 m deep. Everest stands 8,849 m tall.'),
      g('Octopus', 'An octopus has three hearts: two pump blood through the gills, and one sends it around the rest of the body.', 'The body heart stops while the octopus swims, which is partly why it prefers to crawl.'),
      g('Sea otter', 'A sea otter packs roughly a million hairs into every square inch of its coat, the densest fur of any animal.', 'Otters have no blubber, so that fur is their only insulation and they groom constantly.'),
      g('Undersea volcanoes', 'Most of the planet’s volcanic activity happens underwater, along ridges where the ocean floor is slowly pulled apart.', 'Roughly three quarters of Earth’s volcanic output is submarine, and almost none of it is ever seen.'),
      g('Pacific Ocean', 'The Pacific holds more than half of all the water in the world’s oceans.', 'It covers about a third of Earth’s surface, more area than all the land combined.'),
      f('Dolphin', 'Dolphins sleep by switching off both halves of the brain at once, floating motionless near the surface.', 'Dolphins rest one brain hemisphere at a time and keep the other awake, so they can keep breathing.'),
      f('Great Barrier Reef', 'The Great Barrier Reef is the one living structure visible to the naked eye from the Moon.', 'Nothing on Earth is visible to the naked eye from the Moon. The reef can be seen from orbit.'),
      f('Sea star', 'Sea stars have no brain, but they do have a small central heart that pumps blood through their arms.', 'Sea stars have no heart and no blood either. Filtered seawater moves through their bodies instead.'),
    ],
  },
  {
    wing: 'The Human Body',
    claims: [
      g('Newborn skeleton', 'A baby is born with about 300 bones. An adult has 206, because many of them fuse together as we grow.', 'Skull plates stay separate at birth so the head can pass through the birth canal.'),
      g('Stomach lining', 'The lining of your stomach replaces itself every few days, which keeps your own acid from digesting you.', 'Stomach lining cells are renewed in roughly three to five days.'),
      g('Cornea', 'The cornea, the clear front of your eye, has no blood vessels and takes its oxygen straight from the air.', 'That is also why corneal transplants are rarely rejected.'),
      g('Brain', 'The brain is about two percent of your body weight but burns roughly a fifth of your energy.', 'Even at rest, around 20% of the body’s oxygen goes to the brain.'),
      g('Fingernails', 'Fingernails grow faster than toenails, by a factor of about three.', 'Nails grow roughly 3 mm a month on the hands and 1 mm on the feet.'),
      f('After death', 'Hair and fingernails keep growing for days after death.', 'The skin dehydrates and pulls back, which only makes hair and nails look longer.'),
      f('The tongue', 'Your tongue maps its tastes into zones: sweet at the tip, bitter at the back, sour and salty along the sides.', 'Every taste can be sensed across the whole tongue. The map came from a misread early-1900s study.'),
      f('Blood', 'Blood inside your veins is blue and only turns red when it meets oxygen in the air.', 'Blood is always red, only darker when low on oxygen. Veins look blue because of how skin scatters light.'),
    ],
  },
  {
    wing: 'Space',
    claims: [
      g('Venus', 'A day on Venus lasts longer than its year. It takes 243 Earth days to turn once, but only 225 to orbit the Sun.', 'Venus also spins backwards, so the Sun rises in the west.'),
      g('Saturn', 'Saturn is less dense than water, so in a bathtub big enough it would float.', 'Its average density is about 0.69 g/cm³, against 1 for water.'),
      g('Sunlight', 'The light reaching you from the Sun left it a little over eight minutes ago.', 'Sunlight takes about 8 minutes and 20 seconds to cross 150 million kilometres.'),
      g('Olympus Mons', 'The tallest mountain in the solar system is on Mars, about two and a half times the height of Everest.', 'Olympus Mons rises roughly 22 km above the plains around it.'),
      g('Astronauts', 'Astronauts come home slightly taller than they left, because the spine stretches without gravity pressing down.', 'The gain is a few centimetres at most and fades soon after landing.'),
      f('Earth’s orbit', 'Earth is closest to the Sun during the northern summer, which is why July is hot.', 'Earth is closest in early January. Seasons come from the tilt of its axis, not its distance.'),
      f('Mercury', 'Mercury, the planet nearest the Sun, is also the hottest planet.', 'Venus is hotter, around 465°C, because its thick carbon dioxide atmosphere traps heat.'),
      f('Pluto', 'Astronomers reclassified Pluto as a dwarf planet in 2016, after a new object was found beyond Neptune.', 'It happened in 2006, when the IAU adopted a new definition of “planet”. The discovery of Eris in 2005 prompted it.'),
    ],
  },
  {
    wing: 'The Kitchen',
    claims: [
      g('Honey', 'Sealed honey can stay edible for thousands of years, because it holds so little water and is so acidic that microbes cannot grow.', 'Its sugar also draws the water out of any microbe that lands in it.'),
      g('Bananas', 'Botanically, a banana is a berry. A strawberry is not.', 'Berries develop from a single flower ovary. A strawberry’s flesh grows from the flower’s receptacle.'),
      g('Cashew', 'A cashew nut hangs from the bottom of a fleshy fruit called the cashew apple.', 'The shell holds a skin-irritating oil, so cashews are always processed before they reach a shop.'),
      g('Carrots', 'Early domesticated carrots were purple or yellow. The familiar orange ones came later.', 'Orange carrots became common in Europe around the 1600s.'),
      g('Ketchup', 'In the 1830s, ketchup was sold as medicine, in the form of tomato pills.', 'Dr John Cook Bennett promoted tomato-based pills as a cure for indigestion.'),
      f('Vanilla', 'Vanilla is the world’s most expensive spice by weight.', 'Saffron is. Vanilla comes second, and both are very labour-intensive to harvest.'),
      f('Lobster', 'A live lobster is bright red. Cooking only makes it a little brighter.', 'Live lobsters are usually dark greenish-brown. Heat releases the red pigment astaxanthin.'),
      f('Cooking with wine', 'When you cook with wine, all of the alcohol burns off within a few minutes.', 'A sizeable share stays in the dish. After 15 minutes of simmering, around 40% can remain.'),
    ],
  },
  {
    wing: 'Animals',
    claims: [
      g('Wombat', 'Wombats produce cube-shaped droppings, which they stack to mark territory.', 'The cubes form in the last stretch of the intestine, where the walls vary in stiffness.'),
      g('Crow', 'Crows can recognise individual human faces and remember who treated them badly.', 'In a Seattle study, crows scolded people wearing a “dangerous” mask years after it was first used.'),
      g('Flamingos', 'A group of flamingos is called a flamboyance.', 'It can also be called a stand or a colony.'),
      g('Sloth', 'A sloth can hold its breath for up to forty minutes, far longer than a dolphin.', 'It slows its heart rate to about a third of normal to do so.'),
      g('Koala', 'Koalas have fingerprints so similar to ours that they are hard to tell apart under a microscope.', 'Outside the primates, koalas are the only animals known to have prints like ours.'),
      f('Camel', 'A camel’s hump is a reservoir that stores several days’ worth of water.', 'The hump stores fat, up to roughly 36 kg, which the camel can burn for energy.'),
      f('Goldfish', 'Goldfish have a memory span of about three seconds.', 'They can remember things for months and can be trained to respond to feeding cues.'),
      f('Bull', 'Bulls charge at a matador’s cape because they hate the colour red.', 'Cattle do not see red the way we do. It is the movement of the cape that triggers the charge.'),
    ],
  },
  {
    wing: 'History',
    claims: [
      g('Oxford', 'Teaching at Oxford was under way before the Aztec city of Tenochtitlan was founded.', 'Teaching at Oxford dates to 1096. Tenochtitlan was founded in 1325.'),
      g('Cleopatra', 'Cleopatra lived closer in time to the Moon landing than to the building of the Great Pyramid.', 'The Great Pyramid dates to about 2560 BCE. Cleopatra died in 30 BCE.'),
      g('Anglo-Zanzibar War', 'The shortest war in history, between Britain and Zanzibar in 1896, was over in under an hour.', 'It lasted about forty minutes.'),
      g('Napoleon', 'Napoleon was close to average height for a Frenchman of his time.', 'He was about 5 ft 6 in. The “short” image grew from unit confusion and British caricature.'),
      g('Vikings', 'Viking warriors never wore horned helmets. That image came from nineteenth-century stage costumes.', 'It was popularised by costumes for an 1876 staging of Wagner’s Ring cycle.'),
      f('Flat Earth', 'In the Middle Ages, most educated Europeans believed the Earth was flat.', 'Scholars had known it was a sphere since antiquity. The flat-Earth story was popularised in the 1800s.'),
      f('Marie Antoinette', 'Marie Antoinette said “Let them eat cake” when told the peasants had no bread.', 'No record shows she said it. The line appears in Rousseau’s Confessions, written when she was a child.'),
      f('Einstein', 'Albert Einstein failed mathematics at school before going on to revolutionise physics.', 'He excelled at maths and had mastered calculus by about fifteen.'),
    ],
  },
  {
    wing: 'Words',
    claims: [
      g('Quarantine', 'The word “quarantine” comes from the Italian for “forty days”, the wait imposed on ships arriving in Venice.', 'Venice first required thirty days, then raised it to forty.'),
      g('Tittle', 'The dot above a lowercase i or j is called a tittle.', 'The word comes from the Latin “titulus”.'),
      g('Robot', '“Robot” comes from a Czech word for forced labour.', 'It was introduced by Karel Čapek’s 1920 play R.U.R.'),
      g('OK', '“OK” began as a joke abbreviation of the deliberate misspelling “oll korrect” in 1830s Boston newspapers.', 'It spread after being used in the 1840 campaign of “Old Kinderhook”, Martin Van Buren.'),
      g('Typewriter', 'The word “typewriter” can be typed using only the top row of letters on a standard keyboard.', 'Every letter in it sits in the row QWERTYUIOP.'),
      f('Snow', 'Inuit languages have over a hundred separate words for snow.', 'The claim is wildly exaggerated. Inuit languages build long words from roots, which makes counting misleading.'),
      f('Alphabet', 'The word “alphabet” comes from the first two letters of the Latin alphabet, A and B.', 'It comes from the Greek alpha and beta.'),
      f('Posh', '“Posh” began as an acronym stamped on steamship tickets: Port Out, Starboard Home.', 'No such tickets have ever been found, and the true origin of the word is uncertain.'),
    ],
  },
];

// Puzzle No. 1 is the launch day.
const LAUNCH = Date.UTC(2026, 9, 19);

export function dayIndexFor(date = new Date()) {
  const utcMidnight = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
  return Math.max(0, Math.round((utcMidnight - LAUNCH) / 86400000));
}

export function msToNextCase(now = new Date()) {
  const next = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  return next - now;
}

function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function getPuzzle(dayIndex) {
  const c = CASES[dayIndex % CASES.length];
  const rand = mulberry32(dayIndex * 7919 + 17);
  const order = c.claims.map((_, i) => i);
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  const tilts = order.map(() => (rand() - 0.5) * 1.8);
  return { day: dayIndex, number: dayIndex + 1, wing: c.wing, claims: c.claims, order, tilts };
}

export const MAX_SCORE = 24;

export function rankFor(score) {
  if (score >= 24) return 'Master authenticator';
  if (score >= 19) return 'Curator';
  if (score >= 13) return 'Appraiser';
  if (score >= 7) return 'Docent';
  if (score >= 1) return 'Gallery visitor';
  return 'Easy mark';
}
