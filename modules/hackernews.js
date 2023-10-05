const baseUrl = "https://hacker-news.firebaseio.com/v0/"

const request = async (url, method="GET", silent=false) => {
  if (!silent)
    console.log(`--> Making ${method} request to '${url}'`)
  const response = await fetch(`${baseUrl}/${url}.json`, {
    method: method
  })
  if (!silent)
  console.log(`<-- ${response.status}`)
  return response
}

const getStory = async (id, silent=false) => await request(`item/${id}`, "GET", silent)

const getTopStoryIds = async () => {
  const response = await request("topstories")
  return await response.json()
}

const getAllTopStories = async (ids) => {
  const stories = []
  console.log("Getting all stories by id...")
  for (let i = 0; i < ids.length; i++) {
    const story = await getStory(ids[i], true)
    stories.push(await story.json())
  }
  console.log("Complete")

  return stories
}

const getNumberOfStories = async (ids, filters) => {
  let stories = []

  let minStoriesToGet = (filters.page - 1) * filters.amountToIncreaseBy
  const maxStoriesToGet = filters.page * filters.amountToIncreaseBy

  for (let i = minStoriesToGet; i < maxStoriesToGet; i++) {
    const story = await getStory(ids[i])
    stories.push(await story.json())
  }

  return stories
}

module.exports = {getTopStoryIds, getNumberOfStories, getAllTopStories}