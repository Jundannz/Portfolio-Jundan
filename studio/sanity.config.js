import {defineConfig} from 'sanity';
import {structureTool} from 'sanity/structure';
import {work} from './schemaTypes/work.js';

const projectId = process.env.SANITY_STUDIO_PROJECT_ID;
if (!projectId || projectId === 'your_project_id') throw new Error('Isi studio/.env dengan SANITY_STUDIO_PROJECT_ID terlebih dahulu.');

export default defineConfig({
  name: 'jundannz', title: 'Jundannz Portfolio', projectId,
  dataset: process.env.SANITY_STUDIO_DATASET || 'production',
  plugins: [structureTool()],
  schema: {types: [work]}
});
