'use strict'

let isSettingsHidden = true

window.onload = function() {
  localStorage.setItem('serverHostname', localStorage.getItem('serverHostname') ?? 'https://receipt.recurse.com')
  setupSettingsSection()
  setupLoginSection()
  setupTextSection()
  setupImageSection()
  setupEscPosSection()
}

function setupEscPosSection() {
  if (!getReceiptCsrfCookie()) {
    sendEscPosButton.disabled = true
  }
  sendEscPosButton.addEventListener('click', async (event) => {
    sendEscPosButton.disabled = true
    initResponseDiv(escPosResponseDiv, 'Response: (pending...)')
    // TODO
    initResponseDiv(escPosResponseDiv, 'Response:')
    updateResponseDiv(escPosResponseDiv, 999, '{}')
    sendEscPosButton.disabled = false
  })
}

function setupImageSection() {
  if (!getReceiptCsrfCookie()) {
    printImageButton.disabled = true
    imagePicker.disabled = true
  }
  imagePicker.addEventListener('change', async () => {
    printImageButton.disabled = imagePicker.files.length !== 1
  })
  printImageButton.addEventListener('click', async (event) => {
    printImageButton.disabled = true
    initResponseDiv(imageResponseDiv, 'Response: (pending...)')
    const res = await sendImageToPrinter()
    initResponseDiv(imageResponseDiv, 'Response:')
    if (res.status == 200) {
      const jsonBody = await res.json()
      updateResponseDiv(imageResponseDiv, res.status, jsonBody)
    } else {
      updateResponseDiv(imageResponseDiv, res.status, '')
    }
    printImageButton.disabled = false
  })
}

function clear(node) {
  while (node.firstChild) {
    node.removeChild(node.lastChild)
  }
}

function initResponseDiv(div, label) {
  clear(div)
  div.appendChild(p(label))
  for (let i = 1; i < div.children.length; i++) {
    div.removeChild(div.children[i])
  }
}

function updateResponseDiv(div, status, jsonResponse) {
  div.appendChild(pre(status))
  div.appendChild(pre(JSON.stringify(jsonResponse, null, 2)))
}

function sendImageToPrinter() {
  const csrf = getReceiptCsrfCookie()
  if (!csrf) {
    console.error('You are not logged into Receipt API Server! Aborting...')
    return
  }
  if (imagePicker.files.length === 0) {
    console.error('No image loaded!')
    return
  }
  const serverHostname = localStorage.getItem('serverHostname')
  const url = `${serverHostname}/image`
  return fetch(url, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/octet-stream',
      'X-CSRF-Token': csrf,
    },
    body: imagePicker.files[0],
  })
}

function setupTextSection() {
  if (!getReceiptCsrfCookie()) {
    printTextButton.disabled = true
  }
  printTextButton.addEventListener('click', async (event) => {
    printTextButton.disabled = true
    const text = textField.value
    setLastPrinted(text)
    initResponseDiv(textResponseDiv, 'Response: (pending...)')
    const res = await sendTextToPrinter(text)
    initResponseDiv(textResponseDiv, 'Response:')
    if (res.status == 200) {
      const jsonBody = await res.json()
      updateResponseDiv(textResponseDiv, res.status, jsonBody)
    } else {
      updateResponseDiv(textResponseDiv, res.status, '')
    }
    textField.innerHTML = ''
    printTextButton.disabled = false
  })
}

function sendTextToPrinter(text) {
  const csrf = getReceiptCsrfCookie()
  if (!csrf) {
    console.error('You are not logged into Receipt API Server! Aborting...')
    return
  }
  const serverHostname = localStorage.getItem('serverHostname')
  const url = `${serverHostname}/text`
  return fetch(url, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      'X-CSRF-Token': csrf,
    },
    body: JSON.stringify({
      text
    })
  })
}

