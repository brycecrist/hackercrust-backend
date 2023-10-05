const express = require('express')
const cron = require('node-cron')
const {getTopStoryIds, getNumberOfStories, getAllTopStories} = require("./modules/hackernews");
const {data} = require("./modules/data");
const app = express()
const port = 5000

const fetchTopStories = async () => {
  const ids = await getTopStoryIds()
  console.log(`Ids for the top stories have been fetched, found ${ids.length} ids`)
  const stories = await getAllTopStories(ids)

  data.topStories = []
  stories.forEach(story => {
    data.topStories.push(story)
  })

  console.log(`Top stories have been updated in state; items stored: ${data.topStories.length}`)
}

app.get("/", (req, res) => {
  res.send("Hello!")
})

app.get("/topstories", async (req, res) => {
  console.log("Request to /topStories")
  console.log(req)
  res.send(data.topStories)
})

app.listen(port, () => {
  console.log(`Server listening on port: ${port}`)
})

cron.schedule('*/30 * * * * *', async () => {
  console.log("Cron job running...")
  await fetchTopStories()
})