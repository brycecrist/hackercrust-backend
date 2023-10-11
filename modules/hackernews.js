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

const getStory = async (id) => await request(`item/${id}`, "GET")

const getTopStoryIds = async () => await request("topstories")

const getAllTopStories = async (ids) => {
  const stories = []
  console.log("Getting all stories by id...")
  for (let i = 0; i < ids.length; i++) {
    const story = await getStory(ids[i], true)
    if (i % 50 === 0 && i !== 0)
      console.log(`${(i / ids.length) * 100}%`)

    if (i === 0)
      console.log("0%")

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