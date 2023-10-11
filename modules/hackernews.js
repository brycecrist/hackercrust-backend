const {data} = require("./data");
const baseUrl = "https://hacker-news.firebaseio.com/v0"

const request = async (url, method="GET", silent=false) => {
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

const getStory = async (id, silent=true) => await request(`item/${id}`, "GET", silent)

const getTopStoryIds = async () => await request("topstories")

const getAllTopStories = async (ids, compareAgainstState=true) => {
  const stories = []
  console.log("Getting all stories by id...")
  for (let i = 0; i < ids.length; i++) {
    let story
    const shouldGetStory = ((compareAgainstState && !data.topStoryIds.includes(ids[i])) || !compareAgainstState)

    if (shouldGetStory)
      story = await getStory(ids[i], true)
    else
      continue

    if (shouldGetStory && compareAgainstState)
      console.log(`Found new story: ${ids[i]}`)

    if (i === 0)
      console.log("0%")

    if (i % 50 === 0 && i !== 0)
      console.log(`${(i / ids.length) * 100}%`)

    stories.push(await story.json())
  }

  console.log("100%... all stories have been retrieved\n")
  return stories
}

const getNumberOfStories = async (ids, filters) => {
  let stories = []

  let minStoriesToGet = (filters.page - 1) * filters.increaseBy
  const maxStoriesToGet = filters.page * filters.increaseBy

  for (let i = minStoriesToGet; i < maxStoriesToGet; i++) {
    const story = await getStory(ids[i])
    stories.push(await story.json())
  }

  return stories
}

module.exports = {getTopStoryIds, getNumberOfStories, getAllTopStories}