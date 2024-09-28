import "dotenv/config"
import {PostgresStorageAdapter} from "automerge-repo-storage-postgres"
import {NodeWSServerAdapter} from "@automerge/automerge-repo-network-websocket"
import {Repo} from "@automerge/automerge-repo"
import express from "express"
import ws from "express-ws"
import cors from "cors"

const exws = ws(express())
const srv = exws.app
const websocket = exws.getWss()
srv.ws("/", () => {})
srv.use(express.static("public"))
srv.use(cors())

const repo = new Repo({
	network: [new NodeWSServerAdapter(websocket)],
	storage: new PostgresStorageAdapter("starlight"),
	peerId: /** @type {import("@automerge/automerge-repo").PeerId} */ (
		process.env.PEER_ID || "starlight"
	),
	sharePolicy: async () => false,
})

srv.get("/metrics.json", (request, response) => response.send(repo.metrics()))

repo.addListener("document", payload => {
	console.info("document!", payload.handle.url)
})

const port = process.env.PORT || "11128"

srv.listen(+port)

export default repo
