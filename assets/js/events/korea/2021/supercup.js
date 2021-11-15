(() => {
  const EVENT_KEY = 'kwgh-korea-2021-supercup'

  kwgh.init({
    eventKey: EVENT_KEY,
    date: '2021/11/15'
  })

  window.onload = () => {
    kwgh.leagueMode()
  }
})()