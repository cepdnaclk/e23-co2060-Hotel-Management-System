const path = require('node:path');

const normalizeSql = (sql) => String(sql || '').replace(/\s+/g, ' ').trim();

function createResponse() {
  const state = {
    status: 200,
    body: undefined,
    headers: {},
    cookies: [],
  };

  const res = {
    status(code) {
      state.status = code;
      return res;
    },
    json(body) {
      state.body = body;
      return res;
    },
    send(body) {
      state.body = body;
      return res;
    },
    setHeader(name, value) {
      state.headers[String(name).toLowerCase()] = value;
      return res;
    },
    cookie(name, value, options) {
      state.cookies.push({ name, value, options });
      return res;
    },
  };

  return { res, state };
}

function createTransactionPool(handler) {
  const stats = {
    begin: 0,
    commit: 0,
    rollback: 0,
    release: 0,
    calls: [],
  };

  const query = async (sql, params = []) => {
    const normalized = normalizeSql(sql);
    stats.calls.push({ sql: normalized, params });
    return handler(normalized, params, stats);
  };

  const connection = {
    query,
    async beginTransaction() {
      stats.begin += 1;
    },
    async commit() {
      stats.commit += 1;
    },
    async rollback() {
      stats.rollback += 1;
    },
    release() {
      stats.release += 1;
    },
  };

  const pool = {
    query,
    async getConnection() {
      return connection;
    },
  };

  return { pool, connection, stats };
}

function installModule(relativeFromServer, exportsValue) {
  const fullPath = require.resolve(path.resolve(__dirname, '../..', relativeFromServer));
  require.cache[fullPath] = {
    id: fullPath,
    filename: fullPath,
    loaded: true,
    exports: exportsValue,
  };
  return fullPath;
}

function loadController(controllerName, pool, options = {}) {
  installModule('src/config/db.js', pool);

  if (options.mockGuideSchema) {
    installModule('src/services/guideProcessSchema.service.js', {
      ensureGuideProcessSchema: async () => {},
    });
  }

  if (options.mockRoutingClient) {
    installModule('src/utils/routingClient.js', options.mockRoutingClient);
  }

  const controllerPath = require.resolve(
    path.resolve(__dirname, '../..', `src/controllers/${controllerName}`)
  );
  delete require.cache[controllerPath];
  return require(controllerPath);
}

function request({ body = {}, params = {}, query = {}, user = null, headers = {} } = {}) {
  return { body, params, query, user, headers };
}

module.exports = {
  normalizeSql,
  createResponse,
  createTransactionPool,
  installModule,
  loadController,
  request,
};
