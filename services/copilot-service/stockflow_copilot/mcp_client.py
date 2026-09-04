from contextlib import AsyncExitStack
from dataclasses import dataclass
from typing import Any
from mcp import ClientSession
from mcp.client.streamable_http import streamable_http_client


@dataclass
class ConnectedMCP:
    name: str
    session: ClientSession
    tools: list[Any]

    @property
    def tool_names(self) -> list[str]:
        return [tool.name for tool in self.tools]


class MCPHub:
    def __init__(self, servers: dict[str, str]):
        self.servers = servers
        self.stack = AsyncExitStack()
        self.connections: list[ConnectedMCP] = []

    async def connect(self) -> None:
        for name, url in self.servers.items():
            read_stream, write_stream, _ = await self.stack.enter_async_context(streamable_http_client(url))
            session = await self.stack.enter_async_context(ClientSession(read_stream, write_stream))
            await session.initialize()
            tools = await session.list_tools()
            self.connections.append(ConnectedMCP(name, session, list(tools.tools)))

    async def close(self) -> None:
        await self.stack.aclose()

    @property
    def sessions(self) -> list[ClientSession]:
        return [item.session for item in self.connections]

    @property
    def tool_names(self) -> list[str]:
        return [tool for item in self.connections for tool in item.tool_names]

    @property
    def tool_catalogue(self) -> list[dict[str, Any]]:
        """Return MCP metadata used to declare allow-listed Gemini functions."""
        catalogue: list[dict[str, Any]] = []
        for connection in self.connections:
            for tool in connection.tools:
                input_schema = getattr(tool, "inputSchema", None)
                if input_schema is None:
                    input_schema = getattr(tool, "input_schema", None)
                catalogue.append({
                    "server": connection.name,
                    "name": tool.name,
                    "description": getattr(tool, "description", "") or "",
                    "inputSchema": input_schema or {"type": "object", "properties": {}},
                })
        return catalogue

    async def call_tool(self, tool_name: str, arguments: dict):
        for connection in self.connections:
            if tool_name in connection.tool_names:
                return await connection.session.call_tool(tool_name, arguments=arguments)
        raise LookupError(f"MCP tool is not connected: {tool_name}")
