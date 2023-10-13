const express = require('express')
const cron = require('node-cron')
const cors=require("cors")
const {getTopStoryIds, getAllTopStories, getItem, getComments} = require("./modules/hackernews");
const {data} = require("./modules/data");
const app = express()
const port = process.env.PORT || 5000

let topStoriesHaveBeenFetched = false
let cronJobIsRunning = false

const fetchTopStories = async (ids, compareAgainstState=true, amount=ids.length) => {
  console.log(`Ids for the top stories have been fetched, found ${ids.length} ids\n`)
  const stories = await getAllTopStories(ids, compareAgainstState, amount)

  console.log(data.topStories.length)

  if (data.topStories.length > 0 && compareAgainstState) {
    for (let i = 0; i < amount; i++) {
      // getAllTopStories only returns new stories, so we can pop the old ones
      data.topStories.pop()
    }
  }

  console.log(data.topStories.length)

  stories.forEach(story => {
    data.topStories.push(story) // Add new story
  })
  console.log(data.topStories.length)

  topStoriesHaveBeenFetched = true
  console.log(`Top stories have been updated in state; items stored: ${data.topStories.length}`)
}

const corsOptions = {
  origin:'*',
  credentials:true,
  optionSuccessStatus:200,
}

app.use(cors(corsOptions))
app.use(express.json())
app.listen(port, async () => {
  console.log(`Server listening on port: ${port}`)
  const request = await getTopStoryIds()
  data.topStoryIds = await request.json()

  await fetchTopStories(data.topStoryIds, false, 25)
})

app.get("/", (req, res) => {
  res.send("Hacker Crust API is up and running.")
})

app.post("/comments", async (req, res) => {
  console.log("COMMENTS")
  const comments = await getComments(req.body.ids)
  console.log(comments)
  res.json({comments: comments})
})

app.get("/storyids", async(req, res) => {
  const request = await getTopStoryIds()
  res.send(await request.json())
})

app.get("/topstories", async (req, res) => {
  console.log("Request to /topstories")
  res.send(data.topStories)
})

app.get("/topstories/page/:page/amount/:amount/increaseBy/:increaseBy", async (req, res) => {
  console.log("Request to /topstories")
  console.log(req.params)
  const filters = {
    currentPage: req.params.page,
    amount: req.params.amount,
    increaseBy: req.params.increaseBy
  }

  let stories = []

  let minStoriesToGet = (filters.currentPage - 1) * filters.increaseBy
  const maxStoriesToGet = filters.currentPage * filters.increaseBy

  for (let i = minStoriesToGet; i < maxStoriesToGet; i++) {
    const story = await data.topStories[i]
    story["returnId"] = i
    stories.push(story)
  }

  console.log(`Returning stories ${minStoriesToGet} to ${maxStoriesToGet}.`)
  console.log(`Number of stories: ${stories.length}`)

  res.send(stories)
})

const cronJobMinutes = 10

cron.schedule(`*/${cronJobMinutes} * * * *`, async () => {
  if (topStoriesHaveBeenFetched && !cronJobIsRunning) {
    cronJobIsRunning = true
    console.log("Cron job running.\n Fetching stories...")
    const request = await getTopStoryIds()
    const stories = await request.json()
    if (stories === []) {
      cronJobIsRunning = false
      return
    }

    await fetchTopStories(stories, true)
    cronJobIsRunning = false
  } else {
    console.log(`Original fetch has not ran or Cron job has not finished; retry in ${cronJobMinutes} minute(s).`)
  }
})