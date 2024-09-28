import {PostgresStorageAdapter} from "automerge-repo-storage-postgres"
import {NodeWSServerAdapter} from "@automerge/automerge-repo-network-websocket"
import {Repo} from "@automerge/automerge-repo"
import express from "express"
import ws from "express-ws"
import cors from "cors"

let exws = ws(express())
let srv = exws.app
let websocket = exws.getWss()
srv.ws("/", () => {})
srv.use(express.static("public"))
srv.use(cors())

console.info("setting up repo")
let repo = new Repo({
	network: [new NodeWSServerAdapter(websocket)],
	storage: new PostgresStorageAdapter("automerge"),
	peerId: /** @type {import("@automerge/automerge-repo").PeerId} */ (
		process.env.PEER_ID || "nightlight"
	),
	sharePolicy: async () => false,
})

repo.addListener("document", payload => {
	console.info("document!", payload.handle.url)
})

console.info(`gonna listen on ${process.env.PORT}`)
srv
	.listen(Number.parseInt(process.env.PORT || "11124"))
	.addListener("connect", payload => {
		console.info("connect", payload.statusCode)
	})
	.addListener("connection", payload =>
		console.info("connection", payload.address())
	)
	.addListener("error", payload => {
		console.error("something went wrongly", payload.message)
	})
	.addListener("listening", () => {
		console.info("i am listening")
	})
