const express = require('express')
const cron = require('node-cron')
const {getTopStoryIds, getNumberOfStories, getAllTopStories} = require("./modules/hackernews");
const {data} = require("./modules/data");
const app = express()
const port = 5000

let topStoriesHaveBeenFetched = false

const fetchTopStories = async () => {
  topStoriesHaveBeenFetched = false

  const ids = await getTopStoryIds()
  console.log(`Ids for the top stories have been fetched, found ${ids.length} ids`)
  const stories = await getAllTopStories(ids)

  data.topStories = []
  stories.forEach(story => {
    data.topStories.push(story)
  })

  topStoriesHaveBeenFetched = true
  console.log(`Top stories have been updated in state; items stored: ${data.topStories.length}`)
}

app.use(express.json())

app.listen(port, async () => {
  console.log(`Server listening on port: ${port}`)
  await fetchTopStories()
})

app.get("/", (req, res) => {
  res.send("Hello!")
})

app.get("/topstories", async (req, res) => {
  console.log("Request to /topstories")
  res.send(data.topStories)
})

app.get("/topstories/page/:page/amount/:amount/increaseBy/:increaseBy", async (req, res) => {
  console.log("Request to /topstories")
  console.log(req.params)
  res.send(data.topStories)
})

cron.schedule('1 * * * *', async () => {
  console.log("Cron job running...")
  if (topStoriesHaveBeenFetched)
    await fetchTopStories()
})