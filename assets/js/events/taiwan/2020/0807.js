(() => {
  const EVENT_KEY = 'kwgh-taiwan-2020-0807'
  const playCoinConsume = 2
  const requestInterval = 500
  let isBusy = false

  kwgh.init({
    eventKey: EVENT_KEY,
    date: '2020/08/09',
    play: play,
    load: load
  })
  kwgh.addCoupons(kwgh.coupons)
  kwgh.ev(EVENT_KEY, 'jewelry', 'count', Number(kwgh.el.q('#lblNum2').innerText))

  const isLogin = kwgh.el.q('#hfLoginStatus').value == 'Y'
  const remainCoinEl = kwgh.el.q('#lblNum1')
  const finishRoundEl = kwgh.el.q('#lblNum3')
  let remainCoin = Number(remainCoinEl.innerText)
  let finishRound = Number(finishRoundEl.innerText)

  async function keepSession() {
    if (!isBusy) {
      await kwgh.ajax.post('index.aspx/Refresh', {
        type: 'json',
        data: {
          DoubleOpenFlag: kwgh.el.q('#DoubleOpenFlag').value
        }
      })
    }
    setTimeout(keepSession, 30000)
  }
  if (isLogin) {
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

    playRequest().then(data => {
      // Change page data
      remainCoin = remainCoin - playCoinConsume
      remainCoinEl.innerText = remainCoin
      finishRoundEl.innerText = ++finishRound

      if (!data.SN)
        return

      const coupon = {
        id: data.ImageID,
        name: data.ItemName,
        sn: data.SN
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
      if (!isBusy || error && !kwgh.config.ignoreError || !kwgh.config.autoRun || kwgh.config.autoRun && remainCoin < playCoinConsume) {
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
      if (!isLogin) {
        return reject('Not logged in.')
      }
      if (remainCoin < playCoinConsume) {
        return reject('Jewelry not enough.')
      }

      // {
      //   "code": "1",
      //   "message": "Success",
      //   "data": {
      //     "ImageID": "2",
      //     "SN": "0000000000000000000000000",
      //     "ExpiryDate": "2020/10/31 下午 11:59:00",
      //     "ItemName": "童話手杖 X(30 日)",
      //     "ItemList": [
      //       {
      //         "Pos": 2,
      //         "ItemID": "16521",
      //         "ItemName": "傳說零件 X(永久)",
      //         "ImageID": "12"
      //       },
      //       {
      //         "Pos": 3,
      //         "ItemID": "18606",
      //         "ItemName": "貝希摩斯 X(30 日)",
      //         "ImageID": "5"
      //       },
      //       {
      //         "Pos": 4,
      //         "ItemID": "19473",
      //         "ItemName": "乳酪 X(永久)",
      //         "ImageID": "11"
      //       },
      //       {
      //         "Pos": 5,
      //         "ItemID": "19817",
      //         "ItemName": "尼歐的新品車款齒輪7代(1個)",
      //         "ImageID": "8"
      //       },
      //       {
      //         "Pos": 6,
      //         "ItemID": "19870",
      //         "ItemName": "玩具長頸鹿頭飾(30日)",
      //         "ImageID": "21"
      //       },
      //       {
      //         "Pos": 7,
      //         "ItemID": "19873",
      //         "ItemName": "可愛鯨魚氣球(100個)",
      //         "ImageID": "17"
      //       },
      //       {
      //         "Pos": 8,
      //         "ItemID": "19871",
      //         "ItemName": "彩幻玩具護目鏡(30日)",
      //         "ImageID": "15"
      //       },
      //       {
      //         "Pos": 1,
      //         "ItemID": "19412",
      //         "ItemName": "童話手杖 X(30 日)",
      //         "ImageID": "2"
      //       }
      //     ]
      //   },
      //   "url": ""
      // }
      kwgh.ajax.post('index.aspx/Flop', {
        type: 'json',
        data: {
          Pos: '1',
          DoubleOpenFlag: kwgh.el.q('#DoubleOpenFlag').value
        },
        success: result => {
          if (result != null) {
            try {
              const d = JSON.parse(result.d)

              if (d.code == '1') {
                return resolve(d.data)
              }
              return reject(d.message)
            }
            catch (e) {
              return reject(e)
            }
          }
          return reject('Unknown error.')
        }
      })
    })
  }

  let loadCount
  function load() {
    if (isBusy) {
      return
    }
    isBusy = true
    kwgh.loading()
    kwgh.btnLoading('#kwgh-btn-load')
    kwgh.ev(EVENT_KEY, 'load', 'click')

    loadCount = 0
    doLoad()
  }
  function doLoad(page = 1) {
    loadRequest(page).then(({ totalPage = 1, couponList = [] }) => {
      couponList.forEach(data => {
        const coupon = {
          id: data.ImageID,
          name: data.ItemName,
          sn: data.SN
        }
        kwgh.setCoupon(coupon)
        loadCount++
      })
      if (page < totalPage) {
        setTimeout(() => {
          doLoad(++page)
        }, requestInterval)
      }
      else {
        kwgh.message('success', `${loadCount} coupons have been loaded.`)
        isBusy = false
        kwgh.loading(false)
        kwgh.btnLoading('#kwgh-btn-load', false)
        kwgh.ev(EVENT_KEY, 'load', 'totalItem', loadCount)
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
      if (!isLogin) {
        return reject('Not logged in.')
      }

      // {
      //   "code": "1",
      //   "message": "Success",
      //   "data": "[{\"TotalCount\":1,\"RowNo\":1,\"SN\":\"0000000000000000000000000\",\"ItemName\":\"黑騎士 X(30 日)\",\"ImageID\":3,\"ExpiryDate\":\"2020-10-31 23:59:00\",\"CreateDate\":\"2020-08-09 03:05\"}]",
      //   "url": ""
      // }
      kwgh.ajax.post('index.aspx/ShowList', {
        type: 'json',
        data: {
          Page: page,
          DoubleOpenFlag: kwgh.el.q('#DoubleOpenFlag').value
        },
        success: result => {
          if (result != null) {
            try {
              const d = JSON.parse(result.d)

              if (d.code == '1') {
                const data = JSON.parse(d.data)
                if (data.length) {
                  return resolve({
                    totalPage: Math.ceil(data[0].TotalCount / 6),
                    couponList: data
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