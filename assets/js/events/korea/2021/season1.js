(() => {
  const EVENT_KEY = 'kwgh-korea-2021-season1'

  kwgh.init({
    eventKey: EVENT_KEY,
    date: '2021/03/04'
  })

  window.onload = () => {
    kwgh.leagueMode()
  }
})()