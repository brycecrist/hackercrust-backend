const {data} = require("./data");
const {getLinkPreview} = require("link-preview-js")
const chalk = require("chalk");
const baseUrl = "https://hacker-news.firebaseio.com/v0"

const request = async (url, method="GET", silent=true) => {
  const fullUrl = `${baseUrl}/${url}.json`
  if (!silent)
    console.log(`--> '${fullUrl}'`)

  let response

  try {
    response = await fetch(fullUrl, {
      method: method
    })

    if (!silent)
      console.log(`<-- ${response.status}\n`)
  } catch (e) {
    console.error(`Request failed! Exception below:`)
    console.log(`${e}\n`)
  }

  return response ? response : {}
}

const getItem = async (id, silent) => {
  return await request(`item/${id}`, "GET", silent)
}

const getTopStoryIds = async () => await request("topstories")

const getAllTopStories = async (ids, compareAgainstState=true, amount=ids.length) => {
  const stories = []
  console.log("Getting all stories by id...")
  for (let i = 0; i < amount; i++) {
    let story
    const shouldGetStory = ((compareAgainstState && !data.topStoryIds.includes(ids[i])) || !compareAgainstState)

    if (shouldGetStory)
      story = await getItem(ids[i])
    else
      continue


    if (shouldGetStory && compareAgainstState)
      console.log(`Found new story id: ${ids[i]}`)

    if (i === 0)
      console.log(chalk.red("0%"))

    if (i % 50 === 0 && i !== 0)
      console.log(chalk.yellow(`${Math.floor((i / ids.length) * 100)}%`))

    stories.push(await story.json())
  }

  console.log(`${chalk.green("100%")}... all stories have been retrieved\n`)
  return stories
}

const getComments = async (kids) => {
  const comments = []
  if (kids) {
    for (let i = 0; i < kids.length; i++) {
      const response = await getItem(kids[i])
      comments.push(await response.json())
    }
  }

  return comments
}

const getImagePreviewForStory = async (url) => {
  return await getLinkPreview(url)
}

module.exports = {getImagePreviewForStory, getTopStoryIds, getAllTopStories, getItem, getComments}