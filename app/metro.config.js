// Monorepo-aware Metro config: the app lives in app/ but imports @mat-iq/engine
// from packages/, so Metro has to watch and resolve outside its own directory.
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '..');

const config = getDefaultConfig(projectRoot);

config.watchFolders = [workspaceRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];
// Without this, a hoisted dependency can be resolved twice and React ends up
// duplicated in the bundle.
config.resolver.disableHierarchicalLookup = true;

module.exports = config;
