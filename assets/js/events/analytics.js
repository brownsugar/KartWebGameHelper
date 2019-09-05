(() => {
  kwgh.ev('kwgh', 'ver', KWGH_VER)
  kwgh.ev('kwgh', 'lang', KWGH_UILANG)
  kwgh.ev('kwgh', 'hostname', document.location.hostname)

  const getUserId = () => {
    let user, el
    if (el = kwgh.el.q('#gnbMyInfo a')) {
      user = 'NEXON_' + el.innerText
    }
    else if (el = kwgh.el.q('.prof_info strong')) {
      user = 'NAVER_' + el.innerText.slice(0, -1)
    }
    return user
  }

  window.onload = () => {
    const userId = getUserId()
    if (userId) {
      gtag('set', { 'user_id': userId })
    }
  }
})()