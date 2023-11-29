const epochToDay = (epochTime) => {
  const date = new Date(0)
  date.setUTCSeconds(epochTime)
  return date
}
module.exports = { epochToDay }