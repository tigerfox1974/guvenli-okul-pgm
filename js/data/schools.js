import { CANONICAL_SCHOOLS } from './canonical-source.mjs';

export const schools = CANONICAL_SCHOOLS.map(school => ({ ...school }));
