# Rockstar PWA + FCM Showcase

This is a simple proof of concept that demonstrates the capabilities of Push Notifications in progressive web applications.

## 💥 Features

✨ Installable on mobile and desktop devices. Mobile Safari 16.4+ compatible. \
✨ Utilizes the power of the Push API to enable push notifications. \
✨ Leveraging the Notification API to display user-friendly notifications. \
✨ Demonstrates the usage of the Badge API for adding badges to the app (mobile only). \
✨ Written in TypeScript. Powered by ViteJS. Uses React for rendering. \
✨ Utilizes GitHub Actions for building and deployment.

## 🎬 Demo

[Try it on you device](https://arusak.github.io/rockstar-pwa-push/). Don't forget to install the PWA! 

## 🚀 How to build it

Follow the instructions below to get the project up and running on your local machine.

### Installation

```bash
git clone https://github.com/arusak/rockstar-pwa-push.git
cd rockstar-pwa-push
npm install
```

To enable push subscription, you must set a few environment variables.
```
VITE_VAPID_KEY=<open key that is used by your push server>
VITE_PUSH_URL=https://example.org/request-push
```
When running locally, put them into .env.local file. When deploying, well, read you CD docs.

You might use my tiny push server (see the config in deploy.yml), though I recommend you to make your own.

### Start development server

To use HTTP/2 with TLS on development server, you need an SSL certificate for `localhost`. 
The [simplest way](https://letsencrypt.org/docs/certificates-for-localhost/) is to create a non-signed certificate and add it into trusted list.
Run the following script: 
```bash
mkdir ~/.openssl
openssl req -x509 -out localhost.crt -keyout localhost.key \
  -newkey rsa:2048 -nodes -sha256 \
  -subj '/CN=localhost' -extensions EXT -config <( \
   printf "[dn]\nCN=localhost\n[req]\ndistinguished_name = dn\n[EXT]\nsubjectAltName=DNS:localhost\nkeyUsage=digitalSignature\nextendedKeyUsage=serverAuth")
```
Then add `localhost.crt` to the list of trusted certificates of you OS.

You'll need to add paths to generated keys to your environment when running dev server. Add the following lines to your `.env.local` config:
```
SSL_PRIVATE_KEY_PATH=~/.openssl/localhost.key
SSL_PUBLIC_KEY_PATH=~/.openssl/localhost.crt 
```

To start the development server using good old HTTP 1.1 without TLS, forget about certs and just use the following command:

```bash
npm run dev
```

Then open http://localhost:3000/ in your browser.

### Building

To build the project for deployment, use the following command:

```bash
npm run build
```

The production-ready files will be generated in the `build` directory.

## 📱 iOS Compatibility

The project is fully compatible with iOS Safari, ensuring that the Push API, Notification API, and Badge API work seamlessly on iOS devices.

## MacOS won't show notifications by default

By default, MacOS has notifications disabled for your browser. Go to Settings > Notifications, find your browser,
allow notifications with options "Show in Notification Center" and "Badge Notification Icon".

## 🙌 Contributing

We welcome suggestions and bug reports from the developer community to improve the Awesome PWA Project. If you have any ideas or encounter any issues, please open an issue in the GitHub repository.

## 📄 License

This project is licensed under the [MIT License](LICENSE).

Happy hacking! 😄