function setLastPrinted(text) {
  if (lastPrintedDiv.children.length === 0) {
    lastPrintedDiv.appendChild(p('Sent:'))
  }
  for (let i = 1; i < lastPrintedDiv.children.length; i++) {
    lastPrintedDiv.removeChild(lastPrintedDiv.children[i])
  }
  lastPrintedDiv.appendChild(pre(text))
}

function parseCookies(cookieString) {
  const cookies = cookieString.split('; ')
  const cookiesDict = {}
  for (const cookie of cookies) {
    const [key, value] = cookie.split('=', 2)
    cookiesDict[key] = value
  }
  return cookiesDict
}

function a(text, url) {
  const el = document.createElement('a')
  el.innerHTML = text
  el.href = url
  return el
}

function pre(text) {
  const el = document.createElement('pre')
  el.innerHTML = text
  return el
}

function p(text) {
  const el = document.createElement('p')
  el.innerHTML = text
  return el
}

function input() {
  const el = document.createElement('input')
  return el
}

function div() {
  const el = document.createElement('div')
  return el
}

function label(text) {
  const el = document.createElement('label')
  el.innerHTML = text
  return el
}

function checkbox() {
  const el = document.createElement('input')
  el.type = 'checkbox'
  return el
}

function showOrHideSettings() {
  if (isSettingsHidden) {
    toggleSettingsArrow.innerHTML = '&blacktriangledown;'
    toggleSettingsButton.className = 'active'
    settingsDiv.className = 'active'
    isSettingsHidden = false
  } else {
    toggleSettingsArrow.innerHTML = '&blacktriangleright;'
    toggleSettingsButton.className = 'hidden'
    settingsDiv.className = 'hidden'
    isSettingsHidden = true
  }
}

function setupSettingsSection() {
  toggleSettingsButton.addEventListener('click', showOrHideSettings)

  if (isSettingsHidden) {
    toggleSettingsButton.className = 'hidden'
    settingsDiv.className = 'hidden'
    toggleSettingsArrow.innerHTML = '&blacktriangleright;'
  } else {
    toggleSettingsButton.className = 'active'
    settingsDiv.className = 'active'
    toggleSettingsArrow.innerHTML = '&blacktriangledown;'
  }

  {
    const d = div()
    const i = input()
    const l = label('API server hostname ')
    i.value = localStorage.getItem('serverHostname')
    i.addEventListener('input', () => {
      localStorage.setItem('serverHostname', i.value)
      // manually update login section
      setupLoginSection()
    })
    d.appendChild(l)
    d.appendChild(i)
    settingsDiv.appendChild(d)
  }

  {
    const d = div()
    const c = checkbox()
    const l = label('Bypass CORS warning? ')
    c.checked = (localStorage.getItem('ignoreOrigin') === 'true')
    c.addEventListener('change', () => {
      localStorage.setItem('ignoreOrigin', c.checked)
      // manually update login section
      setupLoginSection()
    })
    d.appendChild(l)
    d.appendChild(c)
    settingsDiv.appendChild(d)
  }
}

function setupLoginSection() {
  clear(loginDiv)

  const isRecurseSubdomain = window.location.origin.match(/.recurse.com\/?$/)
  const ignoreOrigin = (localStorage.getItem('ignoreOrigin') === 'true')

  if (!ignoreOrigin && !isRecurseSubdomain) {
    loginDiv.appendChild(p('This is not a *.recurse.com subdomain, so it will not be able to make authenticated requests to <a href="https://receipt.recurse.com">https://receipt.recurse.com</a>.'))
    loginDiv.appendChild(p('Please visit <a href="https://receipt-tester.recurse.com">https://receipt-tester.recurse.com</a> for the full experience.'))
    return
  }

  if (getReceiptCsrfCookie()) {
    loginDiv.appendChild(p('You are logged in.'))
    return
  }

  const serverHostname = localStorage.getItem('serverHostname')
  const url = `${serverHostname}/login?redirect_uri=${window.location.href}`
  loginDiv.appendChild(a('login', url))
}

function getReceiptCsrfCookie() {
  const cookies = parseCookies(document.cookie)
  return cookies.receipt_csrf
}
