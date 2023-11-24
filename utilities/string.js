const ellipsis = (text, length=25) => {
  if (text && text.toString().length > length)
    return `${text.substring(0, length)}...`

  return text
}

const removeHttp = (text) => {
  let formattedText
  if (text.includes("https"))
    formattedText = text.substring(8, text.length)
  else
    formattedText = text.substring(7, text.length)

  if (text.includes("www"))
    formattedText = formattedText.substring(4, formattedText.length)

  return formattedText
}

module.exports = { ellipsis, removeHttp }