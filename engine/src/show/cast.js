// SINGLE SOURCE for on-screen names, bios and items (a final gate on names may flip later: change them here).
// Bios are Jade's own wording (2026-10-14). Order = character-select order (cursor hops left -> right).
export const CAST = {
  charlie: { name: 'CHARLIE', bio: ['singer-songwriter', 'guitarist', 'tech demos'], item: 'HAT', icon: 'hat', portrait: 'portrait_charlie' },
  ricky: { name: 'RICKY', bio: ['electric guitar', 'hacker', 'PM extraordinaire'], item: 'GUITAR', icon: 'guitar', portrait: 'portrait_ricky' },
  jade: { name: 'JADE', bio: ['musician', 'scientist', 'poet', 'martial artist'], item: 'TWO PENCILS', icon: 'pencils', portrait: 'portrait_jade',
    note: ['graphite = fixtures', 'every-color = functions'] },
};
export const SELECT_ORDER = ['charlie', 'ricky', 'jade'];
/** HUD order (left -> right), Lost Vikings style */
export const HUD_ORDER = ['charlie', 'jade', 'ricky'];
export const SAVE_MARQUEE = 'SAVE FILE FOUND: 2011 · "The Product Manager Song" · CONTINUE?';
