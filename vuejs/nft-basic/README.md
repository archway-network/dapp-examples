# archway-increment-dapp-vuejs

## Project setup
```
npm install
cp env.example .env
# Now configure .env with your Infura account and contract address
```

## Configuring project on Infura.io

After creating a project on infura.io, navigate to the security tab of the project. Set your IP whitelist settings for `localhost`, and add you [User Agent](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/User-Agent) string. You can determine your user agent string by opening dev tools of your browser, and typing `navigator.userAgent` into the JavaScript console.


### Compiles and hot-reloads for development
```
npm run serve
```

### Compiles and minifies for production
```
npm run build
```

### Lints and fixes files
```
npm run lint
```

### Customize configuration
See [Configuration Reference](https://cli.vuejs.org/config/).
