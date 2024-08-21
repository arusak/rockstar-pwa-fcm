import React, {FC, useEffect, useState} from 'react'

import s from './StatusView.module.css'
import {Check} from 'components/Check/Check'
import {firebaseConfig, firebaseVapidKey} from '../../fcmConfig'

type Props = { token: string }

const permissionStatus: Record<NotificationPermission, string> = {
  default: 'haven\'t requested a permission',
  denied: 'permission denied',
  granted: 'permission granted',
}

export const StatusView: FC<Props> = ({token}) => {
  const [swReady, setSwReady] = useState(false)

  useEffect(() => {
    navigator.serviceWorker.ready.then(() => setSwReady(true))
  }, [])

  return (
      <div className={s.wrapper}>
        <div><Check checked={'Notification' in window}/> Notification API</div>
        <div><Check checked={'PushManager' in window}/> Push API</div>
        <div><Check checked={'setAppBadge' in window.navigator}/> Badging API</div>
        <hr/>
        <div>Service worker: {swReady ? 'ready' : 'not ready'}</div>
        <div>Notifications: {window.Notification ? permissionStatus[window.Notification.permission] : 'not supported'}</div>
        <div>Push subscription: {token ? 'created' : 'not created'}</div>
        {token && <div>Token: {token}</div>}
        <hr/>
        <div style={{fontWeight: 'bold'}}>Firebase settings:</div>
        <div style={{whiteSpace: 'pre'}}>
          {Object.entries(firebaseConfig).map(([key, value])=>`${key}: ${value}\n`)}
        </div>
        <div style={{fontWeight: 'bold'}}>VAPID key:</div>
        <div>{firebaseVapidKey}</div>
      </div>
  )
}
