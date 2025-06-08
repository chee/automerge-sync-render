import "dotenv/config"
import {PostgresStorageAdapter} from "automerge-repo-storage-postgres"
import {isValidDocumentId, Repo} from "@automerge/vanillajs"
import {WebSocketServerAdapter} from "@automerge/automerge-repo-network-websocket"

import express from "express"
import ws from "express-ws"
import cors from "cors"

const ex = express()
const exws = ws(ex)
const app = exws.app
const websocket = exws.getWss()
app.ws("/", () => {})
app.use(express.static("public"))
app.use(cors())

const repo = new Repo({
	network: [new WebSocketServerAdapter(/** @type {any} */ (websocket))],
	storage: new PostgresStorageAdapter(
		process.env.AUTOMERGE_TABLE ?? "starlight"
	),
	peerId: /** @type {import("@automerge/vanillajs").PeerId} */ (
		process.env.AUTOMERGE_PEER_ID || "starlight"
	),
	sharePolicy: async () => false,
})

app.get("/metrics.json", (request, response) => {
	if (request.query.secret == process.env.METRICS_SECRET) {
		response.json(repo.metrics())
	} else {
		response.status(403).send('{"sorry": "baby", "bad": "secret}')
	}
})

app.get("/document/:id", async (request, response) => {
	const contentType = request.query["content-type"] ?? "application/json"
	if (isValidDocumentId(request.params.id)) {
		const handle = await repo.find(request.params.id)
		if (handle) {
			if (typeof contentType == "string") {
				response.setHeader("content-type", contentType)
			} else {
				response.setHeader("content-type", contentType[0])
			}
			response.send(handle.doc())
		} else {
			response.status(404).send("notnone")
		}
	}
})

repo.addListener("document", payload => {
	console.info("document!", payload.handle.url)
})

const port = process.env.PORT || "11128"

const srv = app.listen(+port)

export default repo
