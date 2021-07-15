import express from "express"
import createError from "http-errors"
import passport from 'passport'

import UserModel from "./schema.js"
import { JWTAuthMiddleware } from '../../auth/middlewares.js'
import { adminOnly } from '../../auth/admin.js'
import { JWTAuthenticate, refreshTokens } from "../../auth/tools.js"


const usersRouter = express.Router()

usersRouter.post("/register", async (req, res, next) => {
  try {
    const newUser = new UserModel(req.body)
    const { _id } = await newUser.save()

    res.status(201).send({ _id })
  } catch (error) {
    console.log(error)
    if (error.name === "ValidationError") {
      next(createError(400, error))
    } else {
      next(createError(500, "An error occurred while saving user"))
    }
  }
})

usersRouter.get("/", JWTAuthMiddleware, adminOnly, async (req, res, next) => {
  try {
    const users = await UserModel.find()
    res.send(users)
  } catch (error) {
    next(error)
  }
})

usersRouter.get("/me", JWTAuthMiddleware, async (req, res, next) => {
  try {
    res.send(req.user)
  } catch (error) {
    next(error)
  }
})

usersRouter.delete("/me", JWTAuthMiddleware, async (req, res, next) => {
  try {
    await req.user.deleteOne()
  } catch (error) {
    next(error)
  }
})

usersRouter.put("/me", JWTAuthMiddleware, async (req, res, next) => {
  try {
    const user = await UserModel.findByIdAndUpdate(req.user._id, req.body, {
      runValidators: true,
      new: true,
    })
    if (user) {
      res.send(user)
    } else {
      next(createError(404, `User ${req.params.id} not found`))
    }
  } catch (error) {
    console.log(error)
    next(createError(500, "An error occurred while modifying user"))
  }
})

usersRouter.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body
    // 1. Verify credentials
    const user = await UserModel.checkCredentials(email, password)
    if (user) {
      // 2. Generate tokens if credentials are ok
      const { accessToken, refreshToken } = await JWTAuthenticate(user)
      // 3. Send tokens as a response
      res.send({ accessToken, refreshToken })
    } else {
      next(createError(401))
    }
  } catch (error) {
    next(error)
  }
})


usersRouter.post("/refreshToken", async (req, res, next) => {
  try {
    // actual refresh token is coming from req.body

    // 1. Check the validity and integrity of the actual refresh token, if everything is ok we are generating a new pair of access + refresh tokens
    const { newAccessToken, newRefreshToken } = await refreshTokens(req.body.actualRefreshToken)
    // 2. Send back tokens as response

    res.send({ newAccessToken, newRefreshToken })
  } catch (error) {
    next(error)
  }
})

// GOOGLE LOGIN STUFF

usersRouter.get("/googleLogin", passport.authenticate("google", { scope: ["profile", "email"] })) // This endpoint redirects automagically to Google

usersRouter.get("/googleRedirect", passport.authenticate("google"), async (req, res, next) => {
  try {
    res.redirect(`http://localhost:3000?accessToken=${req.user.tokens.accessToken}&refreshToken=${req.user.tokens.refreshToken}`)
  } catch (error) {
    next(error)
  }
})


export default usersRouter
