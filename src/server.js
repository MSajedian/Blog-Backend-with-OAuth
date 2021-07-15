import express from 'express'
import mongoose from 'mongoose'
import listEndpoints from 'express-list-endpoints'
import passport from 'passport'
import cors from 'cors'
import oauth from './auth/oauth.js'

import usersRouter from './services/users/index.js'
import blogpostsRouter from './services/blogposts/index.js'
import { forbiddenHandler, notFoundErrorHandler, badRequestErrorHandler, catchAllErrorHandler, unAuthorizedHandler } from "./errorHandlers.js"

const server = express()

const port = process.env.PORT

// ******** MIDDLEWARES ************

server.use(express.json())
server.use(passport.initialize())

server.use(cors('http://localhost:3000'))

// ******** ROUTES ************

server.use("/blogposts", blogpostsRouter)
server.use("/users", usersRouter)

// ******** ERROR MIDDLEWARES ************

server.use(badRequestErrorHandler)
server.use(notFoundErrorHandler)
server.use(unAuthorizedHandler)
server.use(forbiddenHandler)
server.use(catchAllErrorHandler)

console.table(listEndpoints(server))

mongoose
  .connect(process.env.MONGO_CONNECTION, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false,
  })
  .then(
    server.listen(port, () => {
      console.log("Server running on port", port)
    })
  )
  .catch(err => console.log("Mongo connection error ", err))
