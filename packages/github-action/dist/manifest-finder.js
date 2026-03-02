"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.findManifestPath = findManifestPath;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const DEFAULT_SEARCH_PATHS = [
    './manifest.json',
    './src/manifest.json',
    './extension/manifest.json',
    './public/manifest.json',
    './chrome/manifest.json',
];
function findManifestPath(customPath) {
    if (customPath && customPath.length > 0) {
        const resolved = path.resolve(customPath);
        if (!fs.existsSync(resolved)) {
            throw new Error(`Manifest not found at custom path: ${resolved}`);
        }
        return resolved;
    }
    for (const searchPath of DEFAULT_SEARCH_PATHS) {
        const resolved = path.resolve(searchPath);
        if (fs.existsSync(resolved)) {
            return resolved;
        }
    }
    const searched = DEFAULT_SEARCH_PATHS.map((p) => `  - ${path.resolve(p)}`).join('\n');
    throw new Error(`Could not find manifest.json in any of the default locations:\n${searched}\n\nPlease specify the path using the 'manifest-path' input.`);
}
