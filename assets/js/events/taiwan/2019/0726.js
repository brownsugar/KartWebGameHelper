(() => {
  // No jQuery version
  const EVENT_KEY = 'kwgh-taiwan-2019-0726'
  const requestInterval = 300
  let isBusy = false

  const remainCoinEl = kwgh.el.q('#lblNum1')
  const totalCoinEl = kwgh.el.q('#lblNum2')
  const remainBonusEl = kwgh.el.q('#lblNum3')
  kwgh.init({
    eventKey: EVENT_KEY,
    date: '2019/08/01',
    play: play,
    bonus: bonus,
    load: load
  })
  kwgh.addCoupons(kwgh.coupons)
  kwgh.ev(EVENT_KEY, 'jewelry', 'count', parseInt(totalCoinEl.innerText))

  async function keepSession() {
    if (!isBusy) {
      await kwgh.ajax.post('index.aspx/RefreshDice', {
        type: 'json',
        data: {
          DoubleOpenFlag: kwgh.el.q('#DoubleOpenFlag').value
        }
      })
    }
    setTimeout(keepSession, 30000)
  }
  if (kwgh.el.q('#hfLoginStatus').value == 'Y') {
    keepSession()
  }

  let remainCoin = parseInt(remainCoinEl.innerText)
  let getCount
  function play() {
    if (isBusy) {
      isBusy = false
      return
    }
    isBusy = true
    kwgh.loading()
    kwgh.ev(EVENT_KEY, 'play', 'click')
    if (kwgh.config.autoRun) {
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

    playRequest().then(data => {
      const path = data.code == 2 ? data.url : data.data
      const [move, current, target] = path.split(',')

      // Set flag position
      kwgh.el.q('.flag').className = 'flag flag-set' + target

      if (data.code == 3) {
        if(!kwgh.config.autoRun) {
          kwgh.toast('secondary', 'Play again!')
        }
        return
      }

      // Change page data
      remainCoin = remainCoin - 2
      remainCoinEl.innerText = remainCoin
      if (parseInt(target) < parseInt(current)) {
        remainBonus++
        remainBonusEl.innerText = remainBonus
      }

      if (['1', '111'].includes(data.code)) {
        if(!kwgh.config.autoRun) {
          kwgh.toast('secondary', 'Got nothing.')
        }
        return
      }

      const item = data.data[0]
      const coupon = {
        id: item.ItemID,
        name: item.ItemName,
        sn: item.SN
      }
      kwgh.setCoupon(coupon)
      getCount++

      if(!kwgh.config.autoRun) {
        kwgh.toast('secondary', `Got item: ${coupon.name}.`)
      }
    }).catch(message => {
      error = true
      kwgh.message('error', message)
    }).finally(() => {
      if (!isBusy || error && !kwgh.config.ignoreError || !kwgh.config.autoRun || kwgh.config.autoRun && remainCoin < 2) {
        isBusy = false
        kwgh.loading(false)
        kwgh.btnLoading('#kwgh-btn-play', false)
        if (!kwgh.config.autoRun || error) {
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
      if (kwgh.el.q('#hfLoginStatus').value != 'Y') {
        return reject('Not loggined.')
      }
      if (remainCoin < 2) {
        return reject('Jewelry not enough.')
      }

      // {
      //   "d": "{\"code\":\"111\",\"message\":\"骰子不足\",\"data\":\"\",\"url\":\"\"}"
      //   // 無人島
      //   "d": "{\"code\":\"1\",\"message\":\"Success\",\"data\":\"5,1,6\",\"url\":\"\"}"
      //   // OK
      //   "d": "{\"code\":\"2\",\"message\":\"Success\",\"data\":\"[{\\\"ItemID\\\":53,\\\"ItemName\\\":\\\"道具換位卡x50\\\",\\\"CreateDate\\\":\\\"2019-07-28 21:49\\\",\\\"SN\\\":\\\"0000000000000000000000000\\\"}]\",\"url\":\"2,6,8\"}"
      //   // 再走一次
      //   "d":"{\"code\":\"3\",\"message\":\"Success\",\"data\":\"3,16,19\",\"url\":\"\"}"
      // }
      kwgh.ajax.post('index.aspx/Dice', {
        type: 'json',
        data: {
          DoubleOpenFlag: kwgh.el.q('#DoubleOpenFlag').value
        },
        success: result => {
          if (result != null) {
            try {
              const d = JSON.parse(result.d)

              if (d.data != '') {
                if (d.code == 2) {
                  d.data = JSON.parse(d.data)
                }
                return resolve(d)
              }
              return reject(d.message)
            }
            catch (e) {
              return reject(e)
            }
          }
          return reject('Unknown error.')
        },
        error: (request, status, error) => {
          return reject(`Network error.\nstatus: ${request.status}\nerror: ${error}`)
        }
      })
    })
  }

  let remainBonus = parseInt(remainBonusEl.innerText)
  function bonus() {
    if (isBusy) {
      isBusy = false
      return
    }
    isBusy = true
    kwgh.loading()
    kwgh.ev(EVENT_KEY, 'bonus', 'click')
    if (kwgh.config.autoRun) {
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

    bonusRequest().then(data => {
      // Change page data
      remainBonus--
      remainBonusEl.innerText = remainBonus

      const item = data.data[0]

      if (!item.SN)
        return

      const coupon = {
        id: item.ItemID,
        name: item.ItemName,
        sn: item.SN
      }
      kwgh.setCoupon(coupon)
      getCount++

      if(!kwgh.config.autoRun) {
        kwgh.toast('secondary', `Got item: ${coupon.name}.`)
      }
    }).catch(message => {
      error = true
      kwgh.message('error', message)
    }).finally(() => {
      if (!isBusy || error && !kwgh.config.ignoreError || !kwgh.config.autoRun || kwgh.config.autoRun && remainBonus < 1) {
        isBusy = false
        kwgh.loading(false)
        kwgh.btnLoading('#kwgh-btn-bonus', false)
        if (!kwgh.config.autoRun || error) {
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
      if (kwgh.el.q('#hfLoginStatus').value != 'Y') {
        return reject('Not loggined.')
      }
      if (remainBonus < 1) {
        return reject('Bonus not enough.')
      }

      // {
      //   "d": "{\"code\":\"1\",\"message\":\"Success\",\"data\":\"[{\\\"ItemID\\\":13520,\\\"ItemName\\\":\\\"夜爵9(永久)\\\",\\\"CreateDate\\\":\\\"2019-07-30 21:06\\\",\\\"SN\\\":\\\"0000000000000000000000000\\\"}]\",\"url\":\"\"}"
      // }
      kwgh.ajax.post('index.aspx/GetItem', {
        type: 'json',
        data: {
          DoubleOpenFlag: kwgh.el.q('#DoubleOpenFlag').value
        },
        success: result => {
          if (result != null) {
            try {
              const d = JSON.parse(result.d)

              if (d.data != '') {
                d.data = JSON.parse(d.data)
                return resolve(d)
              }
              return reject(d.message)
            }
            catch (e) {
              return reject(e)
            }
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
  function doLoad() {
    loadRequest().then(({ totalItem, couponList = [] }) => {
      couponList.forEach(data => {
        const coupon = {
          id: data.ItemID,
          name: data.ItemName,
          sn: data.SN
        }
        kwgh.setCoupon(coupon)
      })
      kwgh.message('success', `${totalItem} coupons have been loaded.`)
      isBusy = false
      kwgh.loading(false)
      kwgh.btnLoading('#kwgh-btn-load', false)
      kwgh.ev(EVENT_KEY, 'load', 'totalItem', totalItem)
    }).catch(message => {
      kwgh.message('error', message)
      isBusy = false
      kwgh.loading(false)
      kwgh.btnLoading('#kwgh-btn-load', false)
    })
  }
  function loadRequest() {
    return new Promise((resolve, reject) => {
      if (kwgh.el.q('#hfLoginStatus').value != 'Y') {
        return reject('Not loggined.')
      }

      // {
      //    "d": "{\"code\":\"1\",\"message\":\"Success\",\"data\":\"[]\",\"url\":\"\"}"}
      // }
      // {
      //    "d": "{\"code\":\"1\",\"message\":\"Success\",\"data\":\"[{\\\"Seq\\\":1993393,\\\"MainAccount\\\":\\\"XX\\\",\\\"ServiceAccount\\\":\\\"TE\\\",\\\"GashRegion\\\":\\\"TW\\\",\\\"SN\\\":\\\"0000000000000000000000000\\\",\\\"ItemID\\\":16463,\\\"ItemName\\\":\\\"小蜂蜜頭飾X50\\\",\\\"Type\\\":1,\\\"Flag\\\":1,\\\"CreateDate\\\":\\\"2019-08-01 14:56\\\",\\\"UpdateDate\\\":\\\"2019-08-01T14:56:20.92\\\"}]\",\"url\":\"\"}"
      // }
      kwgh.ajax.post('index.aspx/ShowList', {
        type: 'json',
        data: {
          DoubleOpenFlag: kwgh.el.q('#DoubleOpenFlag').value
        },
        success: result => {
          if (result != null) {
            try {
              const d = JSON.parse(result.d)

              if (d.code == '1') {
                d.data = JSON.parse(d.data)

                if (d.data.length > 0) {
                  return resolve({
                    totalItem: d.data.length,
                    couponList: d.data
                  })
                }
                return reject('No coupon found.')
              }
              return reject(d.message)
            }
            catch (e) {
              return reject(e)
            }
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