// Worker polyfills for Node.js compatibility

// Worker-compatible file system using KV storage
export class WorkerFS {
  static async writeFile(filePath, data, options = {}) {
    if (typeof LUCKSEEKER_KV !== 'undefined') {
      const key = filePath.replace(/[^a-zA-Z0-9-_]/g, '_');
      const content = typeof data === 'string' ? data : JSON.stringify(data);
      await LUCKSEEKER_KV.put(key, content);
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
export class WorkerPath {
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

// Create mock environment for config
export function createMockEnv(env) {
  return {
    line: {
      channelAccessToken: env.LINE_CHANNEL_ACCESS_TOKEN,
      channelSecret: env.LINE_CHANNEL_SECRET,
      liffId: env.LIFF_ID
    },
    ai: {
      openaiApiKey: env.OPENAI_API_KEY,
      anthropicApiKey: env.ANTHROPIC_API_KEY,
      ollamaBaseUrl: env.OLLAMA_BASE_URL || 'http://localhost:11434',
      ollamaModel: env.OLLAMA_MODEL || 'gemma3'
    },
    swisseph: {
      ephePath: env.SWISSEPH_EPHE_PATH || './ephe'
    },
    server: {
      port: env.PORT || 8787,
      nodeEnv: env.NODE_ENV || 'production'
    },
    quota: {
      defaultQueries: 10
    }
  };
}