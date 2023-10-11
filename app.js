const express = require('express')
const cron = require('node-cron')
const cors=require("cors")
const {getTopStoryIds, getNumberOfStories, getAllTopStories} = require("./modules/hackernews");
const {data} = require("./modules/data");
const app = express()
const port = process.env.PORT || 5000

let topStoriesHaveBeenFetched = false

const fetchTopStories = async () => {
  topStoriesHaveBeenFetched = false

  const request = await getTopStoryIds()
  const ids = await request.json()
  console.log(`Ids for the top stories have been fetched, found ${ids.length} ids\n`)
  const stories = await getAllTopStories(ids)

  data.topStories = []
  stories.forEach(story => {
    data.topStories.push(story)
  })

  topStoriesHaveBeenFetched = true
  console.log(`Top stories have been updated in state; items stored: ${data.topStories.length}`)
}

const corsOptions = {
  origin:'*',
  credentials:true,            //access-control-allow-credentials:true
  optionSuccessStatus:200,
}

app.use(cors(corsOptions))
app.use(express.json())

app.listen(port, async () => {
  console.log(`Server listening on port: ${port}`)
  await fetchTopStories()
})

app.get("/", (req, res) => {
  res.send("Hello!")
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
  console.log("Cron job running...")
  if (topStoriesHaveBeenFetched) {
    console.log("Fetching stories...")
    await fetchTopStories()
  } else {
    console.log(`Original fetch has not ran; retry in ${cronJobMinutes} minute(s).`)
  }
})