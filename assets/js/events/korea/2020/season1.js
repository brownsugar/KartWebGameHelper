(() => {
  const EVENT_KEY = 'kwgh-korea-2020-season1'

  kwgh.init({
    eventKey: EVENT_KEY,
    date: '2020/02/02'
  })

  const isLogin = !!document.querySelector('#gnbMyInfo') || // NEXON
                  !!document.querySelector('.nick') // NAVER
  if (!isLogin) {
    kwgh.toast('danger', 'Please login first!', 0)
    return
  }

  const isLive = window.isLiveVod
  // Check if live event starts
  if (!isLive) {
    const limit = 300
    let count = 0
    const interval = setInterval(() => {
      kwgh.toast('secondary', `Waiting for the live event starts...<br />Page will refresh in ${limit - count}s.`, 0)
      count++
      if (count > limit) {
        clearInterval(interval)
        window.location.reload()
        return
      }
    }, 1000)
    return
  }

  kwgh.toast('success', 'Start collecting the league emblems...', 0)
  kwgh.loading()
  const interval = setInterval(() => {
    const emblemWrap = document.querySelector('.emblem')
    const emblem = document.querySelector('.emblem a')
    if (emblemWrap.style.display !== 'none' && emblem !== null) {
      window.emblemEventApply(emblem)
      const emblemGot = document.querySelectorAll('.emb_list .emb_get').length
      if (emblemGot === 4) {
        clearInterval(interval)
        kwgh.toast('success', 'Done! You\'ve collected 4 league emblems.', 0)
        kwgh.loading(false)
        return
      }
    }
  }, 5000)
})()