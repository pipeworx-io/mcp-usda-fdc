# mcp-usda-fdc

USDA Food Data Central MCP

Part of [Pipeworx](https://pipeworx.io) — an MCP gateway connecting AI agents to 250+ live data sources.

## Tools

| Tool | Description |
|------|-------------|
| `search_foods` | Search USDA FDC food items. |
| `get_food` | Full food record by FDC id. |
| `list_foods` | Paginated browse of FDC foods. |
| `list_food_groups` | USDA food group reference (categories). |
| `nutrients_for_food` | Convenience: nutrient values only for a food. |

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

Or connect to the full Pipeworx gateway for access to all 250+ data sources:

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

- [All tools and guides](https://github.com/pipeworx-io/examples)
- [pipeworx.io](https://pipeworx.io)

## License

MIT
