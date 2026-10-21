// Instances in continuous space (first quantization). Every instance answers the same six questions, stored as
// `system` on the instance: dimension, particles, space (a periodic cell or free space), external potential,
// interaction, and units. The readable fields (labels, Hamiltonian text, sector) and the key are generated from
// them, so that two submissions of the same problem get the same instance.

export const PRESETS = {
  heg: {label: 'Electron gas (jellium)', space: 'periodic', external: 'uniform background', interaction: 'coulomb', species: 'electrons', spin: true, unit: 'Ha', per: 'electron'},
  trap: {label: 'Particles in a harmonic trap', space: 'free', external: 'harmonic trap', interaction: 'coulomb', species: 'electrons', spin: true, unit: 'Ha', per: 'system'},
  molecule: {label: 'Atom or molecule (fixed nuclei)', space: 'free', external: 'fixed nuclei', interaction: 'coulomb', species: 'electrons', spin: true, unit: 'Ha', per: 'system'},
  solid: {label: 'Crystal (nuclei in a periodic cell)', space: 'periodic', external: 'fixed nuclei', interaction: 'coulomb', species: 'electrons', spin: true, unit: 'Ha', per: null},
  other: {label: 'Other (describe it)', space: null, external: null, interaction: null, species: '', spin: null, unit: '', per: 'system'},
};

// Cell shapes of a periodic simulation cell. The key enters the instance key; the text is shown.
export const CELLS = {
  sc: 'simple cubic', bcc: 'body-centred cubic', fcc: 'face-centred cubic', rect332: 'rectangular with sides in the ratio 3:3:2',
  sq: 'square', rect: 'rectangular commensurate with a triangular lattice', rhombus: '60-degree rhombic (triangular-lattice)',
};
// The Ketboard category of a system, by its particles: only electrons so far. Nuclear matter and quantum gases
// will add their own categories here.
const CATEGORY = {electrons: 'continuum-electrons'};
// Ketbook page that explains a kind of system and its instances; Ketboard links its models to it.
const WIKI = {heg: 'homogeneous-electron-gas', molecule: 'molecules', solid: 'solids'};
export const EXTERNAL = ['none', 'uniform background', 'harmonic trap', 'fixed nuclei', 'quantum nuclei', 'other'];
export const ELEMENTS = ['H', 'He', 'Li', 'Be', 'B', 'C', 'N', 'O', 'F', 'Ne', 'Na', 'Mg', 'Al', 'Si', 'P', 'S', 'Cl', 'Ar', 'K', 'Ca'];

const num = s => String(s ?? '').trim().replace(/^\+/, '');
const slug = s => num(s).toLowerCase().normalize('NFKD').replace(/\./g, 'p').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const isNumber = s => /^-?\d+(\.\d+)?([eE][+-]?\d+)?$/.test(num(s));
const count = s => { const n = Number(num(s)); if (!Number.isInteger(n) || n < 0) throw Error('Particle numbers must be non-negative integers.'); return n; };

// Nuclei: one per line, "Z x y z" or "symbol x y z" (coordinates in the chosen units).
export function parseNuclei(text, dimension) {
  const nuclei = String(text || '').split('\n').map(line => line.trim()).filter(Boolean).map(line => {
    const [head, ...coords] = line.split(/[\s,]+/);
    const Z = /^\d+$/.test(head) ? Number(head) : ELEMENTS.indexOf(head[0].toUpperCase() + head.slice(1).toLowerCase()) + 1;
    if (!(Z > 0)) throw Error(`Unknown nucleus "${head}": give the atomic number or the element symbol.`);
    if (coords.length !== dimension || !coords.every(isNumber)) throw Error(`Each nucleus needs ${dimension} coordinates: "${line}".`);
    return {Z, position: coords.map(Number)};
  });
  if (!nuclei.length) throw Error('Give the nuclei, one per line: atomic number or symbol, then the coordinates.');
  return nuclei;
}
// Lattice vectors of a periodic simulation cell: one per line, in the units of the nuclear coordinates.
export function parseVectors(text, dimension) {
  const vectors = String(text || '').split('\n').map(line => line.trim()).filter(Boolean).map(line => {
    const coords = line.split(/[\s,]+/);
    if (coords.length !== dimension || !coords.every(isNumber)) throw Error(`Each lattice vector needs ${dimension} coordinates: "${line}".`);
    return coords.map(Number);
  });
  if (vectors.length !== dimension) throw Error(`Give the ${dimension} lattice vectors of the simulation cell, one per line.`);
  return vectors;
}
const formula = nuclei => { const c = {}; nuclei.forEach(({Z}) => { const s = ELEMENTS[Z - 1] || `Z${Z}`; c[s] = (c[s] || 0) + 1; }); return Object.entries(c).map(([s, n]) => s + (n > 1 ? n : '')).join(''); };

