import React from 'react'
import './styles.css'

export const metadata = {
  description: 'Kitchen utensils frontend powered by Payload CMS and Next.js SSR.',
  title: 'Kitchen Utensils',
}

export default function RootLayout(props: { children: any }) {
  const { children } = props

  return (
    <html lang="en">
      <body>
        <main>{children}</main>
      </body>
    </html>
  )
}
