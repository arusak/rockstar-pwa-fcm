import React, {useState, useEffect} from 'react'
import {LogView} from 'components/LogView/LogView'
import s from 'App.module.css'
import {StatusView} from 'components/StatusView/StatusView'
import {initFcm} from './fcm'
import {firebaseConfig} from './fcmConfig'

function App() {
  const [showRequestButton, setShowRequestButton] = useState(true)
  const [permissionGranted, setPermissionGranted] = useState(false)
  const [fcmToken, setFcmToken] = useState('')

  const [tab, setTab] = useState<'status' | 'log'>('status')

  useEffect(() => {
    document.addEventListener('visibilitychange', async () => {
      if (document.visibilityState === 'visible') {
        const registration = await navigator.serviceWorker?.ready
        registration.active?.postMessage(
            {type: 'APP_OPEN'},
        )
      }
    })
  }, [])

  const requestToken = async () => {
    console.log(firebaseConfig)
    const token = await initFcm(processPushPayload)
    if (token) {
      setFcmToken(token)
      setShowRequestButton(false)
      setPermissionGranted(true)
    }
  }

  const processPushPayload = async (data: Record<string, string>) => {
    const registration = await navigator.serviceWorker?.ready
    registration.active?.postMessage(
        {type: 'SHOW_NOTIFICATION', title: 'Notification from FCM', body: JSON.stringify(data)},
    )
  }

  const showLocalNotification = async () => {
    if (!navigator.serviceWorker) {
      console.warn('Service worker not installed')
      return
    }

    const registration = await navigator.serviceWorker?.ready
    registration.active?.postMessage({type: 'SHOW_LOCAL_NOTIFICATION'})
  }

  const requestPush = async () => {
    if (!navigator.serviceWorker) {
      console.warn('Service worker not installed')
      return
    }

    const registration = await navigator.serviceWorker?.ready
    registration.active?.postMessage({type: 'REQUEST_PUSH'})
  }

  return (
      <div className={s.wrapper}>
        <div className={s.buttons}>
          {showRequestButton && <button className={'button'} onClick={requestToken}>
              Subscribe to notifications
          </button>}
          {permissionGranted && <button className={'button'} onClick={showLocalNotification}>
              Show local notification
          </button>}
          {permissionGranted && <button className={'button'} onClick={requestPush}>
              Request push from server
          </button>}
        </div>

        <div className={s.tabContainer}>
          <div className={s.tabSelect}>
            <button className={`${s.tabButton} ${tab === 'status' && s.selected}`}
                    onClick={() => setTab('status')}>
              Status
            </button>
            <button className={`${s.tabButton} ${tab === 'log' && s.selected}`} onClick={() => setTab('log')}>Log
            </button>
          </div>
          <div className={`${s.tabContent} ${tab !== 'status' ? s.hidden : ''}`}><StatusView token={fcmToken}/></div>
          <div className={`${s.tabContent} ${tab !== 'log' ? s.hidden : ''}`}><LogView/></div>
        </div>

        <div className={s.build}>Build: {import.meta.env.VITE_BUILD}</div>
      </div>
  )
}

export default App
