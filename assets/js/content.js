(() => {
  const eventPageRegex = {
    korea: [/Events\/(\d+)\/(\d+)\//i],
    taiwan: [],
    china: []
  }

  let region, regex
  for (let key of Object.keys(eventPageRegex)) {
    const regexs = eventPageRegex[key]
    regexs.some(r => {
      if (r.test(window.location.pathname)) {
        region = key
        regex = r
        return true
      }
    })
    if (region) break
  }

  // Currently only support KKR
  if (region !== 'korea') return

  const [, year, date] = window.location.pathname.match(regex)

  insertStyle('https://fonts.googleapis.com/css?family=Neucha|Patrick+Hand+SC', false)
  insertStyle('https://fonts.googleapis.com/css?family=Noto+Sans+KR&display=swap', false)
  insertInlineScript(`
    const KWGH_VER = ${chrome.runtime.getManifest().version}
    const KWGH_URL = 'https://kartinfo.me'
  `)
  insertScript('assets/js/events/common.js').then(() => {
    if (kwghEvents[region].hasOwnProperty(year) && kwghEvents[region][year].indexOf(date) > -1) {
      insertScript(`assets/js/events/${region}/${year}/${date}.js`)
    }
    else {
      insertScript('assets/js/events/default.js')
    }
  })

  function insertStyle(path, local = true) {
    const s = document.createElement('link')
    s.rel = 'stylesheet'
    s.href = local ? chrome.runtime.getURL(path) : path
    document.body.append(s)
  }

  function insertScript(path, local = true) {
    return new Promise(resolve => {
      const s = document.createElement('script')
      s.src = local ? chrome.runtime.getURL(path) : path
      s.onload = resolve
      document.body.append(s)
    })
  }

  function insertInlineScript(script) {
    const s = document.createElement('script')
    s.textContent = script;
    document.body.append(s)
  }
})()