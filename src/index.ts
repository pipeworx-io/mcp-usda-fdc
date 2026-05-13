interface McpToolDefinition {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, unknown>;
    required?: string[];
  };
}

interface McpToolExport {
  tools: McpToolDefinition[];
  callTool: (name: string, args: Record<string, unknown>) => Promise<unknown>;
  meter?: { credits: number };
  cost?: Record<string, unknown>;
  provider?: string;
}

/**
 * USDA Food Data Central MCP
 *
 * Auth: ?api_key= query (sign up for free at api.data.gov).
 * Docs: https://fdc.nal.usda.gov/api-guide
 */


const BASE = 'https://api.nal.usda.gov/fdc/v1';

const DATA_TYPES = 'Branded | Foundation | Survey (FNDDS) | SR Legacy | Experimental';

const tools: McpToolExport['tools'] = [
  {
    name: 'search_foods',
    description: 'Search USDA FDC food items.',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Free-text — name / brand / ingredient' },
        data_type: { type: 'string', description: `Filter to data type(s). Comma-sep. Options: ${DATA_TYPES}` },
        brand_owner: { type: 'string', description: 'Restrict to a brand owner' },
        page_size: { type: 'number', description: '1-200 (default 50)' },
        page_number: { type: 'number', description: '1-based page (default 1)' },
        sort_by: {
          type: 'string',
          description: 'dataType.keyword | lowercaseDescription.keyword | fdcId | publishedDate (default relevance)',
        },
        sort_order: { type: 'string', description: 'asc | desc' },
      },
      required: ['query'],
    },
  },
  {
    name: 'get_food',
    description: 'Full food record by FDC id.',
    inputSchema: {
      type: 'object',
      properties: {
        fdc_id: { type: 'number', description: 'FDC id (e.g. 1102704)' },
        format: { type: 'string', description: 'abridged | full (default full)' },
        nutrients: { type: 'string', description: 'Comma-sep nutrient numbers to restrict response' },
      },
      required: ['fdc_id'],
    },
  },
  {
    name: 'list_foods',
    description: 'Paginated browse of FDC foods.',
    inputSchema: {
      type: 'object',
      properties: {
        data_type: { type: 'string', description: `Filter to data type(s). Options: ${DATA_TYPES}` },
        page_size: { type: 'number', description: '1-200 (default 50)' },
        page_number: { type: 'number', description: '1-based page' },
        sort_by: { type: 'string' },
        sort_order: { type: 'string' },
      },
    },
  },
  {
    name: 'list_food_groups',
    description: 'USDA food group reference (categories).',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'nutrients_for_food',
    description: 'Convenience: nutrient values only for a food.',
    inputSchema: {
      type: 'object',
      properties: {
        fdc_id: { type: 'number' },
        nutrient_numbers: { type: 'string', description: 'Comma-sep nutrient numbers (e.g. "208,205")' },
      },
      required: ['fdc_id'],
    },
  },
];

async function callTool(name: string, args: Record<string, unknown>): Promise<unknown> {
  const apiKey = (args._apiKey as string | undefined)?.trim();
  if (!apiKey) {
    throw new Error(
      'USDA FDC requires an API key. Contact the operator about platform credentials, or BYO via ?_apiKey=<key> after registering at https://api.data.gov/signup/.',
    );
  }
  switch (name) {
    case 'search_foods': {
      const params = new URLSearchParams({
        api_key: apiKey,
        query: reqStr(args, 'query', '"apple"'),
        pageSize: String(Math.min(200, Math.max(1, (args.page_size as number) ?? 50))),
        pageNumber: String(Math.max(1, (args.page_number as number) ?? 1)),
      });
      if (args.data_type) params.set('dataType', String(args.data_type));
      if (args.brand_owner) params.set('brandOwner', String(args.brand_owner));
      if (args.sort_by) params.set('sortBy', String(args.sort_by));
      if (args.sort_order) params.set('sortOrder', String(args.sort_order));
      return fdcGet(`/foods/search?${params}`);
    }
    case 'get_food': {
      const id = reqNum(args, 'fdc_id', '1102704');
      const params = new URLSearchParams({
        api_key: apiKey,
        format: String(args.format ?? 'full'),
      });
      if (args.nutrients) params.set('nutrients', String(args.nutrients));
      return fdcGet(`/food/${id}?${params}`);
    }
    case 'list_foods': {
      const params = new URLSearchParams({
        api_key: apiKey,
        pageSize: String(Math.min(200, Math.max(1, (args.page_size as number) ?? 50))),
        pageNumber: String(Math.max(1, (args.page_number as number) ?? 1)),
      });
      if (args.data_type) params.set('dataType', String(args.data_type));
      if (args.sort_by) params.set('sortBy', String(args.sort_by));
      if (args.sort_order) params.set('sortOrder', String(args.sort_order));
      return fdcGet(`/foods/list?${params}`);
    }
    case 'list_food_groups':
      return fdcGet(`/foods/list?api_key=${encodeURIComponent(apiKey)}&pageSize=1&dataType=SR%20Legacy`).then(() => ({
        // The FDC API doesn't expose a dedicated /food-groups endpoint; we
        // surface the canonical list from the published WWEIA categories.
        note: 'Food groups come from the WWEIA category list — see https://fdc.nal.usda.gov/portal-data/wweia for the full reference.',
        wweia_categories_url: 'https://fdc.nal.usda.gov/portal-data/wweia',
      }));
    case 'nutrients_for_food': {
      const id = reqNum(args, 'fdc_id', '1102704');
      const params = new URLSearchParams({
        api_key: apiKey,
        format: 'full',
      });
      if (args.nutrient_numbers) params.set('nutrients', String(args.nutrient_numbers));
      const data = (await fdcGet(`/food/${id}?${params}`)) as {
        fdcId?: number;
        description?: string;
        foodNutrients?: { nutrient?: { name?: string; number?: string; unitName?: string }; amount?: number }[];
      };
      return {
        fdc_id: data.fdcId,
        description: data.description,
        nutrients: (data.foodNutrients ?? [])
          .filter((n) => n.amount !== undefined)
          .map((n) => ({
            name: n.nutrient?.name,
            number: n.nutrient?.number,
            amount: n.amount,
            unit: n.nutrient?.unitName,
          })),
      };
    }
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

async function fdcGet(path: string) {
  const res = await fetch(`${BASE}${path}`, { headers: { Accept: 'application/json' } });
  if (res.status === 401 || res.status === 403) throw new Error('USDA FDC: unauthorized — check key');
  if (res.status === 404) throw new Error('USDA FDC: not found');
  if (res.status === 429) throw new Error('USDA FDC: rate-limit (HTTP 429)');
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`USDA FDC error: ${res.status} ${t.slice(0, 200)}`);
  }
  return res.json();
}

function reqStr(args: Record<string, unknown>, key: string, example: string): string {
  const v = args[key];
  if (typeof v !== 'string' || !v.trim()) {
    throw new Error(`Required argument "${key}" is missing. Pass a string like ${example}.`);
  }
  return v;
}
function reqNum(args: Record<string, unknown>, key: string, example: string): number {
  const v = args[key];
  if (typeof v !== 'number' || !Number.isFinite(v)) {
    throw new Error(`Required argument "${key}" must be a number. Example: ${example}.`);
  }
  return v;
}

export default { tools, callTool, meter: { credits: 1 } } satisfies McpToolExport;