// The structured system from the form values.
export function systemFromForm(values) {
  const v = name => num(values[name]);
  const preset = PRESETS[v('cpreset')]; if (!preset) throw Error('Choose a kind of continuum system.');
  const dimension = Number(v('cdim')); if (![1, 2, 3].includes(dimension)) throw Error('Choose the dimension.');
  const species = v('cspecies') || preset.species || 'electrons';
  if (!CATEGORY[species]) throw Error('Continuum electrons is for electrons. Nuclear matter, quantum gases and other particles will get categories of their own; until then, describe such a system as an instance you cannot define.');
  if (v('cup') === '' && v('cdown') === '') throw Error('Give the numbers of spin-up and spin-down electrons, N↑ and N↓.');
  const particles = [{name: species, up: count(v('cup')), down: count(v('cdown'))}];
  const total = particles.reduce((n, p) => n + (p.count ?? p.up + p.down), 0); if (!total) throw Error('Give the number of particles.');
  const spaceType = preset.space || v('cspace');
  let space;
  if (spaceType === 'periodic' && v('cpreset') === 'solid') {
    if (!v('csupercell')) throw Error('Describe the simulation cell (for example "2×2×2 primitive cells").');
    const cells = v('cnorm') === 'cell' ? count(v('cprim')) : null; if (cells === 0) throw Error('Give the number of primitive cells in the simulation cell.');
    space = {type: 'periodic', cell: v('csupercell'), lattice_vectors: parseVectors(values.clattice, dimension), ...(cells ? {primitive_cells: cells} : {}), twist: ['', 'Γ', 'gamma', 'Gamma'].includes(v('ctwist_text')) ? 'Gamma' : v('ctwist_text')};
  } else if (spaceType === 'periodic') {
    const cell = v('ccell'); if (!CELLS[cell] && !(cell === 'other' && v('ccell_text'))) throw Error('Choose the shape of the simulation cell.');
    if (!isNumber(v('crs')) && !v('csize')) throw Error('Give the density r_s or the cell dimensions.');
    space = {type: 'periodic', cell: CELLS[cell] || v('ccell_text'), ...(isNumber(v('crs')) ? {r_s: num(v('crs'))} : {size: v('csize')}), twist: v('ctwist') || 'Gamma'};
  } else if (spaceType === 'free') space = {type: 'free'};
  else throw Error('Choose the space: a periodic cell or free space.');
  const externalType = preset.external || v('cext');
  let external;
  if (externalType === 'harmonic trap') { if (!isNumber(v('comega'))) throw Error('Give the trap frequency ω.'); external = {type: 'harmonic trap', omega: num(v('comega'))}; }
  else if (externalType === 'fixed nuclei' && v('cpreset') === 'solid') {
    const nuclei = parseNuclei(values.cnuclei, dimension), quantum = v('cnuclear') === 'quantum';
    if (!v('cstructure')) throw Error('Name the crystal structure (for example "rock salt" or "BCC").');
    if (!v('cgeometry')) throw Error('Give the lattice parameter (for example "L = 4.0 Å" or "r_s = 1.31").');
    if (quantum && !isNumber(v('cmass'))) throw Error('Give the nuclear mass in electron masses.');
    if (quantum && new Set(nuclei.map(n => n.Z)).size > 1) throw Error('Quantum nuclei are supported for one element only.');
    const charge = nuclei.reduce((s, n) => s + n.Z, 0) - total; if (charge !== 0) throw Error(`The simulation cell must be neutral: the nuclei carry ${charge} more charges than the electrons.`);
    external = {type: quantum ? 'quantum nuclei' : 'fixed nuclei', coordinate_units: v('ccoord_units') || 'bohr', structure: v('cstructure'), geometry: v('cgeometry'), nuclei, charge,
      ...(quantum ? {mass: num(v('cmass')), statistics: 'distinguishable'} : {}), ...(v('cpp') ? {pseudopotential: v('cpp')} : {})};
  } else if (externalType === 'fixed nuclei') {
    const nuclei = parseNuclei(values.cnuclei, dimension);
    if (!v('cgeometry')) throw Error('Name the geometry (for example "equilibrium, NIST CCCBDB" or "R = 2.068 bohr").');
    external = {type: 'fixed nuclei', coordinate_units: v('ccoord_units') || 'bohr', geometry: v('cgeometry'), nuclei, charge: nuclei.reduce((s, n) => s + n.Z, 0) - total};
  } else if (externalType === 'other') { if (!v('cext_text')) throw Error('Describe the external potential.'); external = {type: 'other', description: v('cext_text')}; }
  else if (EXTERNAL.includes(externalType)) external = {type: externalType};
  else throw Error('Choose the external potential.');
  const interaction = (preset.interaction || v('cint')) === 'coulomb' ? {type: 'coulomb'} : (v('cint_text') ? {type: 'other', description: v('cint_text')} : null);
  if (!interaction) throw Error('Describe the interaction between the particles.');
  const unit = preset.unit || v('cunit'); if (!unit) throw Error('Give the energy unit.');
  const per = v('cpreset') === 'other' ? (v('cper') || 'particle') : v('cpreset') === 'solid' ? v('cnorm') : preset.per;
  if (!(v('cpreset') === 'solid' ? ['cell', 'atom', 'system'] : ['particle', 'electron', 'system']).includes(per)) throw Error('Choose how the energy is normalized.');
  return {dimension, particles, space, external, interaction, unit, per, preset: v('cpreset'), name: v('cname')};
}

