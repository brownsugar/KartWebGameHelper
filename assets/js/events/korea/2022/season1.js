(() => {
  const EVENT_KEY = 'kwgh-korea-2022-season1'

  kwgh.init({
    eventKey: EVENT_KEY,
    date: '2022/01/21'
  })

  window.onload = () => {
    kwgh.leagueMode()
  }
})()