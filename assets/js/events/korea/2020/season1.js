(() => {
  const EVENT_KEY = 'kwgh-korea-2020-season1'

  kwgh.init({
    eventKey: EVENT_KEY,
    date: '2020/02/02'
  })

  window.onload = () => {
    kwgh.leagueMode()
  }
})()