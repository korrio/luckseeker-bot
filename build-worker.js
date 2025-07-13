// Build script for Cloudflare Worker
const fs = require('fs');
const path = require('path');

// Ensure dist directory exists
const distDir = path.join(__dirname, 'dist');
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

// Files to copy and modify for Worker environment
const filesToProcess = [
  'src/worker.js',
  'src/config/index.js',
  'src/controllers/lineController.js',
  'src/services/aiService.js',
  'src/services/birthChartService.js',
  'src/services/fortuneService.js',
  'src/services/database.js'
];

// Worker-compatible replacements
const nodeToWorkerReplacements = [
  // Remove dotenv completely
  [/require\('dotenv'\)\.config\(\);?\s*/g, ''],
  [/const\s+.*?=\s*require\('dotenv'\).*?;?\s*/g, ''],
  
  // Replace Node.js modules with Worker-compatible alternatives
  [/const\s+fs\s*=\s*require\('fs'\)\.promises;?/g, '// const fs = WorkerFS;'],
  [/const\s+fs\s*=\s*require\('fs'\);?/g, '// const fs = WorkerFS;'],
  [/const\s+path\s*=\s*require\('path'\);?/g, '// const path = WorkerPath;'],
  [/const\s+crypto\s*=\s*require\('crypto'\);?/g, '// crypto available globally'],
  
  [/require\('fs'\)\.promises/g, 'WorkerFS'],
  [/require\('fs'\)/g, 'WorkerFS'],
  [/require\('path'\)/g, 'WorkerPath'],
  [/require\('crypto'\)/g, 'crypto'],
  
  [/process\.env\./g, 'env.'],
  [/__dirname/g, '""'],
  [/__filename/g, '""'],
  
  // Fix file system operations for Worker environment
  [/fs\.writeFile\(/g, 'await WorkerFS.writeFile('],
  [/fs\.readFile\(/g, 'await WorkerFS.readFile('],
  [/fs\.mkdir\(/g, 'await WorkerFS.mkdir('],
  [/fs\.access\(/g, 'await WorkerFS.access('],
  
  // Fix specific patterns
  [/this\.dataDir\s*=\s*path\.join\(__dirname,\s*'[^']*'\);?/g, 'this.dataDir = "/data";'],
  [/this\.(\w+File)\s*=\s*path\.join\(this\.dataDir,\s*'([^']*)'\);?/g, 'this.$1 = "/data/$2";']
];

// Worker-compatible file system mock
const workerFSMock = `
// Worker-compatible file system using KV storage
class WorkerFS {
  static async writeFile(filePath, data, options = {}) {
    if (typeof LUCKSEEKER_KV !== 'undefined') {
      const key = filePath.replace(/[^a-zA-Z0-9-_]/g, '_');
      await LUCKSEEKER_KV.put(key, typeof data === 'string' ? data : JSON.stringify(data));
    } else {
      console.warn('KV storage not available, data not persisted:', filePath);
    }
  }

  static async readFile(filePath, encoding = 'utf8') {
    if (typeof LUCKSEEKER_KV !== 'undefined') {
      const key = filePath.replace(/[^a-zA-Z0-9-_]/g, '_');
      const data = await LUCKSEEKER_KV.get(key);
      return data || '{}';
    } else {
      console.warn('KV storage not available, returning empty data:', filePath);
      return '{}';
    }
  }

  static async mkdir(dirPath, options = {}) {
    // No-op in Worker environment
    return Promise.resolve();
  }

  static async access(filePath, mode) {
    if (typeof LUCKSEEKER_KV !== 'undefined') {
      const key = filePath.replace(/[^a-zA-Z0-9-_]/g, '_');
      const exists = await LUCKSEEKER_KV.get(key);
      if (!exists) {
        throw new Error('File not found');
      }
    } else {
      throw new Error('KV storage not available');
    }
  }
}

// Worker-compatible path utilities
class WorkerPath {
  static join(...paths) {
    return paths.filter(Boolean).join('/').replace(/\/+/g, '/');
  }

  static dirname(filePath) {
    return filePath.split('/').slice(0, -1).join('/') || '/';
  }

  static basename(filePath) {
    return filePath.split('/').pop() || '';
  }
}
`;

function processFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Apply replacements
    nodeToWorkerReplacements.forEach(([pattern, replacement]) => {
      content = content.replace(pattern, replacement);
    });
    
    // Add Worker utilities at the top
    if (filePath.includes('database.js')) {
      content = workerFSMock + '\n' + content;
    }
    
    // Fix config access for Worker environment
    if (filePath.includes('config/index.js')) {
      content = content.replace(
        /module\.exports = \{/,
        `export default function getConfig(env) {
  return {`
      );
      content = content.replace(/};$/, `  };
}`);
      content = content.replace(/process\.env\./g, 'env.');
    }
    
    return content;
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error.message);
    return '';
  }
}

// Process all files
console.log('Building Cloudflare Worker...');

filesToProcess.forEach(filePath => {
  if (fs.existsSync(filePath)) {
    const content = processFile(filePath);
    const outputPath = path.join('dist', path.basename(filePath));
    fs.writeFileSync(outputPath, content);
    console.log(`✓ Processed: ${filePath} -> ${outputPath}`);
  } else {
    console.warn(`⚠ File not found: ${filePath}`);
  }
});

console.log('Build completed!');
console.log('');
console.log('Next steps:');
console.log('1. Set up your environment variables:');
console.log('   wrangler secret put LINE_CHANNEL_ACCESS_TOKEN');
console.log('   wrangler secret put LINE_CHANNEL_SECRET'); 
console.log('   wrangler secret put LIFF_ID');
console.log('   wrangler secret put OPENAI_API_KEY');
console.log('   wrangler secret put ANTHROPIC_API_KEY');
console.log('');
console.log('2. Deploy to Cloudflare Workers:');
console.log('   wrangler deploy');
console.log('');
console.log('3. Set up KV storage (optional but recommended):');
console.log('   wrangler kv:namespace create "LUCKSEEKER_KV"');
console.log('   wrangler kv:namespace create "LUCKSEEKER_KV" --preview');