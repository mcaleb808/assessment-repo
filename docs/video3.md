# Video 3: Final Pitch

## Audience

Engineering manager and VP of Customer Experience. Mixed technical and business. Frame decisions in plain language; pull up code only for two or three load-bearing files.

## Suggested screen flow

1. Open the live web URL. (intro)
2. Live demo: three customer scenarios. (3 min)
3. Architecture: `docs/arc.md`. (45s)
4. Code: `apps/api/src/agents/prompts.py` then `apps/api/src/routes/agent.py`. (90s)
5. Honest assessment: read off the script. (1 min)
6. Recommendation. (30s)

Total target: 6 to 7 minutes.

## Script

### Opening

I'm Caleb. This is the prototype customer support chatbot for Meridian Electronics. Let me show you what it does, walk you through the most important decisions, and give you my honest read on whether it's ready to move forward.

### Live demo

I'll run three real scenarios.

**Scenario 1: a customer browsing.**
[Type: "Do you have any monitors in stock?"]
The agent calls one tool against the MCP server, gets back the live inventory, and responds in plain English. No auth needed, this is public information.

**Scenario 2: a returning customer who wants to see their orders.**
[Type: "Show me my recent orders."]
Notice what the agent does NOT do here. It does not call any order tool. It asks for the customer's email and PIN. That's the security gate. Before any customer-specific data flows, the agent must authenticate.

[Reply with: "jason31@example.com, PIN 1434"]
Now the agent calls verify_customer_pin, gets back the customer record, and uses that customer ID to call list_orders. You can see the tool calls happen live; that's both a good demo and a debugging surface for engineering.

**Scenario 3: order placement.**
[Type: "I'd like to buy 2 of MON-0054"]
Agent confirms price, quantity, and total before placing. The customer has to say yes. Only then does it call create_order.

### Architecture

[Show docs/arc.md]

Five components. The customer talks to a Next.js chat UI on Cloud Run. The UI calls a FastAPI backend, also on Cloud Run, which runs the OpenAI Agents SDK. The agent uses GPT-4o-mini, chosen for cost; this matters because the business case dies if per-conversation cost is high. The agent talks to Meridian's MCP server over Streamable HTTP, which is the current MCP spec.

Two services, not bundled. Either can scale independently. Both deploy through GitHub Actions over Workload Identity Federation, so there are no service account keys checked into the repo.

### Code: the security decision

[Open apps/api/src/agents/prompts.py]

The most consequential decision in this codebase is right here in the system prompt. The agent has tools that can read orders, place orders, and look up customer data. None of those should run without authentication. I enforce that as three rules in the system prompt: never call an order tool until verify_customer_pin has run successfully in this conversation; never accept a customer ID supplied by the user, only use the one returned by the verification call; never echo the PIN back.

This is prompt-driven security, not infrastructure security. It works; I tested it with wrong PINs, with attempts to supply customer IDs, with PIN echo prompts. It holds up. But I'll come back to its limits.

[Open apps/api/src/routes/agent.py]

Two endpoints. Chat returns the full reply once the agent is done. Stream returns server-sent events as tool calls happen, which is what the UI uses. Both take a message history; the chat is stateless on the server side, the client holds the history. That's deliberate: any Cloud Run instance can serve any turn, no sticky sessions, no Redis to provision.

### Honest assessment

What works well: the auth gate is reliable in my tests, the streaming UX makes the agent's reasoning visible to both the customer and engineering, the architecture is production-shaped with infrastructure-as-code, secret management, and CI that is keyless.

What does not work yet: there is no persistent conversation store, so a page reload starts over. There is no rate limiting, so a hostile user could run up our OpenAI bill. The security gate is in the system prompt, which is well-engineered but not a substitute for an enforcement layer in code. And there is no human handoff; if the agent gets stuck, the customer has no way out except to call.

What I would do with more time: first, move the auth check out of the prompt and into a middleware that signs the customer ID after PIN verification, so the agent literally cannot call an order tool with an unsigned ID. Second, add a session store, probably Firestore. Third, add per-IP rate limiting. Fourth, wire a "talk to a human" fallback so the support team owns escalations.

### Recommendation

I would not flip this to all customers tomorrow. But I would put it in front of a small pilot group on read-only flows, product browsing and order status only, while engineering hardens the auth layer. That gives Customer Experience real data on deflection rate, customer satisfaction, and where the agent struggles. The architecture is sound; the security needs one more layer before we let it write to the order system at scale.

Three hours, real MCP server, working prototype. Ready for questions.
