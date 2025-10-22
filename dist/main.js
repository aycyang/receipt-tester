window.onload = function() {
  redirectToRecurseSubdomainIfNeeded()
  setupLoginSection()
  setupTextSection()
  setupImageSection()
}

function setupImageSection() {
  if (!getReceiptCsrfCookie()) {
    imagePicker.disabled = true
  }
}

function setupTextSection() {
  if (!getReceiptCsrfCookie()) {
    printTextButton.disabled = true
  }
  printTextButton.addEventListener('click', async (event) => {
    const text = textField.value
    console.log(text)
    setLastPrinted(text)
    const res = await sendTextToPrinter(text)
    setTextResponse(res)
    textField.innerHTML = ''
  })
}

function sendTextToPrinter(text) {
  const csrf = getReceiptCsrfCookie()
  if (!csrf) {
    console.error('You are not logged into Receipt API Server! Aborting...')
    return
  }
  return fetch('https://receipt.recurse.com/text', {
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

function setTextResponse(res) {
  if (textResponseDiv.children.length === 0) {
    textResponseDiv.appendChild(p('Response:'))
  }
  for (let i = 1; i < textResponseDiv.children.length; i++) {
    textResponseDiv.removeChild(textResponseDiv.children[i])
  }
  textResponseDiv.appendChild(pre(JSON.stringify(res)))
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

function redirectToRecurseSubdomainIfNeeded() {
  // TODO
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

function setupLoginSection() {
  if (!window.location.origin.match(/.recurse.com\/?$/)) {
    loginDiv.appendChild(p('This is not a *.recurse.com subdomain, so it will not be able to make authenticated requests to <a href="https://receipt.recurse.com">https://receipt.recurse.com</a>.'))
    return
  }
  if (getReceiptCsrfCookie()) {
    loginDiv.appendChild(p('You are logged in.'))
    return
  }
  loginDiv.appendChild(a('login', `https://receipt.recurse.com/login?redirect_uri=${window.location.href}`))
}

function getReceiptCsrfCookie() {
  const cookies = parseCookies(document.cookie)
  return cookies.receipt_csrf
}
