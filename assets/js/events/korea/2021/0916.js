(() => {
  // All features are same as 2020/01/23 version.

  const EVENT_KEY = 'kwgh-korea-2021-0916'
  const playCoinConsume = 4
  const requestInterval = 600
  let isBusy = false

  kwgh.init({
    eventKey: EVENT_KEY,
    date: '2020/09/25',
    play: play,
    load: load
  })
  kwgh.addCoupons(kwgh.coupons)

  const remainCoinEl = kwgh.el.q('.num1')
  const totalCoinEl = kwgh.el.q('.num2')
  const finishRoundEl = kwgh.el.q('.num3')
  kwgh.ev(EVENT_KEY, 'jewelry', 'count', parseInt(totalCoinEl.innerText))

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
      PositionCur = data.n1Position

      // Set flag position
      const top = kwgh.el.q(`.cell${data.n1Position}`).offsetTop
      const left = kwgh.el.q(`.cell${data.n1Position}`).offsetLeft
      kwgh.el.q('.flag').style.top = `${top}px`
      kwgh.el.q('.flag').style.left = `${left}px`

      // Set prize
      SetCompleteItem(data.n4CompleteItem1, 'complete1')
      SetCompleteItem(data.n4CompleteItem2, 'complete2')
      kwgh.el.q('#charCurrent').className = 'flag flag-set0'
      kwgh.el.q('#charCurrent').classList.add(...kwgh.el.q('#complete1').classList)

      // Change page data
      remainCoin = data.n4GemNowCnt
      remainCoinEl.innerText = remainCoin
      finishRoundEl.innerText = data.n4CompleteCnt

      if (!data.strCouponSN) {
        if(!kwgh.config.autoRun) {
          kwgh.toast('secondary', `Got nothing.`)
        }
        return
      }

      const coupon = {
        id: data.n4ItemNo,
        name: GetItemDataList(data.n4ItemNo).name,
        sn: data.strCouponSN
      }
      kwgh.setCoupon(coupon)
      getCount++

      if(kwgh.config.autoRun === false) {
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
      kwgh.ajax.post('AjaxYutNori.aspx', {
        data: {
          strType: 'apply',
          PositionCur: PositionCur,
          rd: Math.random()
        },
        success: result => {
          if (result != null && result.Return != null) {
            if (result.Return.n4Return == 0 && result.Data != null && result.Data.length > 0) {
              resolve(result.Data[0])
            }
            else if (result.Return.n4Return <= 0 && result.Return.strReturnValue) {
              if (result.Return.n4Return == -801) {
                return reject('Not loggined.')
              }
              else {
                return reject(result.Return.strReturnValue)
              }
            }
            else {
              return reject('Unknown error.')
            }
          }
          else {
            return reject('Unknown error.')
          }
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

    doLoad(1)
  }

  function doLoad(page) {
    loadRequest(page).then(({ totalPage = 1, totalItem, couponList = [] }) => {
      couponList.forEach(data => {
        const coupon = {
          id: data.n4ItemNo,
          name: GetItemDataList(data.n4ItemNo).name,
          sn: data.strCouponSN
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
      kwgh.ajax.post('AjaxYutNori.aspx', {
        data: {
          strType: 'list',
          PageNo: page,
          rd: Math.random()
        },
        success: result => {
          if (result != null && result.Return != null) {
            if (result.Return.n4Return == 0) {
              const total = result.TotalCount
              if (total > 0 && result.Data.length > 0) {
                resolve({
                  totalPage: Math.ceil(total / 6),
                  totalItem: total,
                  couponList: result.Data
                })
              }
              else {
                return reject('No coupon found.')
              }
            }
            else {
              if (result.Return.n4Return <= 0 && result.Return.strReturnValue != null) {
                if (result.Return.n4Return == -801) {
                  return reject('Not loggined.')
                }
                else {
                  return reject(result.Return.strReturnValue)
                }
              }
              else {
                return reject('Unknown error.')
              }
            }
          }
          else {
            return reject('Unknown error.')
          }
        }
      })
    })
  }
})()