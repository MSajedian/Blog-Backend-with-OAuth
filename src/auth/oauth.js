import passport from 'passport'
import GoogleStrategy from 'passport-google-oauth20'

import UserModel from '../services/users/schema.js'
import {JWTAuthenticate} from '../auth/tools.js'

passport.use("google", new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_SECRET,
  callbackURL: "http://localhost:3001/users/googleRedirect"
}, async (accessToken, refreshToken, profile, passportNext) => { // this function will be executed when we got a response back from Google
  try {
    console.log(profile)
    // when we receive the profile we are going to check if it is an existant user in our db, if it is not we are going to create a new record
    const user = await UserModel.findOne({googleId: profile.id})

    if(user){ // if the user is already in the db, I'm creating for him a pair of tokens
      const tokens = await JWTAuthenticate(user)
      passportNext(null, { user, tokens})
    } else { // if the user is not in the db, I'm creating a new record for him, then I'm creating a pair of tokens
      const newUser = {
        name: profile.name.givenName,
        surname: profile.name.familyName,
        email: profile.emails[0].value,
        role: "User",
        googleId: profile.id
      }

      const createdUser = new UserModel(newUser)

      const savedUser = await createdUser.save()

      const tokens = await JWTAuthenticate(savedUser)
      passportNext(null, {  user: savedUser, tokens})
    }

  } catch (error) {
    passportNext(error)
  }

}
))

passport.serializeUser(function (user, passportNext) { // this is for req.user
  
  passportNext(null, user)
})


// passport.use("facebook")

export default {}