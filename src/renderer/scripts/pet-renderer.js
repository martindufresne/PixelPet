/**
 * Pet Renderer
 * Gère l'application des couleurs (palette swapping) et le rendu des motifs pixels (patches)
 * dans les SVG vectoriels des différentes poses.
 */
class PetRenderer {
  constructor() {
    this.currentSpecies = 'cat';
    this.currentPresetId = 'calico-cat';
    this.currentPresetData = null;
    this.svgObjects = [];
  }

  init() {
    this.svgObjects = Array.from(document.querySelectorAll('.pet-svg'));
  }

  async loadPreset(speciesId, presetId) {
    this.currentSpecies = speciesId;
    this.currentPresetId = presetId;

    try {
      this.currentPresetData = await window.pixelPetAPI.getPresetData(speciesId, presetId);
      this.applyToAllSvgs();
    } catch (e) {
      console.error('[PetRenderer] Error loading preset data:', e);
    }
  }

  applyToAllSvgs() {
    if (!this.currentPresetData) return;

    for (const obj of this.svgObjects) {
      this.applyToSvgObject(obj);
    }
  }

  applyToSvgObject(obj) {
    if (!obj || !this.currentPresetData) return;

    const doc = obj.contentDocument;
    if (!doc || !doc.documentElement) {
      // If SVG is not loaded yet, listen to onload
      obj.addEventListener('load', () => this.applyToSvgObject(obj), { once: true });
      return;
    }

    const root = doc.documentElement;
    const data = this.currentPresetData;

    // 1. Appliquer les variables CSS
    const baseColor = data.baseColor || '#FFFFFF';
    root.style.setProperty('--cat-color', baseColor);

    // Calcul du contraste pour l'outline
    const rgb = this.hexToRgb(baseColor);
    const luminance = rgb ? (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255 : 1;
    root.style.setProperty('--cat-outline', luminance > 0.5 ? '#000000' : '#FFFFFF');

    root.style.setProperty('--eye-bg-color', data.eyeBgColor || '#FFFFFF');
    root.style.setProperty('--eye-color', data.eyeColor || '#1A1A1A');
    root.style.setProperty('--eye-color-left', data.eyeColorLeft || data.eyeColor || '#1A1A1A');
    root.style.setProperty('--eye-color-right', data.eyeColorRight || data.eyeColor || '#1A1A1A');

    // 2. Injecter les motifs de pixels personnalisés dans les clipPaths
    this.injectPixelPatches(doc, data);
  }

  injectPixelPatches(doc, data) {
    const SVG_NS = 'http://www.w3.org/2000/svg';

    const patchCategories = ['head', 'body', 'tail', 'earL', 'earR', 'legFl', 'legFr'];

    // Remove existing custom patch groups if any
    const existing = doc.querySelectorAll('.custom-pixel-patch');
    existing.forEach(el => el.remove());

    for (const cat of patchCategories) {
      const pixels = data[cat];
      if (!pixels || !Array.isArray(pixels) || pixels.length === 0) continue;

      // Find target clip path or target group
      // E.g. g with clip-path="url(#cat-clip-head...)"
      const clipIdSelector = `[clip-path*="cat-clip-${cat}"]`;
      let targetG = doc.querySelector(clipIdSelector);

      if (!targetG) {
        // Fallback search by ID
        targetG = doc.getElementById(`cat-${cat}`) || doc.getElementById(cat);
      }

      if (targetG) {
        const patchGroup = doc.createElementNS(SVG_NS, 'g');
        patchGroup.setAttribute('class', 'custom-pixel-patch');
        patchGroup.setAttribute('shape-rendering', 'crispEdges');

        for (const pt of pixels) {
          if (pt.x === undefined || pt.y === undefined || !pt.color) continue;
          const rect = doc.createElementNS(SVG_NS, 'rect');
          rect.setAttribute('x', String(pt.x));
          rect.setAttribute('y', String(pt.y));
          rect.setAttribute('width', '1');
          rect.setAttribute('height', '1');
          rect.setAttribute('fill', pt.color);
          patchGroup.appendChild(rect);
        }

        targetG.appendChild(patchGroup);
      }
    }
  }

  hexToRgb(hex) {
    const res = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return res ? {
      r: parseInt(res[1], 16),
      g: parseInt(res[2], 16),
      b: parseInt(res[3], 16)
    } : null;
  }
}

window.petRenderer = new PetRenderer();