// The form values that rebuild a stored system (the inverse of systemFromForm), used to start a new instance
// from an existing one.
export function continuumFormValues(system) {
  const {dimension, particles: [p], space, external, interaction, unit, per, preset} = system;
  const cell = space.type === 'periodic' ? (Object.keys(CELLS).find(k => CELLS[k] === space.cell) || 'other') : '';
  const values = {category: 'continuum-electrons', instance_mode: 'new', cpreset: preset, cdim: String(dimension), cname: system.name || '', cspecies: p.name,
    cup: p.count === undefined ? String(p.up) : '', cdown: p.count === undefined ? String(p.down) : '', ccount: p.count === undefined ? '' : String(p.count),
    cspace: space.type, ccell: cell, ccell_text: cell === 'other' ? space.cell : '', crs: space.r_s ?? '', csize: space.size ?? '', ctwist: space.type === 'periodic' && space.twist !== 'Gamma' ? space.twist : '',
    cext: external.type, comega: external.omega ?? '', cext_text: external.type === 'other' ? external.description : '',
    cnuclei: external.nuclei ? external.nuclei.map(n => [ELEMENTS[n.Z - 1] || n.Z, ...n.position].join(' ')).join('\n') : '',
    ccoord_units: external.coordinate_units || 'bohr', cgeometry: external.geometry || '',
    cint: interaction.type, cint_text: interaction.type === 'other' ? interaction.description : '', cunit: unit, cper: per};
  if (preset === 'solid') Object.assign(values, {ccell: '', crs: '', csize: '', ctwist: '', csupercell: space.cell, cprim: space.primitive_cells ? String(space.primitive_cells) : '',
    clattice: space.lattice_vectors.map(a => a.join(' ')).join('\n'), ctwist_text: space.twist === 'Gamma' ? '' : space.twist, cext: 'fixed nuclei', cstructure: external.structure,
    cnuclear: external.type === 'quantum nuclei' ? 'quantum' : 'clamped', cmass: external.mass ?? '', cpp: external.pseudopotential || '', cnorm: per});
  return values;
}

