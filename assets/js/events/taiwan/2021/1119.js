(() => {
  const EVENT_KEY = 'kwgh-taiwan-2021-1119'
  const CHECK_IN_GAME = 'Sent to gift box'
  const playCoinConsume = 2
  const requestInterval = 400
  let isBusy = false

  kwgh.init({
    eventKey: EVENT_KEY,
    date: '2021/11/21',
    play: play,
    bonus: bonus,
    load: load
  })
  kwgh.addCoupons(kwgh.coupons)

  const token = kwgh.el.q('#hfData').value
  const remainCoinEl = kwgh.el.q('.num1')
  // const totalCoinEl = kwgh.el.q('.num2')
  const remainBonusEl = kwgh.el.q('.num3')

  let remainCoin = 0
  let remainBonus = 0
  let firstRequest = true
  async function keepSession() {
    if (!isBusy) {
      await kwgh.ajax.post('../../api/Event/E20211119/GetUserData', {
        type: 'json',
        data: {
          Token: token
        },
        success: result => {
          if (firstRequest) {
            const data = result.Data.UserData
            remainCoin = Number(data.DiceCntFt)
            remainBonus = Number(data.CompletedCntFt)
            kwgh.ev(EVENT_KEY, 'jewelry', 'count', Number(data.GameDiceCntFt))
            firstRequest = false
          }
        }
      })
    }
    setTimeout(keepSession, 30000)
  }
  if (token !== '') {
    keepSession()
  }

  let getCount
  function play() {
    if (isBusy) {
      isBusy = false
      return
    }
    isBusy = true
    kwgh.loading()
    kwgh.ev(EVENT_KEY, 'play', 'click')
    if (kwgh.config.autoRun !== false) {
      kwgh.btnLoading('#kwgh-btn-play', 'STOP', false)
      kwgh.ev(EVENT_KEY, 'play', 'autoRun', 1)
    }
    else {
      kwgh.btnLoading('#kwgh-btn-play', 'Working...')
      kwgh.ev(EVENT_KEY, 'play', 'autoRun', 0)
    }

    getCount = 0
    doPlay()
  }
  function doPlay() {
    let error = false

    // // OK
    // "Data":{"DicePosition":"5,0,5","Flag":1,"Reward":{"LogId":22100,"ItemId":21767,"ItemName":"V1零件碎片 50個","UpdateTime":"0001-01-01T00:00:00","LogTime":"0001-01-01 00:00"}}
    // // 再走一次
    // "Data":{"DicePosition":"4,15,19","Flag":2,"Reward":{"LogId":0,"ItemId":1,"ItemName":"再走一次","UpdateTime":"0001-01-01T00:00:00","LogTime":"0001-01-01 00:00"}}
    // // 無人島
    // "Data":{"DicePosition":"4,13,17","Flag":3,"Reward":{"LogId":0,"ItemId":0,"ItemName":"無人島","UpdateTime":"0001-01-01T00:00:00","LogTime":"0001-01-01 00:00"}}
    playRequest().then(data => {
      const path = data.DicePosition
      const [move, current, target] = path.split(',')

      // Set flag position
      kwgh.el.q('.flag').className = 'flag flag-set' + target

      if (data.Flag == 2) {
        if (kwgh.config.autoRun === false) {
          kwgh.toast('secondary', 'Play again!')
        }
        return
      }

      // Change page data
      remainCoin = remainCoin - playCoinConsume
      remainCoinEl.innerText = remainCoin
      if (target < current) {
        remainBonus++
        remainBonusEl.innerText = remainBonus
      }

      if (data.Flag == 3) {
        if (kwgh.config.autoRun === false) {
          kwgh.toast('secondary', 'Got nothing.')
        }
        return
      }

      const item = data.Reward
      const coupon = {
        id: item.ItemId,
        name: item.ItemName,
        sn: CHECK_IN_GAME
      }
      kwgh.setCoupon(coupon)
      getCount++

      if (kwgh.config.autoRun === false) {
        kwgh.toast('secondary', `Got item: ${coupon.name}.`)
      }
    }).catch(message => {
      error = true
      kwgh.message('error', message)
    }).finally(() => {
      if (!isBusy || error && !kwgh.config.ignoreError || kwgh.config.autoRun === false || kwgh.config.autoRun !== false && remainCoin < playCoinConsume) {
        isBusy = false
        kwgh.loading(false)
        kwgh.btnLoading('#kwgh-btn-play', false)
        if (kwgh.config.autoRun === false || error) {
          return
        }
        kwgh.message('success', `Working end. Got ${getCount} items.`)
        kwgh.ev(EVENT_KEY, 'play', 'getCount', getCount)
      }
      else {
        setTimeout(() => {
          doPlay()
        }, requestInterval)
      }
    })
  }
  function playRequest() {
    return new Promise((resolve, reject) => {
      if (!token) {
        return reject('Not loggined.')
      }
      if (remainCoin < playCoinConsume) {
        return reject('Jewelry not enough.')
      }

      // {"ListData":null,"Data":null,"Code":-2,"Message":"蜂蜜大富翁骰子數量不足","Url":""}
      // // OK
      // {"ListData":null,"Data":{"DicePosition":"5,0,5","Flag":1,"Reward":{"LogId":22100,"ItemId":21767,"ItemName":"V1零件碎片 50個","UpdateTime":"0001-01-01T00:00:00","LogTime":"0001-01-01 00:00"}},"Code":1,"Message":"Success","Url":"../../Logout/Logout.aspx"}
      // // 再走一次
      // {"ListData":null,"Data":{"DicePosition":"4,15,19","Flag":2,"Reward":{"LogId":0,"ItemId":1,"ItemName":"再走一次","UpdateTime":"0001-01-01T00:00:00","LogTime":"0001-01-01 00:00"}},"Code":1,"Message":"恭喜獲得2個骰子，可以再走一次!!","Url":"../../Logout/Logout.aspx"}
      // // 無人島
      // {"ListData":null,"Data":{"DicePosition":"4,13,17","Flag":3,"Reward":{"LogId":0,"ItemId":0,"ItemName":"無人島","UpdateTime":"0001-01-01T00:00:00","LogTime":"0001-01-01 00:00"}},"Code":1,"Message":"Success","Url":"../../Logout/Logout.aspx"}
      kwgh.ajax.post('../../api/Event/E20211119/AddMonopolyLog', {
        type: 'json',
        data: {
          Token: token
        },
        success: result => {
          if (result != null) {
            if (result.Code == 1) {
              return resolve(result.Data)
            }
            return reject(result.Message)
          }
          return reject('Unknown error.')
        },
        error: (request, status, error) => {
          return reject(`Network error.\nstatus: ${request.status}\nerror: ${error}`)
        }
      })
    })
  }

  function bonus() {
    if (isBusy) {
      isBusy = false
      return
    }
    isBusy = true
    kwgh.loading()
    kwgh.ev(EVENT_KEY, 'bonus', 'click')
    if (kwgh.config.autoRun !== false) {
      kwgh.btnLoading('#kwgh-btn-bonus', 'STOP', false)
      kwgh.ev(EVENT_KEY, 'bonus', 'autoRun', 1)
    }
    else {
      kwgh.btnLoading('#kwgh-btn-bonus', 'Working...')
      kwgh.ev(EVENT_KEY, 'bonus', 'autoRun', 0)
    }

    getCount = 0
    doBonus()
  }
  function doBonus() {
    let error = false

    // "Data":{"Reward":{"LogId":23756,"ItemId":22492,"ItemName":"一支梅(永久)","UpdateTime":"0001-01-01T00:00:00","LogTime":"0001-01-01 00:00"}}
    bonusRequest().then(data => {
      // Change page data
      remainBonus--
      remainBonusEl.innerText = remainBonus

      const item = data.Reward

      const coupon = {
        id: item.ItemId,
        name: item.ItemName,
        sn: CHECK_IN_GAME
      }
      kwgh.setCoupon(coupon)
      getCount++

      if (kwgh.config.autoRun === false) {
        kwgh.toast('secondary', `Got item: ${coupon.name}.`)
      }
    }).catch(message => {
      error = true
      kwgh.message('error', message)
    }).finally(() => {
      if (!isBusy || error && !kwgh.config.ignoreError || kwgh.config.autoRun === false || kwgh.config.autoRun !== false && remainBonus < 1) {
        isBusy = false
        kwgh.loading(false)
        kwgh.btnLoading('#kwgh-btn-bonus', false)
        if (kwgh.config.autoRun === false || error) {
          return
        }
        kwgh.message('success', `Working end. Got ${getCount} items.`)
        kwgh.ev(EVENT_KEY, 'bonus', 'getCount', getCount)
      }
      else {
        setTimeout(() => {
          doBonus()
        }, requestInterval)
      }
    })
  }
  function bonusRequest() {
    return new Promise((resolve, reject) => {
      if (!token) {
        return reject('Not loggined.')
      }
      if (remainBonus < 1) {
        return reject('Bonus not enough.')
      }

      // {"ListData":null,"Data":{"Reward":{"LogId":23756,"ItemId":22492,"ItemName":"一支梅(永久)","UpdateTime":"0001-01-01T00:00:00","LogTime":"0001-01-01 00:00"}},"Code":1,"Message":null,"Url":"../../Logout/Logout.aspx"}
      kwgh.ajax.post('../../api/Event/E20211119/AddGoalRewardLog', {
        type: 'json',
        data: {
          Token: token
        },
        success: result => {
          if (result != null) {
            if (result.Code == 1) {
              return resolve(result.Data)
            }
            return reject(result.Message)
          }
          return reject('Unknown error.')
        },
        error: (request, status, error) => {
          return reject(`Network error.\nstatus: ${request.status}\nerror: ${error}`)
        }
      })
    })
  }

  function load() {
    if (isBusy) {
      return
    }
    isBusy = true
    kwgh.loading()
    kwgh.btnLoading('#kwgh-btn-load')
    kwgh.ev(EVENT_KEY, 'load', 'click')

    doLoad()
  }
  function doLoad(page = 1) {
    // "Rewards":[{"LogId":23756,"ItemId":22492,"ItemName":"一支梅(永久)","UpdateTime":"2021-11-20T14:22:09.833","LogTime":"2021-11-20 14:22"},{"LogId":23997,"ItemId":20786,"ItemName":"KOIN 50個","UpdateTime":"2021-11-20T13:57:28.72","LogTime":"2021-11-20 13:57"},{"LogId":23980,"ItemId":6883,"ItemName":"50000 LUCCI兌換券 1個","UpdateTime":"2021-11-20T13:57:21.497","LogTime":"2021-11-20 13:57"},{"LogId":23755,"ItemId":22795,"ItemName":"美術筆 X(30日)","UpdateTime":"2021-11-20T13:55:38.69","LogTime":"2021-11-20 13:55"},{"LogId":23661,"ItemId":21772,"ItemName":"染色劑選擇券 1個","UpdateTime":"2021-11-20T13:54:59.13","LogTime":"2021-11-20 13:54"},{"LogId":23632,"ItemId":16464,"ItemName":"跑跑蜂蜜罐 5個","UpdateTime":"2021-11-20T13:54:48.177","LogTime":"2021-11-20 13:54"}]
    loadRequest(page).then(({ totalPage = 1, totalItem, couponList = [] }) => {
      couponList.forEach(data => {
        const coupon = {
          id: data.ItemId,
          name: data.ItemName,
          sn: CHECK_IN_GAME
        }
        kwgh.setCoupon(coupon)
      })
      if (page < totalPage) {
        setTimeout(() => {
          doLoad(++page)
        }, requestInterval)
      }
      else {
        kwgh.message('success', `${totalItem} coupons have been loaded.`)
        isBusy = false
        kwgh.loading(false)
        kwgh.btnLoading('#kwgh-btn-load', false)
        kwgh.ev(EVENT_KEY, 'load', 'totalItem', totalItem)
      }
    }).catch(message => {
      kwgh.message('error', message)
      isBusy = false
      kwgh.loading(false)
      kwgh.btnLoading('#kwgh-btn-load', false)
    })
  }
  function loadRequest(page) {
    return new Promise((resolve, reject) => {
      if (!token) {
        return reject('Not loggined.')
      }

      // {"ListData":null,"Data":{"TotalCount":0,"DataMaxCnt":0,"TabMaxCnt":0,"Rewards":[]},"Code":1,"Message":null,"Url":"../../Logout/Logout.aspx"}
      // {"ListData":null,"Data":{"TotalCount":7,"DataMaxCnt":6,"TabMaxCnt":15,"Rewards":[{"LogId":23756,"ItemId":22492,"ItemName":"一支梅(永久)","UpdateTime":"2021-11-20T14:22:09.833","LogTime":"2021-11-20 14:22"},{"LogId":23997,"ItemId":20786,"ItemName":"KOIN 50個","UpdateTime":"2021-11-20T13:57:28.72","LogTime":"2021-11-20 13:57"},{"LogId":23980,"ItemId":6883,"ItemName":"50000 LUCCI兌換券 1個","UpdateTime":"2021-11-20T13:57:21.497","LogTime":"2021-11-20 13:57"},{"LogId":23755,"ItemId":22795,"ItemName":"美術筆 X(30日)","UpdateTime":"2021-11-20T13:55:38.69","LogTime":"2021-11-20 13:55"},{"LogId":23661,"ItemId":21772,"ItemName":"染色劑選擇券 1個","UpdateTime":"2021-11-20T13:54:59.13","LogTime":"2021-11-20 13:54"},{"LogId":23632,"ItemId":16464,"ItemName":"跑跑蜂蜜罐 5個","UpdateTime":"2021-11-20T13:54:48.177","LogTime":"2021-11-20 13:54"}]},"Code":1,"Message":null,"Url":"../../Logout/Logout.aspx"}
      kwgh.ajax.post('../../api/Event/E20211119/FindRewardLog', {
        type: 'json',
        data: {
          Page: page,
          Token: token
        },
        success: result => {
          if (result != null) {
            if (result.Code == 1) {
              const data = result.Data
              const total = data.TotalCount
              if (total > 0 && data.Rewards.length > 0) {
                resolve({
                  totalPage: Math.ceil(total / 6),
                  totalItem: total,
                  couponList: data.Rewards
                })
              }
              else {
                return reject('No coupon found.')
              }
            }
            return reject(result.Message)
          }
          return reject('Unknown error.')
        },
        error: (request, status, error) => {
          return reject(`Network error.\nstatus: ${request.status}\nerror: ${error}`)
        }
      })
    })
  }
})()