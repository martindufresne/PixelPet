/**
 * Species Registry
 * Architecture extensible pour supporter chats, chiens, et autres animaux de bureau.
 */

const catSpecies = require('./cat');
const dogSpecies = require('./dog');

class SpeciesRegistry {
  constructor() {
    this.speciesMap = new Map();
    this.register(catSpecies);
    this.register(dogSpecies);
  }

  register(speciesDef) {
    if (!speciesDef || !speciesDef.id) {
      throw new Error('Invalid species definition: id is required.');
    }
    this.speciesMap.set(speciesDef.id, speciesDef);
  }

  get(id) {
    return this.speciesMap.get(id) || this.speciesMap.get('cat');
  }

  list() {
    return Array.from(this.speciesMap.values()).map(s => ({
      id: s.id,
      name: s.name,
      displayName: s.displayName,
      icon: s.icon,
      presets: s.presets ? s.presets.map(p => ({ id: p.id, name: p.name })) : []
    }));
  }
}

module.exports = new SpeciesRegistry();
