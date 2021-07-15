import express from "express"
import createError from "http-errors"
import { JWTAuthMiddleware } from '../../auth/middlewares.js'
import { adminOnly } from '../../auth/admin.js'
import BlogpostModel from "./schema.js"

const blogpostsRouter = express.Router()

blogpostsRouter.get("/", JWTAuthMiddleware, adminOnly, async (req, res, next) => {
  try {
    const blogposts = await BlogpostModel.find().populate("users")
    res.send(blogposts)
  } catch (error) {
    console.log(error)
    next(createError(500, "An error occurred while getting blogposts"))
  }
})

blogpostsRouter.get("/me/stories", JWTAuthMiddleware, async (req, res, next) => {
  try {
    console.log('req.user._id:', req.user._id)
    const blogposts = await BlogpostModel.find({ users: req.user._id.toString() }).populate("users")
    res.send(blogposts)
  } catch (error) {
    console.log(error)
    next(createError(500, "An error occurred while getting blogposts"))
  }
})

blogpostsRouter.post("/", JWTAuthMiddleware, async (req, res, next) => {
  try {
    const newBlogpost = new BlogpostModel(req.body)
    const { _id } = await newBlogpost.save()

    res.status(201).send(_id)
  } catch (error) {
    console.log(error.message);
    next(error)
  }
})

blogpostsRouter.get("/:id", JWTAuthMiddleware, async (req, res, next) => {
  try {
    const id = req.params.id
    const blogpost = await BlogpostModel.findById(id).populate("users")
    if (blogpost) {
      res.send(blogpost)
    } else {
      next(createError(404, `Blogpost ${req.params.id} not found`))
    }
  } catch (error) {
    console.log(error)
    next(createError(500, "An error occurred while getting blogpost"))
  }
})

blogpostsRouter.put("/:id", JWTAuthMiddleware, async (req, res, next) => {
  try {
    const blogpost = await BlogpostModel.findByIdAndUpdate(req.params.id, req.body, {
      runValidators: true,
      new: true,
    })
    if (blogpost) {
      res.send(blogpost)
    } else {
      next(createError(404, `Blogpost ${req.params.id} not found`))
    }
  } catch (error) {
    console.log(error)
    next(createError(500, "An error occurred while modifying blogpost"))
  }
})

blogpostsRouter.delete("/:id", JWTAuthMiddleware, async (req, res, next) => {
  try {
    const blogpost = await BlogpostModel.findByIdAndDelete(req.params.id)
    if (blogpost) {
      res.status(204).send()
    } else {
      next(createError(404, `Blogpost with ID ${req.params.id} not found`))
    }
  } catch (error) {
    console.log(error)
    next(createError(500, "An error occurred while deleting blogpost"))
  }
})

// *********************************************************************
// *************************** COMMENTS PART ***************************
// *********************************************************************

// blogpostsRouter.get("/:id/comments/", async (req, res, next) => {
//   try {
//     const blogpost = await BlogpostModel.findById(req.params.id, {
//       comments: 1,
//       _id: 0,
//     })
//     if (blogpost) {
//       res.send(blogpost.comments)
//     } else {
//       next(createError(404, `Blogpost ${req.params.id} not found`))
//     }
//   } catch (error) {
//     console.log(error)
//     next(createError(500, "An error occurred while deleting blogpost"))
//   }
// })

// blogpostsRouter.get("/:id/comments/:commentId", async (req, res, next) => {
//   try {
//     const blogpost = await BlogpostModel.findOne(
//       {
//         _id: req.params.id,
//       },
//       {
//         comments: {
//           $elemMatch: { _id: req.params.commentId },
//         },
//       }
//     )
//     if (blogpost) {
//       const { comments } = blogpost
//       if (comments && comments.length > 0) {
//         res.send(comments[0])
//       } else {
//         next(createError(404, `Comment ${req.params.commentId} not found`))
//       }
//     } else {
//       next(createError(404, `Blogpost ${req.params.id} not found`))
//     }
//   } catch (error) {
//     console.log(error)
//     next(createError(500, "An error occurred while deleting blogpost"))
//   }
// })

// blogpostsRouter.post("/:id/comments/", async (req, res, next) => {
//   try {
//     const blogpost = await BlogpostModel.findById(req.params.id, {
//       comments: 1,
//       _id: 0,
//     })

//     if (req.body) {
//       const commentToInsert = { ...req.body, date: new Date() }
//       const updatedBlogpost = await BlogpostModel.findByIdAndUpdate(
//         req.params.id,
//         {
//           $push: {
//             comments: commentToInsert,
//           },
//         },
//         { runValidators: true, new: true }
//       )
//       if (updatedBlogpost) {
//         res.send(updatedBlogpost.comments)
//       } else {
//         next(createError(404, `Blogpost ${req.params.id} not found`))
//       }
//     } else {
//       next(createError(404, `Comment ${req.body.commentId} not found`))
//     }
//   } catch (error) {
//     console.log(error)
//     next(createError(500, "An error occurred while deleting blogpost"))
//   }
// })

// blogpostsRouter.delete("/:id/comments/:commentId", async (req, res, next) => {
//   try {
//     const blogpost = await BlogpostModel.findByIdAndUpdate(
//       req.params.id,
//       {
//         $pull: {
//           comments: { _id: req.params.commentId },
//         },
//       },
//       {
//         new: true,
//       }
//     )
//     if (blogpost) {
//       res.send(blogpost.comments)
//     } else {
//       next(createError(404, `Blogpost ${req.params.id} not found`))
//     }
//   } catch (error) {
//     console.log(error)
//     next(createError(500, "An error occurred while deleting blogpost"))
//   }
// })

// blogpostsRouter.put("/:id/comments/:commentId", async (req, res, next) => {
//   try {
//     const blogpost = await BlogpostModel.findOneAndUpdate(
//       {
//         _id: req.params.id,
//         "comments._id": req.params.commentId,
//       },
//       {
//         $set: {
//           "comments.$._id": req.params.commentId,
//           "comments.$.comment": req.body.comment,
//           "comments.$.rate": req.body.rate,
//           "comments.$.date": new Date()
//         }
//       },
//       {
//         runValidators: true,
//         new: true,
//       }
//     )
//     if (blogpost) {
//       res.send(blogpost.comments)
//     } else {
//       next(createError(404, `Blogpost ${req.params.id} not found`))
//     }
//   } catch (error) {
//     console.log(error)
//     next(createError(500, "An error occurred while deleting blogpost"))
//   }
// })


export default blogpostsRouter
