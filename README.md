# @pipeworx/usda-fdc

USDA Food Data Central MCP — comprehensive nutrient database for US foods (~600k items across SR Legacy, Foundation, Survey, Branded, Experimental data types).

Part of [Pipeworx](https://pipeworx.io) — an MCP gateway connecting AI agents to 1394+ live data sources.

## Tools

- `search_foods(query, data_type?, page_size?, page_number?, sort_by?, sort_order?, brand_owner?)`
- `get_food(fdc_id, format?, nutrients?)` — single-food detail
- `list_foods(data_type?, page_size?, page_number?, sort_by?, sort_order?)` — browse
- `list_food_groups()` — USDA food group reference
- `nutrients_for_food(fdc_id, nutrient_numbers?)` — convenience: just the nutrient values

## Auth

- **Platform key:** gateway env `PLATFORM_USDA_FDC_KEY`
- **BYO:** `?_apiKey=<key>` after registering at https://api.data.gov/signup/

Free tier: 1000 req/hour.

## Data source

`https://api.nal.usda.gov/fdc/v1/` — `api_key=` query param.

## Quick Start

Add to your MCP client (Claude Desktop, Cursor, Windsurf, etc.):

```json
{
  "mcpServers": {
    "usda-fdc": {
      "url": "https://gateway.pipeworx.io/usda-fdc/mcp"
    }
  }
}
```

Or connect to the full Pipeworx gateway for access to all 1394+ data sources:

```json
{
  "mcpServers": {
    "pipeworx": {
      "url": "https://gateway.pipeworx.io/mcp"
    }
  }
}
```

## Using with ask_pipeworx

Instead of calling tools directly, you can ask questions in plain English:

```
ask_pipeworx({ question: "your question about Usda Fdc data" })
```

The gateway picks the right tool and fills the arguments automatically.

## More

- [Docs and guides](https://pipeworx.io/docs)
- [pipeworx.io](https://pipeworx.io)

## License

MIT
