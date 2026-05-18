import { fromHono } from "chanfana";
import { Hono } from "hono";
import { InteractionType, InteractionResponseType, verifyKey } from 'discord-interactions'

const app = new Hono<{ Bindings: Env }>();

const openapi = fromHono(app, {
	docs_url: "/",
});

openapi.post('/api/interactions', async (c) => {
	const signature = c.req.header('X-Signature-Ed25519')
  	const timestamp = c.req.header('X-Signature-Timestamp')
	const DISCORD_PUBLIC_KEY = c.req.query("p")
	if (!DISCORD_PUBLIC_KEY) {
		return c.text("Bad Request", 400)
	}

	const body = await c.req.text()

	const isValidRequest = signature && timestamp && await verifyKey(body, signature, timestamp, DISCORD_PUBLIC_KEY)
	if (!isValidRequest) {
		return c.text('Invalid request signature', 401)
	}

	const interaction = JSON.parse(body)
	if (interaction.type === InteractionType.PING) {
		return c.json({
			type: InteractionResponseType.PONG,
		})
	}
	if (interaction.type === InteractionType.APPLICATION_COMMAND) {
		const { name } = interaction.data

		if (name === '起動') {
			return c.json({
				type: InteractionResponseType.LAUNCH_ACTIVITY
			})
		}
	}
	return c.json({ error: 'Unknown interaction type' }, 400)
})

export default app;
