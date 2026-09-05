import json

path = '/Users/aneekdutta/.gemini/config/mcp_config.json'
with open(path, 'r') as f:
    config = json.load(f)

if 'mcpServers' not in config:
    config['mcpServers'] = {}

config['mcpServers']['vercel'] = {
    "serverUrl": "https://mcp.vercel.com"
}

with open(path, 'w') as f:
    json.dump(config, f, indent=2)
