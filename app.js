const express = require('express')
const cron = require('node-cron')
const cors=require("cors")
const {getTopStoryIds, getAllTopStories, getItem, getComments, getImagePreviewForStory} = require("./modules/hackernews");
const {data, getTopStories, getTopStoriesFromData} = require("./modules/data");
const {ellipsis, removeHttp} = require("./utilities/string");
const chalk = require("chalk");

const app = express()
const port = process.env.PORT || 5000

let topStoriesHaveBeenFetched = false
let cronJobIsRunning = false

const fetchPreview = async (story, silent=true) => {
  if (story && story.url) {
    const formattedUrl = removeHttp(ellipsis(story.url, 50))
    if (!silent)
      console.log(`Fetching preview for url: ${formattedUrl}`)
    try {
      story["preview"] = await getImagePreviewForStory(story.url)
    } catch(e) {
      if (!silent)
        console.log(`Error while fetching story preview from url: ${formattedUrl}. \n !!! Message: ${ellipsis(e.toString(), 50)}`)
    }
  }

  return story
}

/*
* TODO
const fetchAllComments = async (item, comments={}) => {
  if (item.kids && item.kids.length > 0) {
    comments[item.id] = await getComments(item.kids)
    comments[item.id].forEach(i => {
      fetchAllComments(i, )
    })
  }

  return comments
}
*/

const fetchTopStories = async (ids, compareAgainstState=true, amount=ids.length) => {
  console.log(`Ids for the top stories have been fetched, found ${chalk.green(ids.length)} ids\n`)
  console.log(amount)
  const stories = await getAllTopStories(ids, compareAgainstState, amount)

  // No stories were retrieved, because `shouldGetStory` in the hackernews.js `getAllTopStories` function returned false
  if (!stories.length > 0) {
    console.log("No stories were collected.")
    return
  }

  console.log(`Collected ${chalk.green(stories.length)} stories. Processing...`)
  console.log('--------------------------------------------------------------------')

  const sortedStories = [...new Set(stories.sort((x, y) => y.time - x.time))]

  for (let i = 0; i < sortedStories.length; i++) {
    if (sortedStories[i].url)
      sortedStories[i] = await fetchPreview(stories[i])

    if (!data.topStories.includes(sortedStories[i])) {
      console.log(`${chalk.green("Pushing story")}: ${ellipsis(sortedStories[i].title, 50)}`)

      data.topStories.push(sortedStories[i]) // Add new story

      // The typical maximum of stories; if more that the max, pop.
      if (data.topStories.length > 500) {
        const archivedStory = data.topStories[data.topStories.length - 1]
        if (data.topStories[data.topStories.length - 1].id === stories[i].id)
          continue

        console.log(`${chalk.yellow("Popping story from memory")}: ${ellipsis(archivedStory.title, 50)}`)

        data.archives.push(archivedStory)
        data.topStories.pop()
      }
    } else {
      console.log(chalk.red(`Cannot add story as it is already stored]: ${stories[i].id}`))
    }
  }

  console.log("\nAll stories have been processed!")

  topStoriesHaveBeenFetched = true
}

const corsOptions = {
  origin:'*',
  credentials:true,
  optionSuccessStatus:200,
}

app.use(cors(corsOptions))
app.use(express.json())
app.listen(port, async () => {
  console.log(`Starting the ${chalk.cyan("HackerCrust")} backend on port: ${chalk.blue(port)}`)

  const request = await getTopStoryIds()
  data.topStoryIds = await request.json()

  await fetchTopStories(data.topStoryIds, false, 5)

  console.log(`The ${chalk.cyan("HackerCrust")} backend is ready for use.`)
})

app.get("/", (req, res) => {
  res.send("Hacker Crust API is up and running.")
})

app.post("/comments", async (req, res) => {
  const comments = await getComments(req.body.ids)
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

app.get("/item/:id", async (req, res) => {
  console.log(req.params)
  const item = await getItem(req.params.id)

  if (item) {
    console.log(`Found story: ${req.params.id}`)
  } else {
    console.log(`Could not find: ${req.params.id}`)
  }

  res.send(await fetchPreview(await item.json()))
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
    if (story) {

      if (!story.returnId)
        story.returnId = 0

      story.returnId = i
      stories.push(story)
    }
  }

  console.log(`Returning stories ${minStoriesToGet} to ${maxStoriesToGet}.`)
  console.log(`Number of stories: ${stories.length}`)

  res.send(stories)
})

cron.schedule(`*/5 * * * * *`, async () => {
  console.log("Starting CRON job...")

  const fetchNewStories = async () => {
    console.log("Fetching new stories...")
    const request = await getTopStoryIds()
    const stories = await request.json()

    if (stories === []) {
      return
    }

    await fetchTopStories(stories, true)
    console.log("Finished fetching stories.")
  }

  const refreshStories = async () => {
    console.log("Refreshing stories...")
    let stories = []
    console.log(`Number of stories currently in memory: ${data.topStories.length}`)
    console.log(`First id: ${data.topStories[0].id}`)
    console.log("Onto the loop!")

    for (let i = 0; i < data.topStories.length; i++) {
      console.log(`Index: ${i}`)
      const response = await getItem(data.topStories[i].id, false)
      const story = await response.json()
      stories.push(story)
    }

    console.log("Got items... consolidating data")

    stories = stories.filter(story => {
      for (let i = 0; i < data.topStories.length; i++) {
        const storyFromData = data.topStoryIds[i]
        if (storyFromData.id === story.id) {
          if (storyFromData.descendants !== story.descendants || storyFromData.score !== story.score)
            return story
        }
      }
    })
    console.log(stories)

    data.topStories = data.topStories.concat(stories)
    console.log("Collected stories... showing the first index and the length")
    console.log(data.topStories.length)
    console.log(data.topStories[0])
    console.log("All stories have been updated.")
  }

  // Start CRON job logic
  if (!cronJobIsRunning) {
    console.log("Cron job running...")

    if (!topStoriesHaveBeenFetched) {
      console.log(`Original fetch has not ran... exiting current cron job.`)
      return
    }

    cronJobIsRunning = true

    await refreshStories()
    await fetchNewStories()

    cronJobIsRunning = false
  } else {
    console.log("Cron job is currently running... exiting current cron job.")
  }
})