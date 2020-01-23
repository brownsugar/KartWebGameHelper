(() => {
  const EVENT_KEY = 'kwgh-korea-2020-0123'
  const playCoinConsume = 4
  const requestInterval = 600
  let isBusy = false

  kwgh.init({
    eventKey: EVENT_KEY,
    date: '2020/01/23',
    play: play,
    load: load
  })
  kwgh.addCoupons(kwgh.coupons)
  kwgh.ev(EVENT_KEY, 'jewelry', 'count', parseInt(kwgh.el.q('.num2').innerText))

  const remainCoinEl = kwgh.el.q('.num1')
  const finishRoundEl = kwgh.el.q('.num3')

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
      // {
      //   "Return": {
      //     "n4Return": 0,
      //     "strReturnValue": ""
      //   },
      //   "Data": [
      //     {
      //       "n1PositionWay": 0,
      //       "n1PositionPre": 0, // Last position, current
      //       "n1Position": 2, // New position, total
      //       "n1Yut": 2, // Yut number: -1, 1, 4, 0, 6, number
      //       "n4ApplyCnt": 1,
      //       "n4CompleteCnt": 0, // Complete count
      //       "n4GemUseCnt": 4, // Used count
      //       "n4CompleteItem1": 2083, // Complete reward
      //       "n4CompleteItem2": 2084, // Complete reward
      //       "n4GemNowCnt": 574, // Remain count
      //       "n4TotalGemCnt": 578, // Total count
      //       "n4ItemNo": 0,
      //       "strCouponSN": ""
      //     }
      //   ]
      // }
      // {
      //   "Return": {
      //     "n4Return": 0,
      //     "strReturnValue": ""
      //   },
      //   "Data": [
      //     {
      //       "n1PositionWay": 0,
      //       "n1PositionPre": 12,
      //       "n1Position": 15,
      //       "n1Yut": 3,
      //       "n4ApplyCnt": 7,
      //       "n4CompleteCnt": 0,
      //       "n4GemUseCnt": 28,
      //       "n4CompleteItem1": 2083,
      //       "n4CompleteItem2": 2084,
      //       "n4GemNowCnt": 595,
      //       "n4TotalGemCnt": 623,
      //       "n4ItemNo": 2088,
      //       "strCouponSN": "00000-00000-00000-00000-00000"
      //     }
      //   ]
      // }
      // {
      //   "Return": {
      //     "n4Return": 0,
      //     "strReturnValue": ""
      //   },
      //   "Data": [
      //     {
      //       "n1PositionWay": 0,
      //       "n1PositionPre": 16,
      //       "n1Position": 0,
      //       "n1Yut": 5,
      //       "n4ApplyCnt": 9,
      //       "n4CompleteCnt": 1,
      //       "n4GemUseCnt": 36,
      //       "n4CompleteItem1": 2084,
      //       "n4CompleteItem2": 2082,
      //       "n4GemNowCnt": 632,
      //       "n4TotalGemCnt": 668,
      //       "n4ItemNo": 2083,
      //       "strCouponSN": "00000-00000-00000-00000-00000"
      //     }
      //   ]
      // }
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
      // {
      //   "Return": {
      //     "n4Return": 0,
      //     "strReturnValue": ""
      //   },
      //   "Data": [
      //     {
      //       "n1PositionWay": 0,
      //       "n1PositionPre": 0, // Last position
      //       "n1Position": 2, // New position
      //       "n1Yut": 2, // Yut number: -1, 1, 4, 0, 6
      //       "n4ApplyCnt": 1,
      //       "n4CompleteCnt": 0, // Complete count
      //       "n4GemUseCnt": 4, // Used count
      //       "n4CompleteItem1": 2083, // Complete reward
      //       "n4CompleteItem2": 2084, // Complete reward
      //       "n4GemNowCnt": 574, // Remain count
      //       "n4TotalGemCnt": 578, // Total count
      //       "n4ItemNo": 0,
      //       "strCouponSN": ""
      //     }
      //   ]
      // }
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
      // {
      //   "n4totCnt": 1,
      //   "strCouponList": [
      //     {
      //       "n4index": 1,
      //       "strCoupon": "00000-00000-00000-00000-00000",
      //       "n4ItemNo": 2054,
      //       "n4ItemIndex": 17,
      //       "strItemName": "싱가포르 멀리 밴드 (50개)",
      //       "dtCreate": "2019. 08. 31 02:53"
      //     }
      //   ]
      // }
      kwgh.ajax.post('AjaxYutNori.aspx', {
        data: {
          strType: 'list',
          PageNo: page,
          rd: Math.random()
        },
        success: result => {
          // {
          //   "Return": {
          //     "n4Return": 0,
          //     "strReturnValue": ""
          //   },
          //   "Data": [
          //     {
          //       "n4ItemNo": 2077,
          //       "strCouponSN": "00000-00000-00000-00000-00000",
          //       "dtCreate": "/Date(1569346445827)/",
          //       "strCreate": "2019.09.25"
          //     },
          //     {
          //       "n4ItemNo": 2088,
          //       "strCouponSN": "00000-00000-00000-00000-00000",
          //       "dtCreate": "/Date(1569346441140)/",
          //       "strCreate": "2019.09.25"
          //     },
          //     {
          //       "n4ItemNo": 2082,
          //       "strCouponSN": "00000-00000-00000-00000-00000",
          //       "dtCreate": "/Date(1569346263430)/",
          //       "strCreate": "2019.09.25"
          //     },
          //     {
          //       "n4ItemNo": 2088,
          //       "strCouponSN": "00000-00000-00000-00000-00000",
          //       "dtCreate": "/Date(1569346262900)/",
          //       "strCreate": "2019.09.25"
          //     },
          //     {
          //       "n4ItemNo": 2084,
          //       "strCouponSN": "00000-00000-00000-00000-00000",
          //       "dtCreate": "/Date(1569346254733)/",
          //       "strCreate": "2019.09.25"
          //     },
          //     {
          //       "n4ItemNo": 2088,
          //       "strCouponSN": "00000-00000-00000-00000-00000",
          //       "dtCreate": "/Date(1569345116817)/",
          //       "strCreate": "2019.09.25"
          //     }
          //   ],
          //   "TotalCount": 8
          // }
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