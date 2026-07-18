---
name: gemini-tool-contract
description: Canonical tool schemas and executor contract for the admin agent (updateSiteContent, fetchLeads, checkProjectStatus, updateProjectStatus). Use when writing or modifying /api/agent, tools.ts, or any Gemini tool-calling code.
---

# Gemini Tool Contract

This skill defines the canonical schemas, executor contracts, and agent loop specifications for the Gemini tool-calling capabilities of the Admin Command Center. Refer to this when writing or modifying `/api/agent`, `tools.ts`, or any code related to agent orchestration.

## 1. Tool Schemas & Executor Contracts

Schemas are defined in `tools.ts` and passed to Gemini's tool-calling configuration. Each schema maps 1:1 to an executor function.

```ts
export const toolSchemas = [
  {
    name: "updateSiteContent",
    description: "Update a specific text or content block within the 3D spatial website.",
    parameters: {
      type: "object",
      properties: {
        section_id: { type: "string" },
        new_content: { type: "string" }
      },
      required: ["section_id", "new_content"]
    }
  },
  {
    name: "fetchLeads",
    description: "Retrieve customer leads.",
    parameters: {
      type: "object",
      properties: {
        status: { type: "string", enum: ["new", "contacted", "converted", "all"] },
        limit: { type: "integer" }
      }
    }
  },
  {
    name: "checkProjectStatus",
    description: "Look up a client project/order status.",
    parameters: {
      type: "object",
      properties: {
        project_id: { type: "string" },
        client_name: { type: "string" }
      }
    }
  },
  {
    name: "updateProjectStatus",
    description: "Update a project's status.",
    parameters: {
      type: "object",
      properties: {
        project_id: { type: "string" },
        new_status: { type: "string", enum: ["received", "in_progress", "review", "completed"] },
        note: { type: "string" }
      },
      required: ["project_id", "new_status"]
    }
  }
];

export const executors: Record<string, (args: any) => Promise<any>> = {
  updateSiteContent: async ({ section_id, new_content }) => {
    return supabase.from("site_content")
      .upsert({ section_id, content: new_content, updated_at: new Date().toISOString() });
  },
  fetchLeads: async ({ status = "all", limit = 10 }) => {
    let q = supabase.from("leads").select("*").order("created_at", { ascending: false }).limit(limit);
    if (status !== "all") q = q.eq("status", status);
    return q;
  },
  checkProjectStatus: async ({ project_id, client_name }) => {
    let q = supabase.from("projects").select("*");
    q = project_id ? q.eq("id", project_id) : q.ilike("client_name", `%${client_name}%`);
    return q;
  },
  updateProjectStatus: async ({ project_id, new_status, note }) => {
    return supabase.from("projects")
      .update({ status: new_status, note, updated_at: new Date().toISOString() })
      .eq("id", project_id);
  }
};
```

## 2. Agent Loop Contract (`/api/agent` route)

1. Receive `{ message: string, history: Message[] }`
2. Call Gemini with `tools: toolSchemas`, full history
3. If response contains a tool call → run matching executor → append tool result to history → call Gemini again for a natural-language confirmation
4. Return `{ reply: string, toolCalls: {name, args, result}[] }` to the client

## 3. API Contracts

### `POST /api/agent` (admin app backend route)

**Request:**
```json
{ "message": "Update the hero heading to say 'Welcome to Hasini Creative'", "history": [] }
```

**Response:**
```json
{
  "reply": "Done — the hero heading now reads 'Welcome to Hasini Creative'.",
  "toolCalls": [
    { "name": "updateSiteContent", "args": { "section_id": "hero_heading", "new_content": "Welcome to Hasini Creative" }, "result": { "status": "ok" } }
  ]
}
```
