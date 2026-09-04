from types import SimpleNamespace
import unittest

from google.genai import types

from stockflow_copilot.gemini_mcp_agent import GeminiMCPAgent


class _FakeModels:
    def __init__(self, responses):
        self.responses = list(responses)

    async def generate_content(self, **_kwargs):
        return self.responses.pop(0)


class GeminiMCPAgentTests(unittest.IsolatedAsyncioTestCase):
    async def test_selects_read_only_tool_and_injects_auth_context(self):
        function_call = types.FunctionCall(name="get_current_inventory", args={})
        first = SimpleNamespace(
            function_calls=[function_call],
            candidates=[SimpleNamespace(content=types.Content(
                role="model",
                parts=[types.Part.from_function_call(name=function_call.name, args=function_call.args)],
            ))],
            text=None,
        )
        second = SimpleNamespace(
            function_calls=[],
            candidates=[SimpleNamespace(content=types.Content(
                role="model",
                parts=[types.Part.from_text(text="There are 120 usable units.")],
            ))],
            text="There are 120 usable units.",
        )
        agent = GeminiMCPAgent("", "gemini-test")
        agent.client = SimpleNamespace(aio=SimpleNamespace(models=_FakeModels([first, second])))
        catalogue = [{
            "server": "stockflow_data",
            "name": "get_current_inventory",
            "description": "Returns current inventory.",
            "inputSchema": {
                "type": "object",
                "properties": {
                    "warehouse_id": {"type": "string"},
                    "tenant_id": {"type": "string"},
                    "access_token": {"type": "string"},
                },
            },
        }]
        received = {}

        async def call_tool(name, arguments):
            received.update({"name": name, "arguments": arguments})
            return SimpleNamespace(structuredContent={"result": [{"usableQuantity": 120}]})

        answer = await agent.answer(
            "What's left?",
            catalogue,
            call_tool,
            tenant_id="TEN-1",
            access_token="signed-token",
            selected_warehouse_id="WH-1",
        )

        self.assertIsNotNone(answer)
        self.assertEqual(answer.answer, "There are 120 usable units.")
        self.assertEqual(answer.tools_used, ["get_current_inventory"])
        self.assertEqual(received["name"], "get_current_inventory")
        self.assertEqual(received["arguments"]["tenant_id"], "TEN-1")
        self.assertEqual(received["arguments"]["access_token"], "signed-token")
        self.assertEqual(received["arguments"]["warehouse_id"], "WH-1")

    def test_never_declares_mutating_or_domain_fallback_tools(self):
        agent = GeminiMCPAgent("", "gemini-test")
        _, allowed = agent._declarations([
            {"server": "data", "name": "answer_stockflow_question", "description": "fallback", "inputSchema": {"type": "object"}},
            {"server": "action", "name": "approve_proposal", "description": "mutation", "inputSchema": {"type": "object"}},
            {"server": "data", "name": "search_products", "description": "read", "inputSchema": {"type": "object"}},
        ])
        self.assertEqual(set(allowed), {"search_products"})


if __name__ == "__main__":
    unittest.main()
