import * as redis from 'redis'
import express from 'express'
import http from 'http'
import { Server as SocketIOServer } from 'socket.io'

const app = express()
const server = http.createServer(app)
const io = new SocketIOServer(server)

const redisClient = redis.createClient();
(async () => {
  await redisClient.connect()
})()

redisClient.on('connect', () => {
  console.log('Connected to Redis')
})

redisClient.on('error', (err: any) => {
  console.log(`Redis error: ${err}`)
})

io.on('connection', (socket: any) => {
  console.log(`Player connected: ${socket.id}`)

  // Join the game
  socket.on('join', async (player: any) => {
    // Save player state in Redis
    await redisClient.hSet('players:data', socket.id, JSON.stringify(player))
    // Broadcast new player to others
    socket.broadcast.emit('newPlayer', player)

    // Send existing players to the newly joined player
    const playerData = await redisClient.hGetAll('players:data')
    console.log(playerData)

    const existingPlayers = Object.values(playerData).map((playerData: any) => JSON.parse(playerData))

    // Emit existing players to the newly joined player
    socket.emit('existingPlayers', existingPlayers)
  })

  // Handle player interaction or game events
  socket.on('gameEvent', (data) => {
    // Handle game events here
    // You can use Redis for managing game state, events, and interactions
  })

  // Handle player disconnect
  socket.on('disconnect', () => {
    console.log(`Player disconnected: ${socket.id}`)
    redisClient.hDel('players:data', socket.id)
    socket.broadcast.emit('playerLeft', socket.id)
  })
})

server.listen(3000, () => {
  console.log('Server is running on port 3000')
})