const spins = p => p.count !== undefined ? `N = ${p.count}` : `N↑ = ${p.up}, N↓ = ${p.down}`;
const twist = s => s.twist === 'Gamma' ? 'Γ' : /^\(/.test(s.twist) ? `k = ${s.twist}` : s.twist;
// A twist given as fractions, "(1/3, 1/3, 0)", is in units of the reciprocal vectors of the simulation cell.
const twistText = s => s.twist === 'Gamma' ? 'Gamma point (no twist)' : /^\(/.test(s.twist) ? `twist k = ${s.twist} in units of the simulation-cell reciprocal vectors` : s.twist;
const twistKey = t => t === 'Gamma' ? 'gamma' : /^\(/.test(t) ? 'k' + slug(t.replace(/\//g, 'o')) : slug(t.replace(/×/g, 'x'));
const vector = a => `(${a.join(', ')})`;

// The complete instance for data/benchmarks.json from a structured system.
export function continuumInstance(system, existingIds = []) {
  const {dimension: d, particles, space, external, interaction, unit} = system;
  const cellKey = space.type === 'periodic' ? (Object.keys(CELLS).find(k => CELLS[k] === space.cell) || slug(space.cell)) : null;
  const p = particles[0], N = particles.reduce((n, q) => n + (q.count ?? q.up + q.down), 0);
  const spinKey = p.count !== undefined ? `n${N}` : p.down === 0 ? `n${N}-pol` : p.up === p.down ? `n${N}-unpol` : `nup${p.up}-ndown${p.down}`;
  const coulombText = 'sum_{i<j} 1/|r_i - r_j|';
  const ewald = space.type === 'periodic' ? '; Coulomb sums by Ewald summation with the Madelung self-image term included' : '';
  let id, family, part, group, label, hamiltonian, hamLatex, params, size, description, per = system.per;
  const interactionText = interaction.type === 'coulomb' ? coulombText : interaction.description;
  if (system.preset === 'heg') {
    if (p.name !== 'electrons' || space.type !== 'periodic' || external.type !== 'uniform background' || interaction.type !== 'coulomb') throw Error('The electron gas is electrons in a periodic cell with a uniform background and Coulomb interactions.');
    if (space.r_s === undefined) throw Error('Give the density r_s.');
    // One model for the gas in two and three dimensions; the dimension is the part, and starts each label.
    id = `heg${d}d-${cellKey}-${spinKey}-rs${slug(space.r_s)}`; family = 'Electron gas';
    part = `${d}D`; group = `${spins(p)} · ${space.cell}`; label = `${d}D · ${spins(p)} · rₛ = ${space.r_s} · ${space.cell} · ${twist(space)}`;
    hamiltonian = `H = -1/2 sum_i nabla_i^2 + ${coulombText} + uniform neutralizing background${ewald}; Hartree atomic units`;
    hamLatex = 'H=-\\tfrac12\\sum_i\\nabla_i^2+\\sum_{i<j}\\frac{1}{|\\mathbf r_i-\\mathbf r_j|}+\\text{background}';
    params = `N_\\uparrow=${p.up},\\qquad N_\\downarrow=${p.down},\\qquad r_s=${space.r_s}`; size = `N = ${N} electrons (${spins(p)}) · rₛ = ${space.r_s}`;
    description = 'Electrons in a uniform neutralizing background (jellium).';
  } else if (system.preset === 'trap') {
    if (space.type !== 'free' || external.type !== 'harmonic trap') throw Error('Particles in a trap are in free space with a harmonic external potential.');
    const kind = p.name === 'electrons' && interaction.type === 'coulomb' ? 'quantum dot' : `trapped ${p.name}`;
    part = `${d}D`; id = `trap${d}d-${slug(p.name)}-${spinKey}-w${slug(external.omega)}${interaction.type === 'coulomb' ? '' : '-' + slug(system.name || 'other')}`; family = `${d}D ${kind}`;
    group = spins(p); label = `${spins(p)} · ω = ${external.omega}`;
    hamiltonian = `H = sum_i (-1/2 nabla_i^2 + 1/2 omega^2 r_i^2) + ${interactionText}; omega = ${external.omega}; ${unit === 'Ha' ? 'Hartree (effective) atomic units' : unit}`;
    hamLatex = interaction.type === 'coulomb' ? 'H=\\sum_i\\left(-\\tfrac12\\nabla_i^2+\\tfrac12\\omega^2 r_i^2\\right)+\\sum_{i<j}\\frac{1}{|\\mathbf r_i-\\mathbf r_j|}' : 'H=\\sum_i\\left(-\\tfrac12\\nabla_i^2+\\tfrac12\\omega^2 r_i^2\\right)+V_{\\mathrm{int}}';
    params = `${p.count !== undefined ? `N=${N}` : `N_\\uparrow=${p.up},\\qquad N_\\downarrow=${p.down}`},\\qquad \\omega=${external.omega}`; size = `N = ${N} ${p.name}`;
    description = kind === 'quantum dot' ? 'Electrons in a harmonic trap with Coulomb repulsion.' : `${p.name} in a harmonic trap.`;
  } else if (system.preset === 'molecule') {
    if (space.type !== 'free' || external.type !== 'fixed nuclei') throw Error('An atom or molecule is electrons in free space with fixed nuclei.');
    const name = system.name || formula(external.nuclei);
    id = `mol-${slug(name)}-${slug(external.geometry)}${external.charge ? `-q${external.charge}` : ''}${p.down === undefined ? '' : `-s${p.up - p.down}`}`; family = 'Atoms and molecules';
    part = name; group = name; label = `${name} · ${external.geometry} · charge ${external.charge} · ${spins(p)}`;
    hamiltonian = `H = sum_i (-1/2 nabla_i^2 - sum_A Z_A/|r_i - R_A|) + ${coulombText} + sum_{A<B} Z_A Z_B/|R_A - R_B|; nuclei fixed (Born-Oppenheimer), all electrons, nonrelativistic; Hartree atomic units`;
    hamLatex = 'H=\\sum_i\\Big(-\\tfrac12\\nabla_i^2-\\sum_A\\frac{Z_A}{|\\mathbf r_i-\\mathbf R_A|}\\Big)+\\sum_{i<j}\\frac{1}{|\\mathbf r_i-\\mathbf r_j|}+\\sum_{A<B}\\frac{Z_AZ_B}{|\\mathbf R_A-\\mathbf R_B|}';
    params = `N_\\uparrow=${p.up},\\qquad N_\\downarrow=${p.down}`; size = `${N} electrons, ${external.nuclei.length} nuclei (${formula(external.nuclei)})`;
    description = `${name}, ${external.geometry}.`;
  } else if (system.preset === 'solid') {
    if (space.type !== 'periodic' || !space.lattice_vectors || !['fixed nuclei', 'quantum nuclei'].includes(external.type) || interaction.type !== 'coulomb') throw Error('A crystal is electrons and nuclei in a periodic cell with Coulomb interactions.');
    if (!system.name) throw Error('Name the material (for example "Lithium hydride").');
    const quantum = external.type === 'quantum nuclei', pp = external.pseudopotential, cellText = space.cell.replace(/×/g, 'x');
    id = `solid-${slug(system.name)}-${slug(external.structure)}-${slug(external.geometry)}-${slug(cellText)}-${twistKey(space.twist)}${pp ? '-' + slug(pp) : ''}${quantum ? '-quantum-nuclei' : ''}${p.up !== p.down ? `-s${p.up - p.down}` : ''}`;
    // One model for all crystals: a part per material, a section per structure (and per quantum nuclei or a
    // pseudopotential, which change the Hamiltonian); the rows of a section are its cells, lattice parameters, twists.
    family = 'Solids'; part = system.name; group = [external.structure, quantum ? 'quantum nuclei' : null, pp].filter(Boolean).join(', ');
    label = [`${system.name}, ${external.structure}, ${external.geometry}`, space.cell, twist(space), quantum ? 'quantum nuclei' : null, pp].filter(Boolean).join(' · ');
    const nuclearKinetic = quantum ? ` - sum_A 1/(2 M) nabla_A^2 (M = ${external.mass} m_e)` : '';
    hamiltonian = `H = sum_i (-1/2 nabla_i^2 - sum_A Z_A/|r_i - R_A|)${nuclearKinetic} + ${coulombText} + sum_{A<B} Z_A Z_B/|R_A - R_B|${ewald}; ${quantum ? 'nuclei as distinguishable quantum particles (no nuclear exchange)' : 'nuclei fixed (Born-Oppenheimer)'}, ${pp ? `${pp} pseudopotential` : 'all electrons'}, nonrelativistic; Hartree atomic units`;
    hamLatex = `H=\\sum_i\\Big(-\\tfrac12\\nabla_i^2-\\sum_A\\frac{Z_A}{|\\mathbf r_i-\\mathbf R_A|}\\Big)${quantum ? '-\\sum_A\\frac{\\nabla_A^2}{2M}' : ''}+\\sum_{i<j}\\frac{1}{|\\mathbf r_i-\\mathbf r_j|}+\\sum_{A<B}\\frac{Z_AZ_B}{|\\mathbf R_A-\\mathbf R_B|}`;
    params = `N_\\uparrow=${p.up},\\qquad N_\\downarrow=${p.down}${quantum ? `,\\qquad M=${external.mass}\\,m_e` : ''}`;
    size = `${N} electrons, ${external.nuclei.length} nuclei (${formula(external.nuclei)}) · ${space.cell}`;
    description = `${system.name}: ${external.structure}, ${external.geometry}.`;
  } else {
    if (!system.name) throw Error('Give the system a name (for example "Liquid helium-4").');
    id = `${slug(system.name)}-${d}d-${spinKey}${space.type === 'periodic' ? `-${cellKey}${space.r_s !== undefined ? '-rs' + slug(space.r_s) : ''}` : ''}${external.type === 'harmonic trap' ? '-w' + slug(external.omega) : ''}`;
    family = system.name; part = `${d}D`; group = `${spins(p)}${space.type === 'periodic' ? ' · ' + space.cell : ''}`;
    label = [spins(p), space.r_s !== undefined ? `rₛ = ${space.r_s}` : space.size, space.type === 'periodic' ? space.cell : 'free space', external.type === 'harmonic trap' ? `ω = ${external.omega}` : null, space.type === 'periodic' ? twist(space) : null].filter(Boolean).join(' · ');
    hamiltonian = `H = -sum_i hbar^2/(2m) nabla_i^2 + ${external.type === 'none' ? '' : (external.description || external.type) + ' + '}${interactionText}${interaction.type === 'coulomb' ? ewald : ''}; energy unit ${unit}`;
    hamLatex = ''; params = ''; size = `N = ${N} ${p.name}`; description = system.name;
  }
  if (existingIds.includes(id)) throw Error(`The instance ${id} already exists; choose it from the list instead.`);
  const sites = external.nuclei ? `; ${external.type === 'quantum nuclei' ? 'crystal sites of the nuclei' : 'nuclei'} (${external.coordinate_units}): ${external.nuclei.map(n => `${ELEMENTS[n.Z - 1] || 'Z' + n.Z} ${vector(n.position)}`).join('; ')}` : '';
  const geometry = space.lattice_vectors
    ? `${d}D ${p.name}, N = ${N}, in a periodic simulation cell of ${space.cell} with lattice vectors (${external.coordinate_units}) ${space.lattice_vectors.map(vector).join('; ')}${sites}; ${twistText(space)}`
    : space.type === 'periodic'
    ? `${d}D ${p.name}, N = ${N}, in a ${space.cell} cell of ${space.r_s !== undefined ? `${d === 3 ? 'volume N (4 pi / 3) r_s^3' : d === 2 ? 'area N pi r_s^2' : 'length 2 N r_s'} (r_s = ${space.r_s}, lengths in Bohr)` : space.size}; periodic boundary conditions, ${space.twist === 'Gamma' ? 'Gamma point (no twist)' : space.twist}`
    : `${d}D ${p.name}, N = ${N}, in free space${external.type === 'harmonic trap' ? ` in a harmonic trap with omega = ${external.omega}` : ''}${external.type === 'fixed nuclei' ? `; nuclei (${external.coordinate_units}): ${external.nuclei.map(n => `${ELEMENTS[n.Z - 1] || 'Z' + n.Z} (${n.position.join(', ')})`).join('; ')}` : ''}`;
  const polarization = p.count !== undefined ? '' : p.down === 0 ? ' (fully polarized)' : p.up === p.down ? ' (unpolarized)' : ' (partially polarized)';
  // Energies per atom or per primitive cell are a total divided by per_count.
  const perCount = per === 'atom' ? external.nuclei.length : per === 'cell' ? space.primitive_cells : null;
  return {
    id, name: family, family, part, category: CATEGORY[particles[0].name], sites: N, per, ...(perCount ? {per_count: perCount} : {}), group, geometry, hamiltonian,
    sector: `${spins(p)}${polarization}; ground-state variational calculation${external.type === 'quantum nuclei' ? '; nuclear state localized on the listed crystal sites' : ''}`, unit, description,
    hamiltonian_latex: hamLatex, instance_label: label, lattice_size: size,
    boundary_conditions: space.lattice_vectors ? `Periodic, ${twistText(space)}` : space.type === 'periodic' ? `Periodic, ${space.twist === 'Gamma' ? 'Gamma point (no twist)' : space.twist}` : 'Free space (open)',
    parameters_latex: params,
    system: {dimension: d, particles, space, external, interaction, unit, per, preset: system.preset, ...(system.name ? {name: system.name} : {})},
    ...(WIKI[system.preset] ? {wiki: WIKI[system.preset]} : {}),
  };
}

export const continuumInstanceFromForm = (values, existingIds = []) => continuumInstance(systemFromForm(values), existingIds);
