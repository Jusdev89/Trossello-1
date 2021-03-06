import express from 'express'
import github from './github'
import { queries, commands } from './database'
const router = express.Router()

router.get('/login_via_github', (request, response) => {
  if (!request.session.redirectToAfterLogin) {
    request.session.redirectToAfterLogin= request.header('Referer')
  }
  response.redirect(github.authorizeURL(request))
})

router.get('/oauth_callback', (request, response, next) => {
  github.authorize(request)
    .then(githubProfile => {
      return commands.findOrCreateUserFromGithubProfile(githubProfile)
    })
    .then(currentUser => {
      request.session.userId = currentUser.id
      response.redirect(request.session.redirectToAfterLogin || '/')
      delete request.session.redirectToAfterLogin
    })
    .catch(next)
});

router.post('/logout', (request, response, next) => {
  request.session = null
  response.json({})
})


router.get('/session', (request, response) => {
  if (!request.session.userId) return response.json({})
  queries.getUserById(request.session.userId)
    .then(user => {
      response.json({
        user: user
      })
    })
});


export default router
