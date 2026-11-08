const cardTiers = {
  ada:'common', euler:'common', ramanujan:'rare', noether:'rare', gauss:'common',
  turing:'legendary', leibniz:'common', germain:'rare', hypatia:'rare',
  vonneumann:'legendary', newton:'common', descartes:'common', fermat:'rare',
  riemann:'legendary', cantor:'rare', poincare:'rare', hilbert:'common',
  johnson:'rare', mirzakhani:'legendary', boole:'common'
};
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function validateEvent(value) {
  if (!value || typeof value !== 'object' || !uuid.test(value.visitId)) return null;
  if (value.type === 'visit') return {type:'visit', visitId:value.visitId};
  if (value.type !== 'draw' || !uuid.test(value.eventId) ||
      !Array.isArray(value.cards) || value.cards.length < 1 || value.cards.length > 10) return null;
  if (value.cards.some(card => !card || !Object.hasOwn(cardTiers, card.id) || typeof card.fresh !== 'boolean')) return null;
  return {type:'draw', visitId:value.visitId, eventId:value.eventId,
    cards:value.cards.map(({id,fresh}) => ({id,fresh}))};
}

export function aggregate(visits, events) {
  const result = {visits, players:0, draws:0, duplicates:0,
    tiers:{common:0,rare:0,legendary:0}, cards:{}};
  const players = new Set();
  for (const event of events) {
    const entry = validateEvent(event);
    if (!entry || entry.type !== 'draw') continue;
    players.add(entry.visitId);
    for (const card of entry.cards) {
      result.draws++;
      if (!card.fresh) result.duplicates++;
      result.tiers[cardTiers[card.id]]++;
      result.cards[card.id] = (result.cards[card.id] || 0) + 1;
    }
  }
  result.players = players.size;
  return result;
}
